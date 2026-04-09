import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Brain,
  Plug,
  Settings,
  Sparkles,
  Command,
} from 'lucide-react'

const AGENT_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investigation/inv-0892', icon: Search, label: 'Investigations' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
]

const ACTION_NAV = [
  { to: '/setup', icon: Sparkles, label: 'Setup Wizard' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function SectionLabel({ children }) {
  return (
    <p className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7B8D] select-none">
      {children}
    </p>
  )
}

function NavItem({ to, icon: Icon, label, isActive }) {
  return (
    <NavLink
      to={to}
      className={() =>
        `flex items-center gap-2.5 px-4 py-[7px] text-[13px] transition-colors ${
          isActive
            ? 'bg-[#0C74DF] text-white font-medium rounded-sm mx-1.5 px-2.5'
            : 'text-[#B9BDBD] hover:text-white'
        }`
      }
    >
      <Icon size={16} className="shrink-0" strokeWidth={isActive ? 2 : 1.5} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const isInvestigationPath = location.pathname.startsWith('/investigation')

  function isActive(to, label) {
    if (label === 'Investigations') return isInvestigationPath
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

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
        <div className="flex items-center gap-2 px-2.5 py-[6px] rounded bg-[#283440] text-[#6B7B8D] text-[12px] cursor-pointer hover:bg-[#2F3E4A] transition-colors">
          <Search size={13} strokeWidth={1.5} />
          <span className="flex-1">Find what you need</span>
          <span className="flex items-center gap-0.5 text-[10px] border border-[#3A4A56] rounded px-1 py-[1px]">
            <Command size={9} />K
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll">
        {/* Home — standalone */}
        <div className="py-1 border-b border-[#2A3640]">
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Home"
            isActive={isActive('/', 'Home')}
          />
        </div>

        {/* SRE Agent section */}
        <SectionLabel>SRE Agent</SectionLabel>
        {AGENT_NAV.filter(n => n.label !== 'Dashboard').map((item) => (
          <NavItem
            key={item.to}
            {...item}
            isActive={isActive(item.to, item.label)}
          />
        ))}

        {/* Actions section */}
        <SectionLabel>Actions</SectionLabel>
        {ACTION_NAV.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            isActive={isActive(item.to, item.label)}
          />
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="border-t border-[#2A3640] px-3 py-2.5 flex items-center justify-between">
        <Settings size={16} className="text-[#6B7B8D] hover:text-white cursor-pointer transition-colors" />
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0C74DF] to-[#00B3A4] flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
          AP
        </div>
      </div>
    </aside>
  )
}
