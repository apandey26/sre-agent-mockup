import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Puzzle, Grid3x3, Bookmark, LayoutDashboard, Activity,
  FileText, GitBranch, Monitor, Bell, Server, Box,
  Globe, Smartphone, Inbox, AppWindow, Sparkles,
  Search, Settings, Command,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

const TOP_NAV = [
  { icon: Home, label: 'Home', mock: true },
  { icon: Puzzle, label: 'Integrations & Agents', mock: true },
  { icon: Grid3x3, label: 'All Capabilities', mock: true },
  { icon: Bookmark, label: 'Catalogs', mock: true },
]

const WORKSPACE = [
  { icon: LayoutDashboard, label: 'Dashboards', mock: true },
  { icon: Activity, label: 'APM & Services', mock: true },
  { icon: FileText, label: 'Logs', mock: true },
  { icon: GitBranch, label: 'Traces', mock: true },
  { icon: Monitor, label: 'Synthetic Monitoring', mock: true },
  { icon: Bell, label: 'Alerts', mock: true },
  { icon: Server, label: 'Infrastructure', mock: true },
  { icon: Box, label: 'Kubernetes', mock: true },
  { icon: Globe, label: 'Browser', mock: true },
  { icon: Smartphone, label: 'Mobile', mock: true },
  { icon: Inbox, label: 'Errors Inbox', mock: true },
  { icon: AppWindow, label: 'Apps', mock: true },
  { icon: Sparkles, label: 'SRE Agent', to: '/', mock: false },
]

function SectionLabel({ children }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7B8D] select-none">
      {children}
    </p>
  )
}

function NavItem({ icon: Icon, label, to, mock, isActive }) {
  if (mock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="w-full flex items-center gap-2.5 px-4 py-[6px] text-[13px] text-[#B9BDBD] hover:text-white transition-colors text-left">
            <Icon size={15} className="shrink-0" strokeWidth={1.5} />
            <span className="truncate">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Not available in mockup</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <NavLink
      to={to}
      className={() =>
        `flex items-center gap-2.5 px-4 py-[6px] text-[13px] transition-colors ${
          isActive
            ? 'bg-[#0C74DF] text-white font-medium rounded-sm mx-1.5 px-2.5'
            : 'text-[#B9BDBD] hover:text-white'
        }`
      }
    >
      <Icon size={15} className="shrink-0" strokeWidth={isActive ? 2 : 1.5} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()
  // SRE Agent is active on ALL our mockup routes
  const isSreAgentActive = true // always active since this IS the SRE Agent mockup

  return (
    <aside className="fixed left-0 top-0 h-screen w-[180px] bg-[#1D252C] flex flex-col z-50 border-r border-[#2A3640]">
      {/* NR Logo */}
      <div className="flex items-center gap-2 px-4 h-[52px] shrink-0">
        <svg width="106" height="14" viewBox="0 0 120 16" fill="none">
          <text x="0" y="13" fontFamily="Inter, system-ui" fontSize="14" fontWeight="700" fill="white" letterSpacing="-0.02em">
            new relic
          </text>
        </svg>
      </div>

      {/* Search */}
      <div className="px-3 mb-1">
        <div className="flex items-center gap-2 px-2.5 py-[5px] rounded bg-[#283440] text-[#6B7B8D] text-[12px] cursor-pointer hover:bg-[#2F3E4A] transition-colors">
          <Search size={13} strokeWidth={1.5} />
          <span className="flex-1">Find what you need</span>
          <span className="flex items-center gap-0.5 text-[10px] border border-[#3A4A56] rounded px-1 py-[1px]">
            <Command size={9} />K
          </span>
        </div>
      </div>

      {/* Top nav */}
      <div className="py-1 border-b border-[#2A3640]">
        {TOP_NAV.map(item => (
          <NavItem key={item.label} {...item} isActive={false} />
        ))}
      </div>

      {/* Workspace */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll">
        <SectionLabel>Workspace</SectionLabel>
        {WORKSPACE.map(item => (
          <NavItem
            key={item.label}
            {...item}
            isActive={!item.mock && isSreAgentActive}
          />
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="border-t border-[#2A3640] px-3 py-2.5 flex items-center justify-between">
        <Settings size={15} className="text-[#6B7B8D] hover:text-white cursor-pointer transition-colors" />
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0C74DF] to-[#00B3A4] flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
          AP
        </div>
      </div>
    </aside>
  )
}
