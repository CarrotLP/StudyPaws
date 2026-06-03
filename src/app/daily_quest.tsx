import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Popup } from '@/components/popup';
import { Border, HavenColors, HavenFonts, HavenSpacing, PixelFontSize, ShadowOffset } from '@/constants/havenTheme';
import { useEffect, useState } from 'react';
import * as UserTeamService from '@/backend/services/userTeam.services';

import { FontAwesome } from '@expo/vector-icons';

// Intentionally blank placeholder — content TBD. Replaces Calendar in the nav.
export default function DailyQuestScreen() {
    // example of database access
//   const [devText, setDevText] = useState('Fetching...');
//   useEffect(() => {
//     UserTeamService.devFetchAndShowUser('0a058ab2-140b-4869-9061-f4d0b16f1bc6', setDevText);
//   }, []);

  const [showPopup, setShowPopup] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://picsum.photos/200',
    'https://samplelib.com/png/sample-boat-400x300.png',
    'https://samplelib.com/png/sample-hut-400x300.png',
  ]);
  const [voted, setVoted] = useState(false); // getVotedStatus(); // Assume this function checks if the user has already voted for the day
  const [ratings, setRatings] = useState<number[]>([]);

  useEffect(() => {
    setRatings((prev) => {
      if (prev.length === galleryImages.length) return prev;
      return Array(galleryImages.length).fill(0);
    });
  }, [galleryImages.length]);

  const submitRatings = () => {
    // postVotes(ratings); // Assume this function submits the ratings to the backend
    setShowPopup(false);
    setVoted(true);
  }

  const updateRatings = () => {
    // updateVotes(ratings); // Assume this function updates the ratings on the backend
    setShowPopup(false);
  }

  const objectsPerRow = [
    ...galleryImages.map((imageUrl, index) => (
      <View key={index} style={{ alignItems: 'center' }}>
        {/* Image */}
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 100, height: 100 }}
          onError={(e) => console.log('IMAGE ERROR', e.nativeEvent.error)}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Stars for THIS image */}
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => {
                setRatings((prev) => {
                  const updated = [...prev];
                  updated[index] = star;
                  return updated;
                });
              }}
            >
              <FontAwesome
                name={star <= (ratings[index] ?? 0) ? 'star' : 'star-o'}
                size={14}
                color="#ffd700"
              />
            </Pressable>
          ))}
        </View>
      </View>
    )),
    (
      <View key="close-and-submit" style={styles.actionRow}>
        <Pressable 
          style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
          onPress={() => setShowPopup(false)}>
          <Text style={styles.btnText}>Close</Text>
        </Pressable>

        {ratings.every((r) => r > 0) && !voted && (
          <Pressable 
            style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
            onPress={submitRatings}>
            <Text style={styles.btnText}>Submit</Text>
          </Pressable>
        )}

        {ratings.every((r) => r > 0) && voted && (
          <Pressable 
            style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.btnPressed]}
            onPress={updateRatings}>
            <Text style={styles.btnText}>Update</Text>
          </Pressable>
        )}
      </View>
    ),
  ];


  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Developer Textbox */}


 {/* // for database access example
     <View style={styles.devContainer}>
        <Text style={styles.devLabel}>Dev Output:</Text>
        <Text style={styles.devInput}>{devText}</Text>
      </View> */}

      <Text style={styles.section}>daily quest</Text>
      <View style={styles.rule} />

      <View style={styles.centerContent}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => setShowPopup(true)}>
          <Text style={styles.btnText}>View Team Gallery</Text>
        </Pressable>
      </View>

      {showPopup && (
        <Popup
          title="Team Gallery"
          objects={objectsPerRow}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: HavenSpacing.lg,
    padding: HavenSpacing.lg,
    width: '100%',
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
    flex: 1,
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
  devContainer: {
    padding: HavenSpacing.sm,
    backgroundColor: '#eee',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  devLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devInput: {
    fontSize: 12,
    color: '#333',
    minHeight: 40,
  },
});