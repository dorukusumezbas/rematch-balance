import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⭐ Rate Players
          </CardTitle>
          <CardDescription>
            Rate your teammates from 1-10 based on their skill level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/rate">
            <Button className="w-full">Go to Rating</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Scoreboard
          </CardTitle>
          <CardDescription>
            View average ratings and see who's on top
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/scoreboard">
            <Button className="w-full">View Scoreboard</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚖️ Team Balancer
          </CardTitle>
          <CardDescription>
            Create balanced teams for your matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/balance">
            <Button className="w-full">Balance Teams</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗳️ All Votes
          </CardTitle>
          <CardDescription>
            See the complete votes matrix - full transparency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/votes">
            <Button className="w-full" variant="outline">View Matrix</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Profile Settings
          </CardTitle>
          <CardDescription>
            Customize your display name and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile">
            <Button className="w-full" variant="outline">Edit Profile</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center">Welcome to ASLI CIKMAZI Rematch Balancer</CardTitle>
          <CardDescription className="text-center">
            Our community-driven player rating system. Rate your friends honestly to help create balanced teams for better matches.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

