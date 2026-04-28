import { useState } from 'react'
import { Brain, Server } from 'lucide-react'
import MemoryExplorer from './MemoryExplorer'
import SystemModel from './SystemModel'

const VIEWS = [
  { key: 'memories', label: 'Memories', icon: Brain },
  { key: 'system-model', label: 'System Model', icon: Server },
]

export default function Knowledge() {
  const [view, setView] = useState('memories')

  return (
    <div>
      {/* Sub-toggle */}
      <div className="flex items-center gap-1 mb-4">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              view === v.key
                ? 'bg-[#0B6ACB]/8 text-[#0B6ACB]'
                : 'text-[#6B7280] hover:text-[#1D2433] hover:bg-gray-50'
            }`}
          >
            <v.icon size={13} />
            {v.label}
          </button>
        ))}
      </div>

      {view === 'memories' && <MemoryExplorer />}
      {view === 'system-model' && <SystemModel />}
    </div>
  )
}
