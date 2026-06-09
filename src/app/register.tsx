import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { getPetPreviews, type PetPreview } from '@/services/petPreview.services';

export default function RegisterScreen({
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

  // Cat model picker (display + capture only; not yet persisted to the DB).
  const [petOptions, setPetOptions] = useState<PetPreview[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  // Two-step form: 1 = account details, 2 = pet name + cat choice.
  const [step, setStep] = useState<1 | 2>(1);

  // Width of the swipe carousel page (measured so paging snaps correctly).
  const [carouselWidth, setCarouselWidth] = useState(0);

  const goNext = () => {
    if (!email.trim() || !password || !username.trim()) {
      setFormError('Please fill out every field.');
      return;
    }
    setFormError(null);
    setStep(2);
  };

  useEffect(() => {
    let mounted = true;
    getPetPreviews()
      .then((options) => {
        if (mounted) {
          setPetOptions(options);
          // The visible cat in the carousel is the selection; default to the first.
          if (options.length > 0) setSelectedModel((cur) => cur ?? options[0].name);
        }
      })
      .catch((err) => {
        if (mounted) {
          setPetOptions([]);
          // Surface the real reason (e.g. RLS denial) instead of hiding it.
          console.warn('getPetPreviews failed:', err);
          setFormError(err instanceof Error ? err.message : 'Could not load cats.');
        }
      })
      .finally(() => {
        if (mounted) setLoadingModels(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const register = async () => {
    if (!username.trim() || !petName.trim() || !email.trim() || !password) {
      setFormError('Please fill out every field.');
      return;
    }

    if (!selectedModel) {
      setFormError('Please choose a pet.');
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
            {step === 1 ? (
              <>
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
                    onSubmitEditing={goNext}
                    returnKeyType="next"
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

                {message ? <Text style={styles.error}>{message}</Text> : null}

                <Pressable
                  onPress={goNext}
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                  <Text style={styles.buttonText}>Next</Text>
                </Pressable>

                <View style={styles.loginPrompt}>
                  <Text style={styles.promptText}>Have an account already?</Text>
                  <Pressable
                    onPress={onLoginPress}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text style={styles.secondaryButtonText}>Login</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
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

                <View style={styles.field}>
                  <Text style={styles.label}>choose your pet</Text>
                  {loadingModels ? (
                    <ActivityIndicator color={HavenColors.leather} />
                  ) : petOptions.length === 0 ? (
                    <Text style={styles.error}>No pets available right now.</Text>
                  ) : (
                    <View style={styles.carousel}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        // Measure the scroll viewport itself so each page width
                        // exactly matches the paging snap interval (no drift).
                        onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
                        onMomentumScrollEnd={(e) => {
                          if (carouselWidth === 0) return;
                          const index = Math.round(
                            e.nativeEvent.contentOffset.x / carouselWidth,
                          );
                          const option = petOptions[index];
                          if (option) setSelectedModel(option.name);
                        }}>
                        {petOptions.map((option) => (
                          <View
                            key={option.name}
                            style={[styles.carouselPage, { width: carouselWidth }]}>
                            <Image
                              source={{ uri: option.imageUrl }}
                              style={styles.carouselImage}
                              resizeMode="contain"
                            />
                          </View>
                        ))}
                      </ScrollView>
                      {/* Dot indicators reflecting which pet is selected. */}
                      <View style={styles.dots}>
                        {petOptions.map((option) => (
                          <View
                            key={option.name}
                            style={[
                              styles.dot,
                              option.name === selectedModel && styles.dotActive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}
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

                <Pressable
                  disabled={submitting}
                  onPress={() => {
                    setFormError(null);
                    setStep(1);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && !submitting && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              </>
            )}
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
  carousel: {
    width: '100%',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
  },
  carouselPage: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HavenSpacing.lg,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: HavenSpacing.sm,
    paddingVertical: HavenSpacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: HavenColors.inkSoft,
    opacity: 0.4,
  },
  dotActive: {
    backgroundColor: HavenColors.gold,
    opacity: 1,
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
