import { Colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Image, useColorScheme } from 'react-native';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/images/tabIcons/profile.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/images/tabIcons/shop.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('@/assets/images/tabIcons/schedule.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="breaktime"
        options={{
          href: null, // optional: hides it from tab bar if you don't want a button
          title: 'Breaktime',
        }}
      />
      
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // optional: hides it from tab bar if you don't want a button
          title: 'Friends',
        }}
      />
    </Tabs>
  );
}