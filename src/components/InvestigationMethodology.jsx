import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle, Loader2, Circle, AlertTriangle, BarChart3, Database, Lightbulb, Target } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

/* ── step config ──────────────────────────────── */
const STEPS = [
  { key: 'B', label: 'Business Question', icon: Target, color: '#FF4D4D' },
  { key: 'A', label: 'Analysis Plan', icon: BarChart3, color: '#F5A623' },
  { key: 'D', label: 'Data Collection', icon: Database, color: '#0B6ACB' },
  { key: 'I', label: 'Insights', icon: Lightbulb, color: '#9333EA' },
  { key: 'R', label: 'Recommendations', icon: Target, color: '#00D4A0' },
]

function stepStatus(key, phase) {
  const map = { B: 0, A: 1, D: 1, I: 2, R: 3 }
  const needed = map[key]
  if (phase > needed + 1) return 'done'
  if (phase > needed || (key === 'B' && phase >= 0)) return key === 'B' ? 'done' : (phase > needed ? 'done' : 'active')
  return 'pending'
}

function getStepState(key, phase) {
  if (key === 'B') return phase >= 0 ? 'done' : 'pending'
  if (key === 'A') return phase >= 2 ? 'done' : phase >= 1 ? 'active' : 'pending'
  if (key === 'D') return phase >= 1 ? 'done' : phase >= 0 ? 'active' : 'pending'
  if (key === 'I') return phase >= 3 ? 'done' : phase >= 2 ? 'active' : 'pending'
  if (key === 'R') return phase >= 4 ? 'done' : phase >= 3 ? 'active' : 'pending'
  return 'pending'
}

