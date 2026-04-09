import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sun, Search, TrendingUp, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Brain, Shield, ExternalLink, Bell, MessageSquare,
} from 'lucide-react'
import { investigations } from '../data'

const SEVERITY_STYLES = {
  P1: 'bg-red-50 text-[#FF4D4D]',
  P2: 'bg-amber-50 text-[#F5A623]',
  P3: 'bg-blue-50 text-[#0B6ACB]',
}

const PHASE_COLORS = {
  context: 'text-[#0B6ACB]',
  hypotheses: 'text-[#F5A623]',
  rootCause: 'text-[#FF4D4D]',
}

const PHASE_LABELS = {
  context: 'Context',
  hypotheses: 'Hypotheses',
  rootCause: 'Root Cause',
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Morning Brief */}
      <motion.div
        variants={fadeUp}
        className="bg-gradient-to-r from-[#1D252C] to-[#263040] rounded-xl p-5 mb-6 text-white"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Sun size={16} className="text-[#F5A623]" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white/60">Morning Brief</span>
          <span className="text-[11px] text-white/40 ml-auto">April 9, 2026 — 9:02 AM</span>
        </div>
        <p className="text-[14px] leading-relaxed mb-3">
          While you were away — <span className="text-[#00D4A0]">3 alerts auto-resolved</span>,{' '}
          <span className="text-[#FF4D4D]">1 needs attention</span>.{' '}
          <span className="text-[#F5A623]">checkout-service SLO budget at 50%</span>.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-white/50">
          <span className="flex items-center gap-1"><Shield size={11} /> On-call: checkout-team until 9 AM</span>
          <span className="flex items-center gap-1"><MessageSquare size={11} /> 14 Slack messages in #incidents-prod</span>
          <span className="flex items-center gap-1"><Bell size={11} /> PagerDuty: 1 open, 2 ack'd</span>
        </div>
      </motion.div>

      {/* Active Investigations */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#1D2433]">Active Investigations</h2>
          <span className="text-[11px] font-medium bg-[#FF4D4D]/10 text-[#FF4D4D] px-2 py-0.5 rounded-full">
            {investigations.active.length} active
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {investigations.active.map((inv) => (
            <motion.div
              key={inv.id}
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
              onClick={() => navigate(`/investigation/${inv.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer group transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-2 h-2 rounded-full ${inv.severity === 'P1' ? 'bg-[#FF4D4D]' : 'bg-[#F5A623]'} animate-pulse`} />
                <span className="text-[13px] font-semibold text-[#1D2433]">{inv.entity}</span>
                <span className="text-[10px] bg-gray-100 text-[#6B7280] px-1.5 py-0.5 rounded font-medium">{inv.environment}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold ${SEVERITY_STYLES[inv.severity]}`}>
                  {inv.severity}
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] mb-1.5 truncate">{inv.trigger}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mb-3">
                <Clock size={11} /> {inv.elapsedTime}
                <span className="text-[#D1D5DB]">·</span>
                <span className={`font-medium ${PHASE_COLORS[inv.phase]}`}>{PHASE_LABELS[inv.phase]}</span>
                <span className="text-[#D1D5DB]">·</span>
                {inv.hypothesisCount} hypotheses
              </div>
              <p className="text-[11px] text-[#6B7280] mb-3">
                Top: "{inv.topHypothesis}" — <span className="font-semibold text-[#1D2433]">{inv.topConfidence}%</span>
              </p>
              <button className="text-[11px] text-[#0B6ACB] font-medium flex items-center gap-1 group-hover:underline">
                Open Canvas <ArrowRight size={11} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Investigations Table */}
      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="text-[15px] font-semibold text-[#1D2433] mb-3">Recent Investigations</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] text-[#6B7280] font-medium uppercase tracking-wider">
                <th className="px-4 py-2.5">Entity</th>
                <th className="px-4 py-2.5">Trigger</th>
                <th className="px-4 py-2.5">Root Cause</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Confidence</th>
                <th className="px-4 py-2.5">Memory</th>
              </tr>
            </thead>
            <tbody>
              {investigations.recent.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-50 hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                  onClick={() => navigate(`/investigation/${inv.id}`)}
                >
                  <td className="px-4 py-2.5 font-medium text-[#1D2433]">{inv.entity}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{inv.trigger}</td>
                  <td className="px-4 py-2.5 text-[#1D2433]">{inv.rootCause}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{inv.duration}</td>
                  <td className="px-4 py-2.5">
                    {inv.confidence ? (
                      <span className="font-medium text-[#00D4A0]">{inv.confidence}%</span>
                    ) : (
                      <span className="text-[#6B7280]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.memoryCreated ? (
                      <CheckCircle size={14} className="text-[#00D4A0]" />
                    ) : (
                      <span className="text-[#D1D5DB]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Stats Strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'MTTR This Week', value: '22 min', trend: '↓ 18%', good: true, icon: TrendingUp },
          { label: 'Investigations', value: '12', sub: '8 resolved · 2 active', icon: Search },
          { label: 'Memory Reuse', value: '34%', trend: '↑ 12%', good: true, icon: Brain },
          { label: 'SLO Health', value: '4/5 healthy', sub: '1 amber', icon: Shield },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={13} className="text-[#6B7280]" />
              <span className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#1D2433]">{s.value}</span>
              {s.trend && <span className={`text-[11px] font-semibold ${s.good ? 'text-[#00D4A0]' : 'text-[#FF4D4D]'}`}>{s.trend}</span>}
            </div>
            {s.sub && <p className="text-[11px] text-[#6B7280] mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </motion.div>

      {/* Getting Started Checklist */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={15} className="text-[#00D4A0]" />
          <h3 className="text-[13px] font-semibold text-[#1D2433]">Getting Started</h3>
          <span className="text-[11px] text-[#6B7280] ml-1">4/6 complete</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            { label: 'Setup complete', done: true },
            { label: 'First real investigation', done: true },
            { label: 'Review an investigation result', done: true },
            { label: 'Add feedback (thumbs up/down)', done: true },
            { label: 'Create your first memory manually', done: false, link: '/memory' },
            { label: 'Connect one more integration', done: false, link: '/integrations' },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 text-[12px] ${item.link ? 'cursor-pointer hover:text-[#0B6ACB]' : ''}`}
              onClick={() => item.link && navigate(item.link)}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                item.done ? 'bg-[#00D4A0] border-[#00D4A0]' : 'border-[#D1D5DB]'
              }`}>
                {item.done && <CheckCircle size={9} className="text-white" />}
              </div>
              <span className={item.done ? 'text-[#6B7280] line-through' : 'text-[#1D2433]'}>
                {item.label}
              </span>
              {item.link && !item.done && <ArrowRight size={11} className="text-[#6B7280] ml-auto" />}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
