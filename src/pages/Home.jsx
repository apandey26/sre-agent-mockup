import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Clock, ArrowRight, Plus, ChevronDown, ChevronUp,
  Shield, Bell, MessageSquare, CheckCircle, Brain,
  Search, TrendingUp, Target, X, GitBranch, TrendingDown,
  Settings, Globe,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { investigations, analytics } from '../data'
import NewInvestigationModal from '../components/NewInvestigationModal'
import InvestigationPreview from '../components/InvestigationPreview'
import Knowledge from './Knowledge'
import PlatformHub from './PlatformHub'
import SettingsAnalytics from './SettingsAnalytics'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

/* ── design tokens ────────────────────────────── */
const SEV = {
  P1: { dot: 'bg-[#FF4D4D]', variant: 'p1' },
  P2: { dot: 'bg-[#F5A623]', variant: 'p2' },
  P3: { dot: 'bg-[#0B6ACB]', variant: 'p3' },
}
const PHASE = {
  context:    { color: 'text-[#0B6ACB]', label: 'Context' },
  hypotheses: { color: 'text-[#F5A623]', label: 'Hypotheses' },
  rootCause:  { color: 'text-[#00D4A0]', label: 'Root Cause' },
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

const TABS = [
  { key: 'overview', label: 'Overview', icon: Search },
  { key: 'knowledge', label: 'Knowledge', icon: Brain },
  { key: 'platform', label: 'Platform', icon: Globe },
  { key: 'settings', label: 'Settings', icon: Settings },
]

/* ── main page ────────────────────────────────── */
export default function Home({ newInvTrigger }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const [modalOpen, setModalOpen] = useState(false)
  const [previewId, setPreviewId] = useState(null)

  useEffect(() => {
    if (newInvTrigger > 0) setModalOpen(true)
  }, [newInvTrigger])

  const setTab = (key) => {
    if (key === 'overview') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: key })
    }
  }

  return (
    <div>
      <NewInvestigationModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-100 pb-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'text-[#0B6ACB] bg-[#0B6ACB]/5'
                  : 'text-[#6B7280] hover:text-[#1D2433] hover:bg-gray-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'overview' && <OverviewTab navigate={navigate} modalOpen={modalOpen} setModalOpen={setModalOpen} onPreview={setPreviewId} />}
      {activeTab === 'knowledge' && <Knowledge />}
      {activeTab === 'platform' && <PlatformHub />}
      {activeTab === 'settings' && <SettingsAnalytics />}

      {/* ── Investigation Preview Panel ── */}
      <AnimatePresence>
        {previewId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 z-30"
              onClick={() => setPreviewId(null)}
            />
            <InvestigationPreview investigationId={previewId} onClose={() => setPreviewId(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Overview Tab (current dashboard) ────────── */
function OverviewTab({ navigate, modalOpen, setModalOpen, onPreview }) {
  const [briefOpen, setBriefOpen] = useState(true)
  const [nudgeVisible, setNudgeVisible] = useState(true)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Nudge */}
      {nudgeVisible && (
        <motion.div variants={fadeUp} className="bg-[#0B6ACB]/5 border border-[#0B6ACB]/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <GitBranch size={16} className="text-[#0B6ACB] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#1D2433] font-medium">Connect GitHub for better investigation results</p>
            <p className="text-[11px] text-[#6B7280]">Deployment diffs help the agent identify root causes faster.</p>
          </div>
          <Button size="sm" onClick={() => setNudgeVisible(false)}>Connect GitHub</Button>
          <button onClick={() => setNudgeVisible(false)} className="text-[#6B7280] hover:text-[#1D2433] shrink-0"><X size={14} /></button>
        </motion.div>
      )}

      {/* Morning Brief */}
      <motion.div variants={fadeUp} className="bg-gradient-to-r from-[#1D252C] to-[#263040] rounded-xl mb-6 text-white overflow-hidden">
        <button onClick={() => setBriefOpen(o => !o)} className="w-full flex items-center gap-2 px-5 pt-4 pb-3 text-left">
          <Sun size={15} className="text-[#F5A623] shrink-0" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white/60">Morning Brief</span>
          <span className="text-[11px] text-white/40 ml-auto mr-2">April 9, 2026 — 9:02 AM</span>
          {briefOpen ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
        </button>
        {briefOpen && (
          <div className="px-5 pb-4 space-y-3">
            <p className="text-[14px] leading-relaxed">
              While you were away — <span className="text-[#00D4A0]">3 alerts auto-resolved</span>,{' '}
              <span className="text-[#FF4D4D]">1 needs attention</span>.{' '}
              <span className="text-[#F5A623]">checkout-service SLO budget at 50%</span>.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><Shield size={11} /> On-call: checkout-team until 9 AM</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} /> 14 Slack messages in #incidents-prod</span>
              <span className="flex items-center gap-1"><Bell size={11} /> PagerDuty: 1 open, 2 ack'd</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Active Investigations */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#1D2433]">Active Investigations</h2>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{investigations.active.length} active</Badge>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={13} /> New Investigation
            </Button>
          </div>
        </div>
        <div className={`grid ${investigations.active.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
          {investigations.active.map(inv => {
            const sev = SEV[inv.severity] || SEV.P2
            const phase = PHASE[inv.phase] || PHASE.context
            return (
              <Card key={inv.id} className="cursor-pointer group transition-shadow hover:shadow-md p-4" onClick={() => onPreview(inv.id)}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`w-2 h-2 rounded-full ${sev.dot} animate-pulse`} />
                  <span className="text-[13px] font-semibold text-[#1D2433]">{inv.entity}</span>
                  <Badge variant="secondary" className="text-[10px]">{inv.environment}</Badge>
                  <Badge variant={sev.variant} className="ml-auto">{inv.severity}</Badge>
                </div>
                <p className="text-[12px] text-[#6B7280] truncate mb-2">{inv.trigger}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mb-3">
                  <Clock size={11} className="shrink-0" />
                  <span>{inv.elapsedTime}</span>
                  <span className="text-[#D1D5DB]">·</span>
                  <span className={`font-medium ${phase.color}`}>{phase.label}</span>
                  <span className="text-[#D1D5DB]">·</span>
                  <span>{inv.hypothesisCount} hypotheses</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-3">
                  Top: &ldquo;{inv.topHypothesis}&rdquo; — <span className="font-semibold text-[#1D2433]">{inv.topConfidence}%</span>
                </p>
                <span className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-1 group-hover:underline">
                  Preview <ArrowRight size={11} />
                </span>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'MTTR This Week', value: '22 min', trend: '↓ 18%', good: true, icon: TrendingUp },
          { label: 'Investigations', value: '12', sub: '8 resolved · 3 active', icon: Search },
          { label: 'Accuracy', value: '78%', trend: '↑ 5%', good: true, icon: Target },
          { label: 'Eval Score', value: '84%', trend: '↑ 12%', good: true, icon: Shield },
          { label: 'Memory Reuse', value: '34%', trend: '↑ 12%', good: true, icon: Brain },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={13} className="text-[#6B7280]" />
              <span className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#1D2433]">{s.value}</span>
              {s.trend && <Badge variant={s.good ? 'good' : 'destructive'} className="text-[11px]">{s.trend}</Badge>}
            </div>
            {s.sub && <p className="text-[11px] text-[#6B7280] mt-0.5">{s.sub}</p>}
          </Card>
        ))}
      </motion.div>

      {/* Trends */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={13} className="text-[#6B7280]" />
              <span className="text-[13px] font-semibold text-[#1D2433]">MTTR Trend</span>
            </div>
            <Badge variant="secondary" className="text-[9px]">8 weeks</Badge>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={analytics.mttrTrend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="mttr-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="mttr" stroke="#0B6ACB" strokeWidth={2} fill="url(#mttr-grad)" dot={{ r: 2.5, fill: '#0B6ACB' }} animationDuration={600} />
              <RTooltip formatter={v => [`${v} min`, 'MTTR']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-[#6B7280] mt-2">
            Down from <span className="font-medium text-[#1D2433]">38 min</span> to <span className="font-medium text-[#00D4A0]">20 min</span> — agent is getting faster
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#1D2433]">Root Cause Breakdown</span>
            <Badge variant="secondary" className="text-[9px]">Last 30 days</Badge>
          </div>
          <div className="w-full h-4 rounded-full overflow-hidden flex mb-4">
            {analytics.rootCauseDistribution.map(d => (
              <div key={d.category} style={{ width: `${d.percent}%`, backgroundColor: { Deployment: '#0B6ACB', Configuration: '#F5A623', Capacity: '#FF4D4D', Dependency: '#9333EA', Unknown: '#6B7280' }[d.category] || '#6B7280' }} className="h-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {analytics.rootCauseDistribution.map(d => (
              <div key={d.category} className="flex items-center gap-2 text-[11px]">
                <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: { Deployment: '#0B6ACB', Configuration: '#F5A623', Capacity: '#FF4D4D', Dependency: '#9333EA', Unknown: '#6B7280' }[d.category] }} />
                <span className="text-[#1D2433] flex-1">{d.category}</span>
                <span className="text-[#6B7280] font-medium">{d.percent}%</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent Investigations */}
      <motion.div variants={fadeUp}>
        <h2 className="text-[15px] font-semibold text-[#1D2433] mb-3">Recent Investigations</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100">
                <TableHead>Entity</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Root Cause</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Memory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investigations.recent.map(inv => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/investigation/${inv.id}`)}>
                  <TableCell className="font-medium text-[#1D2433]">{inv.entity}</TableCell>
                  <TableCell className="text-[#6B7280]">{inv.trigger}</TableCell>
                  <TableCell className="text-[#1D2433]">{inv.rootCause}</TableCell>
                  <TableCell className="text-[#6B7280]">{inv.duration}</TableCell>
                  <TableCell>
                    {inv.confidence
                      ? <span className="font-medium text-[#00D4A0]">{inv.confidence}%</span>
                      : <span className="text-[#6B7280]">N/A</span>}
                  </TableCell>
                  <TableCell>
                    {inv.memoryCreated
                      ? <CheckCircle size={14} className="text-[#00D4A0]" />
                      : <span className="text-[#D1D5DB]">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </motion.div>
  )
}
