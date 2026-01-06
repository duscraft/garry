package com.duscraft.garry.i18n

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class AppLocale(val code: String) {
    FRENCH("fr"),
    ENGLISH("en")
}

object LocaleManager {
    var currentLocale by mutableStateOf(AppLocale.FRENCH)
        private set
    
    val strings: AppStrings
        get() = when (currentLocale) {
            AppLocale.FRENCH -> FrenchStrings
            AppLocale.ENGLISH -> EnglishStrings
        }
    
    fun setLocale(locale: AppLocale) {
        currentLocale = locale
    }
    
    fun toggleLocale() {
        currentLocale = when (currentLocale) {
            AppLocale.FRENCH -> AppLocale.ENGLISH
            AppLocale.ENGLISH -> AppLocale.FRENCH
        }
    }
}
