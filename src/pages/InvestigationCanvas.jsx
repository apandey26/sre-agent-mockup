import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Clock, AlertTriangle, BarChart3, Shield,
  MessageSquare, GitBranch, ArrowRight, ChevronDown, Brain, CheckCircle,
  Pin, PinOff, Plus, X, Save,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import EntityContextTable from '../components/EntityContextTable'
import CompactContextStrip from '../components/CompactContextStrip'
import HypothesisCards from '../components/HypothesisCards'
import RootCauseSummary from '../components/RootCauseSummary'
// TriageActionsDock now integrated into RootCauseSummary
import ChatPanel from '../components/ChatPanel'
import SimulationController from '../components/SimulationController'
import { useSimulation } from '../components/SimulationContext'
import { scenarioA, scenarioB, scenarioC, investigations, memories as memData, skills as skillsData, systemModel } from '../data'

/* ── scenario routing ─────────────────────────── */
const SCENARIOS = {
  'inv-0892': scenarioA,
  'inv-0893': scenarioB,
  'inv-new': scenarioC,
}

/* ── design tokens ────────────────────────────── */
const SEV_STYLE = {
  P1: { icon: 'text-[#FF4D4D]', pill: 'bg-red-50 text-[#FF4D4D]' },
  P2: { icon: 'text-[#F5A623]', pill: 'bg-amber-50 text-[#F5A623]' },
}

const PHASE_LABEL = {
  hypotheses: { label: 'Hypotheses', color: 'text-[#F5A623]' },
  rootCause:  { label: 'Root Cause', color: 'text-[#FF4D4D]' },
  context:    { label: 'Context',    color: 'text-[#0B6ACB]' },
}

const TIMELINE_DOT = {
  alert:    'bg-[#FF4D4D]',
  page:     'bg-[#F5A623]',
  agent:    'bg-[#0B6ACB]',
  change:   'bg-[#6B7280]',
  code:     'bg-[#6B7280]',
  action:   'bg-[#00D4A0]',
  resolved: 'bg-[#00D4A0]',
  memory:   'bg-[#9333EA]',
  human:    'bg-[#0B6ACB]',
}

const DATA_SOURCES_A = [
  { name: 'APM', ok: true, items: ['Throughput: 1,240 rpm', 'Error rate: 1.8%', 'p99 latency: 2,340ms'], synced: '2 min ago' },
  { name: 'Infra', ok: true, items: ['CPU: 94%', 'Memory: 72%', '3 pods healthy'], synced: '1 min ago' },
  { name: 'K8s', ok: true, items: ['Deploy v2.4.1 at 14:32 UTC', 'ReplicaSet scaled 3→3', 'No OOMKills'], synced: '1 min ago' },
  { name: 'Logs', ok: true, items: ['847 error logs in last 15m', 'Top: "N+1 query detected"', 'Source: checkout-service'], synced: '30s ago' },
  { name: 'PagerDuty', ok: true, items: ['Alert PD-7234: p99 > 2s', 'Assigned: Sarah K.', 'Escalation: L1'], synced: '3 min ago' },
  { name: 'Slack', ok: true, items: ['#incidents-checkout: 5 msgs', '@sarah: "seeing latency spike"', '@mike: "rolled back before?"'], synced: '2 min ago' },
  { name: 'GitHub', ok: true, items: ['PR #1847: Remove eager loading', 'Merged by deploy-bot', 'Changed: order_items.rb'], synced: '5 min ago' },
  { name: 'ServiceNow', ok: true, items: ['INC-9921: Related incident', 'Priority: P2', 'State: Active'], synced: '4 min ago' },
  { name: 'ArgoCD', ok: true, items: ['App: checkout-service', 'Sync: Healthy', 'Last deploy: 14:32 UTC'], synced: '2 min ago' },
]
const DATA_SOURCES_B = [
  { name: 'APM', ok: true, items: ['Error rate: 12% (5xx)', 'Throughput: 3,400 rpm', 'p99: timeout'], synced: '1 min ago' },
  { name: 'Infra', ok: true, items: ['CPU: 45%', 'Memory: 67%', 'TLS handshake failures'], synced: '1 min ago' },
  { name: 'K8s', ok: true, items: ['No recent deploys', 'All pods running', 'cert-manager: not installed'], synced: '2 min ago' },
  { name: 'Logs', ok: true, items: ['2,100 TLS errors in 30m', '"certificate has expired"', 'Source: auth-service'], synced: '30s ago' },
  { name: 'PagerDuty', ok: true, items: ['Alert PD-7891: 502 errors', 'Assigned: Mike T.', 'Escalation: L2'], synced: '5 min ago' },
  { name: 'Slack', ok: true, items: ['#incidents-auth: 3 msgs', '@mike: "cert expired again"', '@priya: "same as 90 days ago"'], synced: '3 min ago' },
  { name: 'GitHub', ok: false, items: ['Not connected'], synced: null },
  { name: 'ServiceNow', ok: false, items: ['Not connected'], synced: null },
]

