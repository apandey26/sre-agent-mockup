import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import InvestigationSubNav from '../components/InvestigationSubNav'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, CheckSquare, FileText, Code, MessageSquare,
  CheckCircle, XCircle, Eye, Clock, AlertTriangle, Ticket,
  Sparkles, ShieldCheck, Pencil, RotateCcw, Brain, X,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Textarea } from '../components/ui/textarea'
import { ScrollArea } from '../components/ui/scroll-area'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { scenarioA, scenarioB, scenarioC, postmortemTemplate } from '../data'

const SCENARIOS = { 'inv-0892': scenarioA, 'inv-0893': scenarioB, 'inv-new': scenarioC }

function getTemplate(id) {
  if (id === 'inv-0892') return postmortemTemplate.scenarioA
  if (id === 'inv-0893') return postmortemTemplate.scenarioB
  // Scenario C — generate inline
  const sc = scenarioC
  return {
    title: `Post-Mortem: ${sc.entity} Latency Incident`,
    date: 'April 9, 2026', duration: '22 min', severity: 'P2',
    executiveSummary: `${sc.rootCause.summary} The SRE Agent identified the root cause in 8 minutes. Service recovered after Redis connection pool flush.`,
    timeline: sc.timeline.map(t => ({ time: t.time + ' UTC', event: t.event, source: t.source })),
    detection: { howDetected: 'NR Alert (p99 > 2s)', timeToDetect: '0 min', timeToAcknowledge: '1 min', timeToRootCause: '8 min', timeToResolve: '22 min' },
    rootCause: sc.rootCause.summary,
    impact: {
      usersAffected: `~${sc.rootCause.impact.usersAffected.toLocaleString()}`,
      errorBudgetConsumed: `${sc.rootCause.impact.sloConsumed}%`,
      revenueImpact: `$${sc.rootCause.impact.revenueAtRisk.toLocaleString()}`,
      customerImpactDuration: `${sc.rootCause.impact.durationMinutes} minutes`,
      servicesAffected: sc.rootCause.impact.affectedEntities,
    },
    resolution: 'Redis connection pool flushed. Pods recovered within 10 minutes. Connection leak fix deployed in v3.1.3.',
    wentWell: ['SRE Agent identified root cause in 8 minutes', 'Quick manual intervention (pool flush)'],
    wentWrong: ['Connection leak not caught in code review', 'No Redis connection pool monitoring alert'],
    actionItems: [
      { id: 1, action: 'Add Redis connection pool monitoring alert', owner: 'SRE', dueDate: 'Apr 14', ticket: null },
      { id: 2, action: 'Fix connection leak in payment processing', owner: 'Payments Team', dueDate: 'Apr 16', ticket: null },
    ],
  }
}

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

const SEV_VARIANT = { P1: 'p1', P2: 'p2', P3: 'p3' }

function SectionHeader({ children, icon: Icon, iconColor, aiPrefilled }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon size={14} style={{ color: iconColor || '#1D2433' }} />}
      <h3 className="text-[14px] font-semibold text-[#1D2433]">{children}</h3>
      {aiPrefilled && (
        <span className="text-[9px] text-[#0B6ACB] bg-[#0B6ACB]/8 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
          <Sparkles size={8} /> AI-prefilled
        </span>
      )}
    </div>
  )
}

