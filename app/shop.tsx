import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Image, ScrollView, StyleSheet, View } from 'react-native';


export default function ShopScreen() {
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
            Points: 100
          </ThemedText>
        </View>
      </View>

      {/* IMAGE */}
      <View style={styles.section}>
        <View style={styles.center}>
          <Image
            source={require('@/assets/images/collectibles/fortune-wheel.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* TEXT BOX */}
      <View style={styles.section}>
        <ThemedText style={styles.textCenter}>
          Spend 50 points to spin the wheel!
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
});