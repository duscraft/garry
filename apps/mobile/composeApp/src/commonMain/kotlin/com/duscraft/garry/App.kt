package com.duscraft.garry

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val PrimaryBlue = Color(0xFF2563EB)
val AccentYellow = Color(0xFFFBBF24)
val BackgroundLight = Color(0xFFF8FAFC)

@Composable
fun App() {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = PrimaryBlue,
            secondary = AccentYellow,
            background = BackgroundLight
        )
    ) {
        GarryHomeScreen()
    }
}

@Composable
fun GarryHomeScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFEFF6FF),
                        Color(0xFFF8FAFC)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            LogoCard()

            Spacer(modifier = Modifier.height(32.dp))

            Title()

            Spacer(modifier = Modifier.height(8.dp))

            Subtitle()

            Spacer(modifier = Modifier.height(24.dp))

            Tagline()

            Spacer(modifier = Modifier.height(48.dp))

            FeaturesSection()

            Spacer(modifier = Modifier.height(48.dp))

            GetStartedButton()
        }
    }
}

@Composable
private fun LogoCard() {
    Card(
        modifier = Modifier.size(100.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = PrimaryBlue)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "G",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun Title() {
    Text(
        text = "Garry",
        fontSize = 40.sp,
        fontWeight = FontWeight.Bold,
        color = PrimaryBlue
    )
}

@Composable
private fun Subtitle() {
    Text(
        text = "Votre assistant garanties",
        fontSize = 18.sp,
        color = Color(0xFF64748B)
    )
}

@Composable
private fun Tagline() {
    Text(
        text = "Ne perdez plus jamais une garantie.",
        fontSize = 16.sp,
        fontWeight = FontWeight.Medium,
        color = Color(0xFF334155),
        textAlign = TextAlign.Center
    )

    Text(
        text = "Garry pense à vos garanties,\npour que vous n'ayez pas à le faire.",
        fontSize = 14.sp,
        color = Color(0xFF64748B),
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = 8.dp)
    )
}

@Composable
private fun FeaturesSection() {
    FeatureCard(
        emoji = "📸",
        title = "Capturez",
        description = "Prenez en photo vos factures"
    )

    Spacer(modifier = Modifier.height(12.dp))

    FeatureCard(
        emoji = "🔔",
        title = "Rappels",
        description = "Notifications avant expiration"
    )

    Spacer(modifier = Modifier.height(12.dp))

    FeatureCard(
        emoji = "🔐",
        title = "Sécurisé",
        description = "Vos données protégées"
    )
}

@Composable
private fun GetStartedButton() {
    Button(
        onClick = { },
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
    ) {
        Text(
            text = "Commencer",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun FeatureCard(emoji: String, title: String, description: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = emoji,
                fontSize = 28.sp
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF1E293B)
                )
                Text(
                    text = description,
                    fontSize = 14.sp,
                    color = Color(0xFF64748B)
                )
            }
        }
    }
}
