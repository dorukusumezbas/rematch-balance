# 🎮 Rematch Balancer - ASLI CIKMAZI

A community-driven player rating system for Discord groups. Rate your teammates, view the scoreboard, and prepare for balanced matches!

## 🚀 Features (MVP)

- **Discord Authentication**: Sign in with Discord OAuth
- **Player Rating System**: Rate other players from 1-10
- **Live Scoreboard**: View average ratings and vote counts
- **Modern UI**: Built with Next.js 14 + Tailwind CSS + shadcn/ui
- **Real-time Updates**: Powered by Supabase

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- A Discord application for OAuth

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application (or use existing)
3. Go to **OAuth2** → **General**
4. Note your **Client ID** and **Client Secret**
5. Add redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Authentication** → **Providers** → **Discord**
3. Enable Discord provider
4. Enter your Discord Client ID and Client Secret
5. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
6. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public key

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Discord OAuth redirect URI to include your Vercel URL
5. Update Supabase Auth settings:
   - Go to **Authentication** → **URL Configuration**
   - Add your Vercel URL to **Site URL** and **Redirect URLs**

## 🗂️ Project Structure

```
rematch-balance/
├── app/
│   ├── layout.tsx          # Root layout with AuthGate
│   ├── page.tsx            # Home page
│   ├── rate/page.tsx       # Rate players page
│   └── scoreboard/page.tsx # Scoreboard page
├── components/
│   ├── AuthGate.tsx        # Authentication wrapper
│   └── ui/                 # UI components (button, card, etc.)
├── lib/
│   ├── supabaseClient.ts   # Supabase client setup
│   └── utils.ts            # Utility functions
└── supabase-schema.sql     # Database schema
```

## 🎯 Usage

1. **Sign In**: Click "Sign in with Discord"
2. **Rate Players**: Go to "Rate Players" and use sliders to rate teammates
3. **View Scoreboard**: Check out the rankings on the scoreboard
4. **Update Ratings**: Ratings auto-save and can be updated anytime

## 🔮 Future Features (Not in MVP)

- Team balancing algorithm
- Vote history audit log
- Discord guild gating
- Advanced analytics

## 🤝 Contributing

This is a community project for ASLI CIKMAZI. Feel free to suggest improvements!

## 📄 License

MIT
