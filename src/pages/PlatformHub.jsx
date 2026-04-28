import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Plug, ChevronDown, CheckCircle, ArrowLeft,
  Bell, MessageSquare, Video, GitBranch, FileText,
  Ticket, RefreshCw, BookOpen, Users, Zap, Key, Cloud, Search, Copy,
  ExternalLink, Clock, AlertCircle, Settings, Plus, Lock, Shield,
} from 'lucide-react'
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { mcpPlatform } from '../data'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }

/* ── Integration definitions ─────────────────── */
const INTEGRATIONS = [
  {
    id: 'pagerduty', name: 'PagerDuty', icon: Bell, tier: 'Incident Management',
    status: 'connected', connectedAs: '@sre-agent-prod',
    dataIn: [
      { label: 'Active incidents & alerts', type: 'real-time', lastData: '2 min ago' },
      { label: 'On-call schedules & escalation policies', type: 'pull', lastData: '15 min ago' },
      { label: 'Change events (deploy correlation)', type: 'real-time', lastData: '8 min ago' },
      { label: 'Postmortem reports', type: 'pull', lastData: '2 days ago' },
      { label: 'Service dependency map', type: 'pull', lastData: '1 hr ago' },
    ],
    actionsOut: [
      { label: 'Acknowledge / resolve incidents', enabled: true },
      { label: 'Add investigation notes', enabled: true },
      { label: 'Trigger new incident', enabled: false },
      { label: 'Set maintenance windows', enabled: true },
    ],
    stats: { eventsWeek: 12400, lastSync: '2 min ago', latency: 120 },
    sparkline: [800, 1200, 900, 1100, 1400, 1800, 2100],
  },
  {
    id: 'servicenow', name: 'ServiceNow', icon: Ticket, tier: 'Incident Management',
    status: 'connected', connectedAs: 'sre-agent@company.service-now.com',
    dataIn: [
      { label: 'CMDB configuration items & relationships', type: 'pull', lastData: '30 min ago' },
      { label: 'Incident records & work notes', type: 'real-time', lastData: '5 min ago' },
      { label: 'Change requests', type: 'pull', lastData: '1 hr ago' },
      { label: 'Knowledge base articles & runbooks', type: 'pull', lastData: '3 hr ago' },
      { label: 'Problem records (recurring issues)', type: 'pull', lastData: '1 day ago' },
      { label: 'SLA tracking & breach alerts', type: 'real-time', lastData: '12 min ago' },
    ],
    actionsOut: [
      { label: 'Create / update incident records', enabled: true },
      { label: 'Add work notes with findings', enabled: true },
      { label: 'Link related incidents & problems', enabled: true },
      { label: 'Update CMDB', enabled: false },
    ],
    stats: { eventsWeek: 8200, lastSync: '5 min ago', latency: 340 },
    sparkline: [600, 700, 750, 800, 900, 1000, 1200],
  },
  {
    id: 'slack', name: 'Slack', icon: MessageSquare, tier: 'Communication',
    status: 'connected', connectedAs: '@SRE Agent Bot',
    dataIn: [
      { label: 'Incident channel messages & threads', type: 'real-time', lastData: 'Just now' },
      { label: 'Pinned messages (key decisions)', type: 'pull', lastData: '10 min ago' },
      { label: 'Reactions as signal (👀 = investigating)', type: 'real-time', lastData: '3 min ago' },
      { label: 'File attachments (screenshots, logs)', type: 'pull', lastData: '20 min ago' },
      { label: 'User mentions (who is involved)', type: 'real-time', lastData: '1 min ago' },
    ],
    actionsOut: [
      { label: 'Post investigation updates', enabled: true },
      { label: 'Create war room channel', enabled: true },
      { label: 'Thread replies with evidence', enabled: true },
      { label: 'React to messages', enabled: true },
    ],
    stats: { eventsWeek: 34200, lastSync: 'Just now', latency: 80 },
    sparkline: [3000, 3500, 4200, 4800, 5100, 5500, 4900],
  },
  {
    id: 'teams', name: 'Microsoft Teams', icon: Users, tier: 'Communication',
    status: 'connected', connectedAs: 'SRE Agent App',
    dataIn: [
      { label: 'Channel messages from incident channels', type: 'real-time', lastData: '8 min ago' },
      { label: 'Meeting transcripts (war room recordings)', type: 'pull', lastData: '2 hr ago' },
      { label: 'User presence (online / in meeting)', type: 'real-time', lastData: '1 min ago' },
      { label: 'Adaptive card responses', type: 'real-time', lastData: '30 min ago' },
    ],
    actionsOut: [
      { label: 'Post investigation cards', enabled: true },
      { label: 'Schedule war room meetings', enabled: true },
      { label: 'Send approval requests', enabled: false },
    ],
    stats: { eventsWeek: 5600, lastSync: '8 min ago', latency: 210 },
    sparkline: [400, 500, 600, 700, 800, 900, 800],
  },
  {
    id: 'zoom', name: 'Zoom', icon: Video, tier: 'Communication',
    status: 'warning', connectedAs: 'SRE Agent OAuth', warningMsg: 'OAuth token expires in 3 days',
    dataIn: [
      { label: 'War room meeting transcripts', type: 'pull', lastData: '1 hr ago' },
      { label: 'Meeting participant list & duration', type: 'pull', lastData: '1 hr ago' },
      { label: 'In-meeting chat messages', type: 'pull', lastData: '2 hr ago' },
      { label: 'Action items from transcript', type: 'pull', lastData: '1 hr ago' },
    ],
    actionsOut: [
      { label: 'Create war room meeting link', enabled: true },
      { label: 'Add summary to post-mortem', enabled: true },
    ],
    stats: { eventsWeek: 1200, lastSync: '1 hr ago', latency: 450 },
    sparkline: [100, 120, 150, 200, 180, 160, 170],
  },
  {
    id: 'github', name: 'GitHub', icon: GitBranch, tier: 'Code & Deploy',
    status: 'connected', connectedAs: '@sre-agent-bot',
    dataIn: [
      { label: 'Recent PRs & commits (deploy diffs)', type: 'pull', lastData: '3 min ago' },
      { label: 'Deployment events & status', type: 'real-time', lastData: '12 min ago' },
      { label: 'GitHub Actions workflow runs', type: 'real-time', lastData: '5 min ago' },
      { label: 'Code search (find related patterns)', type: 'pull', lastData: 'On demand' },
      { label: 'CODEOWNERS (who to page)', type: 'pull', lastData: '1 day ago' },
    ],
    actionsOut: [
      { label: 'Create PRs with fix suggestions', enabled: true },
      { label: 'Comment on PRs with findings', enabled: true },
      { label: 'Trigger rollback workflow', enabled: false },
    ],
    stats: { eventsWeek: 6800, lastSync: '3 min ago', latency: 150 },
    sparkline: [500, 600, 700, 800, 900, 1000, 970],
  },
  {
    id: 'argocd', name: 'ArgoCD', icon: RefreshCw, tier: 'Code & Deploy',
    status: 'connected', connectedAs: 'sre-agent-sa',
    dataIn: [
      { label: 'Application sync status & health', type: 'real-time', lastData: '1 min ago' },
      { label: 'Deployment history & revisions', type: 'pull', lastData: '5 min ago' },
      { label: 'Rollback targets (available versions)', type: 'pull', lastData: '5 min ago' },
    ],
    actionsOut: [
      { label: 'Trigger application sync', enabled: true },
      { label: 'Execute rollback to revision', enabled: true },
    ],
    stats: { eventsWeek: 2100, lastSync: '1 min ago', latency: 90 },
    sparkline: [200, 250, 300, 350, 300, 280, 300],
  },
  {
    id: 'confluence', name: 'Confluence', icon: BookOpen, tier: 'Knowledge',
    status: 'connected', connectedAs: 'SRE Agent OAuth',
    dataIn: [
      { label: 'Runbook pages (step-by-step)', type: 'pull', lastData: '15 min ago' },
      { label: 'Past postmortem documents', type: 'pull', lastData: '2 days ago' },
      { label: 'Architecture decision records', type: 'pull', lastData: '1 week ago' },
      { label: 'Service ownership docs', type: 'pull', lastData: '3 days ago' },
    ],
    actionsOut: [
      { label: 'Create postmortem page', enabled: true },
      { label: 'Update runbook with learnings', enabled: true },
    ],
    stats: { eventsWeek: 800, lastSync: '15 min ago', latency: 280 },
    sparkline: [80, 90, 100, 120, 110, 100, 115],
  },
  {
    id: 'jira', name: 'Jira', icon: Ticket, tier: 'Knowledge',
    status: 'disconnected', connectedAs: null,
    valueProp: 'Track incident tickets, link investigations to issues, auto-create action items from post-mortems.',
    prerequisites: 'Jira Cloud admin access required. Supports Jira Cloud only (not Server/Data Center).',
    permissions: ['Read: Issues, Projects, Boards', 'Write: Create issues, Add comments, Transition status', 'Webhooks: Issue created, Issue updated'],
    dataIn: [
      { label: 'Issue details & status', type: 'pull', lastData: null },
      { label: 'Sprint & board data', type: 'pull', lastData: null },
      { label: 'Issue webhooks (created/updated)', type: 'real-time', lastData: null },
    ],
    actionsOut: [
      { label: 'Create incident tickets', enabled: false },
      { label: 'Add investigation comments', enabled: false },
      { label: 'Transition issue status', enabled: false },
    ],
    stats: { eventsWeek: 0, lastSync: null, latency: null },
    sparkline: [],
  },
  {
    id: 'statuspage', name: 'Statuspage', icon: Globe, tier: 'Communication',
    status: 'disconnected', connectedAs: null,
    valueProp: 'Automatically update status page during incidents. Post real-time component status from investigation findings.',
    prerequisites: 'Atlassian Statuspage account. API key with manage permissions.',
    permissions: ['Read: Components, Incidents, Subscribers', 'Write: Create/update incidents, Update component status'],
    dataIn: [
      { label: 'Component status', type: 'pull', lastData: null },
      { label: 'Active status incidents', type: 'pull', lastData: null },
    ],
    actionsOut: [
      { label: 'Create status incident', enabled: false },
      { label: 'Update component status', enabled: false },
    ],
    stats: { eventsWeek: 0, lastSync: null, latency: null },
    sparkline: [],
  },
  {
    id: 'terraform', name: 'Terraform Cloud', icon: Cloud, tier: 'Code & Deploy',
    status: 'disconnected', connectedAs: null,
    valueProp: 'Correlate infrastructure changes with incidents. See Terraform plan/apply events in investigation timeline.',
    prerequisites: 'Terraform Cloud or Enterprise. Team-level API token required.',
    permissions: ['Read: Workspaces, Runs, State versions', 'Write: Trigger runs (for remediation)'],
    dataIn: [
      { label: 'Workspace runs & applies', type: 'real-time', lastData: null },
      { label: 'State file changes', type: 'pull', lastData: null },
      { label: 'Plan diffs', type: 'pull', lastData: null },
    ],
    actionsOut: [
      { label: 'Trigger remediation run', enabled: false },
    ],
    stats: { eventsWeek: 0, lastSync: null, latency: null },
    sparkline: [],
  },
]

