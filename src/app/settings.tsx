import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BodyFontSize,
  Border,
  Control,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { useAuth } from '@/hooks/use-auth';
import { useDailyQuest } from '@/hooks/use-daily-quest';
import {
  getQuestDeadlines,
  saveQuestDeadlines,
  type QuestDeadlines,
} from '@/services/questSettings.services';
import {
  getTeamsForUser,
  type UserTeam,
} from '@/services/userTeam.services';

const STEP_MINUTES = 30;

// Settings chapter — replaces Buddies in the ribbon. Intentionally empty for now;
// content TBD. (The buddies screen/file is kept, just no longer surfaced.)
export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { deadlines: providerDeadlines } = useDailyQuest();

  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [localDeadlines, setLocalDeadlines] = useState<QuestDeadlines | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Load teams on mount / user change
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        if (mounted) {
          setTeams([]);
          setSelectedTeamId(null);
          setLocalDeadlines(null);
          setLoadingTeams(false);
        }
        return;
      }

      setLoadingTeams(true);
      try {
        const nextTeams = await getTeamsForUser(user.id);
        if (!mounted) return;
        setTeams(nextTeams);
        const firstId = nextTeams[0]?.teamId ?? null;
        setSelectedTeamId(firstId);
        if (firstId) {
          setLoadingDeadlines(true);
          const d = await getQuestDeadlines(firstId);
          if (!mounted) return;
          setLocalDeadlines(d);
        } else {
          setLocalDeadlines(null);
        }
      } catch (err) {
        if (!mounted) return;
        setSettingsError(err instanceof Error ? err.message : 'Could not load teams');
      } finally {
        if (mounted) setLoadingTeams(false);
        if (mounted) setLoadingDeadlines(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const saveDeadlinesForTeam = async (nextDeadlines: QuestDeadlines) => {
    if (!selectedTeamId) return;
    setLoadingDeadlines(true);
    setSettingsError(null);
    try {
      await saveQuestDeadlines(selectedTeamId, nextDeadlines);
      setLocalDeadlines(nextDeadlines);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save deadlines');
    } finally {
      setLoadingDeadlines(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>settings</Text>
        <View style={styles.rule} />
        {/* Team selector */}
        <View style={styles.deadlineCard}>
          <Text style={styles.deadlineLabel}>Team</Text>
          {loadingTeams ? (
            <Text style={styles.message}>Loading teams...</Text>
          ) : teams.length === 0 ? (
            <Text style={styles.message}>No teams available.</Text>
          ) : (
            <View>
              <Pressable
                onPress={() => setTeamMenuOpen((s) => !s)}
                style={styles.teamSelectorButton}>
                <Text style={styles.teamSelectorText}>
                  {teams.find((t) => t.teamId === selectedTeamId)?.teamName ?? 'Select a team'}
                </Text>
                <Text style={styles.teamSelectorText}>▼</Text>
              </Pressable>
              {teamMenuOpen && (
                <View style={styles.teamDropdown}>
                  {teams.map((t) => (
                    <Pressable
                      key={t.teamId}
                      onPress={async () => {
                        setSelectedTeamId(t.teamId);
                        setTeamMenuOpen(false);
                        setLoadingDeadlines(true);
                        try {
                          const d = await getQuestDeadlines(t.teamId);
                          setLocalDeadlines(d);
                        } catch (err) {
                          setSettingsError(err instanceof Error ? err.message : 'Failed to load deadlines');
                        } finally {
                          setLoadingDeadlines(false);
                        }
                      }}
                      style={styles.teamDropdownItem}>
                      <Text style={styles.teamName}>{t.teamName}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Deadlines for selected team */}
        <DeadlineControl
          label="Quest submission deadline"
          minutes={localDeadlines?.submissionDeadlineMinutes ?? providerDeadlines.submissionDeadlineMinutes}
          minMinutes={0}
          maxMinutes={(localDeadlines?.votingDeadlineMinutes ?? providerDeadlines.votingDeadlineMinutes) - STEP_MINUTES}
          onChange={(minutes) =>
            saveDeadlinesForTeam({
              submissionDeadlineMinutes: minutes,
              votingDeadlineMinutes: localDeadlines?.votingDeadlineMinutes ?? providerDeadlines.votingDeadlineMinutes,
            })
          }
        />
        <DeadlineControl
          label="Voting deadline"
          minutes={localDeadlines?.votingDeadlineMinutes ?? providerDeadlines.votingDeadlineMinutes}
          minMinutes={(localDeadlines?.submissionDeadlineMinutes ?? providerDeadlines.submissionDeadlineMinutes) + STEP_MINUTES}
          maxMinutes={24 * 60}
          onChange={(minutes) =>
            saveDeadlinesForTeam({
              submissionDeadlineMinutes: localDeadlines?.submissionDeadlineMinutes ?? providerDeadlines.submissionDeadlineMinutes,
              votingDeadlineMinutes: minutes,
            })
          }
        />
        <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
          <Text style={styles.logoutButtonText}>logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeadlineControl({
  label,
  minutes,
  minMinutes,
  maxMinutes,
  onChange,
}: {
  label: string;
  minutes: number;
  minMinutes: number;
  maxMinutes: number;
  onChange: (minutes: number) => Promise<void>;
}) {
  const [hour, setHour] = useState(String(Math.floor(minutes / 60)));
  const [minute, setMinute] = useState(String(minutes % 60).padStart(2, '0'));

  useEffect(() => {
    setHour(String(Math.floor(minutes / 60)));
    setMinute(String(minutes % 60).padStart(2, '0'));
  }, [minutes]);

  const save = (nextMinutes: number) => {
    void onChange(Math.max(minMinutes, Math.min(maxMinutes, nextMinutes)));
  };

  const saveInputs = () => {
    const nextHour = Number(hour);
    const nextMinute = Number(minute);
    if (!Number.isInteger(nextHour) || !Number.isInteger(nextMinute) || nextMinute < 0 || nextMinute > 59) {
      setHour(String(Math.floor(minutes / 60)));
      setMinute(String(minutes % 60).padStart(2, '0'));
      return;
    }
    save(nextHour * 60 + nextMinute);
  };

  return (
    <View style={styles.deadlineCard}>
      <Text style={styles.deadlineLabel}>{label}</Text>
      <View style={styles.deadlineRow}>
        <Pressable style={styles.stepButton} onPress={() => save(minutes - STEP_MINUTES)}>
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <View style={styles.timeInputs}>
          <TextInput
            accessibilityLabel={`${label} hour`}
            keyboardType="number-pad"
            value={hour}
            onChangeText={setHour}
            onEndEditing={saveInputs}
            style={styles.timeInput}
            maxLength={2}
          />
          <Text style={styles.colon}>:</Text>
          <TextInput
            accessibilityLabel={`${label} minute`}
            keyboardType="number-pad"
            value={minute}
            onChangeText={setMinute}
            onEndEditing={saveInputs}
            style={styles.timeInput}
            maxLength={2}
          />
        </View>
        <Pressable style={styles.stepButton} onPress={() => save(minutes + STEP_MINUTES)}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
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
  deadlineCard: {
    alignItems: 'center',
    gap: HavenSpacing.md,
    padding: HavenSpacing.lg,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  deadlineLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.lg,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 52,
    paddingVertical: HavenSpacing.sm,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  colon: {
    marginHorizontal: HavenSpacing.xs,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.ink,
  },
  stepButton: {
    width: Control.dialButton,
    height: Control.dialButton,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  stepButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: BodyFontSize.lg,
    color: HavenColors.parchment,
    lineHeight: Control.dialButton,
    includeFontPadding: false,
  },
  logoutButton: {
    alignSelf: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    marginTop: HavenSpacing.md,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  logoutButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  teamSelectorButton: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    marginTop: HavenSpacing.sm,
  },
  teamSelectorText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  teamDropdown: {
    marginTop: HavenSpacing.sm,
    width: '100%',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  teamDropdownItem: {
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
  },
  teamName: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
  },
  message: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.inkSoft,
    textAlign: 'center',
    marginTop: HavenSpacing.sm,
  },
});
