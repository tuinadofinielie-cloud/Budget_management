# appReact Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new React Native/Expo + TypeScript mobile app in `appReact/` (parallel to the existing, untouched Flutter app in `mobile/`) that reuses the already-built Laravel API in `backend/` as-is, implements the purple Liquid Glass design system + shared component kit, the full navigation shell, and a real end-to-end authentication flow (register/login/logout/forgot-password) wired to the real Laravel API with the session cached locally in SQLite.

**Architecture:** Expo (managed workflow) + TypeScript + Expo Router (file-based navigation, built on React Navigation) for the app shell — a root stack that gates on auth/onboarding state, an auth group (login/register/forgot-password), and a tab group (Home/Statistics/Budget/Profile) with a custom bottom bar carrying a centered floating `+` action. State is held in small Zustand stores (the RN equivalent of Riverpod's `AsyncNotifier`) backed by a plain singleton dependency graph (services constructed once, injected into repositories, injected into stores) instead of a DI framework. `axios` talks to the existing Laravel API (interceptors attach the bearer token and clear it on 401), `expo-secure-store` holds the token, and a small `expo-sqlite` wrapper caches the logged-in user so a cold app restart can restore the session without a network round trip. This mirrors the architecture already proven in `mobile/`'s Phase 1 (see `docs/superpowers/plans/2026-08-28-phase-1-foundation.md`), translated to the RN/Expo toolchain rather than copied line-for-line.

**Tech Stack:** Expo SDK (latest stable via `create-expo-app@latest`), TypeScript, `expo-router`, `axios`, `zustand`, `expo-secure-store`, `expo-sqlite`, `expo-blur`, `expo-linear-gradient`, `@expo-google-fonts/inter` + `expo-font`, `react-native-pager-view` (onboarding swiper). Testing: `jest` + `jest-expo` preset + `@testing-library/react-native` + `axios-mock-adapter`. The Laravel backend (`backend/`) is already built, tested, and deployed (Sanctum auth: register/login/logout/forgot-password/reset-password) — this plan does not touch it.

**Spec:** `MASTER_SPEC.md` (repo root) is the product spec — screens, data model, business rules, color system, Liquid Glass system, navigation shape, XOF currency rules — and applies to `appReact` exactly as it did to `mobile/`, except its §35/§36 "Architecture"/"Local SQLite" sections describe the Flutter stack specifically; for `appReact` those two sections are superseded by the Tech Stack above. `docs/superpowers/specs/2026-08-28-finance-app-design.md` documents the technical decisions made for the Flutter build (response envelope, local-first data flow, money-as-integers, error/loading/empty state conventions) — those decisions are stack-agnostic and apply here unchanged except where explicitly translated below. `docs/superpowers/plans/2026-08-28-phase-1-foundation.md` is the executed Flutter Phase 1 plan, used here as the structural template (task granularity, TDD pattern, commit-per-task) retargeted to RN/Expo. Two reference screenshots at `appReact/ressource_img/` (`ChatGPT Image 29 août 2026, 02_46_08.png` = Onboarding + Home + Statistiques; `ChatGPT Image 29 août 2026, 02_59_24.png` = Budget + Profil) are the **primary visual reference** — purple Liquid Glass, rounded cards, soft shadows, French copy, `F`-suffixed XOF amounts, bottom nav with a centered floating `+`.

## Global Constraints

- Primary brand color `#7C5CFF`; never use green as the primary brand color (MASTER_SPEC §4).
- API success responses: `{"data": ..., "message": ...}`; validation failures: `{"message": ..., "errors": {...}}` (MASTER_SPEC §43) — already implemented by `backend/`, this plan only consumes it.
- Do not modify anything under `backend/` or `mobile/`. `appReact/` is a new, independent app directory; the two mobile apps share only the deployed Laravel API.
- The API base URL is the already-deployed Laravel Cloud instance mobile/ points at today: `https://budget-management-budgetappenv-ovz7ub.laravel.cloud/api` (see `mobile/lib/core/constants/app_constants.dart`). No local-emulator-IP juggling is needed since it's cloud-hosted already.
- Currency is XOF; amounts are integers, never floats (design doc §5), displayed as `125 430 F` never `125,430.00 XOF` (MASTER_SPEC §44). Not exercised by auth/onboarding screens in this plan, but any numeric field added later must follow this.
- All user-facing UI copy is in French, matching the exact strings given in MASTER_SPEC where specified (e.g. "Se connecter", "Créer un compte", "Mot de passe oublié ?", the three onboarding titles/subtitles in §9).
- No secrets committed to git.
- Do not build any Phase 2+ feature (MASTER_SPEC §52/§53, or any screen beyond what's listed in this plan's tasks) — this plan is Phase 1 only. Tab screens other than Profile (Home/Statistics/Budget) are placeholders in this phase.
- Every screen with async state uses the shared `LoadingState`/`ErrorState`/`EmptyState` components built in Task 3 — not retrofitted later.
- **Mandatory visual verification:** after building the navigation shell (Task 7) and the Onboarding screens (Task 9) — the two pieces with a direct reference screenshot — run the app, capture the actual screen, and compare against the matching reference image in `appReact/ressource_img/` for proportions, spacing, typography, card dimensions, blur, borders, shadows, icons, bottom navigation, purple gradients, and hierarchy; fix visible discrepancies before committing. Login/Register/Forgot-password have no direct reference screenshot — verify those instead for internal consistency with the same design system (colors, spacing, typography, component reuse) established by Tasks 2-3. Do not declare a screen task done merely because it type-checks.

---

## Task 1: Expo + TypeScript scaffold, dependencies, test tooling

**Files:**
- Create: `appReact/` (via `create-expo-app`)
- Modify: `appReact/package.json`
- Create: `appReact/jest.config.js`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a runnable Expo Router TypeScript project at `appReact/`, with `axios`, `zustand`, `expo-secure-store`, `expo-sqlite`, `expo-blur`, `expo-linear-gradient`, `@expo-google-fonts/inter`, `expo-font`, `react-native-pager-view` as dependencies, and `jest`, `jest-expo`, `@testing-library/react-native`, `axios-mock-adapter`, `@types/jest` as dev dependencies, with `npm test` running Jest. Every later task adds files under `appReact/src/` and `appReact/app/`.

- [ ] **Step 1: Scaffold the project**

```bash
cd C:\Budget_app
npx create-expo-app@latest appReact --template tabs
cd appReact
```
This template ships Expo Router already wired up with a `(tabs)` group, TypeScript, and ESLint. If prompted interactively, accept defaults.

- [ ] **Step 2: Inspect what the template generated**

```bash
ls
ls app
ls app/(tabs)
```
Note the exact file/folder names printed — later steps in this task reference `components/`, `constants/`, `hooks/` as typical template scaffolding, but confirm against what actually got created before deleting anything, since template contents can change between Expo versions.

- [ ] **Step 3: Remove template demo content**

Delete the sample screens/components the template ships for its own demo (parallax header, themed text/view, demo tab icons) but keep the routing/config skeleton:
```bash
rm -rf components constants hooks
rm -rf "app/(tabs)/explore.tsx"
```
Keep `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx` (these get rewritten in later tasks, not deleted), `app.json`, `tsconfig.json`, `package.json`, `babel.config.js`, `eslint.config.js`, `metro.config.js` if present.

- [ ] **Step 4: Add runtime dependencies**

```bash
npx expo install expo-secure-store expo-sqlite expo-blur expo-linear-gradient expo-font @expo-google-fonts/inter react-native-pager-view
npm install axios zustand
```
(`npx expo install` picks versions compatible with the installed Expo SDK; plain `npm install` is fine for pure-JS packages with no native code.)

- [ ] **Step 5: Add dev dependencies**

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest axios-mock-adapter
```

- [ ] **Step 6: Configure Jest**

Create `appReact/jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

Add a `test` script to `appReact/package.json` (inside `"scripts"`):
```json
"test": "jest --watchAll=false"
```

- [ ] **Step 7: Verify the scaffold**

```bash
npx tsc --noEmit
npx expo lint
npm test
```
Expected: TypeScript compiles with no errors, lint passes (template's own remaining files are lint-clean), and Jest reports "No tests found" (expected — no test files exist yet) without crashing.

- [ ] **Step 8: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "chore(appReact): scaffold Expo Router TypeScript project with core dependencies"
```

---

## Task 2: Theme system

**Files:**
- Create: `appReact/src/core/theme/colors.ts`
- Create: `appReact/src/core/theme/typography.ts`
- Create: `appReact/src/core/theme/glass.ts`
- Test: `appReact/src/core/theme/__tests__/colors.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Colors` (constants: `primary`, `primaryDark`, `primaryLight`, `background`, `surface`, `text`, `secondary`, `success`, `warning`, `danger`, `info`), `Typography` (style objects: `displayLarge`, `headlineMedium`, `titleLarge`, `bodyLarge`, `bodyMedium`, `labelSmall`), `glassSurfaceStyle({ radius?, opacity? })` returning a `ViewStyle`, `GLASS_BLUR_INTENSITY` (number, for `expo-blur`'s `intensity` prop). Every later UI task imports from here.

- [ ] **Step 1: Write the failing test**

Create `appReact/src/core/theme/__tests__/colors.test.ts`:
```ts
import { Colors } from '../colors';

describe('Colors', () => {
  it('uses the brand purple from the spec, not green', () => {
    expect(Colors.primary).toBe('#7C5CFF');
    expect(Colors.primary.toLowerCase()).not.toContain('00ff00');
  });

  it('defines the full palette used across the app', () => {
    expect(Colors.primaryDark).toBe('#5B3FD4');
    expect(Colors.primaryLight).toBe('#A98CFF');
    expect(Colors.background).toBe('#F7F5FF');
    expect(Colors.surface).toBe('#FFFFFF');
    expect(Colors.text).toBe('#17152A');
    expect(Colors.secondary).toBe('#77738A');
    expect(Colors.success).toBe('#35B77A');
    expect(Colors.warning).toBe('#FFB547');
    expect(Colors.danger).toBe('#FF5C73');
    expect(Colors.info).toBe('#5D8CFF');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd appReact
npm test -- colors.test.ts
```
Expected: FAIL — `../colors` doesn't exist yet.

- [ ] **Step 3: Create Colors**

Create `appReact/src/core/theme/colors.ts`:
```ts
export const Colors = {
  primary: '#7C5CFF',
  primaryDark: '#5B3FD4',
  primaryLight: '#A98CFF',

  background: '#F7F5FF',
  surface: '#FFFFFF',

  text: '#17152A',
  secondary: '#77738A',

  success: '#35B77A',
  warning: '#FFB547',
  danger: '#FF5C73',
  info: '#5D8CFF',
} as const;
```

- [ ] **Step 4: Create Typography**

Create `appReact/src/core/theme/typography.ts`:
```ts
import { TextStyle } from 'react-native';
import { Colors } from './colors';

const FONT_FAMILY = 'Inter_400Regular';
const FONT_FAMILY_SEMIBOLD = 'Inter_600SemiBold';
const FONT_FAMILY_BOLD = 'Inter_700Bold';

export const Typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
  },
  headlineMedium: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  titleLarge: {
    fontFamily: FONT_FAMILY_SEMIBOLD,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: Colors.text,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: Colors.text,
  },
  labelSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: Colors.secondary,
  },
};

export const INTER_FONT_FAMILIES = {
  regular: FONT_FAMILY,
  semibold: FONT_FAMILY_SEMIBOLD,
  bold: FONT_FAMILY_BOLD,
};
```

- [ ] **Step 5: Create the glass style helper**

Create `appReact/src/core/theme/glass.ts`:
```ts
import { ViewStyle } from 'react-native';
import { Colors } from './colors';

export const GLASS_BLUR_INTENSITY = 40;

export function glassSurfaceStyle(options: { radius?: number; opacity?: number } = {}): ViewStyle {
  const { radius = 24, opacity = 0.6 } = options;
  return {
    backgroundColor: `rgba(255,255,255,${opacity})`,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  };
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npm test -- colors.test.ts
```
Expected: PASS, 2 tests.

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add purple Liquid Glass theme system"
```

---

## Task 3: Shared UI components

**Files:**
- Create: `appReact/src/shared/components/GlassCard.tsx`
- Create: `appReact/src/shared/components/PrimaryButton.tsx`
- Create: `appReact/src/shared/components/GlassButton.tsx`
- Create: `appReact/src/shared/components/AppTextField.tsx`
- Create: `appReact/src/shared/components/LoadingState.tsx`
- Create: `appReact/src/shared/components/ErrorState.tsx`
- Create: `appReact/src/shared/components/EmptyState.tsx`
- Test: `appReact/src/shared/components/__tests__/sharedComponents.test.tsx`

**Interfaces:**
- Consumes: `Colors`, `glassSurfaceStyle`, `GLASS_BLUR_INTENSITY`, `Typography` (Task 2).
- Produces: `<GlassCard style? radius? opacity?>` (View), `<PrimaryButton label onPress isLoading? disabled?>`, `<GlassButton label icon onPress>` (icon: a `keyof typeof Ionicons.glyphMap` string, using `@expo/vector-icons` which ships with Expo), `<AppTextField label value onChangeText secureTextEntry? keyboardType? error?>`, `<LoadingState message?>`, `<ErrorState message onRetry?>`, `<EmptyState title message actionLabel? onAction?>`. Auth screens (Tasks 10-12) use `AppTextField` and `PrimaryButton` directly.

- [ ] **Step 1: Write the failing tests**

Create `appReact/src/shared/components/__tests__/sharedComponents.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GlassCard } from '../GlassCard';
import { PrimaryButton } from '../PrimaryButton';
import { LoadingState } from '../LoadingState';
import { ErrorState } from '../ErrorState';
import { EmptyState } from '../EmptyState';
import { Text } from 'react-native';

describe('GlassCard', () => {
  it('renders its children', () => {
    render(
      <GlassCard>
        <Text>hello</Text>
      </GlassCard>
    );
    expect(screen.getByText('hello')).toBeTruthy();
  });
});

describe('PrimaryButton', () => {
  it('shows a spinner and hides its label while loading', () => {
    render(<PrimaryButton label="Go" isLoading onPress={() => {}} />);
    expect(screen.queryByText('Go')).toBeNull();
    expect(screen.getByTestId('primary-button-spinner')).toBeTruthy();
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Go" isLoading onPress={onPress} />);
    fireEvent.press(screen.getByTestId('primary-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress when not loading', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Go" onPress={onPress} />);
    fireEvent.press(screen.getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('LoadingState', () => {
  it('shows an optional message', () => {
    render(<LoadingState message="Chargement..." />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('shows the message and calls onRetry when tapped', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="Oops" onRetry={onRetry} />);
    expect(screen.getByText('Oops')).toBeTruthy();
    fireEvent.press(screen.getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('shows an action button when provided', () => {
    render(
      <EmptyState
        title="Rien ici"
        message="Ajoutez quelque chose"
        actionLabel="Ajouter"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('Rien ici')).toBeTruthy();
    expect(screen.getByText('Ajouter')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd appReact
npm test -- sharedComponents.test.tsx
```
Expected: FAIL — none of the component files exist yet.

- [ ] **Step 3: Create GlassCard**

Create `appReact/src/shared/components/GlassCard.tsx`:
```tsx
import React, { PropsWithChildren } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { glassSurfaceStyle, GLASS_BLUR_INTENSITY } from '../../core/theme/glass';

interface GlassCardProps {
  style?: ViewStyle;
  radius?: number;
  opacity?: number;
}

export function GlassCard({ children, style, radius = 24, opacity = 0.6 }: PropsWithChildren<GlassCardProps>) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={GLASS_BLUR_INTENSITY} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[glassSurfaceStyle({ radius, opacity }), styles.content]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
});
```

- [ ] **Step 4: Create PrimaryButton**

Create `appReact/src/shared/components/PrimaryButton.tsx`:
```tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../core/theme/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, isLoading = false, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      testID="primary-button"
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}
      onPress={isLoading || disabled ? undefined : onPress}
    >
      {isLoading ? (
        <ActivityIndicator testID="primary-button-spinner" color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 5: Create GlassButton**

Create `appReact/src/shared/components/GlassButton.tsx`:
```tsx
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/theme/colors';
import { glassSurfaceStyle } from '../../core/theme/glass';

interface GlassButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function GlassButton({ label, icon, onPress }: GlassButtonProps) {
  return (
    <Pressable onPress={onPress} style={[glassSurfaceStyle({ radius: 18, opacity: 0.5 }), styles.container]}>
      <View style={styles.inner}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inner: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
  },
});
```

- [ ] **Step 6: Create AppTextField**

Create `appReact/src/shared/components/AppTextField.tsx`:
```tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Colors } from '../../core/theme/colors';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}

export function AppTextField({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  error,
}: AppTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={Colors.secondary}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
```

- [ ] **Step 7: Create LoadingState, ErrorState, EmptyState**

Create `appReact/src/shared/components/LoadingState.tsx`:
```tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../core/theme/colors';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.primary} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    marginTop: 12,
    color: Colors.secondary,
  },
});
```

Create `appReact/src/shared/components/ErrorState.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/theme/colors';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retry}>Réessayer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    marginTop: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
```

Create `appReact/src/shared/components/EmptyState.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/theme/colors';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={40} color={Colors.secondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: 4,
    color: Colors.secondary,
    textAlign: 'center',
  },
  action: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
