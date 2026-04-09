import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-nr-blue/10 flex items-center justify-center mb-5">
        <Icon size={28} className="text-nr-blue" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
      <p className="text-sm text-text-secondary max-w-md text-center leading-relaxed mb-6">
        {description}
      </p>
      {actions && (
        <div className="flex items-center gap-3">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === 0
                  ? 'bg-nr-blue text-white hover:bg-nr-blue-light'
                  : 'bg-white border border-gray-200 text-text-primary hover:bg-gray-50'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
