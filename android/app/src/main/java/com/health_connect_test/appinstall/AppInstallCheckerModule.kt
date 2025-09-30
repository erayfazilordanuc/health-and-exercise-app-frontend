package com.health_connect_test.appinstall

import android.content.pm.PackageManager
import com.facebook.react.bridge.*

class AppInstallCheckerModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppInstallChecker"

  @ReactMethod
  fun isInstalled(packageName: String, promise: Promise) {
    try {
      reactContext.packageManager.getApplicationInfo(packageName, 0)
      promise.resolve(true)
    } catch (e: PackageManager.NameNotFoundException) {
      promise.resolve(false)
    }
  }
}