const ACTIVITY_FEED = {
  pagerduty: [
    { time: '2 min ago', event: 'Ingested incident PD-7234 (P1 checkout-service)', type: 'ingest', detail: 'Alert → Investigation' },
    { time: '8 min ago', event: 'Ingested change event: deployment v2.4.1', type: 'ingest', detail: 'Correlated with alert' },
    { time: '12 min ago', event: 'Added investigation note to PD-7234', type: 'action', detail: 'Root cause summary' },
    { time: '45 min ago', event: 'Pulled on-call schedule for checkout-team', type: 'ingest', detail: 'Sarah K. on-call' },
    { time: '1 hr ago', event: 'Acknowledged incident PD-7189 automatically', type: 'action', detail: 'Auto-ack policy' },
  ],
  slack: [
    { time: 'Just now', event: 'Read 3 new messages in #incidents-prod', type: 'ingest', detail: '5 threads tracked' },
    { time: '1 min ago', event: 'Detected 👀 reaction on alert thread (investigating)', type: 'ingest', detail: 'Signal captured' },
    { time: '5 min ago', event: 'Posted investigation update to #incidents-prod', type: 'action', detail: 'RCA summary' },
    { time: '22 min ago', event: 'Created war room channel #war-checkout-0892', type: 'action', detail: '4 members invited' },
    { time: '30 min ago', event: 'Ingested pinned message: "rollback approved"', type: 'ingest', detail: 'Key decision' },
  ],
  zoom: [
    { time: '1 hr ago', event: 'Ingested transcript from war room meeting', type: 'ingest', detail: '47 min, 6 participants' },
    { time: '1 hr ago', event: 'Extracted 3 action items from transcript', type: 'ingest', detail: 'Added to post-mortem' },
    { time: '3 hr ago', event: 'OAuth token refresh warning', type: 'error', detail: 'Expires in 3 days' },
    { time: '1 day ago', event: 'Ingested transcript from incident standup', type: 'ingest', detail: '12 min, 4 participants' },
    { time: '2 days ago', event: 'Created war room meeting link', type: 'action', detail: 'Sent to Slack' },
  ],
  github: [
    { time: '3 min ago', event: 'Pulled PR #1847: Remove eager loading', type: 'ingest', detail: '3 files changed' },
    { time: '5 min ago', event: 'Detected deployment via GitHub Actions', type: 'ingest', detail: 'v2.4.1 → prod' },
    { time: '12 min ago', event: 'Commented on PR #1847 with investigation findings', type: 'action', detail: 'N+1 query identified' },
    { time: '1 hr ago', event: 'Searched codebase for order_items.rb pattern', type: 'ingest', detail: '3 matches found' },
    { time: '2 hr ago', event: 'Pulled CODEOWNERS for checkout-service', type: 'ingest', detail: '@sarah-k, @mike-t' },
  ],
  default: [
    { time: '5 min ago', event: 'Synced latest data', type: 'ingest', detail: 'All streams healthy' },
    { time: '30 min ago', event: 'Processed 142 events', type: 'ingest', detail: 'Batch complete' },
    { time: '1 hr ago', event: 'Connection health check passed', type: 'ingest', detail: 'Latency normal' },
    { time: '3 hr ago', event: 'Ingested updated configuration', type: 'ingest', detail: 'No changes detected' },
    { time: '6 hr ago', event: 'Rotated authentication token', type: 'action', detail: 'Auto-renewal' },
  ],
}

const TIER_ORDER = ['Incident Management', 'Communication', 'Code & Deploy', 'Knowledge']
const STATUS_DOT = { connected: 'bg-[#00D4A0]', warning: 'bg-[#F5A623]', disconnected: 'bg-gray-300' }

