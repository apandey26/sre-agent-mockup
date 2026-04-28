import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ArrowRight, AlertTriangle, CheckCircle, Clock, Shield,
  Users, DollarSign, MessageSquare, Brain, ExternalLink,
  ChevronDown, Minimize2, Maximize2,
} from 'lucide-react'
import { scenarioA, scenarioB, scenarioC } from '../data'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

const SCENARIOS = { 'inv-0892': scenarioA, 'inv-0893': scenarioB, 'inv-new': scenarioC }

const SEV_STYLE = {
  P1: { color: '#FF4D4D', bg: 'bg-[#FF4D4D]/5', variant: 'p1' },
  P2: { color: '#F5A623', bg: 'bg-[#F5A623]/5', variant: 'p2' },
}

const STATUS_COLOR = {
  VALIDATED: '#00D4A0', INVALIDATED: '#FF4D4D',
  INCONCLUSIVE: '#F5A623', TESTING: '#0B6ACB',
}

export default function InvestigationPreview({ investigationId, onClose }) {
  const navigate = useNavigate()
  const scenario = SCENARIOS[investigationId]
  if (!scenario) return null

  const rc = scenario.rootCause
  const sev = SEV_STYLE[scenario.severity] || SEV_STYLE.P2

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-screen w-[420px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        <AlertTriangle size={14} style={{ color: sev.color }} />
        <span className="text-[14px] font-semibold text-[#1D2433] flex-1 truncate">{scenario.entity}</span>
        <Badge variant={sev.variant}>{scenario.severity}</Badge>
        <Badge variant="secondary" className="text-[9px]">{scenario.environment}</Badge>
        <button onClick={onClose} className="text-[#6B7280] hover:text-[#1D2433] ml-1"><X size={16} /></button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Status */}
        <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
          <span className="flex items-center gap-1"><Clock size={11} /> {investigationId === 'inv-0892' ? '12 min' : investigationId === 'inv-new' ? '22 min' : '6h 14m'}</span>
          <span className="flex items-center gap-1"><MessageSquare size={11} /> {scenario.slackContext?.length || 0} messages</span>
          <span className="flex items-center gap-1"><Shield size={11} /> {investigationId === 'inv-0892' ? 'Sarah K.' : investigationId === 'inv-new' ? 'Alex R.' : 'Mike T.'}</span>
        </div>

        {/* Root Cause (if found) */}
        {rc && (
          <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle size={13} className="text-[#00D4A0]" />
              <span className="text-[12px] font-semibold text-[#1D2433]">Root Cause Identified</span>
              <Badge variant="good" className="text-[9px]">{rc.confidence}%</Badge>
            </div>
            <p className="text-[12px] text-[#1D2433] leading-relaxed">{rc.summary}</p>
          </div>
        )}

        {/* Impact */}
        {rc && (
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Impact</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: 'Users', value: rc.impact.usersAffected.toLocaleString(), color: '#FF4D4D' },
                { icon: DollarSign, label: 'Revenue/hr', value: `$${rc.impact.revenueAtRisk.toLocaleString()}`, color: '#FF4D4D' },
                { icon: Shield, label: 'SLO Budget', value: `${rc.impact.sloConsumed}%`, color: rc.impact.sloConsumed > 50 ? '#FF4D4D' : '#F5A623' },
                { icon: Clock, label: 'Duration', value: `${rc.impact.durationMinutes} min`, color: '#6B7280' },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2 bg-[#F7F8FA] rounded-lg p-2">
                  <m.icon size={12} className="text-[#6B7280]" />
                  <div>
                    <p className="text-[9px] text-[#6B7280]">{m.label}</p>
                    <p className="text-[13px] font-bold" style={{ color: m.color }}>{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Hypotheses */}
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Hypotheses</p>
          <div className="space-y-1.5">
            {scenario.hypotheses.map(h => (
              <div key={h.id} className={`flex items-center gap-2 text-[12px] p-2 rounded-lg bg-[#F7F8FA] ${h.status === 'INVALIDATED' ? 'opacity-50' : ''}`}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[h.status] || '#6B7280' }} />
                <span className="text-[#1D2433] flex-1 truncate">{h.title}</span>
                <span className="font-semibold" style={{ color: STATUS_COLOR[h.status] }}>{h.confidence}%</span>
                <Badge variant="secondary" className="text-[8px]">{h.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Timeline (last 5) */}
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Recent Timeline</p>
          <div className="space-y-1.5">
            {scenario.timeline.slice(-5).map((t, i) => (
              <div key={i} className="flex gap-2 text-[11px]">
                <span className="text-[#6B7280] w-[40px] shrink-0">{t.time}</span>
                <span className="text-[#1D2433] flex-1">{t.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memory matches */}
        {scenario.memoryMatches?.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                <Brain size={10} className="inline mr-1" />Memory Matches
              </p>
              {scenario.memoryMatches.map(m => (
                <div key={m.id} className="text-[11px] bg-[#9333EA]/5 rounded-lg p-2 mb-1">
                  <span className="text-[#1D2433] font-medium">{m.title}</span>
                  <span className="text-[#6B7280] ml-1">— {m.confidence}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer — actions */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0 space-y-2">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => { onClose(); navigate(`/investigation/${investigationId}`) }}>
            <ExternalLink size={13} /> Open Full Canvas
          </Button>
          {rc && (
            <Button variant="outline" onClick={() => { onClose(); navigate(`/investigation/${investigationId}?section=rootcause`) }}>
              Jump to RCA
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => { onClose(); navigate(`/investigation/${investigationId}/postmortem`) }}>
            Post-Mortem
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => { onClose(); navigate(`/investigation/${investigationId}/war-room`) }}>
            War Room
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => { onClose(); navigate(`/investigation/${investigationId}/slo`) }}>
            SLO
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
