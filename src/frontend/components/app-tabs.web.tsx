/**
 * Web tab layout mirrors the native layout: Expo Router keeps each route
 * mounted, the default tab bar stays hidden, and AppMenuOverlay provides the
 * visible hamburger menu.
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
          <Tabs.Screen name="dress" />
          <Tabs.Screen name="treasure" />
          <Tabs.Screen name="inventory" />
          <Tabs.Screen name="settings" />
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

