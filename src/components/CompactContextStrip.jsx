import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Shield, ArrowRight } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, ReferenceArea, Tooltip as RTooltip } from 'recharts'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

export default function CompactContextStrip({ scenario, id }) {
  const navigate = useNavigate()
  const gm = scenario.goldenMetrics
  const slo = scenario.slo
  const anomalyStart = gm.anomalyRange?.start ?? 60
  const anomalyEnd = gm.anomalyRange?.end ?? 60
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => { const t = setTimeout(() => setBarWidth(slo.budgetPercent), 100); return () => clearTimeout(t) }, [slo.budgetPercent])

  const metrics = [
    { key: 'throughput', label: 'Throughput', data: gm.throughput, unit: 'rpm', fmt: v => v },
    { key: 'errorRate', label: 'Errors', data: gm.errorRate, unit: '%', fmt: v => `${v}%`, redIf: v => v > 1 },
    { key: 'latencyP99', label: 'Latency p99', data: gm.latency.p99, unit: 'ms', fmt: v => v },
    { key: 'cpu', label: 'CPU', data: gm.saturation.cpu, unit: '%', fmt: v => `${v}%`, redIf: v => v > 80 },
  ]

  const budgetBarColor = slo.budgetPercent > 50 ? '#00D4A0' : slo.budgetPercent > 30 ? '#F5A623' : '#FF4D4D'
  const burnColor = slo.burnRate > 10 ? '#FF4D4D' : slo.burnRate > 5 ? '#F5A623' : '#6B7280'

  return (
    <Card className="p-3" id="section-context">
      <div className="flex items-center gap-4">
        {/* Golden Metrics — 4 sparklines */}
        <div className="flex-1 flex items-center gap-3">
          {metrics.map(m => {
            const latest = m.data[m.data.length - 1]?.v ?? 0
            const isRed = m.redIf?.(latest)
            const twoTone = m.data.map((d, i) => ({
              t: d.t,
              normal: i < anomalyStart ? d.v : null,
              anomaly: i >= anomalyStart ? d.v : null,
              ...(i === anomalyStart ? { normal: d.v } : {}),
            }))
            return (
              <div key={m.key} className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-[#6B7280] font-medium">{m.label}</p>
                <p className={`text-[14px] font-bold ${isRed ? 'text-[#FF4D4D]' : 'text-[#1D2433]'}`}>{m.fmt(latest)} <span className="text-[9px] font-normal text-[#6B7280]">{m.unit}</span></p>
                <div className="h-[30px] w-full">
                  <ResponsiveContainer width="100%" height={30}>
                    <AreaChart data={twoTone} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={`cs-n-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id={`cs-a-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="normal" stroke="#0B6ACB" strokeWidth={1.2} fill={`url(#cs-n-${m.key})`} dot={false} animationDuration={600} connectNulls={false} />
                      <Area type="monotone" dataKey="anomaly" stroke="#FF4D4D" strokeWidth={1.2} fill={`url(#cs-a-${m.key})`} dot={false} animationDuration={600} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
          <button onClick={() => navigate(`/investigation/${id}/golden-metrics`)} className="text-[10px] text-[#0B6ACB] font-medium hover:underline shrink-0 flex items-center gap-0.5">
            Details <ArrowRight size={9} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-14 bg-gray-200 shrink-0" />

        {/* SLO mini-badge */}
        <div className="w-[150px] shrink-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Shield size={10} className="text-[#6B7280]" />
            <span className="text-[9px] uppercase tracking-wide text-[#6B7280] font-medium">SLO</span>
            <button onClick={() => navigate(`/investigation/${id}/slo`)} className="text-[9px] text-[#0B6ACB] font-medium hover:underline ml-auto flex items-center gap-0.5">
              Details <ArrowRight size={8} />
            </button>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-bold" style={{ color: slo.gap < 0 ? '#FF4D4D' : '#00D4A0' }}>{slo.current}%</span>
            <span className="text-[9px] text-[#6B7280]">/ {slo.target}%</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, backgroundColor: budgetBarColor }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] font-semibold" style={{ color: burnColor }}>{slo.burnRate}x burn</span>
            <Badge variant={slo.status === 'critical' ? 'destructive' : slo.status === 'warning' ? 'warning' : 'good'} className="text-[8px] px-1 py-0">{slo.status}</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
