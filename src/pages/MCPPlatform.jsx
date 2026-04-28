import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Zap, Clock, CheckCircle, Activity, ChevronDown,
  Copy, ExternalLink, Shield, Key,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { mcpPlatform } from '../data'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'

const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

const TYPE_STYLE = {
  'First-Party': { bg: 'bg-[#0B6ACB]/8', text: 'text-[#0B6ACB]' },
  'External Platform': { bg: 'bg-[#9333EA]/8', text: 'text-[#7C3AED]' },
  'Customer Agent': { bg: 'bg-[#00D4A0]/8', text: 'text-[#059669]' },
  'Open Source': { bg: 'bg-[#F5A623]/8', text: 'text-[#B45309]' },
}

export default function MCPPlatform() {
  const [expandedAgent, setExpandedAgent] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [toasts, setToasts] = useState([])

  const mcp = mcpPlatform
  const toast = (msg) => { const id = Date.now(); setToasts(p => [...p, { id, msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }

  const activeAgents = mcp.connectedAgents.filter(a => a.status === 'active').length
  const totalTools = mcp.toolSurface.reduce((sum, cat) => sum + cat.tools.length, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold text-[#1D2433]">Platform & MCP</h1>
          <p className="text-[12px] text-[#6B7280]">Your observability data, accessible to any agent via MCP</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast('API key copied to clipboard')}>
            <Key size={12} /> Copy API Key
          </Button>
          <Button size="sm" onClick={() => toast('Opening MCP documentation...')}>
            <ExternalLink size={12} /> MCP Docs
          </Button>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* Summary metrics */}
        <motion.div variants={fadeUp} className="grid grid-cols-5 gap-3">
          {[
            { icon: Globe, label: 'Connected Consumers', value: activeAgents, sub: `${mcp.connectedAgents.length} total` },
            { icon: Zap, label: 'Requests / Month', value: `${(mcp.summary.requestsMonth / 1000).toFixed(0)}K` },
            { icon: Activity, label: 'Tool Invocations', value: `${(mcp.summary.toolInvocations / 1000).toFixed(0)}K` },
            { icon: Clock, label: 'p99 Latency', value: `${mcp.summary.p99Latency}ms` },
            { icon: Shield, label: 'Uptime', value: `${mcp.summary.uptimePercent}%` },
          ].map(m => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon size={12} className="text-[#6B7280]" />
                <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">{m.label}</span>
              </div>
              <span className="text-[20px] font-bold text-[#1D2433]">{m.value}</span>
              {m.sub && <p className="text-[10px] text-[#6B7280]">{m.sub}</p>}
            </Card>
          ))}
        </motion.div>

        {/* Usage trend + Connected agents */}
        <motion.div variants={fadeUp} className="grid grid-cols-12 gap-4">
          {/* Usage trend */}
          <Card className="col-span-5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1D2433]">MCP Request Volume</span>
              <Badge variant="secondary" className="text-[9px]">7 weeks</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={mcp.usageTrend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="mcp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333EA" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#9333EA" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={35} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Area type="monotone" dataKey="requests" stroke="#9333EA" strokeWidth={2} fill="url(#mcp-grad)" dot={{ r: 2.5, fill: '#9333EA' }} animationDuration={600} />
                <RTooltip formatter={v => [`${v.toLocaleString()} requests`, 'Volume']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-[#6B7280] mt-2">
              <span className="font-medium text-[#9333EA]">3.4x growth</span> in 7 weeks — 42K → 142K requests/month
            </p>
          </Card>

          {/* Connected agents */}
          <Card className="col-span-7 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1D2433]">Connected Agents</span>
              <Badge variant="secondary" className="text-[9px]">{activeAgents} active</Badge>
            </div>
            <div className="space-y-1">
              {mcp.connectedAgents.map(agent => {
                const ts = TYPE_STYLE[agent.type] || TYPE_STYLE['Customer Agent']
                const isExpanded = expandedAgent === agent.id
                return (
                  <div key={agent.id}>
                    <button onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                      className={`w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-left transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${agent.status === 'active' ? 'bg-[#00D4A0]' : 'bg-gray-300'}`} />
                      <span className="text-[12px] font-medium text-[#1D2433] flex-1 truncate">{agent.name}</span>
                      <Badge className={`text-[9px] ${ts.bg} ${ts.text}`}>{agent.type}</Badge>
                      <span className="text-[10px] text-[#6B7280]">{agent.requestsWeek > 0 ? `${(agent.requestsWeek/1000).toFixed(1)}K/wk` : 'Inactive'}</span>
                      <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-2.5 pb-2 ml-5">
                            <div className="flex items-center gap-2 text-[10px] text-[#6B7280] mb-1.5">
                              <span>Last active: {agent.lastActive}</span>
                              <span>·</span>
                              <span>{agent.tools.length} tools used</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {agent.tools.map(t => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* MCP Tool Surface */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[13px] font-semibold text-[#1D2433]">MCP Tool Surface</span>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{totalTools} tools available via MCP protocol</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast('Endpoint URL copied')}>
                <Copy size={11} /> Copy Endpoint
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mcp.toolSurface.map(cat => {
                const isExpanded = expandedCategory === cat.category
                return (
                  <div key={cat.category} className="bg-gray-50/50 rounded-lg p-3">
                    <button onClick={() => setExpandedCategory(isExpanded ? null : cat.category)} className="w-full flex items-center gap-2 text-left mb-2">
                      <span className="text-[12px] font-semibold text-[#1D2433] flex-1">{cat.category}</span>
                      <Badge variant="secondary" className="text-[9px]">{cat.tools.length} tools</Badge>
                      <ChevronDown size={10} className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="space-y-1.5">
                      {(isExpanded ? cat.tools : cat.tools.slice(0, 2)).map(tool => (
                        <div key={tool.name} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#1D2433] flex-1">{tool.name}</span>
                          <span className="text-[9px] text-[#6B7280]">{tool.consumers} consumers</span>
                          <span className="text-[9px] text-[#9333EA] font-medium">{(tool.invocationsWeek/1000).toFixed(1)}K/wk</span>
                        </div>
                      ))}
                      {!isExpanded && cat.tools.length > 2 && (
                        <p className="text-[10px] text-[#0B6ACB] font-medium">+{cat.tools.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Platform narrative */}
        <motion.div variants={fadeUp}>
          <div className="bg-gradient-to-r from-[#1D252C] to-[#263040] rounded-xl p-5 text-white">
            <p className="text-[14px] font-semibold mb-2">They sell you an agent. We give you the platform and the choice.</p>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Your observability data is accessible to any agent — our SRE Agent, Azure SRE Agent, your own custom agents, or open source tools like HolmesGPT.
              Same data, same insights pipeline, same validated intelligence. You choose the agent. We provide the context no one else has.
            </p>
          </div>
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
