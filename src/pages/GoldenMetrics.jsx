import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, GitBranch, AlertTriangle, MessageSquare,
  Camera, Download, FileText, Link2, Columns, RotateCcw, CheckCircle,
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip as RechartsTooltip,
  Legend, Brush,
} from 'recharts'
import Breadcrumbs from '../components/Breadcrumbs'
import InvestigationSubNav from '../components/InvestigationSubNav'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { scenarioA, scenarioB, scenarioC } from '../data'

const SCENARIOS = { 'inv-0892': scenarioA, 'inv-0893': scenarioB, 'inv-new': scenarioC }

const ANNOTATIONS = {
  'inv-0892': [
    { chart: 'latency', t: 25, text: 'p99 increased 340% at deployment v2.4.1', color: '#FF4D4D' },
    { chart: 'throughput', t: 30, text: 'Throughput dip correlates with error spike', color: '#0B6ACB' },
    { chart: 'saturation', t: 32, text: 'CPU at 94% — matches DB query volume spike', color: '#FF4D4D' },
  ],
  'inv-0893': [
    { chart: 'errorRate', t: 10, text: '5xx errors jumped to 12% at cert expiry', color: '#FF4D4D' },
    { chart: 'latency', t: 10, text: 'p99 timeout at 5000ms — TLS handshake failing', color: '#FF4D4D' },
  ],
  'inv-new': [
    { chart: 'errorRate', t: 30, text: 'Error spike from Redis pool exhaustion', color: '#FF4D4D' },
    { chart: 'saturation', t: 30, text: 'CPU spike driven by connection retry storm', color: '#FF4D4D' },
  ],
}

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

/* ── peer data generator ──────────────────────── */
function generatePeerData(data, anomalyRange) {
  const preVal = data[Math.max(0, anomalyRange.start - 1)]?.v || data[0]?.v || 0
  return data.map((point, i) => {
    const inAnomaly = i >= anomalyRange.start && i <= anomalyRange.end
    const base = inAnomaly ? preVal : point.v
    const jitter = base * (0.97 + Math.random() * 0.06)
    return { t: point.t, v: Math.round(jitter * 100) / 100 }
  })
}

/* ── custom tooltip ───────────────────────────── */
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-lg px-3 py-2 text-[11px]">
      <p className="text-[#6B7280] mb-1">t+{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.stroke || p.color }}>
          {p.name || p.dataKey}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}{unit || ''}
        </p>
      ))}
    </div>
  )
}

/* ── clickable annotation ─────────────────────── */
function AnnotationCallout({ text, color, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onClick}
          className="absolute bottom-2 right-2 max-w-[200px] bg-white rounded-lg border border-gray-100 shadow-sm p-2 text-[11px] text-[#1D2433] flex flex-col gap-1 z-10 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
            <span>{text}</span>
          </div>
          <span className="text-[10px] text-[#0B6ACB] hover:underline ml-3">→ View hypothesis</span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>Click to view related hypothesis on canvas</TooltipContent>
    </Tooltip>
  )
}

/* ── shared chart config ──────────────────────── */
function SharedAxes({ brushRange, onBrushChange }) {
  return { brushRange, onBrushChange }
}

/* ── single area chart (reusable for compare) ─── */
function SingleAreaChart({ data, stroke, gradientId, gradientColor, unit, height, anomaly, showAnomaly, markers, showDeploy, brushRange, onBrushChange, showBrush }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity={0.12} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} interval={14} tickFormatter={t => `t+${t}`} />
        <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false} width={35} />
        {showAnomaly && anomaly && <ReferenceArea x1={anomaly.start} x2={anomaly.end} fill="#FF4D4D" fillOpacity={0.06} />}
        {showDeploy && markers?.map((m, i) => <ReferenceLine key={i} x={m.t} stroke="#0B6ACB" strokeDasharray="4 4" label={{ value: m.label, position: 'top', fontSize: 8, fill: '#0B6ACB' }} />)}
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} fill={`url(#${gradientId})`} animationDuration={600} dot={false} />
        <RechartsTooltip content={<ChartTooltip unit={unit} />} />
        {showBrush && <Brush dataKey="t" height={18} stroke="#0B6ACB" fill="#0B6ACB" fillOpacity={0.05} startIndex={brushRange.startIndex} endIndex={brushRange.endIndex} onChange={onBrushChange} />}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── main page ────────────────────────────────── */
