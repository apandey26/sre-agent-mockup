import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Loader, Download, Maximize2, Minimize2, Play, SkipForward, ArrowUp, ThumbsDown, Plus, Star, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

const STATUS_CFG = {
  VALIDATED:    { icon: CheckCircle, color: '#00D4A0', stroke: '#00D4A0', dash: '', glow: true },
  INVALIDATED:  { icon: XCircle,     color: '#FF4D4D', stroke: '#FF4D4D', dash: '6 4', glow: false },
  INCONCLUSIVE: { icon: HelpCircle,  color: '#F5A623', stroke: '#F5A623', dash: '', glow: false },
  TESTING:      { icon: Loader,      color: '#0B6ACB', stroke: '#0B6ACB', dash: '', glow: false },
  REVIEW:       { icon: HelpCircle,  color: '#9333EA', stroke: '#9333EA', dash: '', glow: false },
  SKIPPED:      { icon: SkipForward, color: '#6B7280', stroke: '#6B7280', dash: '6 4', glow: false },
}
const CONF_BADGE = (c) => c >= 75 ? 'good' : c >= 40 ? 'warning' : 'secondary'
const ACTION_ICON = { skipped: SkipForward, prioritized: Star, disagreed: ThumbsDown, context: Plus }

const NODE_W = 180; const NODE_W_SM = 130; const NODE_H = 90; const NODE_H_SM = 55
const V_GAP = 55; const H_GAP = 24; const PAD_X = 30; const PAD_Y = 30

/* ── build tree ───────────────────────────────── */
function buildTree(scenario) {
  const nodes = []; const edges = []
  nodes.push({ id: 'alert', level: 0, type: 'alert', title: 'ALERT TRIGGERED', sub: scenario.entity, detail: scenario.hypotheses[0]?.title || scenario.title, status: null, confidence: null })
  const hyps = [...scenario.hypotheses].sort((a, b) => b.confidence - a.confidence)
  hyps.forEach(h => {
    nodes.push({ id: h.id, level: 1, type: 'hypothesis', title: h.title, status: h.status, confidence: h.confidence, evidenceCount: h.evidenceCount || h.evidences?.length || 0, humanAction: h.humanAction || null })
    edges.push({ from: 'alert', to: h.id, confidence: h.confidence, status: h.status })
  })
  const subMap = scenario.subHypotheses || {}
  const prefixes = ['a', 'b', 'c', 'd', 'e']
  Object.entries(subMap).forEach(([parentId, children]) => {
    children.forEach((sub, i) => {
      nodes.push({ id: sub.id, level: 2, type: 'sub', title: sub.title, prefix: `${parentId.replace('h', 'H')}${prefixes[i]}`, status: sub.status, confidence: sub.confidence, evidenceCount: sub.evidenceCount || sub.evidences?.length || 0 })
      edges.push({ from: parentId, to: sub.id, confidence: sub.confidence, status: sub.status })
    })
  })
  if (scenario.rootCause) {
    const rc = scenario.rootCause
    nodes.push({ id: 'rootcause', level: 3, type: 'rootcause', title: 'ROOT CAUSE', sub: rc.summary, confidence: rc.confidence, evidenceCount: 5 })
    const validatedId = rc.validatedHypothesis
    const fromNode = nodes.find(n => n.id === validatedId) ? validatedId : nodes.find(n => n.level === 1 && n.status === 'VALIDATED')?.id
    if (fromNode) edges.push({ from: fromNode, to: 'rootcause', confidence: rc.confidence, status: 'VALIDATED' })
  }
  return { nodes, edges }
}

/* ── vertical layout ──────────────────────────── */
function layoutVertical(nodes) {
  const levels = {}
  nodes.forEach(n => { if (!levels[n.level]) levels[n.level] = []; levels[n.level].push(n) })
  const getNodeDims = (n) => {
    const isInval = n.status === 'INVALIDATED'
    const w = n.type === 'sub' ? (isInval ? NODE_W_SM : 160) : (isInval ? NODE_W_SM : NODE_W)
    const h = isInval ? NODE_H_SM : (n.type === 'rootcause' ? 100 : NODE_H)
    return { w, h }
  }
  nodes.forEach(n => { const d = getNodeDims(n); n.w = d.w; n.h = d.h })
  const levelWidths = {}
  Object.entries(levels).forEach(([lvl, lvlNodes]) => { levelWidths[lvl] = lvlNodes.reduce((s, n) => s + n.w, 0) + (lvlNodes.length - 1) * H_GAP })
  const maxWidth = Math.max(...Object.values(levelWidths), 400)
  const totalW = maxWidth + PAD_X * 2
  const positioned = []; let currentY = PAD_Y
  Object.entries(levels).forEach(([, lvlNodes]) => {
    const rowW = lvlNodes.reduce((s, n) => s + n.w, 0) + (lvlNodes.length - 1) * H_GAP
    let startX = (totalW - rowW) / 2
    const rowH = Math.max(...lvlNodes.map(n => n.h))
    lvlNodes.forEach(n => { positioned.push({ ...n, x: startX, y: currentY }); startX += n.w + H_GAP })
    currentY += rowH + V_GAP
  })
  return { positioned, totalW, totalH: currentY + PAD_Y }
}

