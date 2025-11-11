"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

type TC = {
  id: string
  user_id: string
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
  const [addingNew, setAddingNew] = useState(false)
  const [newTCName, setNewTCName] = useState('')
  const [newTCScore, setNewTCScore] = useState(5.0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editScore, setEditScore] = useState(5.0)
  const [draggedId, setDraggedId] = useState<string | null>(null)

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

    const { data, error } = await supabase
      .from('sait_tcs')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('score', { ascending: false })
      .order('display_order')

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

    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return

    const maxOrder = tcs.length > 0 ? Math.max(...tcs.map(tc => tc.display_order)) : 0

    const { error } = await supabase.from('sait_tcs').insert({
      user_id: session.session.user.id,
      tc_name: newTCName.trim(),
      score: newTCScore,
      display_order: maxOrder + 1,
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tcId: string) => {
    setDraggedId(tcId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tcId)
    
    // Prevent text selection
    window.getSelection()?.removeAllRanges()
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = tcs.findIndex(tc => tc.id === draggedId)
    const targetIndex = tcs.findIndex(tc => tc.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    // Reorder the array
    const newTCs = [...tcs]
    const [draggedTC] = newTCs.splice(draggedIndex, 1)
    newTCs.splice(targetIndex, 0, draggedTC)

    // Update display_order for all affected TCs
    const updates = newTCs.map((tc, index) => ({
      id: tc.id,
      display_order: index,
    }))

    // Update in database
    for (const update of updates) {
      await supabase
        .from('sait_tcs')
        .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
        .eq('id', update.id)
    }

    setDraggedId(null)
    loadTCs()
  }

  const handleMouseDown = () => {
    // Clear any text selection when starting to drag
    window.getSelection()?.removeAllRanges()
  }

  if (loading) {
    return (
      <div className="text-white text-center">Loading Sait's Town Centers...</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🏠 Sait's TC Rankings</h1>
        <p className="text-white/70">
          Rank your town centers (houses you stay at) from best to worst
        </p>
      </div>

      {/* Add New TC */}
      {!addingNew ? (
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 pt-6">
            <AppButton onClick={() => setAddingNew(true)} variant="primary" fullWidth>
              ➕ Add New TC
            </AppButton>
          </CardContent>
        </Card>
      ) : (
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
              draggable={editingId !== tc.id}
              onDragStart={(e) => handleDragStart(e, tc.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tc.id)}
              onMouseDown={handleMouseDown}
              className={`bg-slate-800/50 border-slate-700 transition-all ${
                draggedId === tc.id ? 'opacity-50' : ''
              } ${editingId !== tc.id ? 'cursor-move select-none' : ''}`}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
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
                    <div className="flex gap-2 ml-4">
                      <AppButton onClick={() => startEdit(tc)} variant="secondary" size="sm">
                        Edit
                      </AppButton>
                      <AppButton onClick={() => deleteTC(tc.id)} variant="danger" size="sm">
                        Delete
                      </AppButton>
                    </div>
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
              💡 Tip: Drag and drop to reorder TCs. They're automatically sorted by score, but you can manually adjust the order!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