const DATA_SOURCES_C = [
  { name: 'APM', ok: true, items: ['Latency p99: 4,200ms', 'Error rate: 3.2%', 'Throughput dropping'], synced: '1 min ago' },
  { name: 'Infra', ok: true, items: ['CPU: 68%', 'Redis connections: 200/200', '6 pod restarts'], synced: '30s ago' },
  { name: 'K8s', ok: true, items: ['Deploy v3.1.2 at 09:15 UTC', 'Health check failures', 'Restart backoff'], synced: '1 min ago' },
  { name: 'Logs', ok: true, items: ['1,200 timeout errors', '"Redis pool exhausted"', 'Connection leak trace'], synced: '30s ago' },
  { name: 'PagerDuty', ok: true, items: ['Alert PD-8012: p99 > 2s', 'Assigned: Alex R.', 'Escalation: L1'], synced: '2 min ago' },
  { name: 'Slack', ok: true, items: ['#incidents-payment: 4 msgs', '@alex: "redis maxed out"', '@sarah: "pool leak?"'], synced: '2 min ago' },
]


/* ── sub-components ───────────────────────────── */
function SectionHeader({ children, badge }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{children}</span>
      {badge != null && (
        <span className="text-[10px] bg-[#9333EA]/10 text-[#9333EA] px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
      )}
    </div>
  )
}

/* ── provenance badge (Human / AI / System) ──── */
const PROVENANCE = {
  alert:    { label: 'System', color: 'bg-gray-100 text-[#6B7280]' },
  page:     { label: 'System', color: 'bg-gray-100 text-[#6B7280]' },
  agent:    { label: 'AI', color: 'bg-[#0B6ACB]/10 text-[#0B6ACB]' },
  change:   { label: 'System', color: 'bg-gray-100 text-[#6B7280]' },
  code:     { label: 'Human', color: 'bg-[#9333EA]/10 text-[#9333EA]' },
  action:   { label: 'AI', color: 'bg-[#0B6ACB]/10 text-[#0B6ACB]' },
  resolved: { label: 'Human', color: 'bg-[#9333EA]/10 text-[#9333EA]' },
  memory:   { label: 'AI', color: 'bg-[#0B6ACB]/10 text-[#0B6ACB]' },
  human:    { label: 'Human', color: 'bg-[#9333EA]/10 text-[#9333EA]' },
}

