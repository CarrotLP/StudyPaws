import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontAwesome } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Toast } from '@/components/Toast';

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
import { minutesToTime, questWindowsFromDeadlines } from '@/constants/questWindows';
import { useAuth } from '@/hooks/use-auth';
import { useDailyQuest } from '@/hooks/use-daily-quest';
import { useWithinWindow } from '@/hooks/use-quest-window';
import { supabase } from '@/backend/lib/supabase';
import { getCommunitySubmissionOfDate, removeSubmissionFromCommunity, uploadSubmissionToCommunity } from '@/services/communityQuestSubmission.services';
import { getOwnQuestSubmission } from '@/services/questSubmission.services';
import { getCommunitiesForUser } from '@/services/userCommunities.services';
import { getTeamGallery, submitVote, type GallerySubmission } from '@/services/vote.services';
import { getThemeForWeek } from '@/services/weeklyTheme.services';

/** Rating-star glyph size (px). Fill is rendered slightly smaller so the
 *  black outline stays visible underneath when a star is selected. */
const STAR_SIZE = 32;
const STAR_FILL_SIZE = STAR_SIZE - 7;
const BOTTOM_BUTTON_SCROLL_PADDING = 96;

export default function DailyQuestScreen() {
  const { user } = useAuth();
  const { loading: questLoading, quest, team: team, deadlines, error, refresh } = useDailyQuest();
  const [showGallery, setShowGallery] = useState(false);
  const [todayPhotoUri, setTodayPhotoUri] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const [gallerySubmissions, setGallerySubmissions] = useState<GallerySubmission[]>([]);
  const [voted, setVoted] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);
  const [submittingVotes, setSubmittingVotes] = useState(false);
  const [galleryPageWidth, setGalleryPageWidth] = useState(0);
  const [galleryPage, setGalleryPage] = useState(0);
  const [communityUploaded, setCommunityUploaded] = useState(false);
  const [hasCommunity, setHasCommunity] = useState(false);
  const [weeklyTheme, setWeeklyTheme] = useState<string | null>(null);
  const [weeklyThemeLoading, setWeeklyThemeLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryScrollRef = useRef<ScrollView>(null);

  const goToPage = (index: number) => {
    const clamped = Math.max(0, Math.min(gallerySubmissions.length - 1, index));
    galleryScrollRef.current?.scrollTo({ x: clamped * galleryPageWidth, animated: true });
    setGalleryPage(clamped);
  };

  const showToast = (msg: string) => {
    setToast({ msg, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user || !quest) return;

      getOwnQuestSubmission(user.id, quest.questDate)
        .then((photoUri) => {
          setTodayPhotoUri(photoUri);
          setPhotoLoadError(false);
        })
        .catch(() => {});

      getCommunitySubmissionOfDate(user.id, quest.questDate)
        .then((submissionUid) => {
          setCommunityUploaded(submissionUid !== '');
        })
        .catch(() => {
          setCommunityUploaded(false);
        });

      getCommunitiesForUser(user.id)
        .then((nextCommunities) => {
          setHasCommunity(nextCommunities.length > 0);
        })
        .catch(() => {
          setHasCommunity(false);
        });
    }, [quest, user]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!quest) {
        setWeeklyTheme(null);
        setWeeklyThemeLoading(false);
        return;
      }

      let active = true;
      setWeeklyThemeLoading(true);
      getThemeForWeek(quest.questDate)
        .then((theme) => {
          if (!active) return;
          setWeeklyTheme(theme || null);
        })
        .catch(() => {
          if (!active) return;
          setWeeklyTheme(null);
        })
        .finally(() => {
          if (active) setWeeklyThemeLoading(false);
        });

      return () => {
        active = false;
      };
    }, [quest]),
  );

  const allRated = gallerySubmissions.length > 0 && ratings.every((r) => r > 0);

  // Local-clock gate: voting/rating UI is only available during the voting window.
  const windows = questWindowsFromDeadlines(
    deadlines.submissionDeadlineMinutes,
    deadlines.votingDeadlineMinutes,
  );
  const votingOpen = useWithinWindow(windows.voting);
  const galleryEnabled = votingOpen && Boolean(team);

  const openGallery = async () => {
    if (!votingOpen || !team || !quest || !user) return;

    try {
      const submissions = await getTeamGallery(team.teamId, quest.questDate, user.id);
      const existingRatings = submissions.map((submission) => submission.voteValue);
      setGallerySubmissions(submissions);
      setRatings(existingRatings);
      setVoted(submissions.length > 0 && existingRatings.every((rating) => rating > 0));
      setGalleryPage(0);
      setShowGallery(true);
    } catch (error) {
      Alert.alert('Gallery unavailable', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  
  const uploadToCommunity = async () => {
    // TODO: 1. need to confirm user is in community, 2. need to check user has not uploaded yet
    if ( !quest || !user) return;

    try {
      const photoUri = await getOwnQuestSubmission(user.id, quest.questDate);

      if (!photoUri) {
        throw new Error('No photo taken.');
      }

      const community = (await getCommunitiesForUser(user.id))?.[0] ?? null;

      if (!community) {
        throw new Error('No community found.');
      }

      await uploadSubmissionToCommunity(
        user.id,
        community.communityId,
        quest.questDate,
        photoUri
      );
      setCommunityUploaded(true);
      showToast('Photo uploaded');
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const removeFromCommunity = async () => {
    try {
      await removeSubmissionFromCommunity(user!.id, quest!.questDate);
      setCommunityUploaded(false);
    } catch (error) {
      Alert.alert('Remove failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const saveRatings = async () => {
    // Guard with the SAME reactive `votingOpen` that gates the gallery render
    // (the overlay only shows while votingOpen is true). Recomputing the window
    // separately here could disagree with it if the deadlines changed mid-session.
    if (!votingOpen || !team || !quest) {
      setShowGallery(false);
      Alert.alert('Voting is closed right now');
      return;
    }

    try {
      setSubmittingVotes(true);
      await Promise.all(
        gallerySubmissions.map((submission, index) =>
          submitVote(team.teamId, quest.questDate, submission.userId, ratings[index]),
        ),
      );
      setShowGallery(false);
      setVoted(true);
      Alert.alert('Votes saved');
    } catch (error) {
      // Supabase RPC errors are plain { message, details, hint, code } objects,
      // not Error instances — pull the message out so the real cause is shown.
      // Use warn (not error) so it doesn't trigger the full-screen dev overlay;
      // the failure is already surfaced to the user via the Alert below.
      console.warn('submitVote failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : (error as { message?: string; details?: string })?.message ??
            (error as { details?: string })?.details ??
            'Please try again.';
      Alert.alert('Votes could not be saved', message);
    } finally {
      setSubmittingVotes(false);
    }
  };

  const openQuestSuggestion = () => {
    router.push({
      pathname: '/teams',
      params: { suggest: String(Date.now()) },
    });
  };

  const devRemoveSubmission = async () => {
    if (!user || !quest) {
      Alert.alert('Error', 'User or quest not loaded');
      return;
    }

    try {
      // 1. Remove from personal quest submissions
      const { error: personalError } = await supabase
        .from('quest_submissions')
        .delete()
        .eq('quest_date', quest.questDate)
        .eq('user_id', user.id);

      if (personalError) {
        Alert.alert('Personal Delete Error', personalError.message);
        return;
      }

      // 2. Remove from community (using existing service which handles likes)
      try {
        await removeSubmissionFromCommunity(user.id, quest.questDate);
      } catch (communityErr: any) {
        // If it's a "no row found" error, we can ignore it (submission might not have been in community)
        if (communityErr?.code !== 'PGRST116' && communityErr?.details !== 'The result contains 0 rows') {
          console.log('Non-critical community delete error:', communityErr);
        }
      }

      Alert.alert('Success', 'Submissions removed');
      void refresh();
    } catch (error: any) {
      Alert.alert('Catch Error', error?.message ?? 'Unknown error');
    }
  };

  const devSetDeadline = async (offsetHours: number) => {
    if (!team) {
      Alert.alert('Error', 'Team not loaded');
      return;
    }
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    let newDeadline = utcMinutes + offsetHours * 60;
    newDeadline = Math.max(0, Math.min(1410, newDeadline));

    const { error } = await supabase
      .from('team_quest_settings')
      .update({ submission_deadline_minutes: newDeadline })
      .eq('team', team.teamId);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Deadline set to ${minutesToTime(newDeadline)} UTC`);
      void refresh();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast && <Toast key={toast.key} message={toast.msg} />}
      {__DEV__ && (
        <>
          <Pressable
            onPress={devRemoveSubmission}
            style={[styles.devBtn, { bottom: 70, right: 16 }]}
            accessibilityLabel="dev: remove submission">
            <Text style={styles.devGlyph}>X</Text>
          </Pressable>
          <Pressable
            onPress={() => devSetDeadline(2)}
            style={[styles.devBtn, { bottom: 70, right: 46 }]}
            accessibilityLabel="dev: deadline +2h">
            <Text style={styles.devGlyph}>+2</Text>
          </Pressable>
          <Pressable
            onPress={() => devSetDeadline(-2)}
            style={[styles.devBtn, { bottom: 70, right: 76 }]}
            accessibilityLabel="dev: deadline -2h">
            <Text style={styles.devGlyph}>-2</Text>
          </Pressable>
        </>
      )}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>daily quest</Text>
        <View style={styles.rule} />

        {/* ── Weekly theme (from the DB) — daily quests follow it all week ── */}
        <View style={styles.weeklyThemeBlock}>
          <View style={styles.weeklyThemeRow}>
            <Text style={styles.weeklyThemeLabel}>The weekly theme is:</Text>
            <Text style={styles.weeklyThemeText}>
              {weeklyThemeLoading ? '…' : weeklyTheme ?? 'Not set yet'}
            </Text>
          </View>
          <Text style={styles.weeklyThemeHelpText}>
            Daily quests follow this theme all week.
          </Text>
          <Text style={styles.weeklyThemeCtaText}>Have an idea for next week?</Text>
          <Pressable
            onPress={openQuestSuggestion}
            style={({ pressed }) => [
              styles.weeklyThemeCtaButton,
              pressed && styles.weeklyThemeCtaButtonPressed,
            ]}>
            <Text style={styles.weeklyThemeCtaButtonText}>Suggest a quest</Text>
          </Pressable>
        </View>

        {/* ── Submission panel ── */}
        <Text style={styles.submissionLabel}>Your submission for today</Text>

        <View style={styles.photoFrame}>
          {todayPhotoUri && !photoLoadError ? (
            <Image
              source={{ uri: todayPhotoUri }}
              style={styles.photo}
              resizeMode="cover"
              onError={() => setPhotoLoadError(true)}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.placeholderIcon}>[ ]</Text>
              <Text style={styles.placeholderText}>No photo yet</Text>
            </View>
          )}
        </View>

        {/* ── Today's daily quest, below the submission photo ── */}
        <View style={styles.promptBlock}>
          <Text style={styles.promptSubject}>
            {quest
              ? quest.description
              : questLoading
                ? 'Loading today’s quest...'
                : error ?? 'No daily quest is available today.'}
          </Text>
        </View>

        {/* ── View Team Gallery button (a) — always visible; deactivated outside
              the voting window so users know the option exists. ── */}
        <View style={styles.centerContent}>
          <Pressable
            disabled={!galleryEnabled}
            style={({ pressed }) => [
              styles.btn,
              pressed && galleryEnabled && styles.btnPressed,
              !galleryEnabled && styles.btnDisabled,
            ]}
            onPress={openGallery}>
            <Text style={[styles.btnText, !galleryEnabled && styles.btnTextDisabled]}>
              View Team Gallery
            </Text>
          </Pressable>
          {!team ? (
            <Text style={styles.gatedHint}>Join a team to view and rate teammate submissions.</Text>
          ) : !votingOpen ? (
            <Text style={styles.gatedHint}>
              You can view and rate your teammates submissions from{' '}
              {minutesToTime(deadlines.submissionDeadlineMinutes)} to{' '}
              {minutesToTime(deadlines.votingDeadlineMinutes)} UTC
            </Text>
          ) : null}

          <Pressable
            disabled={!hasCommunity}
            style={({ pressed }) => [
              styles.btn,
              pressed && hasCommunity && styles.btnPressed,
              !hasCommunity && styles.btnDisabled,
            ]}
            onPress={communityUploaded ? removeFromCommunity : uploadToCommunity}>
            <Text style={[styles.btnText, !hasCommunity && styles.btnTextDisabled]}>
              {communityUploaded ? 'Remove from Community' : 'Upload to Community'}
            </Text>
          </Pressable>
          {!communityUploaded && !hasCommunity ? (
            <Text style={styles.gatedHint}>Join a community to upload</Text>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Gallery overlay (closes itself if the voting window passes) ── */}
      {showGallery && votingOpen && (
        <View style={styles.scrim} pointerEvents="auto">
          {/*
           * galleryWrapper is position:relative so we can pin the close button
           * just outside the top-right corner of the card below it.
           */}
          <View style={styles.galleryWrapper}>
            {/* Close button OUTSIDE the gallery card */}
            <Pressable
              accessibilityLabel="Close gallery"
              style={styles.galleryClose}
              onPress={() => setShowGallery(false)}>
              <Text style={styles.galleryCloseText}>X</Text>
            </Pressable>

            {/* Gallery card */}
            <View style={styles.galleryCard}>
              <Text style={styles.galleryHeader}>
                {team?.teamName ?? 'Team'} - team gallery
              </Text>
              {/* Small secondary line so raters know what today's quest was. */}
              <Text style={styles.gallerySubtitle}>{quest?.description}</Text>
              <View style={styles.galleryRule} />

              {gallerySubmissions.length === 0 ? (
                <Text style={styles.gallerySubtitle}>No teammate submissions yet.</Text>
              ) : (
                <>
                {/* Instagram-style horizontal pager: one submission per page. */}
                <View
                  style={styles.galleryCarousel}
                  onLayout={(e) => setGalleryPageWidth(e.nativeEvent.layout.width)}>
                  <ScrollView
                    ref={galleryScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      if (galleryPageWidth > 0) {
                        setGalleryPage(
                          Math.round(e.nativeEvent.contentOffset.x / galleryPageWidth),
                        );
                      }
                    }}>
                    {gallerySubmissions.map((submission) => (
                      <View
                        key={submission.userId}
                        style={[styles.galleryItem, { width: galleryPageWidth }]}>
                        <View style={styles.galleryPhotoWrap}>
                          <Image
                            source={{ uri: submission.imageUrl }}
                            style={styles.galleryPhoto}
                            resizeMode="contain"
                            onError={(e) => console.log('IMAGE ERROR', e.nativeEvent.error)}
                          />
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Functional swipe arrows (hidden at the ends). */}
                  {galleryPage > 0 && (
                    <Pressable
                      accessibilityLabel="Previous submission"
                      hitSlop={12}
                      style={[styles.swipeArrow, styles.swipeArrowLeft]}
                      onPress={() => goToPage(galleryPage - 1)}>
                      <View style={styles.swipeArrowLeftHead} />
                    </Pressable>
                  )}
                  {galleryPage < gallerySubmissions.length - 1 && (
                    <Pressable
                      accessibilityLabel="Next submission"
                      hitSlop={12}
                      style={[styles.swipeArrow, styles.swipeArrowRight]}
                      onPress={() => goToPage(galleryPage + 1)}>
                      <View style={styles.swipeArrowRightHead} />
                    </Pressable>
                  )}
                </View>

                {/* Page dots — filled gold once a page has been rated. */}
                {gallerySubmissions.length > 1 && (
                  <View style={styles.galleryDots}>
                    {gallerySubmissions.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.galleryDot,
                          i === galleryPage && styles.galleryDotActive,
                          ratings[i] > 0 && styles.galleryDotRated,
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Stars for the CURRENT submission, at the bottom. */}
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      style={styles.star}
                      onPress={() => {
                        const next = [...ratings];
                        next[galleryPage] = star;
                        setRatings(next);
                      }}>
                      <FontAwesome name="star" size={STAR_SIZE} color={HavenColors.ink} />
                      {ratings[galleryPage] >= star && (
                        <FontAwesome
                          name="star"
                          size={STAR_FILL_SIZE}
                          color={HavenColors.gold}
                          style={styles.starFill}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={[styles.saveBtn, (!allRated || submittingVotes) && styles.saveBtnDisabled]}
                  disabled={!allRated || submittingVotes}
                  onPress={saveRatings}>
                  <Text style={styles.saveBtnText}>
                    {submittingVotes ? 'saving…' : voted ? 'update ratings' : 'save ratings'}
                  </Text>
                </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      )}
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
    paddingBottom: HavenSpacing.xxl + BOTTOM_BUTTON_SCROLL_PADDING,
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
  weeklyThemeBlock: {
    alignItems: 'center',
    gap: HavenSpacing.xs,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  weeklyThemeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: HavenSpacing.sm,
    flexWrap: 'wrap',
  },
  weeklyThemeLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'center',
    flexShrink: 0,
  },
  weeklyThemeText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: RibbonColors.calendar,
    textAlign: 'center',
  },
  weeklyThemeHelpText: {
    fontFamily: HavenFonts.body,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  weeklyThemeCtaText: {
    fontFamily: HavenFonts.body,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  weeklyThemeCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: HavenSpacing.sm,
    flexWrap: 'wrap',
  },
  weeklyThemeCtaButton: {
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.xs,
    paddingHorizontal: HavenSpacing.md,
  },
  weeklyThemeCtaButtonPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  weeklyThemeCtaButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },

  // ── Submission panel ──────────────────────────────────────────────────────
  submissionLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.inkSoft,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.sm,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: HavenSpacing.base,
    backgroundColor: HavenColors.parchmentDark,
  },
  placeholderIcon: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.dial,
    color: HavenColors.inkSoft,
  },
  placeholderText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  promptBlock: {
    alignItems: 'center',
    gap: HavenSpacing.xs,
  },
  promptSubject: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.title,
    color: RibbonColors.calendar,
    textAlign: 'center',
    lineHeight: PixelFontSize.title * 1.6,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  centerContent: {
    alignItems: 'center',
    paddingTop: HavenSpacing.sm,
    gap: 8
  },
  btn: {
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.sm,
    paddingHorizontal: HavenSpacing.lg,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  btnWide: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },
  btnText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
    letterSpacing: 0.5,
  },
  // Deactivated look for the gallery button outside the voting window.
  btnDisabled: {
    opacity: 0.45,
    backgroundColor: HavenColors.inkSoft,
    borderColor: HavenColors.inkSoft,
    boxShadow: 'none',
  },
  btnTextDisabled: {
    color: HavenColors.parchmentDark,
  },
  gatedHint: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
    textAlign: 'center',
    marginTop: HavenSpacing.xs,
  },

  // ── Gallery overlay ───────────────────────────────────────────────────────
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: HavenSpacing.xxl,
    backgroundColor: HavenColors.overlayScrim,
  },
  galleryWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    // Hug the card's content height, but never overflow the screen.
    maxHeight: '90%',
  },
  // Close button sits just above/right of the gallery card
  galleryClose: {
    position: 'absolute',
    top: -14,
    right: -10,
    zIndex: 201,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.gold,
  },
  galleryCloseText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
  },
  galleryCard: {
    backgroundColor: HavenColors.parchment,
    borderWidth: Border.frame,
    borderColor: HavenColors.ink,
    padding: HavenSpacing.lg,
    gap: HavenSpacing.md,
    boxShadow: `${ShadowOffset.four}px ${ShadowOffset.four}px 0px ${HavenColors.leatherShadow}`,
    // Size to content (image + stars + button); the wrapper's maxHeight caps it.
    flexShrink: 1,
  },
  galleryHeader: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.leather,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  gallerySubtitle: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  galleryRule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },
  galleryCarousel: {
    width: '100%',
    overflow: 'hidden',
  },
  galleryItem: {
    alignItems: 'center',
    gap: HavenSpacing.xs,
  },
  galleryPhotoWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  galleryPhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  swipeArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    opacity: 0.36,
  },
  swipeArrowLeft: {
    left: HavenSpacing.sm,
  },
  swipeArrowRight: {
    right: HavenSpacing.sm,
  },
  swipeArrowLeftHead: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: HavenColors.ink,
  },
  swipeArrowRightHead: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: HavenColors.ink,
  },
  galleryCountStamp: {
    position: 'absolute',
    right: HavenSpacing.base,
    bottom: HavenSpacing.base,
    paddingHorizontal: HavenSpacing.base,
    paddingVertical: HavenSpacing.xs,
    backgroundColor: 'rgba(26, 15, 8, 0.55)',
    borderRadius: 14,
  },
  galleryCountStampText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.sm,
    color: HavenColors.white,
  },
  starRow: {
    flexDirection: 'row',
    gap: HavenSpacing.sm,
    paddingVertical: HavenSpacing.xs,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  galleryPosition: {
    alignItems: 'center',
    gap: HavenSpacing.xs,
    paddingTop: HavenSpacing.sm,
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: HavenSpacing.xs,
  },
  galleryDot: {
    width: 7,
    height: 7,
    backgroundColor: HavenColors.parchmentDark,
    borderWidth: 1,
    borderColor: HavenColors.inkSoft,
  },
  galleryDotActive: {
    width: 12,
    backgroundColor: HavenColors.leather,
  },
  galleryDotRated: {
    backgroundColor: HavenColors.gold,
  },
  gallerySwipeHint: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.inkSoft,
  },
  galleryRewardHint: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.md,
    color: HavenColors.leather,
  },
  // Square container holding the black outline with the yellow fill centered on top.
  star: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starFill: {
    position: 'absolute',
  },
  saveBtn: {
    marginTop: HavenSpacing.md,
    alignSelf: 'center',
    backgroundColor: HavenColors.leather,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
  },
  votedMsg: {
    marginTop: HavenSpacing.md,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.leather,
    textAlign: 'center',
  },
  devBtn: {
    position: 'absolute',
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
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
  },
});
