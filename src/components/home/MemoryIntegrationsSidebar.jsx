import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Plug, ArrowRight, AlertCircle } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

export default function MemoryIntegrationsSidebar({ memoryStats, integrationHealth }) {
  const navigate = useNavigate()

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Memory Card */}
      <Card className="p-3 flex-1">
        <div className="flex items-center gap-2 mb-2.5">
          <Brain size={13} className="text-[#9333EA]" />
          <span className="text-[12px] font-semibold text-[#1D2433]">Agent Memory</span>
          <Badge variant="secondary" className="text-[9px]">{memoryStats.total}</Badge>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Personal</span>
            <span className="font-medium text-[#1D2433]">{memoryStats.personal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Team</span>
            <span className="font-medium text-[#1D2433]">{memoryStats.team}</span>
          </div>
          {memoryStats.pendingApprovals > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#F5A623]">
                <AlertCircle size={10} /> Pending review
              </span>
              <Button variant="outline" size="sm" className="text-[9px] h-5 px-1.5" onClick={() => navigate('/memory')}>
                {memoryStats.pendingApprovals} to review
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="mb-2">
          <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-1">Most recent</p>
          <p className="text-[10px] text-[#1D2433] truncate">{memoryStats.recentTitle}</p>
          <p className="text-[9px] text-[#6B7280]">{memoryStats.recentConfidence}% confidence</p>
        </div>

        <button onClick={() => navigate('/memory')} className="flex items-center gap-1 text-[10px] text-[#0B6ACB] font-medium hover:underline">
          Explore Memory <ArrowRight size={9} />
        </button>
      </Card>

      {/* Integrations Card */}
      <Card className="p-3 flex-1">
        <div className="flex items-center gap-2 mb-2.5">
          <Plug size={13} className="text-[#0B6ACB]" />
          <span className="text-[12px] font-semibold text-[#1D2433]">Integrations</span>
          <Badge variant="good" className="text-[9px]">{integrationHealth.connected}/{integrationHealth.total}</Badge>
        </div>

        <div className="space-y-1.5">
          {integrationHealth.topUsed.slice(0, 3).map(item => (
            <IntegrationBar key={item.name} name={item.name} percent={item.usagePercent} />
          ))}
        </div>

        {integrationHealth.errorRate !== '0%' && (
          <p className="text-[10px] text-[#F5A623] mt-2 flex items-center gap-1">
            <AlertCircle size={9} /> {integrationHealth.errorRate} error rate
          </p>
        )}

        <Separator className="my-2" />

        <button onClick={() => navigate('/integrations')} className="flex items-center gap-1 text-[10px] text-[#0B6ACB] font-medium hover:underline">
          Manage <ArrowRight size={9} />
        </button>
      </Card>
    </div>
  )
}

function IntegrationBar({ name, percent }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth(percent), 100); return () => clearTimeout(t) }, [percent])

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#1D2433] w-[70px] truncate">{name}</span>
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-600 ease-out bg-[#0B6ACB]" style={{ width: `${width}%` }} />
      </div>
      <span className="text-[9px] text-[#6B7280] w-[28px] text-right">{percent}%</span>
    </div>
  )
}
