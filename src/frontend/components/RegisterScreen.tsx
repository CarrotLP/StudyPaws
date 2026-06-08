import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { useAuth } from '@/hooks/use-auth';

export function RegisterScreen({
  onLoginPress,
  onRegistered,
}: {
  onLoginPress: () => void;
  onRegistered: () => void;
}) {
  const { error: authError, signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [petName, setPetName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const register = async () => {
    if (!username.trim() || !petName.trim() || !email.trim() || !password) {
      setFormError('Please fill out every field.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await signUp(email, password, username, petName);
      onRegistered();
    } catch {
      // The provider exposes the Supabase error for display.
    } finally {
      setSubmitting(false);
    }
  };

  const message = formError ?? authError;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}>
        <View style={styles.content}>
          <Text style={styles.title}>Register</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setPassword}
                onSubmitEditing={register}
                returnKeyType="go"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={password}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>username</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                onChangeText={setUsername}
                returnKeyType="next"
                style={styles.input}
                textContentType="username"
                value={username}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>pet name</Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setPetName}
                returnKeyType="next"
                style={styles.input}
                value={petName}
              />
            </View>

            {message ? <Text style={styles.error}>{message}</Text> : null}

            <Pressable
              disabled={submitting}
              onPress={register}
              style={({ pressed }) => [
                styles.button,
                pressed && !submitting && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}>
              {submitting ? (
                <ActivityIndicator color={HavenColors.gold} />
              ) : (
                <Text style={styles.buttonText}>Register account</Text>
              )}
            </Pressable>

            <View style={styles.loginPrompt}>
              <Text style={styles.promptText}>Have an account already?</Text>
              <Pressable
                disabled={submitting}
                onPress={onLoginPress}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !submitting && styles.buttonPressed,
                  submitting && styles.buttonDisabled,
                ]}>
                <Text style={styles.secondaryButtonText}>Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
  },
  title: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 360,
    gap: HavenSpacing.lg,
    marginTop: HavenSpacing.xxl,
  },
  field: {
    gap: HavenSpacing.sm,
  },
  label: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textTransform: 'lowercase',
  },
  input: {
    minHeight: 48,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    color: HavenColors.ink,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    paddingHorizontal: HavenSpacing.lg,
    paddingVertical: HavenSpacing.md,
  },
  error: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'center',
    minWidth: 190,
    alignItems: 'center',
    backgroundColor: HavenColors.leather,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    marginTop: HavenSpacing.sm,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  buttonPressed: {
    transform: [{ translateX: ShadowOffset.two }, { translateY: ShadowOffset.two }],
    boxShadow: `${ShadowOffset.one}px ${ShadowOffset.one}px 0px ${HavenColors.leatherShadow}`,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  loginPrompt: {
    alignItems: 'center',
    gap: HavenSpacing.sm,
    marginTop: HavenSpacing.md,
  },
  promptText: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.base,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  secondaryButton: {
    alignSelf: 'center',
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.leatherShadow}`,
  },
  secondaryButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.gold,
    textAlign: 'center',
  },
});
