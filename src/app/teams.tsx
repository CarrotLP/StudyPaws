import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { createTeam, getTeamByTeamCode } from '@/services/team.services';
import { addUserToTeam, getTeamsForUser, type UserTeam } from '@/services/userTeam.services';

export default function TeamsScreen() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      setJoining(false);
      setCreating(false);
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

  const joinTeam = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to join a team.');
      return;
    }

    if (!teamCode.trim()) {
      setError('Please enter a team code.');
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
      setTeams(nextTeams);
      setJoining(false);
      setTeamCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team.');
    } finally {
      setLoading(false);
    }
  }, [user, teamCode]);

  const submitTeam = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to create a team.');
      return;
    }

    if (!newTeamName.trim()) {
      setError('Please enter a team name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const teamUid = await createTeam(newTeamName.trim());
      await addUserToTeam(user.id, teamUid);
      const nextTeams = await getTeamsForUser(user.id);
      setTeams(nextTeams);
      setCreating(false);
      setNewTeamName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  }, [user, newTeamName]);

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
