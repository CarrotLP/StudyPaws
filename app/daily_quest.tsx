import { Image, Pressable, Text, View } from 'react-native';

import { Popup } from '@/components/popup';
import { HavenColors } from '@/constants/havenTheme';
import { useState } from 'react';

import { FontAwesome } from '@expo/vector-icons';

// Intentionally blank placeholder — content TBD. Replaces Calendar in the nav.
export default function DailyQuestScreen() {
  const [showPopup, setShowPopup] = useState(false);
  const galleryImages: string[] = [];  // getGalleryImages(); // Assume this function fetches an array of image URLs for the team gallery
  const voted = false; // getVotedStatus(); // Assume this function checks if the user has already voted for the day
  const [ratings, setRatings] = useState<number[]>([]); 
  const submitRatings = () => {
    // postVotes(ratings); // Assume this function submits the ratings to the backend
    setShowPopup(false);
  }

  const updateRatings = () => {
    // updateVotes(ratings); // Assume this function updates the ratings on the backend
    setShowPopup(false);
  }

  const objectsPerRow = [
    ...galleryImages.map((imageSource, index) => (
      <View key={index} style={{ alignItems: 'center' }}>
        {/* Image */}
        <Image
          src={imageSource}
          style={{ width: 100, height: 100 }}
        />
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
      <View key="close-and-submit" style={{ flexDirection: 'row', padding: 20 }}>
        <Pressable onPress={() => setShowPopup(false)}>
          <Text>Close</Text>
        </Pressable>

        {ratings.every((r) => r > 0) && !voted && (
          <Pressable onPress={submitRatings}>
            <Text>Submit</Text>
          </Pressable>
        )}

        {ratings.every((r) => r > 0) && voted && (
          <Pressable onPress={updateRatings}>
            <Text>Update</Text>
          </Pressable>
        )}
      </View>
    ),
  ];


  return (
    <View style={{ flex: 1, backgroundColor: HavenColors.parchment }}>
      <Pressable style={{ flex: 1 }} onPress={() => setShowPopup(true)}>
        <Text>View Team Gallery</Text>
      </Pressable>
      {showPopup && (
        <Popup
          title="Team Gallery"
          objects={objectsPerRow}
        />
      )}
    </View>
  );
}