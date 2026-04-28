import { useNavigate } from 'react-router-dom'
import { Zap, Clock, Target, Brain, ArrowRight } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const METRICS = [
  { icon: Clock, label: 'Time Saved', value: '14.2 hrs', sub: 'vs manual investigation', color: '#00D4A0' },
  { icon: Zap, label: 'Auto-Resolved', value: '24%', trend: '↑ 8%', color: '#0B6ACB' },
  { icon: Target, label: 'Accuracy', value: '78%', trend: '↑ 5%', color: '#9333EA' },
  { icon: Brain, label: 'Memory Reuse', value: '34%', sub: 'investigations used past learnings', color: '#F5A623' },
]

export default function AgentValueCard() {
  const navigate = useNavigate()

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-[#1D2433]">Agent Value</span>
        <Badge variant="secondary" className="text-[9px]">30 days</Badge>
      </div>

      <div className="flex-1 space-y-2.5">
        {METRICS.map(m => (
          <div key={m.label} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.color + '15' }}>
              <m.icon size={14} style={{ color: m.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-[#6B7280] uppercase tracking-wide">{m.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-bold text-[#1D2433]">{m.value}</span>
                {m.trend && <span className="text-[10px] font-medium text-[#00D4A0]">{m.trend}</span>}
              </div>
              {m.sub && <p className="text-[9px] text-[#6B7280] truncate">{m.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/analytics')} className="flex items-center gap-1 text-[11px] text-[#0B6ACB] font-medium hover:underline mt-3">
        View Details <ArrowRight size={10} />
      </button>
    </Card>
  )
}
