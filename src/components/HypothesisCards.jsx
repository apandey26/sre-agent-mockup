import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  CheckCircle, XCircle, HelpCircle, Loader, ClipboardList,
  SkipForward, ArrowUp, ThumbsDown, Plus, ChevronDown, ChevronUp,
  Brain, ArrowRight, Star, AlertCircle, Undo2,
} from 'lucide-react'
import EvidencePanel from './EvidencePanel'
import ReasoningTree from './ReasoningTree'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

/* ── design tokens ────────────────────────────── */
const STATUS = {
  VALIDATED:     { icon: CheckCircle,  color: '#00D4A0', border: '#00D4A0', label: 'Validated',     bg: 'bg-[#00D4A0]/10 text-[#00D4A0]' },
  INVALIDATED:   { icon: XCircle,      color: '#FF4D4D', border: '#FF4D4D', label: 'Invalidated',   bg: 'bg-[#FF4D4D]/10 text-[#FF4D4D]' },
  INCONCLUSIVE:  { icon: HelpCircle,   color: '#F5A623', border: '#F5A623', label: 'Inconclusive',  bg: 'bg-[#F5A623]/10 text-[#F5A623]' },
  TESTING:       { icon: Loader,       color: '#0B6ACB', border: '#0B6ACB', label: 'Testing',       bg: 'bg-[#0B6ACB]/10 text-[#0B6ACB]' },
  REVIEW:        { icon: AlertCircle,  color: '#9333EA', border: '#9333EA', label: 'Under Review',  bg: 'bg-[#9333EA]/10 text-[#9333EA]' },
  SKIPPED:       { icon: SkipForward,  color: '#6B7280', border: '#6B7280', label: 'Skipped',       bg: 'bg-gray-100 text-[#6B7280]' },
}

function confidenceStyle(c) {
  if (c == null) return 'bg-gray-100 text-[#6B7280]'
  if (c >= 75) return 'bg-[#00D4A0]/10 text-[#00D4A0]'
  if (c >= 40) return 'bg-[#F5A623]/10 text-[#F5A623]'
  return 'bg-gray-100 text-[#6B7280]'
}

const SOURCE_LABELS = { nr: 'NR', github: 'GitHub', argocd: 'ArgoCD', k8s: 'K8s', slack: 'Slack' }

const ACTION_BADGES = {
  skipped:    { label: 'Skipped by you',  icon: SkipForward, cls: 'bg-gray-100 text-[#6B7280]' },
  prioritized:{ label: 'Prioritized by you', icon: Star,     cls: 'bg-[#0B6ACB]/10 text-[#0B6ACB]' },
  disagreed:  { label: 'Disagreed by you', icon: ThumbsDown, cls: 'bg-[#9333EA]/10 text-[#9333EA]' },
  context:    { label: 'Context added by you', icon: Plus,   cls: 'bg-[#00D4A0]/10 text-[#00D4A0]' },
}

/* ── button enable logic ──────────────────────── */
function canSkip(h) { return !['INVALIDATED','VALIDATED','SKIPPED'].includes(h.status) && !h.skipped }
function canPrioritize(h, isFirst) { return !['INVALIDATED','SKIPPED'].includes(h.status) && !isFirst && !h.skipped }
function canDisagree(h) { return ['VALIDATED','INCONCLUSIVE'].includes(h.status) && !h.skipped }
function canAddContext(h) { return !['INVALIDATED','SKIPPED'].includes(h.status) && !h.skipped }

