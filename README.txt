VoiceText Android (Capacitor 8)

This project preserves the VoiceText interface and uses the native Android text-to-speech plugin when running inside the Android app. Available voices and languages depend on the speech engine and voice packs installed on the phone. Offline speech works only for locally installed offline voices.

Termux setup (run from this project directory):
  export JAVA_HOME=$PREFIX/lib/jvm/java-17-openjdk
  export ANDROID_HOME=$HOME/android-sdk
  export ANDROID_SDK_ROOT=$ANDROID_HOME
  export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
  npm install
  npm run build
  npx cap add android
  npx cap sync android

Then attempt a debug build:
  cd android
  ./gradlew assembleDebug

APK output if the build succeeds:
  app/build/outputs/apk/debug/app-debug.apk

Termux/Android build caveat:
The official Android Gradle build tools are primarily packaged for desktop Linux. On ARM64 Android/Termux, AAPT2 or other host executables may fail because Android uses Bionic rather than glibc. If Gradle reports an AAPT2 executable/ELF error, do not repeatedly reinstall SDK packages; the build needs a Termux-compatible AAPT2 workaround or a Linux/CI build environment.
