import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ShieldAlert, Zap, Eye, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useSimulation } from './SimulationContext'
import { GUIDED_STEPS } from '../data/guided-script'

/* ── chips for non-guided scenarios ───────────── */
const SCENARIO_CHIPS = {
  'inv-0892': ["Service health analysis", "Recent changes", "Check deployment diff", "Compare with last week", "Pod startup & HPA"],
  'inv-0893': ["Service health analysis", "Check cert status", "SLO impact analysis", "View Slack thread", "Escalation timeline"],
}

/* ── keyword response generator (A/B only) ────── */
function generateResponse(text, scenario) {
  const q = text.toLowerCase()
  const entity = scenario.entity
  const gm = scenario.goldenMetrics
  const slo = scenario.slo
  const rc = scenario.rootCause

  if (q.includes('health') || q.includes('status')) {
    const tp = gm.throughput[gm.throughput.length - 1]?.v || 0
    const er = gm.errorRate[gm.errorRate.length - 1]?.v || 0
    const lt = gm.latency.p99[gm.latency.p99.length - 1]?.v || 0
    return `Current golden metrics for ${entity}:\n\nThroughput: ${tp} rpm\nError rate: ${er}%\nLatency p99: ${lt}ms\n\n${gm.anomalyRange ? 'Anomaly detected in the recent window.' : 'All metrics within normal range.'}`
  }
  if (q.includes('deployment') || q.includes('changes') || q.includes('diff') || q.includes('recent')) {
    const changes = scenario.recentChanges || []
    if (changes.length === 0) return `No recent deployments or changes detected for ${entity}. This rules out deployment as a likely cause.`
    return `Recent changes for ${entity}:\n\n${changes.map(c => `• ${c.time} — ${c.title} (${c.source})`).join('\n')}\n\n${rc ? 'The deployment correlates with the latency spike.' : ''}`
  }
  if (q.includes('slo') || q.includes('budget')) {
    return `SLO Status for ${slo.name}:\n\nCurrent: ${slo.current}% (target ${slo.target}%)\nBurn rate: ${slo.burnRate}x\nBudget remaining: ${slo.budgetPercent}%\nProjected exhaustion: ${slo.projectedExhaustion}`
  }
  if (q.includes('cert') || q.includes('tls')) {
    return `Certificate status: auth-service TLS cert expired at 03:14 UTC. Matches memory from 90 days ago (INV-0623). Recommended: execute cert rotation runbook RB-042.`
  }
  return `I've analyzed the data for ${entity}. ${rc ? `Root cause: ${rc.summary}\nConfidence: ${rc.confidence}%.` : 'Investigation in progress.'}`
}

