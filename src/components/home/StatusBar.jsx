import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, Plug } from 'lucide-react'

export default function StatusBar({ activeCount, integrationsConnected, integrationsTotal }) {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e >= 30 ? 0 : e + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const hasIncident = activeCount > 0
  const dotColor = hasIncident ? 'bg-[#FF4D4D]' : 'bg-[#00D4A0]'
  const statusText = activeCount === 0 ? 'All Systems Operational'
    : activeCount === 1 ? '1 Active Incident' : `${activeCount} Active Incidents`

  return (
    <div className="flex items-center gap-4 h-9 px-4 bg-gray-50/80 border border-gray-100 rounded-lg text-[11px] mb-3">
      <button
        onClick={() => document.getElementById('section-active-inv')?.scrollIntoView({ behavior: 'smooth' })}
        className="flex items-center gap-2 hover:text-[#0B6ACB]"
      >
        <div className={`w-2 h-2 rounded-full ${dotColor} ${hasIncident ? 'animate-pulse' : ''}`} />
        <span className={`font-semibold ${hasIncident ? 'text-[#FF4D4D]' : 'text-[#00D4A0]'}`}>{statusText}</span>
      </button>

      <div className="w-px h-4 bg-gray-200" />

      <span className={`text-[#6B7280] ${elapsed === 0 ? 'text-[#0B6ACB] font-medium' : ''} transition-colors`}>
        Updated {elapsed}s ago
      </span>

      <div className="flex-1" />

      <span className="flex items-center gap-1 text-[#6B7280]">
        <Shield size={11} /> On-call: checkout-team
      </span>
      <span className="flex items-center gap-1 text-[#6B7280]">
        <Bell size={11} /> PD: 1 open
      </span>
      <button
        onClick={() => navigate('/integrations')}
        className="flex items-center gap-1 text-[#6B7280] hover:text-[#0B6ACB]"
      >
        <Plug size={11} /> {integrationsConnected}/{integrationsTotal}
      </button>
    </div>
  )
}