npm test -- sharedComponents.test.tsx
```
Expected: PASS, 6 tests.

- [ ] **Step 9: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add reusable glass/state components"
```

---

## Task 4: Core services — constants, secure storage, API client

**Files:**
- Create: `appReact/src/core/constants/appConstants.ts`
- Create: `appReact/src/core/services/secureStorageService.ts`
- Create: `appReact/src/core/services/apiClient.ts`
- Test: `appReact/src/core/services/__tests__/secureStorageService.test.ts`
- Test: `appReact/src/core/services/__tests__/apiClient.test.ts`

**Interfaces:**
- Consumes: `API_BASE_URL` used internally by `apiClient.ts`.
- Produces: `API_BASE_URL`, `SECURE_STORAGE_TOKEN_KEY`, `SECURE_STORAGE_ONBOARDING_KEY` constants. `class SecureStorageService` with `saveToken(token: string): Promise<void>`, `readToken(): Promise<string | null>`, `clearToken(): Promise<void>`, `hasCompletedOnboarding(): Promise<boolean>`, `markOnboardingComplete(): Promise<void>`, constructible as `new SecureStorageService(storage?: SecureStoreAdapter)`. `createApiClient(secureStorage: SecureStorageService, http?: AxiosInstance): AxiosInstance`.

- [ ] **Step 1: Write the failing tests**

