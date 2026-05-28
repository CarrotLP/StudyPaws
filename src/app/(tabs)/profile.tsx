import { Image, ScrollView, StyleSheet } from 'react-native';

import { Collectibles } from '@/components/collectibles';
import { ProfileShowoff } from '@/components/profile-showoff';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}> 
      <ThemedText type="subtitle" style={styles.centerText}>
        Profile
      </ThemedText>
      <Image
        source={require('@/assets/images/puppy.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <ThemedText type="subtitle" style={styles.centerText}>
        Wardrobe
      </ThemedText>
      <ProfileShowoff />
      <Collectibles />
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
    gap: Spacing.five,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'left',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
