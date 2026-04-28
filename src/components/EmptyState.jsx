import { motion } from 'framer-motion'
import { Button } from './ui/button'

export default function EmptyState({ icon: Icon, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#0B6ACB]/10 flex items-center justify-center mb-5">
        <Icon size={28} className="text-[#0B6ACB]" />
      </div>
      <h2 className="text-lg font-semibold text-[#1D2433] mb-2">{title}</h2>
      <p className="text-sm text-[#6B7280] max-w-md text-center leading-relaxed mb-6">
        {description}
      </p>
      {actions && (
        <div className="flex items-center gap-3">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={i === 0 ? 'default' : 'outline'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
