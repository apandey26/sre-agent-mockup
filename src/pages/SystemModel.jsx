import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, ChevronDown, CheckCircle, Clock, Activity,
  GitBranch, AlertTriangle, Shield, Server,
} from 'lucide-react'
import { systemModel } from '../data'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

const HEALTH_DOT = (count) => count === 0 ? '#00D4A0' : count <= 2 ? '#F5A623' : '#FF4D4D'

export default function SystemModel() {
  const [expandedEntity, setExpandedEntity] = useState(null)
  const sm = systemModel

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold text-[#1D2433]">System Model</h1>
          <p className="text-[12px] text-[#6B7280]">Learned behavioral patterns for your environment — gets smarter with every investigation</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">{sm.fleetSummary.totalPatterns} patterns learned</Badge>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* Fleet summary */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
          {[
            { icon: Server, label: 'Entities Modeled', value: `${sm.fleetSummary.entitiesWithModel}/${sm.fleetSummary.totalEntities}` },
            { icon: Brain, label: 'Patterns Learned', value: sm.fleetSummary.totalPatterns },
            { icon: CheckCircle, label: 'Used in Investigations', value: sm.fleetSummary.patternsUsedInInvestigations },
            { icon: Clock, label: 'Avg Model Age', value: sm.fleetSummary.avgModelAge },
          ].map(m => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon size={12} className="text-[#6B7280]" />
                <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">{m.label}</span>
              </div>
              <span className="text-[20px] font-bold text-[#1D2433]">{m.value}</span>
            </Card>
          ))}
        </motion.div>

        {/* Retention flywheel banner */}
        <motion.div variants={fadeUp}>
          <div className="bg-gradient-to-r from-[#9333EA]/5 to-[#0B6ACB]/5 border border-[#9333EA]/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <Brain size={16} className="text-[#9333EA] shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-[#1D2433]">{sm.fleetSummary.retentionValue}</p>
              <p className="text-[10px] text-[#6B7280]">The longer you're a customer, the smarter the agent gets. This context is unique to your environment.</p>
            </div>
          </div>
        </motion.div>

        {/* Entity cards */}
        <motion.div variants={fadeUp} className="space-y-2">
          {sm.entities.map(entity => {
            const isExpanded = expandedEntity === entity.name
            const incidentDot = HEALTH_DOT(entity.incidentHistory.count)
            return (
              <Card key={entity.name} className="overflow-hidden">
                <button onClick={() => setExpandedEntity(isExpanded ? null : entity.name)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/30 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: incidentDot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#1D2433]">{entity.name}</span>
                      <Badge variant="secondary" className="text-[9px]">{entity.type}</Badge>
                      <Badge variant="outline" className="text-[9px]">{entity.team}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6B7280]">
                      <span>p99: {entity.latencyBaseline.p99}ms</span>
                      <span>·</span>
                      <span>Err: {entity.errorBaseline}%</span>
                      <span>·</span>
                      <span>{entity.incidentHistory.count} incidents (90d)</span>
                      <span>·</span>
                      <span>{entity.learnedPatterns.length} patterns</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#6B7280]">Model age</p>
                    <p className="text-[12px] font-medium text-[#1D2433]">{entity.modelAge}</p>
                  </div>
                  <ChevronDown size={14} className={`text-[#6B7280] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        <Separator />

                        {/* Baselines */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-[#F7F8FA] rounded-lg p-2.5">
                            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-1">Latency Baseline</p>
                            <div className="flex gap-3 text-[11px]">
                              <span>p50: <span className="font-medium text-[#1D2433]">{entity.latencyBaseline.p50}ms</span></span>
                              <span>p95: <span className="font-medium text-[#1D2433]">{entity.latencyBaseline.p95}ms</span></span>
                              <span>p99: <span className="font-medium text-[#1D2433]">{entity.latencyBaseline.p99}ms</span></span>
                            </div>
                          </div>
                          <div className="bg-[#F7F8FA] rounded-lg p-2.5">
                            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-1">Deploy Cadence</p>
                            <p className="text-[11px] text-[#1D2433]">{entity.deployFrequency}</p>
                          </div>
                          <div className="bg-[#F7F8FA] rounded-lg p-2.5">
                            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide mb-1">Top Incident Cause</p>
                            <p className="text-[11px] text-[#1D2433]">{entity.incidentHistory.topCause} <span className="text-[#6B7280]">({entity.incidentHistory.topCausePercent}%)</span></p>
                          </div>
                        </div>

                        {/* Dependencies */}
                        {entity.dependencies.length > 0 && (
                          <div>
                            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide mb-1">Dependencies</p>
                            <div className="flex gap-1.5">
                              {entity.dependencies.map(d => <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>)}
                            </div>
                          </div>
                        )}

                        {/* Learned patterns */}
                        <div>
                          <p className="text-[10px] text-[#6B7280] uppercase tracking-wide mb-1.5">Learned Patterns</p>
                          <div className="space-y-1.5">
                            {entity.learnedPatterns.map((p, i) => (
                              <div key={i} className="bg-[#9333EA]/5 border border-[#9333EA]/10 rounded-lg px-3 py-2 flex items-start gap-2">
                                <Brain size={11} className="text-[#9333EA] shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-[11px] text-[#1D2433] leading-relaxed">{p.pattern}</p>
                                  <div className="flex items-center gap-2 mt-1 text-[9px] text-[#6B7280]">
                                    <span className="font-medium text-[#9333EA]">{p.confidence}% confident</span>
                                    <span>·</span>
                                    <span>Source: {p.source}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </motion.div>
      </motion.div>
    </div>
  )
}