/* ── thinking dots ────────────────────────────── */
function ThinkingDots() {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-[#0B6ACB] flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">AI</div>
      <div className="bg-[#F7F8FA] rounded-xl rounded-bl-sm px-3 py-2 inline-flex items-center gap-1">
        <span className="text-[12px] text-[#6B7280] mr-1">Analyzing</span>
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-1.5 h-1.5 bg-[#0B6ACB] rounded-full"
            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  )
}

/* ── chat message ─────────────────────────────── */
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 8, x: isUser ? 8 : -8 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-5 h-5 rounded-full bg-[#0B6ACB] flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5 mr-1.5">AI</div>
      )}
      <div className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
        isUser ? 'bg-[#0B6ACB] text-white rounded-xl rounded-br-sm' : 'bg-[#F7F8FA] text-[#1D2433] rounded-xl rounded-bl-sm'
      }`}>
        {msg.text}
      </div>
    </motion.div>
  )
}

/* ── main component ───────────────────────────── */
export default function ChatPanel({ scenario, id }) {
  const navigate = useNavigate()
  const { phase, setPhase } = useSimulation()
  const isGuided = id === 'inv-new'

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [guidedComplete, setGuidedComplete] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const scrollRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, thinking])

  // Interact with canvas: scroll + expand sections + highlight
  const interactWithCanvas = (userText, responseText) => {
    const q = (userText + ' ' + responseText).toLowerCase()

    // Determine target section and action
    let target = null
    let action = null

    if (q.includes('evidence') || q.includes('expand')) {
      target = 'section-hypotheses'
      action = 'expand-evidence'
    } else if (q.includes('root cause') || q.includes('impact') || q.includes('analysis') || q.includes('full analysis')) {
      target = 'section-rootcause'
      action = 'expand-rootcause'
    } else if (q.includes('rollback') || q.includes('action') || q.includes('runbook') || q.includes('fix')) {
      target = 'section-triage'
      action = 'expand-rootcause' // triage is inside RCA now
    } else if (q.includes('metric') || q.includes('latency') || q.includes('slo') || q.includes('throughput') || q.includes('health')) {
      target = 'section-context'
    } else if (q.includes('hypothesis') || q.includes('hypotheses') || q.includes('cards')) {
      target = 'section-hypotheses'
    }

    // Scroll to section
    if (target) {
      setTimeout(() => {
        const el = document.getElementById(target)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Brief highlight flash
          el.style.transition = 'box-shadow 0.3s'
          el.style.boxShadow = '0 0 0 2px rgba(11,106,203,0.3)'
          setTimeout(() => { el.style.boxShadow = 'none' }, 2000)
        }
      }, 400)
    }

    // Dispatch expand events
    if (action === 'expand-rootcause') {
      setTimeout(() => window.dispatchEvent(new CustomEvent('canvas-action', { detail: { type: 'expand-rootcause' } })), 500)
    }
    if (action === 'expand-evidence') {
      setTimeout(() => window.dispatchEvent(new CustomEvent('canvas-action', { detail: { type: 'expand-evidence' } })), 500)
    }
  }

  // Determine chips
  const getChips = useCallback(() => {
    if (isGuided && !guidedComplete) {
      const nextStep = GUIDED_STEPS[guidedStep]
      return nextStep ? [nextStep.chipText] : []
    }
    return SCENARIO_CHIPS[id] || ["Service health analysis", "What's happening?"]
  }, [isGuided, guidedComplete, guidedStep, id])

  const chips = getChips()
  const showChips = messages.length === 0 || (isGuided && !guidedComplete && !thinking)

  const sendMessage = useCallback((text) => {
    if (!text.trim() || thinking) return

    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)

    if (isGuided && !guidedComplete) {
      // Guided mode: use scripted response
      const step = GUIDED_STEPS[guidedStep]
      const thinkTime = guidedStep === 0 ? 1500 : 1000

      setTimeout(() => {
        if (step) {
          setMessages(prev => [...prev, { role: 'assistant', text: step.response }])
          interactWithCanvas(text, step.response)

          // Advance canvas phase
          if (step.phaseTarget != null && step.phaseTarget > phase) {
            setPhase(step.phaseTarget)
          }

          // Navigate if needed
          if (step.navigate) {
            setTimeout(() => navigate(`/investigation/${id}/${step.navigate}`), 800)
          }

          const nextStep = guidedStep + 1
          setGuidedStep(nextStep)
          if (nextStep >= GUIDED_STEPS.length) setGuidedComplete(true)
        }
        setThinking(false)
      }, thinkTime)
    } else {
      // Regular mode: keyword matching
      setTimeout(() => {
        const response = generateResponse(text, scenario)
        setMessages(prev => [...prev, { role: 'assistant', text: response }])
        interactWithCanvas(text, response)
        setThinking(false)
      }, 1500)
    }
  }, [thinking, isGuided, guidedComplete, guidedStep, phase, setPhase, scenario, id, navigate])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  // Minimized bar
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="w-[48px] shrink-0 bg-white rounded-xl border border-gray-100 flex flex-col items-center py-4 gap-3 self-start sticky top-5 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <PanelRightOpen size={16} className="text-[#0B6ACB]" />
        <div className="w-2 h-2 rounded-full bg-[#00D4A0]" />
        <span className="text-[9px] font-semibold text-[#6B7280] [writing-mode:vertical-lr] tracking-wider">AI CHAT</span>
        {messages.length > 0 && (
          <Badge variant="default" className="text-[8px] px-1 py-0">{messages.length}</Badge>
        )}
      </button>
    )
  }

  return (
    <div className="w-[300px] shrink-0 bg-white rounded-xl border border-gray-100 flex flex-col self-start sticky top-5 max-h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00D4A0]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">AI Chat</span>
          {isGuided && !guidedComplete && (
            <Badge variant="default" className="text-[9px] ml-auto">Walkthrough</Badge>
          )}
          {isGuided && guidedComplete && (
            <Badge variant="good" className="text-[9px] ml-auto">Done</Badge>
          )}
          <button onClick={() => setMinimized(true)} className="text-[#6B7280] hover:text-[#1D2433] ml-1" title="Minimize chat">
            <PanelRightClose size={14} />
          </button>
        </div>
        {/* Severity-gated AI autonomy indicator */}
        {scenario && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {scenario.severity === 'P1' ? (
              <>
                <ShieldAlert size={10} className="text-[#FF4D4D]" />
                <span className="text-[9px] text-[#FF4D4D] font-medium">Collaborative mode</span>
                <span className="text-[9px] text-[#6B7280]">— AI suggests, you approve</span>
              </>
            ) : scenario.severity === 'P2' ? (
              <>
                <Eye size={10} className="text-[#F5A623]" />
                <span className="text-[9px] text-[#F5A623] font-medium">Supervised mode</span>
                <span className="text-[9px] text-[#6B7280]">— AI acts, you can override</span>
              </>
            ) : (
              <>
                <Zap size={10} className="text-[#00D4A0]" />
                <span className="text-[9px] text-[#00D4A0] font-medium">Autonomous mode</span>
                <span className="text-[9px] text-[#6B7280]">— AI investigates fully</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px] max-h-[500px]">
        {/* Initial state */}
        {messages.length === 0 && (
          <div className="space-y-3">
            {isGuided ? (
              <div className="bg-[#0B6ACB]/5 rounded-lg p-2.5 text-center">
                <p className="text-[11px] text-[#0B6ACB] font-medium mb-0.5">Investigation complete</p>
                <p className="text-[10px] text-[#6B7280]">Click a chip below to walk through how the agent reached this conclusion</p>
              </div>
            ) : (
              <p className="text-[12px] text-[#6B7280] text-center">Ask about this investigation</p>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

        {/* Thinking */}
        {thinking && <ThinkingDots />}

        {/* Guided step indicator */}
        {isGuided && !guidedComplete && messages.length > 0 && !thinking && (
          <p className="text-[10px] text-[#6B7280] text-center">Step {Math.min(guidedStep + 1, 10)} of 10</p>
        )}

        {/* Completion message */}
        {isGuided && guidedComplete && !thinking && (
          <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-2 text-center">
            <p className="text-[11px] text-[#00D4A0] font-medium">Guided demo complete</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">You can continue chatting freely.</p>
          </div>
        )}
      </div>

      {/* Suggested chips */}
      {showChips && chips.length > 0 && !thinking && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {chips.map(chip => (
              <Badge key={chip} variant="default" className="cursor-pointer hover:bg-[#0B6ACB]/20 text-[11px] px-2.5 py-1"
                onClick={() => sendMessage(chip)}>
                {chip}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isGuided && !guidedComplete ? "Click a chip or type anything..." : "Ask about this investigation..."}
            disabled={thinking} className="text-[12px] h-8" />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage(input)}
            disabled={thinking || !input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
