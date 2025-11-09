import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to ASLI CIKMAZI Rematch Balancer</h1>
        <p className="text-xl text-slate-300 mb-6">
          A community-driven player rating system for balanced and competitive matches
        </p>
        
        <Card className="bg-slate-800/70 border-slate-700">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-white mb-3">🎮 How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-200">
              <div>
                <span className="font-semibold text-blue-300">1. Rate Players</span>
                <p className="mt-1">Vote for your teammates on a scale of 1-10 based on their skill level</p>
              </div>
              <div>
                <span className="font-semibold text-purple-300">2. View Rankings</span>
                <p className="mt-1">Check the scoreboard to see average ratings and player rankings</p>
              </div>
              <div>
                <span className="font-semibold text-green-300">3. Team Balancer</span>
                <p className="mt-1">Use the team balancer to create fair and competitive matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Features Grid */}
      <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              ⭐ Rate Players
            </CardTitle>
            <CardDescription className="text-slate-400">
              Rate your teammates from 1-10 based on their skill level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/rate">
              <AppButton fullWidth variant="primary">Go to Rating</AppButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              🏆 Scoreboard
            </CardTitle>
            <CardDescription className="text-slate-400">
              View average ratings and see who's on top
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/scoreboard">
              <AppButton fullWidth variant="primary">View Scoreboard</AppButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              ⚖️ Team Balancer
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create balanced teams for your matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/balance">
              <AppButton fullWidth variant="primary">Team Balancer</AppButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              🗳️ All Votes
            </CardTitle>
            <CardDescription className="text-slate-400">
              See the complete votes matrix - full transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/votes">
              <AppButton fullWidth variant="primary">View Matrix</AppButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              📜 Vote History
            </CardTitle>
            <CardDescription className="text-slate-400">
              Review your past votes and rating changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/history">
              <AppButton fullWidth variant="primary">View History</AppButton>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              ⚙️ Profile Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Customize your display name and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <AppButton fullWidth variant="primary">Edit Profile</AppButton>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="mt-8 bg-slate-800/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-300 text-sm">
          <p>• <strong className="text-white">Be honest</strong> - Fair ratings lead to better balanced teams</p>
          <p>• <strong className="text-white">Update regularly</strong> - Player skills change over time</p>
          <p>• <strong className="text-white">Check transparency</strong> - Everyone can see who voted what in the All Votes page</p>
          <p>• <strong className="text-white">Use the balancer</strong> - Mark players online and let the algorithm create fair teams</p>
        </CardContent>
      </Card>
    </div>
  )
}
