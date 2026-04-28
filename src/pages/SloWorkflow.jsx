import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import InvestigationSubNav from '../components/InvestigationSubNav'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Shield, Snowflake, FileText, Ticket,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, Cell, LabelList,
} from 'recharts'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { Separator } from '../components/ui/separator'
import { scenarioA, scenarioB, scenarioC } from '../data'

const SCENARIOS = { 'inv-0892': scenarioA, 'inv-0893': scenarioB, 'inv-new': scenarioC }

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const STATUS_BORDER = { healthy: '#00D4A0', warning: '#F5A623', critical: '#FF4D4D' }
const HEATMAP_COLOR = { green: '#00D4A0', amber: '#F5A623', red: '#FF4D4D' }
const HEATMAP_LABEL = { green: 'Compliant', amber: '>50% budget consumed', red: 'SLO breached' }

function barColor(v) { return v > 10 ? '#FF4D4D' : v > 5 ? '#F5A623' : '#0B6ACB' }
function budgetBarColor(pct) { return pct > 50 ? '#00D4A0' : pct > 30 ? '#F5A623' : '#FF4D4D' }

export default function SloWorkflow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = SCENARIOS[id]

  const [barWidth, setBarWidth] = useState(0)
  const [toasts, setToasts] = useState([])

  if (!scenario) {
    return (
      <div>
        <Breadcrumbs />
        <EmptyState icon={Shield} title="Not Found" description="Investigation not found." actions={[{ label: 'Home', onClick: () => navigate('/') }]} />
      </div>
    )
  }

  const slo = scenario.slo

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(slo.budgetPercent), 100)
    return () => clearTimeout(t)
  }, [slo.budgetPercent])

  // Burn rate bar data
  const burnBars = useMemo(() => [
    { window: '1h', value: slo.burnRateWindows['1h'] },
    { window: '6h', value: slo.burnRateWindows['6h'] },
    { window: '24h', value: slo.burnRateWindows['24h'] },
    { window: '7d', value: slo.burnRateWindows['7d'] },
  ], [slo])

  // Budget consumption timeline (cumulative from heatmap)
  const budgetTimeline = useMemo(() => {
    let cumulative = 0
    return slo.heatmap.map((status, i) => {
      if (status === 'red') cumulative += 12
      else if (status === 'amber') cumulative += 5
      else cumulative += 0.5
      return { day: i + 1, consumed: Math.min(cumulative, 100) }
    })
  }, [slo])

  const showToast = (label) => {
    const tid = Date.now()
    setToasts(p => [...p, { id: tid, label }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000)
  }

  const burnColor = slo.burnRate > 10 ? '#FF4D4D' : slo.burnRate > 5 ? '#F5A623' : '#6B7280'
  const borderColor = STATUS_BORDER[slo.status] || '#00D4A0'

  return (
    <div>
      <Breadcrumbs />
      <InvestigationSubNav />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* ── Critical banner ── */}
        {slo.status === 'critical' && (
          <motion.div variants={fadeUp} className="bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#FF4D4D] shrink-0" />
            <span className="text-[13px] font-medium text-[#FF4D4D]">Immediate action required — SLO budget critical, exhausts in {slo.projectedExhaustion}</span>
          </motion.div>
        )}

        {/* ── Two-column: Overview + Burn Rate ── */}
        <div className="grid grid-cols-[1.2fr_1fr] gap-4">

          {/* SLO Overview Card */}
          <motion.div variants={fadeUp}>
            <Card className="p-5" style={{ borderLeft: `4px solid ${borderColor}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: borderColor }} />
                <span className="text-[14px] font-semibold text-[#1D2433]">{slo.name}</span>
                <Badge variant={slo.status === 'critical' ? 'destructive' : slo.status === 'warning' ? 'warning' : 'good'} className="ml-auto">
                  {slo.status}
                </Badge>
              </div>

              {/* Current vs Target */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[24px] font-bold" style={{ color: slo.gap < 0 ? '#FF4D4D' : '#00D4A0' }}>
                  {slo.current}%
                </span>
                <span className="text-[13px] text-[#6B7280]">target {slo.target}%</span>
                {slo.gap < 0 && <Badge variant="destructive">{slo.gap}%</Badge>}
              </div>

              {/* Budget bar */}
              <div className="w-full h-2.5 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${barWidth}%`, backgroundColor: budgetBarColor(slo.budgetPercent) }}
                />
              </div>
              <p className="text-[11px] text-[#6B7280] mb-4">
                {slo.budgetMinutesRemaining} min remaining of {slo.budgetMinutesTotal} min
              </p>

              <Separator className="mb-4" />

              {/* Burn rate */}
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-bold" style={{ color: burnColor }}>
                  {slo.burnRate}x
                </span>
                <span className="text-[13px] text-[#6B7280]">burn rate</span>
              </div>
              <p className="text-[11px] text-[#FF4D4D] mt-1">
                Budget exhausts in ~{slo.projectedExhaustion}
              </p>

              <Badge variant="secondary" className="mt-3">{slo.complianceWindow}</Badge>
            </Card>
          </motion.div>

          {/* Burn Rate Windows Chart */}
          <motion.div variants={fadeUp} className="space-y-4">
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Burn Rate Windows</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={burnBars} margin={{ top: 20, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="window" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} />
                  <ReferenceLine y={14.4} stroke="#FF4D4D" strokeDasharray="6 4" label={{ value: 'Fast burn', position: 'right', fontSize: 9, fill: '#FF4D4D' }} />
                  <ReferenceLine y={1} stroke="#F5A623" strokeDasharray="6 4" label={{ value: 'Slow burn', position: 'right', fontSize: 9, fill: '#F5A623' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={600}>
                    {burnBars.map((b, i) => <Cell key={i} fill={barColor(b.value)} />)}
                    <LabelList dataKey="value" position="top" fontSize={11} fontWeight={600} formatter={v => `${v}x`} />
                  </Bar>
                  <RTooltip formatter={(v) => [`${v}x`, 'Burn Rate']} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Budget Consumption */}
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Budget Consumption (30 days)</span>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={budgetTimeline} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="slo-budget-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
                  <ReferenceLine y={100} stroke="#FF4D4D" strokeDasharray="6 4" label={{ value: 'Exhausted', position: 'right', fontSize: 9, fill: '#FF4D4D' }} />
                  <Area type="stepAfter" dataKey="consumed" stroke="#FF4D4D" strokeWidth={1.5} fill="url(#slo-budget-fill)" animationDuration={600} dot={false} />
                  <RTooltip formatter={(v) => [`${v}%`, 'Budget consumed']} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* ── Historical Heatmap ── */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-semibold text-[#1D2433]">Historical SLO Compliance</span>
              <Badge variant="secondary">Last 30 days</Badge>
            </div>
            <div className="flex gap-1 flex-wrap">
              {slo.heatmap.map((status, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.15 }}
                      className="w-7 h-7 rounded cursor-pointer hover:ring-2 hover:ring-offset-1 transition-shadow"
                      style={{
                        backgroundColor: HEATMAP_COLOR[status],
                        ringColor: HEATMAP_COLOR[status],
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Day {i + 1}: {HEATMAP_LABEL[status]}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-[#6B7280]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#00D4A0]" /> Compliant</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#F5A623]" /> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FF4D4D]" /> Breached</span>
            </div>
          </Card>
        </motion.div>

        {/* ── Budget Attribution Table ── */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="p-4 pb-2">
              <span className="text-[14px] font-semibold text-[#1D2433]">Budget Attribution</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  <TableHead>Incident</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Budget Consumed</TableHead>
                  <TableHead>Root Cause</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slo.budgetAttribution.map((row, i) => (
                  <TableRow key={i} className={row.incident === 'Current' ? 'bg-[#F5A623]/5' : ''}>
                    <TableCell className="font-medium text-[#1D2433]">
                      {row.incident}
                      {row.incident === 'Current' && <Badge variant="warning" className="ml-2">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">{row.date}</TableCell>
                    <TableCell className="text-[#6B7280]">{row.duration}</TableCell>
                    <TableCell>
                      <Badge variant={row.budgetConsumed > 20 ? 'destructive' : row.budgetConsumed > 10 ? 'warning' : 'secondary'}>
                        {row.budgetConsumed}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#6B7280]">{row.rootCause}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>

        {/* ── SLO-Driven Actions ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 flex-wrap">
            {slo.burnRate > 5 && (
              <Button variant="warning" size="sm" onClick={() => showToast('Freeze Deployments')}>
                <Snowflake size={12} /> Freeze Deployments
              </Button>
            )}
            {slo.budgetPercent < 30 && (
              <Button variant="outline" size="sm" onClick={() => showToast('Budget Exception Requested')}>
                Request Additional Budget
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => showToast('Compliance Report Generated')}>
              <FileText size={12} /> Generate Compliance Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => showToast('Improvement Ticket Created')}>
              <Ticket size={12} /> Create Improvement Ticket
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Toast */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[250px]"
          >
            <CheckCircle size={14} className="text-[#00D4A0]" />
            <span className="text-[12px] font-medium text-[#1D2433]">{t.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