Create `appReact/src/core/constants/appConstants.ts` first (constants have no logic to test, needed by both test files below):
```ts
export const API_BASE_URL = 'https://budget-management-budgetappenv-ovz7ub.laravel.cloud/api';

export const SECURE_STORAGE_TOKEN_KEY = 'auth_token';
export const SECURE_STORAGE_ONBOARDING_KEY = 'onboarding_complete';
```

Create `appReact/src/core/services/__tests__/secureStorageService.test.ts`:
```ts
import { SecureStorageService } from '../secureStorageService';

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SecureStorageService', () => {
  it('saveToken writes the auth_token key', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    await service.saveToken('abc123');

    expect(storage.setItemAsync).toHaveBeenCalledWith('auth_token', 'abc123');
  });

  it('readToken returns null when nothing is stored', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    expect(await service.readToken()).toBeNull();
  });

  it('hasCompletedOnboarding returns false when the flag is absent', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    expect(await service.hasCompletedOnboarding()).toBe(false);
  });

  it('hasCompletedOnboarding returns true when the flag is set', async () => {
    const storage = createMockStorage();
    storage.getItemAsync.mockResolvedValue('true');
    const service = new SecureStorageService(storage);

    expect(await service.hasCompletedOnboarding()).toBe(true);
  });
});
```

Create `appReact/src/core/services/__tests__/apiClient.test.ts`:
```ts
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createApiClient } from '../apiClient';
import { SecureStorageService } from '../secureStorageService';
import { API_BASE_URL } from '../../constants/appConstants';

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('createApiClient', () => {
  it('targets the configured base URL', () => {
    const secureStorage = new SecureStorageService(createMockStorage());
    const client = createApiClient(secureStorage);

    expect(client.defaults.baseURL).toBe(API_BASE_URL);
  });

  it('attaches the bearer token to outgoing requests when one is stored', async () => {
    const storage = createMockStorage();
    storage.getItemAsync.mockResolvedValue('token-123');
    const secureStorage = new SecureStorageService(storage);
    const http = axios.create({ baseURL: API_BASE_URL });
    const mock = new MockAdapter(http);
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-123');
      return [200, { data: null, message: 'ok' }];
    });

    const client = createApiClient(secureStorage, http);
    await client.get('/ping');
  });

  it('clears the stored token when a request comes back 401', async () => {
    const secureStorage = new SecureStorageService(createMockStorage());
    const http = axios.create({ baseURL: API_BASE_URL });
    const mock = new MockAdapter(http);
    mock.onGet('/protected').reply(401, { message: 'Non authentifié.' });

    const client = createApiClient(secureStorage, http);
    await expect(client.get('/protected')).rejects.toBeTruthy();
    expect((secureStorage as any).storage.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd appReact
npm test -- secureStorageService.test.ts apiClient.test.ts
```
Expected: FAIL — `secureStorageService.ts`/`apiClient.ts` don't exist yet.

- [ ] **Step 3: Create SecureStorageService**

Create `appReact/src/core/services/secureStorageService.ts`:
```ts
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORAGE_TOKEN_KEY, SECURE_STORAGE_ONBOARDING_KEY } from '../constants/appConstants';

export interface SecureStoreAdapter {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

export class SecureStorageService {
  private storage: SecureStoreAdapter;

  constructor(storage: SecureStoreAdapter = SecureStore) {
    this.storage = storage;
  }

  saveToken(token: string): Promise<void> {
    return this.storage.setItemAsync(SECURE_STORAGE_TOKEN_KEY, token);
  }

  readToken(): Promise<string | null> {
    return this.storage.getItemAsync(SECURE_STORAGE_TOKEN_KEY);
  }

  clearToken(): Promise<void> {
    return this.storage.deleteItemAsync(SECURE_STORAGE_TOKEN_KEY);
  }

  async hasCompletedOnboarding(): Promise<boolean> {
    const value = await this.storage.getItemAsync(SECURE_STORAGE_ONBOARDING_KEY);
    return value === 'true';
  }

  markOnboardingComplete(): Promise<void> {
    return this.storage.setItemAsync(SECURE_STORAGE_ONBOARDING_KEY, 'true');
  }
}
```

- [ ] **Step 4: Create the API client factory**

