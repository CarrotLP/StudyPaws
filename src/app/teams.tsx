import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { useAuth } from '@/hooks/use-auth';
import { getTeamsForUser, type UserTeam } from '@/services/userTeam.services';

export default function TeamsScreen() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTeams = async () => {
        if (!user) {
          setTeams([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const nextTeams = await getTeamsForUser(user.id);
          if (!active) return;
          setTeams(nextTeams);
        } catch (loadError) {
          if (!active) return;
          setTeams([]);
          setError(loadError instanceof Error ? loadError.message : 'Could not load teams.');
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      void loadTeams();

      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Teams</Text>
        <View style={styles.rule} />

        <View style={styles.teamList}>
          {loading ? <Text style={styles.message}>Loading teams...</Text> : null}
          {error ? <Text style={styles.message}>{error}</Text> : null}
          {!loading && !error && teams.length === 0 ? (
            <Text style={styles.message}>You are not in any teams yet.</Text>
          ) : null}

          {teams.map((team) => (
            <Pressable
              key={team.teamId}
              accessibilityRole="button"
              onPress={() => {}}
              style={({ pressed }) => [styles.teamButton, pressed && styles.buttonPressed]}>
              <Text style={styles.teamName}>{team.teamName}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {}}
          style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}>
          <Text style={styles.joinButtonText}>Join team</Text>
        </Pressable>
      </ScrollView>
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
  teamButton: {
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
  buttonPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
});