/* ── single hypothesis card ───────────────────── */
function HypothesisCard({ h, index, isChild, childPrefix, interactive, onAction, isExpanded, onToggleExpand, scenario }) {
  const st = STATUS[h.status] || STATUS.TESTING
  const Icon = st.icon
  const isInvalidated = h.status === 'INVALIDATED'
  const isSkipped = h.status === 'SKIPPED' || h.skipped
  const isTesting = h.status === 'TESTING'
  const [detailsOpen, setDetailsOpen] = useState(!isInvalidated && !isSkipped)
  const [showDisagreeForm, setShowDisagreeForm] = useState(false)
  const [showContextForm, setShowContextForm] = useState(false)
  const [disagreeText, setDisagreeText] = useState('')
  const [contextText, setContextText] = useState('')
  const [contextLink, setContextLink] = useState('')

  const showSteering = interactive && !isInvalidated && !isChild && !isSkipped

  const borderStyle = isSkipped ? 'dashed' : 'solid'

  return (
    <div className={isChild ? 'p-3' : 'p-4'}>
      {/* Row 1: header */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon
            size={isChild ? 14 : 16}
            style={{ color: st.color }}
            className={`shrink-0 ${isTesting ? 'animate-[spin_3s_linear_infinite]' : ''}`}
          />
          <span className={`${isChild ? 'text-[13px]' : 'text-[14px]'} font-semibold text-[#1D2433] ${isInvalidated || isSkipped ? 'line-through opacity-70' : ''} truncate`}>
            {childPrefix && <span className="text-[#6B7280] font-medium mr-1">{childPrefix}</span>}
            {h.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {/* Human action badge */}
          {h.humanAction && ACTION_BADGES[h.humanAction] && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-[10px] rounded px-1.5 py-0.5 flex items-center gap-1 font-medium ${ACTION_BADGES[h.humanAction].cls}`}
            >
              {(() => { const B = ACTION_BADGES[h.humanAction].icon; return <B size={9} /> })()}
              {ACTION_BADGES[h.humanAction].label}
            </motion.span>
          )}
          <span className={`text-[12px] font-semibold rounded-full px-2 py-0.5 ${confidenceStyle(h.confidence)} ${h.disagreed ? 'opacity-50' : ''}`}>
            {h.confidence != null ? `${h.confidence}%` : '—'}
            {h.userContext && !h.disagreed && <span className="text-[10px] ml-0.5">+?</span>}
          </span>
          <span className={`text-[10px] uppercase tracking-wide font-semibold rounded px-1.5 py-0.5 ${st.bg}`}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Collapsed state for invalidated/skipped */}
      {(isInvalidated || isSkipped) && !detailsOpen ? (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setDetailsOpen(true)}
            className="flex items-center gap-1 text-[12px] text-[#6B7280] hover:text-[#0B6ACB]"
          >
            Show details <ChevronDown size={12} />
          </button>
          {isSkipped && onAction && (
            <button
              onClick={() => onAction('undo-skip', h.id)}
              className="flex items-center gap-1 text-[11px] text-[#0B6ACB] font-medium hover:underline"
            >
              <Undo2 size={10} /> Undo skip
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Row 2: meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-[12px] text-[#6B7280]">
              <ClipboardList size={12} /> {h.evidenceCount || h.evidences?.length || 0} evidence items
            </span>
            <span className="text-[#D1D5DB]">·</span>
            {(h.sourceIcons || []).map((src) => (
              <span key={src} className="text-[10px] bg-gray-100 text-[#6B7280] rounded px-1 py-[1px] font-medium">
                {SOURCE_LABELS[src] || src}
              </span>
            ))}
            {(h.skills || []).length > 0 && <span className="text-[#D1D5DB]">·</span>}
            {(h.skills || []).map((skill) => (
              <span key={skill} className="text-[10px] bg-[#9333EA]/10 text-[#9333EA] rounded px-1 py-[1px] font-medium">
                {skill}
              </span>
            ))}
            {!isChild && h.evidences?.length > 0 && onToggleExpand && (
              <button
                onClick={() => onToggleExpand(h.id)}
                className={`ml-auto flex items-center gap-1 text-[12px] font-medium hover:underline ${isExpanded ? 'text-[#6B7280]' : 'text-[#0B6ACB]'}`}
              >
                {isExpanded
                  ? <>Collapse evidence <ChevronUp size={11} /></>
                  : <>Expand evidence <ArrowRight size={11} /></>
                }
              </button>
            )}
          </div>

          {/* Evidence panel (expanded) */}
          <AnimatePresence>
            {isExpanded && h.evidences?.length > 0 && scenario && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <EvidencePanel evidences={h.evidences} scenario={scenario} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disagree warning banner */}
          {h.disagreed && (
            <div className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-lg px-3 py-2 mt-2 text-[12px] text-[#F5A623]">
              Re-investigation requested. Agent will re-examine this hypothesis.
            </div>
          )}

          {/* User context display */}
          {h.userContext && !h.disagreed && (
            <div className="bg-[#00D4A0]/5 border-l-2 border-[#00D4A0] rounded-r-lg px-3 py-2 mt-2 flex items-start gap-1.5">
              <Brain size={11} className="text-[#00D4A0] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#6B7280]">
                <span className="font-medium text-[#1D2433]">Your context: </span>
                {h.userContext}
              </p>
            </div>
          )}

          {/* Row 3: steering buttons */}
          {showSteering && (
            <div className="flex gap-1.5 mt-3">
              {[
                { key: 'skip', label: 'Skip', icon: SkipForward, enabled: canSkip(h), action: 'skip' },
                { key: 'prioritize', label: 'Prioritize', icon: ArrowUp, enabled: canPrioritize(h, index === 0), action: 'prioritize' },
                { key: 'disagree', label: 'Disagree', icon: ThumbsDown, enabled: canDisagree(h), action: 'disagree' },
                { key: 'addctx', label: 'Add Context', icon: Plus, enabled: canAddContext(h), action: 'add-context' },
              ].map((btn) => (
                <motion.button
                  key={btn.key}
                  whileTap={btn.enabled ? { scale: 0.95 } : {}}
                  disabled={!btn.enabled}
                  onClick={() => {
                    if (btn.action === 'disagree') setShowDisagreeForm(true)
                    else if (btn.action === 'add-context') setShowContextForm(true)
                    else onAction?.(btn.action, h.id)
                  }}
                  className={`border rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    btn.enabled
                      ? 'border-gray-200 text-[#6B7280] hover:border-[#0B6ACB]/30 hover:text-[#0B6ACB] cursor-pointer'
                      : 'border-gray-100 text-[#D1D5DB] cursor-not-allowed'
                  }`}
                >
                  <btn.icon size={12} /> {btn.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Disagree inline form */}
          <AnimatePresence>
            {showDisagreeForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                  <textarea
                    rows={2}
                    value={disagreeText}
                    onChange={(e) => setDisagreeText(e.target.value)}
                    placeholder="What's wrong with this conclusion? (optional)"
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#9333EA] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAction?.('disagree', h.id, disagreeText)
                        setShowDisagreeForm(false)
                        setDisagreeText('')
                      }}
                      className="px-3 py-1.5 bg-[#9333EA]/10 text-[#9333EA] rounded-lg text-[11px] font-medium hover:bg-[#9333EA]/20 transition-colors"
                    >
                      Submit Disagreement
                    </button>
                    <button
                      onClick={() => { setShowDisagreeForm(false); setDisagreeText('') }}
                      className="px-3 py-1.5 text-[11px] text-[#6B7280] font-medium hover:text-[#1D2433]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Context inline form */}
          <AnimatePresence>
            {showContextForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-[#F7F8FA] rounded-lg p-3 space-y-2">
                  <textarea
                    rows={3}
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder="Share additional context..."
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB] resize-none"
                  />
                  <input
                    type="text"
                    value={contextLink}
                    onChange={(e) => setContextLink(e.target.value)}
                    placeholder="Link or reference (optional)"
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0B6ACB]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (contextText.trim()) {
                          onAction?.('add-context', h.id, contextText)
                          setShowContextForm(false)
                          setContextText('')
                          setContextLink('')
                        }
                      }}
                      className="px-3 py-1.5 bg-[#0B6ACB] text-white rounded-lg text-[11px] font-medium hover:bg-[#0A5EB8] transition-colors"
                    >
                      Add Context
                    </button>
                    <button
                      onClick={() => { setShowContextForm(false); setContextText(''); setContextLink('') }}
                      className="px-3 py-1.5 text-[11px] text-[#6B7280] font-medium hover:text-[#1D2433]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle for invalidated */}
          {isInvalidated && (
            <button
              onClick={() => setDetailsOpen(false)}
              className="flex items-center gap-1 text-[12px] text-[#6B7280] mt-2 hover:text-[#0B6ACB]"
            >
              Hide details <ChevronDown size={12} className="rotate-180" />
            </button>
          )}

          {/* Undo skip (when expanded) */}
          {isSkipped && onAction && (
            <button
              onClick={() => onAction('undo-skip', h.id)}
              className="flex items-center gap-1 text-[11px] text-[#0B6ACB] font-medium mt-2 hover:underline"
            >
              <Undo2 size={10} /> Undo skip
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ── memory assist callout ────────────────────── */
function MemoryAssist({ match }) {
  return (
    <div className="bg-[#9333EA]/5 border-l-2 border-[#9333EA] rounded-r-lg px-3 py-2 flex items-start gap-2">
      <Brain size={12} className="text-[#9333EA] shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-[#6B7280]">
          <span className="font-semibold text-[#1D2433]">Memory: </span>
          {match.summary}
        </p>
      </div>
      <span className="text-[10px] bg-[#9333EA]/10 text-[#9333EA] px-1.5 py-0.5 rounded font-medium shrink-0">
        {match.confidence}%
      </span>
    </div>
  )
}

/* ── sub-hypotheses connector ─────────────────── */
function SubHypotheses({ children, parentIndex }) {
  if (!children || children.length === 0) return null
  const prefixes = ['a', 'b', 'c', 'd', 'e']
  const parentId = children[0]?.parentId?.replace('h', 'H') || 'H?'

  return (
    <div className="ml-6 relative">
      <div className="absolute left-0 top-0 bottom-4 w-[2px] bg-gray-200" />
      <div className="space-y-2 pl-5">
        {children.map((sub, i) => (
          <div key={sub.id} className="relative">
            <div className="absolute -left-5 top-4 w-5 h-[2px] bg-gray-200" />
            <div className="bg-white rounded-xl overflow-hidden" style={{
              borderLeft: `3px solid ${(STATUS[sub.status] || STATUS.TESTING).border}`,
              borderTop: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6',
            }}>
              <HypothesisCard
                h={sub}
                index={parentIndex + i + 1}
                isChild
                childPrefix={`${parentId}${prefixes[i]}:`}
                interactive={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── main export ──────────────────────────────── */
export default function HypothesisCards({ scenario, simulationPhase = 4 }) {
  const isTesting = simulationPhase === 2
  const isResolved = simulationPhase >= 3
  const interactive = simulationPhase >= 3
  const [expandedCardId, setExpandedCardId] = useState(null)

  const toggleExpand = useCallback((cardId) => {
    setExpandedCardId(prev => prev === cardId ? null : cardId)
  }, [])

  // expand-evidence listener added after cards state below

  // Initialize mutable card state from scenario data
  const [cards, setCards] = useState(() => {
    return [...(scenario.hypotheses || [])].sort((a, b) => b.confidence - a.confidence).map(h => ({
      ...h,
      skipped: false,
      prioritized: false,
      disagreed: false,
      userContext: null,
      humanAction: null,
      _origIndex: 0,
    }))
  })

  // Listen for chat-triggered expand-evidence
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'expand-evidence') {
        const firstValidated = cards.find(c => c.status === 'VALIDATED')
        if (firstValidated) setExpandedCardId(firstValidated.id)
      }
    }
    window.addEventListener('canvas-action', handler)
    return () => window.removeEventListener('canvas-action', handler)
  }, [cards])

  // During simulation phase 2, override to TESTING
  const displayCards = isTesting
    ? cards.map(h => ({ ...h, status: 'TESTING', confidence: null, evidenceCount: 0, sourceIcons: [] }))
    : cards

  const subMap = (!isTesting && isResolved) ? (scenario.subHypotheses || {}) : {}
  const memoryMatch = isResolved ? (scenario.memoryMatches?.[0] || null) : null

  const handleAction = useCallback((action, cardId, extra) => {
    setCards(prev => {
      let next = [...prev]
      const idx = next.findIndex(c => c.id === cardId)
      if (idx === -1) return prev
      const card = { ...next[idx] }

      switch (action) {
        case 'skip':
          card.skipped = true
          card.status = 'SKIPPED'
          card.humanAction = 'skipped'
          next[idx] = card
          // Move to bottom
          next = [...next.filter((_, i) => i !== idx), card]
          break

        case 'prioritize':
          card.prioritized = true
          card.humanAction = 'prioritized'
          next[idx] = card
          // Move to top
          next = [card, ...next.filter((_, i) => i !== idx)]
          break

        case 'disagree':
          card.disagreed = true
          card.status = 'REVIEW'
          card.humanAction = 'disagreed'
          card.userContext = extra || null
          next[idx] = card
          break

        case 'add-context':
          card.userContext = extra || null
          card.humanAction = 'context'
          next[idx] = card
          break

        case 'undo-skip':
          // Restore from scenario data
          const orig = scenario.hypotheses.find(h => h.id === cardId)
          if (orig) {
            card.skipped = false
            card.status = orig.status
            card.humanAction = null
            next[idx] = card
            // Resort by confidence
            next.sort((a, b) => {
              if (a.skipped && !b.skipped) return 1
              if (!a.skipped && b.skipped) return -1
              return (b.confidence || 0) - (a.confidence || 0)
            })
          }
          break
      }
      return next
    })
  }, [scenario.hypotheses])

  const treeEnabled = simulationPhase >= 3

  return (
    <div>
      {/* Section header + Tabs toggle */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[#1D2433]">Hypotheses</h2>
            <Badge variant="secondary">{displayCards.length} hypotheses</Badge>
          </div>
        </div>
        {simulationPhase >= 2 && (
          <p className="text-[11px] text-[#6B7280] italic mt-1">Approach: Univariate baseline → Bivariate correlation → Multivariate pattern matching</p>
        )}
      </div>

      <Tabs defaultValue="cards">
        <div className="flex justify-end mb-3">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="thinking">Thinking</TabsTrigger>
            {treeEnabled ? (
              <TabsTrigger value="tree">Tree</TabsTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-medium text-[#6B7280] opacity-50 cursor-not-allowed">
                    Tree
                  </span>
                </TooltipTrigger>
                <TooltipContent>Available after hypotheses resolve</TooltipContent>
              </Tooltip>
            )}
          </TabsList>
        </div>

        {/* Cards tab */}
        <TabsContent value="cards">
          <LayoutGroup>
            <div className="space-y-3">
              {displayCards.map((h, i) => {
                const isSkipped = h.status === 'SKIPPED' || h.skipped
                const isInvalidated = h.status === 'INVALIDATED'
                const st = STATUS[h.status] || STATUS.TESTING

                return (
                  <motion.div
                    key={h.id}
                    layout
                    layoutId={h.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: isSkipped ? 0.5 : isInvalidated ? 0.6 : 1,
                      y: 0,
                    }}
                    transition={{
                      layout: { type: 'spring', stiffness: 400, damping: 30 },
                      opacity: { duration: 0.3 },
                      y: { duration: 0.25, delay: i * 0.1 },
                    }}
                    className={`bg-white rounded-xl overflow-hidden ${h.prioritized && !h.skipped ? 'shadow-[0_0_0_2px_rgba(11,106,203,0.15)]' : ''}`}
                    style={{
                      borderLeft: `3px ${isSkipped ? 'dashed' : 'solid'} ${st.border}`,
                      borderTop: '1px solid #F3F4F6',
                      borderRight: '1px solid #F3F4F6',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <HypothesisCard
                      h={h}
                      index={i}
                      isChild={false}
                      interactive={interactive}
                      onAction={handleAction}
                      isExpanded={expandedCardId === h.id}
                      onToggleExpand={toggleExpand}
                      scenario={scenario}
                    />

                    {/* Memory assist */}
                    {memoryMatch && h.status === 'VALIDATED' && h.id === displayCards.find(x => x.status === 'VALIDATED')?.id && (
                      <div className="px-4 pb-3">
                        <MemoryAssist match={memoryMatch} />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </LayoutGroup>

          {/* Sub-hypotheses */}
          {displayCards.map((h, i) => (
            subMap[h.id] ? (
              <div key={`sub-${h.id}`} className="mt-2">
                <SubHypotheses children={subMap[h.id]} parentIndex={i} />
              </div>
            ) : null
          ))}
        </TabsContent>

        {/* Thinking tab */}
        <TabsContent value="thinking">
          <ThinkingStream scenario={scenario} />
        </TabsContent>

        {/* Tree tab */}
        {treeEnabled && (
          <TabsContent value="tree">
            <ReasoningTree scenario={scenario} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/* ── thinking stream ─────────────────────────── */
const THINKING_STEPS = {
  'inv-0892': [
    { step: 1, phase: 'context', status: 'done', title: 'Gathering entity context', detail: 'Loaded checkout-service metadata: K8s deployment, 3 replicas, prod namespace', duration: '1.2s', skill: 'NRQL query builder' },
    { step: 2, phase: 'context', status: 'done', title: 'Querying golden metrics', detail: 'Throughput: 485 rpm, Error rate: 1.8%, p99 latency: 2,340ms — anomaly detected at 14:32 UTC', duration: '2.1s', skill: 'Metric correlation' },
    { step: 3, phase: 'context', status: 'done', title: 'Checking recent deployments', detail: 'Found: v2.4.1 deployed at 14:11 UTC via ArgoCD. 3 commits by @sarah-k', duration: '0.8s', skill: 'Deployment diff' },
    { step: 4, phase: 'context', status: 'done', title: 'Scanning logs for patterns', detail: '847 errors matching "N+1 query" in 15 min window. Source: order_items.rb', duration: '3.4s', skill: 'Log analysis' },
    { step: 5, phase: 'context', status: 'done', title: 'Searching memory for similar incidents', detail: 'Match found: INV-0847 (search-service N+1 query, 94% confidence). Pattern: rollback fixes.', duration: '0.4s', skill: null },
    { step: 6, phase: 'hypothesis', status: 'done', title: 'Generating hypothesis: Deployment regression', detail: 'Correlation: latency spike started 12 min after deploy. Code diff shows removed eager loading.', duration: '1.8s', skill: 'Deployment diff' },
    { step: 7, phase: 'hypothesis', status: 'done', title: 'Testing hypothesis: DB connection pool', detail: 'DB connections: 45/100 (normal). Pool utilization: 45%. Ruling out — no saturation.', duration: '1.1s', skill: 'Metric correlation' },
    { step: 8, phase: 'hypothesis', status: 'done', title: 'Testing hypothesis: Upstream degradation', detail: 'payment-gateway: p99 220ms (normal). No upstream issues detected. Inconclusive.', duration: '0.9s', skill: 'Metric correlation' },
    { step: 9, phase: 'validation', status: 'done', title: 'Validating root cause', detail: 'Deploy v2.4.1 + N+1 query pattern + 47x query increase explains 92% of latency variance.', duration: '2.3s', skill: 'Metric correlation' },
    { step: 10, phase: 'action', status: 'done', title: 'Generating recommendations', detail: 'Primary: Rollback to v2.4.0 (~6 min). Secondary: Add eager loading lint rule. Tertiary: DB query alert.', duration: '0.6s', skill: null },
  ],
  'inv-0893': [
    { step: 1, phase: 'context', status: 'done', title: 'Gathering entity context', detail: 'api-gateway: 4 pods, auth-service dependency, TLS termination at ingress', duration: '1.0s', skill: 'K8s diagnostics' },
    { step: 2, phase: 'context', status: 'done', title: 'Querying golden metrics', detail: 'Error rate: 12% (5xx), all 502 Bad Gateway. Started 03:14 UTC.', duration: '1.8s', skill: 'Metric correlation' },
    { step: 3, phase: 'context', status: 'done', title: 'Checking TLS certificates', detail: 'auth-service cert expired at 03:14 UTC exactly. 90-day cert, last renewed Jan 5.', duration: '0.5s', skill: 'Cert/TLS analysis' },
    { step: 4, phase: 'context', status: 'done', title: 'Searching memory', detail: 'Match: INV-0623 (same cert expiry 90 days ago). Pattern confirmed.', duration: '0.3s', skill: null },
    { step: 5, phase: 'hypothesis', status: 'done', title: 'Hypothesis: TLS cert expiry', detail: '502 errors exactly match cert expiry time. r=0.99 correlation. 99% confidence.', duration: '1.2s', skill: 'Cert/TLS analysis' },
    { step: 6, phase: 'validation', status: 'done', title: 'Validating root cause', detail: 'TLS cert expiry + 90-day cycle + memory match confirms with 99% confidence.', duration: '0.8s', skill: 'Metric correlation' },
    { step: 7, phase: 'action', status: 'done', title: 'Generating recommendations', detail: 'Primary: Rotate cert (RB-042). Secondary: Install cert-manager. Tertiary: Add expiry monitor.', duration: '0.5s', skill: null },
  ],
  'inv-new': [
    { step: 1, phase: 'context', status: 'done', title: 'Gathering entity context', detail: 'payment-gateway: 3 pods, Redis dependency, v3.1.2 deployed 2h ago', duration: '1.1s', skill: 'K8s diagnostics' },
    { step: 2, phase: 'context', status: 'done', title: 'Querying golden metrics', detail: 'Redis connections: 200/200 (pool full), Latency p99: 4,200ms, 6 pod restarts', duration: '2.0s', skill: 'Metric correlation' },
    { step: 3, phase: 'context', status: 'done', title: 'Scanning logs', detail: '1,200 timeout errors. Pattern: "Redis pool exhausted". Connection leak trace found.', duration: '2.8s', skill: 'Log analysis' },
    { step: 4, phase: 'context', status: 'done', title: 'Analyzing deployment diff', detail: 'v3.1.2 changed timeout handler — connection release path missing in error case', duration: '1.5s', skill: 'Deployment diff' },
    { step: 5, phase: 'hypothesis', status: 'done', title: 'Hypothesis: Redis connection leak', detail: 'Timeout path never releases connections. Pool saturates under normal load.', duration: '1.4s', skill: 'Log analysis' },
    { step: 6, phase: 'hypothesis', status: 'done', title: 'Testing: K8s resource limits', detail: 'CPU/Memory within limits. Restarts caused by health check timeout, not OOM.', duration: '0.9s', skill: 'K8s diagnostics' },
    { step: 7, phase: 'validation', status: 'done', title: 'Validating root cause', detail: 'Connection leak in v3.1.2 + pool exhaustion + health check failure chain. 78% confidence.', duration: '1.6s', skill: 'Metric correlation' },
    { step: 8, phase: 'action', status: 'done', title: 'Generating recommendations', detail: 'Primary: Flush Redis pool (immediate). Secondary: Fix leak in v3.1.3. Tertiary: Add pool monitor.', duration: '0.5s', skill: null },
  ],
}

const PHASE_COLORS = {
  context: { bg: 'bg-[#0B6ACB]/5', border: 'border-[#0B6ACB]/20', text: 'text-[#0B6ACB]', label: 'Context' },
  hypothesis: { bg: 'bg-[#F5A623]/5', border: 'border-[#F5A623]/20', text: 'text-[#F5A623]', label: 'Hypothesis' },
  validation: { bg: 'bg-[#00D4A0]/5', border: 'border-[#00D4A0]/20', text: 'text-[#00D4A0]', label: 'Validation' },
  action: { bg: 'bg-[#9333EA]/5', border: 'border-[#9333EA]/20', text: 'text-[#9333EA]', label: 'Action' },
}

function ThinkingStream({ scenario }) {
  const steps = THINKING_STEPS[scenario.id] || THINKING_STEPS['inv-0892']
  const [expandedStep, setExpandedStep] = useState(null)

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[#6B7280] mb-2">Agent reasoning chain — {steps.length} steps · {steps.reduce((a, s) => a + parseFloat(s.duration), 0).toFixed(1)}s total</p>
      {steps.map((step, i) => {
        const pc = PHASE_COLORS[step.phase] || PHASE_COLORS.context
        const isExpanded = expandedStep === i
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <button
              onClick={() => setExpandedStep(isExpanded ? null : i)}
              className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg border transition-colors ${isExpanded ? `${pc.bg} ${pc.border}` : 'border-transparent hover:bg-gray-50'}`}
            >
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
                <CheckCircle size={12} className="text-[#00D4A0]" />
                {i < steps.length - 1 && <div className="w-px h-3 bg-gray-200" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[#1D2433]">{step.title}</span>
                  <span className={`text-[8px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded ${pc.bg} ${pc.text}`}>{pc.label}</span>
                  <span className="text-[9px] text-[#6B7280] ml-auto shrink-0">{step.duration}</span>
                </div>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-1.5">
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">{step.detail}</p>
                    {step.skill && (
                      <span className="text-[9px] bg-[#9333EA]/10 text-[#9333EA] rounded px-1.5 py-0.5 mt-1 inline-block">via {step.skill}</span>
                    )}
                  </motion.div>
                )}
              </div>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
