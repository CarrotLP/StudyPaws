import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '../src/components/animated-icon';
import AppTabs from '../src/components/app-tabs';
import { EconomyProvider } from '../src/hooks/use-economy';
import { OutfitProvider } from '../src/hooks/use-outfit';
import { StudyHistoryProvider } from '../src/hooks/use-study-history';
import { StudySessionProvider } from '../src/hooks/use-study-session';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    VT323_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <EconomyProvider>
        <StudyHistoryProvider>
          <OutfitProvider>
            <StudySessionProvider>
              <AnimatedSplashOverlay />
              <AppTabs />
            </StudySessionProvider>
          </OutfitProvider>
        </StudyHistoryProvider>
      </EconomyProvider>
    </ThemeProvider>
  );
}
