import { Popup } from '@/components/popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';


export default function ShopScreen() {
  const [showNewAccessoryPopup, setShowNewAccessoryPopup] = useState(false);
  const [points, setPoints] = useState(100);
  
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

      {/* TITLE */}
      <View style={styles.section}>
        <View style={styles.center}>
          <ThemedText type="subtitle" style={styles.title}>
            Shop
          </ThemedText>
        </View>
      </View>

      {/* POINTS (NEW SECTION) */}
      <View style={[styles.section, styles.tightSection]}>
        <View style={styles.center}>
          <ThemedText style={styles.points}>
            Points: {points}
          </ThemedText>
        </View>
      </View>

      {/* POPUP */}
      <Modal visible={showNewAccessoryPopup} transparent animationType="fade">
        <ThemedView style={styles.overlay}>
          <Popup
            title="New Accessory Unlocked!"
            buttons={[
              { label: 
                <View style={styles.center}>
                  <Image
                  source={require('@/assets/images/collectibles/scarf.png')}
                  style={styles.image}
                  resizeMode="contain"
                  />
                  <Text>S Rank Wearable</Text>
                </View>, onPress: () => {
                  setShowNewAccessoryPopup(false);
                  setPoints(points - 50);
                }
              },
            ]}
          />
        </ThemedView>
      </Modal>

      {/* IMAGE */}
      <View style={styles.section}>
        <View style={styles.center}>
          <Pressable onPress={() => {setShowNewAccessoryPopup(true)}}>
            <Image
              source={require('@/assets/images/collectibles/treasure-chest.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* TEXT BOX */}
      <View style={styles.section}>
        <ThemedText style={styles.textCenter}>
          Spend 50 points to open the mystery box!
        </ThemedText>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },

  contentContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: Spacing.six,
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.six,
  },

  section: {
    width: '100%',
  },

  center: {
    alignItems: 'center',
  },

  textCenter: {
    textAlign: 'center',
  },

  title: {
    textAlign: 'center',
  },

  image: {
    width: 180,
    height: 180,
  },

  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },

  titleRow: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  points: {
    position: 'absolute',
    right: 0,
    fontSize: 12,
    opacity: 0.7,
  },

  tightSection: {
    marginTop: -Spacing.three,  // pulls it closer to "Shop"
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // dim background
    justifyContent: 'center',
    alignItems: 'center',
  },
});