/* ── scenario-specific BADIR content ──────────── */
const BADIR_DATA = {
  'inv-0892': {
    B: {
      question: 'Why is checkout-service latency p99 exceeding 2s?',
      impact: 'Affecting ~12,400 users | $18.2K revenue at risk | SLO burning at 8.2x',
      stakeholder: 'Paged: Sarah K. | Channel: #inc-checkout',
      keyQuestion: 'Is this a deployment issue, infrastructure issue, or dependency failure?',
    },
    A: {
      hypotheses: [
        { id: 'H1', title: 'Deployment v2.4.1 regression', sources: 'APM, GitHub, ArgoCD', method: 'Correlation analysis' },
        { id: 'H2', title: 'DB connection pool exhaustion', sources: 'APM, Infra', method: 'Threshold analysis' },
        { id: 'H3', title: 'Upstream payment-gateway degradation', sources: 'APM, Dependencies', method: 'Dependency trace' },
      ],
      approach: 'Univariate baseline → Bivariate correlation → Multivariate pattern matching',
    },
    D: {
      sources: [
        { hypothesis: 'H1', queried: 'APM (latency), GitHub (deploy diff), ArgoCD (rollback history)' },
        { hypothesis: 'H2', queried: 'APM (connection pool), Infra (host metrics)' },
        { hypothesis: 'H3', queried: 'APM (dependency calls)' },
      ],
      summary: '9 sources queried in 3.2s | 847 data points collected',
    },
    I: {
      univariate: [
        { metric: 'Latency p99', baseline: '450ms', current: '2.3s', change: '5.1x increase' },
        { metric: 'Error rate', baseline: '0.02%', current: '1.8%', change: '90x increase' },
        { metric: 'CPU', baseline: '42%', current: '94%', change: '2.2x increase' },
        { metric: 'DB queries', baseline: '120/min', current: '5,640/min', change: '47x increase' },
      ],
      bivariate: [
        { pair: 'Latency ↔ Deploy time', strength: 'strong', r: 0.94, finding: 'Spike began 12 min after deployment v2.4.1' },
        { pair: 'Error rate ↔ DB queries', strength: 'strong', r: 0.91, finding: 'Errors scale linearly with query count' },
        { pair: 'CPU ↔ Throughput', strength: 'weak', r: 0.31, finding: 'CPU spike is a downstream effect, not a cause' },
      ],
      multivariate: 'Deploy v2.4.1 + N+1 query pattern + 47x query increase explains 92% of the latency variance. Matches deployment regression pattern from 4 previous investigations.',
    },
    R: [
      { action: 'Rollback to v2.4.0 via ArgoCD', impact: 'Restores ~$18K/hr revenue | ~6 min to normalize', effort: 'One-click from triage dock', priority: 'HIGH' },
      { action: 'Add eager loading lint rule to CI', impact: 'Prevents recurrence | Saves ~$54K/yr', effort: '2 hours dev work', priority: 'MEDIUM' },
      { action: 'Create DB query count alert', impact: 'Detects N+1 patterns before users notice', effort: '15 min to configure', priority: 'MEDIUM' },
    ],
    summary: 'Root cause: Deployment v2.4.1 removed eager loading, causing 47x DB query increase. Immediate fix: rollback ($18K/hr saved). Prevention: CI lint rule + query count alert.',
  },
  'inv-0893': {
    B: {
      question: 'Why is api-gateway returning 12% 5xx errors since 03:14 UTC?',
      impact: 'Affecting ~8,200 users | $31.5K revenue at risk | SLO burning at 14x',
      stakeholder: 'Paged: Mike T. | Channel: #inc-api-gateway',
      keyQuestion: 'Is this a cert issue, DNS issue, config change, or application bug?',
    },
    A: {
      hypotheses: [
        { id: 'H1', title: 'TLS cert expiry on auth-service', sources: 'APM, K8s, Slack', method: 'Timeline correlation' },
        { id: 'H2', title: 'Rate limiting misconfiguration', sources: 'APM', method: 'Threshold analysis' },
        { id: 'H3', title: 'DNS resolution failures', sources: 'APM, Infra', method: 'Latency decomposition' },
        { id: 'H4', title: 'Memory leak in connection pooling', sources: 'APM, Infra', method: 'Trend analysis' },
      ],
      approach: 'Univariate baseline → Bivariate correlation → Memory pattern matching',
    },
    D: {
      sources: [
        { hypothesis: 'H1', queried: 'APM (5xx errors), K8s (cert secrets), Slack (team confirmation)' },
        { hypothesis: 'H2', queried: 'APM (429 responses)' },
        { hypothesis: 'H3', queried: 'APM (DNS lookup times)' },
        { hypothesis: 'H4', queried: 'APM (memory), Infra (connection pool)' },
      ],
      summary: '6 sources queried in 4.1s | 612 data points collected',
    },
    I: {
      univariate: [
        { metric: 'Error rate (5xx)', baseline: '0.1%', current: '12%', change: '120x increase' },
        { metric: 'Latency p99', baseline: '220ms', current: 'timeout', change: 'Complete failure' },
        { metric: 'Memory', baseline: '58%', current: '67%', change: 'Gradual climb (secondary)' },
      ],
      bivariate: [
        { pair: 'Error spike ↔ Cert expiry time', strength: 'strong', r: 0.99, finding: 'Exact timestamp match at 03:14 UTC' },
        { pair: 'Error type ↔ TLS handshake', strength: 'strong', r: 0.97, finding: 'All 502s are TLS handshake failures' },
        { pair: 'Memory ↔ Error rate', strength: 'weak', r: 0.28, finding: 'Memory trend predates incident' },
      ],
      multivariate: 'TLS cert expiry at 03:14 + 90-day rotation cycle + memory match from INV-0623 confirms the pattern with 99% confidence.',
    },
    R: [
      { action: 'Rotate TLS certificate immediately', impact: 'Restores $31.5K/hr revenue', effort: 'Runbook RB-042 (~30 min)', priority: 'HIGH' },
      { action: 'Configure cert-manager auto-renewal', impact: 'Eliminates recurring 90-day failures', effort: '4 hours platform work', priority: 'HIGH' },
      { action: 'Add cert expiry monitoring (30-day warning)', impact: 'Early detection before impact', effort: '15 min to configure', priority: 'MEDIUM' },
    ],
    summary: 'Root cause: auth-service TLS cert expired after 90-day cycle (2nd occurrence). Fix: rotate cert + configure auto-renewal. $31.5K/hr at stake.',
  },
  'inv-new': {
    B: {
      question: 'Why is payment-gateway latency p99 at 4.2s?',
      impact: 'Affecting ~3,200 users | $8.4K revenue at risk | SLO burning at 3.2x',
      stakeholder: 'Paged: Alex R. | Channel: #payments-incidents',
      keyQuestion: 'Is this a Redis issue, dependency failure, or application bug?',
    },
    A: {
      hypotheses: [
        { id: 'H1', title: 'Redis connection pool exhaustion', sources: 'APM, K8s', method: 'Resource saturation analysis' },
        { id: 'H2', title: 'Downstream inventory-service failure', sources: 'APM', method: 'Dependency health check' },
      ],
      approach: 'Univariate baseline → Bivariate correlation → Resource exhaustion modeling',
    },
    D: {
      sources: [
        { hypothesis: 'H1', queried: 'APM (Redis metrics), K8s (pod events, health checks)' },
        { hypothesis: 'H2', queried: 'APM (inventory-service response times)' },
      ],
      summary: '6 sources queried in 3.2s | 423 data points collected',
    },
    I: {
      univariate: [
        { metric: 'Redis connections', baseline: '45', current: '200 (max)', change: 'Pool exhausted' },
        { metric: 'Latency p99', baseline: '180ms', current: '4.2s', change: '23x increase' },
        { metric: 'Pod restarts', baseline: '0', current: '6 in 22 min', change: 'Health check failures' },
      ],
      bivariate: [
        { pair: 'Connections ↔ Latency', strength: 'strong', r: 0.96, finding: 'Latency scales with pool saturation' },
        { pair: 'Pod restarts ↔ Health timeout', strength: 'strong', r: 0.93, finding: 'Redis timeout blocks /health endpoint' },
      ],
      multivariate: 'Connection leak in v3.1.2 payment processing flow: connections opened on timeout path are never released, causing pool exhaustion under normal load.',
    },
    R: [
      { action: 'Flush Redis connection pool', impact: 'Immediate recovery in ~3 min', effort: 'One command: redis-cli CLIENT KILL', priority: 'HIGH' },
      { action: 'Fix connection leak in v3.1.2', impact: 'Prevents recurrence permanently', effort: '4 hours dev work', priority: 'HIGH' },
      { action: 'Add pool monitoring alert (warn=150, crit=190)', impact: 'Early detection', effort: '15 min', priority: 'MEDIUM' },
    ],
    summary: 'Root cause: Redis connection leak in v3.1.2. Connections not released on timeout. Fix: flush pool + patch code. $8.4K/hr at stake.',
  },
}

