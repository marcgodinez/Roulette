# 🎰 Roulette VIP - Technical & Product Overview

## 1. Executive Summary
**Roulette VIP** is a modern, high-engagement mobile casino application built with React Native and Expo. It differentiates itself from standard roulette apps by integrating **RPG-style progression**, a **dynamic "Fire" bonus mode**, and a **social Hub**, all wrapped in a premium "Neon Vegas" aesthetic. The app is designed for both casual play and competitive engagement through leaderboards and leveling systems.

## 2. Key Features

### 🎮 Core Gameplay
- **European Roulette Engine**: Authentic physics and betting rules (Inside/Outside bets, Racetrack).
- **Mega Fire Mode**: Randomly boosts specific numbers with multipliers (50x - 500x) for high-octane moments.
- **Dynamic UI**: Switch between "Grid View" for standard betting and "Racetrack View" for call bets (Voisins, Tiers, Orphelins).
- **Strategy Lab**: Users can save, load, and apply complex betting patterns instantly.

### 🏆 Social & Progression (The Hub)
- **Leveling System**: Users earn XP for every bet, unlocking new titles and bonuses.
- **Leaderboards**: Real-time ranking of top earners (Daily/Weekly/All-time).
- **User Profiles**: Customized avatars and stats tracking.
- **Daily Bonuses**: Retention mechanic rewarding daily logins with increasing coin grants.

### 💰 Economy & Monetization
- **Dual Currency Flow**: Free daily coins + Ad-supported rewards ensure players can always play.
- **In-App Purchases (IAP)**: Integration with **RevenueCat** for coin packs ($0.99 - $99.99).
- **AdMob Integration**: Rewarded video ads for free credits and interstitial ads for natural breaks.

## 3. Technical Architecture

### 📱 Frontend (Mobile App)
- **Framework**: **React Native (Expo SDK 54)**.
- **Language**: **TypeScript** for type safety and maintainability.
- **State Management**: **Zustand** for performant, global game state (credits, bets, history).
- **Animation**: **Reanimated 3** for 60fps animations (wheel spin, chip movements, fire effects).
- **Audio**: **Expo AV** with a custom `AudioManager` for background music and sound effects.

### ☁️ Backend & Database
- **Provider**: **Supabase** (PostgreSQL).
- **Authentication**: Native Supabase Auth + **OAuth** (Google, Apple) + Email/Password.
- **Real-time**: Postgres Row Level Security (RLS) ensures users only access their own sensitive data.
- **Edge Functions**: (Planned) or Database Triggers handle critical logic like leveling up and leaderboard aggregation.

## 4. API & Data Flow
The application uses a hybrid approach for data:
- **Direct DB Access**: For real-time subscriptions and standard read/write (e.g., `profiles` table).
- **REST API Layer (`ApiClient.ts`)**: Encapsulates game-specific logic.

### Key API Endpoints / Methods:
| Category | Method | Description |
|----------|--------|-------------|
| **Auth** | `signInWithIdToken` | Handles Google/Apple OIDC tokens securely. |
| **User** | `fetchUserProfile` | Retrieves Credits, VIP status, XP, and Ad-Free status. |
| **Game** | `recordGameResult` | Sends spin results (Win/Loss, Multiplier) to the server for validation and analytics. |
| **Game** | `fetchGameHistory` | Pulls the last 100 global results for the "Hot/Cold" analysis. |
| **Strategy**| `saveStrategy` | Persists user's betting patterns to the database. |
| **Social** | `fetchLeaderboards`| Aggregates top players by winnings. |

## 5. Security & Compliance
- **Environment Variables**: Sensitive keys (API Keys) are stored in `.env` files and never committed to version control.
- **Row Level Security (RLS)**: Database policies prevent unauthorized data access.
- **App Store Compliance**:
    - **Tracking Transparency**: Implemented for iOS 14.5+ (AdMob).
    - **Account Deletion**: Self-service deletion flow compliant with Apple guidelines.

## 6. Future Roadmap

### 🤝 Social & Community
- **Casino Clubs (Guilds)**: Players can form "Syndicates" to compete in team leaderboards.
- **Club Bank**: Shared pool where members contribute winnings to unlock club-exclusive perks (XP multipliers, special icons).
- **Friend System**: Direct messaging, gifting coins, and "spectating" friends' games live.

### 🎨 Customization & Assets (Monetization)
- **Table Skins**: Unlockable felt colors (Cyberpunk Neon, Classic Green, Royal Red).
- **Chip Designer**: Custom textures and effects for player chips.
- **Wheel Animations**: Special visual effects when the ball drops (Explosions, Confetti, Lightning).

### 🕹️ Gameplay Expansions
- **Quest System**: Daily/Weekly challenges (e.g., "Win on Black 3 times in a row", "Hit a 50x Fire Multiplier").
- **Mini-Games**: Scratch cards or "Bonus Wheel" spins for users when they run out of credits (Retention mechanic).
- **Live Dealer Mode**: Integration of video streaming for a live host experience.

### 🌐 Platform & Tech
- **Web Version**: Full seamless cross-play on desktop browsers via React Native Web.
- **Smart Watch Companion**: App for tracking notifications, bonuses, and quick stats.
- **Crypto Integration**: (Exploratory) Option for crypto-based deposits or exclusive NFT avatars.
