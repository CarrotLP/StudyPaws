import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontAwesome } from '@expo/vector-icons';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { TEAM_NAME, dailyQuest } from '@/lib/daily-quest';
import { dateKey } from '@/lib/haven-format';
import { loadQuestPhotos } from '@/lib/haven-storage';

/** Rating-star glyph size (px). Fill is rendered slightly smaller so the
 *  black outline stays visible underneath when a star is selected. */
const STAR_SIZE = 20;
const STAR_FILL_SIZE = STAR_SIZE - 5;

export default function DailyQuestScreen() {
  const [showGallery, setShowGallery] = useState(false);
  const [todayPhotoUri, setTodayPhotoUri] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  // Placeholder gallery images until Supabase team photos are wired up.
  const [galleryImages] = useState<string[]>([
    'https://picsum.photos/200',
    'https://samplelib.com/png/sample-boat-400x300.png',
    'https://samplelib.com/png/sample-hut-400x300.png',
  ]);
  const [voted, setVoted] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);

  // Load today's persisted photo from AsyncStorage (key: haven.questPhotos, by date).
  useEffect(() => {
    loadQuestPhotos()
      .then((photos) => setTodayPhotoUri(photos[dateKey(new Date())] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRatings((prev) =>
      prev.length === galleryImages.length ? prev : Array(galleryImages.length).fill(0),
    );
  }, [galleryImages.length]);

  const allRated = ratings.every((r) => r > 0);

  const submitRatings = () => {
    // postVotes(ratings);
    setShowGallery(false);
    setVoted(true);
  };

  const updateRatings = () => {
    // updateVotes(ratings);
    setShowGallery(false);
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

        <Text style={styles.questPrompt}>{dailyQuest.description}</Text>

        {/* ── View Team Gallery button (a) — keep ── */}
        <View style={styles.centerContent}>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={() => setShowGallery(true)}>
            <Text style={styles.btnText}>View Team Gallery</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Gallery overlay ── */}
      {showGallery && (
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
                {TEAM_NAME} - team gallery
              </Text>
              <View style={styles.galleryRule} />

              {/* Scrollable photo grid */}
              <ScrollView
                style={styles.galleryScroll}
                contentContainerStyle={styles.galleryGrid}
                showsVerticalScrollIndicator={false}>
                {/* 2-column row layout */}
                {galleryImages.reduce<React.JSX.Element[]>((rows, _img, idx) => {
                  if (idx % 2 !== 0) return rows;
                  const pair = galleryImages.slice(idx, idx + 2);
                  rows.push(
                    <View key={idx} style={styles.galleryRow}>
                      {pair.map((imageUrl, offset) => {
                        const i = idx + offset;
                        return (
                          <View key={i} style={styles.galleryItem}>
                            <Image
                              source={{ uri: imageUrl }}
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
                  style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
                  onPress={submitRatings}>
                  <Text style={styles.btnText}>Submit</Text>
                </Pressable>
              )}
              {allRated && voted && (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
                  onPress={updateRatings}>
                  <Text style={styles.btnText}>Update</Text>
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
  questPrompt: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.xl,
    color: HavenColors.ink,
    textAlign: 'center',
    lineHeight: BodyFontSize.xl * 1.3,
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
