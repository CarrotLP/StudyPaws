import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { useUser } from '@/hooks/use-user';
import { MOCHI_PERSONALITIES, type MochiPersonality } from '@/services/mochiQuotes.services';
import {
  getQuestDeadlines,
  saveQuestDeadlines,
  type QuestDeadlines,
} from '@/services/questSettings.services';
import { updateUserCharacter, updateUserPersonality } from '@/services/user.services';
import { getPetPreviews, type PetPreview } from '@/services/petPreview.services';
import {
  getTeamsForUser,
  type UserTeam,
} from '@/services/userTeam.services';

const STEP_MINUTES = 30;

// Settings chapter — replaces Buddies in the ribbon. Intentionally empty for now;
// content TBD. (The buddies screen/file is kept, just no longer surfaced.)
export default function SettingsScreen() {
  const { signOut } = useAuth();
  const {
    deadlines: providerDeadlines,
    team: providerTeam,
    updateDeadlines,
  } = useDailyQuest();

  const { user } = useAuth();
  const { personality: loadedPersonality, character: loadedCharacter } = useUser();

  // Personality picker — initialised from the user's saved value. Falls back to
  // the default if it's unset or a value no longer offered, so a chip is always
  // shown selected.
  const [personality, setPersonality] = useState<MochiPersonality>('philosophical');
  useEffect(() => {
    if (loadedPersonality && (MOCHI_PERSONALITIES as readonly string[]).includes(loadedPersonality)) {
      setPersonality(loadedPersonality);
    } else {
      setPersonality('philosophical');
    }
  }, [loadedPersonality]);

  const onPickPersonality = async (next: MochiPersonality) => {
    if (!user) return;
    const prev = personality;
    setPersonality(next); // optimistic
    setSettingsError(null);
    try {
      const name = (user.user_metadata?.name as string) ?? '';
      await updateUserPersonality(user.id, next, name);
    } catch (err) {
      setPersonality(prev); // revert on failure
      setSettingsError(err instanceof Error ? err.message : 'Failed to update personality');
    }
  };

  // ── Cat-colour (character) picker ──
  const [petOptions, setPetOptions] = useState<PetPreview[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [catCarouselWidth, setCatCarouselWidth] = useState(0);
  const catScrollRef = useRef<ScrollView | null>(null);
  const didInitialCatScroll = useRef(false);

  useEffect(() => {
    let mounted = true;
    getPetPreviews()
      .then((options) => mounted && setPetOptions(options))
      .catch(() => mounted && setPetOptions([]))
      .finally(() => mounted && setLoadingPets(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Initialise selection from the saved character.
  useEffect(() => {
    if (loadedCharacter) setSelectedCharacter(loadedCharacter);
  }, [loadedCharacter]);

  // Scroll the carousel to the current cat once (when width + options + selection ready).
  useEffect(() => {
    if (didInitialCatScroll.current || catCarouselWidth === 0 || petOptions.length === 0) return;
    const index = petOptions.findIndex((o) => o.name === selectedCharacter);
    if (index >= 0) {
      catScrollRef.current?.scrollTo({ x: index * catCarouselWidth, animated: false });
      didInitialCatScroll.current = true;
    }
  }, [catCarouselWidth, petOptions, selectedCharacter]);

  const onPickCharacter = async (next: string) => {
    if (!user || next === selectedCharacter) return;
    const prev = selectedCharacter;
    setSelectedCharacter(next); // optimistic
    setSettingsError(null);
    try {
      const name = (user.user_metadata?.name as string) ?? '';
      await updateUserCharacter(user.id, next, name);
    } catch (err) {
      setSelectedCharacter(prev); // revert on failure
      setSettingsError(err instanceof Error ? err.message : 'Failed to update cat');
    }
  };

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
      if (providerTeam?.teamId === selectedTeamId) {
        await updateDeadlines(nextDeadlines);
      } else {
        await saveQuestDeadlines(selectedTeamId, nextDeadlines);
      }
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
        {/* Cat personality */}
        <View style={styles.deadlineCard}>
          <Text style={styles.deadlineLabel}>Cat personality</Text>
          <View style={styles.personalityRow}>
            {MOCHI_PERSONALITIES.map((p) => {
              const selected = p === personality;
              return (
                <Pressable
                  key={p}
                  onPress={() => onPickPersonality(p)}
                  style={[styles.personalityChip, selected && styles.personalityChipSelected]}>
                  <Text
                    style={[
                      styles.personalityChipText,
                      selected && styles.personalityChipTextSelected,
                    ]}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {settingsError ? <Text style={styles.message}>{settingsError}</Text> : null}
        </View>

        {/* Cat colour picker — swipe to change your cat; saves on selection. */}
        <View style={styles.deadlineCard}>
          <Text style={styles.deadlineLabel}>Cat colour</Text>
          {loadingPets ? (
            <ActivityIndicator color={HavenColors.leather} />
          ) : petOptions.length === 0 ? (
            <Text style={styles.message}>No cats available right now.</Text>
          ) : (
            <View style={styles.catCarousel}>
              <ScrollView
                ref={catScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onLayout={(e) => setCatCarouselWidth(e.nativeEvent.layout.width)}
                onMomentumScrollEnd={(e) => {
                  if (catCarouselWidth === 0) return;
                  const index = Math.round(e.nativeEvent.contentOffset.x / catCarouselWidth);
                  const option = petOptions[index];
                  if (option) void onPickCharacter(option.name);
                }}>
                {petOptions.map((option) => (
                  <View key={option.name} style={[styles.catPage, { width: catCarouselWidth }]}>
                    <Image source={{ uri: option.imageUrl }} style={styles.catImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.catDots}>
                {petOptions.map((option) => (
                  <View
                    key={option.name}
                    style={[styles.catDot, option.name === selectedCharacter && styles.catDotActive]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

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
  catCarousel: {
    width: '100%',
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  catPage: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HavenSpacing.lg,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: HavenSpacing.sm,
    paddingVertical: HavenSpacing.md,
  },
  catDot: {
    width: 8,
    height: 8,
    backgroundColor: HavenColors.inkSoft,
    opacity: 0.4,
  },
  catDotActive: {
    backgroundColor: HavenColors.gold,
    opacity: 1,
  },
  personalityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: HavenSpacing.sm,
  },
  personalityChip: {
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.md,
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  personalityChipSelected: {
    backgroundColor: HavenColors.wornCell,
    borderColor: HavenColors.gold,
  },
  personalityChipText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.base,
    color: HavenColors.inkSoft,
  },
  personalityChipTextSelected: {
    color: HavenColors.ink,
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
