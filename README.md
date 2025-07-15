# how to get started

- note: this is an Expo React Native project. instructions below are for loading the app on an iOS device (or simulator) throuhg a **local** development build.

## 1. install Xcode, Xcode CLI tools, Watchman (optionally: an iOS simulator)

<https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=physical&mode=development-build&buildEnv=local>

## 2. install dependencies

```bash
npm install
```

## 3. start and keep Metro (JS bundler) running

keeping it running **in its own terminal** means the next step doesn't require a restart = not re-bunding from scratch = way faster

```bash
npx expo start
```

## 4. (optionally, later) use release build

this builds a faster app binary with a pre-bundled JS bundle but the build process itself can be much slower (and you don't get fast refresh)

NOTE: open a **new terminal window** for either option

- OPTION 1: personal device build

  ```bash
  xcrun xctrace list devices

  npx expo run:ios --device [insert-device]
  // recommendation: add an npm script to run the app on your personal device (e.g., `ios:MS`)
  ```

- OPTION 2: ios simulator

  ```bash
  npx expo run:ios
  // shortcut: `ios:sim`
  ```

## 5. (only when adding/removing/upgrading **native** iOS dependencies) reset CocoaPods cache

```bash
rm -rf Pods Podfile.lock && pod install
```
