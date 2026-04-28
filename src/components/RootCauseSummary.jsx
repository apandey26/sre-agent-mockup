import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertTriangle, ArrowRight, ChevronDown, Users, DollarSign,
  Clock, Shield, Server, MessageSquare, Ticket, BookOpen, RotateCcw,
  Radio, Brain, FileText, X, Check, Pencil, ThumbsDown, Zap, GitBranch,
  Terminal, Copy,
} from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

/* ── BADIR insight data per scenario ──────────── */
const INSIGHTS = {
  'inv-0892': {
    univariate: [
      { metric: 'Latency p99', before: '450ms', after: '2.3s', change: '5.1x' },
      { metric: 'Error rate', before: '0.02%', after: '1.8%', change: '90x' },
      { metric: 'CPU', before: '42%', after: '94%', change: '2.2x' },
      { metric: 'DB queries/min', before: '120', after: '5,640', change: '47x' },
    ],
    bivariate: [
      { pair: 'Latency ↔ Deploy time', r: 0.94, strength: 'strong', note: 'Spike 12 min after v2.4.1' },
      { pair: 'Errors ↔ DB queries', r: 0.91, strength: 'strong', note: 'Linear relationship' },
    ],
    multivariate: 'Deploy v2.4.1 + N+1 query pattern + 47x query increase explains 92% of latency variance.',
    recommendations: [
      { action: 'Rollback to v2.4.0', impact: 'Restores $18K/hr', effort: '~6 min', priority: 'HIGH' },
      { action: 'Add eager loading lint rule', impact: 'Prevents recurrence', effort: '2 hrs', priority: 'MEDIUM' },
      { action: 'Create DB query count alert', impact: 'Early detection', effort: '15 min', priority: 'MEDIUM' },
    ],
  },
  'inv-0893': {
    univariate: [
      { metric: 'Error rate (5xx)', before: '0.1%', after: '12%', change: '120x' },
      { metric: 'Latency p99', before: '220ms', after: 'timeout', change: '∞' },
      { metric: 'Memory', before: '58%', after: '67%', change: '1.15x' },
    ],
    bivariate: [
      { pair: 'Errors ↔ Cert expiry time', r: 0.99, strength: 'strong', note: 'Exact match at 03:14' },
      { pair: 'Error type ↔ TLS handshake', r: 0.97, strength: 'strong', note: 'All 502s are TLS failures' },
    ],
    multivariate: 'TLS cert expiry + 90-day cycle + memory match from INV-0623 confirms pattern with 99% confidence.',
    recommendations: [
      { action: 'Rotate TLS certificate', impact: 'Restores $31.5K/hr', effort: '~30 min', priority: 'HIGH' },
      { action: 'Configure cert-manager', impact: 'Eliminates 90-day cycle', effort: '4 hrs', priority: 'HIGH' },
      { action: 'Add cert expiry monitor', impact: 'Early warning', effort: '15 min', priority: 'MEDIUM' },
    ],
  },
  'inv-new': {
    univariate: [
      { metric: 'Redis connections', before: '45', after: '200 (max)', change: 'Pool full' },
      { metric: 'Latency p99', before: '180ms', after: '4.2s', change: '23x' },
      { metric: 'Pod restarts', before: '0', after: '6', change: 'Health fails' },
    ],
    bivariate: [
      { pair: 'Connections ↔ Latency', r: 0.96, strength: 'strong', note: 'Latency scales with saturation' },
      { pair: 'Restarts ↔ Health timeout', r: 0.93, strength: 'strong', note: 'Redis blocks /health' },
    ],
    multivariate: 'Connection leak in v3.1.2: timeout path never releases connections, pool exhaustion under normal load.',
    recommendations: [
      { action: 'Flush Redis pool', impact: 'Recovery in ~3 min', effort: 'One command', priority: 'HIGH' },
      { action: 'Fix leak in v3.1.2', impact: 'Permanent fix', effort: '4 hrs', priority: 'HIGH' },
      { action: 'Add pool monitoring', impact: 'Early detection', effort: '15 min', priority: 'MEDIUM' },
    ],
  },
}

