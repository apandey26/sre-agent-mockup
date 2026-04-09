import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle, ChevronRight, ChevronLeft, AlertTriangle,
  Bell, MessageSquare, GitBranch, Ticket, Cloud, FileText,
  Zap, Brain, Play, ArrowRight, Check, Shield,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

const STEPS = [
  { id: 1, label: 'Name & Accounts', icon: Sparkles },
  { id: 2, label: 'Connect Alerts', icon: AlertTriangle },
  { id: 3, label: 'Connect Tools', icon: Zap },
  { id: 4, label: 'Quick Context', icon: Brain },
  { id: 5, label: 'Test Run', icon: Play },
]

const INTEGRATIONS = [
  { id: 'pagerduty', name: 'PagerDuty', icon: Bell, desc: 'See who\'s on-call and manage escalations', connected: false },
  { id: 'slack', name: 'Slack', icon: MessageSquare, desc: 'Get investigations in your incident channels', connected: false },
  { id: 'github', name: 'GitHub', icon: GitBranch, desc: 'See deployment diffs and code changes', connected: false },
  { id: 'jira', name: 'Jira / ServiceNow', icon: Ticket, desc: 'Create tickets from investigations', connected: false },
]

const ALERT_POLICIES = [
  { id: 1, name: 'checkout-service latency > 2s', incidents: 12, selected: true },
  { id: 2, name: 'api-gateway error rate > 5%', incidents: 8, selected: true },
  { id: 3, name: 'payment-gateway timeout > 3s', incidents: 6, selected: true },
  { id: 4, name: 'search-service CPU > 90%', incidents: 5, selected: false },
  { id: 5, name: 'inventory-service error rate > 2%', incidents: 3, selected: false },
]

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
            step.id === current
              ? 'bg-[#0B6ACB] text-white'
              : step.id < current
                ? 'bg-[#00D4A0]/10 text-[#00D4A0]'
                : 'bg-gray-100 text-[#6B7280]'
          }`}>
            {step.id < current ? <Check size={12} /> : <step.icon size={12} />}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-[2px] mx-1 ${step.id < current ? 'bg-[#00D4A0]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SetupWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0 = welcome screen
  const [alerts, setAlerts] = useState(ALERT_POLICIES)
  const [tools, setTools] = useState(INTEGRATIONS)
  const [testRunning, setTestRunning] = useState(false)
  const [testDone, setTestDone] = useState(false)

  const next = () => setStep((s) => Math.min(s + 1, 6))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const toggleAlert = (id) => setAlerts(a => a.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  const connectTool = (id) => setTools(t => t.map(p => p.id === id ? { ...p, connected: true } : p))

  const runTest = () => {
    setTestRunning(true)
    setTimeout(() => { setTestRunning(false); setTestDone(true) }, 2500)
  }

  // Welcome screen
  if (step === 0) {
    return (
      <div>
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0B6ACB]/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-[#0B6ACB]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D2433] mb-3">Meet Your SRE Agent</h1>
            <p className="text-[14px] text-[#6B7280] leading-relaxed mb-6">
              An AI-powered investigation assistant that helps you find root causes faster,
              learn from past incidents, and coordinate your team.
            </p>
            <p className="text-[13px] text-[#6B7280] mb-8">Setup takes about 5 minutes.</p>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 bg-[#0B6ACB] text-white rounded-lg text-[14px] font-medium hover:bg-[#0A5EB8] transition-colors"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Completion screen
  if (step === 6) {
    const connectedCount = tools.filter(t => t.connected).length
    const alertCount = alerts.filter(a => a.selected).length
    return (
      <div>
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#00D4A0]/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-[#00D4A0]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D2433] mb-3">Your SRE Agent is Ready</h1>
            <div className="text-[13px] text-[#6B7280] space-y-1 mb-6">
              <p>Connected: {alertCount} alert conditions, {connectedCount} integrations</p>
              <p>First memory created from test investigation</p>
            </div>
            <div className="bg-[#F7F8FA] rounded-xl p-4 text-left text-[13px] text-[#6B7280] space-y-2 mb-6">
              <p className="font-medium text-[#1D2433]">What happens next:</p>
              <p>• Your Morning Brief starts tomorrow</p>
              <p>• Selected alerts will auto-trigger investigations</p>
              <p>• You can start a manual investigation anytime</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/')} className="px-5 py-2 bg-[#0B6ACB] text-white rounded-lg text-[13px] font-medium hover:bg-[#0A5EB8]">
                Go to Dashboard
              </button>
              <button onClick={() => navigate('/memory')} className="px-5 py-2 bg-white border border-gray-200 text-[#1D2433] rounded-lg text-[13px] font-medium hover:bg-gray-50">
                Explore Memory
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs />
      <StepIndicator steps={STEPS} current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl"
        >
          {/* Step 1: Name & Accounts */}
          {step === 1 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Name & Accounts</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Name your agent and select which accounts it can access.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Agent Name</label>
                  <input
                    type="text"
                    defaultValue="SRE Agent"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0B6ACB] focus:ring-1 focus:ring-[#0B6ACB]/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-2 block">Accounts</label>
                  {['Production (Account 1234567)', 'Staging (Account 1234568)', 'Dev (Account 1234569)'].map((acc, i) => (
                    <label key={acc} className="flex items-center gap-2 py-1.5 text-[13px] cursor-pointer">
                      <input type="checkbox" defaultChecked={i < 2} className="rounded border-gray-300 text-[#0B6ACB] focus:ring-[#0B6ACB]" />
                      <span>{acc}</span>
                      {i === 0 && <span className="text-[10px] bg-[#0B6ACB]/10 text-[#0B6ACB] px-1.5 py-0.5 rounded font-medium">Most alerts</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Connect Alerts */}
          {step === 2 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Connect Alert Conditions</h2>
              <p className="text-[13px] text-[#6B7280] mb-2">Select which conditions should auto-trigger investigation.</p>
              <div className="bg-[#0B6ACB]/5 border border-[#0B6ACB]/20 rounded-lg px-3 py-2 text-[12px] text-[#0B6ACB] mb-4">
                We suggest starting with these top conditions — they triggered 73% of your incidents last month.
              </div>
              <div className="space-y-1">
                {alerts.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      a.selected ? 'bg-[#0B6ACB]/5 border border-[#0B6ACB]/20' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => toggleAlert(a.id)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      a.selected ? 'bg-[#0B6ACB] border-[#0B6ACB]' : 'border-gray-300'
                    }`}>
                      {a.selected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[13px] text-[#1D2433] flex-1">{a.name}</span>
                    <span className="text-[11px] text-[#6B7280]">{a.incidents} incidents/month</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Connect Tools */}
          {step === 3 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Connect Your Tools</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">The more tools connected, the richer the investigation context.</p>
              <div className="grid grid-cols-2 gap-3">
                {tools.map((t) => (
                  <div key={t.id} className={`border rounded-xl p-4 transition-colors ${
                    t.connected ? 'border-[#00D4A0] bg-[#00D4A0]/5' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <t.icon size={16} className={t.connected ? 'text-[#00D4A0]' : 'text-[#6B7280]'} />
                      <span className="text-[13px] font-semibold text-[#1D2433]">{t.name}</span>
                      {t.connected && <CheckCircle size={14} className="text-[#00D4A0] ml-auto" />}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mb-3">{t.desc}</p>
                    {t.connected ? (
                      <span className="text-[11px] text-[#00D4A0] font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={() => connectTool(t.id)}
                        className="text-[11px] px-3 py-1.5 bg-[#0B6ACB] text-white rounded-lg font-medium hover:bg-[#0A5EB8]"
                      >
                        Connect with OAuth
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-3">
                Skip for now — you can configure more in the Integrations Hub later.
              </p>
            </div>
          )}

          {/* Step 4: Quick Context */}
          {step === 4 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Quick Context</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Help your agent understand your environment.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Primary Cloud Provider</label>
                  <div className="flex gap-2">
                    {['AWS', 'Azure', 'GCP', 'Other'].map((c, i) => (
                      <button key={c} className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                        i === 0 ? 'bg-[#0B6ACB] text-white border-[#0B6ACB]' : 'border-gray-200 text-[#6B7280] hover:border-[#0B6ACB]'
                      }`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Primary Orchestration</label>
                  <div className="flex gap-2">
                    {['Kubernetes', 'ECS', 'Lambda', 'VMs', 'Other'].map((o, i) => (
                      <button key={o} className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                        i === 0 ? 'bg-[#0B6ACB] text-white border-[#0B6ACB]' : 'border-gray-200 text-[#6B7280] hover:border-[#0B6ACB]'
                      }`}>{o}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Known Noise Patterns</label>
                  <textarea
                    rows={3}
                    defaultValue="Monday 2-3 AM UTC: batch job causes CPU spike on inventory-service. NOT an incident."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0B6ACB] resize-none"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">You can add more context later in Memory Explorer.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Test Run */}
          {step === 5 && (
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D2433] mb-1">Test Run</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">Let's see your agent in action on a recent resolved alert.</p>
              {!testRunning && !testDone && (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-xl p-4 inline-block mb-4 text-left">
                    <p className="text-[12px] font-medium text-[#1D2433] mb-1">Selected alert:</p>
                    <p className="text-[13px] text-[#6B7280]">search-service error rate &gt; 5% (Apr 7, resolved in 18 min)</p>
                  </div>
                  <br />
                  <button onClick={runTest} className="px-5 py-2.5 bg-[#0B6ACB] text-white rounded-lg text-[13px] font-medium hover:bg-[#0A5EB8]">
                    <Play size={13} className="inline mr-1.5 -mt-0.5" /> Run Test Investigation
                  </button>
                </div>
              )}
              {testRunning && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-3 border-[#0B6ACB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[13px] text-[#6B7280]">Running investigation in read-only mode...</p>
                  <div className="flex justify-center gap-4 mt-4 text-[11px] text-[#6B7280]">
                    <span className="text-[#00D4A0]">✓ Context gathered</span>
                    <span className="animate-pulse">Testing hypotheses...</span>
                  </div>
                </div>
              )}
              {testDone && (
                <div className="space-y-3">
                  <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-4">
                    <p className="text-[13px] font-medium text-[#1D2433] mb-2">Test Complete</p>
                    <div className="text-[12px] text-[#6B7280] space-y-1">
                      <p>• Context gathered: APM, Logs, GitHub (3 sources)</p>
                      <p>• 2 hypotheses tested: N+1 query (94% ✓), Memory leak (12% ✗)</p>
                      <p>• Root cause: N+1 query in search flow (matches actual resolution)</p>
                      <p>• First memory created: "search-service N+1 query pattern"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#6B7280]">How did it do?</span>
                    <button className="px-3 py-1 bg-[#00D4A0]/10 text-[#00D4A0] rounded text-[12px] font-medium hover:bg-[#00D4A0]/20">👍 Good</button>
                    <button className="px-3 py-1 bg-gray-100 text-[#6B7280] rounded text-[12px] font-medium hover:bg-gray-200">👎 Needs work</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-5 max-w-3xl">
        <button
          onClick={prev}
          disabled={step <= 1}
          className="flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] hover:text-[#1D2433] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={next}
          className="flex items-center gap-1 px-5 py-2 bg-[#0B6ACB] text-white rounded-lg text-[13px] font-medium hover:bg-[#0A5EB8]"
        >
          {step === 5 ? 'Finish Setup' : 'Continue'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
