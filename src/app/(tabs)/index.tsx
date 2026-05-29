import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView type="background" style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        {/* IMAGE */}
        <Image
          source={require('@/assets/images/puppy.png')}
          style={styles.image}
          resizeMode="contain"
        />

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={() => router.push({ pathname: '/schedule' })}
            hitSlop={8}
            accessibilityRole="button"
          >
            <ThemedText style={styles.buttonText}>Schedule</ThemedText>
          </Pressable>

          <View style={styles.gap} />

          <Pressable
            style={styles.button}
            onPress={() => router.push({ pathname: '/shop' })}
            hitSlop={8}
            accessibilityRole="button"
          >
            <ThemedText style={styles.buttonText}>Shop</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: Spacing.six,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gap: {
    width: Spacing.four,
  },
});
