import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Brain, AlertCircle, Bookmark, Star, Plus, Upload,
  Settings, Pencil, Archive, ArrowRight, CheckCircle, Clock,
  ChevronDown, RefreshCw, ShieldCheck, X, MessageSquare,
  BookOpen, Server, User, Users, FileUp, Clipboard, Code, Download, Trash2,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import { ScrollArea } from '../components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { memories as memData } from '../data'

const fadeUp = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }

const STATUS = {
  ACTIVE: { color: '#00D4A0', label: 'Active' },
  PENDING: { color: '#0B6ACB', label: 'Pending first use' },
  STALE: { color: '#6B7280', label: 'Stale — not used in 90+ days' },
  APPROVED: { color: '#00D4A0', label: 'Approved' },
  PENDING_APPROVAL: { color: '#F5A623', label: 'Awaiting admin approval' },
}

const CAT_ICON = { investigation_learning: Brain, correction: AlertCircle, bookmark: Bookmark }
const CAT_COLOR = { investigation_learning: '#0B6ACB', correction: '#F5A623', bookmark: '#9333EA' }
const DOMAIN_LABEL = { entity_quirks: 'Entity Quirk', execution_plans: 'SOP', noise_patterns: 'Noise Pattern', naming_conventions: 'Naming' }
const DOMAIN_COLOR = { entity_quirks: '#0B6ACB', execution_plans: '#00D4A0', noise_patterns: '#F5A623', naming_conventions: '#9333EA' }