Create `appReact/src/core/services/apiClient.ts`:
```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/appConstants';
import { SecureStorageService } from './secureStorageService';

export function createApiClient(secureStorage: SecureStorageService, http?: AxiosInstance): AxiosInstance {
  const client = http ?? axios.create({ baseURL: API_BASE_URL });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    config.headers.set('Accept', 'application/json');
    const token = await secureStorage.readToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await secureStorage.clearToken();
      }
      return Promise.reject(error);
    }
  );

  return client;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm test -- secureStorageService.test.ts apiClient.test.ts
```
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add secure storage service and API client"
```

---

## Task 5: Local database (expo-sqlite)

**Files:**
- Create: `appReact/src/core/database/appDatabase.ts`
- Create: `appReact/src/core/database/openAppDatabase.ts`
- Test: `appReact/src/core/database/__tests__/appDatabase.test.ts`

**Interfaces:**
- Consumes: `AppUser` (Task 6 defines the type this stores, but `AppDatabase` only needs its shape — declared locally here to avoid a forward dependency, and re-used as `AppUser` once Task 6 exists).
- Produces: `interface CachedUser { id: number; name: string; email: string; currency: string; avatar: string | null }`, `class AppDatabase` with `cacheUser(user: CachedUser): Promise<void>`, `getCachedUser(): Promise<CachedUser | null>`, `clearCachedUser(): Promise<void>`, constructible as `new AppDatabase(db: SqliteExecutor)`. `openAppDatabase(): Promise<AppDatabase>` (real, file-backed, for app startup). Task 6's `AuthRepository` depends on `AppDatabase`.

- [ ] **Step 1: Write the failing test**

Create `appReact/src/core/database/__tests__/appDatabase.test.ts`:
```ts
import { AppDatabase, SqliteExecutor, CachedUser } from '../appDatabase';

class InMemorySqliteExecutor implements SqliteExecutor {
  private row: CachedUser | null = null;

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.startsWith('INSERT')) {
      const [id, name, email, currency, avatar] = params as [number, string, string, string, string | null];
      this.row = { id, name, email, currency, avatar };
    } else if (sql.startsWith('DELETE')) {
      this.row = null;
    }
  }

  async getFirstAsync<T>(_sql: string): Promise<T | null> {
    return this.row as T | null;
  }
}

describe('AppDatabase', () => {
  it('cacheUser inserts and getCachedUser reads it back', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null });
    const user = await database.getCachedUser();

    expect(user).not.toBeNull();
    expect(user?.name).toBe('Jackson');
    expect(user?.currency).toBe('XOF');
    expect(user?.avatar).toBeNull();
  });

  it('cacheUser overwrites the previous cached user', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    await database.cacheUser({ id: 1, name: 'Jackson Updated', email: 'a@a.com', currency: 'XOF', avatar: null });

    const user = await database.getCachedUser();
    expect(user?.name).toBe('Jackson Updated');
  });

  it('clearCachedUser removes the cached row', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    await database.clearCachedUser();

    expect(await database.getCachedUser()).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd appReact
npm test -- appDatabase.test.ts
```
Expected: FAIL — `appDatabase.ts` doesn't exist yet.

- [ ] **Step 3: Create the database wrapper**

Create `appReact/src/core/database/appDatabase.ts`:
```ts
export interface CachedUser {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar: string | null;
}

/** The minimal subset of expo-sqlite's async `SQLiteDatabase` API this class needs — kept narrow so a fake can implement it in tests without a native module. */
export interface SqliteExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS local_users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT NOT NULL,
  avatar TEXT,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);`;

export class AppDatabase {
  private ready: Promise<void>;

  constructor(private db: SqliteExecutor) {
    this.ready = this.db.execAsync(CREATE_TABLE_SQL);
  }

  async cacheUser(user: CachedUser): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_users (id, name, email, currency, avatar, sync_state) VALUES (?, ?, ?, ?, ?, 'synced');`,
      [user.id, user.name, user.email, user.currency, user.avatar]
    );
  }

  async getCachedUser(): Promise<CachedUser | null> {
    await this.ready;
    return this.db.getFirstAsync<CachedUser>(
      `SELECT id, name, email, currency, avatar FROM local_users LIMIT 1;`
    );
  }

  async clearCachedUser(): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_users;`);
  }
}
```

- [ ] **Step 4: Create the real, file-backed opener**

