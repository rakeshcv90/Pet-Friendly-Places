# PetFriendly Project Walkthrough

The **PetFriendly** application has been fully scaffolded following your exact architectural requirements.

## 🏗️ Project Architecture & Setup

- **React Native:** Initialized with version `0.84.1` with the New Architecture and Hermes enabled.
- **Language:** Fully built in pure JavaScript (`.js`), without TypeScript as requested.
- **Dependencies:** React Navigation, Zustand, MMKV, and Axios have been correctly installed and configured.

## 📂 Folder Structure

We implemented the extensive `src/` folder structure exactly as requested:
- `assets/` (images, icons, fonts, animations)
- `components/` (reusable UI components)
- `config/` (environment variables, constants)
- `hooks/` (custom hooks)
- `navigation/` (navigation hierarchy)
- `screens/` (UI screens)
- `services/` (API client, storage, permissions)
- `store/` (Zustand state slices)
- `theme/` (centralized colors, typography, spacing)
- `utils/` (helper functions)

## 🎨 Theme & Components

- **Theme System:** `src/theme/` contains `colors.js`, `typography.js`, `spacing.js`, and `dimensions.js`. Colors are completely centralized.
- **Reusable Components:** `Button`, `Input`, `ScreenContainer`, `PetCard` were created in `src/components/` utilizing the theme system to avoid hardcoded styles.

## 🗃️ Services & State

- **Storage:** `src/services/storage/storage.js` uses `react-native-mmkv` with a centralized interface for `getItem` and `setItem`.
- **API:** `src/services/api/client.js` configures an Axios instance that fetches the base URL from the environment and uses an interceptor to attach the MMKV authentication token.
- **Zustand Store:** `src/store/index.js` combines the `authSlice`, `petSlice`, and `userSlice` into a single global state management system. 

## 🗺️ Navigation Architecture

The navigation stack supports dynamic authentication rendering:
- `RootNavigator` checks the user authentication state (from `MMKV` & `Zustand`) while displaying the `SplashScreen`.
- Unauthenticated users are routed to `AuthNavigator`.
- Authenticated users are routed to `AppNavigator` containing the `MainTabNavigator`.

## 🚀 How to Run the App

1. **Install iOS Pods (macOS only):**
```bash
cd ios
pod install
cd ..
```

2. **Start the Metro Bundler:**
```bash
npm start
```

3. **Run on Android:**
```bash
npm run android
```

4. **Run on iOS:**
```bash
npm run ios
```
