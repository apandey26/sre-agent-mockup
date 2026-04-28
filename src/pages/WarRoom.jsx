import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import InvestigationSubNav from '../components/InvestigationSubNav'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Radio, Users, Star, CheckCircle, AlertTriangle,
  MessageSquare, Shield, Send, ExternalLink, RotateCcw, BookOpen, ArrowUp,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { ScrollArea } from '../components/ui/scroll-area'
import { Textarea } from '../components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { scenarioA, scenarioB, scenarioC } from '../data'

const SCENARIOS = { 'inv-0892': scenarioA, 'inv-0893': scenarioB, 'inv-new': scenarioC }

const PRESENCE = { zoom: { color: '#00D4A0', label: 'In Zoom' }, slack: { color: '#0B6ACB', label: 'In Slack' }, active: { color: '#0B6ACB', label: 'Active' }, offline: { color: '#D1D5DB', label: 'Offline' } }

const SOURCE_ICON_COLOR = { 'NR Alert': '#0B6ACB', 'PagerDuty': '#F5A623', 'SRE Agent': '#0B6ACB', 'ServiceNow': '#6B7280', 'GitHub': '#1D2433', 'Slack': '#4A154B', 'K8s': '#326CE5', 'ArgoCD': '#0B6ACB', 'NR Metrics': '#0B6ACB', 'Memory': '#9333EA', 'Zoom': '#0B6ACB' }

const TEMPLATES = [
  { id: 'initial', title: 'Initial status update', text: 'We\'re investigating elevated latency on {entity}. {affected} customers may be affected. Next update in 15 minutes.' },
  { id: 'rootcause', title: 'Root cause identified', text: 'Root cause identified: {rootCause}. Working on resolution. ETA: 15 minutes.' },
  { id: 'resolved', title: 'Resolved', text: 'Incident resolved at {time}. Root cause: {rootCause}. Post-mortem to follow within 48 hours.' },
  { id: 'escalation', title: 'Internal escalation', text: 'Escalating to {team}. Current status: {status}. Need help with: {ask}.' },
]

const FILTERS = ['All', 'Slack', 'Agent', 'PagerDuty']

function Avatar({ name, size = 32, presence }) {
  const isAI = name === 'SRE Agent'
  const initials = isAI ? 'AI' : name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const colors = { S: '#0B6ACB', M: '#9333EA', P: '#00D4A0', A: '#F5A623' }
  const bg = isAI ? '#0B6ACB' : (colors[initials[0]] || '#6B7280')
  const pres = PRESENCE[presence] || PRESENCE.offline

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative" style={{ width: size, height: size }}>
          <div className="rounded-full flex items-center justify-center text-white font-bold" style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.35 }}>
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: pres.color }} />
        </div>
      </TooltipTrigger>
      <TooltipContent>{name} — {pres.label}</TooltipContent>
    </Tooltip>
  )
}

