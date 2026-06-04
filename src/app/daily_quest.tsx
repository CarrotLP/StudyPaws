import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

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
import { isWithinWindow, minutesToTime, questWindowsFromDeadlines } from '@/constants/questWindows';
import { useAuth } from '@/hooks/use-auth';
import { useDailyQuest } from '@/hooks/use-daily-quest';
import { useWithinWindow } from '@/hooks/use-quest-window';
import { getOwnQuestSubmission } from '@/services/questSubmission.services';
import { getTeamGallery, submitVote, type GallerySubmission } from '@/services/vote.services';

/** Rating-star glyph size (px). Fill is rendered slightly smaller so the
 *  black outline stays visible underneath when a star is selected. */
const STAR_SIZE = 20;
const STAR_FILL_SIZE = STAR_SIZE - 5;

export default function DailyQuestScreen() {
  const { user } = useAuth();
  const { loading: questLoading, quest, team, deadlines } = useDailyQuest();
  const [showGallery, setShowGallery] = useState(false);
  const [todayPhotoUri, setTodayPhotoUri] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const [gallerySubmissions, setGallerySubmissions] = useState<GallerySubmission[]>([]);
  const [voted, setVoted] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);
  const [submittingVotes, setSubmittingVotes] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user || !quest) return;

      getOwnQuestSubmission(user.id, quest.questDate)
        .then((photoUri) => {
          setTodayPhotoUri(photoUri);
          setPhotoLoadError(false);
        })
        .catch(() => {});
    }, [quest, user]),
  );

  const allRated = gallerySubmissions.length > 0 && ratings.every((r) => r > 0);

  // Local-clock gate: voting/rating UI is only available during the voting window.
  const windows = questWindowsFromDeadlines(
    deadlines.submissionDeadlineMinutes,
    deadlines.votingDeadlineMinutes,
  );
  const votingOpen = useWithinWindow(windows.voting);

  const openGallery = async () => {
    if (!votingOpen || !team || !quest || !user) return;

    try {
      const submissions = await getTeamGallery(team.teamId, quest.questDate, user.id);
      const existingRatings = submissions.map((submission) => submission.voteValue);
      setGallerySubmissions(submissions);
      setRatings(existingRatings);
      setVoted(submissions.length > 0 && existingRatings.every((rating) => rating > 0));
      setShowGallery(true);
    } catch (error) {
      Alert.alert('Gallery unavailable', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const saveRatings = async () => {
    // Action guard: re-check the clock at submit time (no server enforcement).
    if (!isWithinWindow(windows.voting) || !team || !quest) {
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
      Alert.alert('Votes could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmittingVotes(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>daily quest</Text>
        <View style={styles.rule} />

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

        {/* Today's task is loaded from Supabase using the UTC quest date. */}
        <View style={styles.promptBlock}>
          <Text style={styles.promptSubject}>
            {questLoading
              ? 'Loading today’s quest...'
              : quest?.description ?? 'No daily quest is available today.'}
          </Text>
        </View>

        {/* ── View Team Gallery button (a) — always visible; deactivated outside
              the voting window so users know the option exists. ── */}
        <View style={styles.centerContent}>
          <Pressable
            disabled={!votingOpen}
            style={({ pressed }) => [
              styles.btn,
              pressed && votingOpen && styles.btnPressed,
              !votingOpen && styles.btnDisabled,
            ]}
            onPress={openGallery}>
            <Text style={[styles.btnText, !votingOpen && styles.btnTextDisabled]}>
              View Team Gallery
            </Text>
          </Pressable>
          {!votingOpen && (
            <Text style={styles.gatedHint}>
              You can view and rate your teammates submissions from{' '}
              {minutesToTime(deadlines.submissionDeadlineMinutes)} to{' '}
              {minutesToTime(deadlines.votingDeadlineMinutes)} UTC
            </Text>
          )}
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

              {/* Scrollable photo grid */}
              <ScrollView
                style={styles.galleryScroll}
                contentContainerStyle={styles.galleryGrid}
                showsVerticalScrollIndicator={false}>
                {gallerySubmissions.length === 0 && (
                  <Text style={styles.gallerySubtitle}>No teammate submissions yet.</Text>
                )}
                {/* 2-column row layout */}
                {gallerySubmissions.reduce<React.JSX.Element[]>((rows, _submission, idx) => {
                  if (idx % 2 !== 0) return rows;
                  const pair = gallerySubmissions.slice(idx, idx + 2);
                  rows.push(
                    <View key={idx} style={styles.galleryRow}>
                      {pair.map((submission, offset) => {
                        const i = idx + offset;
                        return (
                          <View key={submission.userId} style={styles.galleryItem}>
                            <Image
                              source={{ uri: submission.imageUrl }}
                              style={styles.galleryPhoto}
                              resizeMode="contain"
                              onError={(e) => console.log('IMAGE ERROR', e.nativeEvent.error)}
                            />
                            <View style={styles.starRow}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable
                                  key={star}
                                  hitSlop={4}
                                  onPress={() =>
                                    setRatings((prev) => {
                                      const updated = [...prev];
                                      updated[i] = star;
                                      return updated;
                                    })
                                  }>
                                  {/*
                                   * Layered star: a black 'star-o' outline is
                                   * ALWAYS rendered for contrast against the
                                   * parchment; a solid yellow 'star' is overlaid
                                   * only when selected. Avoids a native SVG dep.
                                   */}
                                  <View style={styles.star}>
                                    <FontAwesome name="star-o" size={STAR_SIZE} color="#000000" />
                                    {star <= (ratings[i] ?? 0) && (
                                      <FontAwesome
                                        name="star"
                                        size={STAR_FILL_SIZE}
                                        color="#FFD700"
                                        style={styles.starFill}
                                      />
                                    )}
                                  </View>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </View>,
                  );
                  return rows;
                }, [])}
              </ScrollView>

              {/* Submit / Update — only when all photos are rated; no Close inside */}
              {allRated && !voted && (
                <Pressable
                  disabled={submittingVotes}
                  style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
                  onPress={saveRatings}>
                  <Text style={styles.btnText}>{submittingVotes ? 'Saving...' : 'Submit'}</Text>
                </Pressable>
              )}
              {allRated && voted && (
                <Pressable
                  disabled={submittingVotes}
                  style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
                  onPress={saveRatings}>
                  <Text style={styles.btnText}>{submittingVotes ? 'Saving...' : 'Update'}</Text>
                </Pressable>
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
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
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
    maxHeight: '100%',
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
  galleryScroll: {
    flexGrow: 0,
  },
  galleryGrid: {
    gap: HavenSpacing.md,
    paddingBottom: HavenSpacing.base,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: HavenSpacing.md,
  },
  galleryItem: {
    flex: 1,
    alignItems: 'center',
    gap: HavenSpacing.sm,
  },
  galleryPhoto: {
    // Fixed uniform display box for every submission; resizeMode="contain"
    // letterboxes odd-ratio photos so the whole image stays visible.
    width: '100%',
    aspectRatio: 1,
    backgroundColor: HavenColors.cellInset,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  starRow: {
    flexDirection: 'row',
    gap: HavenSpacing.xs,
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
});