Create `appReact/src/core/database/openAppDatabase.ts`:
```ts
import * as SQLite from 'expo-sqlite';
import { AppDatabase } from './appDatabase';

export async function openAppDatabase(): Promise<AppDatabase> {
  const db = await SQLite.openDatabaseAsync('finance_app.db');
  return new AppDatabase(db);
}
```
(`expo-sqlite`'s `SQLiteDatabase` implements `execAsync`/`runAsync`/`getFirstAsync` with a superset of signatures compatible with `SqliteExecutor`, so this satisfies the interface structurally — no adapter needed.)

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm test -- appDatabase.test.ts
```
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add local SQLite user cache via expo-sqlite"
```

---

## Task 6: Auth data layer + Zustand store

**Files:**
- Create: `appReact/src/shared/models/appUser.ts`
- Create: `appReact/src/features/auth/data/authApi.ts`
- Create: `appReact/src/features/auth/data/authRepository.ts`
- Create: `appReact/src/features/auth/state/authStore.ts`
- Create: `appReact/src/features/auth/state/authStoreInstance.ts`
- Test: `appReact/src/features/auth/data/__tests__/authRepository.test.ts`
- Test: `appReact/src/features/auth/state/__tests__/authStore.test.ts`

**Interfaces:**
- Consumes: `SecureStorageService`, `createApiClient` (Task 4), `AppDatabase`, `CachedUser` (Task 5).
- Produces: `AppUser { id, name, email, currency, avatar }` + `appUserFromJson(json): AppUser`. `AuthApiError` (Error subclass with `fieldErrors: Record<string, string[]>`). `class AuthApi` with `register/login/logout/forgotPassword/resetPassword`. `class AuthRepository` with `register/login/logout/forgotPassword/resetPassword/hasValidSession/cachedUser`. `createAuthStore(repository: AuthRepository)` returning a Zustand store hook typed `UseBoundStore<StoreApi<AuthState>>` where `AuthState` has `status: 'unknown' | 'unauthenticated' | 'authenticated'`, `user: AppUser | null`, `isSubmitting: boolean`, `error: string | null`, and actions `bootstrap/register/login/logout/clearError`. `useAuthStore` — the wired-up singleton instance every screen imports. Every screen task (8-12) and the navigation shell (Task 7) depend on `useAuthStore`.

- [ ] **Step 1: Write the failing tests**

Create `appReact/src/shared/models/appUser.ts` first (needed by both test files below):
```ts
export interface AppUser {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar: string | null;
}

export function appUserFromJson(json: any): AppUser {
  return {
    id: json.id,
    name: json.name,
    email: json.email,
    currency: json.currency,
    avatar: json.avatar ?? null,
  };
}
```

Create `appReact/src/features/auth/data/__tests__/authRepository.test.ts`:
```ts
import { AppDatabase, SqliteExecutor, CachedUser } from '../../../../core/database/appDatabase';
import { SecureStorageService } from '../../../../core/services/secureStorageService';
import { AuthApi, AuthApiError } from '../authApi';
import { AuthRepository } from '../authRepository';

class InMemorySqliteExecutor implements SqliteExecutor {
  private row: CachedUser | null = null;
  async execAsync(): Promise<void> {}
  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.startsWith('INSERT')) {
      const [id, name, email, currency, avatar] = params as [number, string, string, string, string | null];
      this.row = { id, name, email, currency, avatar };
    } else if (sql.startsWith('DELETE')) {
      this.row = null;
    }
  }
  async getFirstAsync<T>(): Promise<T | null> {
    return this.row as T | null;
  }
}

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthRepository', () => {
  it('login persists the token and caches the user locally', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    const authApi = { login: jest.fn(), register: jest.fn(), logout: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn() } as unknown as AuthApi;
    (authApi.login as jest.Mock).mockResolvedValue({
      token: 'token-123',
      user: { id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null },
    });
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    const user = await repository.login({ email: 'jackson@example.com', password: 'password123' });

    expect(user.name).toBe('Jackson');
    expect(storage.setItemAsync).toHaveBeenCalledWith('auth_token', 'token-123');
    const cached = await database.getCachedUser();
    expect(cached?.email).toBe('jackson@example.com');
  });

  it('hasValidSession reflects whether a token is stored', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    const authApi = {} as AuthApi;
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    expect(await repository.hasValidSession()).toBe(false);

    storage.getItemAsync.mockResolvedValue('a-token');
    expect(await repository.hasValidSession()).toBe(true);
  });

  it('logout clears the token and cached user even if the API call fails', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    const authApi = { logout: jest.fn().mockRejectedValue(new AuthApiError('network error')) } as unknown as AuthApi;
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    await expect(repository.logout()).rejects.toBeInstanceOf(AuthApiError);

    expect(storage.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(await database.getCachedUser()).toBeNull();
  });
});
```

Create `appReact/src/features/auth/state/__tests__/authStore.test.ts`:
```ts
import { createAuthStore } from '../authStore';
import { AuthRepository } from '../../data/authRepository';
import { AppUser } from '../../../../shared/models/appUser';

function makeRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    hasValidSession: jest.fn().mockResolvedValue(false),
    cachedUser: jest.fn().mockResolvedValue(null),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    ...overrides,
  } as unknown as AuthRepository;
}

const user: AppUser = { id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null };

describe('authStore', () => {
  it('bootstrap resolves to unauthenticated when there is no session', async () => {
    const store = createAuthStore(makeRepository());

    await store.getState().bootstrap();

    expect(store.getState().status).toBe('unauthenticated');
  });

  it('bootstrap resolves to authenticated when a session and cached user exist', async () => {
    const repository = makeRepository({
      hasValidSession: jest.fn().mockResolvedValue(true),
      cachedUser: jest.fn().mockResolvedValue(user),
    });
    const store = createAuthStore(repository);

    await store.getState().bootstrap();

    expect(store.getState().status).toBe('authenticated');
    expect(store.getState().user).toEqual(user);
  });

  it('login sets status to authenticated on success', async () => {
    const repository = makeRepository({ login: jest.fn().mockResolvedValue(user) });
    const store = createAuthStore(repository);

    await store.getState().login({ email: 'jackson@example.com', password: 'password123' });

    expect(store.getState().status).toBe('authenticated');
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('login surfaces an error message and does not authenticate on failure', async () => {
    const repository = makeRepository({ login: jest.fn().mockRejectedValue(new Error('Identifiants invalides.')) });
    const store = createAuthStore(repository);

    await expect(store.getState().login({ email: 'x@x.com', password: 'wrong' })).rejects.toThrow();

    expect(store.getState().status).not.toBe('authenticated');
    expect(store.getState().error).toBe('Identifiants invalides.');
  });

  it('logout resets to unauthenticated', async () => {
    const repository = makeRepository({
      hasValidSession: jest.fn().mockResolvedValue(true),
      cachedUser: jest.fn().mockResolvedValue(user),
    });
    const store = createAuthStore(repository);
    await store.getState().bootstrap();

    await store.getState().logout();

    expect(store.getState().status).toBe('unauthenticated');
    expect(store.getState().user).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd appReact
npm test -- authRepository.test.ts authStore.test.ts
```
Expected: FAIL — `authApi.ts`, `authRepository.ts`, `authStore.ts` don't exist yet.

- [ ] **Step 3: Create AuthApi**

Create `appReact/src/features/auth/data/authApi.ts`:
```ts
import { AxiosInstance, AxiosError } from 'axios';

export class AuthApiError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.fieldErrors = fieldErrors;
  }
}

interface AuthSessionPayload {
  token: string;
  user: any;
}

export class AuthApi {
  constructor(private http: AxiosInstance) {}

  register(params: { name: string; email: string; password: string; passwordConfirmation: string }): Promise<AuthSessionPayload> {
    return this.post('/register', {
      name: params.name,
      email: params.email,
      password: params.password,
      password_confirmation: params.passwordConfirmation,
    });
  }

  login(params: { email: string; password: string }): Promise<AuthSessionPayload> {
    return this.post('/login', { email: params.email, password: params.password });
  }

  async logout(): Promise<void> {
    await this.post('/logout', {});
  }

  async forgotPassword(email: string): Promise<void> {
    await this.post('/forgot-password', { email });
  }

  async resetPassword(params: { token: string; email: string; password: string; passwordConfirmation: string }): Promise<void> {
    await this.post('/reset-password', {
      token: params.token,
      email: params.email,
      password: params.password,
      password_confirmation: params.passwordConfirmation,
    });
  }

  private async post(path: string, data: Record<string, unknown>): Promise<any> {
    try {
      const response = await this.http.post(path, data);
      return response.data?.data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const body = error.response?.data;
      if (body) {
        throw new AuthApiError(body.message ?? 'Une erreur est survenue.', body.errors ?? {});
      }
      throw new AuthApiError('Impossible de contacter le serveur. Vérifiez votre connexion Internet.');
    }
  }
}
```

- [ ] **Step 4: Create AuthRepository**

Create `appReact/src/features/auth/data/authRepository.ts`:
```ts
import { AppDatabase } from '../../../core/database/appDatabase';
import { SecureStorageService } from '../../../core/services/secureStorageService';
import { AppUser, appUserFromJson } from '../../../shared/models/appUser';
import { AuthApi } from './authApi';

export class AuthRepository {
  constructor(
    private authApi: AuthApi,
    private secureStorage: SecureStorageService,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async register(params: { name: string; email: string; password: string; passwordConfirmation: string }): Promise<AppUser> {
    const result = await this.authApi.register(params);
    return this.persistSession(result);
  }

  async login(params: { email: string; password: string }): Promise<AppUser> {
    const result = await this.authApi.login(params);
    return this.persistSession(result);
  }

  async logout(): Promise<void> {
    try {
      await this.authApi.logout();
    } finally {
      await this.secureStorage.clearToken();
      const database = await this.getDatabase();
      await database.clearCachedUser();
    }
  }

  forgotPassword(email: string): Promise<void> {
    return this.authApi.forgotPassword(email);
  }

  resetPassword(params: { token: string; email: string; password: string; passwordConfirmation: string }): Promise<void> {
    return this.authApi.resetPassword(params);
  }

  async hasValidSession(): Promise<boolean> {
    const token = await this.secureStorage.readToken();
    return token !== null;
  }

  async cachedUser(): Promise<AppUser | null> {
    const database = await this.getDatabase();
    return database.getCachedUser();
  }

  private async persistSession(result: { token: string; user: any }): Promise<AppUser> {
    const user = appUserFromJson(result.user);
    await this.secureStorage.saveToken(result.token);
    const database = await this.getDatabase();
    await database.cacheUser({ id: user.id, name: user.name, email: user.email, currency: user.currency, avatar: user.avatar });
    return user;
  }
}
```

- [ ] **Step 5: Create the Zustand auth store**

Create `appReact/src/features/auth/state/authStore.ts`:
```ts
import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppUser } from '../../../shared/models/appUser';
import { AuthRepository } from '../data/authRepository';

export type AuthStatus = 'unknown' | 'unauthenticated' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: AppUser | null;
  isSubmitting: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  register: (params: { name: string; email: string; password: string; passwordConfirmation: string }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function createAuthStore(repository: AuthRepository): UseBoundStore<StoreApi<AuthState>> {
  return create<AuthState>((set) => ({
    status: 'unknown',
    user: null,
    isSubmitting: false,
    error: null,

    bootstrap: async () => {
      const hasSession = await repository.hasValidSession();
      if (!hasSession) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      const cached = await repository.cachedUser();
      if (!cached) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      set({ status: 'authenticated', user: cached });
    },

    register: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const user = await repository.register(params);
        set({ status: 'authenticated', user, isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    login: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const user = await repository.login(params);
        set({ status: 'authenticated', user, isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    logout: async () => {
      await repository.logout();
      set({ status: 'unauthenticated', user: null });
    },

    clearError: () => set({ error: null }),
  }));
}
```

- [ ] **Step 6: Wire the singleton instance**

Create `appReact/src/features/auth/state/authStoreInstance.ts`:
```ts
import { createApiClient } from '../../../core/services/apiClient';
import { SecureStorageService } from '../../../core/services/secureStorageService';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { AuthApi } from '../data/authApi';
import { AuthRepository } from '../data/authRepository';
import { createAuthStore } from './authStore';

export const secureStorageService = new SecureStorageService();
const apiClient = createApiClient(secureStorageService);
const authApi = new AuthApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const authRepository = new AuthRepository(authApi, secureStorageService, getDatabase);

export const useAuthStore = createAuthStore(authRepository);
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test -- authRepository.test.ts authStore.test.ts
```
Expected: PASS, 8 tests.

- [ ] **Step 8: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add auth data layer and Zustand state management"
```

---

## Task 7: Navigation shell — root layout, tabs, bottom nav + quick actions

**Files:**
- Create: `appReact/app/_layout.tsx`
- Create: `appReact/app/(tabs)/_layout.tsx`
- Create: `appReact/app/(tabs)/home.tsx`
- Create: `appReact/app/(tabs)/statistics.tsx`
- Create: `appReact/app/(tabs)/budget.tsx`
- Create: `appReact/app/(tabs)/profile.tsx`
- Create: `appReact/src/shared/components/AppBottomNav.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6), `Colors`, `Typography` (Task 2), `GlassCard`, `PrimaryButton` (Task 3).
- Produces: the root `Stack` (unauthenticated group `login`/`register`/`forgot-password`/`onboarding`/index-splash, and the `(tabs)` group), `AppBottomNav` (custom tab bar with a centered floating `+`), and four placeholder tab screens. Task 8 (Splash) references this shell's routes (`/(tabs)/home`, `/login`, `/onboarding`) to redirect into. The Profile placeholder has a working "Se déconnecter" button wired to `useAuthStore().logout()` since the Task 13 golden path needs it.