/* ── strength indicator ───────────────────────── */
function StrengthBar({ strength }) {
  const w = strength === 'strong' ? '100%' : strength === 'moderate' ? '60%' : '25%'
  const c = strength === 'strong' ? '#00D4A0' : strength === 'moderate' ? '#F5A623' : '#6B7280'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: w, backgroundColor: c }} />
      </div>
      <span className="text-[9px] font-medium capitalize" style={{ color: c }}>{strength}</span>
    </div>
  )
}

/* ── step indicator (collapsed) ───────────────── */
function StepDot({ letter, state, color }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
      state === 'done' ? 'bg-[#00D4A0] text-white'
      : state === 'active' ? 'bg-[#0B6ACB] text-white animate-pulse'
      : 'bg-gray-100 text-[#6B7280]'
    }`}>
      {state === 'done' ? <CheckCircle size={12} /> : letter}
    </div>
  )
}

/* ── main component ───────────────────────────── */
export default function InvestigationMethodology({ scenario, phase }) {
  const [expanded, setExpanded] = useState(false)
  const id = scenario.id
  const data = BADIR_DATA[id]
  if (!data) return null

  const currentStep = STEPS.find(s => getStepState(s.key, phase) === 'active')
  const completedCount = STEPS.filter(s => getStepState(s.key, phase) === 'done').length
  const PRIO = { HIGH: 'destructive', MEDIUM: 'warning', LOW: 'secondary' }

  return (
    <Card className="overflow-hidden">
      {/* Collapsed header */}
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-1">
          {STEPS.map(s => {
            const state = getStepState(s.key, phase)
            return (
              <div key={s.key} className="flex items-center">
                <StepDot letter={s.key} state={state} color={s.color} />
                {s.key !== 'R' && <div className={`w-4 h-[2px] ${state === 'done' ? 'bg-[#00D4A0]' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-[#1D2433]">
            {completedCount === 5 ? 'BADIR Analysis Complete' : `Step ${completedCount + 1} of 5: ${currentStep?.label || 'Starting...'}`}
          </span>
        </div>
        <Badge variant="secondary" className="text-[9px] shrink-0">BADIR</Badge>
        <ChevronDown size={14} className={`text-[#6B7280] transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <Separator />
            <div className="p-4 space-y-4">

              {/* B — Business Question */}
              <div className={`rounded-lg p-3 ${getStepState('B', phase) === 'done' ? 'bg-[#FF4D4D]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#FF4D4D]/10 flex items-center justify-center"><span className="text-[10px] font-bold text-[#FF4D4D]">B</span></div>
                  <span className="text-[12px] font-semibold text-[#1D2433]">Business Question</span>
                  {getStepState('B', phase) === 'done' && <CheckCircle size={12} className="text-[#00D4A0] ml-auto" />}
                </div>
                <p className="text-[13px] font-medium text-[#1D2433] mb-1.5">{data.B.question}</p>
                <p className="text-[11px] text-[#FF4D4D] font-medium mb-1">{data.B.impact}</p>
                <p className="text-[11px] text-[#6B7280]">{data.B.stakeholder}</p>
                <p className="text-[11px] text-[#6B7280] mt-1 italic">Key question: {data.B.keyQuestion}</p>
              </div>

              {/* A — Analysis Plan */}
              <div className={`rounded-lg p-3 ${getStepState('A', phase) === 'done' ? 'bg-[#F5A623]/5' : getStepState('A', phase) === 'active' ? 'bg-[#0B6ACB]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#F5A623]/10 flex items-center justify-center"><span className="text-[10px] font-bold text-[#F5A623]">A</span></div>
                  <span className="text-[12px] font-semibold text-[#1D2433]">Analysis Plan</span>
                  {getStepState('A', phase) === 'done' && <CheckCircle size={12} className="text-[#00D4A0] ml-auto" />}
                  {getStepState('A', phase) === 'active' && <Loader2 size={12} className="text-[#0B6ACB] animate-spin ml-auto" />}
                </div>
                {getStepState('A', phase) !== 'pending' ? (
                  <>
                    <div className="overflow-x-auto mb-2">
                      <table className="w-full text-[10px]">
                        <thead><tr className="text-[#6B7280] text-left"><th className="pb-1 pr-2">#</th><th className="pb-1 pr-2">Hypothesis</th><th className="pb-1 pr-2">Sources</th><th className="pb-1">Method</th></tr></thead>
                        <tbody>
                          {data.A.hypotheses.map(h => (
                            <tr key={h.id} className="border-t border-gray-100">
                              <td className="py-1 pr-2 font-medium text-[#1D2433]">{h.id}</td>
                              <td className="py-1 pr-2 text-[#1D2433]">{h.title}</td>
                              <td className="py-1 pr-2 text-[#6B7280]">{h.sources}</td>
                              <td className="py-1 text-[#6B7280]">{h.method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-[#6B7280]">Approach: {data.A.approach}</p>
                  </>
                ) : <p className="text-[11px] text-[#6B7280] italic">Waiting for context gathering...</p>}
              </div>

              {/* D — Data Collection */}
              <div className={`rounded-lg p-3 ${getStepState('D', phase) === 'done' ? 'bg-[#0B6ACB]/5' : getStepState('D', phase) === 'active' ? 'bg-[#0B6ACB]/5 animate-pulse' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0B6ACB]/10 flex items-center justify-center"><span className="text-[10px] font-bold text-[#0B6ACB]">D</span></div>
                  <span className="text-[12px] font-semibold text-[#1D2433]">Data Collection</span>
                  {getStepState('D', phase) === 'done' && <CheckCircle size={12} className="text-[#00D4A0] ml-auto" />}
                  {getStepState('D', phase) === 'active' && <Loader2 size={12} className="text-[#0B6ACB] animate-spin ml-auto" />}
                </div>
                {getStepState('D', phase) !== 'pending' ? (
                  <>
                    {data.D.sources.map(s => (
                      <p key={s.hypothesis} className="text-[10px] text-[#6B7280] mb-0.5"><span className="font-medium text-[#1D2433]">{s.hypothesis}:</span> {s.queried}</p>
                    ))}
                    <p className="text-[10px] text-[#0B6ACB] font-medium mt-1">{data.D.summary}</p>
                  </>
                ) : <p className="text-[11px] text-[#6B7280] italic">Pending...</p>}
              </div>

              {/* I — Insights */}
              <div className={`rounded-lg p-3 ${getStepState('I', phase) === 'done' ? 'bg-[#9333EA]/5' : getStepState('I', phase) === 'active' ? 'bg-[#9333EA]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#9333EA]/10 flex items-center justify-center"><span className="text-[10px] font-bold text-[#9333EA]">I</span></div>
                  <span className="text-[12px] font-semibold text-[#1D2433]">Insights</span>
                  {getStepState('I', phase) === 'done' && <CheckCircle size={12} className="text-[#00D4A0] ml-auto" />}
                  {getStepState('I', phase) === 'active' && <Loader2 size={12} className="text-[#9333EA] animate-spin ml-auto" />}
                </div>
                {getStepState('I', phase) !== 'pending' ? (
                  <div className="space-y-3">
                    {/* Tier 1 */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Tier 1: Univariate Analysis</p>
                      <div className="space-y-1">
                        {data.I.univariate.map(m => (
                          <div key={m.metric} className="flex items-center gap-2 text-[10px]">
                            <span className="text-[#1D2433] font-medium w-24 shrink-0">{m.metric}</span>
                            <span className="text-[#00D4A0]">{m.baseline}</span>
                            <span className="text-[#6B7280]">→</span>
                            <span className="text-[#FF4D4D]">{m.current}</span>
                            <span className="text-[#6B7280] ml-auto">{m.change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tier 2 */}
                    <div>
                      <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Tier 2: Bivariate Correlation</p>
                      <div className="space-y-1.5">
                        {data.I.bivariate.map(b => (
                          <div key={b.pair} className="text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#1D2433] font-medium">{b.pair}</span>
                              <StrengthBar strength={b.strength} />
                              <span className="text-[#6B7280] ml-auto">r={b.r}</span>
                            </div>
                            <p className="text-[#6B7280] ml-0 mt-0.5">{b.finding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tier 3 */}
                    {getStepState('I', phase) === 'done' && (
                      <div>
                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Tier 3: Multivariate Pattern</p>
                        <p className="text-[11px] text-[#1D2433] leading-relaxed bg-white/60 rounded p-2">{data.I.multivariate}</p>
                      </div>
                    )}
                  </div>
                ) : <p className="text-[11px] text-[#6B7280] italic">Pending hypothesis testing...</p>}
              </div>

              {/* R — Recommendations */}
              <div className={`rounded-lg p-3 ${getStepState('R', phase) === 'done' ? 'bg-[#00D4A0]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#00D4A0]/10 flex items-center justify-center"><span className="text-[10px] font-bold text-[#00D4A0]">R</span></div>
                  <span className="text-[12px] font-semibold text-[#1D2433]">Recommendations</span>
                  {getStepState('R', phase) === 'done' && <CheckCircle size={12} className="text-[#00D4A0] ml-auto" />}
                </div>
                {getStepState('R', phase) === 'done' ? (
                  <>
                    <div className="space-y-2 mb-3">
                      {data.R.map((r, i) => (
                        <div key={i} className="bg-white/60 rounded p-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-medium text-[#1D2433]">{r.action}</span>
                            <Badge variant={PRIO[r.priority] || 'secondary'} className="text-[8px] ml-auto">{r.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#6B7280]">
                            <span className="text-[#00D4A0] font-medium">{r.impact}</span>
                            <span>Effort: {r.effort}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="mb-2" />
                    <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">One-Page Summary</p>
                    <p className="text-[11px] text-[#1D2433] leading-relaxed">{data.summary}</p>
                  </>
                ) : <p className="text-[11px] text-[#6B7280] italic">Pending root cause confirmation...</p>}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
