import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'

const ENTITIES = [
  { name: 'payment-gateway', health: 'warning', condition: 'Latency p99 > 2s' },
  { name: 'checkout-service', health: 'healthy', condition: 'Latency p99 > 2s' },
  { name: 'api-gateway', health: 'healthy', condition: 'Error rate > 5%' },
  { name: 'search-service', health: 'healthy', condition: '' },
  { name: 'inventory-service', health: 'healthy', condition: '' },
  { name: 'auth-service', health: 'healthy', condition: '' },
]

const HEALTH_DOT = { healthy: 'bg-[#00D4A0]', warning: 'bg-[#F5A623]', critical: 'bg-[#FF4D4D]' }

const SEVERITY_OPTIONS = [
  { value: 'P1', label: 'P1', desc: 'Critical — pages on-call immediately', variant: 'p1', ring: 'ring-[#FF4D4D]/20 border-[#FF4D4D] bg-[#FF4D4D]/5 text-[#FF4D4D]' },
  { value: 'P2', label: 'P2', desc: 'High — investigation + notification', variant: 'p2', ring: 'ring-[#F5A623]/20 border-[#F5A623] bg-[#F5A623]/5 text-[#F5A623]' },
  { value: 'P3', label: 'P3', desc: 'Medium — investigate when convenient', variant: 'p3', ring: 'ring-[#0B6ACB]/20 border-[#0B6ACB] bg-[#0B6ACB]/5 text-[#0B6ACB]' },
]

export default function NewInvestigationModal({ open, onClose }) {
  const navigate = useNavigate()
  const [entity, setEntity] = useState(ENTITIES[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [condition, setCondition] = useState(ENTITIES[0].condition)
  const [severity, setSeverity] = useState('P2')
  const [context, setContext] = useState('')

  const selectEntity = (e) => {
    setEntity(e)
    setCondition(e.condition)
    setDropdownOpen(false)
  }

  const handleStart = () => {
    onClose()
    navigate('/investigation/inv-new')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start New Investigation</DialogTitle>
          <DialogDescription>Manually trigger an agent investigation on any entity.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Entity selector */}
          <div>
            <label className="text-[12px] font-medium text-[#6B7280] mb-1.5 block">Entity</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-left hover:border-[#0B6ACB]/40 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${HEALTH_DOT[entity.health]}`} />
                <span className="text-[14px] text-[#1D2433] flex-1">{entity.name}</span>
                <ChevronDown size={14} className={`text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    {ENTITIES.map((e) => (
                      <button
                        key={e.name}
                        onClick={() => selectEntity(e)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA] transition-colors ${
                          entity.name === e.name ? 'bg-[#0B6ACB]/5' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${HEALTH_DOT[e.health]}`} />
                        <span className="text-[13px] text-[#1D2433]">{e.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Alert condition */}
          <div>
            <label className="text-[12px] font-medium text-[#6B7280] mb-1.5 block">Alert Condition</label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., Error rate > 5%"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="text-[12px] font-medium text-[#6B7280] mb-2 block">Severity</label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={`flex-1 border rounded-lg px-3 py-2 text-center transition-all ${
                    severity === s.value
                      ? `${s.ring} ring-2`
                      : 'border-gray-200 text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <span className="text-[14px] font-semibold block">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1.5">
              {SEVERITY_OPTIONS.find(s => s.value === severity)?.desc}
            </p>
          </div>

          {/* Additional context */}
          <div>
            <label className="text-[12px] font-medium text-[#6B7280] mb-1.5 block">
              Additional Context <span className="text-[#D1D5DB] font-normal">(optional)</span>
            </label>
            <Textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any context for the agent? (e.g., 'Customer reported slow payments')"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleStart}>
            <Sparkles size={14} /> Start Investigation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