export default function PostMortem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = SCENARIOS[id]

  const [highlightSource, setHighlightSource] = useState(null)
  const [toasts, setToasts] = useState([])
  const [aiReviewing, setAiReviewing] = useState(false)
  const [aiReviewDone, setAiReviewDone] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])

  if (!scenario) {
    return <div><Breadcrumbs /><EmptyState icon={FileText} title="Not Found" description="Investigation not found." actions={[{ label: 'Home', onClick: () => navigate('/') }]} /></div>
  }

  const pm = getTemplate(id)
  const toast = (msg) => { const tid = Date.now(); setToasts(p => [...p, { id: tid, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000) }

  const runAiReview = () => {
    setAiReviewing(true)
    setTimeout(() => {
      setAiReviewing(false)
      setAiReviewDone(true)
      setAiSuggestions([
        { section: 'timeline', note: 'Timeline is complete. All events match investigation data.', status: 'pass' },
        { section: 'rootcause', note: 'Root cause statement verified against evidence chain.', status: 'pass' },
        { section: 'impact', note: 'Revenue figure matches SLO burn rate calculation.', status: 'pass' },
        { section: 'actions', note: 'Consider adding a "runbook update" action item for faster future response.', status: 'suggestion' },
      ])
      toast('AI review complete — 3 verified, 1 suggestion')
    }, 2500)
  }

  const sources = [
    { id: 'pagerduty', label: 'PagerDuty', badge: 'PagerDuty', detail: 'Incident timeline', sections: ['timeline', 'detection'] },
    { id: 'slack', label: 'Slack Thread', badge: 'Slack', detail: `${scenario.slackContext?.length || 0} messages`, sections: ['timeline'] },
    { id: 'investigation', label: 'Investigation', badge: 'NR', detail: 'Root cause + evidence', sections: ['rootcause', 'impact'] },
    { id: 'slo', label: 'SLO Data', badge: 'NR', detail: 'Budget + compliance', sections: ['impact'] },
  ]
  if (scenario.warRoom) {
    sources.push({ id: 'zoom', label: 'Zoom Transcript', badge: 'Zoom', detail: 'War room recording', sections: ['timeline'] })
  }

  const isHighlighted = (section) => highlightSource && sources.find(s => s.id === highlightSource)?.sections.includes(section)

  return (
    <div>
      <Breadcrumbs />
      <InvestigationSubNav />

      <div className="flex gap-4 min-h-[calc(100vh-120px)]">

        {/* ═══ LEFT: Source Panel ═══ */}
        <Card className="w-[260px] shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <span className="text-[13px] font-semibold text-[#1D2433]">Sources</span>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Pieces of the Puzzle</p>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider px-1 pt-1">External Docs</p>
              {sources.map(s => (
                <button
                  key={s.id}
                  onClick={() => setHighlightSource(highlightSource === s.id ? null : s.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${highlightSource === s.id ? 'bg-[#0B6ACB]/5 border border-[#0B6ACB]/20' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <Eye size={11} className={highlightSource === s.id ? 'text-[#0B6ACB]' : 'text-[#D1D5DB]'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[8px]">{s.badge}</Badge>
                      <span className="text-[11px] font-medium text-[#1D2433]">{s.label}</span>
                    </div>
                    <p className="text-[10px] text-[#6B7280] truncate">{s.detail}</p>
                  </div>
                </button>
              ))}

              <Separator className="my-2" />
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider px-1">NR Data Provenance</p>
              <div className="px-1 space-y-1 text-[11px] text-[#6B7280]">
                <p>• {scenario.timeline?.length || 0} investigation events</p>
                <p>• Root cause: {scenario.rootCause ? 'Identified' : 'Pending'}</p>
                <p>• Impact: RUM + SLO data</p>
                <p>• {scenario.memoryMatches?.length || 0} memory references</p>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* ═══ CENTER: Document ═══ */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex-1 min-w-0 space-y-4">

          {/* AI-prefilled banner */}
          <motion.div variants={fadeUp}>
            <div className="bg-[#0B6ACB]/5 border border-[#0B6ACB]/15 rounded-xl p-3 flex items-center gap-3">
              <Sparkles size={14} className="text-[#0B6ACB] shrink-0" />
              <div className="flex-1">
                <p className="text-[12px] font-medium text-[#1D2433]">AI-generated post-mortem draft</p>
                <p className="text-[10px] text-[#6B7280]">Pre-filled from investigation data, timeline events, and SLO metrics. All sections are editable.</p>
              </div>
              {!aiReviewing && !aiReviewDone && (
                <Button size="sm" className="text-[10px] h-7 bg-[#0B6ACB]" onClick={runAiReview}>
                  <ShieldCheck size={11} /> AI Review for Accuracy
                </Button>
              )}
              {aiReviewing && (
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Brain size={14} className="text-[#0B6ACB]" />
                  </motion.div>
                  <span className="text-[11px] text-[#0B6ACB] font-medium">Reviewing...</span>
                </div>
              )}
              {aiReviewDone && (
                <Badge variant="good" className="text-[10px]"><ShieldCheck size={10} /> Verified</Badge>
              )}
            </div>
          </motion.div>

          {/* AI Review Results */}
          <AnimatePresence>
            {aiReviewDone && aiSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={12} className="text-[#00D4A0]" />
                    <span className="text-[12px] font-semibold text-[#1D2433]">AI Review Results</span>
                    <button onClick={() => setAiReviewDone(false)} className="ml-auto text-[#6B7280] hover:text-[#1D2433]"><X size={12} /></button>
                  </div>
                  <div className="space-y-1">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] py-1">
                        {s.status === 'pass' ? (
                          <CheckCircle size={11} className="text-[#00D4A0] shrink-0 mt-0.5" />
                        ) : (
                          <Sparkles size={11} className="text-[#F5A623] shrink-0 mt-0.5" />
                        )}
                        <span className="text-[#6B7280]">
                          <span className="font-medium text-[#1D2433] capitalize">{s.section}</span> — {s.note}
                        </span>
                        {s.status === 'suggestion' && (
                          <Button variant="outline" size="sm" className="text-[9px] h-5 ml-auto shrink-0" onClick={() => toast('Suggestion applied')}>Apply</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <h1 className="text-[18px] font-bold text-[#1D2433] mb-2">{pm.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{pm.date}</Badge>
                <Badge variant="secondary"><Clock size={10} /> {pm.duration}</Badge>
                <Badge variant={SEV_VARIANT[pm.severity] || 'secondary'}>{pm.severity}</Badge>
              </div>
            </Card>
          </motion.div>

          {/* Executive Summary */}
          <motion.div variants={fadeUp}>
            <Card className={`p-4 transition-colors ${isHighlighted('summary') ? 'bg-[#0B6ACB]/5' : ''}`}>
              <SectionHeader aiPrefilled>Executive Summary</SectionHeader>
              <Textarea defaultValue={pm.executiveSummary} rows={3} className="text-[13px]" />
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={fadeUp}>
            <Card className={`p-4 transition-colors ${isHighlighted('timeline') ? 'bg-[#0B6ACB]/5' : ''}`}>
              <SectionHeader icon={Clock} iconColor="#6B7280">Timeline</SectionHeader>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Time</TableHead><TableHead>Event</TableHead><TableHead>Source</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pm.timeline.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-[#6B7280] whitespace-nowrap">{t.time}</TableCell>
                      <TableCell>{t.event}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[9px]">{t.source}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>

          {/* Detection */}
          <motion.div variants={fadeUp}>
            <Card className={`p-4 transition-colors ${isHighlighted('detection') ? 'bg-[#0B6ACB]/5' : ''}`}>
              <SectionHeader>Detection</SectionHeader>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {Object.entries(pm.detection).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[#6B7280] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <p className="font-medium text-[#1D2433]">{v}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Root Cause */}
          <motion.div variants={fadeUp}>
            <Card className={`p-4 transition-colors ${isHighlighted('rootcause') ? 'bg-[#0B6ACB]/5' : ''}`} style={{ borderLeft: '3px solid #00D4A0' }}>
              <SectionHeader icon={CheckCircle} iconColor="#00D4A0" aiPrefilled>Root Cause</SectionHeader>
              <Textarea defaultValue={pm.rootCause} rows={3} className="text-[13px]" />
            </Card>
          </motion.div>

          {/* Impact */}
          <motion.div variants={fadeUp}>
            <Card className={`p-4 transition-colors ${isHighlighted('impact') ? 'bg-[#0B6ACB]/5' : ''}`}>
              <SectionHeader icon={AlertTriangle} iconColor="#FF4D4D" aiPrefilled>Impact</SectionHeader>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {Object.entries(pm.impact).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[#6B7280] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <p className="font-medium text-[#1D2433]">{Array.isArray(v) ? v.join(', ') : v}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Resolution */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <SectionHeader aiPrefilled>Resolution</SectionHeader>
              <Textarea defaultValue={pm.resolution} rows={2} className="text-[13px]" />
            </Card>
          </motion.div>

          {/* Went Well / Wrong */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={fadeUp}>
              <Card className="p-4">
                <SectionHeader icon={CheckCircle} iconColor="#00D4A0">What Went Well</SectionHeader>
                <div className="space-y-1.5">
                  {pm.wentWell.map((item, i) => (
                    <label key={i} className="flex items-start gap-2 text-[12px] cursor-pointer">
                      <input type="checkbox" defaultChecked className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#00D4A0]" />
                      <span className="text-[#1D2433]">{item}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="p-4">
                <SectionHeader icon={XCircle} iconColor="#FF4D4D">What Went Wrong</SectionHeader>
                <div className="space-y-1.5">
                  {pm.wentWrong.map((item, i) => (
                    <label key={i} className="flex items-start gap-2 text-[12px] cursor-pointer">
                      <input type="checkbox" defaultChecked className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#FF4D4D]" />
                      <span className="text-[#1D2433]">{item}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Action Items */}
          <motion.div variants={fadeUp}>
            <Card className="p-4">
              <SectionHeader icon={Ticket} iconColor="#0B6ACB">Action Items</SectionHeader>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>#</TableHead><TableHead>Action</TableHead><TableHead>Owner</TableHead><TableHead>Due Date</TableHead><TableHead>Ticket</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pm.actionItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell className="text-[#6B7280]">{item.owner}</TableCell>
                      <TableCell className="text-[#6B7280]">{item.dueDate}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-[10px] h-5" onClick={() => toast(`Jira ticket created: ${item.action.slice(0, 30)}...`)}>
                          Create Jira
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3">
                <Button onClick={() => toast(`${pm.actionItems.length} Jira tickets created`)}>
                  <Ticket size={13} /> Create All Action Items
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* ═══ RIGHT: Export Panel ═══ */}
        <div className="w-[220px] shrink-0">
          <Card className="p-3 sticky top-5">
            <span className="text-[13px] font-semibold text-[#1D2433] block mb-3">Export & Share</span>
            <div className="space-y-1.5">
              {[
                { icon: BookOpen, label: 'Confluence', sub: 'Create page in ENG space' },
                { icon: CheckSquare, label: 'Jira', sub: 'Attach to incident ticket' },
                { icon: FileText, label: 'PDF', sub: 'Formatted download' },
                { icon: Code, label: 'Markdown', sub: 'Raw export' },
                { icon: FileText, label: 'Google Docs', sub: 'Shared document' },
                { icon: MessageSquare, label: 'Slack', sub: 'Post summary to channel' },
              ].map(opt => (
                <Button key={opt.label} variant="outline" className="w-full justify-start h-auto py-2 px-3" onClick={() => toast(`Exported to ${opt.label}`)}>
                  <opt.icon size={13} className="shrink-0 text-[#6B7280]" />
                  <div className="text-left ml-1">
                    <p className="text-[12px] font-medium">{opt.label}</p>
                    <p className="text-[10px] text-[#6B7280] font-normal">{opt.sub}</p>
                  </div>
                </Button>
              ))}
            </div>

            <Separator className="my-3" />

            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: 2 }}>
              <Button className="w-full" onClick={() => toast(`${pm.actionItems.length} Jira tickets created`)}>
                <Ticket size={13} /> Create All Action Items
              </Button>
            </motion.div>
          </Card>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[250px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
