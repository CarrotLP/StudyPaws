import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { createCommunity, getCommunityByCode } from '@/services/community.services';
import {
  addUserToCommunity,
  getCommunitiesForUser,
  getUsersForCommunity,
  removeUserFromCommunity,
  type CommunityUser,
  type UserCommunity,
} from '@/services/userCommunities.services';

import { CommunityView } from '@/components/CommunityView';
import { GalleryView } from '@/components/GalleryView';
import { HallOfFameView } from '@/components/HallOfFameView';
import { getThemeForWeek } from '@/services/weeklyTheme.services';

export default function CommunitiesScreen() {
  const [view, setView] = useState<'community' | 'gallery' | 'hallOfFame'>('community');
  const { user } = useAuth();
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [communityCode, setCommunityCode] = useState('');
  const currentCommunity = communities[0] ?? null;
  const hasCommunity = Boolean(currentCommunity);
  const [theme, setTheme] = useState('');

  useFocusEffect(
    useCallback(() => {
      setJoining(false);
      setCreating(false);
      let active = true;

      const loadCommunities = async () => {
        if (!user) {
          setCommunities([]);
          setCommunityMembers([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const nextCommunities = await getCommunitiesForUser(user.id);
          const nextCommunityMembers = nextCommunities[0] ? await getUsersForCommunity(nextCommunities[0].communityId) : [];
          if (!active) return;
          setCommunities(nextCommunities);
          setCommunityMembers(nextCommunityMembers);
        } catch (loadError) {
          if (!active) return;
          setCommunities([]);
          setCommunityMembers([]);
          setError(loadError instanceof Error ? loadError.message : 'Could not load communities.');
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      void loadCommunities();

      const loadTheme = async () => {
        try {
          const themeResult = await getThemeForWeek(
                    new Date().toISOString()
                  );
          
          if (!active) return;
          setTheme(themeResult ?? '');
        } catch (e) {
          console.log('theme load error', e);
        }
      };

      void loadTheme();

      return () => {
        active = false;
      };
    }, [user]),
  );

  const joinCommunity = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to join a community.');
      return;
    }

    if (!communityCode.trim()) {
      setError('Please enter a community code.');
      return;
    }

    if (hasCommunity) {
      setError('You are already in a community.');
      setJoining(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const communityUid = await getCommunityByCode(communityCode.trim());
      if (!communityUid) {
        throw new Error('Community not found.');
      }

      await addUserToCommunity(user.id, communityUid);
      const nextCommunities = await getCommunitiesForUser(user.id);
      const nextCommunityMembers = nextCommunities[0] ? await getUsersForCommunity(nextCommunities[0].communityId) : [];
      setCommunities(nextCommunities);
      setCommunityMembers(nextCommunityMembers);
      setJoining(false);
      setCommunityCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join community.');
    } finally {
      setLoading(false);
    }
  }, [hasCommunity, user, communityCode]);

  const createNewCommunity = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to create a community.');
      return;
    }

    if (!newCommunityName.trim()) {
      setError('Please enter a community name.');
      return;
    }

    if (hasCommunity) {
      setError('You are already in a community.');
      setCreating(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const communityUid = await createCommunity(newCommunityName.trim());
      await addUserToCommunity(user.id, communityUid);
      const nextCommunities = await getCommunitiesForUser(user.id);
      const nextCommunityMembers = nextCommunities[0] ? await getUsersForCommunity(nextCommunities[0].communityId) : [];
      setCommunities(nextCommunities);
      setCommunityMembers(nextCommunityMembers);
      setCreating(false);
      setNewCommunityName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community.');
    } finally {
      setLoading(false);
    }
  }, [hasCommunity, user, newCommunityName]);

  const leaveCommunity = useCallback(async () => {
    if (!user || !currentCommunity || leaving) return;

    setLeaving(true);
    setLoading(true);
    setError(null);
    try {
      await removeUserFromCommunity(user.id, currentCommunity.communityId);
      const nextCommunities = await getCommunitiesForUser(user.id);
      const nextCommunityMembers = nextCommunities[0] ? await getUsersForCommunity(nextCommunities[0].communityId) : [];
      setCommunities(nextCommunities);
      setCommunityMembers(nextCommunityMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave community.');
    } finally {
      setLeaving(false);
      setLoading(false);
    }
  }, [currentCommunity, leaving, user]);

  const confirmLeaveCommunity = useCallback(() => {
    Alert.alert(
      'Leave community?',
      "You will no longer be part of this community.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave community',
          style: 'destructive',
          onPress: () => void leaveCommunity(),
        },
      ],
    );
  }, [leaveCommunity]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Community</Text>
        <View style={styles.rule} />

        {view === 'community' ? (
          <CommunityView 
            currentCommunity={currentCommunity}
            loading={loading}
            leaving={leaving}
            confirmLeaveCommunity={confirmLeaveCommunity}
            onOpenGallery={() => setView('gallery')}
            onOpenHallOfFame={() => setView('hallOfFame')}/>
        ) : view === 'gallery' ? (
          <GalleryView 
            currentCommunity={currentCommunity}
            theme={theme}
            user={user}
            onBack={() => setView('community')}/>
        ) : (
          <HallOfFameView
            currentCommunity={currentCommunity}
            user={user}
            onBack={() => setView('community')}
          />
        )}
        

        {!hasCommunity && (
          <>
            {joining ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.label}>Community code</Text>
                <TextInput
                  value={communityCode}
                  onChangeText={setCommunityCode}
                  placeholder="Community code"
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading || !communityCode.trim()}
                  onPress={() => void joinCommunity()}
                  style={({ pressed }) => [
                    styles.joinButton,
                    pressed && styles.buttonPressed,
                    (loading || !communityCode.trim()) && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.joinButtonText}>Join community</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setJoining(true)}
                style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}>
                <Text style={styles.joinButtonText}>Join community</Text>
              </Pressable>
            )}

            {creating ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.label}>Community name</Text>
                <TextInput
                  value={newCommunityName}
                  onChangeText={setNewCommunityName}
                  placeholder="e.g. Study Group"
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading || !newCommunityName.trim()}
                  onPress={() => void createNewCommunity()}
                  style={({ pressed }) => [
                    styles.joinButton,
                    pressed && styles.buttonPressed,
                    (loading || !newCommunityName.trim()) && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.joinButtonText}>Create community</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreating(true)}
                style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}>
                <Text style={styles.joinButtonText}>Create community</Text>
              </Pressable>
            )}
          </>
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
  communityList: {
    gap: HavenSpacing.md,
  },
  communityCard: {
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
  communityName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  communityDetails: {
    width: '100%',
    gap: HavenSpacing.lg,
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
  memberName: {
    flex: 1,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
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