import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle, Loader } from 'lucide-react'
import SimulationContext from './SimulationContext'

/* ── phase banner configs ─────────────────────── */
const BANNERS = {
  0: {
    bg: 'bg-[#0B6ACB]/5 border-[#0B6ACB]/20',
    icon: Sparkles,
    iconColor: 'text-[#0B6ACB]',
    iconAnimate: true,
    title: 'Investigation started. Gathering context...',
    titleColor: 'text-[#0B6ACB]',
    sub: 'Querying data sources...',
  },
  1: {
    bg: 'bg-[#0B6ACB]/5 border-[#0B6ACB]/20',
    icon: Loader,
    iconColor: 'text-[#0B6ACB]',
    iconAnimate: true,
    title: 'Context gathered. Generating hypotheses...',
    titleColor: 'text-[#0B6ACB]',
    sub: 'Analyzed 6 data sources in 3.0s',
  },
  2: {
    bg: 'bg-[#0B6ACB]/5 border-[#0B6ACB]/20',
    icon: Loader,
    iconColor: 'text-[#0B6ACB]',
    iconAnimate: true,
    title: 'Testing 2 hypotheses...',
    titleColor: 'text-[#0B6ACB]',
    sub: 'Evaluating evidence for each hypothesis',
  },
  3: {
    bg: 'bg-[#00D4A0]/5 border-[#00D4A0]/20',
    icon: CheckCircle,
    iconColor: 'text-[#00D4A0]',
    iconAnimate: false,
    title: 'Root cause identified.',
    titleColor: 'text-[#00D4A0]',
    sub: 'Redis connection pool exhaustion — 78% confidence',
  },
}

function PhaseBanner({ phase, onSkip }) {
  /* Phase 4: compact complete strip */
  if (phase >= 4) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
      >
        <CheckCircle size={14} className="text-[#00D4A0] shrink-0" />
        <span className="text-[13px] text-[#1D2433]">
          <span className="font-medium">Investigation complete</span> — Root cause: Redis connection pool exhaustion (78%)
        </span>
      </motion.div>
    )
  }

  const b = BANNERS[phase] || BANNERS[0]
  const Icon = b.icon

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className={`${b.bg} border rounded-xl p-4`}
        >
          <div className="flex items-center gap-2">
            <Icon
              size={16}
              className={`${b.iconColor} shrink-0 ${b.iconAnimate ? 'animate-pulse' : ''}`}
            />
            <span className={`text-[14px] font-medium ${b.titleColor}`}>{b.title}</span>
          </div>
          <p className="text-[12px] text-[#6B7280] mt-1 ml-6">{b.sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 text-[11px] text-[#6B7280] hover:text-[#0B6ACB] font-medium transition-colors"
      >
        Skip →
      </button>
    </div>
  )
}

/* ── main controller ──────────────────────────── */
export default function SimulationController({ id, children }) {
  const isSimulated = id === 'inv-new'
  // Start all scenarios fully loaded — guided chat is an optional replay
  const [phase, setPhase] = useState(4)

  const skip = () => setPhase(4)

  return (
    <SimulationContext.Provider value={{ phase, setPhase }}>
      {isSimulated && <PhaseBanner phase={phase} onSkip={skip} />}
      {children}
    </SimulationContext.Provider>
  )
}
