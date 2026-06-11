import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { Mochi } from '@/components/mochi';
import { useAuth } from '@/hooks/use-auth';
import { createTeam, getTeamByTeamCode } from '@/services/team.services';
import {
  addUserToTeam,
  getTeamsForUser,
  getUsersForTeam,
  removeUserFromTeam,
  type TeamUser,
  type UserTeam,
} from '@/services/userTeam.services';
import {
  getThemeForWeek,
  submitTeamQuestSuggestion,
} from '@/services/weeklyTheme.services';


const LEADERBOARD_CUP_SIZE = 18;
const LEADERBOARD_CUP_COLORS = [HavenColors.gold, '#C9CDD3', '#B87333'] as const;

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

export default function TeamsScreen() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [nextWeekTheme, setNextWeekTheme] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  const [questSuggestion, setQuestSuggestion] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const currentTeam = teams[0] ?? null;
  const hasTeam = Boolean(currentTeam);
  const nextWeekStart = getNextWeekStartUtc();

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

  useFocusEffect(
    useCallback(() => {
      setJoining(false);
      setCreating(false);
      let active = true;

      const loadTeams = async () => {
        if (!user) {
          setTeams([]);
          setTeamMembers([]);
          setNextWeekTheme(null);
          setThemeLoading(false);
          setLoading(false);
          return;
        }

        setLoading(true);
        setThemeLoading(true);
        setError(null);
        setSuggestionMessage(null);

        try {
          const [nextTeams, nextThemeResult] = await Promise.all([
            getTeamsForUser(user.id),
            getThemeForWeek(`${nextWeekStart}T12:00:00.000Z`),
          ]);
          const nextTeamMembers = nextTeams[0] ? await getUsersForTeam(nextTeams[0].teamId) : [];
          if (!active) return;
          setTeams(nextTeams);
          setTeamMembers(nextTeamMembers);
          setNextWeekTheme(nextThemeResult ?? null);
        } catch (loadError) {
          if (!active) return;
          setTeams([]);
          setTeamMembers([]);
          setNextWeekTheme(null);
          setError(loadError instanceof Error ? loadError.message : 'Could not load teams.');
        } finally {
          if (active) {
            setLoading(false);
            setThemeLoading(false);
          }
        }
      };

      void loadTeams();

      return () => {
        active = false;
      };
    }, [nextWeekStart, user]),
  );

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

    setLoading(true);
    setError(null);
    try {
      const teamUid = await getTeamByTeamCode(teamCode.trim());
      if (!teamUid) {
        throw new Error('Team not found.');
      }

      await addUserToTeam(user.id, teamUid);
      const nextTeams = await getTeamsForUser(user.id);
      const nextTeamMembers = nextTeams[0] ? await getUsersForTeam(nextTeams[0].teamId) : [];
      setTeams(nextTeams);
      setTeamMembers(nextTeamMembers);
      setJoining(false);
      setTeamCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team.');
    } finally {
      setLoading(false);
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

    setLoading(true);
    setError(null);
    try {
      const teamUid = await createTeam(newTeamName.trim());
      await addUserToTeam(user.id, teamUid);
      const nextTeams = await getTeamsForUser(user.id);
      const nextTeamMembers = nextTeams[0] ? await getUsersForTeam(nextTeams[0].teamId) : [];
      setTeams(nextTeams);
      setTeamMembers(nextTeamMembers);
      setCreating(false);
      setNewTeamName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  }, [hasTeam, user, newTeamName]);

  const leaveTeam = useCallback(async () => {
    if (!user || !currentTeam || leaving) return;

    setLeaving(true);
    setLoading(true);
    setError(null);
    try {
      await removeUserFromTeam(user.id, currentTeam.teamId);
      const nextTeams = await getTeamsForUser(user.id);
      const nextTeamMembers = nextTeams[0] ? await getUsersForTeam(nextTeams[0].teamId) : [];
      setTeams(nextTeams);
      setTeamMembers(nextTeamMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team.');
    } finally {
      setLeaving(false);
      setLoading(false);
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
      await submitTeamQuestSuggestion(currentTeam.teamId, nextWeekStart, description);
      setQuestSuggestion('');
      setSuggestionMessage('Quest suggestion submitted.');
    } catch (err) {
      setSuggestionMessage(err instanceof Error ? err.message : 'Could not submit suggestion.');
    } finally {
      setSubmittingSuggestion(false);
    }
  }, [currentTeam, nextWeekStart, nextWeekTheme, questSuggestion]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAwareScrollView
        bottomOffset={HavenSpacing.xl}
        contentContainerStyle={styles.content}
        extraKeyboardSpace={96}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Team</Text>
        <View style={styles.rule} />

        <View style={styles.teamList}>
          {loading ? <Text style={styles.message}>Loading teams...</Text> : null}
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
              <Text style={styles.detailLabel}>team code:</Text>
              <Text style={styles.detailValue}>{currentTeam.teamCode}</Text>
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
                      <Text style={styles.memberName}>{member.userName}</Text>
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
                  <Text style={styles.suggestionLabel}>Make a quest suggestion:</Text>
                  <TextInput
                    value={questSuggestion}
                    onChangeText={(text) => {
                      setQuestSuggestion(text);
                      setSuggestionMessage(null);
                    }}
                    placeholder="Write your quest idea"
                    multiline
                    style={[styles.input, styles.suggestionInput]}
                  />
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
                </>
              ) : null}

              {suggestionMessage ? (
                <Text style={styles.suggestionMessage}>{suggestionMessage}</Text>
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
      </KeyboardAwareScrollView>
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
  suggestionLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
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
});
