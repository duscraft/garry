package com.duscraft.garry.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duscraft.garry.data.model.WarrantyStatus
import com.duscraft.garry.ui.theme.StatusGreen
import com.duscraft.garry.ui.theme.StatusOrange
import com.duscraft.garry.ui.theme.StatusRed

@Composable
fun StatusBadge(status: WarrantyStatus, modifier: Modifier = Modifier) {
    val (backgroundColor, text, textColor) = when (status) {
        WarrantyStatus.VALID -> Triple(
            StatusGreen.copy(alpha = 0.1f),
            "Valide",
            StatusGreen
        )
        WarrantyStatus.EXPIRING -> Triple(
            StatusOrange.copy(alpha = 0.1f),
            "Expire bientôt",
            StatusOrange
        )
        WarrantyStatus.EXPIRED -> Triple(
            StatusRed.copy(alpha = 0.1f),
            "Expirée",
            StatusRed
        )
    }

    Text(
        text = text,
        color = textColor,
        fontSize = 12.sp,
        style = MaterialTheme.typography.labelSmall,
        modifier = modifier
            .background(backgroundColor, RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}
