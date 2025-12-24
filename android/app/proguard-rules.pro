# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ==================== React Native Core ====================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Keep native methods
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# Hermes engine
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ==================== React Native Reanimated ====================
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# ==================== React Native Gesture Handler ====================
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# ==================== React Native Screens ====================
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# ==================== React Native SVG ====================
-keep class com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

# ==================== Mapbox ====================
-keep class com.mapbox.** { *; }
-keep class com.rnmapbox.** { *; }
-dontwarn com.mapbox.**
-dontwarn com.rnmapbox.**

# ==================== React Native Vision Camera ====================
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# ==================== React Native Video ====================
-keep class com.brentvatne.react.** { *; }
-keep class com.brentvatne.exoplayer.** { *; }
-dontwarn com.brentvatne.**

# ExoPlayer (used by react-native-video)
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**

# ==================== React Native WebView ====================
-keep class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# ==================== React Native Async Storage ====================
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# ==================== React Native Image Picker ====================
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# ==================== React Native Permissions ====================
-keep class com.zoontek.rnpermissions.** { *; }
-dontwarn com.zoontek.rnpermissions.**

# ==================== React Native Safe Area Context ====================
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.th3rdwave.safeareacontext.**

# ==================== React Native Pager View ====================
-keep class com.reactnativepagerview.** { *; }
-dontwarn com.reactnativepagerview.**

# ==================== React Native TTS ====================
-keep class net.no_mad.tts.** { *; }
-dontwarn net.no_mad.tts.**

# ==================== React Native Sound Player ====================
-keep class com.johnsonsu.rnsoundplayer.** { *; }
-dontwarn com.johnsonsu.rnsoundplayer.**

# ==================== React Native Vector Icons ====================
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# ==================== React Native FS ====================
-keep class com.rnfs.** { *; }
-dontwarn com.rnfs.**

# ==================== RN Fetch Blob ====================
-keep class com.RNFetchBlob.** { *; }
-dontwarn com.RNFetchBlob.**

# ==================== React Native Geolocation ====================
-keep class com.reactnativecommunity.geolocation.** { *; }
-dontwarn com.reactnativecommunity.geolocation.**

# ==================== OkHttp (used by many libraries) ====================
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ==================== Kotlin ====================
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ==================== AndroidX ====================
-keep class androidx.** { *; }
-dontwarn androidx.**

# ==================== General Rules ====================
# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}