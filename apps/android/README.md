# Android app

The web app in a WebView, wrapped by [Capacitor](https://capacitorjs.com).
There is no Android-specific UI: `capacitor.config.ts` points `webDir` at
`../web/build`, so the app ships exactly the bundle Cloudflare serves.

Published as [com.vtempest.automata](https://play.google.com/store/apps/details?id=com.vtempest.automata).

## Build

```bash
bun run sync       # build the web app, then copy it into the Android project
bun run build      # sync, then assemble a debug APK
bun run release    # sync, then bundle a signed release AAB
bun run open       # open the project in Android Studio
```

`bun run build` needs a JDK and the Android SDK (`ANDROID_HOME`); `bun run sync`
needs neither, so CI can verify the copy step on its own.

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## What is checked in

The Gradle project under `android/`, the launcher icons and splash screens under
`resources/`, and the Capacitor config. The synced web assets
(`android/app/src/main/assets/public`) are build output and are ignored.

## Changing the app

- **The UI** is [`packages/complexity-automata-svelte`](../../packages/complexity-automata-svelte)
- **The version** is `versionCode`/`versionName` in `android/app/build.gradle`
- **The name** is `app_name` in `android/app/src/main/res/values/strings.xml`
- **Icons and splash** are regenerated from `resources/` with
  `bunx @capacitor/assets generate --android`

The page is laid out for a phone: the controls sit inside the safe area, the
grid takes the rest, and `overscroll-behavior: none` keeps pull-to-refresh from
fighting with drawing on the grid.

## First-time setup

The project was created with:

```bash
bun i @capacitor/core @capacitor/android
bun i -D @capacitor/cli
bunx cap init
bunx cap add android
```
