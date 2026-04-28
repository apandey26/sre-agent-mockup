import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Ticket, AlertCircle, MessageSquare, Users, Video,
  GitBranch, RefreshCw, BookOpen, FileText, CheckSquare,
  Layers, Cloud, BarChart3, Database, Bug, Plug, Check, CheckCircle,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { integrations as intData } from '../data'

const ICONS = { Bell, Ticket, AlertCircle, MessageSquare, Users, Video, GitBranch, RefreshCw, BookOpen, FileText, CheckSquare, Layers, Cloud, BarChart3, Database, Bug }

const STATUS_DOT = { connected: '#00D4A0', disconnected: '#D1D5DB', error: '#FF4D4D' }
const STATUS_VARIANT = { connected: 'good', disconnected: 'secondary', error: 'destructive' }

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }

export default function Integrations() {
  const [items, setItems] = useState(intData.integrations)
  const [expandedId, setExpandedId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [testingId, setTestingId] = useState(null)

  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const testConnection = (item) => {
    setTestingId(item.id)
    setTimeout(() => {
      setTestingId(null)
      toast(`${item.name}: Connection healthy`)
    }, 1200)
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)
  const toggleConnect = (id) => {
    const item = items.find(i => i.id === id)
    const wasConnected = item?.status === 'connected'
    setItems(prev => prev.map(i =>
      i.id === id
        ? { ...i, status: wasConnected ? 'disconnected' : 'connected', lastSync: wasConnected ? null : 'Just now', dataStats: wasConnected ? null : 'Syncing...' }
        : i
    ))
    toast(wasConnected ? `${item?.name} disconnected` : `${item?.name} connected successfully`)
  }

  // Group by tier
  const tiers = [1, 2, 3, 4, 5, 6]
  const grouped = tiers.map(t => ({
    tier: t,
    tierName: items.find(i => i.tier === t)?.tierName || `Tier ${t}`,
    items: items.filter(i => i.tier === t),
  }))

  const connectedCount = items.filter(i => i.status === 'connected').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[18px] font-bold text-[#1D2433]">Integrations Hub</h1>
          <Badge variant="good">{connectedCount}/{items.length} connected</Badge>
        </div>
        <Button size="sm" onClick={() => toast('Opening integration marketplace...')}><Plug size={12} /> Connect Integration</Button>
      </div>

      {/* Tier sections */}
      <div className="space-y-6">
        {grouped.map(group => {
          const tierConnected = group.items.filter(i => i.status === 'connected').length
          return (
            <motion.div key={group.tier} variants={stagger} initial="hidden" animate="show">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[14px] font-semibold text-[#1D2433]">{group.tierName}</h2>
                <Badge variant="secondary" className="text-[10px]">{tierConnected} connected</Badge>
                {group.tier === 5 && <Badge variant="default" className="text-[9px]">NR-managed</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {group.items.map(item => {
                  const Icon = ICONS[item.icon] || Plug
                  const isExpanded = expandedId === item.id
                  const isConnected = item.status === 'connected'

                  return (
                    <motion.div key={item.id} variants={fadeUp}>
                      <Card
                        className={`overflow-hidden transition-colors cursor-pointer ${isConnected ? 'border-l-[3px] border-l-[#00D4A0]' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="p-3">
                          {/* Top row */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon size={16} className={isConnected ? 'text-[#1D2433]' : 'text-[#6B7280]'} />
                            <span className="text-[13px] font-semibold text-[#1D2433] flex-1">{item.name}</span>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_DOT[item.status] }} />
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <Badge variant={STATUS_VARIANT[item.status]} className="text-[9px]">{item.status}</Badge>
                          </div>

                          {/* Info */}
                          {isConnected ? (
                            <div className="text-[11px] text-[#6B7280] space-y-0.5">
                              <p>Last sync: {item.lastSync}</p>
                              {item.dataStats && <p>{item.dataStats}</p>}
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#6B7280]">Not connected</p>
                          )}

                          {/* Button */}
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            {isConnected ? (
                              <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => toggleExpand(item.id)}>Configure</Button>
                            ) : (
                              <Button size="sm" className="text-[10px] h-6" onClick={() => toggleConnect(item.id)}>Connect</Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded config panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                              onClick={e => e.stopPropagation()}
                            >
                              <Separator />
                              <div className="p-3 bg-[#F7F8FA] space-y-2.5">
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">What SRE Agent reads</p>
                                  <p className="text-[12px] text-[#1D2433]">{item.pulls}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">What SRE Agent writes</p>
                                  <p className="text-[12px] text-[#1D2433]">{item.pushes || 'Read-only'}</p>
                                </div>

                                <Separator />

                                <div className="flex items-center gap-2 text-[11px]">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-gray-300 text-[#0B6ACB]" /> Read
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" defaultChecked={!!item.pushes} className="w-3 h-3 rounded border-gray-300 text-[#0B6ACB]" /> Write
                                  </label>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isConnected ? (
                                    <>
                                      <Button variant="outline" size="sm" className="text-[10px] h-6"
                                        disabled={testingId === item.id}
                                        onClick={() => testConnection(item)}>
                                        {testingId === item.id ? <><RefreshCw size={10} className="animate-spin" /> Testing...</> : 'Test Connection'}
                                      </Button>
                                      <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => toggleConnect(item.id)}>Disconnect</Button>
                                    </>
                                  ) : (
                                    <Button size="sm" className="text-[10px] h-6" onClick={() => toggleConnect(item.id)}>Connect with OAuth</Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

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

      {/* Health Dashboard */}
      <div className="mt-8">
        <Card className="p-4">
          <h2 className="text-[14px] font-semibold text-[#1D2433] mb-4">Integration Health</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-1">Connected</p>
              <p className="text-[20px] font-bold text-[#1D2433]">{intData.health.connectedCount}<span className="text-[13px] font-normal text-[#6B7280]">/{intData.health.totalCount}</span></p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-1">Error Rate</p>
              <p className="text-[20px] font-bold text-[#00D4A0]">{intData.health.errorRate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2">Most Used in Investigations</p>
              <div className="space-y-1.5">
                {intData.health.topUsed.slice(0, 5).map(item => (
                  <HealthBar key={item.name} name={item.name} percent={item.usagePercent} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function HealthBar({ name, percent }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth(percent), 100); return () => clearTimeout(t) }, [percent])
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#1D2433] w-[90px] truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600 ease-out"
          style={{ width: `${width}%`, backgroundColor: percent > 70 ? '#00D4A0' : '#0B6ACB' }}
        />
      </div>
      <span className="text-[10px] text-[#6B7280] w-[30px] text-right">{percent}%</span>
    </div>
  )
}
