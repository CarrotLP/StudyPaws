import { Image, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';

type ProfileShowoffProps = {
  images?: any[];
};

export function ProfileShowoff({
  images = [
    require('@/assets/images/collectibles/pineapple.png'),
    require('@/assets/images/collectibles/sheep.png'),
    require('@/assets/images/collectibles/monalisa.png'),
    require('@/assets/images/collectibles/lemon.png'),
    require('@/assets/images/collectibles/cherries.png'),
  ],
}: ProfileShowoffProps) {
  return (
    <ThemedView style={styles.container}>
      {/* First row */}
      <ThemedView style={styles.centreRow}>
        <View style={styles.box}>
          <Image
            source={images[0]}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </ThemedView>

      {/* Remaining rows */}
      {images.slice(1).map((image, index) => (
        <View key={index} style={styles.box}>
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  box: {
    width: '47%',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centreRow: {
    width: '100%',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});