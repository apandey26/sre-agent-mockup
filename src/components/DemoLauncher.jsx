import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, ArrowRight, Zap, Shield, Plus } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

const SCENARIOS = [
  {
    id: 'a',
    title: 'Golden Metric Degradation',
    desc: 'A bad deployment causes latency spike on checkout-service. Agent identifies N+1 query root cause.',
    severity: 'P1',
    entity: 'checkout-service',
    path: '/investigation/inv-0892',
    variant: 'p1',
  },
  {
    id: 'b',
    title: 'SLO Burn Rate Breach',
    desc: 'Expired TLS cert causes overnight SLO breach on api-gateway. Memory matches from 90 days ago.',
    severity: 'P2',
    entity: 'api-gateway',
    path: '/investigation/inv-0893',
    variant: 'p2',
  },
  {
    id: 'c',
    title: 'New Investigation (Live)',
    desc: 'Start a fresh investigation on payment-gateway. Watch the agent work through phases in real time.',
    severity: 'P2',
    entity: 'payment-gateway',
    path: '/__new__',
    variant: 'default',
  },
]

export default function DemoLauncher({ onNewInvestigation }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleStart = (scenario) => {
    setOpen(false)
    if (scenario.path === '/__new__') {
      navigate('/')
      setTimeout(() => onNewInvestigation?.(), 300)
    } else {
      navigate(scenario.path)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 left-[196px] z-40 w-10 h-10 rounded-full bg-[#0B6ACB] text-white flex items-center justify-center shadow-lg hover:bg-[#0A5EB8] transition-colors"
      >
        {open ? <X size={18} /> : <HelpCircle size={18} />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-16 left-[196px] z-40"
            >
              <Card className="w-[320px] shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-semibold text-[#1D2433]">Scenario Guide</h3>
                  <button onClick={() => setOpen(false)} className="text-[#6B7280] hover:text-[#1D2433]"><X size={14} /></button>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-3">Pick a scenario to explore the SRE Agent experience end-to-end.</p>

                <div className="space-y-2">
                  {SCENARIOS.map(s => (
                    <div key={s.id} className="border border-gray-100 rounded-lg p-3 hover:border-[#0B6ACB]/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant={s.variant} className="text-[9px]">{s.severity}</Badge>
                        <span className="text-[12px] font-semibold text-[#1D2433]">{s.title}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mb-2 leading-relaxed">{s.desc}</p>
                      <Button variant="outline" size="sm" className="w-full text-[11px]" onClick={() => handleStart(s)}>
                        {s.id === 'c' ? <Plus size={11} /> : <ArrowRight size={11} />}
                        Start from beginning
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
