import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorComponent({ 
  message = 'Unable to fetch data. Please try again.',
  onRetry,
  visible = true,
  type = 'error' // 'error' or 'warning'
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
            type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}