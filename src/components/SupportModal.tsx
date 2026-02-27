import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'Question Content',
  'Other',
];

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const reset = () => {
    setCategory(CATEGORIES[0]);
    setMessage('');
    setSubmitState('idle');
    setErrorMsg('');
  };

  const handleClose = () => {
    onClose();
    // Reset after animation completes
    setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitState === 'sending') return;

    setSubmitState('sending');
    setErrorMsg('');

    try {
      const { error } = await supabase.functions.invoke('submit-support-request', {
        body: {
          userEmail: user?.email || 'unknown',
          userName: user?.user_metadata?.full_name || user?.email || 'Unknown User',
          category,
          message: message.trim(),
        },
      });

      if (error) throw error;
      setSubmitState('success');
    } catch (err) {
      console.error('Support submit error:', err);
      setSubmitState('error');
      setErrorMsg('Failed to send. Please try again or email support@topscore.school directly.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#0e1017] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.05, duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Contact Support</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitState === 'success' ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
                <p className="text-sm text-white/70 text-center">
                  Your message has been sent. We'll get back to you at{' '}
                  <span className="text-white/90">{user?.email}</span>.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.1] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 px-5 py-4">
                  {/* Category */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 outline-none focus:border-[#e4c36e]/40 transition-colors"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#1a1d27]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-[#e4c36e]/40 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Error message */}
                  {submitState === 'error' && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <p className="text-xs text-red-300">{errorMsg}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
                  <p className="text-[11px] text-white/30">
                    Sending as {user?.email}
                  </p>
                  <button
                    type="submit"
                    disabled={!message.trim() || submitState === 'sending'}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                      message.trim() && submitState !== 'sending'
                        ? 'bg-[#e4c36e] text-[#0e1017] hover:bg-[#d4b35e]'
                        : 'bg-white/[0.06] text-white/30 cursor-not-allowed',
                    )}
                  >
                    {submitState === 'sending' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {submitState === 'sending' ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
