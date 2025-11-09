"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { supabase, ensurePlayer } from '@/lib/supabaseClient'
import { AppButton } from '@/components/AppButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        await ensurePlayer(session.user.id, session.user.user_metadata)
        // Check admin status
        const { data } = await supabase
          .from('players')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        ensurePlayer(session.user.id, session.user.user_metadata)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
        scopes: 'identify email',
      },
    })
    if (error) {
      console.error('Error signing in:', error)
      alert('Error signing in. Check console for details.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">🎮 ASLI CIKMAZI</CardTitle>
            <CardDescription className="text-lg">Rematch Balancer</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">
              Sign in with Discord to rate players and view the scoreboard
            </p>
            <AppButton
              onClick={handleSignIn}
              size="lg"
              fullWidth
              className="bg-[#5865F2] hover:bg-[#4752C4]"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Sign in with Discord
            </AppButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                <img src="/logo.png" alt="ASLI CIKMAZI" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">ASLI CIKMAZI</span>
              </Link>
              <div className="hidden md:flex gap-4 items-center">
                <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Home
                </Link>
                
                {/* Actions Group */}
                <div className="h-4 w-px bg-white/20"></div>
                <Link href="/rate" className={`transition-colors ${pathname === '/rate' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Rate Players
                </Link>
                
                {/* Tools Group */}
                <div className="h-4 w-px bg-white/20"></div>
                <Link href="/balance" className={`transition-colors ${pathname === '/balance' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Team Balancer
                </Link>
                
                {/* Data Group */}
                <div className="h-4 w-px bg-white/20"></div>
                <Link href="/scoreboard" className={`transition-colors ${pathname === '/scoreboard' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Leaderboard
                </Link>
                <Link href="/votes" className={`transition-colors ${pathname === '/votes' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Vote Matrix
                </Link>
                <Link href="/history" className={`transition-colors ${pathname === '/history' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  History
                </Link>
                
                {/* Personal Group */}
                <div className="h-4 w-px bg-white/20"></div>
                <Link href="/profile" className={`transition-colors ${pathname === '/profile' ? 'text-white font-semibold border-b-2 border-white' : 'text-white/80 hover:text-white'}`}>
                  Profile
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={`transition-colors font-semibold ${pathname === '/admin' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-yellow-400 hover:text-yellow-300'}`}>
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/80 text-sm hidden sm:inline">
                {session.user.user_metadata.full_name || session.user.email}
              </span>
              <AppButton onClick={handleSignOut} variant="ghost" size="sm">
                Sign Out
              </AppButton>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

