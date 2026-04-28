import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const BURN_COLOR = (r) => r > 10 ? '#FF4D4D' : r > 3 ? '#F5A623' : '#6B7280'
const BUDGET_COLOR = (pct) => pct > 60 ? '#00D4A0' : pct > 30 ? '#F5A623' : '#FF4D4D'
const STATUS_VARIANT = { critical: 'destructive', warning: 'warning', healthy: 'good' }

function SloRow({ slo, onClick }) {
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setBarWidth(slo.budget), 80); return () => clearTimeout(t) }, [slo.budget])

  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#1D2433] truncate">{slo.name}</span>
          <Badge variant={STATUS_VARIANT[slo.status]} className="text-[8px] px-1 py-0">{slo.status}</Badge>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-[13px] font-bold" style={{ color: slo.current < slo.target ? '#FF4D4D' : '#00D4A0' }}>{slo.current}%</span>
          <span className="text-[9px] text-[#6B7280]">/ {slo.target}%</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${barWidth}%`, backgroundColor: BUDGET_COLOR(slo.budget) }} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[12px] font-bold" style={{ color: BURN_COLOR(slo.burn) }}>{slo.burn}x</span>
        <p className="text-[8px] text-[#6B7280]">burn</p>
      </div>
    </button>
  )
}

export default function SloOverview({ slos }) {
  const navigate = useNavigate()
  const [toastMsg, setToastMsg] = useState(null)

  const handleClick = (slo) => {
    if (slo.investigationId) navigate(`/investigation/${slo.investigationId}/slo`)
    else { setToastMsg(`Opening ${slo.name} SLO...`); setTimeout(() => setToastMsg(null), 2000) }
  }

  const breaching = slos.filter(s => s.status !== 'healthy').length

  return (
    <Card className="p-3 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={13} className="text-[#6B7280]" />
        <span className="text-[13px] font-semibold text-[#1D2433]">SLO Status</span>
        {breaching > 0 && <Badge variant="destructive" className="text-[9px]">{breaching} at risk</Badge>}
      </div>
      <div className="flex-1 space-y-0.5">
        {slos.map(slo => <SloRow key={slo.name} slo={slo} onClick={() => handleClick(slo)} />)}
      </div>
      {toastMsg && (
        <div className="mt-1 text-[9px] text-[#0B6ACB] font-medium text-center bg-[#0B6ACB]/5 rounded py-1">{toastMsg}</div>
      )}
    </Card>
  )
}
