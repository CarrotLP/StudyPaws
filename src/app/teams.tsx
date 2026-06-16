import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  RibbonColors,
  ShadowOffset,
} from '@/constants/havenTheme';
import { Mochi } from '@/components/mochi';
import { useAuth } from '@/hooks/use-auth';
import { QK } from '@/hooks/queries';
import { createTeam, getTeamByTeamCode } from '@/services/team.services';
import {
  addUserToTeam,
  getTeamsForUser,
  getUsersForTeam,
  removeUserFromTeam,
  type UserTeam,
} from '@/services/userTeam.services';
import {
  getThemeForWeek,
  submitTeamQuestSuggestion,
} from '@/services/weeklyTheme.services';


const LEADERBOARD_CUP_SIZE = 18;
const LEADERBOARD_CUP_COLORS = [HavenColors.gold, '#C9CDD3', '#B87333'] as const;
const QUEST_SUGGESTION_PREFIX = 'Take a picture of';
const SUGGESTION_SUCCESS_TOAST_MS = 3000;

// Max characters of a member's name shown under their mini cat before truncating.
const MAX_NAME_CHARS = 8;


function getNextWeekStartUtc(): string {
  const today = new Date();
  const utcDay = today.getUTCDay();
  const daysUntilNextMonday = ((8 - utcDay) % 7) || 7;
  const nextMonday = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() + daysUntilNextMonday,
  ));

  return nextMonday.toISOString().slice(0, 10);
}

function formatQuestSuggestion(description: string): string {
  if (description.toLowerCase().startsWith(QUEST_SUGGESTION_PREFIX.toLowerCase())) {
    return description;
  }

  return `${QUEST_SUGGESTION_PREFIX} ${description}`;
}

const STATUS_TAG: Record<string, { label: string; bg: string; text: string }> = {
  'studying':    { label: 'studying', bg: '#2D6A4F', text: '#B7E4C7' },
  'on a break':  { label: 'break',    bg: '#7B5800', text: '#FFE08A' },
  'not studying': { label: 'offline', bg: '#3A3A3A', text: '#AAAAAA' },
};

function StatusTag({ status }: { status: string }) {
  const tag = STATUS_TAG[status] ?? STATUS_TAG['not studying'];
  return (
    <View style={[styles.statusTag, { backgroundColor: tag.bg }]}>
      <Text style={[styles.statusTagText, { color: tag.text }]}>{tag.label}</Text>
    </View>
  );
}

