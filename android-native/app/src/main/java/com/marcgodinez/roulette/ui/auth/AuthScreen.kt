package com.marcgodinez.roulette.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.marcgodinez.roulette.ui.theme.*
import kotlinx.coroutines.launch

// REPLACEME: Get this from Google Cloud Console (OAuth 2.0 Client ID for Web)
// This is required even for Android Native to get the ID Token for Supabase.
const val GOOGLE_WEB_CLIENT_ID =
        "298592772070-64apivvpind6ino85f5skpv4f8vfof4l.apps.googleusercontent.com"

@Composable
fun AuthScreen(onLoginSuccess: () -> Unit, viewModel: AuthViewModel = viewModel()) {
        val scrollState = rememberScrollState()

        // Main Container
        Box(modifier = Modifier.fillMaxSize().background(DarkBg)) {
                Column(
                        modifier =
                                Modifier.fillMaxSize().verticalScroll(scrollState).padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                ) {
                        // Constrain width for tablet/desktop
                        Box(modifier = Modifier.widthIn(max = 500.dp)) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {

                                        // Header Logo
                                        Text(
                                                text = "ROULETTE",
                                                color = PrimaryGold,
                                                fontSize = 32.sp,
                                                fontWeight = FontWeight.Bold,
                                                letterSpacing = 0.15.em,
                                                modifier = Modifier.padding(bottom = 8.dp)
                                        )

                                        Text(
                                                text =
                                                        if (!viewModel.isRegisterMode)
                                                                "WELCOME BACK"
                                                        else "JOIN THE CLUB",
                                                color = TextMuted,
                                                fontSize = 14.sp,
                                                letterSpacing = 0.2.em,
                                                fontWeight = FontWeight.Medium,
                                                modifier = Modifier.padding(bottom = 30.dp)
                                        )

                                        // Card
                                        Card(
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(16.dp),
                                                colors =
                                                        CardDefaults.cardColors(
                                                                containerColor = SurfaceBg
                                                        ),
                                                border = BorderStroke(1.dp, BorderSubtle),
                                                elevation =
                                                        CardDefaults.cardElevation(
                                                                defaultElevation = 0.dp
                                                        )
                                        ) {
                                                Column(
                                                        modifier = Modifier.padding(30.dp),
                                                        horizontalAlignment =
                                                                Alignment.CenterHorizontally
                                                ) {

                                                        // Segmented Control
                                                        AuthToggle(
                                                                isLogin = !viewModel.isRegisterMode,
                                                                onToggle = { isLogin ->
                                                                        viewModel.isRegisterMode =
                                                                                !isLogin
                                                                }
                                                        )

                                                        Spacer(modifier = Modifier.height(30.dp))

                                                        // Form Fields
                                                        if (viewModel.isRegisterMode) {
                                                                AuthInput(
                                                                        label = "USERNAME",
                                                                        value = viewModel.username,
                                                                        onValueChange = {
                                                                                viewModel.username =
                                                                                        it
                                                                        },
                                                                        placeholder = "Maverick"
                                                                )
                                                                Spacer(
                                                                        modifier =
                                                                                Modifier.height(
                                                                                        20.dp
                                                                                )
                                                                )
                                                        }

                                                        AuthInput(
                                                                label =
                                                                        if (!viewModel
                                                                                        .isRegisterMode
                                                                        )
                                                                                "EMAIL OR USERNAME"
                                                                        else "EMAIL",
                                                                value = viewModel.email,
                                                                onValueChange = {
                                                                        viewModel.email = it
                                                                },
                                                                placeholder =
                                                                        if (!viewModel
                                                                                        .isRegisterMode
                                                                        )
                                                                                "user or email@..."
                                                                        else "vip@casino.com"
                                                        )

                                                        Spacer(modifier = Modifier.height(20.dp))

                                                        AuthInput(
                                                                label = "PASSWORD",
                                                                value = viewModel.password,
                                                                onValueChange = {
                                                                        viewModel.password = it
                                                                },
                                                                placeholder = "••••••••",
                                                                isPassword = true
                                                        )

                                                        Spacer(modifier = Modifier.height(24.dp))

                                                        // Error Message
                                                        if (viewModel.error != null) {
                                                                Text(
                                                                        text = viewModel.error!!,
                                                                        color = ErrorRed,
                                                                        fontSize = 14.sp,
                                                                        fontWeight =
                                                                                FontWeight.SemiBold,
                                                                        modifier =
                                                                                Modifier.padding(
                                                                                        bottom =
                                                                                                16.dp
                                                                                )
                                                                )
                                                        }

                                                        // Submit Button
                                                        Button(
                                                                onClick = {
                                                                        viewModel.authenticate(
                                                                                onLoginSuccess
                                                                        )
                                                                },
                                                                enabled = !viewModel.isLoading,
                                                                shape = RoundedCornerShape(12.dp),
                                                                colors =
                                                                        ButtonDefaults.buttonColors(
                                                                                containerColor =
                                                                                        PrimaryGold,
                                                                                contentColor =
                                                                                        DarkBg,
                                                                                disabledContainerColor =
                                                                                        PrimaryGold
                                                                                                .copy(
                                                                                                        alpha =
                                                                                                                0.5f
                                                                                                )
                                                                        ),
                                                                modifier =
                                                                        Modifier.fillMaxWidth()
                                                                                .height(50.dp)
                                                        ) {
                                                                if (viewModel.isLoading) {
                                                                        CircularProgressIndicator(
                                                                                color = DarkBg,
                                                                                modifier =
                                                                                        Modifier.size(
                                                                                                24.dp
                                                                                        ),
                                                                                strokeWidth = 2.dp
                                                                        )
                                                                } else {
                                                                        Text(
                                                                                text =
                                                                                        if (!viewModel
                                                                                                        .isRegisterMode
                                                                                        )
                                                                                                "ENTER CASINO"
                                                                                        else
                                                                                                "CREATE ACCOUNT",
                                                                                fontWeight =
                                                                                        FontWeight
                                                                                                .Bold,
                                                                                fontSize = 16.sp,
                                                                                letterSpacing =
                                                                                        0.05.em
                                                                        )
                                                                }
                                                        }

                                                        Spacer(modifier = Modifier.height(24.dp))

                                                        // Divider
                                                        Row(
                                                                verticalAlignment =
                                                                        Alignment.CenterVertically
                                                        ) {
                                                                Divider(
                                                                        modifier =
                                                                                Modifier.weight(1f),
                                                                        color = BorderSubtle,
                                                                        thickness = 1.dp
                                                                )
                                                                Text(
                                                                        text = "OR",
                                                                        color = TextMuted,
                                                                        fontSize = 12.sp,
                                                                        fontWeight =
                                                                                FontWeight.Bold,
                                                                        modifier =
                                                                                Modifier.padding(
                                                                                        horizontal =
                                                                                                16.dp
                                                                                )
                                                                )
                                                                Divider(
                                                                        modifier =
                                                                                Modifier.weight(1f),
                                                                        color = BorderSubtle,
                                                                        thickness = 1.dp
                                                                )
                                                        }

                                                        Spacer(modifier = Modifier.height(24.dp))

                                                        // Google Button
                                                        // Google Button
                                                        val context = LocalContext.current
                                                        val scope = rememberCoroutineScope()

                                                        Button(
                                                                onClick = {
                                                                        scope.launch {
                                                                                try {
                                                                                        val credentialManager =
                                                                                                CredentialManager
                                                                                                        .create(
                                                                                                                context
                                                                                                        )

                                                                                        // Option 1:
                                                                                        // Google ID
                                                                                        // Option
                                                                                        val googleIdOption =
                                                                                                GetGoogleIdOption
                                                                                                        .Builder()
                                                                                                        .setFilterByAuthorizedAccounts(
                                                                                                                false
                                                                                                        )
                                                                                                        .setServerClientId(
                                                                                                                GOOGLE_WEB_CLIENT_ID
                                                                                                        )
                                                                                                        .setAutoSelectEnabled(
                                                                                                                true
                                                                                                        )
                                                                                                        .build()

                                                                                        val request =
                                                                                                GetCredentialRequest
                                                                                                        .Builder()
                                                                                                        .addCredentialOption(
                                                                                                                googleIdOption
                                                                                                        )
                                                                                                        .build()

                                                                                        val result =
                                                                                                credentialManager
                                                                                                        .getCredential(
                                                                                                                request =
                                                                                                                        request,
                                                                                                                context =
                                                                                                                        context
                                                                                                        )

                                                                                        val credential =
                                                                                                result.credential
                                                                                        if (credential is
                                                                                                        CustomCredential &&
                                                                                                        credential
                                                                                                                .type ==
                                                                                                                GoogleIdTokenCredential
                                                                                                                        .TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                                                                                        ) {

                                                                                                val googleIdTokenCredential =
                                                                                                        GoogleIdTokenCredential
                                                                                                                .createFrom(
                                                                                                                        credential
                                                                                                                                .data
                                                                                                                )
                                                                                                val idToken =
                                                                                                        googleIdTokenCredential
                                                                                                                .idToken

                                                                                                viewModel
                                                                                                        .signInWithGoogle(
                                                                                                                idToken,
                                                                                                                onLoginSuccess
                                                                                                        )
                                                                                        } else {
                                                                                                // Handle other cases or failure
                                                                                        }
                                                                                } catch (
                                                                                        e:
                                                                                                Exception) {
                                                                                        viewModel
                                                                                                .error =
                                                                                                "Google Sign-In failed: ${e.message}"
                                                                                }
                                                                        }
                                                                },
                                                                shape = RoundedCornerShape(12.dp),
                                                                colors =
                                                                        ButtonDefaults.buttonColors(
                                                                                containerColor =
                                                                                        Color.White
                                                                        ),
                                                                modifier =
                                                                        Modifier.fillMaxWidth()
                                                                                .height(50.dp)
                                                        ) {
                                                                Text(
                                                                        text =
                                                                                "Continue with Google",
                                                                        color = Color.Black,
                                                                        fontSize = 16.sp,
                                                                        fontWeight = FontWeight.Bold
                                                                )
                                                        }
                                                }
                                        }
                                }
                        }
                }
        }
}

