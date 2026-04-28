import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const HEALTH_ORDER = { critical: 0, warning: 1, healthy: 2 }
const HEALTH_DOT = { critical: '#FF4D4D', warning: '#F5A623', healthy: '#00D4A0' }
const HEALTH_BORDER = { critical: 'border-l-[#FF4D4D]', warning: 'border-l-[#F5A623]', healthy: 'border-l-transparent' }
const SLO_COLOR = (pct) => pct > 70 ? '#00D4A0' : pct > 40 ? '#F5A623' : '#FF4D4D'

const fadeUp = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

function EntityTile({ entity, onClick }) {
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setBarWidth(entity.sloBudget), 100); return () => clearTimeout(t) }, [entity.sloBudget])

  const sparkData = entity.sparkline.map((v, i) => ({ i, v }))
  const isElevated = entity.health !== 'healthy'
  const strokeColor = isElevated ? '#FF4D4D' : '#0B6ACB'

  return (
    <motion.div variants={fadeUp}>
      <Card
        className={`p-2.5 cursor-pointer hover:shadow-md transition-all border-l-[3px] ${HEALTH_BORDER[entity.health]} min-w-[130px]`}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: HEALTH_DOT[entity.health] }} />
          <span className="text-[11px] font-semibold text-[#1D2433] truncate flex-1">{entity.name}</span>
          {entity.alertCount > 0 && (
            <span className="text-[8px] bg-[#FF4D4D] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{entity.alertCount}</span>
          )}
        </div>

        <Badge variant="secondary" className="text-[8px] mb-1.5">{entity.type}</Badge>

        {/* Sparkline */}
        <div className="h-[28px] w-full mb-1.5">
          <ResponsiveContainer width="100%" height={28}>
            <AreaChart data={sparkData} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`eh-${entity.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={1.2} fill={`url(#eh-${entity.name})`} dot={false} animationDuration={600} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-x-2 text-[9px] mb-1.5">
          <div>
            <span className="text-[#6B7280] uppercase">p99</span>
            <p className={`text-[11px] font-bold ${entity.latencyP99 > 500 ? 'text-[#FF4D4D]' : 'text-[#1D2433]'}`}>
              {entity.latencyP99 >= 1000 ? `${(entity.latencyP99/1000).toFixed(1)}s` : `${entity.latencyP99}ms`}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] uppercase">Err</span>
            <p className={`text-[11px] font-bold ${entity.errorRate > 1 ? 'text-[#FF4D4D]' : 'text-[#1D2433]'}`}>
              {entity.errorRate}%
            </p>
          </div>
        </div>

        {/* SLO micro bar */}
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${barWidth}%`, backgroundColor: SLO_COLOR(entity.sloBudget) }}
          />
        </div>
        <p className="text-[8px] text-[#6B7280] mt-0.5">SLO {entity.sloBudget}%</p>
      </Card>
    </motion.div>
  )
}

export default function EntityHealthGrid({ entities }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [toastMsg, setToastMsg] = useState(null)

  const sorted = [...entities].sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health])
  const filtered = filter === 'all' ? sorted : sorted.filter(e => e.health === filter)

  const counts = { critical: 0, warning: 0, healthy: 0 }
  entities.forEach(e => counts[e.health]++)

  const handleClick = (entity) => {
    if (entity.investigationId) {
      navigate(`/investigation/${entity.investigationId}`)
    } else {
      setToastMsg(`Opening ${entity.name} in APM...`)
      setTimeout(() => setToastMsg(null), 2000)
    }
  }

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-[#1D2433]">Entity Health</span>
        <Badge variant="secondary" className="text-[9px]">{entities.length} entities</Badge>
        <div className="flex gap-1 ml-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'critical', label: `Critical (${counts.critical})`, dot: '#FF4D4D' },
            { key: 'warning', label: `Warning (${counts.warning})`, dot: '#F5A623' },
            { key: 'healthy', label: `Healthy (${counts.healthy})`, dot: '#00D4A0' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                filter === f.key ? 'bg-[#0B6ACB]/10 text-[#0B6ACB]' : 'text-[#6B7280] hover:bg-gray-50'
              }`}
            >
              {f.dot && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.dot }} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-5 gap-2"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
      >
        {filtered.map(entity => (
          <EntityTile key={entity.name} entity={entity} onClick={() => handleClick(entity)} />
        ))}
      </motion.div>

      {toastMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-2 bg-[#0B6ACB]/5 rounded px-3 py-1.5 text-[10px] text-[#0B6ACB] font-medium text-center">
          {toastMsg}
        </motion.div>
      )}
    </Card>
  )
}