- [ ] **Step 1: Create the custom bottom nav**

Create `appReact/src/shared/components/AppBottomNav.tsx`:
```tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../../core/theme/colors';
import { glassSurfaceStyle } from '../../core/theme/glass';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  statistics: 'stats-chart',
  budget: 'people',
  profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  home: 'Accueil',
  statistics: 'Statistiques',
  budget: 'Budget',
  profile: 'Profil',
};

export function AppBottomNav({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={[glassSurfaceStyle({ radius: 28, opacity: 0.85 }), styles.bar]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = TAB_ICONS[route.name] ?? 'ellipse';
          const label = TAB_LABELS[route.name] ?? route.name;
          return (
            <Pressable key={route.key} style={styles.tab} onPress={() => navigation.navigate(route.name)}>
              <Ionicons name={icon} size={22} color={focused ? Colors.primary : Colors.secondary} />
              <Text style={[styles.label, { color: focused ? Colors.primary : Colors.secondary }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={styles.fab}
        onPress={() =>
          Alert.alert('Actions rapides', 'Dépense / Revenu / Transfert', [
            { text: 'Dépense', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Revenu', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Transfert', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Annuler', style: 'cancel' },
          ])
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
  },
  label: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    top: -28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
```

- [ ] **Step 2: Create the tabs layout**

Create `appReact/app/(tabs)/_layout.tsx`:
```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { AppBottomNav } from '../../src/shared/components/AppBottomNav';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppBottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="statistics" options={{ title: 'Statistiques' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create the placeholder tab screens**

Create `appReact/app/(tabs)/home.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Accueil</Text>
      <Text style={[Typography.bodyMedium, styles.hint]}>Le tableau de bord arrive dans une prochaine phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
});
```

Create `appReact/app/(tabs)/statistics.tsx` (same structure, title "Statistiques"):
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Statistiques</Text>
      <Text style={[Typography.bodyMedium, styles.hint]}>Les statistiques arrivent dans une prochaine phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
});
```

Create `appReact/app/(tabs)/budget.tsx` (title "Budget"):
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';

export default function BudgetScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Budget</Text>
      <Text style={[Typography.bodyMedium, styles.hint]}>La gestion des budgets arrive dans une prochaine phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
});
```

Create `appReact/app/(tabs)/profile.tsx` (with the working logout button):
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';
import { PrimaryButton } from '../../src/shared/components/PrimaryButton';
import { useAuthStore } from '../../src/features/auth/state/authStoreInstance';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Profil</Text>
      {user ? <Text style={[Typography.bodyMedium, styles.hint]}>{user.email}</Text> : null}
      <View style={styles.spacer} />
      <PrimaryButton label="Se déconnecter" onPress={handleLogout} isLoading={isLoggingOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
  spacer: { height: 24 },
});
```

- [ ] **Step 4: Create the root layout**

Create `appReact/app/_layout.tsx`:
```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View } from 'react-native';
import { Colors } from '../src/core/theme/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```
(`index.tsx`, `onboarding.tsx`, `login.tsx`, `register.tsx`, `forgot-password.tsx` are created in Tasks 8-12 — until then this file references routes that don't exist yet, matching the Flutter plan's Task 12 precedent of a router file that forward-references screens built in later tasks. `npx tsc --noEmit` will not error on this, since `Stack.Screen name` is a plain string, not a typed import — the app itself won't run correctly until those routes exist, and this task's own verification step below only checks the `(tabs)` shell.)

- [ ] **Step 5: Verify the tabs shell renders**

Temporarily rename `appReact/app/_layout.tsx` is not needed — instead, verify by type-checking and running the dev server pointed straight at the tabs group:
```bash
cd appReact
npx tsc --noEmit
```
Expected: no errors in any file created this task (errors about missing `index`/`onboarding`/`login`/`register`/`forgot-password` route files are expected and will disappear as Tasks 8-12 land — do not fix them here).

- [ ] **Step 6: Mandatory visual verification against the reference screenshots**

Use the `run` skill to start the Expo dev server (`npx expo start`) and launch on an Android emulator or iOS simulator (native modules used elsewhere in the app, like `expo-sqlite`, aren't available on Expo web, so verify on a simulator/emulator, not `--web`). Since `index.tsx`/`login.tsx` don't exist yet, temporarily navigate directly to `/(tabs)/home` in the running app (or comment out the other `Stack.Screen` lines and set `initialRouteName="(tabs)"` on the `Stack` in `_layout.tsx` for this check only, reverting after) to view the tab shell.

Capture the running Home tab and bottom nav, then open `appReact/ressource_img/ChatGPT Image 29 août 2026, 02_46_08.png` (the Home screen in the reference) and compare:
- bottom nav has exactly 4 icons + a centered floating `+` raised above the bar, purple circular background;
- nav bar is a translucent rounded glass pill, not a plain opaque bar;
- selected tab icon/label is purple, unselected are grey;
- overall background is the light lavender `#F7F5FF`, not white.

Fix any visible discrepancy in `AppBottomNav.tsx` before committing. Revert any temporary `_layout.tsx` changes made only for this check.

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add tab navigation shell with bottom nav and quick actions"
```

---

## Task 8: Splash screen + app entry point

**Files:**
- Create: `appReact/app/index.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6), `secureStorageService` (Task 6), `Colors`, `Typography` (Task 2).
- Produces: the `/` route — on mount, calls `bootstrap()`, then redirects to `/(tabs)/home` if authenticated, `/login` if a completed-onboarding flag is set but unauthenticated, or `/onboarding` otherwise. Tasks 9-12 are the redirect targets.

