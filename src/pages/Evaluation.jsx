import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, TrendingUp, Target, Zap, Brain,
  BarChart3, Play, Clock, ChevronDown,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RTooltip, Cell,
} from 'recharts'
import { evaluation } from '../data'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

const SCORE_COLOR = (s) => s >= 90 ? '#00D4A0' : s >= 75 ? '#0B6ACB' : s >= 60 ? '#F5A623' : '#FF4D4D'

export default function Evaluation() {
  const [runningEval, setRunningEval] = useState(false)
  const [useCaseFilter, setUseCaseFilter] = useState('all')
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const runEvaluation = () => {
    setRunningEval(true)
    setTimeout(() => { setRunningEval(false); toast('Evaluation complete — 10 use cases tested') }, 3000)
  }

  const ev = evaluation
  const filteredCases = useCaseFilter === 'all' ? ev.useCases
    : useCaseFilter === 'pass' ? ev.useCases.filter(c => c.status === 'pass')
    : ev.useCases.filter(c => c.status === 'fail')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#1D2433]">Agent Evaluation</h1>
          <p className="text-[12px] text-[#6B7280]">Track skill and agent performance against defined use cases</p>
        </div>
        <Button size="sm" onClick={runEvaluation} disabled={runningEval}>
          {runningEval ? <><Clock size={12} className="animate-spin" /> Running...</> : <><Play size={12} /> Run Evaluation</>}
        </Button>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {/* Summary cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
          {[
            { icon: Target, label: 'Overall Score', value: `${ev.summary.overallScore}%`, color: SCORE_COLOR(ev.summary.overallScore) },
            { icon: Zap, label: 'Total Eval Runs', value: ev.summary.totalRuns },
            { icon: CheckCircle, label: 'Pass Rate', value: `${ev.summary.passRate}%`, color: '#00D4A0' },
            { icon: Brain, label: 'Avg Confidence', value: `${ev.summary.avgConfidence}%` },
          ].map(m => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon size={12} className="text-[#6B7280]" />
                <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">{m.label}</span>
              </div>
              <span className="text-[20px] font-bold" style={{ color: m.color || '#1D2433' }}>{m.value}</span>
            </Card>
          ))}
        </motion.div>

        {/* Skill Performance + Weekly Trend */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
          {/* Skill scores */}
          <Card className="p-4">
            <span className="text-[13px] font-semibold text-[#1D2433] block mb-3">Skill Performance</span>
            <div className="space-y-2">
              {ev.skillScores.map(skill => (
                <div key={skill.skill} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#1D2433] w-[130px] truncate">{skill.skill}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${skill.score}%`, backgroundColor: SCORE_COLOR(skill.score) }} />
                  </div>
                  <span className="text-[11px] font-bold w-[35px] text-right" style={{ color: SCORE_COLOR(skill.score) }}>{skill.score}%</span>
                  {/* Mini sparkline */}
                  <div className="w-[50px] h-[16px]">
                    <ResponsiveContainer width="100%" height={16}>
                      <AreaChart data={skill.trend.map((v, i) => ({ i, v }))} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                        <Area type="monotone" dataKey="v" stroke={SCORE_COLOR(skill.score)} strokeWidth={1} fill="none" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly trend */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1D2433]">Overall Score Trend</span>
              <Badge variant="secondary" className="text-[9px]">5 weeks</Badge>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ev.weeklyTrend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="eval-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B6ACB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0B6ACB" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} domain={[60, 100]} />
                <Area type="monotone" dataKey="score" stroke="#0B6ACB" strokeWidth={2} fill="url(#eval-grad)" dot={{ r: 3, fill: '#0B6ACB' }} animationDuration={600} />
                <RTooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-[#6B7280] mt-2">
              Up from <span className="font-medium text-[#1D2433]">72%</span> to <span className="font-medium text-[#00D4A0]">84%</span> — improving with each investigation
            </p>
          </Card>
        </motion.div>

        {/* Sub-Agent Scores */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <span className="text-[13px] font-semibold text-[#1D2433] block mb-3">Sub-Agent Performance</span>
            <div className="grid grid-cols-3 gap-3">
              {ev.agentScores.map(agent => (
                <div key={agent.agent} className="bg-[#F7F8FA] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-[#1D2433]">{agent.agent}</span>
                    <span className="text-[16px] font-bold" style={{ color: SCORE_COLOR(agent.score) }}>{agent.score}%</span>
                  </div>
                  <div className="h-[30px]">
                    <ResponsiveContainer width="100%" height={30}>
                      <AreaChart data={agent.trend.map((v, i) => ({ i, v }))} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                        <Area type="monotone" dataKey="v" stroke={SCORE_COLOR(agent.score)} strokeWidth={1.5} fill="none" dot={false} animationDuration={600} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-1">{agent.runs} evaluation runs</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Use Case Matrix */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1D2433]">Use Case Results</span>
              <div className="flex gap-1">
                {[
                  { key: 'all', label: `All (${ev.useCases.length})` },
                  { key: 'pass', label: `Pass (${ev.useCases.filter(c => c.status === 'pass').length})`, dot: '#00D4A0' },
                  { key: 'fail', label: `Fail (${ev.useCases.filter(c => c.status === 'fail').length})`, dot: '#FF4D4D' },
                ].map(f => (
                  <button key={f.key} onClick={() => setUseCaseFilter(f.key)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${useCaseFilter === f.key ? 'bg-[#0B6ACB]/10 text-[#0B6ACB]' : 'text-[#6B7280] hover:bg-gray-50'}`}>
                    {f.dot && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.dot }} />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {filteredCases.map(uc => (
                <div key={uc.name} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#F7F8FA]">
                  {uc.status === 'pass'
                    ? <CheckCircle size={14} className="text-[#00D4A0] shrink-0" />
                    : <XCircle size={14} className="text-[#FF4D4D] shrink-0" />}
                  <span className="text-[12px] text-[#1D2433] flex-1">{uc.name}</span>
                  <Badge variant="secondary" className="text-[9px]">{uc.skill}</Badge>
                  <span className="text-[11px] font-bold w-[35px] text-right" style={{ color: SCORE_COLOR(uc.lastScore) }}>{uc.lastScore}%</span>
                  <span className="text-[10px] text-[#6B7280] w-[50px] text-right">{uc.lastRun}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Confidence Calibration */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1D2433]">Confidence Calibration</span>
              <Badge variant="secondary" className="text-[9px]">Predicted vs Actual</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ev.confidenceCalibration} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={30} />
                <Bar dataKey="predicted" fill="#0B6ACB" radius={[4, 4, 0, 0]} barSize={18} name="Predicted" />
                <Bar dataKey="actual" fill="#00D4A0" radius={[4, 4, 0, 0]} barSize={18} name="Actual" />
                <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-[#6B7280] mt-2">
              Agent is well-calibrated — predicted confidence closely matches actual outcomes
            </p>
          </Card>
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
