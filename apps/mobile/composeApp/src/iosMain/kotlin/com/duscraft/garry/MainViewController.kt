package com.duscraft.garry

import androidx.compose.ui.window.ComposeUIViewController
import platform.Foundation.NSDocumentDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSUserDomainMask

fun MainViewController() = ComposeUIViewController { App() }

actual fun dataStorePath(): String {
    val documentDirectory = NSFileManager.defaultManager.URLForDirectory(
        directory = NSDocumentDirectory,
        inDomain = NSUserDomainMask,
        appropriateForURL = null,
        create = false,
        error = null
    )
    return "${documentDirectory?.path}/garry_prefs.preferences_pb"
}
