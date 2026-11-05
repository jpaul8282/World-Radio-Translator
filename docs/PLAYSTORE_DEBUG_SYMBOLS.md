# Google Play Store: Native Debug Symbols & ProGuard / R8 Documentation

> **Resolution Guide for Play Console Warning:**  
> *"This App Bundle contains native code, and you've not uploaded debug symbols. We recommend you upload a symbol file to make your crashes and ANRs easier to analyze and debug."*

---

## 1. Why Google Play Console Flags This

When you build an Android App Bundle (`.aab`) containing native C/C++ libraries (e.g., `.so` files for audio codecs, WebRTC, FFmpeg, ExoPlayer, or Chromium WebView engines), the compiled binaries strip unneeded debug symbol tables to reduce binary download size. 

Without symbols, when a crash or **ANR (Application Not Responding)** occurs on a user's device, the Google Play Console crash report displays raw memory addresses (e.g. `pc 000000000004b288 libaudiostreamer.so`) instead of human-readable function names, filenames, and line numbers.

Uploading **Native Debug Symbols** allows Google Play to automatically symbolicate stack traces so you can diagnose ANRs and crashes instantly.

---

## 2. Automated Fix: Gradle Build Configuration

The recommended and easiest method is to configure the **Android Gradle Plugin (AGP 4.1+)** to automatically extract and package full native debug symbols directly into your `.aab` file during `bundleRelease`.

In your Android project's `app/build.gradle` (or `app/build.gradle.kts`):

### Groovy DSL (`app/build.gradle`)
```groovy
android {
    compileSdk 34

    defaultConfig {
        applicationId "com.remixradio.worldradiotranslator"
        minSdk 24
        targetSdk 34
        versionCode 12
        versionName "1.2.0"

        ndk {
            // Target standard 64-bit and 32-bit architectures
            abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86'
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

            // CRITICAL: Generates full native debug symbols inside the App Bundle (.aab)
            ndk {
                debugSymbolLevel 'FULL'
            }
        }
    }
}
```

### Kotlin DSL (`app/build.gradle.kts`)
```kotlin
android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // CRITICAL: Generates full native debug symbols inside the App Bundle (.aab)
            ndk {
                debugSymbolLevel = "FULL"
            }
        }
    }
}
```

> **Note on `debugSymbolLevel` options:**
> - `'FULL'`: Generates all debug tables (function names, line numbers, local variables). Recommended by Google Play.
> - `'SYMBOL_TABLE'`: Generates function names only (smaller bundle size).
> - `'NONE'`: No debug symbols.

When `debugSymbolLevel 'FULL'` is enabled, the Android Gradle Plugin creates the debug symbols zip and embeds it into:
`BUNDLE-METADATA/com.android.tools.build.debugsymbols/<architecture>/` inside your `.aab`. Google Play will extract it automatically with zero manual uploads needed!

---

## 3. Manual Upload of `native-debug-symbols.zip`

If you are using an existing `.aab` or build pipeline that cannot rebuild with `debugSymbolLevel 'FULL'`:

### Step 1: Locate or Generate the Native Symbols
The unstripped `.so` files are generated during the release build in:
- `app/build/intermediates/merged_native_libs/release/out/lib/` or
- `app/build/intermediates/stripped_native_libs/release/out/lib/`

Zip the directory structure preserving the ABI folders:
```bash
cd app/build/intermediates/merged_native_libs/release/out/lib
zip -r native-debug-symbols.zip arm64-v8a/ armeabi-v7a/ x86/ x86_64/
```

### Step 2: Upload to Google Play Console
1. Open the [Google Play Console](https://play.google.com/console).
2. Select your app -> navigate to **Release** -> **App bundle explorer**.
3. Select the release version/artifact from the dropdown.
4. Click the **Downloads** tab.
5. Scroll down to **Assets** -> Locate **Native debug symbols**.
6. Click the **Upload** icon (up arrow) on the right and select your `native-debug-symbols.zip`.

---

## 4. ProGuard / R8 Obfuscation Mapping (`mapping.txt`)

To symbolicate Java and Kotlin stack traces (in addition to native C/C++ `.so` crashes):

### Gradle Configuration
Ensure your `proguard-rules.pro` includes line number and source file preservations:
```proguard
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
```

### Locate `mapping.txt`
After building release with `minifyEnabled true`:
`app/build/outputs/mapping/release/mapping.txt`

### Upload `mapping.txt` to Play Console
1. In Google Play Console, go to **App bundle explorer** -> select version.
2. Click **Downloads** tab -> scroll to **Assets**.
3. Next to **ReTrace mapping file**, click **Upload** and upload `mapping.txt`.
*(Note: If you build with Android Gradle Plugin 4.1+ and `uploadCrashlyticsMappingFile`, mapping files are automatically uploaded via CI/CD).*

---

## 5. Verification Checklist

| Step | Requirement | Status |
| :--- | :--- | :--- |
| 1 | ProGuard rules file exists (`proguard-rules.pro`) | Verified |
| 2 | Line numbers preserved (`-keepattributes SourceFile,LineNumberTable`) | Verified |
| 3 | `ndk { debugSymbolLevel 'FULL' }` configured in release build type | Documented |
| 4 | Native methods & JNI interfaces retained | Verified |
| 5 | Firebase & WebSockets preserved from stripping | Verified |
