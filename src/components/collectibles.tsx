import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
      name: 'Fruits',
      collected: 3,
      total: 10,
      src: require('@/assets/images/collectibles/pineapple.png'),
    },
    {
      name: 'Animals',
      collected: 7,
      total: 12,
      src: require('@/assets/images/collectibles/sheep.png'),
    },
    {
      name: 'Paintings',
      collected: 1,
      total: 5,
      src: require('@/assets/images/collectibles/monalisa.png'),
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