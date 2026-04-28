import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle, ChevronRight, ChevronLeft, AlertTriangle,
  Bell, MessageSquare, GitBranch, Ticket, Zap, Brain, Play, Check,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'

/* ── constants ────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Name & Accounts', icon: Sparkles },
  { id: 2, label: 'Connect Alerts', icon: AlertTriangle },
  { id: 3, label: 'Connect Tools', icon: Zap },
  { id: 4, label: 'Quick Context', icon: Brain },
  { id: 5, label: 'Test Run', icon: Play },
]

const INITIAL_ALERTS = [
  { id: 1, name: 'checkout-service latency > 2s', incidents: 12, selected: true },
  { id: 2, name: 'api-gateway error rate > 5%', incidents: 8, selected: true },
  { id: 3, name: 'payment-gateway timeout > 3s', incidents: 6, selected: true },
  { id: 4, name: 'search-service CPU > 90%', incidents: 5, selected: false },
  { id: 5, name: 'inventory-service error rate > 2%', incidents: 3, selected: false },
]

const INITIAL_TOOLS = [
  { id: 'pagerduty', name: 'PagerDuty', icon: Bell, desc: "See who's on-call and manage escalations", connected: false },
  { id: 'slack', name: 'Slack', icon: MessageSquare, desc: 'Get investigations in your incident channels', connected: false },
  { id: 'github', name: 'GitHub', icon: GitBranch, desc: 'See deployment diffs and code changes', connected: false },
  { id: 'jira', name: 'Jira / ServiceNow', icon: Ticket, desc: 'Create tickets from investigations', connected: false },
]

/* ── step indicator ───────────────────────────── */
function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
              active ? 'bg-[#0B6ACB] text-white'
              : done ? 'bg-[#00D4A0]/10 text-[#00D4A0]'
              : 'bg-gray-100 text-[#6B7280]'
            }`}>
              {done ? <Check size={12} /> : <step.icon size={12} />}
              <span className="hidden lg:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-[2px] mx-1 transition-colors duration-200 ${done ? 'bg-[#00D4A0]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── main component ───────────────────────────── */
export default function SetupWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [tools, setTools] = useState(INITIAL_TOOLS)
  const [cloud, setCloud] = useState('AWS')
  const [orchestration, setOrchestration] = useState('Kubernetes')
  const [testState, setTestState] = useState('idle') // idle | running | done

  const next = () => {
    if (step === 5) { setStep(6); return }
    setStep(s => Math.min(s + 1, 5))
  }
  const prev = () => setStep(s => Math.max(s - 1, 1))
  const toggleAlert = (id) => setAlerts(a => a.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  const connectTool = (id) => setTools(t => t.map(p => p.id === id ? { ...p, connected: true } : p))

  const runTest = () => {
    setTestState('running')
    setTimeout(() => setTestState('done'), 2500)
  }

  /* ── Welcome screen (step 0) ── */
  if (step === 0) {
    return (
      <div>
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0B6ACB]/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-[#0B6ACB]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D2433] mb-3">Meet Your SRE Agent</h1>
            <p className="text-[14px] text-[#6B7280] leading-relaxed mb-2">
              An AI-powered investigation assistant that helps you find root causes faster,
              learn from past incidents, and coordinate your team.
            </p>
            <p className="text-[13px] text-[#6B7280] mb-8">Setup takes about 5 minutes.</p>
            <Button size="lg" onClick={() => setStep(1)}>Get Started</Button>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Completion screen (step 6) ── */
  if (step === 6) {
    const connectedCount = tools.filter(t => t.connected).length
    const alertCount = alerts.filter(a => a.selected).length
    return (
      <div>
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-full bg-[#00D4A0]/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-[#00D4A0]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D2433] mb-3">Your SRE Agent is Ready</h1>
            <div className="text-[13px] text-[#6B7280] space-y-1 mb-6">
              <p>Connected: <span className="font-medium text-[#1D2433]">{alertCount} alert conditions</span>, <span className="font-medium text-[#1D2433]">{connectedCount} integrations</span></p>
              <p>First memory created from test investigation</p>
            </div>
            <div className="bg-[#F7F8FA] rounded-xl p-4 text-left text-[13px] text-[#6B7280] space-y-1.5 mb-6">
              <p className="font-medium text-[#1D2433] mb-2">What happens next:</p>
              <p className="flex items-start gap-2"><span className="text-[#00D4A0] mt-0.5">•</span> Your Morning Brief starts tomorrow</p>
              <p className="flex items-start gap-2"><span className="text-[#00D4A0] mt-0.5">•</span> Selected alerts will auto-trigger investigations</p>
              <p className="flex items-start gap-2"><span className="text-[#00D4A0] mt-0.5">•</span> You can start a manual investigation anytime</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
              <Button variant="outline" onClick={() => navigate('/memory')}>Explore Memory</Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Steps 1-5 ── */
  return (
    <div>
      <Breadcrumbs />
      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-gray-100 bg-white p-6 max-w-3xl"
        >
          {/* ── Step 1: Name & Accounts ── */}
          {step === 1 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Name & Accounts</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Name your agent and select which accounts it can access.</p>
              <div className="space-y-5">
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1.5 block">Agent Name</label>
                  <Input defaultValue="SRE Agent" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-2 block">Accounts</label>
                  <div className="space-y-1">
                    {[
                      { name: 'Production (Account 1234567)', checked: true, badge: 'Most alerts' },
                      { name: 'Staging (Account 1234568)', checked: true, badge: null },
                      { name: 'Dev (Account 1234569)', checked: false, badge: null },
                    ].map((acc) => (
                      <label key={acc.name} className="flex items-center gap-2.5 py-2 text-[13px] cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          defaultChecked={acc.checked}
                          className="w-4 h-4 rounded border-gray-300 text-[#0B6ACB] focus:ring-[#0B6ACB]/20"
                        />
                        <span className="text-[#1D2433]">{acc.name}</span>
                        {acc.badge && (
                          <span className="text-[10px] bg-[#0B6ACB]/10 text-[#0B6ACB] px-1.5 py-0.5 rounded font-medium">{acc.badge}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Connect Alerts ── */}
          {step === 2 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Connect Alert Conditions</h2>
              <p className="text-[13px] text-[#6B7280] mb-3">Select which conditions should auto-trigger investigation.</p>
              <div className="bg-[#0B6ACB]/5 border border-[#0B6ACB]/20 rounded-lg px-3 py-2.5 text-[12px] text-[#0B6ACB] mb-4 leading-relaxed">
                We suggest starting with these top conditions — they triggered 73% of your incidents last month.
              </div>
              <div className="space-y-1">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => toggleAlert(a.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                      a.selected
                        ? 'bg-[#0B6ACB]/5 border border-[#0B6ACB]/20'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      a.selected ? 'bg-[#0B6ACB] border-[#0B6ACB]' : 'border-gray-300'
                    }`}>
                      {a.selected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[13px] text-[#1D2433] flex-1">{a.name}</span>
                    <span className="text-[11px] text-[#6B7280]">{a.incidents} incidents/month</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Connect Tools ── */}
          {step === 3 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Connect Your Tools</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">The more tools connected, the richer the investigation context.</p>
              <div className="grid grid-cols-2 gap-3">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      t.connected ? 'border-[#00D4A0] bg-[#00D4A0]/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <t.icon size={16} className={t.connected ? 'text-[#00D4A0]' : 'text-[#6B7280]'} />
                      <span className="text-[13px] font-semibold text-[#1D2433]">{t.name}</span>
                      {t.connected && <CheckCircle size={14} className="text-[#00D4A0] ml-auto" />}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mb-3 leading-relaxed">{t.desc}</p>
                    {t.connected ? (
                      <span className="text-[11px] text-[#00D4A0] font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={() => connectTool(t.id)}
                        className="text-[11px] px-3 py-1.5 bg-[#0B6ACB] text-white rounded-lg font-medium hover:bg-[#0A5EB8] transition-colors"
                      >
                        Connect with OAuth
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-4">
                Skip for now — you can configure more in the Integrations Hub later.
              </p>
            </div>
          )}

          {/* ── Step 4: Quick Context ── */}
          {step === 4 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Quick Context</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Help your agent understand your environment.</p>
              <div className="space-y-5">
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-2 block">Primary Cloud Provider</label>
                  <div className="flex gap-2">
                    {['AWS', 'Azure', 'GCP', 'Other'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCloud(c)}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all duration-150 ${
                          cloud === c
                            ? 'bg-[#0B6ACB] text-white border-[#0B6ACB]'
                            : 'border-gray-200 text-[#6B7280] hover:border-[#0B6ACB] hover:text-[#0B6ACB]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-2 block">Primary Orchestration</label>
                  <div className="flex flex-wrap gap-2">
                    {['Kubernetes', 'ECS', 'Lambda', 'VMs', 'Other'].map((o) => (
                      <button
                        key={o}
                        onClick={() => setOrchestration(o)}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all duration-150 ${
                          orchestration === o
                            ? 'bg-[#0B6ACB] text-white border-[#0B6ACB]'
                            : 'border-gray-200 text-[#6B7280] hover:border-[#0B6ACB] hover:text-[#0B6ACB]'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1.5 block">Known Noise Patterns</label>
                  <Textarea
                    rows={3}
                    defaultValue="Monday 2-3 AM UTC: batch job causes CPU spike on inventory-service. NOT an incident."
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1.5">You can add more context later in Memory Explorer.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Test Run ── */}
          {step === 5 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Test Run</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Let's see your agent in action on a recent resolved alert.</p>

              {testState === 'idle' && (
                <div className="text-center py-8">
                  <div className="bg-[#F7F8FA] rounded-xl p-4 inline-block mb-5 text-left">
                    <p className="text-[12px] font-medium text-[#1D2433] mb-1">Selected alert:</p>
                    <p className="text-[13px] text-[#6B7280]">search-service error rate &gt; 5% (Apr 7, resolved in 18 min)</p>
                  </div>
                  <br />
                  <Button onClick={runTest}><Play size={13} /> Run Test Investigation</Button>
                </div>
              )}

              {testState === 'running' && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-[3px] border-[#0B6ACB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[13px] text-[#6B7280] mb-4">Running investigation in read-only mode...</p>
                  <div className="flex justify-center gap-4 text-[11px]">
                    <span className="text-[#00D4A0]">✓ Context gathered</span>
                    <span className="text-[#6B7280] animate-pulse">Testing hypotheses...</span>
                  </div>
                </div>
              )}

              {(testState === 'done' || testState === 'rated-good' || testState === 'rated-bad') && (
                <div className="space-y-4">
                  <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-4">
                    <p className="text-[13px] font-medium text-[#1D2433] mb-2.5">Test Complete</p>
                    <div className="text-[12px] text-[#6B7280] space-y-1.5">
                      <p>• Context gathered: APM, Logs, GitHub (3 sources)</p>
                      <p>• 2 hypotheses tested: N+1 query (<span className="text-[#00D4A0] font-medium">94% ✓</span>), Memory leak (<span className="text-[#FF4D4D] font-medium">12% ✗</span>)</p>
                      <p>• Root cause: N+1 query in search flow (matches actual resolution)</p>
                      <p>• First memory created: &ldquo;search-service N+1 query pattern&rdquo;</p>
                    </div>
                  </div>
                  {testState === 'done' && (
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-[#6B7280]">How did it do?</span>
                      <Button variant="good" size="sm" onClick={() => setTestState('rated-good')}>👍 Good</Button>
                      <Button variant="secondary" size="sm" onClick={() => setTestState('rated-bad')}>👎 Needs work</Button>
                    </div>
                  )}
                  {testState === 'rated-good' && (
                    <div className="bg-[#0B6ACB]/5 border border-[#0B6ACB]/15 rounded-lg p-3 text-center">
                      <p className="text-[12px] text-[#0B6ACB] font-medium">Thanks! Your feedback helps improve the agent.</p>
                    </div>
                  )}
                  {testState === 'rated-bad' && (
                    <div className="bg-[#F5A623]/5 border border-[#F5A623]/15 rounded-lg p-3 text-center">
                      <p className="text-[12px] text-[#F5A623] font-medium">Got it — we'll use this to improve accuracy. You can fine-tune in Settings later.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Nav buttons ── */}
      <div className="flex justify-between mt-5 max-w-3xl">
        <Button variant="ghost" onClick={prev} disabled={step <= 1}>
          <ChevronLeft size={14} /> Back
        </Button>
        <Button onClick={next}>
          {step === 5 ? 'Finish Setup' : 'Continue'} <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
