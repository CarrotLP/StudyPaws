import { NunitoSans_400Regular, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from './login';
import RegisterScreen from './register';
import { WinnerAnnouncementOverlay } from '@/components/WinnerAnnouncementOverlay';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { DailyQuestProvider } from '@/hooks/use-daily-quest';
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
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthGate() {
  const { loading, session } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (loading) {
    return null;
  }

  if (!session) {
    return authScreen === 'login' ? (
      <LoginScreen onRegisterPress={() => setAuthScreen('register')} />
    ) : (
      <RegisterScreen
        onLoginPress={() => setAuthScreen('login')}
        onRegistered={() => setAuthScreen('login')}
      />
    );
  }

  return (
    <DailyQuestProvider>
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
    </DailyQuestProvider>
  );
}
