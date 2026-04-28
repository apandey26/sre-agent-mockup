import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader, Eye, Brain } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const PHASE_STYLE = {
  context:    { color: 'text-[#0B6ACB]', bg: 'bg-[#0B6ACB]/10 text-[#0B6ACB]', label: 'Context' },
  hypotheses: { color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10 text-[#F5A623]', label: 'Hypotheses' },
  rootCause:  { color: 'text-[#00D4A0]', bg: 'bg-[#00D4A0]/10 text-[#00D4A0]', label: 'Root Cause' },
}

export default function AgentActivityStrip({ activeInvestigations, agentStatus }) {
  const navigate = useNavigate()

  if (activeInvestigations.length === 0) {
    return (
      <Card className="p-3 bg-gradient-to-r from-[#9333EA]/3 to-[#0B6ACB]/3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#9333EA]/10 flex items-center justify-center">
            <Eye size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#1D2433]">Agent monitoring {agentStatus.monitoredEntities} entities across {agentStatus.environments.length} environments</p>
            <p className="text-[10px] text-[#6B7280]">Ready to investigate when alerts fire</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-[#9333EA]/5 to-[#0B6ACB]/5 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={13} className="text-[#9333EA]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9333EA]">Agent Active</span>
        <Badge variant="secondary" className="text-[9px]">{activeInvestigations.length} investigation{activeInvestigations.length > 1 ? 's' : ''}</Badge>
      </div>
      <div className="space-y-1.5">
        {activeInvestigations.map(inv => {
          const phase = PHASE_STYLE[inv.phase] || PHASE_STYLE.context
          return (
            <button
              key={inv.id}
              onClick={() => navigate(`/investigation/${inv.id}`)}
              className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/50 transition-colors text-left"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader size={14} className="text-[#9333EA]" />
              </motion.div>
              <span className="text-[12px] font-semibold text-[#1D2433]">{inv.entity}</span>
              <Badge className={`text-[9px] ${phase.bg}`}>{phase.label}</Badge>
              <span className="text-[11px] font-bold text-[#1D2433]">{inv.topConfidence}%</span>
              <span className="text-[10px] text-[#6B7280]">{inv.elapsedTime}</span>
              <span className="text-[10px] text-[#0B6ACB] font-medium ml-auto">Open →</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
