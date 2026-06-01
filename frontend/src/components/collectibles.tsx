import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type Collectible = {
  name: string;
  collected: number;
  total: number;
  src: any;
};

type CollectiblesProps = {
  images?: Collectible[];
};

export function Collectibles({
  images = [
    {
      name: 'Accessories',
      collected: 3,
      total: 10,
      src: require('@/assets/images/collectibles/hat.png'),
    },
    {
      name: 'Clothes',
      collected: 7,
      total: 12,
      src: require('@/assets/images/collectibles/clothes.png'),
    },
    {
      name: 'Shoes',
      collected: 1,
      total: 5,
      src: require('@/assets/images/collectibles/shoe.png'),
    },
  ],
}: CollectiblesProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Collectibles</ThemedText>

      <View style={styles.grid}>
        {images.map((item, index) => (
          <View key={index} style={styles.box}>
            {/* Text section */}
            <View style={styles.textSection}>
              <ThemedText type="smallBold">
                {item.name}
              </ThemedText>

              <ThemedText>
                {item.collected}/{item.total}
              </ThemedText>
            </View>

            {/* Image */}
            <Image
              source={item.src}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },

  box: {
    width: '45%',
    height: 180,
    borderRadius: 16,
    padding: 12,
  },

  textSection: {
    gap: 4,
    marginBottom: 12,
  },

  image: {
    width: '100%',
    height: 100,
  },
});