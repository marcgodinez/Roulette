# Android Native Project

## Setup
This is a standard Native Android project using **Kotlin** and **Jetpack Compose**.

### How to Run
1. **Open Android Studio**.
2. Click **Open** (or File > Open).
3. Navigate to and select this folder:  
   `c:\Users\marcg\Documents\Projects\Roulette\android-native`  
   *(Important: Select the `android-native` folder, NOT the parent `Roulette` folder).*
4. Click **OK**.
5. **Wait for Gradle Sync**: The bottom status bar will show progress. Wait until it finishes and indexing is complete.
6. **Select a Device**: In the top toolbar, select an Emulator (e.g., Pixel 7) or a connected physical device.
   - If you don't have an emulator, go to **Device Manager** > **Create Device**.
7. **Run**: Click the green **Play (Run)** button or press `Shift + F10`.

### Troubleshooting
- **Gradle Errors**: Try **File > Sync Project with Gradle Files**.
- **Emulator issues**: Ensure you have HAXM or AEHD installed in SDK Tools.

### Structure
- `app/src/main/java/.../MainActivity.kt`: Entry point.
- `app/src/main/AndroidManifest.xml`: App configuration.
- `build.gradle.kts`: Dependencies (Compose, etc.).

### Next Steps
We will be implementing:
- `ApiClient` (using Ktor or Retrofit) to talk to Supabase Edge Functions.
- `GameViewModel` to handle state.
- `GameScreen` to render the Roulette board.
