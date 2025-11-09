# 🚀 Quick Setup Guide

Follow these steps to get your Rematch Balancer up and running!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Discord Application Setup

1. Go to https://discord.com/developers/applications
2. Click "New Application" and name it "Rematch Balancer"
3. Go to **OAuth2** → **General**
4. Copy your **Client ID** and **Client Secret** (you'll need these soon)
5. We'll add the redirect URI in Step 3 after creating the Supabase project

## Step 3: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - Name: `rematch-balancer`
   - Database Password: (generate a strong one)
   - Region: Choose closest to your users
4. Wait for the project to be created (~2 minutes)
5. Once ready, copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
6. Go to **Settings** → **API** and copy the **anon/public** key

## Step 4: Configure Discord in Supabase

1. In your Supabase project, go to **Authentication** → **Providers**
2. Find **Discord** and click to expand
3. Toggle "Enable Discord Provider" to **ON**
4. Paste your Discord **Client ID** and **Client Secret** from Step 2
5. Copy the **Callback URL** shown (looks like `https://xxxxx.supabase.co/auth/v1/callback`)
6. Click **Save**

## Step 5: Update Discord Redirect URI

1. Go back to Discord Developer Portal
2. Go to your application → **OAuth2** → **General**
3. Under "Redirects", click **Add Redirect**
4. Paste the Callback URL from Supabase (from Step 4)
5. Click **Save Changes**

## Step 6: Run SQL Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open the `supabase-schema.sql` file from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" - this is good!

## Step 7: Configure Environment Variables

1. Copy the `env.example` file to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 8: Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Step 9: Test It Out

1. Click "Sign in with Discord"
2. Authorize the application
3. You should be redirected back and see the home page
4. Try rating some players (you'll need at least 2 Discord users to test)

## 🎉 You're Done!

The app is now running locally. When you're ready to deploy:

### Deploying to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project" and import your repo
4. Add the same environment variables from `.env.local`
5. Deploy!
6. After deployment, add your Vercel URL to:
   - Discord OAuth redirects: `https://your-app.vercel.app/`
   - Supabase Auth URL Configuration:
     - Go to **Authentication** → **URL Configuration**
     - Add your Vercel URL to **Redirect URLs**
     - Set **Site URL** to your Vercel URL

## 🐛 Troubleshooting

### "Invalid login credentials"
- Make sure you've enabled Discord provider in Supabase
- Check that your Discord Client ID and Secret are correct
- Verify the redirect URI matches exactly

### "Failed to fetch" or CORS errors
- Check that your `.env.local` has the correct Supabase URL
- Make sure the Anon key is correct (it's very long!)
- Try restarting the dev server

### Players not showing up
- Make sure the SQL schema was run successfully
- Check the browser console for errors
- Try signing out and back in

### Need Help?
Check the main README.md for more details or open an issue on GitHub.