/* ── Main component ──────────────────────────── */
/* ── Level 2: Integration Detail ─────────────── */
function IntegrationDetail({ integration: int, onBack }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [actionToggles, setActionToggles] = useState(() => {
    const m = {}; int.actionsOut.forEach((a, i) => { m[i] = a.enabled }); return m
  })
  const [tryingAction, setTryingAction] = useState(null)
  const [tryResult, setTryResult] = useState(null)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const runTest = () => {
    setTesting(true); setTestResult(null)
    setTimeout(() => { setTesting(false); setTestResult({ ok: true, latency: int.stats.latency, time: 'Just now' }) }, 1500)
  }

  const tryAction = (idx, label) => {
    setTryingAction(idx); setTryResult(null)
    setTimeout(() => {
      setTryingAction(null)
      setTryResult({ idx, ok: true, msg: `✓ Simulated: "${label}" executed successfully` })
      setTimeout(() => setTryResult(null), 4000)
    }, 1200)
  }

  const TYPE_BADGE = { 'real-time': { label: 'Real-time', cls: 'bg-[#00D4A0]/8 text-[#059669]' }, pull: { label: 'Pull', cls: 'bg-[#0B6ACB]/8 text-[#0B6ACB]' } }

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[#0B6ACB] font-medium mb-4 hover:underline">
        <ArrowLeft size={13} /> Back to Integrations
      </button>

      {/* Warning banner */}
      {int.status === 'warning' && int.warningMsg && (
        <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-[#B45309] shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-medium text-[#B45309]">{int.warningMsg}</p>
            <p className="text-[10px] text-[#6B7280]">Reauthenticate to prevent disruption to data collection.</p>
          </div>
          <Button size="sm" className="bg-[#F5A623] hover:bg-[#E09915] text-white text-[11px]" onClick={() => setWizardOpen(true)}>
            Reauthenticate
          </Button>
        </div>
      )}

      {/* ── Section A: Status & Health ── */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${int.status === 'connected' ? 'bg-[#00D4A0]/8' : int.status === 'warning' ? 'bg-[#F5A623]/8' : 'bg-gray-100'}`}>
            <int.icon size={24} className={int.status === 'connected' ? 'text-[#059669]' : int.status === 'warning' ? 'text-[#B45309]' : 'text-[#6B7280]'} />
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#1D2433]">{int.name}</h2>
            <p className="text-[12px] text-[#6B7280]">Connected as <span className="font-medium text-[#1D2433]">{int.connectedAs}</span></p>
          </div>
          {int.status === 'warning'
            ? <Badge variant="warning" className="text-[10px]">Needs Attention</Badge>
            : <Badge variant="good" className="text-[10px]">Active & Healthy</Badge>
          }
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-[#F7F8FA] rounded-lg p-3">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-0.5">Events / Week</p>
            <p className="text-[16px] font-bold text-[#1D2433]">{(int.stats.eventsWeek / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-[#F7F8FA] rounded-lg p-3">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-0.5">Latency</p>
            <p className="text-[16px] font-bold text-[#1D2433]">{int.stats.latency}ms</p>
          </div>
          <div className="bg-[#F7F8FA] rounded-lg p-3">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-0.5">Data Streams</p>
            <p className="text-[16px] font-bold text-[#0B6ACB]">{int.dataIn.length}</p>
          </div>
          <div className="bg-[#F7F8FA] rounded-lg p-3">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-0.5">Actions</p>
            <p className="text-[16px] font-bold text-[#9333EA]">{int.actionsOut.length}</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-[50px] w-full mb-2">
          <ResponsiveContainer width="100%" height={50}>
            <AreaChart data={int.sparkline.map((v, i) => ({ day: `Day ${i + 1}`, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`detail-${int.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} />
              <Area type="monotone" dataKey="v" stroke="#0B6ACB" strokeWidth={1.5} fill={`url(#detail-${int.id})`} dot={{ r: 2, fill: '#0B6ACB' }} animationDuration={600} />
              <RTooltip formatter={v => [`${v.toLocaleString()} events`, 'Volume']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
            {testing ? <><RefreshCw size={11} className="animate-spin" /> Testing...</> : 'Test Connection'}
          </Button>
          {testResult && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
              <CheckCircle size={11} /> Connected in {testResult.latency}ms
            </motion.span>
          )}
          <span className="text-[10px] text-[#6B7280] ml-auto">Last sync: {int.stats.lastSync}</span>
        </div>
      </Card>

      {/* ── Section B: Data Flow ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Data IN */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeft size={12} className="text-[#0B6ACB] rotate-180" />
            <span className="text-[13px] font-semibold text-[#1D2433]">Data Feeds Into Agent</span>
          </div>
          <div className="space-y-1.5">
            {int.dataIn.map((d, i) => {
              const tb = TYPE_BADGE[d.type] || TYPE_BADGE.pull
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.type === 'real-time' ? 'bg-[#00D4A0]' : 'bg-[#0B6ACB]'}`} />
                  <span className="text-[12px] text-[#1D2433] flex-1">{d.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${tb.cls}`}>{tb.label}</span>
                  <span className="text-[9px] text-[#6B7280]">{d.lastData}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Actions OUT */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={12} className="text-[#9333EA]" />
            <span className="text-[13px] font-semibold text-[#1D2433]">Agent Can Execute</span>
          </div>
          <div className="space-y-1.5">
            {int.actionsOut.map((a, i) => {
              const isOn = actionToggles[i]
              const isTrying = tryingAction === i
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Toggle */}
                  <button onClick={() => setActionToggles(p => ({ ...p, [i]: !p[i] }))}
                    className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isOn ? 'bg-[#00D4A0] justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                  </button>
                  <span className={`text-[12px] flex-1 ${isOn ? 'text-[#1D2433]' : 'text-[#6B7280] line-through'}`}>{a.label}</span>
                  {isOn && (
                    <Button variant="outline" size="sm" className="text-[9px] h-5 px-1.5"
                      disabled={isTrying} onClick={() => tryAction(i, a.label)}>
                      {isTrying ? <RefreshCw size={9} className="animate-spin" /> : 'Try it'}
                    </Button>
                  )}
                </div>
              )
            })}
            {/* Try result */}
            <AnimatePresence>
              {tryResult && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-[#00D4A0]/5 border border-[#00D4A0]/15 rounded-lg px-3 py-2 mt-1">
                  <p className="text-[11px] text-[#059669] font-medium">{tryResult.msg}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* ── Activity Feed ── */}
      <Card className="p-4 mb-4">
        <span className="text-[13px] font-semibold text-[#1D2433] block mb-3">Recent Activity</span>
        <div className="space-y-1">
          {(ACTIVITY_FEED[int.id] || ACTIVITY_FEED.default).map((event, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 text-[11px]">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.type === 'ingest' ? 'bg-[#0B6ACB]' : event.type === 'action' ? 'bg-[#9333EA]' : event.type === 'error' ? 'bg-[#FF4D4D]' : 'bg-[#6B7280]'}`} />
              <span className="text-[#6B7280] w-[65px] shrink-0">{event.time}</span>
              <span className="text-[#1D2433] flex-1">{event.event}</span>
              <span className="text-[9px] text-[#6B7280]">{event.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Section C: Configuration ── */}
      <Card className="p-4">
        <span className="text-[13px] font-semibold text-[#1D2433] block mb-3">Configuration</span>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <Settings size={11} /> Reconfigure
          </Button>
          {!showDisconnect ? (
            <Button variant="ghost" size="sm" className="text-[#FF4D4D]" onClick={() => setShowDisconnect(true)}>
              Disconnect
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#FF4D4D]">Disconnect {int.name}?</span>
              <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => { setShowDisconnect(false); toast(`${int.name} disconnected`); onBack() }}>
                Yes, Disconnect
              </Button>
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setShowDisconnect(false)}>Cancel</Button>
            </div>
          )}
          <div className="ml-auto text-[10px] text-[#6B7280] space-x-4">
            <span>Rate limit: 1,000 req/min</span>
            <span>Retry policy: 3x with backoff</span>
            <span>Timeout: 30s</span>
          </div>
        </div>
      </Card>

      {/* Configuration Wizard */}
      <AnimatePresence>
        {wizardOpen && (
          <ConfigWizard integration={int} onClose={() => setWizardOpen(false)} onDone={() => { setWizardOpen(false); toast(`${int.name} reconfigured`) }} />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Level 3: Configuration Wizard ───────────── */
const SCOPE_OPTIONS = {
  pagerduty: ['All Services', 'checkout-service', 'api-gateway', 'payment-gateway', 'search-service'],
  servicenow: ['Production Instance', 'Staging Instance', 'All CIs', 'Application CIs only'],
  slack: ['#incidents-prod', '#incidents-staging', '#sre-team', '#on-call', '#war-room-*'],
  teams: ['Incidents Team', 'SRE Channel', 'War Room Meetings', 'All Channels'],
  zoom: ['All Recordings', 'War Room Meetings Only', 'Incident-tagged Meetings'],
  github: ['org/checkout-service', 'org/api-gateway', 'org/payment-gateway', 'org/infra-configs', 'All Repositories'],
  argocd: ['checkout-service', 'api-gateway', 'payment-gateway', 'All Applications'],
  confluence: ['ENG Space', 'SRE Runbooks', 'Postmortems', 'All Spaces'],
}

function ConfigWizard({ integration: int, onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [authState, setAuthState] = useState('idle') // idle | connecting | connected
  const [selectedScopes, setSelectedScopes] = useState(new Set())
  const [streamToggles, setStreamToggles] = useState(() => {
    const m = {}; int.dataIn.forEach((_, i) => { m[i] = true }); return m
  })
  const [syncFreq, setSyncFreq] = useState('5min')
  const [testState, setTestState] = useState('idle') // idle | running | pass | fail

  const scopes = SCOPE_OPTIONS[int.id] || ['Default Scope']

  const toggleScope = (s) => setSelectedScopes(prev => {
    const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next
  })

  const runAuth = () => {
    setAuthState('connecting')
    setTimeout(() => {
      setAuthState('connected')
      // Auto-advance to step 2 after 1s
      setTimeout(() => setStep(2), 1000)
    }, 2000)
  }

  const runTest = () => {
    setTestState('running')
    setTimeout(() => {
      setTestState('pass')
      // Auto-advance to Done after 1.5s
      setTimeout(() => setStep(5), 1500)
    }, 2000)
  }

  const STEPS = ['Authenticate', 'Select Scope', 'Data Streams', 'Test', 'Done']

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Modal */}
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="fixed inset-x-0 top-[10%] mx-auto w-[560px] max-h-[75vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <int.icon size={18} className="text-[#059669]" />
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-[#1D2433]">Configure {int.name}</h3>
            <p className="text-[11px] text-[#6B7280]">Step {step} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1D2433] text-[18px]">×</button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 flex items-center gap-1 border-b border-gray-50 shrink-0">
          {STEPS.map((s, i) => {
            const stepNum = i + 1
            const isDone = stepNum < step
            const isCurrent = stepNum === step
            return (
              <div key={s} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isDone ? 'bg-[#00D4A0] text-white' : isCurrent ? 'bg-[#0B6ACB] text-white' : 'bg-gray-100 text-[#6B7280]'
                }`}>
                  {isDone ? <CheckCircle size={12} /> : stepNum}
                </div>
                <span className={`text-[10px] mx-1.5 ${isCurrent ? 'text-[#1D2433] font-medium' : 'text-[#6B7280]'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-6 h-[2px] ${isDone ? 'bg-[#00D4A0]' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          {/* Step 1: Authenticate */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#6B7280]">Authenticate with {int.name} to allow the SRE Agent to read data and execute actions.</p>
              {authState === 'idle' && (
                <Button onClick={runAuth} className="w-full">
                  <int.icon size={14} /> Connect with OAuth
                </Button>
              )}
              {authState === 'connecting' && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <RefreshCw size={16} className="text-[#0B6ACB] animate-spin" />
                  <span className="text-[13px] text-[#0B6ACB]">Connecting to {int.name}...</span>
                </div>
              )}
              {authState === 'connected' && (
                <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-4 text-center">
                  <CheckCircle size={24} className="text-[#00D4A0] mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-[#1D2433]">Connected as {int.connectedAs}</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Authentication successful</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Scope */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">Select which {int.name} resources the agent can access.</p>
              <div className="space-y-1.5">
                {scopes.map(scope => {
                  const isSelected = selectedScopes.has(scope)
                  return (
                    <button key={scope} onClick={() => toggleScope(scope)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                        isSelected ? 'bg-[#0B6ACB]/5 border border-[#0B6ACB]/20' : 'border border-gray-100 hover:border-gray-200'
                      }`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0B6ACB] border-[#0B6ACB]' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <span className="text-[13px] text-[#1D2433]">{scope}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Data Streams */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">Choose which data streams to enable and set sync frequency.</p>
              <div className="space-y-1.5">
                {int.dataIn.map((d, i) => {
                  const isOn = streamToggles[i]
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50">
                      <button onClick={() => setStreamToggles(p => ({ ...p, [i]: !p[i] }))}
                        className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isOn ? 'bg-[#00D4A0] justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                      </button>
                      <span className={`text-[12px] flex-1 ${isOn ? 'text-[#1D2433]' : 'text-[#6B7280] line-through'}`}>{d.label}</span>
                      <Badge variant={d.type === 'real-time' ? 'good' : 'default'} className="text-[9px]">{d.type}</Badge>
                    </div>
                  )
                })}
              </div>
              <div className="pt-2">
                <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Sync Frequency (for pull-based streams)</p>
                <div className="flex gap-1.5">
                  {['1min', '5min', '15min', '1hr'].map(f => (
                    <Button key={f} variant={syncFreq === f ? 'default' : 'outline'} size="sm" className="text-[11px]"
                      onClick={() => setSyncFreq(f)}>{f}</Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Test */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#6B7280]">Send a test event to verify the integration is working end-to-end.</p>
              {testState === 'idle' && (
                <Button onClick={runTest} className="w-full">
                  <Zap size={14} /> Send Test Event
                </Button>
              )}
              {testState === 'running' && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <RefreshCw size={16} className="text-[#0B6ACB] animate-spin" />
                  <span className="text-[13px] text-[#0B6ACB]">Sending test event to {int.name}...</span>
                </div>
              )}
              {testState === 'pass' && (
                <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-[#00D4A0]" />
                    <span className="text-[13px] font-medium text-[#1D2433]">Test passed</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] space-y-1">
                    <p>✓ Authentication: Valid ({int.stats.latency}ms)</p>
                    <p>✓ Data read: {int.dataIn.filter((_, i) => streamToggles[i]).length} streams accessible</p>
                    <p>✓ Action write: {int.actionsOut.filter(a => a.enabled).length} actions available</p>
                    <p>✓ Scopes: {selectedScopes.size || scopes.length} resources selected</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#00D4A0]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-[#00D4A0]" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1D2433] mb-1">{int.name} Configured</h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                {int.dataIn.filter((_, i) => streamToggles[i]).length} data streams active · {int.actionsOut.filter(a => a.enabled).length} actions enabled · Sync every {syncFreq}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between shrink-0">
          {step > 1 && step < 5 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : <div />}
          {step < 5 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && authState !== 'connected'}>
              {step === 4 && testState !== 'pass' ? 'Skip Test' : 'Continue →'}
            </Button>
          ) : (
            <Button size="sm" onClick={onDone}>Done</Button>
          )}
        </div>
      </motion.div>
    </>
  )
}

/* ── Connect Landing (for disconnected integrations) ── */
function ConnectLanding({ integration: int, onBack, onConnected }) {
  const [step, setStep] = useState('landing') // landing | auth | permissions | testing | done
  const [authMethod, setAuthMethod] = useState(null) // 'oauth' | 'apikey'
  const [apiKey, setApiKey] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const startAuth = (method) => {
    setAuthMethod(method)
    setAuthLoading(true)
    setTimeout(() => { setAuthLoading(false); setStep('permissions') }, 2000)
  }

  const authorize = () => {
    setStep('testing')
    setTimeout(() => setStep('done'), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[#0B6ACB] font-medium mb-4 hover:underline">
        <ArrowLeft size={13} /> Back to Integrations
      </button>

      <Card className="max-w-xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <int.icon size={24} className="text-[#6B7280]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#1D2433]">Connect {int.name}</h2>
              <p className="text-[12px] text-[#6B7280]">{int.tier}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Landing */}
          {step === 'landing' && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#1D2433] leading-relaxed">{int.valueProp}</p>

              {/* What the agent gets */}
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">What the agent will access</p>
                <div className="space-y-1">
                  {int.dataIn.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] py-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${d.type === 'real-time' ? 'bg-[#00D4A0]' : 'bg-[#0B6ACB]'}`} />
                      <span className="text-[#1D2433]">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              {int.prerequisites && (
                <div className="bg-[#F5A623]/5 border border-[#F5A623]/15 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-[#B45309]"><span className="font-medium">Prerequisites:</span> {int.prerequisites}</p>
                </div>
              )}

              {/* Auth method choice */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Choose connection method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => startAuth('oauth')}
                    className="border border-gray-200 rounded-lg p-3 text-left hover:border-[#0B6ACB]/30 hover:bg-[#0B6ACB]/3 transition-all">
                    <Lock size={14} className="text-[#0B6ACB] mb-1.5" />
                    <p className="text-[12px] font-medium text-[#1D2433]">OAuth 2.0</p>
                    <p className="text-[10px] text-[#6B7280]">Recommended — secure, no keys to manage</p>
                  </button>
                  <button onClick={() => startAuth('apikey')}
                    className="border border-gray-200 rounded-lg p-3 text-left hover:border-[#0B6ACB]/30 hover:bg-[#0B6ACB]/3 transition-all">
                    <Key size={14} className="text-[#6B7280] mb-1.5" />
                    <p className="text-[12px] font-medium text-[#1D2433]">API Key</p>
                    <p className="text-[10px] text-[#6B7280]">Manual — paste your API token</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auth loading */}
          {step === 'landing' && authLoading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <RefreshCw size={16} className="text-[#0B6ACB] animate-spin" />
              <span className="text-[13px] text-[#0B6ACB]">
                {authMethod === 'oauth' ? `Connecting to ${int.name}...` : 'Validating API key...'}
              </span>
            </div>
          )}

          {/* Permission review */}
          {step === 'permissions' && (
            <div className="space-y-4">
              <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/15 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle size={14} className="text-[#00D4A0]" />
                <span className="text-[12px] text-[#059669] font-medium">
                  {authMethod === 'oauth' ? 'OAuth authenticated' : 'API key validated'}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Permission review</p>
                <p className="text-[11px] text-[#6B7280] mb-2">The SRE Agent will have the following access:</p>
                <div className="space-y-1.5">
                  {(int.permissions || []).map((perm, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] py-1 px-2 bg-[#F7F8FA] rounded">
                      <Shield size={11} className="text-[#0B6ACB] shrink-0 mt-0.5" />
                      <span className="text-[#1D2433]">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={authorize}>
                <Shield size={13} /> Authorize & Connect
              </Button>
            </div>
          )}

          {/* Testing */}
          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RefreshCw size={20} className="text-[#0B6ACB] animate-spin" />
              <p className="text-[13px] text-[#0B6ACB]">Testing connection to {int.name}...</p>
              <div className="text-[11px] text-[#6B7280] space-y-1">
                <p className="flex items-center gap-1.5"><CheckCircle size={10} className="text-[#00D4A0]" /> Authentication valid</p>
                <p className="flex items-center gap-1.5"><RefreshCw size={10} className="text-[#0B6ACB] animate-spin" /> Testing data access...</p>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#00D4A0]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-[#00D4A0]" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1D2433] mb-1">{int.name} Connected</h3>
              <p className="text-[12px] text-[#6B7280] mb-4">
                {int.dataIn.length} data streams ready · {int.actionsOut.length} actions available
              </p>
              <Button onClick={onConnected}>Go to Integration →</Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

/* ── MCP Consumers View (journey-based) ──────── */
function MCPConsumersView() {
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showKeyGen, setShowKeyGen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentPerms, setNewAgentPerms] = useState({ query: true, entities: true, alerts: false, actions: false })
  const [generatedKey, setGeneratedKey] = useState(null)
  const [keyName, setKeyName] = useState('')
  const [keyExpiry, setKeyExpiry] = useState('90d')
  const [revokeConfirm, setRevokeConfirm] = useState(null)
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const typeStyles = {
    'First-Party': 'bg-[#0B6ACB]/8 text-[#0B6ACB]',
    'External Platform': 'bg-[#9333EA]/8 text-[#7C3AED]',
    'Customer-Built': 'bg-[#00D4A0]/8 text-[#059669]',
    'Open Source': 'bg-[#F5A623]/8 text-[#B45309]',
  }

  const mcp = mcpPlatform
  const srv = mcp.server
  const [expandedPartner, setExpandedPartner] = useState(null)
  const [expandedClient, setExpandedClient] = useState(null)
  const [partners, setPartners] = useState(mcp.partners || [])
  const [clients, setClients] = useState(mcp.localClients || [])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

      {/* ── Section 1: MCP Server Status ── */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#9333EA]/8 flex items-center justify-center">
              <Globe size={20} className="text-[#7C3AED]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#1D2433]">New Relic MCP Server</span>
                <Badge variant="good" className="text-[9px]">Online</Badge>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <code className="text-[11px] font-mono text-[#9333EA] bg-[#9333EA]/5 px-1.5 py-0.5 rounded">{srv.endpoint}</code>
                <button onClick={() => { navigator.clipboard?.writeText(srv.endpoint); toast('Endpoint copied') }} className="text-[#6B7280] hover:text-[#1D2433]">
                  <Copy size={10} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[
              { label: 'Protocol', value: srv.protocol },
              { label: 'Uptime', value: `${srv.uptimePercent}%` },
              { label: 'Tools', value: `${mcp.summary.totalTools} available` },
              { label: 'Rate Limit', value: srv.rateLimitPerConsumer },
              { label: 'Auth', value: srv.authMethods.join(', ') },
            ].map(s => (
              <div key={s.label} className="text-[10px]">
                <p className="text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                <p className="font-medium text-[#1D2433] mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
          {/* Connection config */}
          <div className="bg-[#1D2433] rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#6B7280]">mcp.json configuration</span>
              <button onClick={() => { navigator.clipboard?.writeText('{"servers":{"new-relic-mcp":{"url":"https://mcp.newrelic.com/mcp/","type":"http"}}}'); toast('Config copied') }} className="text-[9px] text-[#9333EA] hover:underline">Copy</button>
            </div>
            <code className="text-[10px] text-[#00D4A0] font-mono whitespace-pre">{`{ "servers": { "new-relic-mcp": { "url": "https://mcp.newrelic.com/mcp/", "type": "http" } } }`}</code>
          </div>
        </Card>
      </motion.div>

      {/* ── Section 2: Tool Catalog ── */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#1D2433]">MCP Tool Catalog</span>
            <Badge variant="secondary" className="text-[9px]">{mcp.summary.totalTools} tools</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mcp.toolSurface.map(cat => {
              const isOpen = expandedCategory === cat.category
              return (
                <div key={cat.category} className="bg-[#F7F8FA] rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedCategory(isOpen ? null : cat.category)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100/50">
                    <span className="text-[11px] font-semibold text-[#1D2433] flex-1">{cat.category}</span>
                    <Badge variant="secondary" className="text-[8px]">{cat.tools.length}</Badge>
                    <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-2 space-y-1">
                          {cat.tools.map(tool => (
                            <div key={tool.name} className="flex items-center gap-2 py-1 text-[10px]">
                              <Zap size={9} className="text-[#9333EA] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-[#1D2433]">{tool.name}</span>
                                <span className="text-[#6B7280] ml-1">— {tool.description}</span>
                              </div>
                              <span className="text-[#6B7280] shrink-0">{(tool.invocationsWeek/1000).toFixed(1)}K/wk</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* ── Section 3: Partner Access ── */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-[#9333EA]" />
              <span className="text-[13px] font-semibold text-[#1D2433]">Partner Access</span>
              <Badge variant="secondary" className="text-[9px]">{partners.filter(p => p.status === 'authorized').length} authorized</Badge>
            </div>
            <Button size="sm" className="text-[10px]" onClick={() => {
              const name = prompt('Partner name (e.g., Datadog, Grafana):')
              if (name) {
                setPartners(p => [...p, { id: `partner-${Date.now()}`, name, clientId: `${name.toLowerCase().slice(0,3)}-${Math.random().toString(36).slice(2,8)}`, status: 'authorized', scope: 'Read-Only', redirectUrl: `https://${name.toLowerCase()}.com/oauth/callback`, authorizedUsers: 'All users', requestsHour: 0, rateLimit: 5000, errorRate: 0, authorizedAt: 'Just now', lastActive: 'Never' }])
                toast(`Partner "${name}" authorized`)
              }
            }}>
              <Plus size={10} /> Authorize Partner
            </Button>
          </div>
          <div className="space-y-1">
            {partners.map(p => (
              <div key={p.id}>
                <button onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}
                  className={`w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-left transition-colors ${expandedPartner === p.id ? 'bg-[#9333EA]/3' : 'hover:bg-gray-50/50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'authorized' ? 'bg-[#00D4A0]' : 'bg-[#F5A623]'}`} />
                  <span className="text-[11px] font-medium text-[#1D2433] w-[140px] truncate">{p.name}</span>
                  <code className="text-[9px] font-mono text-[#6B7280]">{p.clientId}</code>
                  <Badge variant={p.status === 'authorized' ? 'good' : 'warning'} className="text-[8px]">{p.status}</Badge>
                  <span className="text-[10px] text-[#6B7280]">{p.scope}</span>
                  <span className="text-[10px] text-[#6B7280] ml-auto">{p.lastActive}</span>
                  <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${expandedPartner === p.id ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedPartner === p.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="ml-5 p-3 bg-[#F7F8FA] rounded-lg space-y-2 text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-[#6B7280]">Redirect URL:</span> <span className="font-mono text-[#1D2433] text-[9px]">{p.redirectUrl}</span></div>
                          <div><span className="text-[#6B7280]">Authorized users:</span> <span className="text-[#1D2433]">{p.authorizedUsers}</span></div>
                          <div><span className="text-[#6B7280]">Rate limit:</span> <span className="text-[#1D2433]">{p.requestsHour} / {p.rateLimit} req/hr</span></div>
                          <div><span className="text-[#6B7280]">Authorized:</span> <span className="text-[#1D2433]">{p.authorizedAt || 'Pending'}</span></div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-[9px] h-5" onClick={() => toast(`Scope updated for ${p.name}`)}>Edit Scopes</Button>
                          <Button variant="ghost" size="sm" className="text-[9px] h-5 text-[#FF4D4D]" onClick={() => { setPartners(prev => prev.filter(x => x.id !== p.id)); toast(`${p.name} revoked`) }}>Revoke</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Section 4: Local Client Access ── */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ExternalLink size={13} className="text-[#0B6ACB]" />
              <span className="text-[13px] font-semibold text-[#1D2433]">Local Client Access</span>
              <Badge variant="secondary" className="text-[9px]">{clients.length} connected</Badge>
            </div>
            <Button size="sm" className="text-[10px]" onClick={() => {
              const name = prompt('Client name (e.g., Claude Code, Cursor):')
              const user = prompt('User email:')
              if (name && user) {
                setClients(p => [...p, { id: `client-${Date.now()}`, name, user, authMethod: 'OAuth 2.1', status: 'active', tokenExpiry: '2026-07-16', requestsHour: 0, rateLimit: 5000, lastActive: 'Just now', recentQueries: [] }])
                toast(`${name} connected for ${user}`)
              }
            }}>
              <Plus size={10} /> Connect Client
            </Button>
          </div>
          <div className="space-y-1">
            {clients.map(c => (
              <div key={c.id}>
                <button onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
                  className={`w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-left transition-colors ${expandedClient === c.id ? 'bg-[#0B6ACB]/3' : 'hover:bg-gray-50/50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'active' ? 'bg-[#00D4A0]' : 'bg-gray-300'}`} />
                  <span className="text-[11px] font-medium text-[#1D2433] w-[120px]">{c.name}</span>
                  <span className="text-[10px] text-[#6B7280]">{c.user}</span>
                  <Badge variant="secondary" className="text-[8px]">{c.authMethod}</Badge>
                  <span className="text-[10px] text-[#6B7280] ml-auto">{c.requestsHour} req/hr</span>
                  <span className="text-[10px] text-[#6B7280]">{c.lastActive}</span>
                  <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${expandedClient === c.id ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedClient === c.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="ml-5 p-3 bg-[#F7F8FA] rounded-lg space-y-2 text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-[#6B7280]">Token expiry:</span> <span className="text-[#1D2433]">{c.tokenExpiry}</span></div>
                          <div><span className="text-[#6B7280]">Rate limit:</span> <span className="text-[#1D2433]">{c.requestsHour} / {c.rateLimit} req/hr</span></div>
                        </div>
                        {c.recentQueries?.length > 0 && (
                          <div>
                            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-1">Recent Queries</p>
                            {c.recentQueries.map((q, i) => (
                              <p key={i} className="text-[10px] text-[#1D2433] py-0.5 pl-2 border-l-2 border-gray-200">{q}</p>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-[9px] h-5" onClick={() => toast('Token rotated')}>Rotate Token</Button>
                          <Button variant="ghost" size="sm" className="text-[9px] h-5 text-[#FF4D4D]" onClick={() => { setClients(prev => prev.filter(x => x.id !== c.id)); toast(`${c.name} session revoked`) }}>Revoke Session</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Section 5: Audit Log ── */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <span className="text-[13px] font-semibold text-[#1D2433] block mb-2">Audit Log</span>
          <div className="space-y-0.5">
            {(mcp.auditLog || []).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.status === 'Success' ? 'bg-[#00D4A0]' : 'bg-[#FF4D4D]'}`} />
                <span className="text-[#6B7280] w-[60px] shrink-0">{entry.time}</span>
                <span className="text-[#1D2433] font-medium">{entry.user}</span>
                <span className="text-[#6B7280]">{entry.action}</span>
                <Badge variant="secondary" className="text-[8px]">{entry.via}</Badge>
                <span className="text-[#6B7280]">{entry.tool}</span>
                <Badge variant={entry.status === 'Success' ? 'good' : 'destructive'} className="text-[8px] ml-auto">{entry.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Usage Trend */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#1D2433]">Request Volume</span>
            <Badge variant="secondary" className="text-[9px]">7 weeks</Badge>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={mcp.usageTrend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="mcp-g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333EA" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#9333EA" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
              <Area type="monotone" dataKey="requests" stroke="#9333EA" strokeWidth={2} fill="url(#mcp-g2)" dot={{ r: 2, fill: '#9333EA' }} animationDuration={600} />
              <RTooltip formatter={v => [`${v.toLocaleString()}`, 'Requests']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Register Agent modal */}
      <AnimatePresence>
        {showRegister && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowRegister(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-0 top-[15%] mx-auto w-[440px] bg-white rounded-xl shadow-2xl z-50 p-5">
              <h3 className="text-[15px] font-bold text-[#1D2433] mb-1">Register External Agent</h3>
              <p className="text-[11px] text-[#6B7280] mb-4">Allow an external agent to consume your observability data via MCP.</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280] mb-1">Agent Name</p>
                  <input value={newAgentName} onChange={e => setNewAgentName(e.target.value)} placeholder="e.g., Production Triage Bot"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Permissions</p>
                  {[
                    { key: 'query', label: 'NRQL Query & Log Search' },
                    { key: 'entities', label: 'Entity Lookup & Topology' },
                    { key: 'alerts', label: 'Alert Status & SLO Data' },
                    { key: 'actions', label: 'Execute Actions (acknowledge, create tickets)' },
                  ].map(p => (
                    <label key={p.key} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={newAgentPerms[p.key]} onChange={() => setNewAgentPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#0B6ACB]" />
                      <span className="text-[12px] text-[#1D2433]">{p.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button disabled={!newAgentName.trim()} onClick={() => { toast(`Agent "${newAgentName}" registered`); setShowRegister(false); setNewAgentName('') }}>
                    Register Agent
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRegister(false)}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Generate API Key modal */}
      <AnimatePresence>
        {showKeyGen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={() => { setShowKeyGen(false); setGeneratedKey(null) }} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-0 top-[15%] mx-auto w-[440px] bg-white rounded-xl shadow-2xl z-50 p-5">
              <h3 className="text-[15px] font-bold text-[#1D2433] mb-1">Generate API Key</h3>
              <p className="text-[11px] text-[#6B7280] mb-4">Create an API key for programmatic MCP access.</p>
              {!generatedKey ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium text-[#6B7280] mb-1">Key Name</p>
                    <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="e.g., production-triage-key"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Expiry</p>
                    <div className="flex gap-1.5">
                      {['30d', '90d', '1yr', 'Never'].map(e => (
                        <Button key={e} variant={keyExpiry === e ? 'default' : 'outline'} size="sm" className="text-[11px]" onClick={() => setKeyExpiry(e)}>{e}</Button>
                      ))}
                    </div>
                  </div>
                  <Button disabled={!keyName.trim()} onClick={() => setGeneratedKey('nrak-mcp-' + Math.random().toString(36).slice(2, 14))}>
                    Generate Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#1D2433] rounded-lg px-3 py-2.5">
                    <p className="text-[9px] text-[#6B7280] mb-1">Your API key (copy now — it won't be shown again):</p>
                    <code className="text-[12px] text-[#00D4A0] font-mono break-all">{generatedKey}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { navigator.clipboard?.writeText(generatedKey); toast('API key copied to clipboard') }}>
                      Copy Key
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowKeyGen(false); setGeneratedKey(null); setKeyName('') }}>Done</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1D252C] to-[#263040] rounded-xl p-5 text-white">
        <p className="text-[14px] font-semibold mb-2">They sell you an agent. We give you the platform and the choice.</p>
        <p className="text-[12px] text-white/60 leading-relaxed">
          Your observability data is accessible to any agent — our SRE Agent, Azure SRE Agent, your own custom agents, or open source tools like HolmesGPT.
        </p>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Incident Data Flow (hero section) ────────── */
const FLOW_NODES = [
  {
    id: 'alert', icon: AlertCircle, label: 'Alert Fires', time: 'T+0',
    color: '#FF4D4D',
    detail: 'Monitoring detects anomaly. NR Alert fires: "Response time p99 > 3s for 5 min."',
    agentAction: 'Agent receives webhook within 200ms. Starts investigation automatically.',
    example: 'Alert: checkout-service p99 = 2,340ms (threshold: 3,000ms)',
  },
  {
    id: 'pagerduty', icon: Bell, label: 'PagerDuty', time: 'T+0.5',
    color: '#00D4A0',
    detail: 'Incident created. On-call paged via escalation policy. Change events correlated with deployments.',
    agentAction: 'Agent pulls incident details, on-call info, and checks for recent change events that correlate with the alert.',
    example: 'Incident PD-7234 created → Sarah K. paged → Change event: deploy v2.4.1 at 14:11 UTC',
  },
  {
    id: 'slack', icon: MessageSquare, label: 'Slack Channel', time: 'T+1',
    color: '#0B6ACB',
    detail: 'Dedicated incident channel auto-created. Team joins. All investigation context lives here.',
    agentAction: 'Agent creates #p1-checkout-0892, posts initial summary, monitors thread for decisions, reactions (👀 = investigating), and pinned messages.',
    example: '#p1-checkout-0892 created → Initial alert posted → @sarah "looking into this now"',
  },
  {
    id: 'zoom', icon: Video, label: 'War Room', time: 'T+2',
    color: '#9333EA',
    detail: 'Zoom war room created. Link posted to Slack. Meeting auto-recorded. Transcript generated after meeting ends (10-30 min processing).',
    agentAction: 'Agent creates Zoom meeting, posts link to channel. After meeting ends, polls for transcript, summarizes it, posts summary back to Slack thread.',
    example: 'Zoom meeting created → 6 participants, 47 min → Transcript: "Root cause is the ORM change in v2.4.1"',
  },
  {
    id: 'investigate', icon: Search, label: 'Investigation', time: 'T+3-15',
    color: '#0B6ACB',
    detail: 'Agent queries NR (NRQL, logs, traces), pulls GitHub diffs, checks K8s status. Humans share findings in Slack thread.',
    agentAction: 'Agent generates hypotheses, tests each against data, correlates deployment timing with latency spike. Updates Slack thread with evidence.',
    example: 'Hypothesis: Deploy v2.4.1 regression → Evidence: 847 N+1 query errors → Confidence: 87%',
  },
  {
    id: 'resolve', icon: CheckCircle, label: 'Resolution', time: 'T+20',
    color: '#00D4A0',
    detail: 'Incident resolved. PagerDuty closed. ServiceNow ticket updated. Slack channel archived.',
    agentAction: 'Agent detects resolution, auto-closes PagerDuty incident, updates ServiceNow ticket with root cause and resolution notes, posts final summary to Slack.',
    example: 'Rollback to v2.4.0 → p99 recovered to 450ms → PD resolved → SNOW INC0012345 closed',
  },
  {
    id: 'postmortem', icon: FileText, label: 'Post-Mortem', time: 'T+30',
    color: '#9333EA',
    detail: 'Post-mortem auto-generated in Confluence from Slack thread + PagerDuty data + Zoom transcript. All sections pre-filled.',
    agentAction: 'Agent combines: Slack thread (investigation timeline), PagerDuty (incident metadata), Zoom transcript (war room decisions), NR data (metrics + evidence). Creates Confluence page from template.',
    example: 'Post-mortem created: "P1 checkout-service: N+1 query from deploy v2.4.1" → 6 action items generated',
  },
]

function IncidentDataFlow() {
  const [selectedNode, setSelectedNode] = useState(null)

  return (
    <motion.div variants={fadeUp}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-[#1D2433]">Incident Data Flow</span>
          <span className="text-[10px] text-[#6B7280]">How data moves between your tools during a P1</span>
        </div>

        {/* Flow nodes */}
        <div className="flex items-center gap-0 mb-3">
          {FLOW_NODES.map((node, i) => (
            <div key={node.id} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all flex-1 min-w-0 ${
                  selectedNode === node.id ? 'bg-gray-50 ring-1 ring-[#0B6ACB]/20' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: node.color + '12' }}>
                  <node.icon size={15} style={{ color: node.color }} />
                </div>
                <span className="text-[9px] font-medium text-[#1D2433] text-center truncate w-full">{node.label}</span>
                <span className="text-[8px] text-[#6B7280]">{node.time}</span>
              </button>
              {i < FLOW_NODES.length - 1 && (
                <div className="w-4 h-[2px] bg-gray-200 shrink-0 relative">
                  <motion.div
                    className="absolute top-[-1px] w-1.5 h-1.5 rounded-full bg-[#0B6ACB]"
                    animate={{ x: [0, 16, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected node detail */}
        <AnimatePresence>
          {selectedNode && (() => {
            const node = FLOW_NODES.find(n => n.id === selectedNode)
            if (!node) return null
            return (
              <motion.div key={selectedNode} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <node.icon size={14} style={{ color: node.color }} />
                    <span className="text-[12px] font-semibold text-[#1D2433]">{node.label}</span>
                    <Badge variant="secondary" className="text-[8px]">{node.time}</Badge>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">{node.detail}</p>
                  <div className="bg-white rounded border border-gray-100 px-2.5 py-2">
                    <p className="text-[9px] text-[#0B6ACB] font-medium uppercase tracking-wide mb-0.5">What the SRE Agent does</p>
                    <p className="text-[11px] text-[#1D2433] leading-relaxed">{node.agentAction}</p>
                  </div>
                  <div className="bg-[#1D2433] rounded px-2.5 py-2">
                    <p className="text-[9px] text-[#6B7280] mb-0.5">Example</p>
                    <code className="text-[10px] text-[#00D4A0] font-mono">{node.example}</code>
                  </div>
                </div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

/* ── Custom Integration Form ─────────────────── */
function CustomIntegrationForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('webhook')
  const [url, setUrl] = useState('')
  const [step, setStep] = useState(1)
  const [testing, setTesting] = useState(false)

  const testAndSave = () => {
    setTesting(true)
    setTimeout(() => { setTesting(false); setStep(2) }, 1500)
  }

  if (step === 2) {
    return (
      <div className="text-center py-4">
        <CheckCircle size={28} className="text-[#00D4A0] mx-auto mb-2" />
        <p className="text-[13px] font-medium text-[#1D2433] mb-1">Integration connected</p>
        <p className="text-[11px] text-[#6B7280] mb-3">"{name}" is now sending data to the SRE Agent.</p>
        <Button size="sm" onClick={() => onDone(name)}>Done</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium text-[#6B7280] mb-1">Integration Name</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Internal Alerting System"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Connection Type</p>
        <div className="flex gap-1.5">
          {[{ k: 'webhook', l: 'Webhook' }, { k: 'api', l: 'REST API' }, { k: 'mcp', l: 'MCP Server' }].map(t => (
            <Button key={t.k} variant={type === t.k ? 'default' : 'outline'} size="sm" className="text-[11px]" onClick={() => setType(t.k)}>{t.l}</Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#6B7280] mb-1">
          {type === 'webhook' ? 'Webhook URL' : type === 'api' ? 'API Base URL' : 'MCP Server Endpoint'}
        </p>
        <input value={url} onChange={e => setUrl(e.target.value)}
          placeholder={type === 'webhook' ? 'https://your-tool.com/webhook' : type === 'api' ? 'https://api.your-tool.com/v1' : 'https://mcp.your-tool.com'}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-[#0B6ACB]" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button disabled={!name.trim() || !url.trim() || testing} onClick={testAndSave}>
          {testing ? <><RefreshCw size={12} className="animate-spin" /> Testing...</> : 'Test & Connect'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

/* ── Request Integration Form ────────────────── */
function RequestIntegrationForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium text-[#6B7280] mb-1">Tool / Platform Name</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Opsgenie, Datadog, Splunk"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#6B7280] mb-1">Why do you need it? (optional)</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
          placeholder="e.g., We use Opsgenie for on-call scheduling and need the agent to pull rotation data..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB] resize-none" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button disabled={!name.trim()} onClick={() => onDone(name)}>Submit Request</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────── */
export default function PlatformHub() {
  const [activeSection, setActiveSection] = useState('sources')
  const [selectedId, setSelectedId] = useState(null)
  const [connectingId, setConnectingId] = useState(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const selectedInt = INTEGRATIONS.find(i => i.id === selectedId)
  const connectingInt = INTEGRATIONS.find(i => i.id === connectingId)

  const handleTileClick = (int) => {
    if (int.status === 'disconnected') {
      setConnectingId(int.id)
    } else {
      setSelectedId(int.id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#1D2433]">Platform</h1>
          <p className="text-[12px] text-[#6B7280]">Data sources, actions, and consumers</p>
        </div>
        {activeSection === 'consumers' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Key size={12} /> API Key</Button>
            <Button size="sm"><ExternalLink size={12} /> MCP Docs</Button>
          </div>
        )}
      </div>

      {/* Section toggle */}
      <div className="flex items-center gap-1 mb-4">
        {[
          { key: 'sources', label: 'Integrations', icon: Plug },
          { key: 'consumers', label: 'MCP Consumers', icon: Globe },
        ].map(s => (
          <button key={s.key} onClick={() => { setActiveSection(s.key); setSelectedId(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              activeSection === s.key ? 'bg-[#0B6ACB]/8 text-[#0B6ACB]' : 'text-[#6B7280] hover:text-[#1D2433] hover:bg-gray-50'
            }`}>
            <s.icon size={13} /> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ Level 1: Integration Grid ═══ */}
      {activeSection === 'sources' && !selectedId && !connectingId && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* ── Incident Data Flow ── */}
          <IncidentDataFlow />

          {/* ── Compact Integration Grid ── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#1D2433]">All Integrations</span>
              <Badge variant="secondary" className="text-[9px]">{INTEGRATIONS.filter(i => i.status !== 'disconnected').length}/{INTEGRATIONS.length} connected</Badge>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {INTEGRATIONS.map(int => {
                const isConnected = int.status === 'connected' || int.status === 'warning'
                return (
                  <button key={int.id}
                    onClick={() => handleTileClick(int)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all hover:shadow-sm active:scale-[0.98] ${
                      isConnected ? 'bg-white border border-gray-200/60' : 'bg-gray-50/50 border border-dashed border-gray-200'
                    }`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      int.status === 'connected' ? 'bg-[#00D4A0]/8' : int.status === 'warning' ? 'bg-[#F5A623]/8' : 'bg-gray-100'
                    }`}>
                      <int.icon size={13} className={int.status === 'connected' ? 'text-[#059669]' : int.status === 'warning' ? 'text-[#B45309]' : 'text-[#9CA3AF]'} />
                    </div>
                    <span className="text-[11px] font-medium text-[#1D2433] flex-1 truncate">{int.name}</span>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[int.status]}`} />
                  </button>
                )
              })}

              {/* Custom + Request tiles */}
              <button onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left border border-dashed border-[#0B6ACB]/30 bg-[#0B6ACB]/3 hover:bg-[#0B6ACB]/5 transition-all active:scale-[0.98]">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-[#0B6ACB]/8">
                  <Plus size={13} className="text-[#0B6ACB]" />
                </div>
                <span className="text-[11px] font-medium text-[#0B6ACB]">Custom Integration</span>
              </button>
              <button onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left border border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-gray-100">
                  <MessageSquare size={13} className="text-[#6B7280]" />
                </div>
                <span className="text-[11px] font-medium text-[#6B7280]">Request Integration</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ Level 2: Integration Detail (connected) ═══ */}
      {activeSection === 'sources' && selectedId && selectedInt && (
        <IntegrationDetail integration={selectedInt} onBack={() => setSelectedId(null)} />
      )}

      {/* ═══ Connect Landing (disconnected) ═══ */}
      {activeSection === 'sources' && connectingId && connectingInt && (
        <ConnectLanding integration={connectingInt} onBack={() => setConnectingId(null)} onConnected={() => setConnectingId(null)} />
      )}

      {/* ═══ MCP Consumers ═══ */}
      {activeSection === 'consumers' && (
        <MCPConsumersView />
      )}

      {/* ═══ Custom Integration Modal ═══ */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowCustomModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-0 top-[12%] mx-auto w-[480px] bg-white rounded-xl shadow-2xl z-50 p-5">
              <h3 className="text-[15px] font-bold text-[#1D2433] mb-1">Add Custom Integration</h3>
              <p className="text-[11px] text-[#6B7280] mb-4">Connect any tool via webhook, API, or MCP protocol.</p>
              <CustomIntegrationForm onDone={(name) => { toast(`Custom integration "${name}" added`); setShowCustomModal(false) }} onCancel={() => setShowCustomModal(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Request Integration Modal ═══ */}
      <AnimatePresence>
        {showRequestModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowRequestModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-0 top-[15%] mx-auto w-[440px] bg-white rounded-xl shadow-2xl z-50 p-5">
              <h3 className="text-[15px] font-bold text-[#1D2433] mb-1">Request Integration</h3>
              <p className="text-[11px] text-[#6B7280] mb-4">Tell us which tool you'd like connected. We'll prioritize based on demand.</p>
              <RequestIntegrationForm onDone={(name) => { toast(`Request for "${name}" submitted — we'll notify you when available`); setShowRequestModal(false) }} onCancel={() => setShowRequestModal(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