export default function TeamsScreen() {
  const params = useLocalSearchParams<{ suggest?: string | string[] }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [questSuggestion, setQuestSuggestion] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [suggestionSuccessToastVisible, setSuggestionSuccessToastVisible] = useState(false);
  const suggestionToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledSuggestionParamRef = useRef<string | null>(null);
  const nextWeekStart = getNextWeekStartUtc();
  const suggestParam = Array.isArray(params.suggest) ? params.suggest[0] : params.suggest;

  const { data: teams = [], isLoading: loading } = useQuery({
    queryKey: QK.teams(user?.id ?? ''),
    queryFn: () => getTeamsForUser(user!.id),
    enabled: !!user?.id,
  });

  const currentTeam = teams[0] ?? null;
  const hasTeam = Boolean(currentTeam);

  const { data: teamMembers = [] } = useQuery({
    queryKey: QK.teamMembers(currentTeam?.teamId ?? ''),
    queryFn: () => getUsersForTeam(currentTeam!.teamId),
    enabled: !!currentTeam?.teamId,
  });

  const { data: nextWeekTheme = null, isLoading: themeLoading } = useQuery({
    queryKey: QK.weeklyTheme(nextWeekStart),
    queryFn: () => getThemeForWeek(`${nextWeekStart}T12:00:00.000Z`),
    enabled: true,
  });

  const invalidateTeams = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: QK.teams(user.id) });
    const updated = queryClient.getQueryData<UserTeam[]>(QK.teams(user.id));
    if (updated?.[0]) {
      await queryClient.invalidateQueries({ queryKey: QK.teamMembers(updated[0].teamId) });
    }
  }, [user, queryClient]);

  // Refetch the member list (and thus their live activity-status tags) every
  // time this page is focused, so the statuses are never shown stale.
  useFocusEffect(
    useCallback(() => {
      if (currentTeam?.teamId) {
        void queryClient.invalidateQueries({ queryKey: QK.teamMembers(currentTeam.teamId) });
      }
    }, [currentTeam?.teamId, queryClient]),
  );

  const renderLeaderboardCup = (rankIndex: number) => {
    const cupColor = LEADERBOARD_CUP_COLORS[rankIndex];

    return (
      <View style={styles.leaderboardCupSlot}>
        {cupColor ? (
          <>
            <MaterialCommunityIcons
              name="trophy"
              size={LEADERBOARD_CUP_SIZE + 4}
              color={HavenColors.ink}
              style={styles.leaderboardCupOutline}
            />
            <MaterialCommunityIcons
              name="trophy"
              size={LEADERBOARD_CUP_SIZE}
              color={cupColor}
              style={styles.leaderboardCup}
            />
          </>
        ) : null}
      </View>
    );
  };

  const clearSuggestionToastTimer = useCallback(() => {
    if (suggestionToastTimerRef.current) {
      clearTimeout(suggestionToastTimerRef.current);
      suggestionToastTimerRef.current = null;
    }
  }, []);

  const closeSuggestionModal = useCallback(() => {
    setSuggestionModalVisible(false);
    setSuggestionMessage(null);
  }, []);

  const openSuggestionModal = useCallback(() => {
    clearSuggestionToastTimer();
    setSuggestionSuccessToastVisible(false);
    setSuggestionMessage(null);
    setSuggestionModalVisible(true);
  }, [clearSuggestionToastTimer]);

  useEffect(() => clearSuggestionToastTimer, [clearSuggestionToastTimer]);

  useEffect(() => {
    if (!suggestParam || !currentTeam || !nextWeekTheme) return;
    if (handledSuggestionParamRef.current === suggestParam) return;

    handledSuggestionParamRef.current = suggestParam;
    openSuggestionModal();
  }, [currentTeam, nextWeekTheme, openSuggestionModal, suggestParam]);


  const joinTeam = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to join a team.');
      return;
    }

    if (!teamCode.trim()) {
      setError('Please enter a team code.');
      return;
    }

    if (hasTeam) {
      setError('You are already in a team.');
      setJoining(false);
      return;
    }


    setError(null);
    try {
      const teamUid = await getTeamByTeamCode(teamCode.trim());
      if (!teamUid) {
        throw new Error('Team not found.');
      }

      await addUserToTeam(user.id, teamUid);
      await invalidateTeams();
      setJoining(false);
      setTeamCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team.');
    }
  }, [hasTeam, user, teamCode]);

  const submitTeam = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to create a team.');
      return;
    }

    if (!newTeamName.trim()) {
      setError('Please enter a team name.');
      return;
    }

    if (hasTeam) {
      setError('You are already in a team.');
      setCreating(false);
      return;
    }


    setError(null);
    try {
      const teamUid = await createTeam(newTeamName.trim());
      await addUserToTeam(user.id, teamUid);
      await invalidateTeams();
      setCreating(false);
      setNewTeamName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
    }
  }, [hasTeam, user, newTeamName]);

  const leaveTeam = useCallback(async () => {
    if (!user || !currentTeam || leaving) return;

    setLeaving(true);

    setError(null);
    try {
      await removeUserFromTeam(user.id, currentTeam.teamId);
      await invalidateTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team.');
    } finally {
      setLeaving(false);
    }
  }, [currentTeam, leaving, user]);

  const confirmLeaveTeam = useCallback(() => {
    Alert.alert(
      'Leave team?',
      "You will no longer see this team's daily quest gallery or members.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave team',
          style: 'destructive',
          onPress: () => void leaveTeam(),
        },
      ],
    );
  }, [leaveTeam]);

  const submitSuggestion = useCallback(async () => {
    if (!currentTeam || !nextWeekTheme) return;

    const description = questSuggestion.trim();
    if (!description) {
      setSuggestionMessage('Please enter a quest suggestion.');
      return;
    }

    setSubmittingSuggestion(true);
    setSuggestionMessage(null);
    try {
      await submitTeamQuestSuggestion(
        currentTeam.teamId,
        nextWeekStart,
        formatQuestSuggestion(description),
      );
      setQuestSuggestion('');
      setSuggestionMessage(null);
      setSuggestionModalVisible(false);
      setSuggestionSuccessToastVisible(true);
      clearSuggestionToastTimer();
      suggestionToastTimerRef.current = setTimeout(() => {
        setSuggestionSuccessToastVisible(false);
        suggestionToastTimerRef.current = null;
      }, SUGGESTION_SUCCESS_TOAST_MS);
    } catch (err) {
      setSuggestionMessage(err instanceof Error ? err.message : 'Could not submit suggestion.');
    } finally {
      setSubmittingSuggestion(false);
    }
  }, [clearSuggestionToastTimer, currentTeam, nextWeekStart, nextWeekTheme, questSuggestion]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Team</Text>
        <View style={styles.rule} />

        <View style={styles.teamList}>
          {loading && teams.length === 0 ? <Text style={styles.message}>Loading teams...</Text> : null}
          {error ? <Text style={styles.message}>{error}</Text> : null}
          {!loading && !error && teams.length === 0 ? (
            <Text style={styles.message}>You are not in any teams yet.</Text>
          ) : null}

          {currentTeam ? (
            <View style={styles.teamCard}>
              <Text style={styles.teamName}>{currentTeam.teamName}</Text>
            </View>
          ) : null}
        </View>

        {currentTeam ? (
          <View style={styles.teamDetails}>
            <View style={styles.detailBlock}>
              <View style={styles.teamCodeRow}>
                <Text style={styles.detailLabel}>team code:</Text>
                <Text style={styles.detailValue}>{currentTeam.teamCode}</Text>
              </View>
            </View>

            {/* Mini cats of every team member, squeezed together. */}
            <View style={styles.miniCatsRow}>
              {teamMembers.map((member) =>
                member.character ? (
                  <View key={member.userId} style={styles.miniCat}>
                    <Mochi characterName={member.character} userId={member.userId} scale={0.5} />
                    <Text style={styles.miniCatName} numberOfLines={1}>
                      {member.userName.length > MAX_NAME_CHARS
                        ? `${member.userName.slice(0, MAX_NAME_CHARS)}...`
                        : member.userName}
                    </Text>
                  </View>
                ) : null,
              )}
            </View>

            <View style={styles.detailBlock}>
              <View style={styles.leaderboardTable}>
                <View style={[styles.leaderboardRow, styles.leaderboardHeaderRow]}>
                  <View style={styles.memberNameColumn}>
                    <View style={styles.leaderboardCupSlot} />
                    <Text style={styles.leaderboardHeaderText}>team members</Text>
                  </View>
                  <Text style={[styles.leaderboardHeaderText, styles.winsColumn]}>
                    number of wins
                  </Text>
                </View>
                {teamMembers.map((member, index) => (
                  <View key={member.userId} style={styles.leaderboardRow}>
                    <View style={styles.memberNameColumn}>
                      {renderLeaderboardCup(index)}
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.userName}
                      </Text>
                      <StatusTag status={member.activityStatus} />
                    </View>
                    <Text style={[styles.memberWins, styles.winsColumn]}>
                      {member.winsCount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionLabel}>Next week's theme will be:</Text>
              <Text style={styles.themeText}>
                {themeLoading
                  ? 'Loading...'
                  : nextWeekTheme ?? "Next week's theme is not available yet"}
              </Text>

              {nextWeekTheme ? (
                <>
                  <Text style={styles.suggestionHelpText}>
                    Suggest a photo quest for your team that fits the theme.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openSuggestionModal}
                    style={({ pressed }) => [
                      styles.submitSuggestionButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text style={styles.submitSuggestionButtonText}>Make a quest suggestion</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        {!hasTeam && (
          <>
            {joining ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.label}>Team code</Text>
                <TextInput
                  value={teamCode}
                  onChangeText={setTeamCode}
                  placeholder="Team code"
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading || !teamCode.trim()}
                  onPress={() => void joinTeam()}
                  style={({ pressed }) => [
                    styles.joinButton,
                    pressed && styles.buttonPressed,
                    (loading || !teamCode.trim()) && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.joinButtonText}>Join team</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setJoining(true)}
                style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}>
                <Text style={styles.joinButtonText}>Join team</Text>
              </Pressable>
            )}

            {creating ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.label}>Team name</Text>
                <TextInput
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="e.g. Study Buddies"
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading || !newTeamName.trim()}
                  onPress={() => void submitTeam()}
                  style={({ pressed }) => [
                    styles.joinButton,
                    pressed && styles.buttonPressed,
                    (loading || !newTeamName.trim()) && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.joinButtonText}>Create team</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreating(true)}
                style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}>
                <Text style={styles.joinButtonText}>Create team</Text>
              </Pressable>
            )}
          </>
        )}

        {currentTeam ? (
          <Pressable
            accessibilityRole="button"
            disabled={leaving || loading}
            onPress={confirmLeaveTeam}
            style={({ pressed }) => [
              styles.leaveButton,
              pressed && !(leaving || loading) && styles.buttonPressed,
              (leaving || loading) && styles.buttonDisabled,
            ]}>
            <Text style={styles.leaveButtonText}>{leaving ? 'Leaving...' : 'Leave team'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={suggestionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSuggestionModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalScrim}>
          <View style={styles.modalWrapper}>
            <Pressable
              accessibilityLabel="Close quest suggestion"
              hitSlop={HavenSpacing.md}
              onPress={closeSuggestionModal}
              style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>X</Text>
            </Pressable>

            <View style={styles.suggestionModalCard}>
              <ScrollView
                contentContainerStyle={styles.suggestionModalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.suggestionLabel}>Next week's theme will be:</Text>
                <Text style={styles.themeText}>
                  {themeLoading
                    ? 'Loading...'
                    : nextWeekTheme ?? "Next week's theme is not available yet"}
                </Text>

                <Text style={styles.suggestionLabel}>Make a quest suggestion:</Text>
                <Text style={styles.suggestionPrefixText}>Take a picture of...</Text>
                <TextInput
                  value={questSuggestion}
                  onChangeText={(text) => {
                    setQuestSuggestion(text);
                    setSuggestionMessage(null);
                  }}
                  placeholder="... write your quest idea"
                  multiline
                  style={[styles.input, styles.suggestionInput]}
                />
                {__DEV__ && (
                  <Pressable
                    onPress={() => setQuestSuggestion('Take a photo of our next hang out spot')}
                    style={styles.devBtn}
                    accessibilityLabel="dev: fill suggestion">
                    <Text style={styles.devGlyph}>✎</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={submittingSuggestion || !questSuggestion.trim()}
                  onPress={() => void submitSuggestion()}
                  style={({ pressed }) => [
                    styles.submitSuggestionButton,
                    pressed && !submittingSuggestion && styles.buttonPressed,
                    (submittingSuggestion || !questSuggestion.trim()) && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.submitSuggestionButtonText}>
                    {submittingSuggestion ? 'Submitting...' : 'Submit'}
                  </Text>
                </Pressable>

                {suggestionMessage ? (
                  <Text style={styles.suggestionMessage}>{suggestionMessage}</Text>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {suggestionSuccessToastVisible ? (
        <View pointerEvents="none" style={styles.suggestionSuccessToastWrap}>
          <View style={styles.suggestionSuccessToast}>
            <Text style={styles.suggestionSuccessToastText}>Quest suggestion submitted</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
    paddingBottom: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
    gap: HavenSpacing.lg,
  },
  section: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },
  teamList: {
    gap: HavenSpacing.md,
  },
  teamCard: {
    width: '100%',
    minHeight: 72,
    justifyContent: 'center',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  teamName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  teamDetails: {
    width: '100%',
    gap: HavenSpacing.lg,
  },
  miniCatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: HavenSpacing.md,
  },
  miniCat: {
    // Negative margin overlaps the cats so they look like they're standing
    // shoulder-to-shoulder rather than spaced apart.
    marginHorizontal: -12,
    alignItems: 'center',
  },
  miniCatName: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.ink,
    textAlign: 'center',
    maxWidth: 70,
  },
  detailBlock: {
    width: '100%',
    alignItems: 'flex-start',
    gap: HavenSpacing.sm,
  },
  teamCodeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: HavenSpacing.sm,
  },
  detailLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  detailValue: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  memberNameColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.sm,
  },
  leaderboardCupSlot: {
    width: LEADERBOARD_CUP_SIZE + 6,
    height: LEADERBOARD_CUP_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leaderboardCupOutline: {
    position: 'absolute',
  },
  leaderboardCup: {
    position: 'absolute',
  },
  memberName: {
    flex: 1,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  statusTag: {
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: HavenSpacing.xs,
    flexShrink: 0,
  },
  statusTagText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xs,
  },
  memberWins: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'right',
  },
  leaderboardTable: {
    width: '100%',
    gap: HavenSpacing.sm,
  },
  leaderboardRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.md,
  },
  leaderboardHeaderRow: {
    paddingBottom: HavenSpacing.xs,
    borderBottomWidth: Border.base,
    borderBottomColor: HavenColors.inkSoft,
  },
  leaderboardHeaderText: {
    flex: 1,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  suggestionBox: {
    width: '100%',
    gap: HavenSpacing.md,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  modalScrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.overlayScrim,
  },
  modalWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -14,
    right: -10,
    zIndex: 1,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  modalCloseText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
  },
  suggestionModalCard: {
    maxHeight: '100%',
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.frame,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  suggestionModalContent: {
    gap: HavenSpacing.md,
    padding: HavenSpacing.xl,
  },
  suggestionLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  suggestionPrefixText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: RibbonColors.calendar,
    textAlign: 'left',
  },
  suggestionHelpText: {
    fontFamily: HavenFonts.body,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'left',
  },
  themeText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  suggestionInput: {
    minHeight: 96,
    marginTop: 0,
    textAlignVertical: 'top',
  },
  submitSuggestionButton: {
    alignSelf: 'flex-end',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  submitSuggestionButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  suggestionMessage: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
    textAlign: 'left',
  },
  suggestionSuccessToastWrap: {
    position: 'absolute',
    left: HavenSpacing.xxl,
    right: HavenSpacing.xxl,
    bottom: HavenSpacing.xxl,
    alignItems: 'center',
    zIndex: 250,
  },
  suggestionSuccessToast: {
    maxWidth: 360,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.frame,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
  },
  suggestionSuccessToastText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.leather,
    textAlign: 'center',
  },
  winsColumn: {
    width: 120,
    flex: 0,
    textAlign: 'right',
  },
  message: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  joinButton: {
    alignSelf: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    marginTop: HavenSpacing.md,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  joinButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  leaveButton: {
    alignSelf: 'flex-end',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    marginTop: HavenSpacing.xl,
    marginBottom: HavenSpacing.xxl * 2,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  leaveButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  input: {
    minHeight: 48,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    color: HavenColors.ink,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    paddingHorizontal: HavenSpacing.lg,
    paddingVertical: HavenSpacing.md,
    marginTop: HavenSpacing.sm,
  },
  label: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    marginTop: HavenSpacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  devBtn: {
    position: 'absolute',
    top: 140,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    opacity: 0.65,
    zIndex: 250,
  },
  devGlyph: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
});
