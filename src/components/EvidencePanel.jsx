import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, ExternalLink } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceArea,
} from 'recharts'

/* ── type badges ──────────────────────────────── */
const TYPE_BADGE = {
  nrql:   'bg-[#0B6ACB]/10 text-[#0B6ACB]',
  github: 'bg-gray-800/10 text-gray-800',
  k8s:    'bg-[#326CE5]/10 text-[#326CE5]',
  slack:  'bg-[#4A154B]/10 text-[#4A154B]',
}
const TYPE_LABEL = { nrql: 'NRQL', github: 'GitHub', k8s: 'K8s', slack: 'Slack' }

/* ── code block with copy ─────────────────────── */
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // fallback: do nothing in non-HTTPS
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-[#1D252C] text-[#E5E7EB] rounded-lg p-3 text-[12px] font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        title={copied ? 'Copied!' : 'Copy query'}
      >
        {copied
          ? <Check size={12} className="text-[#00D4A0]" />
          : <Copy size={12} className="text-[#6B7280]" />
        }
      </button>
    </div>
  )
}

/* ── mini chart for NRQL evidence ─────────────── */
function MiniChart({ data, anomalyRange }) {
  if (!data || data.length === 0) return null

  return (
    <div className="mt-2 h-[120px]">
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="evidence-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval={14}
            tickFormatter={(t) => `t+${t}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          {anomalyRange && (
            <ReferenceArea
              x1={anomalyRange.start}
              x2={anomalyRange.end}
              fill="#FF4D4D"
              fillOpacity={0.06}
            />
          )}
          <Area
            type="monotone"
            dataKey="v"
            stroke="#0B6ACB"
            strokeWidth={1.5}
            fill="url(#evidence-grad)"
            animationDuration={600}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── mock GitHub diff ─────────────────────────── */
function MockDiff() {
  return (
    <div className="mt-2 bg-[#1D252C] rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
      <div className="text-[#6B7280] mb-1">src/checkout/order.py — commit abc123</div>
      <div className="text-[#FF6B6B] bg-[#FF4D4D]/10 px-2 py-0.5 rounded">
        - orders = Order.objects.select_related('order_items').filter(user=user)
      </div>
      <div className="text-[#00D4A0] bg-[#00D4A0]/10 px-2 py-0.5 rounded mt-0.5">
        + orders = Order.objects.filter(user=user)
      </div>
      <div className="text-[#6B7280] mt-1 text-[10px]">
        # Removed eager loading — each order now queries items individually
      </div>
    </div>
  )
}

/* ── mock K8s events table ────────────────────── */
function MockEvents() {
  const events = [
    { time: '03:14:22', type: 'Warning', reason: 'CertExpired', message: 'TLS certificate has expired for auth-service' },
    { time: '03:14:25', type: 'Warning', reason: 'ConnectionFailed', message: 'Failed to establish TLS handshake with auth-service:443' },
    { time: '03:15:01', type: 'Normal', reason: 'BackOff', message: 'Back-off restarting failed container auth-service-proxy' },
  ]

  return (
    <div className="mt-2 bg-[#1D252C] rounded-lg p-3 overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-[#6B7280] text-left">
            <th className="pr-3 pb-1">Time</th>
            <th className="pr-3 pb-1">Type</th>
            <th className="pr-3 pb-1">Reason</th>
            <th className="pb-1">Message</th>
          </tr>
        </thead>
        <tbody className="text-[#E5E7EB]">
          {events.map((e, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="pr-3 py-1 text-[#6B7280]">{e.time}</td>
              <td className={`pr-3 py-1 ${e.type === 'Warning' ? 'text-[#F5A623]' : 'text-[#00D4A0]'}`}>{e.type}</td>
              <td className="pr-3 py-1">{e.reason}</td>
              <td className="py-1 text-[#9CA3AF]">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── mock Slack message ───────────────────────── */
function MockSlackMessage({ evidence }) {
  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 flex gap-2">
      <div className="w-6 h-6 rounded bg-[#4A154B] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
        MT
      </div>
      <div>
        <p className="text-[12px] font-medium text-[#1D2433]">Mike T. <span className="font-normal text-[#6B7280]">in #inc-api-gateway</span></p>
        <p className="text-[12px] text-[#6B7280] leading-relaxed mt-0.5">{evidence.interpretation.slice(0, 120)}...</p>
      </div>
    </div>
  )
}

/* ── pick chart data based on evidence content ── */
function getChartData(evidence, scenario) {
  const gm = scenario.goldenMetrics
  if (!gm) return null
  const q = (evidence.query || '').toLowerCase()
  const t = (evidence.title || '').toLowerCase()

  if (t.includes('latency') || q.includes('duration') || q.includes('percentile')) return { data: gm.latency.p99, range: gm.anomalyRange }
  if (t.includes('error') || q.includes('error') || q.includes('httpresponsecode')) return { data: gm.errorRate, range: gm.anomalyRange }
  if (t.includes('throughput') || q.includes('count(*)') && q.includes('transaction')) return { data: gm.throughput, range: gm.anomalyRange }
  if (t.includes('connection') || t.includes('redis') || t.includes('query count') || t.includes('database')) {
    // Generate ascending spike data for db/connection metrics
    return {
      data: gm.saturation.cpu, // reuse CPU shape as proxy
      range: gm.anomalyRange,
    }
  }
  if (t.includes('cpu') || t.includes('memory') || t.includes('saturation')) return { data: gm.saturation.cpu, range: gm.anomalyRange }
  // Default: use throughput
  return { data: gm.throughput, range: gm.anomalyRange }
}

/* ── single evidence item ─────────────────────── */
function EvidenceItem({ evidence, scenario, index }) {
  const typeCls = TYPE_BADGE[evidence.type] || TYPE_BADGE.nrql
  const typeLabel = TYPE_LABEL[evidence.type] || evidence.type

  const chartInfo = evidence.type === 'nrql' ? getChartData(evidence, scenario) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="bg-[#F7F8FA] rounded-lg p-3"
    >
      {/* Title + type badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] font-semibold text-[#1D2433]">{evidence.title}</span>
        <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${typeCls}`}>{typeLabel}</span>
        {evidence.skill && <span className="text-[9px] text-[#9333EA]">via {evidence.skill}</span>}
      </div>

      {/* Split view */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT — Query / Source */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#6B7280] font-medium mb-1.5">Query / Source</p>
          <CodeBlock code={evidence.query} />

          {/* Type-specific visual */}
          {evidence.type === 'nrql' && chartInfo && (
            <MiniChart data={chartInfo.data} anomalyRange={chartInfo.range} />
          )}
          {evidence.type === 'github' && <MockDiff />}
          {evidence.type === 'k8s' && <MockEvents />}
          {evidence.type === 'slack' && <MockSlackMessage evidence={evidence} />}
        </div>

        {/* RIGHT — Interpretation */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#6B7280] font-medium mb-1.5">Interpretation</p>
          <p className="text-[13px] text-[#1D2433] leading-relaxed">{evidence.interpretation}</p>
          <button className="flex items-center gap-1 text-[12px] text-[#0B6ACB] font-medium mt-3 hover:underline">
            Verify yourself <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── main evidence panel ──────────────────────── */
export default function EvidencePanel({ evidences, scenario }) {
  if (!evidences || evidences.length === 0) {
    return (
      <div className="border-t border-gray-100 mt-3 pt-3">
        <p className="text-[12px] text-[#6B7280] italic">No evidence items available.</p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100 mt-3 pt-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-[#1D2433]">Evidence Chain</span>
        <span className="text-[10px] bg-gray-100 text-[#6B7280] px-1.5 py-0.5 rounded font-medium">
          {evidences.length} items
        </span>
      </div>
      <div className="space-y-2">
        {evidences.map((ev, i) => (
          <EvidenceItem key={ev.id} evidence={ev} scenario={scenario} index={i} />
        ))}
      </div>
    </div>
  )
}
