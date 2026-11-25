package com.cvinfotech.petfriendlyplaces

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.microsoft.codepush.react.CodePush

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
      // Revopush OTA: on every start the JS bundle comes from CodePush. It is the app's built-in
      // bundle until an update is installed, then the installed update. Debug builds still use
      // Metro. Keep this after `packageList`: building the package list creates the CodePush
      // instance that getJSBundleFile() needs.
      jsBundleFilePath = CodePush.getJSBundleFile(),
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