- [ ] **Step 1: Create the splash/entry screen**

Create `appReact/app/index.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { useAuthStore, secureStorageService } from '../src/features/auth/state/authStoreInstance';

export default function SplashScreen() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const status = useAuthStore((state) => state.status);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    bootstrap();
    secureStorageService.hasCompletedOnboarding().then((value) => {
      setOnboardingComplete(value);
      setCheckedOnboarding(true);
    });
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'unknown' || !checkedOnboarding) return;

    if (status === 'authenticated') {
      router.replace('/(tabs)/home');
      return;
    }

    router.replace(onboardingComplete ? '/login' : '/onboarding');
  }, [status, checkedOnboarding, onboardingComplete]);

  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoGlyph}>💜</Text>
      </View>
      <Text style={[Typography.headlineMedium, styles.title]}>Finance App</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoGlyph: { fontSize: 32 },
  title: { color: '#FFFFFF' },
});
```

- [ ] **Step 2: Type-check**

```bash
cd appReact
npx tsc --noEmit
```
Expected: no new errors introduced by this file (errors about the still-missing `onboarding`/`login`/`register`/`forgot-password` routes referenced from `_layout.tsx` are pre-existing from Task 7 and resolve as those tasks land).

- [ ] **Step 3: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add splash screen and session-aware app entry point"
```

---

## Task 9: Onboarding screens

**Files:**
- Create: `appReact/app/onboarding.tsx`

**Interfaces:**
- Consumes: `secureStorageService` (Task 6), `Colors`, `Typography` (Task 2), `PrimaryButton` (Task 3), `react-native-pager-view`.
- Produces: the `/onboarding` route — 3 swipeable pages with the exact MASTER_SPEC §9 copy, "Passer"/"Continuer"/"Commencer" actions; on completion marks onboarding complete and navigates to `/login`.

- [ ] **Step 1: Create the onboarding screen**

Create `appReact/app/onboarding.tsx`:
```tsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { secureStorageService } from '../src/features/auth/state/authStoreInstance';

