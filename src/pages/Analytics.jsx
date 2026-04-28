import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingDown, Zap, Brain, Target, CheckCircle,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip,
  Legend,
} from 'recharts'
import Breadcrumbs from '../components/Breadcrumbs'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { analytics } from '../data'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

const PIE_COLORS = { Deployment: '#0B6ACB', Configuration: '#F5A623', Capacity: '#FF4D4D', Dependency: '#9333EA', Unknown: '#6B7280' }

function MetricCard({ icon: Icon, label, value, suffix = '', trend, onClick }) {
  return (
    <Card className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} className="text-[#6B7280]" />
        <span className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-[#1D2433]">{value}{suffix}</span>
        {trend && (
          <span className={`text-[10px] font-medium ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-[#00D4A0]' : 'text-[#FF4D4D]'}`}>
            {trend}
          </span>
        )}
      </div>
    </Card>
  )
}

export default function Analytics() {
  const a = analytics
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000) }

  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-[#1D2433]">Analytics</h1>
        <Badge variant="secondary" className="text-[10px]">Last 30 days</Badge>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {/* Top metrics */}
        <motion.div variants={fadeUp} className="grid grid-cols-5 gap-3">
          <MetricCard icon={BarChart3} label="Investigations" value={a.topMetrics.totalInvestigationsMonth} trend="↑ 12%" onClick={() => navigate('/')} />
          <MetricCard icon={TrendingDown} label="MTTR" value={a.topMetrics.mttrMinutes} suffix=" min" trend="↓ 38%" onClick={() => toast('Filtering by MTTR...')} />
          <MetricCard icon={Zap} label="Auto-Resolved" value={a.topMetrics.autoResolvedPercent} suffix="%" trend="↑ 8%" onClick={() => toast('Showing auto-resolved investigations')} />
          <MetricCard icon={Target} label="Hypothesis Accuracy" value={a.topMetrics.hypothesisAccuracy} suffix="%" trend="↑ 5%" onClick={() => toast('Showing accuracy breakdown')} />
          <MetricCard icon={Brain} label="Memory Reuse" value={a.topMetrics.memoryReuseRate} suffix="%" trend="↑ 11%" onClick={() => navigate('/memory')} />
        </motion.div>

        {/* Charts 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Investigations Over Time */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Investigations Over Time</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={a.investigationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={25} />
                  <Bar dataKey="p1" stackId="a" fill="#FF4D4D" radius={[0, 0, 0, 0]} animationDuration={600} name="P1" />
                  <Bar dataKey="p2" stackId="a" fill="#F5A623" animationDuration={600} name="P2" />
                  <Bar dataKey="p3" stackId="a" fill="#0B6ACB" animationDuration={600} name="P3" />
                  <Bar dataKey="auto" stackId="a" fill="#00D4A0" radius={[4, 4, 0, 0]} animationDuration={600} name="Auto" />
                  <Legend verticalAlign="bottom" height={24} formatter={v => <span className="text-[10px] text-[#6B7280]">{v}</span>} />
                  <RTooltip />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* MTTR Trend */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">MTTR Trend</span>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={a.mttrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} domain={[0, 'auto']} />
                  <Line type="monotone" dataKey="mttr" stroke="#0B6ACB" strokeWidth={2} dot={{ r: 3, fill: '#0B6ACB' }} animationDuration={600} />
                  <RTooltip formatter={v => [`${v} min`, 'MTTR']} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Root Cause Distribution */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Root Cause Distribution</span>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={a.rootCauseDistribution} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} animationDuration={600}
                    label={({ category, percent }) => `${category} ${percent}%`} labelLine={false} fontSize={10}>
                    {a.rootCauseDistribution.map(d => <Cell key={d.category} fill={PIE_COLORS[d.category] || '#6B7280'} />)}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Top Entities */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Top Investigated Entities</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={a.topEntities.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                  <YAxis type="category" dataKey="entity" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={80} />
                  <Bar dataKey="count" fill="#0B6ACB" radius={[0, 4, 4, 0]} animationDuration={600} barSize={14} />
                  <RTooltip />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Source Distribution + Team View */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Investigation Sources</span>
              <div className="space-y-2">
                {a.sourceDistribution.map(s => (
                  <div key={s.source} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#1D2433] w-[80px] truncate">{s.source}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#0B6ACB]" style={{ width: `${s.percent}%` }} />
                    </div>
                    <span className="text-[10px] text-[#6B7280] w-[35px] text-right">{s.percent}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <span className="text-[14px] font-semibold text-[#1D2433] block mb-3">Team View</span>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Member</TableHead><TableHead>Investigations</TableHead><TableHead>Avg Duration</TableHead><TableHead>Top Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {a.teamView.map(m => (
                    <TableRow key={m.member}>
                      <TableCell className="font-medium text-[#1D2433]">{m.member}</TableCell>
                      <TableCell>{m.investigations}</TableCell>
                      <TableCell className="text-[#6B7280]">{m.avgDuration}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[9px]">{m.topAction}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </div>
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
