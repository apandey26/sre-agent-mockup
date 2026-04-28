import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, MessageSquare, Ticket, BookOpen, RotateCcw,
  Radio, Brain, FileText, Snowflake, CheckCircle, X,
} from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'

/* ── icon map (string → component) ────────────── */
const ICONS = {
  AlertTriangle, MessageSquare, Ticket, BookOpen, RotateCcw,
  Radio, Brain, FileText, Snowflake,
}

const DESTRUCTIVE_ACTIONS = new Set(['declare', 'rollback', 'freeze'])

/* ── toast notification ───────────────────────── */
function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-gray-100 shadow-lg p-3 flex items-center gap-2 min-w-[280px]"
          >
            <CheckCircle size={16} className="text-[#00D4A0] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#1D2433]">{t.label}</p>
              <p className="text-[11px] text-[#6B7280]">Action completed successfully</p>
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-[#6B7280] hover:text-[#1D2433]">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ── main component ───────────────────────────── */
const NAV_ACTIONS = new Set(['warroom', 'postmortem', 'memory'])

export default function TriageActionsDock({ scenario }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [dialogAction, setDialogAction] = useState(null)
  const [toasts, setToasts] = useState([])

  const actions = scenario.triageActions || []

  const handleConfirm = () => {
    if (!dialogAction) return
    const tid = Date.now()
    setToasts(prev => [...prev, { id: tid, label: dialogAction.label }])
    setDialogAction(null)
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== tid)) }, 3000)

    // Navigate for specific actions
    if (dialogAction.id === 'warroom') setTimeout(() => navigate(`/investigation/${id}/war-room`), 500)
    else if (dialogAction.id === 'postmortem') setTimeout(() => navigate(`/investigation/${id}/postmortem`), 500)
    else if (dialogAction.id === 'memory') setTimeout(() => navigate('/memory'), 500)
  }

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-t border-gray-100 rounded-t-xl px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sticky bottom-0"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mr-1">Actions</span>
          {actions.map((action) => {
            const Icon = ICONS[action.icon] || AlertTriangle
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => setDialogAction(action)}
              >
                <Icon size={12} /> {action.label}
              </Button>
            )
          })}
        </div>
      </motion.div>

      {/* Confirmation dialog */}
      <Dialog open={!!dialogAction} onOpenChange={(v) => { if (!v) setDialogAction(null) }}>
        {dialogAction && (
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirm: {dialogAction.label}</DialogTitle>
              <DialogDescription>{dialogAction.confirmText}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogAction(null)}>Cancel</Button>
              <Button
                variant={DESTRUCTIVE_ACTIONS.has(dialogAction.id) ? 'destructive' : 'default'}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
