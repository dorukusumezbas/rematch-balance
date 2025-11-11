"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

type TC = {
  id: string
  tc_name: string
  score: number
  display_order: number
  created_at: string
  updated_at: string
}

const TC_BADGES = [
  { label: '👑 Best TC', color: 'bg-yellow-500' },
  { label: '🥈 Great TC', color: 'bg-gray-400' },
  { label: '🥉 Good TC', color: 'bg-orange-600' },
]

export default function SaitTCPage() {
  const [tcs, setTCs] = useState<TC[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saitAvatar, setSaitAvatar] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newTCName, setNewTCName] = useState('')
  const [newTCScore, setNewTCScore] = useState(5.0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editScore, setEditScore] = useState(5.0)

  useEffect(() => {
    loadTCs()
  }, [])

  const loadTCs = async () => {
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    
    if (!session.session?.user) {
      setLoading(false)
      return
    }

    // Check if user is admin
    const { data: playerData } = await supabase
      .from('players')
      .select('is_admin')
      .eq('user_id', session.session.user.id)
      .single()
    
    setIsAdmin(playerData?.is_admin || false)

    // Get Sait's avatar (display_name = "allmtd")
    const { data: saitData } = await supabase
      .from('players')
      .select('avatar_url')
      .eq('display_name', 'allmtd')
      .single()
    
    setSaitAvatar(saitData?.avatar_url || null)

    // Load all TCs (shared list) sorted by score descending
    const { data, error } = await supabase
      .from('sait_tcs')
      .select('*')
      .order('score', { ascending: false })

    if (error) {
      console.error('Error loading TCs:', error)
    } else {
      setTCs(data || [])
    }
    setLoading(false)
  }

  const addTC = async () => {
    if (!newTCName.trim()) {
      alert('Please enter a TC name')
      return
    }

    if (!isAdmin) {
      alert('Only admins can add TCs')
      return
    }

    const { error } = await supabase.from('sait_tcs').insert({
      tc_name: newTCName.trim(),
      score: newTCScore,
      display_order: 0, // Not used for sorting anymore, but required by schema
    })

    if (error) {
      console.error('Error adding TC:', error)
      alert('Error adding TC')
    } else {
      setNewTCName('')
      setNewTCScore(5.0)
      setAddingNew(false)
      loadTCs()
    }
  }

  const updateTC = async (id: string, updates: Partial<TC>) => {
    const { error } = await supabase
      .from('sait_tcs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating TC:', error)
      alert('Error updating TC')
    } else {
      loadTCs()
    }
  }

  const deleteTC = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TC?')) return

    const { error } = await supabase.from('sait_tcs').delete().eq('id', id)

    if (error) {
      console.error('Error deleting TC:', error)
      alert('Error deleting TC')
    } else {
      loadTCs()
    }
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateTC(editingId, { tc_name: editName.trim(), score: editScore })
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditScore(5.0)
  }

  const startEdit = (tc: TC) => {
    setEditingId(tc.id)
    setEditName(tc.tc_name)
    setEditScore(tc.score)
  }


  if (loading) {
    return (
      <div className="text-white text-center">Loading Sait's Town Centers...</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          {saitAvatar && (
            <img 
              src={saitAvatar} 
              alt="Sait" 
              className="w-16 h-16 rounded-full border-2 border-purple-500"
            />
          )}
          <h1 className="text-3xl font-bold text-white">🏠 Sait's TC Rankings</h1>
        </div>
        <p className="text-white/70">
          Rank your town centers (houses you stay at) from best to worst
        </p>
      </div>

      {/* Add New TC - Only for admins */}
      {isAdmin && !addingNew && (
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 pt-6">
            <AppButton onClick={() => setAddingNew(true)} variant="primary" fullWidth>
              ➕ Add New TC
            </AppButton>
          </CardContent>
        </Card>
      )}
      
      {isAdmin && addingNew && (
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add New Town Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-white mb-2">TC Name</label>
              <input
                type="text"
                value={newTCName}
                onChange={(e) => setNewTCName(e.target.value)}
                placeholder="e.g., Ali's House, Mehmet's Place..."
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white mb-2">
                Score: {newTCScore.toFixed(2)}
              </label>
              <Slider
                min={0}
                max={10}
                step={0.25}
                value={newTCScore}
                onValueChange={(val) => setNewTCScore(val)}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>0.0</span>
                <span>5.0</span>
                <span>10.0</span>
              </div>
            </div>
            <div className="flex gap-2">
              <AppButton onClick={addTC} variant="success" fullWidth>
                Save TC
              </AppButton>
              <AppButton onClick={() => { setAddingNew(false); setNewTCName(''); setNewTCScore(5.0); }} variant="secondary" fullWidth>
                Cancel
              </AppButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TCs List */}
      {tcs.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-slate-400">
              No town centers yet. Add your first TC above!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tcs.map((tc, index) => (
            <Card
              key={tc.id}
              className="bg-slate-800/50 border-slate-700"
            >
              <CardContent className="p-6 pt-6">
                {editingId === tc.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white mb-2">TC Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">
                        Score: {editScore.toFixed(2)}
                      </label>
                      <Slider
                        min={0}
                        max={10}
                        step={0.25}
                        value={editScore}
                        onValueChange={(val) => setEditScore(val)}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-white/50">
                        <span>0.0</span>
                        <span>5.0</span>
                        <span>10.0</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AppButton onClick={saveEdit} variant="success" size="sm" fullWidth>
                        Save
                      </AppButton>
                      <AppButton onClick={cancelEdit} variant="secondary" size="sm" fullWidth>
                        Cancel
                      </AppButton>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl text-white/50 font-mono">#{index + 1}</span>
                        {index < 3 && (
                          <Badge className={`${TC_BADGES[index].color} text-white font-semibold px-3 py-1`}>
                            {TC_BADGES[index].label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{tc.tc_name}</h3>
                      </div>
                      <div>
                        <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                          {tc.score.toFixed(2)} / 10
                        </Badge>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <AppButton onClick={() => startEdit(tc)} variant="secondary" size="sm">
                          Edit
                        </AppButton>
                        <AppButton onClick={() => deleteTC(tc.id)} variant="danger" size="sm">
                          Delete
                        </AppButton>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {tcs.length > 0 && (
        <Card className="mt-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-white/60 text-sm text-center">
              {isAdmin 
                ? "💡 Tip: TCs are automatically sorted by score (highest first). Edit scores to change the ranking!"
                : "👀 View-only: This is Sait's shared TC ranking list, sorted by score!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

