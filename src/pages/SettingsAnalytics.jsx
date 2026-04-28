import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Archive, Download, Trash2, AlertCircle, Save,
  Shield, Bell, Clock, Brain, Gauge, UserCheck,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { memories as memData, skills as skillsData } from '../data'
import Evaluation from './Evaluation'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

const STATUS_DOT = { ACTIVE: '#00D4A0', PENDING: '#0B6ACB', STALE: '#6B7280', REVIEW: '#9333EA' }

/* ── Tab 1: Agent Configuration ──────────────── */
function ConfigTab() {
  const [depth, setDepth] = useState('standard')
  const [autoInv, setAutoInv] = useState('p1p2')
  const [memAuto, setMemAuto] = useState('on')
  const [retention, setRetention] = useState('90d')
  const [approvals, setApprovals] = useState({ incident: true, rollback: true, notifications: true, tickets: true })
  const [notifs, setNotifs] = useState({ slack: true, email: false, pagerduty: false, inapp: true })
  const [saved, setSaved] = useState(false)
  const [toasts, setToasts] = useState([])

  const toast = (msg) => {
    const tid = Date.now()
    setToasts(p => [...p, { id: tid, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3000)
  }

  const handleSave = () => {
    setSaved(true)
    toast('Settings saved')
    setTimeout(() => setSaved(false), 2000)
  }

  function SettingRow({ icon: Icon, label, desc, children }) {
    return (
      <div className="flex items-center justify-between py-4">
        <div className="flex items-start gap-3">
          <Icon size={16} className="text-[#6B7280] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-[#1D2433]">{label}</p>
            <p className="text-[11px] text-[#6B7280]">{desc}</p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {children}
        </div>
      </div>
    )
  }

  function OptionButton({ selected, label, onClick }) {
    return (
      <Button
        variant={selected ? 'default' : 'outline'}
        size="sm"
        className="text-[11px]"
        onClick={onClick}
      >
        {label}
      </Button>
    )
  }

  function CheckboxGroup({ options, values, onChange }) {
    return (
      <div className="flex gap-3 text-[11px]">
        {options.map(o => (
          <label key={o.key} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={values[o.key]}
              onChange={() => onChange({ ...values, [o.key]: !values[o.key] })}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[#0B6ACB]"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-[#1D2433] mb-1">Agent Behavior</h2>
        <p className="text-[11px] text-[#6B7280] mb-3">Control how the SRE Agent investigates and responds to incidents.</p>

        <SettingRow icon={Gauge} label="Investigation Depth" desc="How thorough each investigation should be">
          <OptionButton selected={depth === 'quick'} label="Quick (3m)" onClick={() => setDepth('quick')} />
          <OptionButton selected={depth === 'standard'} label="Standard (8m)" onClick={() => setDepth('standard')} />
          <OptionButton selected={depth === 'deep'} label="Deep (15m)" onClick={() => setDepth('deep')} />
        </SettingRow>
        <Separator />

        <SettingRow icon={Shield} label="Auto-investigate" desc="Which alerts trigger automatic investigation">
          <OptionButton selected={autoInv === 'all'} label="All alerts" onClick={() => setAutoInv('all')} />
          <OptionButton selected={autoInv === 'p1p2'} label="P1-P2 only" onClick={() => setAutoInv('p1p2')} />
          <OptionButton selected={autoInv === 'manual'} label="Manual only" onClick={() => setAutoInv('manual')} />
        </SettingRow>
        <Separator />

        <SettingRow icon={UserCheck} label="Human Approval Required" desc="Actions that need click-to-confirm">
          <CheckboxGroup
            options={[
              { key: 'incident', label: 'Incidents' },
              { key: 'rollback', label: 'Rollback' },
              { key: 'notifications', label: 'Notifications' },
              { key: 'tickets', label: 'Tickets' },
            ]}
            values={approvals}
            onChange={setApprovals}
          />
        </SettingRow>
        <Separator />

        <SettingRow icon={Brain} label="Memory Auto-creation" desc="When to save investigation learnings">
          <OptionButton selected={memAuto === 'on'} label="On" onClick={() => setMemAuto('on')} />
          <OptionButton selected={memAuto === 'suggest'} label="Suggest only" onClick={() => setMemAuto('suggest')} />
          <OptionButton selected={memAuto === 'off'} label="Off" onClick={() => setMemAuto('off')} />
        </SettingRow>
        <Separator />

        <SettingRow icon={Bell} label="Notification Preferences" desc="Where to receive investigation updates">
          <CheckboxGroup
            options={[
              { key: 'slack', label: 'Slack DM' },
              { key: 'email', label: 'Email' },
              { key: 'pagerduty', label: 'PagerDuty' },
              { key: 'inapp', label: 'In-app' },
            ]}
            values={notifs}
            onChange={setNotifs}
          />
        </SettingRow>
        <Separator />

        <SettingRow icon={Clock} label="Data Retention" desc="How long to keep investigation data">
          <OptionButton selected={retention === '90d'} label="90 days" onClick={() => setRetention('90d')} />
          <OptionButton selected={retention === '1y'} label="1 year" onClick={() => setRetention('1y')} />
          <OptionButton selected={retention === 'custom'} label="Custom" onClick={() => setRetention('custom')} />
        </SettingRow>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} className="text-[12px]">
            <Save size={13} /> {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[250px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Tab 2: Memory Admin (fixed data references) ── */
function MemoryAdminTab() {
  const [toasts, setToasts] = useState([])
  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  // Fixed: use correct data paths
  const allMems = memData.userMemories || []
  const stale = allMems.filter(m => m.status === 'STALE')
  const active = allMems.filter(m => m.status === 'ACTIVE')
  const pending = memData.orgMemories?.pending || []

  const stats = memData.stats || {}

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
      {/* Stats */}
      <motion.div variants={fadeUp} className="flex items-center gap-5">
        {[
          { label: 'Active', count: active.length, color: STATUS_DOT.ACTIVE },
          { label: 'Stale', count: stale.length, color: STATUS_DOT.STALE },
          { label: 'Org Approved', count: memData.orgMemories?.approved?.length || 0, color: STATUS_DOT.PENDING },
          { label: 'Pending Review', count: pending.length, color: STATUS_DOT.REVIEW },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[12px]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[#6B7280]">{s.label}:</span>
            <span className="font-semibold text-[#1D2433]">{s.count}</span>
          </div>
        ))}
      </motion.div>

      {/* Stale Memories */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#6B7280]" />
            <span className="text-[14px] font-semibold text-[#1D2433]">Stale Memories</span>
            <Badge variant="secondary">{stale.length}</Badge>
          </div>
          {stale.length === 0 ? <p className="text-[12px] text-[#6B7280] italic">No stale memories.</p> : (
            <div className="space-y-2">
              {stale.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F7F8FA]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1D2433] truncate">{m.title}</p>
                    <p className="text-[10px] text-[#6B7280]">Entity: {m.entity} · Used {m.timesUsed}x · Confidence: {m.confidence}%</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(`Archived: ${m.title}`)}><Archive size={10} /> Archive</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(`Reviewed: ${m.title}`)}>Review</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Pending Org Memories */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#9333EA]" />
            <span className="text-[14px] font-semibold text-[#1D2433]">Pending Team Memories</span>
            <Badge variant="secondary">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? <p className="text-[12px] text-[#6B7280] italic">No pending approvals.</p> : (
            <div className="space-y-2">
              {pending.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#9333EA]/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1D2433] truncate">{m.title}</p>
                    <p className="text-[10px] text-[#6B7280]">
                      Submitted by {m.submittedBy} · {m.corroborationCount} corroborations
                    </p>
                  </div>
                  <Button size="sm" className="text-[10px] h-6 bg-[#00D4A0] hover:bg-[#00C090]" onClick={() => toast(`Approved: ${m.title}`)}>Approve</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast(`Rejected: ${m.title}`)}>Reject</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Bulk Actions */}
      <motion.div variants={fadeUp} className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => toast('All stale memories archived')}><Archive size={12} /> Archive All Stale</Button>
        <Button variant="outline" size="sm" onClick={() => toast('Exported all memories as JSON')}><Download size={12} /> Export All (JSON)</Button>
        <Button variant="destructive" size="sm" onClick={() => toast('GDPR purge initiated')}><Trash2 size={12} /> GDPR Purge</Button>
      </motion.div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[250px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Tab 3: Skills & Agents ──────────────────── */
function SkillsAgentsTab() {
  const [skills, setSkills] = useState(skillsData.builtIn)
  const [agents, setAgents] = useState(skillsData.subAgents)
  const [expandedId, setExpandedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [toasts, setToasts] = useState([])

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }
  const toggleSkill = (id) => setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  const toggleAgent = (id) => setAgents(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))

  const ICONS = { BarChart3: '📊', FileText: '📄', GitBranch: '🔀', Box: '📦', Shield: '🛡️', Search: '🔍', Network: '🌐', DollarSign: '💰', Activity: '📈', ShieldAlert: '🔒' }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
      {/* Built-in Skills */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[15px] font-semibold text-[#1D2433]">Built-in Skills</h2>
            <Badge variant="secondary" className="text-[9px]">{skills.filter(s => s.enabled).length}/{skills.length} enabled</Badge>
          </div>

          <div className="space-y-0.5">
            {skills.map(skill => {
              const isExpanded = expandedId === skill.id
              return (
                <div key={skill.id} className={`rounded-lg transition-colors ${isExpanded ? 'bg-[#F7F8FA]' : ''}`}>
                  <div className="flex items-center gap-3 py-2.5 px-2">
                    <span className="text-[14px]">{ICONS[skill.icon] || '⚡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1D2433]">{skill.name}</p>
                      <p className="text-[11px] text-[#6B7280] truncate">{skill.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="purple" className="text-[8px]">MCP</Badge>
                      <span className="text-[10px] text-[#6B7280]">{skill.invocations} uses</span>
                      <Badge variant={skill.performance >= 90 ? 'good' : skill.performance >= 80 ? 'default' : 'secondary'} className="text-[9px]">{skill.performance}%</Badge>
                      <button onClick={() => toggleSkill(skill.id)}
                        className={`w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${skill.enabled ? 'bg-[#00D4A0] justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : skill.id)} className="text-[10px] text-[#0B6ACB] font-medium hover:underline">
                        {isExpanded ? 'Hide' : 'Configure'}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-2 pb-2.5 ml-8 space-y-2">
                      <Separator />
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <p className="text-[#6B7280]">Performance</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#00D4A0]" style={{ width: `${skill.performance}%` }} />
                            </div>
                            <span className="font-medium text-[#1D2433]">{skill.performance}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Total invocations</p>
                          <p className="font-medium text-[#1D2433] mt-0.5">{skill.invocations}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Status</p>
                          <Badge variant={skill.enabled ? 'good' : 'secondary'} className="text-[9px] mt-0.5">{skill.enabled ? 'Active' : 'Disabled'}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Sub-Agents */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <h2 className="text-[15px] font-semibold text-[#1D2433] mb-3">Sub-Agents</h2>
          <div className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#F7F8FA]">
                <span className="text-[14px]">{ICONS[agent.icon] || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1D2433]">{agent.name}</p>
                  <p className="text-[11px] text-[#6B7280]">{agent.description}</p>
                </div>
                <button onClick={() => toggleAgent(agent.id)}
                  className={`w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${agent.enabled ? 'bg-[#00D4A0] justify-end' : 'bg-gray-300 justify-start'}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Custom Skills */}
      <motion.div variants={fadeUp}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#1D2433]">Custom Skills</h2>
            <Button variant="outline" size="sm" className="text-[11px]" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? 'Cancel' : '+ Create Custom Skill'}
            </Button>
          </div>

          {showCreate && (
            <div className="bg-[#F7F8FA] rounded-lg p-3 space-y-2 mb-3">
              <div>
                <p className="text-[10px] text-[#6B7280] font-medium mb-1">Skill Name</p>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Custom Redis diagnostics" className="w-full px-2 py-1.5 border border-gray-200 rounded text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] font-medium mb-1">Description</p>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does this skill do?" className="w-full px-2 py-1.5 border border-gray-200 rounded text-[12px] focus:outline-none focus:border-[#0B6ACB]" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-[10px] h-6" disabled={!newName.trim()} onClick={() => { toast(`Skill "${newName}" created`); setNewName(''); setNewDesc(''); setShowCreate(false) }}>Create Skill</Button>
                <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toast('Import from Team coming soon')}>Import from Team</Button>
              </div>
            </div>
          )}

          <p className="text-[12px] text-[#6B7280] italic">No custom skills yet. Create one above or import from your team.</p>
        </Card>
      </motion.div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl border shadow-lg p-3 flex items-center gap-2 min-w-[250px]">
              <CheckCircle size={14} className="text-[#00D4A0]" /><span className="text-[12px] font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── main page ────────────────────────────────── */
export default function SettingsAnalytics() {
  return (
    <div>
      <h1 className="text-[18px] font-bold text-[#1D2433] mb-4">Settings</h1>
      <Tabs defaultValue="config">
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="skills">Skills & Agents</TabsTrigger>
          <TabsTrigger value="memory">Memory Admin</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        </TabsList>
        <TabsContent value="config"><ConfigTab /></TabsContent>
        <TabsContent value="skills"><SkillsAgentsTab /></TabsContent>
        <TabsContent value="memory"><MemoryAdminTab /></TabsContent>
        <TabsContent value="evaluation"><Evaluation /></TabsContent>
      </Tabs>
    </div>
  )
}