@Composable
fun AuthToggle(isLogin: Boolean, onToggle: (Boolean) -> Unit) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .background(DarkBg, RoundedCornerShape(10.dp))
                                .padding(4.dp)
        ) {
                val toggleModifier =
                        Modifier.weight(1f).height(40.dp).clip(RoundedCornerShape(8.dp))

                // Sign In
                Box(
                        modifier =
                                toggleModifier.background(
                                                if (isLogin) PrimaryGold else Color.Transparent
                                        )
                                        .clickable { onToggle(true) },
                        contentAlignment = Alignment.Center
                ) {
                        Text(
                                text = "SIGN IN",
                                color = if (isLogin) DarkBg else TextMuted,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                        )
                }

                // Sign Up
                Box(
                        modifier =
                                toggleModifier.background(
                                                if (!isLogin) PrimaryGold else Color.Transparent
                                        )
                                        .clickable { onToggle(false) },
                        contentAlignment = Alignment.Center
                ) {
                        Text(
                                text = "SIGN UP",
                                color = if (!isLogin) DarkBg else TextMuted,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                        )
                }
        }
}

@Composable
fun AuthInput(
        label: String,
        value: String,
        onValueChange: (String) -> Unit,
        placeholder: String,
        isPassword: Boolean = false
) {
        var passwordVisible by remember { mutableStateOf(false) }

        Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                        text = label,
                        color = PrimaryGold,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
                )

                BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        textStyle =
                                TextStyle(
                                        color = TextWhite,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Normal
                                ),
                        singleLine = true,
                        visualTransformation =
                                if (isPassword && !passwordVisible) PasswordVisualTransformation()
                                else VisualTransformation.None,
                        cursorBrush = SolidColor(PrimaryGold),
                        decorationBox = { innerTextField ->
                                Row(
                                        modifier =
                                                Modifier.fillMaxWidth()
                                                        .background(
                                                                DarkBg,
                                                                RoundedCornerShape(12.dp)
                                                        )
                                                        .border(
                                                                1.dp,
                                                                BorderSubtle,
                                                                RoundedCornerShape(12.dp)
                                                        )
                                                        .padding(
                                                                horizontal = 16.dp,
                                                                vertical = 14.dp
                                                        ),
                                        verticalAlignment = Alignment.CenterVertically
                                ) {
                                        Box(modifier = Modifier.weight(1f)) {
                                                if (value.isEmpty()) {
                                                        Text(text = placeholder, color = TextMuted)
                                                }
                                                innerTextField()
                                        }
                                        if (isPassword) {
                                                Icon(
                                                        imageVector =
                                                                if (passwordVisible)
                                                                        Icons.Filled.Visibility
                                                                else Icons.Filled.VisibilityOff,
                                                        contentDescription = "Toggle Password",
                                                        tint = TextMuted,
                                                        modifier =
                                                                Modifier.size(20.dp).clickable {
                                                                        passwordVisible =
                                                                                !passwordVisible
                                                                }
                                                )
                                        }
                                }
                        }
                )
        }
}
