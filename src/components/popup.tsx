import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

type PopupProps = {
  /** Array of arbitrary items to render inside the popup. Each item may be any React node. */
  title?: string;
  objects?: any[];
};

export function Popup({ title, objects = [] }: PopupProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.cardContent}>
          <View style={styles.objectColumn}>
            {title && <Text style={styles.title}>{title}</Text>}
            {objects.map((obj, index) => (
              <View key={index} style={styles.object}>
                {obj}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: Spacing.two,
  },

  objectColumn: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },

  object: {
    width: '100%',
    alignItems: 'stretch',
  },

  cardContent: {
    width: '100%',
    paddingBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});