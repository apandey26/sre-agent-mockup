import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Shield, GitBranch, MessageSquare, Clock,
  ChevronDown, CheckCircle, Radio, ArrowRight,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, ReferenceArea, Tooltip as RTooltip,
} from 'recharts'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

/* ── avatar helper ── */
function Avatar({ name, size = 24 }) {
  const isAI = name === 'SRE Agent'
  const initials = isAI ? 'AI' : name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const colors = {
    S: '#0B6ACB', M: '#9333EA', P: '#00D4A0', A: '#F5A623',
  }
  const bg = isAI ? '#0B6ACB' : (colors[initials[0]] || '#6B7280')
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

/* ═══════ Card 2a: Golden Metrics Strip ═══════ */
function GoldenMetricsStrip({ scenario, id }) {
  const navigate = useNavigate()
  const gm = scenario.goldenMetrics
  const anomaly = gm.anomalyRange

  const metrics = [
    { key: 'throughput', label: 'Throughput', data: gm.throughput, unit: 'rpm', fmt: v => `${v}` },
    { key: 'errorRate', label: 'Error Rate', data: gm.errorRate, unit: '%', fmt: v => `${v}%`,
      color: v => v > 1 ? '#FF4D4D' : v < 0.1 ? '#00D4A0' : '#1D2433' },
    { key: 'latencyP99', label: 'Latency p99', data: gm.latency.p99, unit: 'ms', fmt: v => `${v}` },
    { key: 'cpu', label: 'Saturation (CPU)', data: gm.saturation.cpu, unit: '%', fmt: v => `${v}%` },
  ]

  // Split data into normal + anomaly segments for two-tone effect
  const anomalyStart = gm.anomalyRange?.start ?? 60
  const anomalyEnd = gm.anomalyRange?.end ?? 60

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={13} className="text-[#6B7280]" />
          <span className="text-[13px] font-semibold text-[#1D2433]">Golden Metrics</span>
        </div>
        <button
          onClick={() => navigate(`/investigation/${id}/golden-metrics`)}
          className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-0.5 hover:underline"
        >
          View full <ArrowRight size={10} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3 flex-1">
        {metrics.map((m) => {
          const latest = m.data[m.data.length - 1]?.v ?? 0
          const baseline = m.data[Math.max(0, anomalyStart - 1)]?.v ?? latest
          const isAnomaly = latest > baseline * 1.2 || latest < baseline * 0.8
          const recovered = !isAnomaly && anomalyEnd < m.data.length - 2
          const valColor = m.color ? m.color(latest) : (recovered ? '#00D4A0' : isAnomaly ? '#FF4D4D' : '#1D2433')
          const trendUp = latest > baseline
          const trendPct = baseline ? Math.abs(Math.round(((latest - baseline) / baseline) * 100)) : 0

          // Two-tone data: add 'normal' and 'anomaly' fields
          const twoTone = m.data.map((d, i) => ({
            t: d.t,
            normal: i < anomalyStart ? d.v : null,
            anomaly: i >= anomalyStart ? d.v : null,
            // bridge point so lines connect
            ...(i === anomalyStart ? { normal: d.v } : {}),
          }))

          return (
            <div key={m.key} className="flex flex-col">
              <p className="text-[10px] uppercase tracking-wide text-[#6B7280] font-medium mb-0.5">{m.label}</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[16px] font-bold" style={{ color: valColor }}>
                  {m.fmt(latest)}
                </span>
                <span className="text-[10px] font-normal text-[#6B7280]">{m.unit}</span>
                {trendPct > 5 && (
                  <span className={`text-[9px] font-semibold ${trendUp ? 'text-[#FF4D4D]' : 'text-[#00D4A0]'}`}>
                    {trendUp ? '↑' : '↓'}{trendPct}%
                  </span>
                )}
              </div>
              <div className="h-[50px] w-full flex-1">
                <ResponsiveContainer width="100%" height={50}>
                  <AreaChart data={twoTone} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-n-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id={`grad-a-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <ReferenceArea x1={anomalyStart} x2={anomalyEnd} fill="#FF4D4D" fillOpacity={0.04} />
                    <Area type="monotone" dataKey="normal" stroke="#0B6ACB" strokeWidth={1.5} fill={`url(#grad-n-${m.key})`} animationDuration={800} dot={false} connectNulls={false} />
                    <Area type="monotone" dataKey="anomaly" stroke="#FF4D4D" strokeWidth={1.5} fill={`url(#grad-a-${m.key})`} animationDuration={800} dot={false} connectNulls={false} />
                    <RTooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-white rounded border shadow-sm px-2 py-1 text-[10px]">
                        <span className="font-medium">{payload[0]?.value ?? payload[1]?.value}{m.unit}</span>
                      </div>
                    ) : null} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ═══════ Card 2b: SLO Impact Card ═══════ */
function SLOImpactCard({ scenario, id }) {
  const navigate = useNavigate()
  const slo = scenario.slo
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(slo.budgetPercent), 100)
    return () => clearTimeout(timer)
  }, [slo.budgetPercent])

  const statusColor = slo.status === 'critical' ? '#FF4D4D' : slo.status === 'warning' ? '#F5A623' : '#00D4A0'
  const burnColor = slo.burnRate > 10 ? '#FF4D4D' : slo.burnRate > 5 ? '#F5A623' : '#6B7280'
  const barColor = slo.budgetPercent > 50 ? '#00D4A0' : slo.budgetPercent > 30 ? '#F5A623' : '#FF4D4D'

  return (
    <Card className="p-4 flex flex-col w-full" style={{ borderLeftWidth: 3, borderLeftColor: statusColor }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Shield size={13} className="text-[#6B7280]" />
          <span className="text-[13px] font-semibold text-[#1D2433]">SLO Impact</span>
        </div>
        <button
          onClick={() => navigate(`/investigation/${id}/slo`)}
          className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-0.5 hover:underline"
        >
          View SLO <ArrowRight size={10} />
        </button>
      </div>

      <p className="text-[12px] text-[#6B7280] mb-2">{slo.name}</p>

      {/* Current vs Target */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[20px] font-bold" style={{ color: slo.gap < 0 ? '#FF4D4D' : '#00D4A0' }}>
          {slo.current}%
        </span>
        <span className="text-[12px] text-[#6B7280]">target {slo.target}%</span>
        {slo.gap < 0 && (
          <span className="text-[10px] bg-[#FF4D4D]/10 text-[#FF4D4D] px-1.5 py-0.5 rounded font-medium">
            {slo.gap}%
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-[11px] text-[#6B7280] mb-3">
        {slo.budgetMinutesRemaining} min remaining of {slo.budgetMinutesTotal} min
      </p>

      {/* Burn rate */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-bold" style={{ color: burnColor }}>
          Burn rate: {slo.burnRate}x
        </span>
      </div>
      <p className="text-[11px] mt-0.5" style={{ color: '#FF4D4D' }}>
        Budget exhausts in ~{slo.projectedExhaustion}
      </p>
    </Card>
  )
}

/* ═══════ Card 2c: Recent Changes Timeline ═══════ */
function RecentChanges({ scenario }) {
  const changes = scenario.recentChanges || []
  const typeStyle = {
    deployment:    { color: '#0B6ACB', label: 'Deploy' },
    change_record: { color: '#F5A623', label: 'Change' },
    pr_merge:      { color: '#9333EA', label: 'PR Merge' },
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2">
      <div className="flex items-center gap-1.5 mb-3">
        <GitBranch size={13} className="text-[#6B7280]" />
        <span className="text-[13px] font-semibold text-[#1D2433]">Recent Changes</span>
      </div>

      {changes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-[#6B7280] italic">
          <CheckCircle size={14} className="text-[#00D4A0]" />
          No recent changes detected — rules out deployment as cause
        </div>
      ) : (
        <div className="relative">
          {/* horizontal line */}
          <div className="absolute top-[6px] left-0 right-0 h-[2px] bg-gray-200" />
          <div className="flex justify-between relative">
            {changes.map((c, i) => {
              const style = typeStyle[c.type] || typeStyle.deployment
              return (
                <div key={i} className="flex flex-col items-center text-center max-w-[180px]">
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white relative z-10 shrink-0"
                    style={{ backgroundColor: style.color }}
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1.5">{c.time}</p>
                  <p className="text-[12px] font-semibold text-[#1D2433] mt-0.5 leading-snug">{c.title}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{c.detail}</p>
                  <span className="text-[10px] bg-gray-100 text-[#6B7280] rounded px-1.5 py-[1px] font-medium mt-1">
                    {c.source}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════ Card 2d: Slack Context ═══════ */
function SlackContext({ scenario }) {
  const [expanded, setExpanded] = useState(false)
  const messages = scenario.slackContext || []
  const INITIAL = 3
  const visible = expanded ? messages : messages.slice(0, INITIAL)
  const hasMore = messages.length > INITIAL

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare size={13} className="text-[#6B7280]" />
        <span className="text-[13px] font-semibold text-[#1D2433]">Slack Context</span>
        <span className="text-[10px] bg-gray-100 text-[#6B7280] px-1.5 py-0.5 rounded font-medium">
          {messages.length} messages
        </span>
      </div>
      <div className="space-y-2.5">
        {visible.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <Avatar name={msg.author} size={24} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#1D2433]">{msg.author}</span>
                <span className="text-[10px] text-[#6B7280]">{msg.time}</span>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[12px] text-[#0B6ACB] font-medium mt-2 hover:underline"
        >
          {expanded ? 'Show less' : `Show ${messages.length - INITIAL} more messages`}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

/* ═══════ Card 2e: On-Call Info ═══════ */
function OnCallInfo({ scenario, id }) {
  const isA = id === 'inv-0892'
  const name = isA ? 'Sarah K.' : 'Mike T.'
  const team = isA ? 'checkout-team-oncall' : 'platform-team-oncall'
  const ackTime = isA ? '14:44' : '03:18'
  const hasWarRoom = !isA

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Shield size={13} className="text-[#6B7280]" />
        <span className="text-[13px] font-semibold text-[#1D2433]">On-Call</span>
      </div>
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar name={name} size={28} />
        <div>
          <p className="text-[13px] font-medium text-[#1D2433]">{name}</p>
          <p className="text-[11px] text-[#6B7280]">{team}</p>
        </div>
      </div>
      <p className="text-[12px] text-[#00D4A0] flex items-center gap-1">
        <CheckCircle size={12} /> Acknowledged at {ackTime}
      </p>
      {hasWarRoom && (
        <div className="flex items-center gap-1.5 mt-2">
          <Radio size={12} className="text-[#F5A623]" />
          <span className="text-[11px] font-medium text-[#F5A623]">War Room active</span>
        </div>
      )}
    </div>
  )
}

/* ═══════ Main ContextPanel ═══════ */
export default function ContextPanel({ scenario, id }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 items-stretch"
    >
      <motion.div variants={fadeUp} className="flex">
        <GoldenMetricsStrip scenario={scenario} id={id} />
      </motion.div>
      <motion.div variants={fadeUp} className="flex">
        <SLOImpactCard scenario={scenario} id={id} />
      </motion.div>
      <motion.div variants={fadeUp} className="col-span-2">
        <RecentChanges scenario={scenario} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <SlackContext scenario={scenario} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <OnCallInfo scenario={scenario} id={id} />
      </motion.div>
    </motion.div>
  )
}
