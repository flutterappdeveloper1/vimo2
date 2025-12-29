# Build Android APK for Vimo

This guide explains how to wrap the hosted React app into an Android APK using a WebView.

## Prerequisites
1. **Android Studio** installed.
2. The web app must be deployed (e.g., Firebase Hosting) and have a public URL (e.g., `https://your-project.web.app`).

## Option 1: Using Capacitor (Recommended)

1. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```
   * App name: `Vimo`
   * Package ID: `com.vimo.app`

2. **Build the Web App:**
   ```bash
   npm run build
   ```

3. **Add Android Platform:**
   ```bash
   npx cap add android
   ```

4. **Sync:**
   ```bash
   npx cap sync
   ```

5. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```
   * In Android Studio, build the APK: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

## Option 2: Native Android WebView (Manual)

1. Create a new Android Project in Android Studio ("Empty Activity").
2. **Permissions:** Add to `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   ```
3. **Layout:** In `activity_main.xml`, add a `<WebView>` filling the parent.
4. **MainActivity.java**:
   ```java
   WebView myWebView = (WebView) findViewById(R.id.webview);
   WebSettings webSettings = myWebView.getSettings();
   webSettings.setJavaScriptEnabled(true);
   webSettings.setDomStorageEnabled(true);
   webSettings.setMediaPlaybackRequiresUserGesture(false);
   
   // Enable WebRTC permissions
   myWebView.setWebChromeClient(new WebChromeClient() {
       @Override
       public void onPermissionRequest(final PermissionRequest request) {
           request.grant(request.getResources());
       }
   });

   myWebView.loadUrl("https://your-project.firebaseapp.com");
   ```

## Customization

* **App Name:** `res/values/strings.xml` -> `<string name="app_name">Vimo</string>`
* **Icon:** Right-click `res` -> New -> Image Asset -> Select your logo.
* **Package Name:** Set during project creation or refactor in `AndroidManifest.xml`.
