import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'

import Home from './pages/Home'
import InvestigationCanvas from './pages/InvestigationCanvas'
import GoldenMetrics from './pages/GoldenMetrics'
import SloWorkflow from './pages/SloWorkflow'
import WarRoom from './pages/WarRoom'
import PostMortem from './pages/PostMortem'
import MemoryExplorer from './pages/MemoryExplorer'
import Integrations from './pages/Integrations'
import SettingsAnalytics from './pages/SettingsAnalytics'
import SetupWizard from './pages/SetupWizard'

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen ml-[180px]">
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <Routes>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/investigation/:id" element={<PageWrapper><InvestigationCanvas /></PageWrapper>} />
            <Route path="/investigation/:id/golden-metrics" element={<PageWrapper><GoldenMetrics /></PageWrapper>} />
            <Route path="/investigation/:id/slo" element={<PageWrapper><SloWorkflow /></PageWrapper>} />
            <Route path="/investigation/:id/war-room" element={<PageWrapper><WarRoom /></PageWrapper>} />
            <Route path="/investigation/:id/postmortem" element={<PageWrapper><PostMortem /></PageWrapper>} />
            <Route path="/memory" element={<PageWrapper><MemoryExplorer /></PageWrapper>} />
            <Route path="/integrations" element={<PageWrapper><Integrations /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsAnalytics /></PageWrapper>} />
            <Route path="/setup" element={<PageWrapper><SetupWizard /></PageWrapper>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
