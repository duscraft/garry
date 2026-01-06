package com.duscraft.garry.i18n

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf

data class AppStrings(
    // Auth
    val login: String,
    val register: String,
    val email: String,
    val password: String,
    val fullName: String,
    val loginButton: String,
    val registerButton: String,
    val loginError: String,
    val registerError: String,
    val noAccount: String,
    val hasAccount: String,
    val biometricAuth: String,
    val biometricFirst: String,
    
    // Dashboard
    val dashboard: String,
    val logout: String,
    val addWarranty: String,
    val yourWarranties: String,
    val noWarranties: String,
    val noWarrantiesHint: String,
    
    // Stats
    val totalWarranties: String,
    val activeWarranties: String,
    val expiringSoon: String,
    val expired: String,
    
    // Warranty Form
    val productName: String,
    val brand: String,
    val category: String,
    val selectCategory: String,
    val purchaseDate: String,
    val purchaseDateFormat: String,
    val warrantyDuration: String,
    val store: String,
    val notesOptional: String,
    val save: String,
    val fillAllFields: String,
    val saveError: String,
    
    // Warranty Details
    val details: String,
    val back: String,
    val edit: String,
    val delete: String,
    val warrantyEnd: String,
    val duration: String,
    val months: String,
    val notes: String,
    val loadError: String,
    
    // Delete Dialog
    val deleteTitle: String,
    val deleteConfirm: String,
    val cancel: String,
    
    // Status
    val statusValid: String,
    val statusExpiring: String,
    val statusExpired: String,
    
    // Categories
    val categoryAppliances: String,
    val categoryHighTech: String,
    val categoryAudioVideo: String,
    val categoryHome: String,
    val categoryDiy: String,
    val categoryFashion: String,
    val categorySports: String,
    val categoryOther: String,
    
    // Language
    val languageFr: String,
    val languageEn: String
)

val FrenchStrings = AppStrings(
    // Auth
    login = "Connexion",
    register = "Inscription",
    email = "Email",
    password = "Mot de passe",
    fullName = "Nom complet",
    loginButton = "Se connecter",
    registerButton = "S'inscrire",
    loginError = "Echec de la connexion. Verifiez vos identifiants.",
    registerError = "Echec de l'inscription. Veuillez reessayer.",
    noAccount = "Pas encore de compte ? S'inscrire",
    hasAccount = "Deja un compte ? Se connecter",
    biometricAuth = "Authentification biometrique",
    biometricFirst = "Connectez-vous d'abord avec mot de passe",
    
    // Dashboard
    dashboard = "Tableau de bord",
    logout = "Deconnexion",
    addWarranty = "Ajouter une garantie",
    yourWarranties = "Vos garanties",
    noWarranties = "Aucune garantie enregistree",
    noWarrantiesHint = "Appuyez sur + pour ajouter votre premiere garantie",
    
    // Stats
    totalWarranties = "Total",
    activeWarranties = "Actives",
    expiringSoon = "Expire bientot",
    expired = "Expirees",
    
    // Warranty Form
    productName = "Nom du produit",
    brand = "Marque",
    category = "Categorie",
    selectCategory = "Selectionner une categorie",
    purchaseDate = "Date d'achat",
    purchaseDateFormat = "Date d'achat (YYYY-MM-DD)",
    warrantyDuration = "Duree de garantie (mois)",
    store = "Magasin",
    notesOptional = "Notes (optionnel)",
    save = "Enregistrer",
    fillAllFields = "Veuillez remplir tous les champs obligatoires",
    saveError = "Erreur lors de l'enregistrement",
    
    // Warranty Details
    details = "Details",
    back = "Retour",
    edit = "Modifier",
    delete = "Supprimer",
    warrantyEnd = "Fin de garantie",
    duration = "Duree",
    months = "mois",
    notes = "Notes",
    loadError = "Impossible de charger les details de la garantie",
    
    // Delete Dialog
    deleteTitle = "Supprimer la garantie ?",
    deleteConfirm = "Cette action est irreversible. Voulez-vous vraiment supprimer cette garantie ?",
    cancel = "Annuler",
    
    // Status
    statusValid = "Valide",
    statusExpiring = "Expire bientot",
    statusExpired = "Expiree",
    
    // Categories
    categoryAppliances = "Electromenager",
    categoryHighTech = "High-Tech",
    categoryAudioVideo = "Audio & Video",
    categoryHome = "Maison",
    categoryDiy = "Bricolage",
    categoryFashion = "Mode",
    categorySports = "Sport",
    categoryOther = "Autre",
    
    // Language
    languageFr = "Francais",
    languageEn = "English"
)

val EnglishStrings = AppStrings(
    // Auth
    login = "Login",
    register = "Sign up",
    email = "Email",
    password = "Password",
    fullName = "Full name",
    loginButton = "Sign in",
    registerButton = "Sign up",
    loginError = "Login failed. Check your credentials.",
    registerError = "Registration failed. Please try again.",
    noAccount = "No account yet? Sign up",
    hasAccount = "Already have an account? Sign in",
    biometricAuth = "Biometric authentication",
    biometricFirst = "Please sign in with password first",
    
    // Dashboard
    dashboard = "Dashboard",
    logout = "Logout",
    addWarranty = "Add warranty",
    yourWarranties = "Your warranties",
    noWarranties = "No warranties registered",
    noWarrantiesHint = "Tap + to add your first warranty",
    
    // Stats
    totalWarranties = "Total",
    activeWarranties = "Active",
    expiringSoon = "Expiring soon",
    expired = "Expired",
    
    // Warranty Form
    productName = "Product name",
    brand = "Brand",
    category = "Category",
    selectCategory = "Select a category",
    purchaseDate = "Purchase date",
    purchaseDateFormat = "Purchase date (YYYY-MM-DD)",
    warrantyDuration = "Warranty duration (months)",
    store = "Store",
    notesOptional = "Notes (optional)",
    save = "Save",
    fillAllFields = "Please fill all required fields",
    saveError = "Error while saving",
    
    // Warranty Details
    details = "Details",
    back = "Back",
    edit = "Edit",
    delete = "Delete",
    warrantyEnd = "Warranty end",
    duration = "Duration",
    months = "months",
    notes = "Notes",
    loadError = "Unable to load warranty details",
    
    // Delete Dialog
    deleteTitle = "Delete warranty?",
    deleteConfirm = "This action cannot be undone. Are you sure you want to delete this warranty?",
    cancel = "Cancel",
    
    // Status
    statusValid = "Valid",
    statusExpiring = "Expiring soon",
    statusExpired = "Expired",
    
    // Categories
    categoryAppliances = "Appliances",
    categoryHighTech = "High-Tech",
    categoryAudioVideo = "Audio & Video",
    categoryHome = "Home",
    categoryDiy = "DIY",
    categoryFashion = "Fashion",
    categorySports = "Sports",
    categoryOther = "Other",
    
    // Language
    languageFr = "Francais",
    languageEn = "English"
)

val LocalStrings = staticCompositionLocalOf { FrenchStrings }
