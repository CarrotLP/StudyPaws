import { NunitoSans_400Regular, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WinnerAnnouncementOverlay } from '@/components/WinnerAnnouncementOverlay';
import { EconomyProvider } from '@/hooks/use-economy';
import { OutfitProvider } from '@/hooks/use-outfit';
import { StudyHistoryProvider } from '@/hooks/use-study-history';
import { StudySessionProvider } from '@/hooks/use-study-session';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_700Bold,
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
              <WinnerAnnouncementOverlay />
            </StudySessionProvider>
          </OutfitProvider>
        </StudyHistoryProvider>
      </EconomyProvider>
    </ThemeProvider>
  );
}
