import { StyleSheet, View } from 'react-native';
import { Spacing } from '../constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type RecommendedActivitiesProps = {
  activities?: string[];
};

export function RecommendedActivities({
  activities = [
    'Meditate',
    'Touch grass',
    'Chat to a friend',
    'Read a book',
    'Drink water',
    'Cooking',
  ],
}: RecommendedActivitiesProps) {
  return (
    <View style={styles.container}>
      {activities.map((activity) => (
        <ThemedView
          key={activity}
          type="backgroundSelected"
          style={styles.box}>
          <ThemedText>{activity}</ThemedText>
        </ThemedView>
      ))}
    </View>
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
    borderRadius: Spacing.two,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

});