/* ── smooth bezier ────────────────────────────── */
function bezierV(x1, y1, x2, y2) {
  const dy = y2 - y1
  const cy1 = y1 + dy * 0.4
  const cy2 = y2 - dy * 0.4
  return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`
}

/* ── animated edge ────────────────────────────── */
function TreeEdge({ edge, from, to, index, visible, totalW }) {
  const cfg = STATUS_CFG[edge.status] || STATUS_CFG.TESTING
  const sw = edge.confidence >= 75 ? 3 : edge.confidence >= 40 ? 2 : 1.5
  const isInval = edge.status === 'INVALIDATED'
  const x1 = from.x + from.w / 2, y1 = from.y + from.h
  const x2 = to.x + to.w / 2, y2 = to.y
  const gradId = `edge-grad-${edge.from}-${edge.to}`
  const glowId = `edge-glow-${edge.from}-${edge.to}`
  const pathD = bezierV(x1, y1, x2, y2)

  return (
    <g>
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.stroke} stopOpacity={0.9} />
          <stop offset="100%" stopColor={cfg.stroke} stopOpacity={0.4} />
        </linearGradient>
        {cfg.glow && (
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* Glow layer for validated paths */}
      {cfg.glow && !isInval && (
        <motion.path d={pathD} fill="none" stroke={cfg.stroke} strokeWidth={sw + 4}
          opacity={0.15} filter={`url(#${glowId})`}
          initial={{ pathLength: 0 }} animate={{ pathLength: visible ? 1 : 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} />
      )}

      {/* Main line */}
      <motion.path d={pathD} fill="none" stroke={`url(#${gradId})`}
        strokeWidth={sw} strokeDasharray={cfg.dash || 'none'}
        opacity={isInval ? 0.25 : 0.8} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: visible ? 1 : 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} />

      {/* Animated dot flowing along validated paths */}
      {cfg.glow && !isInval && visible && (
        <circle r={3} fill={cfg.stroke} opacity={0.8}>
          <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
        </circle>
      )}
    </g>
  )
}