export default function WarRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = SCENARIOS[id]

  const [warRoomActive, setWarRoomActive] = useState(!!scenario?.warRoom)
  const [feedFilter, setFeedFilter] = useState('All')
  const [statusText, setStatusText] = useState('')
  const [bookmarks, setBookmarks] = useState(new Set())
  const [destinations, setDestinations] = useState({ slack: true, pagerduty: true, statuspage: false })
  const [toasts, setToasts] = useState([])

  if (!scenario) {
    return <div><Breadcrumbs /><EmptyState icon={Radio} title="Not Found" description="Investigation not found." actions={[{ label: 'Home', onClick: () => navigate('/') }]} /></div>
  }

  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000) }

  // Build unified feed from timeline + slack
  const feed = useMemo(() => {
    const entries = []
    ;(scenario.timeline || []).forEach(t => entries.push({ ...t, type: 'timeline', sortKey: t.time }))
    ;(scenario.slackContext || []).forEach(s => entries.push({ time: s.time, event: s.text, source: 'Slack', author: s.author, type: 'slack', sortKey: s.time }))
    entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    return entries
  }, [scenario])

  const filteredFeed = feedFilter === 'All' ? feed : feed.filter(f => {
    if (feedFilter === 'Slack') return f.source === 'Slack'
    if (feedFilter === 'Agent') return f.source === 'SRE Agent'
    if (feedFilter === 'PagerDuty') return f.source === 'PagerDuty'
    return true
  })

  const toggleBookmark = (i) => setBookmarks(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const applyTemplate = (tpl) => {
    let text = tpl.text
      .replace('{entity}', scenario.entity)
      .replace('{rootCause}', scenario.rootCause?.summary || 'Under investigation')
      .replace('{affected}', scenario.rootCause?.impact?.usersAffected?.toLocaleString() || 'Unknown')
      .replace('{time}', 'now')
      .replace('{team}', 'platform team')
      .replace('{status}', 'Investigating')
      .replace('{ask}', 'additional context')
    setStatusText(text)
  }

  const sendUpdate = () => { if (statusText.trim()) { toast('Status update sent'); setStatusText('') } }

  const warRoom = scenario.warRoom || {
    participants: [{ name: 'You', role: 'IC', presence: 'zoom', avatar: 'U' }, { name: 'SRE Agent', role: 'Agent', presence: 'active', avatar: 'AI' }],
    slackChannel: `#war-${scenario.entity}`,
    startedAt: 'Just now',
    duration: '0 min',
  }

  // Empty state
  if (!warRoomActive) {
    return (
      <div>
        <Breadcrumbs />
        <Button variant="ghost" size="sm" onClick={() => navigate(`/investigation/${id}`)} className="mb-4"><ArrowLeft size={14} /> Back to Canvas</Button>
        <EmptyState
          icon={Radio}
          title="No Active War Room"
          description="War Rooms are created from the Investigation Canvas when an incident needs multi-person response."
          actions={[
            { label: 'Open War Room', onClick: () => { setWarRoomActive(true); toast('War Room created') } },
            { label: 'Back to Canvas', onClick: () => navigate(`/investigation/${id}`) },
          ]}
        />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs />
      <InvestigationSubNav />

      {/* ═══ Participant Strip ═══ */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse" />
            <span className="text-[13px] font-bold text-[#1D2433]">WAR ROOM ACTIVE</span>
            <Badge variant="secondary">{scenario.entity}</Badge>
            <Badge variant={scenario.severity === 'P1' ? 'p1' : 'p2'}>{scenario.severity}</Badge>
            <span className="text-[11px] text-[#6B7280]">{warRoom.duration} elapsed</span>
          </div>

          <Separator orientation="vertical" className="h-8 mx-2" />

          <div className="flex items-center gap-3 flex-1">
            {warRoom.participants.map(p => (
              <div key={p.name} className="flex flex-col items-center gap-0.5">
                <Avatar name={p.name} size={32} presence={p.presence} />
                <span className="text-[9px] text-[#1D2433] font-medium">{p.name}</span>
                <Badge variant="secondary" className="text-[8px] px-1 py-0">{p.role}</Badge>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" onClick={() => toast('Invitation sent to platform-team')}><Users size={12} /> Invite +</Button>
            <Button variant="destructive" size="sm" onClick={() => { setWarRoomActive(false); toast('War Room ended') }}>End War Room</Button>
          </div>
        </div>
      </Card>

      {/* ═══ Three-column body ═══ */}
      <div className="flex gap-4 min-h-[calc(100vh-220px)]">

        {/* LEFT: Live Feed */}
        <Card className="w-[300px] shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#1D2433]">Live Feed</span>
              <Badge variant="secondary">{filteredFeed.length}</Badge>
            </div>
            <div className="flex gap-1">
              {FILTERS.map(f => (
                <Button key={f} variant={feedFilter === f ? 'default' : 'outline'} size="sm" className="text-[10px] h-5 px-1.5" onClick={() => setFeedFilter(f)}>{f}</Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {filteredFeed.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
                  <div className="shrink-0 mt-0.5">
                    {entry.type === 'slack' ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: '#4A154B' }}>
                        {entry.author?.slice(0, 2) || 'SL'}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: (SOURCE_ICON_COLOR[entry.source] || '#6B7280') + '20' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SOURCE_ICON_COLOR[entry.source] || '#6B7280' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#6B7280]">{entry.time}</span>
                      {entry.author && <span className="text-[10px] font-medium text-[#1D2433]">{entry.author}</span>}
                    </div>
                    <p className="text-[11px] text-[#1D2433] leading-relaxed">{entry.event}</p>
                    <Badge variant="secondary" className="text-[8px] mt-0.5">{entry.source}</Badge>
                  </div>
                  <button onClick={() => toggleBookmark(i)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                    <Star size={11} className={bookmarks.has(i) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-[#D1D5DB]'} />
                  </button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* CENTER: Canvas Summary */}
        <Card className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#1D2433]">Investigation Summary</span>
            <Button variant="outline" size="sm" onClick={() => navigate(`/investigation/${id}`)}>
              <ExternalLink size={11} /> Open Full Canvas
            </Button>
          </div>

          {/* Compact alert header */}
          <div className="bg-[#F7F8FA] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#FF4D4D]" />
              <span className="text-[13px] font-semibold text-[#1D2433]">{scenario.entity}</span>
              <Badge variant={scenario.severity === 'P1' ? 'p1' : 'p2'}>{scenario.severity}</Badge>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-1">{scenario.hypotheses[0]?.title || scenario.title}</p>
          </div>

          {/* Hypothesis summary */}
          <div className="space-y-1.5 mb-3">
            <span className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Hypotheses</span>
            {scenario.hypotheses.map(h => {
              const colors = { VALIDATED: '#00D4A0', INVALIDATED: '#FF4D4D', INCONCLUSIVE: '#F5A623', TESTING: '#0B6ACB' }
              return (
                <div key={h.id} className={`flex items-center gap-2 text-[12px] ${h.status === 'INVALIDATED' ? 'opacity-50 line-through' : ''}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[h.status] || '#6B7280' }} />
                  <span className="text-[#1D2433] flex-1 truncate">{h.title}</span>
                  <span className="font-medium" style={{ color: colors[h.status] }}>{h.confidence}%</span>
                  <Badge variant="secondary" className="text-[8px]">{h.status}</Badge>
                </div>
              )
            })}
          </div>

          {/* Root cause */}
          {scenario.rootCause && (
            <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={13} className="text-[#00D4A0]" />
                <span className="text-[12px] font-semibold text-[#1D2433]">Root Cause</span>
                <Badge variant="good" className="text-[9px]">{scenario.rootCause.confidence}%</Badge>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{scenario.rootCause.summary}</p>
            </div>
          )}
        </Card>

        {/* RIGHT: Actions & Comms */}
        <Card className="w-[280px] shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <span className="text-[13px] font-semibold text-[#1D2433]">Actions & Comms</span>
          </div>

          {/* Quick actions */}
          <div className="p-3 space-y-2 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Quick Actions</span>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" className="text-[10px]" onClick={() => toast('Escalated to next tier')}><ArrowUp size={10} /> Escalate</Button>
              {scenario.recentChanges?.length > 0 && (
                <Button variant="outline" size="sm" className="text-[10px]" onClick={() => toast('Rollback initiated')}><RotateCcw size={10} /> Rollback</Button>
              )}
              <Button variant="outline" size="sm" className="text-[10px]" onClick={() => toast('Runbook opened')}><BookOpen size={10} /> Runbook</Button>
            </div>
          </div>

          {/* Status update */}
          <div className="p-3 space-y-2 border-b border-gray-100 flex-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Status Update</span>
            <Textarea
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              placeholder="Draft a status update..."
              rows={4}
              className="text-[12px]"
            />
            <div className="flex items-center gap-2 text-[11px]">
              {['slack', 'pagerduty', 'statuspage'].map(d => (
                <label key={d} className="flex items-center gap-1 cursor-pointer capitalize">
                  <input type="checkbox" checked={destinations[d]} onChange={() => setDestinations(p => ({ ...p, [d]: !p[d] }))} className="w-3 h-3 rounded" />
                  {d}
                </label>
              ))}
            </div>
            <Button size="sm" onClick={sendUpdate} disabled={!statusText.trim()}><Send size={11} /> Send Update</Button>
          </div>

          {/* Comms templates */}
          <div className="p-3">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block">Templates</span>
            <div className="space-y-1">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-left p-2 rounded-lg hover:bg-[#F7F8FA] transition-colors"
                >
                  <p className="text-[11px] font-medium text-[#1D2433]">{tpl.title}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{tpl.text.slice(0, 60)}...</p>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
