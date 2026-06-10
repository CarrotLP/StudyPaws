/**
 * Tab layout. Uses Expo Router <Tabs> (not NativeTabs) so each of the six
 * chapters stays mounted with its own state — e.g. Home's running timer — while
 * switching; the default bottom bar is hidden and AppMenuOverlay renders the
 * visible hamburger menu on top of each scene.
 */
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppMenuOverlay } from './AppMenuOverlay';

export default function AppTabs() {
  return (
    <View style={styles.root}>
      <View style={styles.scene}>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="daily_quest" />
          <Tabs.Screen name="teams" />
          <Tabs.Screen name="community" />
          <Tabs.Screen name="dress" />
          <Tabs.Screen name="treasure" />
          <Tabs.Screen name="settings" />
          {/* Buddies kept registered (not deleted) though it's no longer in the ribbon. */}
          <Tabs.Screen name="buddies" />
        </Tabs>
      </View>
      <AppMenuOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
});