export default function GoldenMetrics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = SCENARIOS[id]

  const [timeRange, setTimeRange] = useState('1h')
  const [showDeploy, setShowDeploy] = useState(true)
  const [showAnomaly, setShowAnomaly] = useState(true)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [brushRange, setBrushRange] = useState({ startIndex: 0, endIndex: 59 })
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000) }

  const onBrushChange = useCallback((range) => {
    if (range) setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })
  }, [])

  const resetZoom = () => setBrushRange({ startIndex: 0, endIndex: 59 })
  const isZoomed = brushRange.startIndex !== 0 || brushRange.endIndex !== 59

  if (!scenario) {
    return (
      <div>
        <Breadcrumbs />
        <EmptyState icon={AlertTriangle} title="Not Found" description="This investigation doesn't exist." actions={[{ label: 'Back to Home', onClick: () => navigate('/') }]} />
      </div>
    )
  }

  const gm = scenario.goldenMetrics
  const anomaly = gm.anomalyRange
  const markers = gm.deploymentMarkers || []
  const annotations = ANNOTATIONS[id] || []

  const latestTP = gm.throughput[gm.throughput.length - 1]?.v || 0
  const latestER = gm.errorRate[gm.errorRate.length - 1]?.v || 0
  const latestP99 = gm.latency.p99[gm.latency.p99.length - 1]?.v || 0
  const latestCPU = gm.saturation.cpu[gm.saturation.cpu.length - 1]?.v || 0

  // Peer data (memoized, stable)
  const peerTP = useMemo(() => generatePeerData(gm.throughput, anomaly), [gm, anomaly])
  const peerER = useMemo(() => generatePeerData(gm.errorRate, anomaly), [gm, anomaly])

  const latencyData = useMemo(() => gm.latency.p50.map((_, i) => ({
    t: i, p50: gm.latency.p50[i].v, p95: gm.latency.p95[i].v, p99: gm.latency.p99[i].v,
  })), [gm])

  const peerLatencyData = useMemo(() => {
    const peerP99 = generatePeerData(gm.latency.p99, anomaly)
    return gm.latency.p50.map((_, i) => ({
      t: i, p50: gm.latency.p50[i].v, p95: gm.latency.p95[i].v, p99: peerP99[i].v,
    }))
  }, [gm, anomaly])

  const saturationData = useMemo(() => gm.saturation.cpu.map((_, i) => ({
    t: i, cpu: gm.saturation.cpu[i].v, memory: gm.saturation.memory[i].v,
  })), [gm])

  const peerSatData = useMemo(() => {
    const peerCPU = generatePeerData(gm.saturation.cpu, anomaly)
    return gm.saturation.cpu.map((_, i) => ({
      t: i, cpu: peerCPU[i].v, memory: gm.saturation.memory[i].v,
    }))
  }, [gm, anomaly])

  const getAnnotation = (chart) => annotations.find(a => a.chart === chart)
  const goToCanvas = () => navigate(`/investigation/${id}`)

  const chartH = compareMode ? 160 : 220
  const entity = scenario.entity
  const peerEntity = `${entity}-us-west-2`

  return (
    <div>
      <Breadcrumbs />
      <InvestigationSubNav />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {/* ── Controls Bar ── */}
        <motion.div variants={fadeUp}>
          <Card className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Tabs value={timeRange} onValueChange={setTimeRange}>
                  <TabsList>
                    {['15m', '1h', '6h', '24h', '7d', 'Custom'].map(r => (
                      <TabsTrigger key={r} value={r} className="text-[11px] px-2.5">{r}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={() => toast('Incident window highlighted on charts')}><Clock size={12} /> Incident Window</Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant={showDeploy ? 'default' : 'outline'} size="sm" onClick={() => setShowDeploy(d => !d)}>
                  <GitBranch size={12} /> Deployments
                </Button>
                <Button variant={showAnomaly ? 'default' : 'outline'} size="sm" onClick={() => setShowAnomaly(a => !a)}>
                  <AlertTriangle size={12} /> Anomaly
                </Button>
                <Button variant={showAnnotations ? 'default' : 'outline'} size="sm" onClick={() => setShowAnnotations(a => !a)}>
                  <MessageSquare size={12} /> Annotations
                </Button>
                <Button variant={compareMode ? 'default' : 'outline'} size="sm" onClick={() => setCompareMode(c => !c)}>
                  <Columns size={12} /> Compare
                </Button>
                {isZoomed && (
                  <Button variant="outline" size="sm" onClick={resetZoom}>
                    <RotateCcw size={12} /> Reset Zoom
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── 2x2 Chart Grid ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Q1: Throughput */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-[#1D2433]">Throughput</span>
                <Badge variant="secondary">{latestTP} rpm</Badge>
              </div>
              <AnimatePresence mode="wait">
                {compareMode ? (
                  <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />Affected: {entity}</p>
                      <SingleAreaChart data={gm.throughput} stroke="#0B6ACB" gradientId="tp-a" gradientColor="#0B6ACB" unit=" rpm" height={chartH} anomaly={anomaly} showAnomaly={showAnomaly} markers={markers} showDeploy={showDeploy} brushRange={brushRange} onBrushChange={onBrushChange} showBrush />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]" />Peer: {peerEntity}</p>
                      <SingleAreaChart data={peerTP} stroke="#00D4A0" gradientId="tp-p" gradientColor="#00D4A0" unit=" rpm" height={chartH} anomaly={null} showAnomaly={false} markers={[]} showDeploy={false} brushRange={brushRange} onBrushChange={onBrushChange} showBrush={false} />
                    </div>
                    <p className="col-span-2 text-[10px] text-[#FF4D4D] text-center">Divergence began at t+{anomaly.start}</p>
                  </motion.div>
                ) : (
                  <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SingleAreaChart data={gm.throughput} stroke="#0B6ACB" gradientId="gm-tp-fill" gradientColor="#0B6ACB" unit=" rpm" height={chartH} anomaly={anomaly} showAnomaly={showAnomaly} markers={markers} showDeploy={showDeploy} brushRange={brushRange} onBrushChange={onBrushChange} showBrush />
                  </motion.div>
                )}
              </AnimatePresence>
              {showAnnotations && !compareMode && getAnnotation('throughput') && <AnnotationCallout {...getAnnotation('throughput')} onClick={goToCanvas} />}
            </Card>
          </motion.div>

          {/* Q2: Error Rate */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-[#1D2433]">Error Rate</span>
                <Badge variant={latestER > 1 ? 'destructive' : 'good'}>{latestER}%</Badge>
              </div>
              <AnimatePresence mode="wait">
                {compareMode ? (
                  <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />Affected: {entity}</p>
                      <SingleAreaChart data={gm.errorRate} stroke="#FF4D4D" gradientId="er-a" gradientColor="#FF4D4D" unit="%" height={chartH} anomaly={anomaly} showAnomaly={showAnomaly} markers={[]} showDeploy={false} brushRange={brushRange} onBrushChange={onBrushChange} showBrush />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]" />Peer: {peerEntity}</p>
                      <SingleAreaChart data={peerER} stroke="#00D4A0" gradientId="er-p" gradientColor="#00D4A0" unit="%" height={chartH} anomaly={null} showAnomaly={false} markers={[]} showDeploy={false} brushRange={brushRange} onBrushChange={onBrushChange} showBrush={false} />
                    </div>
                    <p className="col-span-2 text-[10px] text-[#FF4D4D] text-center">Divergence began at t+{anomaly.start}</p>
                  </motion.div>
                ) : (
                  <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SingleAreaChart data={gm.errorRate} stroke="#FF4D4D" gradientId="gm-er-fill" gradientColor="#FF4D4D" unit="%" height={chartH} anomaly={anomaly} showAnomaly={showAnomaly} markers={[]} showDeploy={false} brushRange={brushRange} onBrushChange={onBrushChange} showBrush />
                  </motion.div>
                )}
              </AnimatePresence>
              {showAnnotations && !compareMode && getAnnotation('errorRate') && <AnnotationCallout {...getAnnotation('errorRate')} onClick={goToCanvas} />}
            </Card>
          </motion.div>

          {/* Q3: Latency */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-[#1D2433]">Latency</span>
                <Badge variant={latestP99 > 1000 ? 'destructive' : 'secondary'}>p99: {latestP99}ms</Badge>
              </div>
              <AnimatePresence mode="wait">
                {compareMode ? (
                  <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />Affected: {entity}</p>
                      <ResponsiveContainer width="100%" height={chartH}>
                        <LineChart data={latencyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} interval={14} tickFormatter={t => `t+${t}`} />
                          <YAxis tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} axisLine={false} width={35} />
                          {showAnomaly && anomaly && <ReferenceArea x1={anomaly.start} x2={anomaly.end} fill="#FF4D4D" fillOpacity={0.06} />}
                          <Line type="monotone" dataKey="p99" stroke="#FF4D4D" strokeWidth={2} dot={false} animationDuration={600} />
                          <Line type="monotone" dataKey="p50" stroke="#0B6ACB" strokeWidth={1} dot={false} animationDuration={600} />
                          <RechartsTooltip content={<ChartTooltip unit="ms" />} />
                          <Brush dataKey="t" height={16} stroke="#0B6ACB" fill="#0B6ACB" fillOpacity={0.05} startIndex={brushRange.startIndex} endIndex={brushRange.endIndex} onChange={onBrushChange} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]" />Peer: {peerEntity}</p>
                      <ResponsiveContainer width="100%" height={chartH}>
                        <LineChart data={peerLatencyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} interval={14} tickFormatter={t => `t+${t}`} />
                          <YAxis tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} axisLine={false} width={35} />
                          <Line type="monotone" dataKey="p99" stroke="#00D4A0" strokeWidth={2} dot={false} animationDuration={600} />
                          <Line type="monotone" dataKey="p50" stroke="#0B6ACB" strokeWidth={1} dot={false} animationDuration={600} />
                          <RechartsTooltip content={<ChartTooltip unit="ms" />} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="col-span-2 text-[10px] text-[#FF4D4D] text-center">Divergence began at t+{anomaly.start}</p>
                  </motion.div>
                ) : (
                  <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={chartH}>
                      <LineChart data={latencyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} interval={14} tickFormatter={t => `t+${t}`} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={45} />
                        {showAnomaly && anomaly && <ReferenceArea x1={anomaly.start} x2={anomaly.end} fill="#FF4D4D" fillOpacity={0.06} />}
                        {showDeploy && markers.map((m, i) => <ReferenceLine key={i} x={m.t} stroke="#0B6ACB" strokeDasharray="4 4" label={{ value: m.label, position: 'top', fontSize: 9, fill: '#0B6ACB' }} />)}
                        <Line type="monotone" dataKey="p50" stroke="#0B6ACB" strokeWidth={1.5} dot={false} animationDuration={600} />
                        <Line type="monotone" dataKey="p95" stroke="#F5A623" strokeWidth={1.5} strokeDasharray="4 4" dot={false} animationDuration={600} />
                        <Line type="monotone" dataKey="p99" stroke="#FF4D4D" strokeWidth={2} dot={false} animationDuration={600} />
                        <Legend verticalAlign="bottom" height={24} formatter={(v) => <span className="text-[10px] text-[#6B7280]">{v === 'p50' ? 'p50 (solid)' : v === 'p95' ? 'p95 (dashed)' : 'p99 (bold)'}</span>} />
                        <RechartsTooltip content={<ChartTooltip unit="ms" />} />
                        <Brush dataKey="t" height={18} stroke="#0B6ACB" fill="#0B6ACB" fillOpacity={0.05} startIndex={brushRange.startIndex} endIndex={brushRange.endIndex} onChange={onBrushChange} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
              {showAnnotations && !compareMode && getAnnotation('latency') && <AnnotationCallout {...getAnnotation('latency')} onClick={goToCanvas} />}
            </Card>
          </motion.div>

          {/* Q4: Saturation */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-[#1D2433]">Saturation</span>
                <Badge variant={latestCPU > 80 ? 'destructive' : latestCPU > 60 ? 'warning' : 'secondary'}>CPU: {latestCPU}%</Badge>
              </div>
              <AnimatePresence mode="wait">
                {compareMode ? (
                  <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />Affected: {entity}</p>
                      <ResponsiveContainer width="100%" height={chartH}>
                        <LineChart data={saturationData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} interval={14} tickFormatter={t => `t+${t}`} />
                          <YAxis tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
                          {showAnomaly && anomaly && <ReferenceArea x1={anomaly.start} x2={anomaly.end} fill="#FF4D4D" fillOpacity={0.06} />}
                          <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="6 4" />
                          <ReferenceLine y={90} stroke="#FF4D4D" strokeDasharray="6 4" />
                          <Line type="monotone" dataKey="cpu" stroke="#FF4D4D" strokeWidth={2} dot={false} animationDuration={600} />
                          <Line type="monotone" dataKey="memory" stroke="#0B6ACB" strokeWidth={1.5} dot={false} animationDuration={600} />
                          <RechartsTooltip content={<ChartTooltip unit="%" />} />
                          <Brush dataKey="t" height={16} stroke="#0B6ACB" fill="#0B6ACB" fillOpacity={0.05} startIndex={brushRange.startIndex} endIndex={brushRange.endIndex} onChange={onBrushChange} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]" />Peer: {peerEntity}</p>
                      <ResponsiveContainer width="100%" height={chartH}>
                        <LineChart data={peerSatData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} interval={14} tickFormatter={t => `t+${t}`} />
                          <YAxis tick={{ fontSize: 8, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
                          <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="6 4" />
                          <ReferenceLine y={90} stroke="#FF4D4D" strokeDasharray="6 4" />
                          <Line type="monotone" dataKey="cpu" stroke="#00D4A0" strokeWidth={2} dot={false} animationDuration={600} />
                          <Line type="monotone" dataKey="memory" stroke="#0B6ACB" strokeWidth={1.5} dot={false} animationDuration={600} />
                          <RechartsTooltip content={<ChartTooltip unit="%" />} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="col-span-2 text-[10px] text-[#FF4D4D] text-center">Divergence began at t+{anomaly.start}</p>
                  </motion.div>
                ) : (
                  <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={chartH}>
                      <LineChart data={saturationData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} interval={14} tickFormatter={t => `t+${t}`} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={35} domain={[0, 100]} />
                        {showAnomaly && anomaly && <ReferenceArea x1={anomaly.start} x2={anomaly.end} fill="#FF4D4D" fillOpacity={0.06} />}
                        <ReferenceLine y={70} stroke="#F5A623" strokeDasharray="6 4" label={{ value: '70% warn', position: 'right', fontSize: 9, fill: '#F5A623' }} />
                        <ReferenceLine y={90} stroke="#FF4D4D" strokeDasharray="6 4" label={{ value: '90% crit', position: 'right', fontSize: 9, fill: '#FF4D4D' }} />
                        <Line type="monotone" dataKey="cpu" stroke="#FF4D4D" strokeWidth={2} dot={false} animationDuration={600} name="CPU" />
                        <Line type="monotone" dataKey="memory" stroke="#0B6ACB" strokeWidth={1.5} dot={false} animationDuration={600} name="Memory" />
                        <Legend verticalAlign="bottom" height={24} formatter={(v) => <span className="text-[10px] text-[#6B7280]">{v}</span>} />
                        <RechartsTooltip content={<ChartTooltip unit="%" />} />
                        <Brush dataKey="t" height={18} stroke="#0B6ACB" fill="#0B6ACB" fillOpacity={0.05} startIndex={brushRange.startIndex} endIndex={brushRange.endIndex} onChange={onBrushChange} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
              {showAnnotations && !compareMode && getAnnotation('saturation') && <AnnotationCallout {...getAnnotation('saturation')} onClick={goToCanvas} />}
            </Card>
          </motion.div>
        </div>

        {/* ── Export Row ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast('Screenshot captured')}><Camera size={12} /> Screenshot</Button>
            <Button variant="outline" size="sm" onClick={() => toast('CSV exported')}><Download size={12} /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => toast('Added to Post-Mortem')}><FileText size={12} /> Add to Post-Mortem</Button>
            <Button variant="outline" size="sm" onClick={() => toast('Link copied to clipboard')}><Link2 size={12} /> Share Link</Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[220px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
