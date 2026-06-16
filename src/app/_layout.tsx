import { NunitoSans_400Regular, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WinnerAnnouncementOverlay } from '@/components/WinnerAnnouncementOverlay';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { DailyQuestProvider } from '@/hooks/use-daily-quest';
import { prefetchAllForUser } from '@/hooks/queries';
import { StudyHistoryProvider } from '@/hooks/use-study-history';
import { StudySessionProvider } from '@/hooks/use-study-session';
import LoginScreen from './login';
import RegisterScreen from './register';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
});

// Tell React Query about React Native app focus/background transitions.
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { loading, session, user } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const prefetchedRef = useRef<string | null>(null);

  // As soon as we have a user, kick off all prefetches in the background.
  // Guard with a ref so we only fire once per user session (not on every render).
  useEffect(() => {
    if (user && prefetchedRef.current !== user.id) {
      prefetchedRef.current = user.id;
      void prefetchAllForUser(queryClient, user.id);
    }
  }, [user]);

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
      <StudyHistoryProvider>
        <StudySessionProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <WinnerAnnouncementOverlay />
        </StudySessionProvider>
      </StudyHistoryProvider>
    </DailyQuestProvider>
  );
}
