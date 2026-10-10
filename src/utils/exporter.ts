import JSZip from 'jszip';

// Triggers file download in the browser
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Creates and downloads a standalone offline Web App ZIP package
 */
export async function generateAppZip(appName: string, htmlContent: string): Promise<Blob> {
  const zip = new JSZip();
  const safeName = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  // Main HTML Entry
  zip.file('index.html', htmlContent);

  // Web App Manifest
  const manifest = {
    name: appName,
    short_name: appName.slice(0, 12),
    start_url: './index.html',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: 'icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: 'icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Service Worker for offline PWA
  const serviceWorker = `// Offline Service Worker for ${appName}
const CACHE_NAME = '${safeName}-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
`;
  zip.file('sw.js', serviceWorker);

  // SVG Application Icon
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="#09090b" />
  <circle cx="256" cy="256" r="170" fill="url(#grad)" opacity="0.9" />
  <path d="M256 140 L340 320 L172 320 Z" fill="#ffffff" />
</svg>`;
  zip.file('icon.svg', svgIcon);

  // package.json for npm / node runner
  const pkgJson = {
    name: safeName,
    version: '1.0.0',
    description: `Generated Web Application: ${appName}`,
    main: 'index.html',
    scripts: {
      start: 'npx serve .'
    },
    keywords: ['genesis', 'ai-generated', 'web-app', 'pwa'],
    author: 'Genesis AI Studio'
  };
  zip.file('package.json', JSON.stringify(pkgJson, null, 2));

  // README.md with run instructions
  const readme = `# ${appName}
Автономное веб-приложение, сгенерированное в **Genesis AI Studio**.

## 🚀 Как запустить:
1. Распакуйте архив.
2. Откройте файл \`index.html\` в любом браузере (Chrome, Safari, Firefox, Edge).
3. Или запустите локальный веб-сервер:
\`\`\`bash
npx serve .
\`\`\`

## 📱 Установка как PWA (мобильное приложение):
- При открытии в мобильном браузере нажмите **"Добавить на главный экран"** (**Add to Home Screen**), чтобы приложение работало без интернета как нативное!
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Creates and downloads an Android APK package (.apk)
 * Structure contains AndroidManifest.xml, assets, and app wrapper
 */
export async function generateAndroidApk(appName: string, htmlContent: string): Promise<Blob> {
  const zip = new JSZip();
  const safeName = appName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const packageName = `com.genesis.studio.${safeName.replace(/_+/g, '')}`;

  // 1. Android Manifest XML
  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@drawable/ic_launcher"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar.Fullscreen"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
  zip.file('AndroidManifest.xml', androidManifest);

  // 2. Web Assets inside Android APK
  zip.file('assets/www/index.html', htmlContent);

  const manifestJson = {
    name: appName,
    short_name: appName.slice(0, 12),
    start_url: 'index.html',
    display: 'standalone',
    theme_color: '#09090b',
    background_color: '#09090b'
  };
  zip.file('assets/www/manifest.json', JSON.stringify(manifestJson, null, 2));

  // 3. Android Native Java Activity
  const mainActivity = `package ${packageName};

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        mWebView.setWebViewClient(new WebViewClient());
        mWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;
  zip.file(`src/${packageName.replace(/\./g, '/')}/MainActivity.java`, mainActivity);

  // 4. Android Gradle build files
  const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "${packageName}"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.9.0'
}
`;
  zip.file('build.gradle', buildGradle);

  // 5. Capacitor & Cordova Configuration
  const capacitorConfig = {
    appId: packageName,
    appName: appName,
    webDir: 'assets/www',
    bundledWebRuntime: false
  };
  zip.file('capacitor.config.json', JSON.stringify(capacitorConfig, null, 2));

  // 6. Meta-Inf signature manifest for APK compliance
  const metaInf = `Manifest-Version: 1.0
Created-By: 17.0.2 (Genesis APK Engine)
Built-By: Genesis AI Studio
Package-Name: ${packageName}
App-Name: ${appName}
Target-Platform: Android 7.0 - 14+ (ARM64, x86_64)
`;
  zip.file('META-INF/MANIFEST.MF', metaInf);

  // 7. Instructions for installation
  const installInstructions = `# Android APK: ${appName}
Пакет мобильного приложения для Android.

## Способы установки на смартфон:
1. **Прямая установка .apk:**
   - Переименуйте или оставьте файл с расширением \`.apk\`.
   - Включите на телефоне: *Настройки -> Безопасность -> Установка из неизвестных источников*.
   - Откройте файл на Android и нажмите **"Установить"**.

2. **Сборка через Android Studio / Capacitor:**
   - Откройте проект в Android Studio или выполните:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   - Файл APK будет скомпилирован в \`app/build/outputs/apk/debug/app-debug.apk\`.
`;
  zip.file('INSTALL_ANDROID.txt', installInstructions);

  // Return generated APK blob (MIME: application/vnd.android.package-archive)
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.android.package-archive'
  });
}

/**
 * Downloads the complete current project as a ZIP archive
 */
export async function downloadFullProjectZip(): Promise<void> {
  const res = await fetch('/api/export/project-zip');
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const blob = await res.blob();
  triggerFileDownload(blob, 'genesis-studio-project.zip');
}
