import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Clock,
  AlertTriangle,
  BarChart3,
  Shield,
  MessageSquare,
  GitBranch,
  ArrowRight,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

const INVESTIGATION_NAMES = {
  'inv-0892': { name: 'checkout-service', severity: 'P1', phase: 'Hypotheses' },
  'inv-0893': { name: 'api-gateway', severity: 'P2', phase: 'Root Cause' },
}

export default function InvestigationCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const inv = INVESTIGATION_NAMES[id]

  if (!inv) {
    return (
      <div>
        <Breadcrumbs />
        <EmptyState
          icon={Search}
          title="Investigation Not Found"
          description="This investigation doesn't exist or has been archived."
          actions={[{ label: 'Back to Home', onClick: () => navigate('/') }]}
        />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs />
      {/* Three-column placeholder */}
      <div className="flex gap-4 min-h-[calc(100vh-120px)]">
        {/* Left sidebar placeholder */}
        <div className="w-[260px] shrink-0 bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Investigation Timeline</h3>
          <div className="space-y-3">
            {['Alert Triggered', 'Context Gathered', 'Hypotheses Testing', 'Root Cause'].map((step, i) => (
              <div key={step} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${i <= 2 ? 'bg-good' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-xs font-medium">{step}</p>
                  <p className="text-[11px] text-text-secondary">{i === 0 ? '14:35 UTC' : i === 1 ? '14:36 UTC' : i === 2 ? 'In progress' : 'Pending'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Data Sources</h3>
            <div className="flex flex-wrap gap-2">
              {['APM', 'Infra', 'K8s', 'Logs', 'PD', 'Slack', 'GH'].map((src) => (
                <span key={src} className="text-[10px] bg-good/10 text-good px-2 py-0.5 rounded font-medium">{src}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Memory Matches</h3>
            <p className="text-xs text-text-secondary italic">Similar issue 12 days ago — resolved by rollback</p>
          </div>
        </div>

        {/* Main canvas placeholder */}
        <div className="flex-1 space-y-4">
          {/* Alert header */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-bad" />
                  {inv.name}
                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                    inv.severity === 'P1' ? 'bg-red-50 text-bad' : 'bg-amber-50 text-warning'
                  }`}>{inv.severity}</span>
                </h2>
                <p className="text-xs text-text-secondary mt-1">Latency p99 &gt; 2s threshold violated · Phase: {inv.phase}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1"><Clock size={12} /> 12 min</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} /> 3 messages</span>
              </div>
            </div>
          </div>

          {/* Content placeholder */}
          <EmptyState
            icon={Search}
            title="Investigation Canvas"
            description="Hypothesis cards, evidence chains, entity context, and root cause summary will be built in P5-P12."
            actions={[
              { label: 'Golden Metrics', onClick: () => navigate(`/investigation/${id}/golden-metrics`) },
              { label: 'SLO Workflow', onClick: () => navigate(`/investigation/${id}/slo`) },
            ]}
          />

          {/* Sub-page navigation hints */}
          <div className="flex gap-3">
            {[
              { label: 'Golden Metrics', path: 'golden-metrics', icon: BarChart3 },
              { label: 'SLO Workflow', path: 'slo', icon: Shield },
              { label: 'War Room', path: 'war-room', icon: MessageSquare },
              { label: 'Post-Mortem', path: 'postmortem', icon: GitBranch },
            ].map((sub) => (
              <motion.button
                key={sub.path}
                whileHover={{ y: -1 }}
                onClick={() => navigate(`/investigation/${id}/${sub.path}`)}
                className="flex-1 bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-2 text-sm font-medium hover:border-nr-blue/30 transition-colors group"
              >
                <sub.icon size={14} className="text-text-secondary group-hover:text-nr-blue" />
                {sub.label}
                <ArrowRight size={12} className="ml-auto text-text-secondary group-hover:text-nr-blue" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right chat panel placeholder */}
        <div className="w-[300px] shrink-0 bg-white rounded-xl border border-gray-100 p-4 flex flex-col">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">AI Chat</h3>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-text-secondary text-center italic px-4">Chat panel will be built in P12</p>
          </div>
          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="flex flex-wrap gap-1.5">
              {['Service health', 'Recent changes', 'Check deployment diff'].map((chip) => (
                <span key={chip} className="text-[11px] bg-nr-blue/10 text-nr-blue px-2.5 py-1 rounded-full cursor-pointer hover:bg-nr-blue/20 transition-colors">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
