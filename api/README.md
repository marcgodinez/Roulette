# Roulette API Instructions

This folder contains the Supabase Edge Functions for the Roulette Game logic.

## Prerequisites
- Server-side runtime (Deno) is handled by Supabase CLI.
- You need the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.

## Setup
1. Login to Supabase CLI:
   ```bash
   npx supabase login
   ```
2. Link your local project to your remote Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-id>
   ```
   *(Find project-id in Settings > General in your Supabase Dashboard)*

## Running Locally
To test the functions locally without deploying:
```bash
npx supabase start
npx supabase functions serve --no-verify-jwt
```
This will start a local server (usually at `http://localhost:54321/functions/v1/`).

## Deploying
To deploy these functions to the live Edge Network:
```bash
npx supabase functions deploy spin
npx supabase functions deploy claim-bonus
npx supabase functions deploy ad-reward
```

## Environment Variables
The functions rely on `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which are automatically injected by Supabase.

## API Endpoints
Once deployed (or running locally), the endpoints are:

- **POST** `/functions/v1/spin`
  - Body: `{ "bets": { "RED": 100 } }`
  - Headers: `Authorization: Bearer <user-jwt>`
  
- **POST** `/functions/v1/claim-bonus`
  - Headers: `Authorization: Bearer <user-jwt>`

- **POST** `/functions/v1/ad-reward`
  - Headers: `Authorization: Bearer <user-jwt>`