const PAGES = [
  { title: 'Prenez le contrôle de votre argent', subtitle: 'Suivez facilement vos revenus et vos dépenses.' },
  {
    title: 'Comprenez où va votre argent',
    subtitle: 'Visualisez vos habitudes de dépenses grâce à des statistiques simples.',
  },
  {
    title: 'Atteignez vos objectifs',
    subtitle: 'Épargnez intelligemment et gardez toujours une longueur d\u2019avance.',
  },
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLastPage = page === PAGES.length - 1;

  async function finish() {
    await secureStorageService.markOnboardingComplete();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {PAGES.map((item) => (
          <View key={item.title} style={styles.page}>
            <View style={styles.illustration} />
            <Text style={[Typography.headlineMedium, styles.title]}>{item.title}</Text>
            <Text style={[Typography.bodyLarge, styles.subtitle]}>{item.subtitle}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dots}>
        {PAGES.map((item, index) => (
          <View key={item.title} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {!isLastPage ? (
          <Text style={styles.skip} onPress={finish}>
            Passer
          </Text>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
        <View style={styles.primaryAction}>
          <PrimaryButton
            label={isLastPage ? 'Commencer' : 'Continuer'}
            onPress={() => {
              if (isLastPage) {
                finish();
              } else {
                pagerRef.current?.setPage(page + 1);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pager: { flex: 1 },
  page: { width, alignItems: 'center', justifyContent: 'center', padding: 32 },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
    marginBottom: 32,
  },
  title: { textAlign: 'center', marginBottom: 12 },
  subtitle: { textAlign: 'center', color: Colors.secondary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  skip: { color: Colors.secondary, fontSize: 16, minWidth: 60 },
  skipPlaceholder: { minWidth: 60 },
  primaryAction: { flex: 1 },
});
```

- [ ] **Step 2: Type-check**

```bash
cd appReact
npx tsc --noEmit
```
Expected: no errors from this file (the remaining "missing route" errors from `login`/`register`/`forgot-password` are expected until Tasks 10-12 land).

- [ ] **Step 3: Mandatory visual verification against the reference screenshot**

Use the `run` skill to launch the app on a simulator/emulator, navigate to `/onboarding`, and compare the first page against the left-most phone in `appReact/ressource_img/ChatGPT Image 29 août 2026, 02_46_08.png`:
- large bold title, generous line height, left-aligned in the reference — this implementation centers it, which is an acceptable Liquid-Glass-consistent variation, but check the title/subtitle font sizes and spacing feel proportionate (title noticeably larger than subtitle, subtitle in the muted secondary grey);
- "Commencer" button is a solid purple pill matching `PrimaryButton`'s existing radius/height, not a default-looking button;
- page indicator dots present near the bottom;
- background is the light lavender tint, not stark white.

Fix any visible discrepancy before committing.

- [ ] **Step 4: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add onboarding screens"
```

---

## Task 10: Login screen

**Files:**
- Create: `appReact/app/login.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6), `AppTextField`, `PrimaryButton`, `ErrorState` (Task 3), `Colors`, `Typography` (Task 2).
- Produces: the `/login` route with email/password fields, "Se connecter" primary action, "Mot de passe oublié ?" and "Créer un compte" links; on success navigates to `/(tabs)/home`.

- [ ] **Step 1: Create the login screen**

Create `appReact/app/login.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAuthStore } from '../src/features/auth/state/authStoreInstance';

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit() {
    try {
      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[Typography.headlineMedium, styles.title]}>Se connecter</Text>

      <AppTextField label="Email" value={email} onChangeText={(v) => { setEmail(v); clearError(); }} keyboardType="email-address" />
      <AppTextField label="Mot de passe" value={password} onChangeText={(v) => { setPassword(v); clearError(); }} secureTextEntry />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Se connecter" onPress={handleSubmit} isLoading={isSubmitting} />

      <Text style={styles.link} onPress={() => router.push('/forgot-password')}>
        Mot de passe oublié ?
      </Text>
      <Text style={styles.link} onPress={() => router.push('/register')}>
        Créer un compte
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 96 },
  title: { marginBottom: 24 },
  error: { color: Colors.danger, marginBottom: 16 },
  link: { color: Colors.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Type-check**

```bash
cd appReact
npx tsc --noEmit
```
Expected: only the "missing `register`/`forgot-password` route" errors remain (resolved by Tasks 11-12).

- [ ] **Step 3: Visual consistency check**

No direct reference screenshot exists for Login. Launch the app (`run` skill) at `/login` and verify it visually matches the established system from Tasks 2-3: `AppTextField` inputs (rounded, filled, no visible border unless in error), `PrimaryButton` (solid purple pill, 52pt tall), consistent spacing/typography with Onboarding. Fix any component misuse before committing.

- [ ] **Step 4: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add login screen wired to the auth store"
```

---

## Task 11: Register screen

**Files:**
- Create: `appReact/app/register.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6), `AppTextField`, `PrimaryButton` (Task 3), `Colors`, `Typography` (Task 2).
- Produces: the `/register` route with name/email/password/confirm-password fields and a "Créer mon compte" primary action; on success navigates to `/(tabs)/home`.

- [ ] **Step 1: Create the register screen**

Create `appReact/app/register.tsx`:
```tsx
import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAuthStore } from '../src/features/auth/state/authStoreInstance';

export default function RegisterScreen() {
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  async function handleSubmit() {
    try {
      await register({ name, email, password, passwordConfirmation });
      router.replace('/(tabs)/home');
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[Typography.headlineMedium, styles.title]}>Créer un compte</Text>

      <AppTextField label="Nom" value={name} onChangeText={(v) => { setName(v); clearError(); }} />
      <AppTextField label="Email" value={email} onChangeText={(v) => { setEmail(v); clearError(); }} keyboardType="email-address" />
      <AppTextField label="Mot de passe" value={password} onChangeText={(v) => { setPassword(v); clearError(); }} secureTextEntry />
      <AppTextField
        label="Confirmer le mot de passe"
        value={passwordConfirmation}
        onChangeText={(v) => { setPasswordConfirmation(v); clearError(); }}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Créer mon compte" onPress={handleSubmit} isLoading={isSubmitting} />

      <Text style={styles.link} onPress={() => router.back()}>
        Déjà un compte ? Se connecter
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 96 },
  title: { marginBottom: 24 },
  error: { color: Colors.danger, marginBottom: 16 },
  link: { color: Colors.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Type-check**

```bash
cd appReact
npx tsc --noEmit
```
Expected: only the "missing `forgot-password` route" error remains (resolved by Task 12).

- [ ] **Step 3: Visual consistency check**

Same check as Task 10, Step 3 — verify against the shared component system, not a screenshot (no reference exists for this screen).

- [ ] **Step 4: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add register screen wired to the auth store"
```

---

## Task 12: Forgot password screen

**Files:**
- Create: `appReact/app/forgot-password.tsx`

**Interfaces:**
- Consumes: `useAuthStore` — extended in this task with a `forgotPassword` action mirroring `login`/`register`'s pattern (Task 6 exposed `AuthRepository.forgotPassword`, but not yet a store action — this task adds it) —, `AppTextField`, `PrimaryButton` (Task 3), `Colors`, `Typography` (Task 2).
- Produces: the `/forgot-password` route with an email field and a submit action; shows the backend's own confirmation message on success.

- [ ] **Step 1: Add a `forgotPassword` action to the auth store**

Modify `appReact/src/features/auth/state/authStore.ts` — add `forgotPassword` to the `AuthState` interface:
```ts
  forgotPassword: (email: string) => Promise<void>;
```
and to the store implementation, alongside the existing `logout`/`clearError` actions:
```ts
    forgotPassword: async (email) => {
      set({ isSubmitting: true, error: null });
      try {
        await repository.forgotPassword(email);
        set({ isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },
```

- [ ] **Step 2: Create the forgot-password screen**

Create `appReact/app/forgot-password.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAuthStore } from '../src/features/auth/state/authStoreInstance';

export default function ForgotPasswordScreen() {
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[Typography.headlineMedium, styles.title]}>Mot de passe oublié ?</Text>

      {sent ? (
        <View>
          <Text style={styles.confirmation}>Un lien de réinitialisation a été envoyé.</Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>
            Retour à la connexion
          </Text>
        </View>
      ) : (
        <>
          <AppTextField label="Email" value={email} onChangeText={(v) => { setEmail(v); clearError(); }} keyboardType="email-address" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Envoyer le lien de réinitialisation" onPress={handleSubmit} isLoading={isSubmitting} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 96 },
  title: { marginBottom: 24 },
  error: { color: Colors.danger, marginBottom: 16 },
  confirmation: { color: Colors.success, marginBottom: 16, fontSize: 16 },
  link: { color: Colors.primary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
```

- [ ] **Step 3: Type-check**

```bash
cd appReact
npx tsc --noEmit
```
Expected: no errors — every route `app/_layout.tsx` references now exists.

- [ ] **Step 4: Run the full unit test suite**

```bash
npm test
```
Expected: all suites from Tasks 2-6 still pass (this task didn't touch anything they cover except adding one action to `authStore.ts`, which their existing tests don't exercise — no regressions expected).

- [ ] **Step 5: Visual consistency check**

Same check as Task 10, Step 3.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add appReact
git commit -m "feat(appReact): add forgot password screen"
```

---

## Task 13: End-to-end verification

**Files:** none created — this task runs the app on a real emulator/simulator and confirms the full loop works, then does a final full-repo verification pass.

**Interfaces:**
- Consumes: everything from Tasks 1-12.
- Produces: a verified working appReact Phase 1 (register → login → tab shell → logout → login again → cold-restart session restore), and confirmation that lint, type-check, and the test suite are all green together.

- [ ] **Step 1: Run the app on an Android emulator or iOS simulator**

```bash
cd C:\Budget_app\appReact
npx expo start
```
Use the `run` skill to launch it on an emulator/simulator (not `--web` — `expo-sqlite` and `expo-secure-store` require a native runtime). This talks to the real deployed Laravel API at `API_BASE_URL`; no local backend process is needed since it's already on Laravel Cloud.

- [ ] **Step 2: Walk the golden path manually**

1. App opens on the purple gradient Splash screen, then Onboarding (three swipeable pages, purple background, copy matches MASTER_SPEC §9).
2. Tap "Commencer" → lands on Login.
3. Tap "Créer un compte" → fill in a real name/email/password/confirm → tap "Créer mon compte".
4. Expected: a real network request hits the Laravel Cloud API, the app navigates to the tab shell (Accueil/Statistiques/Budget/Profil) with the centered `+` FAB visible above the bar.
5. Tap `+` → action sheet shows Dépense/Revenu/Transfert → tapping any of them shows "Disponible dans une prochaine phase." and dismisses.
6. Tap the Profil tab → tap "Se déconnecter" → app navigates back to Login.
7. Log back in with the same email/password used in step 3 → confirm it succeeds and lands on the tab shell again (proves the backend persisted the user and the login endpoint works, independent of the register flow).
8. Force-close and relaunch the app (or reload it) → confirm it goes straight to the tab shell without showing Login (proves the cached token in `expo-secure-store` + the `expo-sqlite`-cached user + the Splash redirect logic work across a cold start).

If any step fails, fix the root cause in the relevant task's files (don't patch around it here) and re-run that task's own tests before continuing.

- [ ] **Step 3: Run the full verification suite**

```bash
cd C:\Budget_app\appReact
npx tsc --noEmit
npx expo lint
npm test
```
Expected: no type errors, lint passes, all Jest suites from Tasks 2-6 pass, 0 failures.

- [ ] **Step 4: Final mandatory visual pass**

Re-open both reference images (`appReact/ressource_img/ChatGPT Image 29 août 2026, 02_46_08.png` and `...02_59_24.png`) side-by-side with screenshots of the running Onboarding and tab-shell screens taken in Step 1-2. Re-check proportions, spacing, typography, blur, borders, shadows, icons, bottom navigation, purple gradients, and hierarchy one more time now that the full flow runs together, not just each screen in isolation. Budget and Profile are still placeholders in this phase — verify only that their empty-state text and the shared bottom nav/background match the same design system as Home/Statistics, not their (not-yet-built) reference content.

- [ ] **Step 5: Final commit**

```bash
cd C:\Budget_app
git status
git add -A
git commit -m "chore(appReact): verify Phase 1 end-to-end (register/login/logout, cold-start session restore)"
```
(If `git status` shows nothing to commit because every task already committed its own changes, skip this — that's fine, it means the history is already clean.)

---

## What's next

Phase 1 is done when Task 13 passes. Phase 2 (Core finance — accounts, categories, income, expenses, transactions, dashboard) gets its own implementation plan at that point, written against whatever Phase 1 actually produced — matching how `mobile/`'s own roadmap defers Phase 2+ planning until the prior phase is verified (see `docs/superpowers/specs/2026-08-28-finance-app-design.md` §8).
