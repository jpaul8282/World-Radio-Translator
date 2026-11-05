# ProGuard / R8 Security Hardening & Google Play Store Compliance

> **Defense-in-depth protection, anti-tamper, and symbolication configuration for Android distribution.**

---

## 1. Overview & Threat Model

When publishing **Remix: World Radio Translator** as an Android application (via Trusted Web Activity, Capacitor, React Native, or native Android App Bundle `.aab`), the application binary is exposed to client-side reverse engineering, APK decompilation, and binary tampering.

Our ProGuard / R8 configuration (`proguard-rules.pro`) achieves three primary security and stability goals:
1. **Symbolication for Play Console**: Embeds full native debug symbols (`ndk { debugSymbolLevel 'FULL' }`) and preserves stack trace line numbers (`-keepattributes SourceFile,LineNumberTable`) so that crashes and **ANRs (Application Not Responding)** are de-obfuscated in the Google Play Console.
2. **Code Shrinking & Obfuscation**: Renames non-public classes, methods, and fields into cryptic identifiers to thwart decompilers (JADX, CFR, Bytecode Viewer).
3. **Interface Integrity**: Protects critical reflective bridges (WebView JavaScript Interfaces, Firebase Authentication, WebRTC, ExoPlayer audio decoders, and OkHttp WebSocket listeners) from aggressive optimization breakage.

---

## 2. Hardened ProGuard Configuration (`proguard-rules.pro`)

```proguard
# ==============================================================================
# 1. Stack Trace & Line Number Preservation (Required for Play Console Retrace)
# ==============================================================================
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Exceptions,InnerClasses,Signature,Deprecated,*Annotation*,EnclosingMethod

# ==============================================================================
# 2. Native Code JNI & Shared Libraries (.so)
# ==============================================================================
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve Audio Codecs & Media Engines
-keep class com.google.android.exoplayer2.** { *; }
-keep interface com.google.android.exoplayer2.** { *; }
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-keep class org.webrtc.** { *; }

# ==============================================================================
# 3. Android WebView Bridge & XSS Defense
# ==============================================================================
# Keep only explicitly annotated JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
}

-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, int);
    public boolean *(android.webkit.WebView, java.lang.String, java.lang.String, android.webkit.JsResult);
}

# ==============================================================================
# 4. Firebase Authentication, Firestore & Google Play Services
# ==============================================================================
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ==============================================================================
# 5. OkHttp, WebSockets & Network Stream Security
# ==============================================================================
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

-keepclassmembers class * extends okhttp3.WebSocketListener {
    public void onOpen(okhttp3.WebSocket, okhttp3.Response);
    public void onMessage(okhttp3.WebSocket, java.lang.String);
    public void onMessage(okhttp3.WebSocket, okio.ByteString);
    public void onClosing(okhttp3.WebSocket, int, java.lang.String);
    public void onClosed(okhttp3.WebSocket, int, java.lang.String);
    public void onFailure(okhttp3.WebSocket, java.lang.Throwable, okhttp3.Response);
}

# ==============================================================================
# 6. Optimization Flags
# ==============================================================================
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-repackageclasses ''
-dontnote **
-ignorewarnings
```

---

## 3. Resolving the Play Store Native Debug Symbols Warning

When Google Play Console shows:  
*"This App Bundle contains native code, and you've not uploaded debug symbols..."*

Add this directive to your Android Gradle release build type (`app/build.gradle` or `app/build.gradle.kts`):

```groovy
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

            // CRITICAL: Automatically embeds unstripped native symbols in App Bundle (.aab)
            ndk {
                debugSymbolLevel 'FULL'
            }
        }
    }
}
```

Google Play extracts the native debug symbols automatically, unlocking detailed symbolicated C/C++ crash reports and ANR traces without requiring manual zip uploads.