function toast(setToasts, msg) { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[240px]">
            <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ═══ My Knowledge View ═══════════════════════ */
function MyKnowledgeView({ search, entityFilter, typeFilter, statusFilter }) {
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [sort, setSort] = useState('recent')
  const [toasts, setToasts] = useState([])

  const startEdit = (mem) => { setEditingId(mem.id); setEditTitle(mem.title); setEditContent(mem.content) }
  const cancelEdit = () => { setEditingId(null); setEditTitle(''); setEditContent('') }
  const saveEdit = () => {
    setEditSaving(true)
    setTimeout(() => { setEditSaving(false); setEditingId(null); toast(setToasts, 'Memory updated'); setEditTitle(''); setEditContent('') }, 800)
  }

  const SORTS = ['Recent', 'Confidence', 'Most Used']

  let items = [...memData.userMemories]
  if (search) { const q = search.toLowerCase(); items = items.filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)) }
  if (entityFilter) items = items.filter(m => m.entity === entityFilter)
  if (typeFilter === 'auto') items = items.filter(m => !m.isCorrection && !m.isBookmark)
  if (typeFilter === 'manual') items = items.filter(m => m.isCorrection || m.isBookmark)
  if (statusFilter && statusFilter !== 'all') items = items.filter(m => m.status === statusFilter)

  if (sort === 'Confidence') items.sort((a, b) => b.confidence - a.confidence)
  else if (sort === 'Most Used') items.sort((a, b) => b.timesUsed - a.timesUsed)

  // Group by entity
  const groups = {}
  items.forEach(m => { const key = m.entity || 'General'; if (!groups[key]) groups[key] = []; groups[key].push(m) })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1D2433]">My Knowledge</h2>
          <p className="text-[11px] text-[#6B7280]">Learned from your investigations — visible only to you</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length])}>
          Sort: {sort}
        </Button>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {Object.entries(groups).map(([entity, mems]) => (
          <motion.div key={entity} variants={fadeUp}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px]">{entity}</Badge>
              <span className="text-[10px] text-[#6B7280]">{mems.length} {mems.length === 1 ? 'memory' : 'memories'}</span>
            </div>
            <div className="space-y-1.5">
              {mems.map(mem => {
                const expanded = expandedId === mem.id
                const Icon = CAT_ICON[mem.category] || Brain
                const iconColor = CAT_COLOR[mem.category] || '#6B7280'
                const st = STATUS[mem.status] || STATUS.ACTIVE
                return (
                  <Card key={mem.id} className={`overflow-hidden transition-all ${expanded ? 'border-[#0B6ACB] shadow-sm' : 'hover:shadow-sm'}`}>
                    <button className="w-full text-left p-3 flex items-center gap-2.5" onClick={() => setExpandedId(expanded ? null : mem.id)}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconColor + '15' }}>
                        <Icon size={14} style={{ color: iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1D2433] truncate">{mem.title}</p>
                        <p className="text-[11px] text-[#6B7280] truncate">{mem.source} · {mem.createdAt}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip><TooltipTrigger><div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} /></TooltipTrigger>
                          <TooltipContent>{st.label}</TooltipContent></Tooltip>
                        {mem.timesUsed > 0 && <span className="text-[10px] text-[#6B7280]">{mem.timesUsed}x</span>}
                        <Badge variant={mem.confidence >= 90 ? 'good' : mem.confidence >= 70 ? 'default' : 'secondary'} className="text-[9px]">{mem.confidence}%</Badge>
                        <ChevronDown size={12} className={`text-[#6B7280] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3 pt-0">
                            <Separator className="mb-2" />
                            {editingId === mem.id ? (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[10px] font-medium text-[#6B7280] mb-1">Title</p>
                                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-[12px] h-8" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-[#6B7280] mb-1">Content</p>
                                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} className="text-[12px]" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm" className="text-[10px] h-6" onClick={saveEdit} disabled={editSaving || !editTitle.trim()}>
                                    {editSaving ? <><RefreshCw size={10} className="animate-spin" /> Saving...</> : <><CheckCircle size={10} /> Save</>}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={cancelEdit} disabled={editSaving}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-[12px] text-[#1D2433] leading-relaxed mb-3">{mem.content}</p>
                                <div className="flex items-center gap-1.5">
                                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => startEdit(mem)}><Pencil size={10} /> Edit</Button>
                                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Archived')}><Archive size={10} /> Archive</Button>
                                  <Tooltip><TooltipTrigger asChild>
                                    <Button size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Submitted for team approval')}>
                                      <ArrowRight size={10} /> Promote to Team
                                    </Button>
                                  </TooltipTrigger><TooltipContent>Submit for admin approval so all team members' agents learn this</TooltipContent></Tooltip>
                                  {mem.status === 'STALE' && (
                                    <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Re-validating...')}><RefreshCw size={10} /> Refresh</Button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-[12px] text-[#6B7280] italic text-center py-8">No memories match your filters.</p>}
      </motion.div>
      <Toasts toasts={toasts} />
    </div>
  )
}

/* ═══ Team Knowledge View ═════════════════════ */
function TeamKnowledgeView({ search, entityFilter, isAdmin }) {
  const [domain, setDomain] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [revokeConfirm, setRevokeConfirm] = useState(null)
  const [toasts, setToasts] = useState([])

  const startEdit = (mem) => { setEditingId(mem.id); setEditContent(mem.content) }
  const cancelEdit = () => { setEditingId(null); setEditContent('') }
  const saveEdit = () => {
    setEditSaving(true)
    setTimeout(() => { setEditSaving(false); setEditingId(null); toast(setToasts, 'Team memory updated'); setEditContent('') }, 800)
  }
  const confirmRevoke = (id) => { setRevokeConfirm(null); toast(setToasts, 'Memory revoked — team agents will no longer use this') }

  let items = [...memData.orgMemories.approved]
  if (search) { const q = search.toLowerCase(); items = items.filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)) }
  if (entityFilter) items = items.filter(m => m.entity === entityFilter)
  if (domain !== 'all') items = items.filter(m => m.domain === domain)

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#1D2433]">Team Knowledge</h2>
        <p className="text-[11px] text-[#6B7280]">Approved by admins — used by everyone's agent</p>
      </div>

      <div className="flex gap-1.5 mb-3">
        {['all', 'entity_quirks', 'execution_plans', 'noise_patterns', 'naming_conventions'].map(d => (
          <Badge key={d} variant={domain === d ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setDomain(d)}>
            {d === 'all' ? 'All' : DOMAIN_LABEL[d]}
          </Badge>
        ))}
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-1.5">
        {items.map(mem => {
          const expanded = expandedId === mem.id
          const dc = DOMAIN_COLOR[mem.domain] || '#6B7280'
          return (
            <Card key={mem.id} className="overflow-hidden" style={{ borderLeft: `3px solid ${dc}` }}>
              <button className="w-full text-left p-3 flex items-center gap-2.5" onClick={() => setExpandedId(expanded ? null : mem.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="secondary" className="text-[9px]" style={{ backgroundColor: dc + '15', color: dc }}>{DOMAIN_LABEL[mem.domain]}</Badge>
                    <span className="text-[13px] font-medium text-[#1D2433] truncate">{mem.title}</span>
                  </div>
                  {!expanded && <p className="text-[11px] text-[#6B7280] truncate">{mem.content}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {mem.entity && <Badge variant="outline" className="text-[9px]">{mem.entity}</Badge>}
                  <span className="text-[10px] text-[#6B7280] flex items-center gap-0.5"><Star size={9} className="text-[#F5A623]" />{mem.corroborationCount}</span>
                  <ChevronDown size={12} className={`text-[#6B7280] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-3 pb-3">
                      <Separator className="mb-2" />
                      {editingId === mem.id ? (
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-medium text-[#6B7280] mb-1">Content</p>
                            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} className="text-[12px]" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" className="text-[10px] h-6" onClick={saveEdit} disabled={editSaving || !editContent.trim()}>
                              {editSaving ? <><RefreshCw size={10} className="animate-spin" /> Saving...</> : <><CheckCircle size={10} /> Save</>}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={cancelEdit} disabled={editSaving}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[12px] text-[#1D2433] leading-relaxed mb-2">{mem.content}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mb-2">
                            <span>Submitted by {mem.submittedBy}</span>
                            <span>Approved by {mem.approvedBy}</span>
                            <span>{mem.approvedAt}</span>
                          </div>
                          {revokeConfirm === mem.id ? (
                            <div className="bg-[#FF4D4D]/5 border border-[#FF4D4D]/20 rounded-lg p-2 flex items-center gap-2">
                              <span className="text-[11px] text-[#FF4D4D]">Remove from team knowledge?</span>
                              <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => confirmRevoke(mem.id)}>Yes, Revoke</Button>
                              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => setRevokeConfirm(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {!isAdmin && (
                                <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Confirmed — thank you!')}>
                                  <Star size={10} /> I've seen this too
                                </Button>
                              )}
                              {isAdmin && (
                                <>
                                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => startEdit(mem)}><Pencil size={10} /> Edit</Button>
                                  <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => setRevokeConfirm(mem.id)}>Revoke</Button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
        {items.length === 0 && <p className="text-[12px] text-[#6B7280] italic text-center py-8">No team knowledge matches your filters.</p>}
      </motion.div>
      <Toasts toasts={toasts} />
    </div>
  )
}

/* ═══ Pending Review View ═════════════════════ */
function PendingReviewView({ isAdmin }) {
  const [toasts, setToasts] = useState([])
  const pending = memData.orgMemories.pending

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#1D2433]">Pending Review</h2>
        <p className="text-[11px] text-[#6B7280]">Submitted by team members, awaiting admin approval</p>
      </div>

      {isAdmin ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
          {pending.map(mem => (
            <motion.div key={mem.id} variants={fadeUp}>
              <Card className="p-3" style={{ borderLeft: '3px solid #F5A623' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="secondary" className="text-[9px]">{DOMAIN_LABEL[mem.domain] || mem.domain}</Badge>
                  <span className="text-[13px] font-semibold text-[#1D2433]">{mem.title}</span>
                  {mem.entity && <Badge variant="outline" className="text-[9px]">{mem.entity}</Badge>}
                </div>
                <p className="text-[12px] text-[#6B7280] leading-relaxed mb-2">{mem.content}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mb-2">
                  <span>By {mem.submittedBy} · {mem.submittedAt}</span>
                  {mem.corroborationCount > 1 && <Badge variant="warning" className="text-[9px]">{mem.corroborationCount} similar submissions</Badge>}
                  {mem.similarExisting && <span className="text-[#0B6ACB]">Similar to existing memory</span>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="text-[10px] h-6 bg-[#00D4A0] hover:bg-[#00C090]" onClick={() => toast(setToasts, `Approved: ${mem.title}`)}><CheckCircle size={10} /> Approve</Button>
                  <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Rejected')}>Reject</Button>
                  {mem.similarExisting && <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(setToasts, 'Merged')}>Merge with existing</Button>}
                </div>
              </Card>
            </motion.div>
          ))}
          {pending.length === 0 && <p className="text-[12px] text-[#6B7280] italic text-center py-8">No pending items.</p>}
        </motion.div>
      ) : (
        <Card className="p-4">
          <p className="text-[13px] text-[#6B7280]">{pending.length} items pending admin review</p>
          <div className="mt-2 space-y-1">
            {pending.map(p => (
              <p key={p.id} className="text-[12px] text-[#1D2433]">• {p.title} <span className="text-[#6B7280]">— by {p.submittedBy}</span></p>
            ))}
          </div>
        </Card>
      )}
      <Toasts toasts={toasts} />
    </div>
  )
}

/* ═══ Placeholder views for Prompt B/C ════════ */
/* ═══ Add New Memory Panel ════════════════════ */
function AddNewPanel({ onDone }) {
  const [memType, setMemType] = useState(null)
  const [visibility, setVisibility] = useState('me')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [entity, setEntity] = useState('')
  const [domainTag, setDomainTag] = useState('')
  const [toasts, setToasts] = useState([])

  const TYPES = [
    { key: 'note', icon: MessageSquare, color: '#0B6ACB', label: 'Quick Note', desc: 'Tell the agent something it should know', placeholder: 'e.g., Redis clusters use cache-prd-* naming' },
    { key: 'investigation', icon: Search, color: '#00D4A0', label: 'From Investigation', desc: 'Save a learning from a recent investigation', placeholder: 'e.g., checkout-service rollback pattern' },
    { key: 'runbook', icon: BookOpen, color: '#9333EA', label: 'Runbook / SOP', desc: 'Document a standard procedure', placeholder: 'e.g., Certificate rotation procedure', template: '## Steps\n1. \n2. \n3. \n\n## Notes\n' },
    { key: 'entity', icon: Server, color: '#F5A623', label: 'Entity Context', desc: 'Describe how a system works', placeholder: 'e.g., api-gateway architecture', template: '## Architecture\n\n## Dependencies\n\n## Known Patterns\n' },
  ]

  const selectType = (t) => {
    setMemType(t.key)
    setContent(t.template || '')
  }

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!title.trim()) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      toast(setToasts, visibility === 'team' ? 'Submitted for team approval' : 'Saved to My Knowledge')
      setTimeout(() => {
        setSaved(false)
        setMemType(null); setTitle(''); setContent(''); setEntity(''); setDomainTag('')
      }, 1500)
    }, 800)
  }

  const entities = [...new Set([...memData.userMemories.map(m => m.entity), ...memData.orgMemories.approved.map(m => m.entity)].filter(Boolean))].sort()

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-[#1D2433]">Add New Memory</h2>
        <p className="text-[11px] text-[#6B7280]">Teach the agent something new</p>
      </div>

      {/* Step 1: Type */}
      <div>
        <p className="text-[12px] font-medium text-[#6B7280] mb-2">What kind of memory?</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(t => (
            <Card key={t.key} className={`p-3 cursor-pointer transition-all ${memType === t.key ? 'border-[#0B6ACB] shadow-sm' : 'hover:shadow-sm'}`}
              onClick={() => selectType(t)}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.color + '15' }}>
                  <t.icon size={14} style={{ color: t.color }} />
                </div>
                <span className="text-[13px] font-medium text-[#1D2433]">{t.label}</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">{t.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Step 2: Visibility */}
      {memType && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[12px] font-medium text-[#6B7280] mb-2">Who should see it?</p>
          <div className="grid grid-cols-2 gap-2">
            <Card className={`p-3 cursor-pointer transition-all ${visibility === 'me' ? 'border-[#0B6ACB] shadow-sm' : 'hover:shadow-sm'}`}
              onClick={() => setVisibility('me')}>
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-[#0B6ACB]" />
                <span className="text-[13px] font-medium text-[#1D2433]">Just me</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Saves to My Knowledge immediately. Only your agent will use this.</p>
            </Card>
            <Card className={`p-3 cursor-pointer transition-all ${visibility === 'team' ? 'border-[#00D4A0] shadow-sm' : 'hover:shadow-sm'}`}
              onClick={() => setVisibility('team')}>
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-[#00D4A0]" />
                <span className="text-[13px] font-medium text-[#1D2433]">My team</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Submits for admin approval. Once approved, everyone's agent learns this.</p>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Step 3: Content */}
      {memType && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <div>
            <p className="text-[12px] font-medium text-[#6B7280] mb-1">Title</p>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={TYPES.find(t => t.key === memType)?.placeholder || 'Memory title...'} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280] mb-1">Content</p>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Describe what the agent should know..." className="font-mono text-[12px]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[12px] font-medium text-[#6B7280] mb-1">Entity (optional)</p>
              <div className="flex gap-1 flex-wrap">
                <Badge variant={!entity ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setEntity('')}>None</Badge>
                {entities.map(e => (
                  <Badge key={e} variant={entity === e ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setEntity(e)}>{e}</Badge>
                ))}
              </div>
            </div>
            {visibility === 'team' && (
              <div className="flex-1">
                <p className="text-[12px] font-medium text-[#6B7280] mb-1">Domain (optional)</p>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(DOMAIN_LABEL).map(([k, v]) => (
                    <Badge key={k} variant={domainTag === k ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setDomainTag(domainTag === k ? '' : k)}>{v}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!title.trim() || saving || saved}
              className={saved ? 'bg-[#00D4A0] hover:bg-[#00D4A0]' : ''}>
              {saving && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={12} />
                </motion.div>
              )}
              {saved && <CheckCircle size={12} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : visibility === 'team' ? 'Submit for Approval' : 'Save Memory'}
            </Button>
            <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
          </div>
        </motion.div>
      )}
      <Toasts toasts={toasts} />
    </div>
  )
}

/* ═══ Upload / Import Panel ═══════════════════ */
function UploadImportPanel({ onDone }) {
  const [expandedCard, setExpandedCard] = useState(null)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [pasteVisibility, setPasteVisibility] = useState('me')
  const [fileSelected, setFileSelected] = useState(null)
  const [confluenceUrl, setConfluenceUrl] = useState('')
  const [confluenceLoaded, setConfluenceLoaded] = useState(false)
  const [toasts, setToasts] = useState([])

  const toggle = (id) => setExpandedCard(expandedCard === id ? null : id)

  const CARDS = [
    { id: 'paste', icon: Clipboard, label: 'Paste Text', desc: 'Paste a runbook, note, or any text' },
    { id: 'file', icon: FileUp, label: 'Upload File', desc: 'Drag & drop or browse (.md, .txt, .json, .yaml)' },
    { id: 'confluence', icon: BookOpen, label: 'Import from Confluence', desc: 'Fetch a page by URL' },
    { id: 'bits', icon: Code, label: 'Import from bits.md', desc: 'For teams migrating from Datadog' },
  ]

  const mockFileSelect = () => setFileSelected({ name: 'runbook-checkout-rollback.md', size: '4.2 KB', preview: '## Checkout Service Rollback\n\n1. Identify target version in ArgoCD\n2. Run argocd app rollback checkout-service\n3. Verify pods healthy\n4. Confirm metrics normalized...' })
  const mockConfluenceFetch = () => { setConfluenceLoaded(false); setTimeout(() => setConfluenceLoaded(true), 1200) }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-[#1D2433]">Upload / Import</h2>
        <p className="text-[11px] text-[#6B7280]">Bring in knowledge from other sources</p>
      </div>

      <div className="space-y-2">
        {CARDS.map(c => (
          <Card key={c.id} className={`overflow-hidden transition-all ${expandedCard === c.id ? 'border-[#0B6ACB]' : ''}`}>
            <button className="w-full text-left p-3 flex items-center gap-3" onClick={() => toggle(c.id)}>
              <div className="w-8 h-8 rounded-lg bg-[#0B6ACB]/10 flex items-center justify-center shrink-0">
                <c.icon size={16} className="text-[#0B6ACB]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#1D2433]">{c.label}</p>
                <p className="text-[11px] text-[#6B7280]">{c.desc}</p>
              </div>
              <ChevronDown size={14} className={`text-[#6B7280] transition-transform ${expandedCard === c.id ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {expandedCard === c.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    <Separator />

                    {/* Paste */}
                    {c.id === 'paste' && (
                      <>
                        <Input value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} placeholder="Title for this memory..." className="text-[12px]" />
                        <Textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} rows={8} placeholder="Paste your content here..." className="font-mono text-[12px]" />
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#6B7280]">Save to:</span>
                          <Badge variant={pasteVisibility === 'me' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setPasteVisibility('me')}>Just me</Badge>
                          <Badge variant={pasteVisibility === 'team' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setPasteVisibility('team')}>My team</Badge>
                        </div>
                        <Button size="sm" disabled={!pasteTitle.trim() || !pasteContent.trim()} onClick={() => { toast(setToasts, 'Saved as memory'); setPasteTitle(''); setPasteContent('') }}>
                          Save as Memory
                        </Button>
                      </>
                    )}

                    {/* File Upload */}
                    {c.id === 'file' && (
                      <>
                        {!fileSelected ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#0B6ACB]/40 transition-colors"
                            onClick={mockFileSelect}>
                            <FileUp size={20} className="text-[#6B7280] mx-auto mb-2" />
                            <p className="text-[12px] text-[#6B7280]">Drop file here or click to browse</p>
                            <p className="text-[10px] text-[#D1D5DB] mt-1">.md, .txt, .json, .yaml</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 bg-[#F7F8FA] rounded-lg p-2">
                              <FileUp size={14} className="text-[#0B6ACB]" />
                              <span className="text-[12px] font-medium text-[#1D2433]">{fileSelected.name}</span>
                              <span className="text-[10px] text-[#6B7280]">{fileSelected.size}</span>
                              <Button variant="ghost" size="sm" className="ml-auto text-[10px] h-5" onClick={() => setFileSelected(null)}><X size={10} /> Remove</Button>
                            </div>
                            <div className="bg-[#1D252C] rounded-lg p-3 text-[11px] font-mono text-[#E5E7EB] max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                              {fileSelected.preview}
                            </div>
                            <Button size="sm" onClick={() => { toast(setToasts, 'Imported as memory'); setFileSelected(null) }}>Import as Memory</Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Confluence */}
                    {c.id === 'confluence' && (
                      <>
                        <div className="flex gap-2">
                          <Input value={confluenceUrl} onChange={e => setConfluenceUrl(e.target.value)} placeholder="https://yoursite.atlassian.net/wiki/..." className="flex-1 text-[12px]" />
                          <Button size="sm" onClick={mockConfluenceFetch} disabled={!confluenceUrl.trim()}>Fetch Page</Button>
                        </div>
                        {confluenceLoaded && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <div className="bg-[#F7F8FA] rounded-lg p-3">
                              <p className="text-[12px] font-medium text-[#1D2433]">Checkout Service Runbook</p>
                              <p className="text-[10px] text-[#6B7280]">2,400 words · Last updated Mar 28, 2026 · Space: ENG</p>
                            </div>
                            <Button size="sm" onClick={() => { toast(setToasts, 'Imported from Confluence'); setConfluenceUrl(''); setConfluenceLoaded(false) }}>Import</Button>
                          </motion.div>
                        )}
                        {confluenceUrl && !confluenceLoaded && (
                          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                            <div className="w-3 h-3 border-2 border-[#0B6ACB] border-t-transparent rounded-full animate-spin" />
                            Fetching page...
                          </div>
                        )}
                      </>
                    )}

                    {/* bits.md */}
                    {c.id === 'bits' && (
                      <>
                        <p className="text-[11px] text-[#6B7280]">This will parse your bits.md file into structured memories, one per section.</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#9333EA]/40 transition-colors"
                          onClick={() => toast(setToasts, 'Parsed 8 memories from bits.md')}>
                          <Code size={18} className="text-[#9333EA] mx-auto mb-2" />
                          <p className="text-[12px] text-[#6B7280]">Drop bits.md file here</p>
                          <p className="text-[10px] text-[#D1D5DB] mt-1">.md files only</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={onDone}>← Back to Memory</Button>
      <Toasts toasts={toasts} />
    </div>
  )
}
/* ═══ Learning Settings Panel ═════════════════ */
function LearningSettingsPanel({ onDone }) {
  const [prefs, setPrefs] = useState(memData.userPreferences)
  const [envChips, setEnvChips] = useState(memData.userPreferences.find(p => p.key === 'envFilter')?.value || [])
  const [newEnv, setNewEnv] = useState('')
  const [autoLearn, setAutoLearn] = useState('on')
  const [autoCorrections, setAutoCorrections] = useState(true)
  const [autoPromote, setAutoPromote] = useState(false)
  const [staleThreshold, setStaleThreshold] = useState('90')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toasts, setToasts] = useState([])

  const updatePref = (id, value) => { setPrefs(p => p.map(pr => pr.id === id ? { ...pr, value } : pr)); toast(setToasts, `Updated: ${value}`) }
  const addEnv = () => { if (newEnv.trim() && !envChips.includes(newEnv.trim())) { setEnvChips(c => [...c, newEnv.trim()]); setNewEnv('') } }
  const removeEnv = (v) => setEnvChips(c => c.filter(x => x !== v))

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-[#1D2433]">Learning Settings</h2>
        <p className="text-[11px] text-[#6B7280]">Control how the agent learns and what it remembers</p>
      </div>

      {/* ── Section A: Preferences ── */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-semibold text-[#1D2433]">My Preferences</h3>
          <Badge variant="default" className="text-[9px]">Cross-Agent</Badge>
        </div>

        {prefs.filter(p => p.type !== 'chips').map(pref => (
          <div key={pref.id}>
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-[13px] font-medium text-[#1D2433]">{pref.label}</p>
                <p className="text-[11px] text-[#6B7280]">{pref.description}</p>
              </div>
              <div className="flex gap-1">
                {pref.options.map(opt => (
                  <Button key={opt} variant={pref.value === opt ? 'default' : 'outline'} size="sm" className="text-[10px] h-6"
                    onClick={() => updatePref(pref.id, opt)}>{opt}</Button>
                ))}
              </div>
            </div>
            <Separator />
          </div>
        ))}

        {/* Env filter */}
        <div className="py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <p className="text-[13px] font-medium text-[#1D2433]">Environment Filter</p>
              <p className="text-[11px] text-[#6B7280]">Default environments to exclude from queries</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {envChips.map(c => (
              <Badge key={c} variant="default" className="text-[10px] gap-1">{c} <button onClick={() => removeEnv(c)}><X size={9} /></button></Badge>
            ))}
            <div className="flex gap-1">
              <Input value={newEnv} onChange={e => setNewEnv(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEnv()} placeholder="Add..." className="h-6 w-20 text-[10px]" />
              <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={addEnv}>Add</Button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#6B7280] mt-2">These preferences are shared across all New Relic AI agents.</p>
      </Card>

      {/* ── Section B: Auto-Learning ── */}
      <Card className="p-4">
        <h3 className="text-[14px] font-semibold text-[#1D2433] mb-3">Auto-Learning Rules</h3>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Save investigation learnings automatically</p>
            <p className="text-[11px] text-[#6B7280]">After each investigation, extract key patterns</p>
          </div>
          <div className="flex gap-1">
            {[{ label: 'On', value: 'on' }, { label: 'Suggest Only', value: 'suggest' }, { label: 'Off', value: 'off' }].map(opt => (
              <Button key={opt.value} variant={autoLearn === opt.value ? 'default' : 'outline'}
                size="sm" className="text-[10px] h-6"
                onClick={() => setAutoLearn(opt.value)}>{opt.label}</Button>
            ))}
          </div>
        </div>
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Save corrections when I disagree</p>
            <p className="text-[11px] text-[#6B7280]">When you use Disagree on a hypothesis, save your correction</p>
          </div>
          <div className="flex gap-1">
            {[true, false].map(v => (
              <Button key={String(v)} variant={autoCorrections === v ? 'default' : 'outline'} size="sm" className="text-[10px] h-6"
                onClick={() => setAutoCorrections(v)}>{v ? 'On' : 'Off'}</Button>
            ))}
          </div>
        </div>
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Auto-promote high-confidence learnings</p>
            <p className="text-[11px] text-[#6B7280]">Automatically submit to Team Knowledge when confidence &gt; 90%</p>
          </div>
          <div className="flex gap-1">
            {[true, false].map(v => (
              <Button key={String(v)} variant={autoPromote === v ? 'default' : 'outline'} size="sm" className="text-[10px] h-6"
                onClick={() => setAutoPromote(v)}>{v ? 'On' : 'Off'}</Button>
            ))}
          </div>
        </div>
        {autoPromote && (
          <p className="text-[10px] text-[#F5A623] mt-1 ml-0.5">Submitted items still require admin approval before they're visible to the team.</p>
        )}
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Stale memory threshold</p>
            <p className="text-[11px] text-[#6B7280]">How long before unused memories are marked stale</p>
          </div>
          <div className="flex gap-1">
            {[{ v: '60', l: '60 days' }, { v: '90', l: '90 days' }, { v: '180', l: '180 days' }, { v: 'never', l: 'Never' }].map(opt => (
              <Button key={opt.v} variant={staleThreshold === opt.v ? 'default' : 'outline'} size="sm" className="text-[10px] h-6"
                onClick={() => setStaleThreshold(opt.v)}>{opt.l}</Button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Section C: Data & Privacy ── */}
      <Card className="p-4">
        <h3 className="text-[14px] font-semibold text-[#1D2433] mb-3">Data & Privacy</h3>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Export my memories</p>
            <p className="text-[11px] text-[#6B7280]">Download all your personal memories as JSON</p>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => toast(setToasts, 'Exported memories.json')}>
            <Download size={11} /> Export JSON
          </Button>
        </div>
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Delete all my memories</p>
            <p className="text-[11px] text-[#6B7280]">Permanently remove all your personal memories</p>
          </div>
          {!deleteConfirm ? (
            <Button variant="destructive" size="sm" className="text-[10px] h-7" onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={11} /> Delete All
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button variant="destructive" size="sm" className="text-[10px] h-7" onClick={() => { toast(setToasts, 'All memories deleted'); setDeleteConfirm(false) }}>
                Yes, delete everything
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">GDPR Data Request</p>
            <p className="text-[11px] text-[#6B7280]">Request a full export of all data the agent has about you</p>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => toast(setToasts, 'GDPR export requested — you\'ll receive an email')}>
            Request Export
          </Button>
        </div>
        <Separator />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">Data Retention</p>
            <p className="text-[11px] text-[#6B7280]">Memories older than the retention period are automatically purged</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">Org Policy</Badge>
            <span className="text-[12px] font-medium text-[#1D2433]">90 days</span>
          </div>
        </div>
      </Card>

      <Button variant="ghost" size="sm" onClick={onDone}>← Back to Memory</Button>
      <Toasts toasts={toasts} />
    </div>
  )
}

/* ═══ Search Results View ═════════════════════ */
function SearchResultsView({ query }) {
  const all = [
    ...memData.userMemories.map(m => ({ ...m, scope: 'Personal' })),
    ...memData.orgMemories.approved.map(m => ({ ...m, scope: 'Team' })),
    ...memData.orgMemories.pending.map(m => ({ ...m, scope: 'Pending' })),
  ]
  const q = query.toLowerCase()
  const results = all.filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q))

  const grouped = { Personal: [], Team: [], Pending: [] }
  results.forEach(r => grouped[r.scope].push(r))

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-[#1D2433] mb-1">Search: "{query}"</h2>
      <p className="text-[11px] text-[#6B7280] mb-3">{results.length} results across all memory</p>
      {Object.entries(grouped).filter(([, items]) => items.length > 0).map(([scope, items]) => (
        <div key={scope} className="mb-4">
          <Badge variant={scope === 'Personal' ? 'default' : scope === 'Team' ? 'good' : 'warning'} className="text-[10px] mb-2">{scope}</Badge>
          <div className="space-y-1">
            {items.map(m => (
              <Card key={m.id} className="p-2.5">
                <p className="text-[12px] font-medium text-[#1D2433]">{m.title}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{m.content}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {results.length === 0 && <p className="text-[12px] text-[#6B7280] italic text-center py-8">No results found.</p>}
    </div>
  )
}

/* ═══ MAIN PAGE ═══════════════════════════════ */
export default function MemoryExplorer() {
  const [scope, setScope] = useState('my')
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [isAdmin, setIsAdmin] = useState(true)
  const [activeAction, setActiveAction] = useState(null) // 'add' | 'upload' | 'settings' | null

  const entities = useMemo(() => {
    const set = new Set()
    memData.userMemories.forEach(m => m.entity && set.add(m.entity))
    memData.orgMemories.approved.forEach(m => m.entity && set.add(m.entity))
    return [...set].sort()
  }, [])

  const totalCount = memData.userMemories.length + memData.orgMemories.approved.length

  const clearFilters = () => { setEntityFilter(null); setTypeFilter(null); setStatusFilter(null) }
  const isSearching = search.length > 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[18px] font-bold text-[#1D2433]">Memory</h1>
        <p className="text-[13px] text-[#6B7280]">What the agent knows and learns</p>
      </div>

      <div className="flex gap-4 min-h-[calc(100vh-160px)]">

        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="w-[220px] shrink-0 bg-[#F7F8FA] rounded-xl border border-gray-100 flex flex-col">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setActiveAction(null) }}
                placeholder="Search all memory..." className="pl-8 h-8 text-[11px] bg-white" />
              {search && <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}><X size={12} className="text-[#6B7280]" /></button>}
            </div>
          </div>

          <Separator />

          {/* Scope */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Scope</p>
            {[
              { key: 'my', label: 'My Knowledge', count: memData.stats.userMemoryCount },
              { key: 'team', label: 'Team Knowledge', count: memData.stats.orgApprovedCount },
              { key: 'pending', label: 'Pending Review', count: memData.stats.orgPendingCount, amber: true },
            ].map(s => (
              <button key={s.key} onClick={() => { setScope(s.key); setActiveAction(null); setSearch('') }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-left transition-all ${
                  scope === s.key && !isSearching && !activeAction
                    ? 'bg-white border border-gray-200 shadow-sm font-medium text-[#1D2433]'
                    : 'text-[#6B7280] hover:bg-white/50'
                }`}>
                {s.amber && s.count > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />}
                <span className="flex-1">{s.label}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5">{s.count}</Badge>
              </button>
            ))}
          </div>

          <Separator />

          {/* Filters */}
          <div className="p-3 space-y-2">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Filter by</p>
            {/* Entity */}
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1">Entity</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={!entityFilter ? 'default' : 'outline'} className="cursor-pointer text-[9px]" onClick={() => setEntityFilter(null)}>All</Badge>
                {entities.map(e => (
                  <Badge key={e} variant={entityFilter === e ? 'default' : 'outline'} className="cursor-pointer text-[9px]" onClick={() => setEntityFilter(entityFilter === e ? null : e)}>{e}</Badge>
                ))}
              </div>
            </div>
            {/* Type */}
            {scope === 'my' && (
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Type</p>
                <div className="flex gap-1">
                  {[null, 'auto', 'manual'].map(t => (
                    <Badge key={String(t)} variant={typeFilter === t ? 'default' : 'outline'} className="cursor-pointer text-[9px]" onClick={() => setTypeFilter(t)}>
                      {t === null ? 'All' : t === 'auto' ? 'Auto' : 'Manual'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Status */}
            {scope === 'my' && (
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Status</p>
                <div className="flex gap-1">
                  {['all', 'ACTIVE', 'PENDING', 'STALE'].map(s => (
                    <Badge key={s} variant={statusFilter === (s === 'all' ? null : s) || (s === 'all' && !statusFilter) ? 'default' : 'outline'}
                      className="cursor-pointer text-[9px]" onClick={() => setStatusFilter(s === 'all' ? null : s)}>
                      {s === 'all' ? 'All' : STATUS[s]?.label.split(' ')[0] || s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(entityFilter || typeFilter || statusFilter) && (
              <Button variant="ghost" size="sm" className="text-[10px] h-5 px-1" onClick={clearFilters}>Clear filters</Button>
            )}
          </div>

          <Separator />

          {/* Admin toggle */}
          <div className="px-3 py-2">
            <button className="flex items-center gap-1.5 text-[11px] text-[#6B7280] hover:text-[#1D2433]" onClick={() => setIsAdmin(!isAdmin)}>
              <ShieldCheck size={12} className={isAdmin ? 'text-[#0B6ACB]' : ''} />
              Role: {isAdmin ? 'Admin' : 'Standard'}
            </button>
          </div>

          <div className="flex-1" />

          <Separator />

          {/* Actions */}
          <div className="p-2 space-y-0.5">
            <Button variant={activeAction === 'add' ? 'default' : 'ghost'} className="w-full justify-start text-[12px] h-8"
              onClick={() => { setActiveAction(activeAction === 'add' ? null : 'add'); setSearch('') }}>
              <Plus size={13} /> Add New
            </Button>
            <Button variant={activeAction === 'upload' ? 'default' : 'ghost'} className="w-full justify-start text-[12px] h-8"
              onClick={() => { setActiveAction(activeAction === 'upload' ? null : 'upload'); setSearch('') }}>
              <Upload size={13} /> Upload / Import
            </Button>
            <Button variant={activeAction === 'settings' ? 'default' : 'ghost'} className="w-full justify-start text-[12px] h-8"
              onClick={() => { setActiveAction(activeAction === 'settings' ? null : 'settings'); setSearch('') }}>
              <Settings size={13} /> Learning Settings
            </Button>
          </div>

          <Separator />
          <p className="px-3 py-2 text-[10px] text-[#6B7280]">{totalCount} memories · {memData.stats.userMemoryCount} personal · {memData.stats.orgApprovedCount} team</p>
        </div>

        {/* ═══ MAIN AREA ═══ */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={isSearching ? 'search' : activeAction || scope} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {isSearching && <SearchResultsView query={search} />}
              {!isSearching && activeAction === 'add' && <AddNewPanel onDone={() => setActiveAction(null)} />}
              {!isSearching && activeAction === 'upload' && <UploadImportPanel onDone={() => setActiveAction(null)} />}
              {!isSearching && activeAction === 'settings' && <LearningSettingsPanel onDone={() => setActiveAction(null)} />}
              {!isSearching && !activeAction && scope === 'my' && <MyKnowledgeView search="" entityFilter={entityFilter} typeFilter={typeFilter} statusFilter={statusFilter} />}
              {!isSearching && !activeAction && scope === 'team' && <TeamKnowledgeView search="" entityFilter={entityFilter} isAdmin={isAdmin} />}
              {!isSearching && !activeAction && scope === 'pending' && <PendingReviewView isAdmin={isAdmin} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
