import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown, ArrowRight } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

const FIELD_LABELS = [
  ['entityName',      'Entity Name'],
  ['k8sLabels',       'K8s Labels'],
  ['k8sNamespace',    'K8s Namespace'],
  ['cluster',         'Cluster'],
  ['gitRepo',         'Git Repo'],
  ['helmChart',       'Helm Chart / ArgoCD'],
  ['nrApm',           'NR APM'],
  ['nrInfra',         'NR Infra'],
  ['apiDependencies', 'API Dependencies'],
  ['network',         'Network / Firewall'],
  ['sourceCode',      'Source Code'],
  ['mcpTools',        'Connected MCP Tools'],
]

/* fields whose values should be split into pills */
const PILL_FIELDS = new Set(['apiDependencies', 'network', 'mcpTools'])

/* fields whose values look like URLs / repo paths */
const LINK_FIELDS = new Set(['gitRepo'])

function ValueCell({ fieldKey, value }) {
  if (!value) {
    return (
      <span className="text-[12px] text-[#6B7280] italic flex items-center gap-1.5">
        Not configured
        <a href="#" onClick={e => e.preventDefault()} className="text-[#0B6ACB] font-medium not-italic flex items-center gap-0.5 hover:underline">
          Setup <ArrowRight size={10} />
        </a>
      </span>
    )
  }

  if (PILL_FIELDS.has(fieldKey)) {
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="text-[11px] bg-gray-100 text-[#1D2433] rounded px-1.5 py-[2px]">
            {item}
          </span>
        ))}
      </div>
    )
  }

  if (LINK_FIELDS.has(fieldKey)) {
    return <span className="text-[13px] text-[#0B6ACB]">{value}</span>
  }

  return <span className="text-[13px] text-[#1D2433]">{value}</span>
}

export default function EntityContextTable({ scenario }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const ctx = scenario.entityContext || {}
  const fieldCount = Object.keys(ctx).length

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[#F7F8FA] transition-colors"
      >
        <Database size={14} className="text-[#6B7280] shrink-0" />
        <span className="text-[14px] font-semibold text-[#1D2433]">Entity Context</span>
        <Badge variant="secondary">{fieldCount} fields</Badge>
        <div className="ml-auto flex items-center gap-3">
          {open && (
            <span
              onClick={(e) => { e.stopPropagation(); navigate('/memory') }}
              className="text-[11px] text-[#0B6ACB] font-medium hover:underline"
            >
              Edit context
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#6B7280] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Body — collapsible */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4">
                {FIELD_LABELS.map(([key, label]) => (
                  <div key={key} className="contents">
                    <span className="text-[12px] font-medium text-[#6B7280] py-1">{label}</span>
                    <div className="py-1">
                      <ValueCell fieldKey={key} value={ctx[key]} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
