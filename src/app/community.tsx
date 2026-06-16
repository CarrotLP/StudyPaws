import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { QK } from '@/hooks/queries';
import { createCommunity, getCommunityByCode } from '@/services/community.services';
import {
  addUserToCommunity,
  getCommunitiesForUser,
  removeUserFromCommunity,
} from '@/services/userCommunities.services';

import { CommunityView } from '@/components/CommunityView';
import { GalleryView } from '@/components/GalleryView';
import { HallOfFameView } from '@/components/HallOfFameView';
import { getThemeForWeek } from '@/services/weeklyTheme.services';

export default function CommunitiesScreen() {
  const [view, setView] = useState<'community' | 'gallery' | 'hallOfFame'>('community');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [communityCode, setCommunityCode] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const { data: communities = [], isLoading: loading } = useQuery({
    queryKey: QK.communities(user?.id ?? ''),
    queryFn: () => getCommunitiesForUser(user!.id),
    enabled: !!user?.id,
  });

  const currentCommunity = communities[0] ?? null;
  const hasCommunity = Boolean(currentCommunity);

  const { data: theme = '' } = useQuery({
    queryKey: QK.weeklyTheme(today),
    queryFn: () => getThemeForWeek(new Date().toISOString()),
    select: (data) => data ?? '',
  });

  const invalidateCommunities = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: QK.communities(user.id) });
  }, [user, queryClient]);

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


    setError(null);
    try {
      const communityUid = await getCommunityByCode(communityCode.trim());
      if (!communityUid) {
        throw new Error('Community not found.');
      }

      await addUserToCommunity(user.id, communityUid);
      await invalidateCommunities();
      setJoining(false);
      setCommunityCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join community.');
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


    setError(null);
    try {
      const communityUid = await createCommunity(newCommunityName.trim());
      await addUserToCommunity(user.id, communityUid);
      await invalidateCommunities();
      setCreating(false);
      setNewCommunityName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community.');
    }
  }, [hasCommunity, user, newCommunityName]);

  const leaveCommunity = useCallback(async () => {
    if (!user || !currentCommunity || leaving) return;

    setLeaving(true);

    setError(null);
    try {
      await removeUserFromCommunity(user.id, currentCommunity.communityId);
      await invalidateCommunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave community.');
    } finally {
      setLeaving(false);
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
        {view === 'community' ? (
          <CommunityView 
            currentCommunity={currentCommunity}
            loading={loading}
            leaving={leaving}
            confirmLeaveCommunity={confirmLeaveCommunity}
            onOpenGallery={() => setView('gallery')}
            onOpenHallOfFame={() => setView('hallOfFame')}
            joining={joining}
            setJoining={setJoining}
            creating={creating}
            setCreating={setCreating}
            communityCode={communityCode}
            setCommunityCode={setCommunityCode}
            newCommunityName={newCommunityName}
            setNewCommunityName={setNewCommunityName}
            joinCommunity={joinCommunity}
            createNewCommunity={createNewCommunity}
          />
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