# ==============================================================================
# ProGuard & R8 Configuration Rules for Remix: World Radio Translator
# Target: Android App Bundle (.aab) with Native Debug Symbols & Audio/Network Bridges
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Line Numbers & Stack Trace Preservations (Required for Play Console Symbol De-obfuscation)
# ------------------------------------------------------------------------------
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Exceptions,InnerClasses,Signature,Deprecated,
                SourceFile,LineNumberTable,*Annotation*,EnclosingMethod

# ------------------------------------------------------------------------------
# 2. Native Code JNI Interfaces & Shared Libraries (.so)
# ------------------------------------------------------------------------------
# Preserve all native methods and JNI callback classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve Web Audio / WebRTC / ExoPlayer / FFmpeg audio decoder bindings
-keep class com.google.android.exoplayer2.** { *; }
-keep interface com.google.android.exoplayer2.** { *; }
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-keep class org.webrtc.** { *; }

# ------------------------------------------------------------------------------
# 3. Android WebView & JavaScriptInterface Bridge
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# 4. Firebase Authentication, Firestore & Google Play Services
# ------------------------------------------------------------------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Preserve Firebase Auth tokens and serializable objects
-keepattributes *Annotation*
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ------------------------------------------------------------------------------
# 5. OkHttp, WebSockets & Real-time Network Streams
# ------------------------------------------------------------------------------
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# WebSocket listeners for live audio & speech translation streams
-keepclassmembers class * extends okhttp3.WebSocketListener {
    public void onOpen(okhttp3.WebSocket, okhttp3.Response);
    public void onMessage(okhttp3.WebSocket, java.lang.String);
    public void onMessage(okhttp3.WebSocket, okio.ByteString);
    public void onClosing(okhttp3.WebSocket, int, java.lang.String);
    public void onClosed(okhttp3.WebSocket, int, java.lang.String);
    public void onFailure(okhttp3.WebSocket, java.lang.Throwable, okhttp3.Response);
}

# ------------------------------------------------------------------------------
# 6. JSON Data Models & Serialization (GSON / Jackson / Moshi)
# ------------------------------------------------------------------------------
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Suppress harmless warnings for non-critical classes
-dontnote **
-ignorewarnings