/* ── score ring (compact) ─────────────────────── */
function MiniRing({ value, label, size = 24 }) {
  const radius = (size - 3) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  const color = value >= 80 ? '#00D4A0' : value >= 60 ? '#F5A623' : '#FF4D4D'
  return (
    <div className="flex items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#E5E7EB" strokeWidth={2.5} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={2.5} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-[10px] text-[#6B7280]">{label}</p>
        <p className="text-[12px] font-bold" style={{ color }}>{value}%</p>
      </div>
    </div>
  )
}

/* ── strength dot ─────────────────────────────── */
function StrengthDot({ strength }) {
  const c = strength === 'strong' ? '#00D4A0' : strength === 'moderate' ? '#F5A623' : '#6B7280'
  return <span className="text-[9px] font-semibold" style={{ color: c }}>● {strength}</span>
}

/* ── suggestion card actions ──────────────────── */
const ACTION_DETAILS = {
  'Rollback to v2.4.0': { icon: RotateCcw, cmd: 'kubectl rollout undo deployment/checkout-service --to-revision=12', type: 'execute' },
  'Add eager loading lint rule': { icon: GitBranch, cmd: null, type: 'pr', pr: 'Add N+1 query detection lint rule' },
  'Create DB query count alert': { icon: Zap, cmd: null, type: 'configure', detail: 'NRQL alert: SELECT count(*) FROM Transaction WHERE appName=\'checkout-service\' FACET request.uri' },
  'Rotate TLS certificate': { icon: Terminal, cmd: 'kubectl exec -n auth cert-rotation -- /rotate.sh --force', type: 'execute' },
  'Configure cert-manager': { icon: GitBranch, cmd: null, type: 'pr', pr: 'Add cert-manager with 60-day auto-renewal' },
  'Add cert expiry monitor': { icon: Zap, cmd: null, type: 'configure', detail: 'Synthetics: check cert expiry for auth-service every 6h' },
  'Flush Redis pool': { icon: Terminal, cmd: 'redis-cli -h redis-payment.internal FLUSHDB && kubectl rollout restart deployment/payment-gateway', type: 'execute' },
  'Fix leak in v3.1.2': { icon: GitBranch, cmd: null, type: 'pr', pr: 'Fix Redis connection leak in timeout handler' },
  'Add pool monitoring': { icon: Zap, cmd: null, type: 'configure', detail: 'NRQL alert: SELECT max(redis.pool.active) FROM Metric WHERE service=\'payment-gateway\'' },
}

function SuggestionCards({ recommendations, scenarioId }) {
  const [cardStates, setCardStates] = useState({}) // 'accepted' | 'dismissed' | 'editing' | null
  const [toasts, setToasts] = useState([])

  const toast = (msg) => {
    const tid = Date.now()
    setToasts(p => [...p, { id: tid, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000)
  }

  const accept = (action) => {
    setCardStates(p => ({ ...p, [action]: 'accepted' }))
    toast(`Executing: ${action}`)
  }
  const dismiss = (action) => setCardStates(p => ({ ...p, [action]: 'dismissed' }))
  const edit = (action) => setCardStates(p => ({ ...p, [action]: p[action] === 'editing' ? null : 'editing' }))

  return (
    <div className="space-y-2">
      {recommendations.map((r, i) => {
        const state = cardStates[r.action]
        const detail = ACTION_DETAILS[r.action] || {}
        const ActionIcon = detail.icon || Zap

        if (state === 'dismissed') {
          return (
            <motion.div key={i} initial={{ opacity: 1 }} animate={{ opacity: 0.4 }}
              className="flex items-center gap-2 text-[11px] bg-gray-50 rounded-lg px-3 py-1.5 line-through text-[#6B7280]">
              <span>{r.action}</span>
              <button onClick={() => setCardStates(p => ({ ...p, [r.action]: null }))} className="ml-auto text-[10px] text-[#0B6ACB] hover:underline">Undo</button>
            </motion.div>
          )
        }

        if (state === 'accepted') {
          return (
            <motion.div key={i} initial={{ scale: 0.98 }} animate={{ scale: 1 }}
              className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={12} className="text-[#00D4A0]" />
                <span className="text-[11px] font-medium text-[#00D4A0]">{r.action}</span>
                <Badge variant="good" className="text-[8px] ml-auto">Accepted</Badge>
              </div>
              {detail.cmd && (
                <div className="mt-1.5 bg-[#1D2433] rounded px-2 py-1.5 flex items-center gap-2">
                  <code className="text-[9px] text-[#00D4A0] font-mono flex-1 truncate">{detail.cmd}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(detail.cmd); toast('Copied to clipboard') }}
                    className="text-[#6B7280] hover:text-white"><Copy size={10} /></button>
                </div>
              )}
              {detail.type === 'pr' && (
                <p className="text-[10px] text-[#6B7280] mt-1">PR draft: "{detail.pr}" — ready for review</p>
              )}
            </motion.div>
          )
        }

        return (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#F7F8FA] border border-gray-100 rounded-lg overflow-hidden">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <ActionIcon size={11} className="text-[#0B6ACB] shrink-0" />
                <span className="text-[11px] font-medium text-[#1D2433] flex-1">{r.action}</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${r.priority === 'HIGH' ? 'bg-[#FF4D4D]/10 text-[#FF4D4D]' : 'bg-[#F5A623]/10 text-[#F5A623]'}`}>{r.priority}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mb-2">
                <span className="text-[#00D4A0] font-medium">{r.impact}</span>
                <span>·</span>
                <span>{r.effort}</span>
                {detail.type === 'execute' && <Badge variant="secondary" className="text-[8px]">Auto-executable</Badge>}
                {detail.type === 'pr' && <Badge variant="secondary" className="text-[8px]">Creates PR</Badge>}
                {detail.type === 'configure' && <Badge variant="secondary" className="text-[8px]">Configures alert</Badge>}
              </div>

              {/* Preview on edit */}
              <AnimatePresence>
                {cardStates[r.action] === 'editing' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-2">
                    {detail.cmd && (
                      <div className="bg-[#1D2433] rounded px-2 py-1.5 mb-1">
                        <p className="text-[9px] text-[#6B7280] mb-0.5">Command preview:</p>
                        <code className="text-[9px] text-[#00D4A0] font-mono">{detail.cmd}</code>
                      </div>
                    )}
                    {detail.detail && (
                      <div className="bg-white border rounded px-2 py-1.5">
                        <p className="text-[9px] text-[#6B7280] mb-0.5">Configuration:</p>
                        <code className="text-[9px] text-[#0B6ACB] font-mono">{detail.detail}</code>
                      </div>
                    )}
                    {detail.type === 'pr' && (
                      <div className="bg-white border rounded px-2 py-1.5">
                        <p className="text-[9px] text-[#6B7280] mb-0.5">PR title:</p>
                        <p className="text-[10px] text-[#1D2433] font-medium">{detail.pr}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons — Accept / Edit / Dismiss */}
              <div className="flex items-center gap-1.5">
                <Button size="sm" className="h-6 text-[10px] bg-[#0B6ACB] hover:bg-[#0A5EB8] text-white" onClick={() => accept(r.action)}>
                  <Check size={10} /> Accept
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => edit(r.action)}>
                  <Pencil size={10} /> {cardStates[r.action] === 'editing' ? 'Hide' : 'Preview'}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-[#6B7280]" onClick={() => dismiss(r.action)}>
                  <ThumbsDown size={10} /> Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={13} className="text-[#00D4A0]" />
              <span className="text-[11px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ── validation chain per scenario ────────────── */
const VALIDATIONS = {
  'inv-0892': [
    { claim: 'Deploy v2.4.1 caused latency regression', source: 'Deployment diff + Metric correlation', test: 'Rollback to v2.4.0 should restore p99 < 500ms', status: 'validated', result: 'Rollback confirmed recovery at 14:47 UTC' },
    { claim: 'N+1 query pattern is the mechanism', source: 'Log analysis (847 errors)', test: 'DB query count should drop after rollback', status: 'validated', result: 'Queries dropped from 5,640/min to 120/min' },
    { claim: '12,400 users affected', source: 'RUM + Transaction count', test: 'Unique user count during incident window', status: 'validated', result: 'RUM confirms 12,380 unique sessions with errors' },
  ],
  'inv-0893': [
    { claim: 'TLS cert expiry caused 502 errors', source: 'Cert/TLS analysis', test: 'New cert should eliminate 502s immediately', status: 'validated', result: '502 errors dropped to 0 within 2 min of rotation' },
    { claim: '90-day renewal cycle is the pattern', source: 'Memory match (INV-0623)', test: 'Previous incident was exactly 90 days ago', status: 'validated', result: 'INV-0623 occurred Jan 5 — exactly 90 days' },
    { claim: 'cert-manager not configured', source: 'K8s diagnostics', test: 'Check for cert-manager CRD in cluster', status: 'validated', result: 'No cert-manager resources found in auth namespace' },
  ],
  'inv-new': [
    { claim: 'Redis connection leak in v3.1.2', source: 'Deployment diff + Log analysis', test: 'Pool flush should restore connections temporarily', status: 'validated', result: 'Pool flush recovered service for ~15 min before re-saturating' },
    { claim: 'Timeout handler missing connection release', source: 'Code diff analysis', test: 'Error path should show unreleased connection in trace', status: 'validated', result: 'Trace confirms connection acquired but not released on timeout' },
    { claim: 'Health check failures caused pod restarts', source: 'K8s diagnostics', test: 'Health endpoint depends on Redis — should timeout when pool full', status: 'validated', result: '/health returns 503 when Redis pool > 95% capacity' },
  ],
}

function ValidationChain({ scenarioId }) {
  const validations = VALIDATIONS[scenarioId]
  if (!validations) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[12px] font-semibold text-[#1D2433]">Validation Chain</p>
        <Badge variant="good" className="text-[8px]">{validations.filter(v => v.status === 'validated').length}/{validations.length} validated</Badge>
      </div>
      <div className="space-y-1.5">
        {validations.map((v, i) => (
          <div key={i} className="bg-[#F7F8FA] rounded-lg px-3 py-2">
            <div className="flex items-start gap-2">
              <CheckCircle size={11} className="text-[#00D4A0] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#1D2433]">{v.claim}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#6B7280]">
                  <span>Source: {v.source}</span>
                </div>
                <div className="mt-1 bg-white border border-gray-100 rounded px-2 py-1">
                  <p className="text-[9px] text-[#6B7280]"><span className="font-medium">Test:</span> {v.test}</p>
                  <p className="text-[9px] text-[#059669]"><span className="font-medium">Result:</span> {v.result}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── main ─────────────────────────────────────── */
export default function RootCauseSummary({ scenario, simulationPhase = 4 }) {
  if (simulationPhase < 3) return null
  const rc = scenario.rootCause
  if (!rc) return null

  const [expanded, setExpanded] = useState(true)
  const insights = INSIGHTS[scenario.id]
  const validatedH = scenario.hypotheses.find(h => h.id === rc.validatedHypothesis)

  // Listen for chat-triggered expand
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'expand-rootcause') setExpanded(true)
    }
    window.addEventListener('canvas-action', handler)
    return () => window.removeEventListener('canvas-action', handler)
  }, [])

  return (
    <div id="section-rootcause" className="space-y-0">
      {/* ── Collapsed: summary card ── */}
      <Card className="overflow-hidden" style={{ borderLeft: '4px solid #00D4A0' }}>
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#00D4A0]" />
              <span className="text-[14px] font-bold text-[#1D2433]">Root Cause Identified</span>
              <Badge variant="good">{rc.confidence}%</Badge>
              <Badge variant="purple" className="text-[8px]">Available via MCP</Badge>
            </div>
            <ChevronDown size={14} className={`text-[#6B7280] transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
          <p className="text-[13px] text-[#1D2433] leading-relaxed">{rc.summary}</p>
          <p className="text-[11px] text-[#0B6ACB] mt-1 font-medium">
            {expanded ? 'Collapse analysis ↑' : 'Show full analysis ↓'}
          </p>
        </button>

        {/* ── Expanded: deep analysis ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4">
                <Separator />

                {/* Quality scores */}
                <div className="flex items-center gap-5">
                  <MiniRing value={rc.qualityScore} label="Quality" />
                  <MiniRing value={rc.faithfulness} label="Faithfulness" />
                  <MiniRing value={rc.confidence} label="Confidence" />
                  {validatedH && (
                    <div className="ml-auto">
                      <p className="text-[10px] text-[#6B7280]">Based on</p>
                      <Badge variant="good" className="text-[10px]">{validatedH.title}</Badge>
                    </div>
                  )}
                </div>

                {insights && (
                  <>
                    <Separator />

                    {/* Evidence Summary — BADIR Insight Tiers */}
                    <div>
                      <p className="text-[12px] font-semibold text-[#1D2433] mb-2">How we got here</p>

                      {/* Univariate */}
                      <div className="mb-3">
                        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Univariate — individual metrics</p>
                        <div className="grid grid-cols-2 gap-1">
                          {insights.univariate.map(m => (
                            <div key={m.metric} className="flex items-center gap-1.5 text-[11px] bg-[#F7F8FA] rounded px-2 py-1">
                              <span className="text-[#1D2433] font-medium w-24 shrink-0 truncate">{m.metric}</span>
                              <span className="text-[#00D4A0]">{m.before}</span>
                              <span className="text-[#6B7280]">→</span>
                              <span className="text-[#FF4D4D]">{m.after}</span>
                              <span className="text-[#FF4D4D] font-semibold ml-auto text-[10px]">{m.change}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bivariate */}
                      <div className="mb-3">
                        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Bivariate — correlations</p>
                        <div className="space-y-1">
                          {insights.bivariate.map(b => (
                            <div key={b.pair} className="flex items-center gap-2 text-[11px] bg-[#F7F8FA] rounded px-2 py-1">
                              <span className="text-[#1D2433] font-medium">{b.pair}</span>
                              <span className="text-[10px] text-[#6B7280]">r={b.r}</span>
                              <StrengthDot strength={b.strength} />
                              <span className="text-[10px] text-[#6B7280] ml-auto">{b.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Multivariate */}
                      <div>
                        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Multivariate — pattern</p>
                        <p className="text-[11px] text-[#1D2433] bg-[#00D4A0]/5 rounded px-2 py-1.5 leading-relaxed">{insights.multivariate}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Impact Assessment — clean horizontal */}
                    <div>
                      <p className="text-[12px] font-semibold text-[#1D2433] mb-2">Impact</p>
                      <div className="flex items-center gap-4">
                        {[
                          { icon: Users, label: 'Users', value: rc.impact.usersAffected.toLocaleString(), color: '#FF4D4D' },
                          { icon: DollarSign, label: 'Revenue', value: `$${rc.impact.revenueAtRisk.toLocaleString()}`, color: '#FF4D4D' },
                          { icon: Shield, label: 'SLO Budget', value: `${rc.impact.sloConsumed}%`, color: rc.impact.sloConsumed > 50 ? '#FF4D4D' : '#F5A623' },
                          { icon: Clock, label: 'Duration', value: `${rc.impact.durationMinutes} min`, color: '#6B7280' },
                        ].map(m => (
                          <div key={m.label} className="flex items-center gap-1.5">
                            <m.icon size={12} className="text-[#6B7280]" />
                            <div>
                              <p className="text-[9px] text-[#6B7280]">{m.label}</p>
                              <p className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Server size={10} className="text-[#6B7280]" />
                        <span className="text-[10px] text-[#6B7280]">Affected:</span>
                        {rc.impact.affectedEntities.map(e => <Badge key={e} variant="secondary" className="text-[9px]">{e}</Badge>)}
                      </div>
                    </div>

                    <Separator />

                    {/* Validation Chain */}
                    <ValidationChain scenarioId={scenario.id} />

                    <Separator />

                    {/* Recommendations — Suggestion Cards */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[12px] font-semibold text-[#1D2433]">Suggested Actions</p>
                        <Badge variant="secondary" className="text-[9px]">AI-generated</Badge>
                      </div>
                      <SuggestionCards recommendations={insights.recommendations} scenarioId={scenario.id} />
                    </div>

                    <Separator />

                    {/* Triage Actions — integrated here */}
                    <TriageActions scenario={scenario} />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

/* ── runbook data per scenario ────────────────── */
const RUNBOOKS = {
  'inv-0892': { name: 'RB-018: Checkout Service Rollback', steps: ['Identify target revision in ArgoCD', 'Run: kubectl rollout undo deployment/checkout-service --to-revision=12', 'Verify pods healthy: kubectl get pods -n checkout', 'Confirm p99 latency < 500ms in NR', 'Close PagerDuty incident'] },
  'inv-0893': { name: 'RB-042: TLS Certificate Rotation', steps: ['SSH to auth-service bastion', 'Run: kubectl exec -n auth cert-rotation -- /rotate.sh --force', 'Verify new cert: openssl s_client -connect auth-service:443', 'Confirm 502 errors dropping in NR', 'Update cert-manager config for auto-renewal'] },
  'inv-new': { name: 'RB-055: Redis Pool Flush', steps: ['Connect to Redis: redis-cli -h redis-payment.internal', 'Flush connections: CLIENT KILL TYPE normal', 'Restart pods: kubectl rollout restart deployment/payment-gateway', 'Monitor connection count in NR', 'Verify latency recovery < 200ms'] },
}

/* ── triage actions with full flows ──────────── */
function TriageActions({ scenario }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [toasts, setToasts] = useState([])
  const [activePanel, setActivePanel] = useState(null) // 'notify' | 'ticket' | 'runbook' | 'rollback' | null
  const [notifyChannels, setNotifyChannels] = useState({ slack: true, pagerduty: true, email: false })
  const [notifySent, setNotifySent] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketPriority, setTicketPriority] = useState('P2')
  const [ticketCreated, setTicketCreated] = useState(false)
  const [runbookStep, setRunbookStep] = useState(-1) // -1 = not started
  const [rollbackConfirm, setRollbackConfirm] = useState(false)
  const [rollbackRunning, setRollbackRunning] = useState(false)
  const [rollbackDone, setRollbackDone] = useState(false)

  const toast = (msg, navTo) => {
    const tid = Date.now()
    setToasts(p => [...p, { id: tid, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000)
    if (navTo) setTimeout(() => navigate(navTo), 600)
  }

  const rc = scenario.rootCause
  const runbook = RUNBOOKS[id] || RUNBOOKS['inv-0892']

  const sendNotification = () => {
    setNotifySent(true)
    const channels = Object.entries(notifyChannels).filter(([,v]) => v).map(([k]) => k).join(', ')
    toast(`Notified via ${channels}`)
    setTimeout(() => { setActivePanel(null); setNotifySent(false) }, 1500)
  }

  const createTicket = () => {
    setTicketCreated(true)
    toast('Jira ticket INCIDENT-4821 created')
    setTimeout(() => { setActivePanel(null); setTicketCreated(false); setTicketTitle('') }, 1500)
  }

  const advanceRunbook = () => {
    if (runbookStep < runbook.steps.length - 1) {
      setRunbookStep(s => s + 1)
    } else {
      toast('Runbook completed')
      setTimeout(() => { setActivePanel(null); setRunbookStep(-1) }, 1000)
    }
  }

  const executeRollback = () => {
    setRollbackRunning(true)
    setTimeout(() => {
      setRollbackRunning(false)
      setRollbackDone(true)
      toast('Rollback to previous version complete')
      setTimeout(() => { setActivePanel(null); setRollbackConfirm(false); setRollbackDone(false) }, 2000)
    }, 2500)
  }

  return (
    <div id="section-triage">
      <p className="text-[12px] font-semibold text-[#1D2433] mb-2">Take Action</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Button variant={activePanel === 'notify' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setActivePanel(activePanel === 'notify' ? null : 'notify')}>
          <MessageSquare size={11} /> Notify Team
        </Button>
        <Button variant={activePanel === 'ticket' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => { setTicketTitle(`[${scenario.severity}] ${scenario.entity}: ${rc?.summary?.slice(0, 60) || 'Investigation'}`); setActivePanel(activePanel === 'ticket' ? null : 'ticket') }}>
          <Ticket size={11} /> Create Ticket
        </Button>
        <Button variant={activePanel === 'runbook' ? 'default' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => { setRunbookStep(0); setActivePanel(activePanel === 'runbook' ? null : 'runbook') }}>
          <BookOpen size={11} /> Execute Runbook
        </Button>
        <Button variant={activePanel === 'rollback' ? 'destructive' : 'outline'} size="sm" className="text-[10px] h-7" onClick={() => setActivePanel(activePanel === 'rollback' ? null : 'rollback')}>
          <RotateCcw size={11} /> Rollback
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => toast('War Room created', `/investigation/${id}/war-room`)}>
          <Radio size={11} /> War Room
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => toast('Saved to memory')}>
          <Brain size={11} /> Save to Memory
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => toast('Generating...', `/investigation/${id}/postmortem`)}>
          <FileText size={11} /> Post-Mortem
        </Button>
      </div>

      {/* ── Inline action panels ── */}
      <AnimatePresence>
        {activePanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">

            {/* Notify Team */}
            {activePanel === 'notify' && (
              <div className="bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#1D2433]">Notify Team</p>
                <p className="text-[10px] text-[#6B7280]">Send incident notification to selected channels</p>
                <div className="bg-white rounded border px-2.5 py-2 text-[11px] text-[#1D2433]">
                  <span className="font-medium">[{scenario.severity}]</span> {scenario.entity}: {rc?.summary?.slice(0, 80) || 'Under investigation'}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {Object.entries(notifyChannels).map(([ch, on]) => (
                    <label key={ch} className="flex items-center gap-1 cursor-pointer capitalize">
                      <input type="checkbox" checked={on} onChange={() => setNotifyChannels(p => ({ ...p, [ch]: !p[ch] }))} className="w-3 h-3 rounded" />
                      {ch}
                    </label>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {notifySent ? (
                    <Badge variant="good" className="text-[10px]"><CheckCircle size={10} /> Sent</Badge>
                  ) : (
                    <Button size="sm" className="text-[10px] h-6" onClick={sendNotification}>Send Notification</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setActivePanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Create Ticket */}
            {activePanel === 'ticket' && (
              <div className="bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#1D2433]">Create Jira Ticket</p>
                <div>
                  <p className="text-[9px] text-[#6B7280] mb-0.5">Title</p>
                  <input value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#0B6ACB]" />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-[#6B7280]">Priority:</p>
                  {['P1', 'P2', 'P3'].map(p => (
                    <Badge key={p} variant={ticketPriority === p ? 'default' : 'outline'} className="cursor-pointer text-[9px]" onClick={() => setTicketPriority(p)}>{p}</Badge>
                  ))}
                  <p className="text-[9px] text-[#6B7280] ml-2">Assignee:</p>
                  <Badge variant="secondary" className="text-[9px]">{id === 'inv-0892' ? 'Sarah K.' : id === 'inv-new' ? 'Alex R.' : 'Mike T.'}</Badge>
                </div>
                <div className="flex gap-1.5">
                  {ticketCreated ? (
                    <Badge variant="good" className="text-[10px]"><CheckCircle size={10} /> INCIDENT-4821 created</Badge>
                  ) : (
                    <Button size="sm" className="text-[10px] h-6" onClick={createTicket} disabled={!ticketTitle.trim()}>Create Ticket</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setActivePanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Execute Runbook */}
            {activePanel === 'runbook' && (
              <div className="bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={12} className="text-[#0B6ACB]" />
                  <p className="text-[11px] font-semibold text-[#1D2433]">{runbook.name}</p>
                  <Badge variant="secondary" className="text-[9px]">{runbookStep + 1}/{runbook.steps.length}</Badge>
                </div>
                <div className="space-y-1">
                  {runbook.steps.map((step, i) => {
                    const isDone = i < runbookStep
                    const isCurrent = i === runbookStep
                    return (
                      <div key={i} className={`flex items-start gap-2 text-[11px] py-1 px-2 rounded ${isCurrent ? 'bg-[#0B6ACB]/5 border border-[#0B6ACB]/20' : ''}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isDone ? 'bg-[#00D4A0] border-[#00D4A0]' : isCurrent ? 'border-[#0B6ACB]' : 'border-gray-300'}`}>
                          {isDone && <CheckCircle size={8} className="text-white" />}
                        </div>
                        <span className={isDone ? 'text-[#6B7280] line-through' : isCurrent ? 'text-[#1D2433] font-medium' : 'text-[#6B7280]'}>{step}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-1.5">
                  {runbookStep < runbook.steps.length ? (
                    <Button size="sm" className="text-[10px] h-6" onClick={advanceRunbook}>
                      {runbookStep === runbook.steps.length - 1 ? 'Complete Runbook' : 'Mark Done & Next'}
                    </Button>
                  ) : (
                    <Badge variant="good" className="text-[10px]"><CheckCircle size={10} /> Runbook complete</Badge>
                  )}
                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => { setActivePanel(null); setRunbookStep(-1) }}>Close</Button>
                </div>
              </div>
            )}

            {/* Rollback */}
            {activePanel === 'rollback' && (
              <div className="bg-[#FF4D4D]/5 border border-[#FF4D4D]/20 rounded-lg p-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#FF4D4D]">Rollback Deployment</p>
                {!rollbackConfirm && !rollbackRunning && !rollbackDone && (
                  <>
                    <div className="bg-white rounded border px-2.5 py-2 text-[11px] space-y-1">
                      <div className="flex justify-between"><span className="text-[#6B7280]">Current:</span><span className="text-[#1D2433] font-mono">{id === 'inv-0892' ? 'v2.4.1' : id === 'inv-new' ? 'v3.1.2' : 'current'}</span></div>
                      <div className="flex justify-between"><span className="text-[#6B7280]">Target:</span><span className="text-[#00D4A0] font-mono">{id === 'inv-0892' ? 'v2.4.0' : id === 'inv-new' ? 'v3.1.1' : 'previous'}</span></div>
                      <div className="flex justify-between"><span className="text-[#6B7280]">Method:</span><span className="text-[#1D2433]">kubectl rollout undo</span></div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => setRollbackConfirm(true)}>Confirm Rollback</Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setActivePanel(null)}>Cancel</Button>
                    </div>
                  </>
                )}
                {rollbackConfirm && !rollbackRunning && !rollbackDone && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#FF4D4D] font-medium">Are you sure? This will roll back to the previous deployment version.</p>
                    <div className="flex gap-1.5">
                      <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={executeRollback}>Yes, Rollback Now</Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => { setRollbackConfirm(false); setActivePanel(null) }}>Cancel</Button>
                    </div>
                  </div>
                )}
                {rollbackRunning && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-4 h-4 border-2 border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-[#FF4D4D] font-medium">Rolling back deployment...</span>
                  </div>
                )}
                {rollbackDone && (
                  <div className="flex items-center gap-2 py-2">
                    <CheckCircle size={14} className="text-[#00D4A0]" />
                    <span className="text-[11px] text-[#00D4A0] font-medium">Rollback complete. Pods restarting...</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={13} className="text-[#00D4A0]" />
              <span className="text-[11px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