/* ── tree node ────────────────────────────────── */
function TreeNode({ node, visible }) {
  const isInvalidated = node.status === 'INVALIDATED'
  const cfg = node.status ? STATUS_CFG[node.status] || STATUS_CFG.TESTING : null
  const Icon = cfg?.icon || AlertTriangle
  const borderColor = node.type === 'alert' ? '#FF4D4D' : node.type === 'rootcause' ? '#00D4A0' : (cfg?.color || '#6B7280')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: visible ? (isInvalidated ? 0.4 : 1) : 0, scale: visible ? 1 : 0.85, y: visible ? 0 : 10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute"
          style={{ left: node.x, top: node.y, width: node.w }}
        >
          <Card className="p-2 hover:shadow-lg transition-all duration-200 h-full backdrop-blur-sm bg-white/95" style={{
            borderTop: `3px solid ${borderColor}`,
            boxShadow: visible && !isInvalidated && (node.type === 'rootcause' || node.status === 'VALIDATED')
              ? `0 4px 20px ${borderColor}20, 0 0 0 1px ${borderColor}15`
              : undefined,
          }}>
            {node.type === 'alert' && (
              <div className="text-center">
                <div className="w-6 h-6 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center mx-auto mb-1">
                  <AlertTriangle size={12} className="text-[#FF4D4D]" />
                </div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B7280] font-semibold">Alert Triggered</p>
                <p className="text-[12px] font-bold text-[#1D2433]">{node.sub}</p>
                <p className="text-[9px] text-[#6B7280] truncate">{node.detail}</p>
              </div>
            )}
            {(node.type === 'hypothesis' || node.type === 'sub') && (
              <div className="text-center">
                <p className={`text-[10px] font-semibold text-[#1D2433] ${isInvalidated ? 'line-through' : ''} line-clamp-2 leading-tight`}>
                  {node.prefix && <span className="text-[#6B7280] text-[9px]">{node.prefix}: </span>}
                  {node.title}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  {node.confidence != null && <Badge variant={CONF_BADGE(node.confidence)} className="text-[8px] px-1 py-0">{node.confidence}%</Badge>}
                  {cfg && (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 gap-0.5">
                      <Icon size={7} style={{ color: cfg.color }} />{node.status.charAt(0) + node.status.slice(1).toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {node.type === 'rootcause' && (
              <div className="text-center">
                <div className="w-6 h-6 rounded-full bg-[#00D4A0]/10 flex items-center justify-center mx-auto mb-1">
                  <CheckCircle size={12} className="text-[#00D4A0]" />
                </div>
                <p className="text-[9px] uppercase tracking-wider text-[#00D4A0] font-semibold">Root Cause</p>
                <p className="text-[10px] text-[#1D2433] line-clamp-2 leading-snug">{node.sub}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Badge variant="good" className="text-[8px] px-1 py-0">{node.confidence}%</Badge>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <p className="font-medium text-[11px]">{node.prefix ? `${node.prefix}: ` : ''}{node.title || node.sub}</p>
        {node.confidence != null && <p className="text-[10px]">Confidence: {node.confidence}%</p>}
        {node.evidenceCount > 0 && <p className="text-[10px]">{node.evidenceCount} evidence items</p>}
        {node.status && <p className="text-[10px]">Status: {node.status}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── dot grid background ──────────────────────── */
function DotGridBg({ width, height }) {
  const spacing = 20
  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="dot-grid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={spacing / 2} cy={spacing / 2} r={0.8} fill="#D1D5DB" opacity={0.5} />
        </pattern>
        <radialGradient id="canvas-fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F7F8FA" stopOpacity={0} />
          <stop offset="100%" stopColor="#F0F1F3" stopOpacity={0.6} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill="url(#dot-grid)" />
      <rect width={width} height={height} fill="url(#canvas-fade)" />
    </svg>
  )
}

/* ── main ─────────────────────────────────────── */
export default function ReasoningTree({ scenario }) {
  const { nodes, edges } = useMemo(() => buildTree(scenario), [scenario])
  const { positioned, totalW, totalH } = useMemo(() => layoutVertical(nodes), [nodes])
  const [fullscreen, setFullscreen] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [visibleCount, setVisibleCount] = useState(positioned.length)
  const [zoom, setZoom] = useState(1)
  const [exportMsg, setExportMsg] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef(null)

  const sortedNodes = useMemo(() => [...positioned].sort((a, b) => a.level - b.level || a.x - b.x), [positioned])
  const nodeMap = useMemo(() => { const m = {}; positioned.forEach(n => { m[n.id] = n }); return m }, [positioned])

  useEffect(() => {
    setVisibleCount(0); let i = 0
    const timer = setInterval(() => { i++; setVisibleCount(i); if (i >= sortedNodes.length) clearInterval(timer) }, 100)
    return () => clearInterval(timer)
  }, [sortedNodes.length])

  const replay = useCallback(() => {
    setReplaying(true); setVisibleCount(0); let i = 0
    const timer = setInterval(() => { i++; setVisibleCount(i); if (i >= sortedNodes.length) { clearInterval(timer); setReplaying(false) } }, 300)
  }, [sortedNodes.length])

  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2))
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5))
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom(z => Math.max(0.5, Math.min(2, z - e.deltaY * 0.002)))
    }
  }, [])

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }
  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    setPan({ x: dragStart.current.panX + (e.clientX - dragStart.current.x), y: dragStart.current.panY + (e.clientY - dragStart.current.y) })
  }, [dragging])
  const handleMouseUp = () => setDragging(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const canvasW = totalW / zoom + 40
  const canvasH = totalH / zoom + 40

  return (
    <div className={`relative ${fullscreen ? 'fixed inset-0 z-40 bg-white p-4 overflow-hidden' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= 0.5}><ZoomOut size={12} /></Button>
          <Button variant="outline" size="sm" onClick={resetView}><LocateFixed size={12} /></Button>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= 2}><ZoomIn size={12} /></Button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <Button variant="outline" size="sm" onClick={() => { setExportMsg('Exported as PNG'); setTimeout(() => setExportMsg(null), 2000) }} disabled={replaying}>
            <Download size={12} /> {exportMsg || 'Export'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />} {fullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <Button variant="outline" size="sm" onClick={replay} disabled={replaying}><Play size={12} /> {replaying ? 'Replaying...' : 'Replay'}</Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`rounded-xl border border-gray-100 overflow-hidden relative ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: fullscreen ? 'calc(100vh - 80px)' : `${Math.max(totalH * zoom + 40, 400)}px`, background: '#F7F8FA' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <DotGridBg width={Math.max(totalW * 2, 2000)} height={Math.max(totalH * 2, 2000)} />

        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top center',
          transition: dragging ? 'none' : 'transform 0.15s ease-out',
          width: totalW, height: totalH,
          position: 'relative',
          margin: '0 auto',
        }}>
          {/* SVG edges */}
          <svg width={totalW} height={totalH} className="absolute inset-0 pointer-events-none">
            {edges.map((edge, i) => {
              const from = nodeMap[edge.from]; const to = nodeMap[edge.to]
              if (!from || !to) return null
              const fi = sortedNodes.findIndex(n => n.id === from.id)
              const ti = sortedNodes.findIndex(n => n.id === to.id)
              const vis = fi < visibleCount && ti < visibleCount
              return <TreeEdge key={`${edge.from}-${edge.to}`} edge={edge} from={from} to={to} index={i} visible={vis} totalW={totalW} />
            })}
          </svg>

          {/* Nodes */}
          {sortedNodes.map((node, i) => <TreeNode key={node.id} node={node} visible={i < visibleCount} />)}
        </div>
      </div>

      {/* Zoom hint */}
      <p className="text-[10px] text-[#6B7280] mt-1.5 text-center">⌘/Ctrl + scroll to zoom · Drag to pan</p>
    </div>
  )
}
