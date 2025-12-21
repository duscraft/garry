package com.duscraft.garry.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.duscraft.garry.data.repository.AuthRepository
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.ui.screens.*

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Dashboard : Screen("dashboard")
    data object WarrantyDetail : Screen("warranty/{id}") {
        fun createRoute(id: String) = "warranty/$id"
    }
    data object AddWarranty : Screen("add-warranty")
    data object EditWarranty : Screen("edit-warranty/{id}") {
        fun createRoute(id: String) = "edit-warranty/$id"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String,
    authRepository: AuthRepository,
    warrantyRepository: WarrantyRepository
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                authRepository = authRepository,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onRegisterClick = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        
        composable(Screen.Register.route) {
            RegisterScreen(
                authRepository = authRepository,
                onRegisterSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                },
                onLoginClick = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                authRepository = authRepository,
                warrantyRepository = warrantyRepository,
                onAddWarrantyClick = {
                    navController.navigate(Screen.AddWarranty.route)
                },
                onWarrantyClick = { id ->
                    navController.navigate(Screen.WarrantyDetail.createRoute(id))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = Screen.WarrantyDetail.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { backStackEntry ->
            val warrantyId = backStackEntry.arguments?.getString("id") ?: return@composable
            WarrantyDetailScreen(
                warrantyId = warrantyId,
                warrantyRepository = warrantyRepository,
                onBackClick = { navController.popBackStack() },
                onEditClick = { id ->
                    navController.navigate(Screen.EditWarranty.createRoute(id))
                },
                onDeleteSuccess = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.AddWarranty.route) {
            AddWarrantyScreen(
                warrantyRepository = warrantyRepository,
                onBackClick = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }
        
        composable(
            route = Screen.EditWarranty.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { backStackEntry ->
            val warrantyId = backStackEntry.arguments?.getString("id") ?: return@composable
            EditWarrantyScreen(
                warrantyId = warrantyId,
                warrantyRepository = warrantyRepository,
                onBackClick = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }
    }
}