function TimelineStepper({ timeline, maxVisible }) {
  const [expanded, setExpanded] = useState(false)
  const INITIAL_COUNT = 6
  const phaseLimited = maxVisible != null ? timeline.slice(0, maxVisible) : timeline
  const visible = expanded ? phaseLimited : phaseLimited.slice(0, INITIAL_COUNT)
  const hasMore = phaseLimited.length > INITIAL_COUNT

  return (
    <div className="px-4 pb-2">
      {visible.map((step, i) => {
        const isLast = i === visible.length - 1
        const dotColor = TIMELINE_DOT[step.type] || 'bg-[#6B7280]'
        const prov = PROVENANCE[step.type] || PROVENANCE.alert
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-2.5 group"
          >
            {/* line + dot column */}
            <div className="flex flex-col items-center w-3 shrink-0">
              <div className={`w-[10px] h-[10px] rounded-full ${dotColor} shrink-0 mt-0.5 ring-2 ring-white`} />
              {!isLast && <div className="w-[2px] flex-1 bg-gray-200 min-h-[20px]" />}
            </div>
            {/* content */}
            <div className="pb-3 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#1D2433]">{step.time}</span>
                <span className={`text-[8px] font-semibold px-1 py-[1px] rounded ${prov.color}`}>{prov.label}</span>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{step.event}</p>
              <span className="inline-block text-[10px] bg-gray-100 text-[#6B7280] rounded px-1.5 py-[1px] font-medium mt-1">
                {step.source}
              </span>
            </div>
          </motion.div>
        )
      })}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[12px] text-[#0B6ACB] font-medium px-0 ml-5 mt-1 hover:underline"
        >
          {expanded ? 'Show less' : `Show ${phaseLimited.length - INITIAL_COUNT} more`}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

function MiniGraph({ entities, currentEntity }) {
  // Simple SVG graph: center node + radiating connections
  const cx = 70, cy = 50
  const healthColor = { healthy: '#00D4A0', warning: '#F5A623', critical: '#FF4D4D' }
  const positions = entities.map((_, i) => {
    const angle = (Math.PI / (entities.length + 1)) * (i + 1) - Math.PI / 2
    return { x: cx + Math.cos(angle) * 50, y: cy + Math.sin(angle) * 35 }
  })

  return (
    <svg width="140" height="100" className="mx-auto mt-2 mb-1">
      {/* lines */}
      {positions.map((pos, i) => (
        <line key={i} x1={cx} y1={cy} x2={pos.x} y2={pos.y}
          stroke={healthColor[entities[i].health] || '#D1D5DB'} strokeWidth={1.5} opacity={0.5} />
      ))}
      {/* outer nodes */}
      {positions.map((pos, i) => (
        <circle key={`c-${i}`} cx={pos.x} cy={pos.y} r={5}
          fill={healthColor[entities[i].health] || '#D1D5DB'} />
      ))}
      {/* center node */}
      <circle cx={cx} cy={cy} r={7} fill="#0B6ACB" />
      <circle cx={cx} cy={cy} r={3} fill="white" />
    </svg>
  )
}

/* ── phase-aware center canvas ────────────────── */
function CenterCanvasContent({ scenario, id, sev, phaseLabel, slackCount, navigate }) {
  const { phase } = useSimulation()

  return (
    <div className="space-y-4">
      {/* Alert Context Header — always visible */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle size={16} className={sev.icon} />
              <h2 className="text-[16px] font-semibold text-[#1D2433]">{scenario.entity}</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${sev.pill}`}>{scenario.severity}</span>
              <span className="text-[10px] bg-gray-100 text-[#6B7280] px-1.5 py-0.5 rounded font-medium">{scenario.environment}</span>
            </div>
            <p className="text-[13px] text-[#6B7280] mt-1">{scenario.hypotheses[0] ? scenario.hypotheses[0].title : scenario.title}</p>
            <p className="text-[12px] mt-1">
              Phase: <span className={`font-medium ${phaseLabel.color}`}>{phaseLabel.label}</span>
            </p>
            {phase >= 1 && scenario.rootCause && (
              <p className="text-[12px] text-[#FF4D4D] font-medium mt-1">
                Affecting ~{scenario.rootCause.impact.usersAffected.toLocaleString()} users · ${scenario.rootCause.impact.revenueAtRisk.toLocaleString()}/hr at risk · SLO burning at {scenario.slo.burnRate}x
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#6B7280] shrink-0">
            <span className="flex items-center gap-1"><Clock size={12} /> {id === 'inv-0892' ? '12 min' : id === 'inv-new' ? '22 min' : '6h 14m'}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} /> {slackCount} messages</span>
            <span className="flex items-center gap-1"><Shield size={12} /> {id === 'inv-0892' ? 'Sarah K.' : id === 'inv-new' ? 'Alex R.' : 'Mike T.'}</span>
          </div>
        </div>
      </div>

      {/* Compact Context Strip (metrics + SLO) — phase >= 1 */}
      {phase >= 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <CompactContextStrip scenario={scenario} id={id} />
        </motion.div>
      )}

      {/* Hypothesis Cards — phase >= 2 */}
      {phase >= 2 && (
        <motion.div id="section-hypotheses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <HypothesisCards scenario={scenario} simulationPhase={phase} />
        </motion.div>
      )}

      {/* Root Cause Summary — phase >= 3 */}
      {phase >= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <RootCauseSummary scenario={scenario} simulationPhase={phase} />
        </motion.div>
      )}

      {/* Triage actions + sub-page nav now inside RootCauseSummary */}
    </div>
  )
}

/* ── phase-aware left sidebar ─────────────────── */
/* ── skills & agents sidebar section ─────────── */
function SkillsAgentsSection({ id }) {
  const [expandedSkill, setExpandedSkill] = useState(null)
  const [disabledSkills, setDisabledSkills] = useState(new Set())
  const [toasts, setToasts] = useState([])

  const invSkills = skillsData.investigationSkills[id]
  if (!invSkills) return null

  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 2500) }

  const toggleDisable = (skillId) => {
    setDisabledSkills(prev => {
      const next = new Set(prev)
      if (next.has(skillId)) { next.delete(skillId); toast('Skill re-enabled') }
      else { next.add(skillId); toast('Skill disabled for this investigation') }
      return next
    })
  }

  const activeSkills = invSkills.skills.filter(s => !disabledSkills.has(s.skillId))

  return (
    <div className="border-t border-gray-100">
      <SectionHeader badge={activeSkills.length}>Skills & Agents</SectionHeader>
      <div className="px-4 pb-3 space-y-1.5">
        {/* Skills */}
        {invSkills.skills.map(skill => {
          const isDisabled = disabledSkills.has(skill.skillId)
          const isExpanded = expandedSkill === skill.skillId
          return (
            <div key={skill.skillId} className={`transition-opacity ${isDisabled ? 'opacity-40' : ''}`}>
              <button
                onClick={() => setExpandedSkill(isExpanded ? null : skill.skillId)}
                className="w-full flex items-center gap-1.5 py-1 text-left"
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${skill.status === 'completed' ? 'bg-[#00D4A0]' : 'bg-[#0B6ACB] animate-pulse'}`} />
                <span className={`text-[11px] flex-1 truncate ${isDisabled ? 'line-through text-[#6B7280]' : 'text-[#1D2433]'}`}>{skill.name}</span>
                <span className="text-[9px] text-[#00D4A0] font-medium">+{skill.confidence}%</span>
                <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="ml-3 pl-2 border-l-2 border-gray-100 pb-1">
                  <p className="text-[10px] text-[#6B7280] leading-relaxed mb-1">{skill.finding}</p>
                  <button onClick={() => toggleDisable(skill.skillId)} className="text-[9px] text-[#0B6ACB] font-medium hover:underline">
                    {isDisabled ? 'Re-enable' : 'Disable for this investigation'}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Sub-agents */}
        {invSkills.subAgents.length > 0 && (
          <div className="pt-1">
            <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Sub-Agents</p>
            {invSkills.subAgents.map(agent => (
              <div key={agent.agentId} className="flex items-center gap-1.5 py-0.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${agent.status === 'completed' ? 'bg-[#9333EA]' : 'bg-[#9333EA] animate-pulse'}`} />
                <span className="text-[11px] text-[#1D2433]">{agent.name}</span>
                <span className="text-[9px] text-[#6B7280] ml-auto truncate max-w-[120px]">{agent.summary.slice(0, 40)}...</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[200px]">
            <CheckCircle size={13} className="text-[#00D4A0]" /><span className="text-[11px] font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── system model sidebar section ────────────── */
function SystemModelSidebar({ entity }) {
  const [open, setOpen] = useState(false)
  const entityModel = systemModel.entities.find(e => e.name === entity)
  if (!entityModel) return null

  return (
    <div className="border-t border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-1.5 px-4 pt-3 pb-1.5 text-left">
        <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${open ? 'rotate-180' : '-rotate-90'}`} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">System Model</span>
        <span className="text-[9px] bg-[#9333EA]/10 text-[#9333EA] px-1.5 py-0.5 rounded font-medium ml-auto">{entityModel.learnedPatterns.length} patterns</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {/* Baselines */}
          <div className="text-[10px] text-[#6B7280] space-y-0.5">
            <p>Baseline p99: <span className="font-medium text-[#1D2433]">{entityModel.latencyBaseline.p99}ms</span></p>
            <p>Error baseline: <span className="font-medium text-[#1D2433]">{entityModel.errorBaseline}%</span></p>
            <p>Incidents (90d): <span className="font-medium text-[#1D2433]">{entityModel.incidentHistory.count}</span> — {entityModel.incidentHistory.topCausePercent}% {entityModel.incidentHistory.topCause.toLowerCase()}</p>
          </div>

          {/* Learned patterns */}
          {entityModel.learnedPatterns.map((p, i) => (
            <div key={i} className="bg-[#9333EA]/5 rounded px-2 py-1.5">
              <p className="text-[10px] text-[#1D2433] leading-relaxed">{p.pattern}</p>
              <p className="text-[9px] text-[#9333EA] mt-0.5">{p.confidence}% confident · {p.source}</p>
            </div>
          ))}

          <p className="text-[9px] text-[#6B7280]">Model age: {entityModel.modelAge}</p>
        </div>
      )}
    </div>
  )
}

/* ── new learnings per scenario ────────────────── */
const LEARNINGS = {
  'inv-0892': [
    'N+1 query from ORM change in checkout-service',
    'Deployment v2.4.1 removed eager loading for order_items',
  ],
  'inv-0893': [
    'TLS cert 90-day cycle on auth-service',
    'cert-manager not configured for auto-renewal',
  ],
  'inv-new': [
    'Redis connection leak in payment-gateway v3.1.2',
  ],
}

/* ── active memory section ────────────────────── */
function ActiveMemorySection({ scenario, id, phase }) {
  const isSimulated = id === 'inv-new'

  // Build auto-loaded memories: scenario matches + relevant org memories
  const scenarioMems = (scenario.memoryMatches || []).map(m => ({ ...m, scope: 'Personal', key: m.id }))
  const orgMems = memData.orgMemories.approved
    .filter(o => o.entity === scenario.entity)
    .map(o => ({ id: o.id, title: o.title, confidence: 100, scope: 'Team', key: o.id }))
  const allAutoLoaded = [...scenarioMems, ...orgMems]

  const [toggles, setToggles] = useState(() => {
    const m = {}; allAutoLoaded.forEach(mem => { m[mem.key] = true }); return m
  })
  const [pinned, setPinned] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [showEntityPull, setShowEntityPull] = useState(false)
  const [addedMems, setAddedMems] = useState([])
  const [toasts, setToasts] = useState([])

  const toggle = (key) => setToggles(p => ({ ...p, [key]: !p[key] }))
  const pinMem = (mem) => { setPinned(p => [...p.filter(x => x.key !== mem.key), mem]); setShowSearch(false); setSearchQ('') }
  const unpinMem = (key) => setPinned(p => p.filter(x => x.key !== key))
  const addMem = (mem) => { setAddedMems(p => [...p, mem]); setToggles(p => ({ ...p, [mem.key]: true })); setShowSearch(false); setSearchQ('') }
  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000) }

  // Search across all memories
  const searchResults = searchQ.length > 1 ? [
    ...memData.userMemories.filter(m => m.title.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 3).map(m => ({ ...m, scope: 'Personal', key: m.id })),
    ...memData.orgMemories.approved.filter(m => m.title.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 2).map(m => ({ ...m, scope: 'Team', key: m.id })),
  ] : []

  const entities = [...new Set(memData.orgMemories.approved.map(m => m.entity).filter(Boolean))]
  const learnings = LEARNINGS[id] || []
  const displayMems = [...allAutoLoaded, ...addedMems]

  if (isSimulated && phase < 2) {
    return (
      <div className="border-t border-gray-100">
        <SectionHeader>Active Memory</SectionHeader>
        <p className="text-[12px] text-[#6B7280] italic animate-pulse px-4 pb-3">Searching memories...</p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100">
      <SectionHeader badge={displayMems.filter(m => toggles[m.key]).length}>Active Memory</SectionHeader>
      <div className="px-4 pb-3 space-y-2">

        {/* Auto-loaded memories with toggles */}
        {displayMems.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[10px] text-[#6B7280] font-medium">Auto-loaded ({displayMems.filter(m => toggles[m.key]).length} active)</p>
            {displayMems.map(mem => {
              const isOn = toggles[mem.key] !== false
              return (
                <div key={mem.key} className={`flex items-center gap-1.5 py-1 rounded transition-opacity ${isOn ? '' : 'opacity-40'}`}>
                  <button onClick={() => toggle(mem.key)} className={`w-6 h-3.5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isOn ? 'bg-[#00D4A0] justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                  </button>
                  <span className={`text-[11px] flex-1 truncate ${isOn ? 'text-[#1D2433]' : 'text-[#6B7280] line-through'}`}>{mem.title}</span>
                  <Badge variant={mem.scope === 'Personal' ? 'default' : 'good'} className="text-[8px] px-1 py-0 shrink-0">{mem.scope === 'Personal' ? 'You' : 'Team'}</Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-[#6B7280] italic">No matching memories for this entity</p>
        )}

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-[#6B7280] font-medium">📌 Pinned</p>
            {pinned.map(mem => (
              <div key={mem.key} className="flex items-center gap-1.5 py-1 bg-[#F5A623]/5 rounded px-1.5">
                <Pin size={9} className="text-[#F5A623] shrink-0" />
                <span className="text-[11px] text-[#1D2433] flex-1 truncate">{mem.title}</span>
                <button onClick={() => unpinMem(mem.key)} className="text-[#6B7280] hover:text-[#1D2433]"><X size={9} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Add actions */}
        <div className="space-y-1">
          {!showSearch ? (
            <button onClick={() => setShowSearch(true)} className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-1 hover:underline">
              <Plus size={10} /> Include memory...
            </button>
          ) : (
            <div className="space-y-1">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search all memories..." className="pl-7 h-6 text-[10px]" autoFocus />
                <button className="absolute right-1.5 top-1/2 -translate-y-1/2" onClick={() => { setShowSearch(false); setSearchQ('') }}><X size={10} className="text-[#6B7280]" /></button>
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  {searchResults.map(r => (
                    <div key={r.key} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 text-[10px]">
                      <span className="flex-1 truncate text-[#1D2433]">{r.title}</span>
                      <Badge variant={r.scope === 'Personal' ? 'default' : 'good'} className="text-[7px] px-1 py-0">{r.scope === 'Personal' ? 'You' : 'Team'}</Badge>
                      <button onClick={() => addMem(r)} className="text-[#0B6ACB] font-medium hover:underline">Add</button>
                      <button onClick={() => pinMem(r)} className="text-[#F5A623] font-medium hover:underline">Pin</button>
                    </div>
                  ))}
                </div>
              )}
              {searchQ.length > 1 && searchResults.length === 0 && <p className="text-[10px] text-[#6B7280] italic">No results</p>}
            </div>
          )}

          {!showEntityPull ? (
            <button onClick={() => setShowEntityPull(true)} className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-1 hover:underline">
              <Plus size={10} /> Pull from entity...
            </button>
          ) : (
            <div className="flex flex-wrap gap-1">
              {entities.filter(e => e !== scenario.entity).map(e => (
                <Badge key={e} variant="outline" className="cursor-pointer text-[9px] hover:bg-[#0B6ACB]/5" onClick={() => {
                  const eMems = memData.orgMemories.approved.filter(m => m.entity === e).map(m => ({ ...m, scope: 'Team', key: `pull-${m.id}`, title: m.title }))
                  setAddedMems(p => [...p, ...eMems])
                  eMems.forEach(m => setToggles(p => ({ ...p, [m.key]: true })))
                  setShowEntityPull(false)
                  toast(`Loaded ${eMems.length} memories from ${e}`)
                }}>{e}</Badge>
              ))}
              <button onClick={() => setShowEntityPull(false)} className="text-[9px] text-[#6B7280]">cancel</button>
            </div>
          )}
        </div>

        {/* New learnings */}
        {phase >= 3 && learnings.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] text-[#6B7280] font-medium">New learnings ({learnings.length})</p>
            {learnings.map((l, i) => (
              <div key={i} className="bg-[#00D4A0]/5 rounded-lg px-2 py-1.5">
                <p className="text-[11px] text-[#1D2433] mb-1">{l}</p>
                <div className="flex gap-1">
                  <button onClick={() => toast('Saved to My Knowledge')} className="text-[9px] text-[#0B6ACB] font-medium border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50">Save to Mine</button>
                  <button onClick={() => toast('Proposed to Team')} className="text-[9px] text-white font-medium bg-[#0B6ACB] rounded px-1.5 py-0.5 hover:bg-[#0A5EB8]">Propose to Team</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {phase >= 2 && phase < 3 && (
          <p className="text-[10px] text-[#6B7280] italic">Learnings will appear after root cause is found</p>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[200px]">
            <CheckCircle size={13} className="text-[#00D4A0]" /><span className="text-[11px] font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── collapsible sidebar context ───────────────── */
function SidebarContextDetails({ scenario }) {
  const [open, setOpen] = useState(false)
  const changes = scenario.recentChanges || []
  const slack = scenario.slackContext || []

  return (
    <div className="border-t border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-1.5 px-4 pt-3 pb-1.5 text-left">
        <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${open ? 'rotate-180' : '-rotate-90'}`} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Context Details</span>
        <span className="text-[9px] text-[#6B7280] ml-auto">{Object.keys(scenario.entityContext || {}).length} fields · {changes.length} changes · {slack.length} msgs</span>
      </button>
      {open && (
        <div className="px-4 pb-2 space-y-2">
          {/* Entity context — compact */}
          <div>
            <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-0.5">Entity</p>
            {Object.entries(scenario.entityContext || {}).slice(0, 4).map(([key, val]) => (
              <div key={key} className="flex gap-1.5 text-[10px] py-px">
                <span className="text-[#6B7280] w-16 shrink-0 truncate capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-[#1D2433] truncate">{val}</span>
              </div>
            ))}
          </div>
          {/* Recent changes */}
          <div>
            <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-0.5">Changes</p>
            {changes.length === 0 ? (
              <p className="text-[10px] text-[#00D4A0]">✓ None detected</p>
            ) : changes.slice(0, 2).map((c, i) => (
              <p key={i} className="text-[10px] text-[#6B7280] truncate"><span className="text-[#1D2433] font-medium">{c.time}</span> {c.title}</p>
            ))}
          </div>
          {/* Slack */}
          {slack.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-0.5">Slack</p>
              {slack.slice(0, 2).map((m, i) => (
                <p key={i} className="text-[10px] text-[#6B7280] truncate"><span className="font-medium text-[#1D2433]">{m.author}</span> {m.text}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── interactive data sources ─────────────────── */
function InteractiveDataSources({ dataSources, dsPhaseReady, isSimulated }) {
  const [expandedSrc, setExpandedSrc] = useState(null)
  const [linkToast, setLinkToast] = useState(null)

  return (
    <div className="border-t border-gray-100">
      <SectionHeader badge={dataSources.filter(s => s.ok).length}>Data Sources</SectionHeader>
      <div className="px-4 pb-3 space-y-1">
        {/* Pills row */}
        <div className="flex flex-wrap gap-1.5 mb-1">
          {dataSources.map((src, i) => {
            const isGreen = dsPhaseReady && src.ok
            const isExpanded = expandedSrc === src.name
            return (
              <motion.button
                key={src.name}
                initial={isSimulated ? { backgroundColor: 'rgb(243,244,246)' } : false}
                animate={isGreen
                  ? { backgroundColor: isExpanded ? 'rgba(0,212,160,0.2)' : 'rgba(0,212,160,0.1)' }
                  : { backgroundColor: 'rgb(243,244,246)' }
                }
                transition={isSimulated ? { delay: i * 0.2, duration: 0.3 } : { duration: 0 }}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                  isGreen ? 'text-[#00D4A0]' : 'text-[#6B7280]'
                } ${isExpanded ? 'ring-1 ring-[#00D4A0]' : 'hover:ring-1 hover:ring-gray-300'}`}
                onClick={() => setExpandedSrc(isExpanded ? null : src.name)}
              >
                {src.name}
              </motion.button>
            )
          })}
        </div>

        {/* Expanded source details */}
        <AnimatePresence>
          {expandedSrc && (() => {
            const src = dataSources.find(s => s.name === expandedSrc)
            if (!src) return null
            return (
              <motion.div
                key={expandedSrc}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="bg-[#F7F8FA] rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#1D2433]">{src.name}</span>
                    <div className="flex items-center gap-1.5">
                      {src.ok ? (
                        <Badge variant="good" className="text-[8px]">Connected</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[8px]">Not connected</Badge>
                      )}
                      {src.synced && <span className="text-[9px] text-[#6B7280]">{src.synced}</span>}
                    </div>
                  </div>
                  {src.items?.map((item, j) => (
                    <p key={j} className="text-[10px] text-[#6B7280] leading-relaxed pl-1 border-l-2 border-gray-200">
                      {item}
                    </p>
                  ))}
                  {src.ok && (
                    <button className="text-[9px] text-[#0B6ACB] font-medium hover:underline mt-1"
                      onClick={() => { setLinkToast(`Opening ${src.name}...`); setTimeout(() => setLinkToast(null), 2000) }}>
                      View in {src.name} →
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Link toast */}
        {linkToast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0B6ACB]/10 rounded px-2 py-1 text-[10px] text-[#0B6ACB] font-medium text-center">
            {linkToast}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function LeftSidebar({ scenario, dataSources, id }) {
  const { phase } = useSimulation()
  const isSimulated = id === 'inv-new'

  // Phase-gated timeline visible count
  const timelineLimit = !isSimulated ? undefined
    : phase === 0 ? 1
    : phase === 1 ? 3
    : phase === 2 ? 4
    : phase === 3 ? 7
    : undefined // show all

  // Phase-gated data sources
  const dsPhaseReady = !isSimulated || phase >= 1

  return (
    <div className="w-[260px] shrink-0 bg-white rounded-xl border border-gray-100 overflow-y-auto self-start sticky top-5">
      {/* Timeline */}
      <SectionHeader>Investigation Timeline</SectionHeader>
      <TimelineStepper timeline={scenario.timeline} maxVisible={timelineLimit} />

      {/* Data Sources — interactive */}
      <InteractiveDataSources dataSources={dataSources} dsPhaseReady={dsPhaseReady} isSimulated={isSimulated} />

      {/* Skills & Agents */}
      {(!isSimulated || phase >= 1) && (
        <SkillsAgentsSection id={id} />
      )}

      {/* System Model for this entity */}
      {(!isSimulated || phase >= 1) && (
        <SystemModelSidebar entity={scenario.entity} />
      )}

      {/* Active Memory (replaces old Memory Matches) */}
      <ActiveMemorySection scenario={scenario} id={id} phase={phase} />

      {/* Context details — collapsed by default */}
      {(!isSimulated || phase >= 1) && (
        <SidebarContextDetails scenario={scenario} />
      )}

      {/* Related Entities — hidden in phase 0 for simulation */}
      {(!isSimulated || phase >= 1) && (
        <motion.div
          initial={isSimulated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="border-t border-gray-100"
        >
          <SectionHeader>Related Entities</SectionHeader>
          <div className="px-4 pb-2">
            {scenario.relatedEntities.slice(0, 4).map((ent) => (
              <div key={ent.name} className="flex items-center gap-2 py-[3px]">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  ent.health === 'healthy' ? 'bg-[#00D4A0]'
                  : ent.health === 'warning' ? 'bg-[#F5A623]'
                  : 'bg-[#FF4D4D]'
                }`} />
                <span className="text-[11px] text-[#1D2433] flex-1 truncate">{ent.name}</span>
                <span className="text-[9px] text-[#6B7280] shrink-0">{ent.type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ── main component ───────────────────────────── */
export default function InvestigationCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scenario = SCENARIOS[id]

  // Deep-link scroll: ?section=rootcause, ?section=hypotheses, ?section=context, ?section=triage
  useEffect(() => {
    const section = searchParams.get('section')
    if (section) {
      const sectionMap = {
        rootcause: 'section-rootcause',
        hypotheses: 'section-hypotheses',
        context: 'section-context',
        triage: 'section-triage',
      }
      const targetId = sectionMap[section]
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            el.style.transition = 'box-shadow 0.3s'
            el.style.boxShadow = '0 0 0 2px rgba(11,106,203,0.3)'
            setTimeout(() => { el.style.boxShadow = 'none' }, 3000)
          }
        }, 600)
      }
    }
  }, [searchParams])

  // Check past investigations for read-only view
  const pastInv = !scenario ? investigations.recent.find(inv => inv.id === id) : null

  if (!scenario && pastInv) {
    return (
      <div>
        <Breadcrumbs />
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowRight size={14} className="rotate-180" /> Back to Home
        </Button>
        <Card className="p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="good">Resolved</Badge>
            <h2 className="text-[16px] font-semibold text-[#1D2433]">{pastInv.entity}</h2>
            <Badge variant="secondary">{pastInv.severity}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div><span className="text-[#6B7280]">Trigger</span><p className="font-medium text-[#1D2433]">{pastInv.trigger}</p></div>
            <div><span className="text-[#6B7280]">Root Cause</span><p className="font-medium text-[#1D2433]">{pastInv.rootCause}</p></div>
            <div><span className="text-[#6B7280]">Duration</span><p className="font-medium text-[#1D2433]">{pastInv.duration}</p></div>
            <div><span className="text-[#6B7280]">Confidence</span><p className="font-medium text-[#00D4A0]">{pastInv.confidence ? `${pastInv.confidence}%` : 'N/A'}</p></div>
          </div>
          {pastInv.memoryCreated && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#00D4A0]">
              <CheckCircle size={13} /> Memory created from this investigation
            </div>
          )}
          <p className="text-[11px] text-[#6B7280] mt-4 italic">This is a past investigation. Full canvas replay is not available in the mockup.</p>
        </Card>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div>
        <Breadcrumbs />
        <EmptyState
          icon={Search}
          title="Investigation Not Found"
          description="This investigation doesn't exist or has been archived."
          actions={[{ label: 'Back to Home', onClick: () => navigate('/') }]}
        />
      </div>
    )
  }

  const sev = SEV_STYLE[scenario.severity] || SEV_STYLE.P2
  const phaseKey = id === 'inv-0892' ? 'hypotheses' : id === 'inv-new' ? 'rootCause' : 'rootCause'
  const phase = PHASE_LABEL[phaseKey]
  const dataSources = id === 'inv-0892' ? DATA_SOURCES_A : id === 'inv-new' ? DATA_SOURCES_C : DATA_SOURCES_B
  const slackCount = scenario.slackContext?.length || 0

  return (
    <div>
      <Breadcrumbs />
      <SimulationController id={id}>
        <div className="flex gap-4">

          {/* ═══════ LEFT SIDEBAR ═══════ */}
          <LeftSidebar scenario={scenario} dataSources={dataSources} id={id} />

          {/* ═══════ CENTER CANVAS ═══════ */}
          <div className="flex-1 space-y-4 min-w-0">
            <CenterCanvasContent scenario={scenario} id={id} sev={sev} phaseLabel={phase} slackCount={slackCount} navigate={navigate} />
          </div>

          {/* ═══════ RIGHT CHAT PANEL ═══════ */}
          <ChatPanel scenario={scenario} id={id} />
        </div>
      </SimulationController>
    </div>
  )
}
