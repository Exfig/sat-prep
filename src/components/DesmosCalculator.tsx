import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        el: HTMLElement,
        options?: Record<string, unknown>,
      ) => { destroy: () => void };
    };
  }
}

export default function DesmosCalculator() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void } | null>(null);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  // Initialize calculator when opened
  useEffect(() => {
    if (!open || minimized) return;

    const timer = setTimeout(() => {
      if (containerRef.current && window.Desmos && !calcRef.current) {
        calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          expressionsTopbar: false,
          border: false,
          lockViewport: false,
          authorFeatures: false,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, minimized]);

  // Destroy calculator on close
  useEffect(() => {
    if (!open && calcRef.current) {
      calcRef.current.destroy();
      calcRef.current = null;
    }
  }, [open]);

  // Set initial position centered on screen
  useEffect(() => {
    if (open && !initialized) {
      const w = Math.min(520, window.innerWidth - 32);
      const h = Math.min(420, window.innerHeight - 120);
      setPos({
        x: Math.max(16, (window.innerWidth - w) / 2),
        y: Math.max(72, (window.innerHeight - h) / 2),
      });
      setInitialized(true);
    }
  }, [open, initialized]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y)),
      });
    };

    const handleMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [open]);

  // Toggle button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full
          shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center
          hover:scale-105 active:scale-95"
        aria-label="Open Desmos graphing calculator"
        title="Desmos Calculator"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="10" y2="10" />
          <line x1="12" y1="10" x2="14" y2="10" />
          <line x1="8" y1="14" x2="10" y2="14" />
          <line x1="12" y1="14" x2="14" y2="14" />
          <line x1="8" y1="18" x2="14" y2="18" />
          <line x1="16" y1="10" x2="16" y2="14" />
        </svg>
      </button>
    );
  }

  // Mobile: full-width slide-up panel
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col" style={{ height: minimized ? 48 : '70vh' }}>
        {/* Title bar */}
        <div className="flex items-center justify-between bg-indigo-700 text-white px-4 py-2 rounded-t-xl">
          <span className="text-sm font-semibold">Desmos Calculator</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 hover:bg-indigo-600 rounded transition-colors"
              aria-label={minimized ? 'Expand calculator' : 'Minimize calculator'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {minimized
                  ? <polyline points="18 15 12 9 6 15" />
                  : <line x1="5" y1="12" x2="19" y2="12" />
                }
              </svg>
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false); setInitialized(false); }}
              className="p-1 hover:bg-indigo-600 rounded transition-colors"
              aria-label="Close calculator"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calculator */}
        {!minimized && (
          <div ref={containerRef} className="flex-1 bg-white" />
        )}
      </div>
    );
  }

  // Desktop: draggable floating panel
  const panelWidth = Math.min(520, window.innerWidth - 32);
  const panelHeight = minimized ? 40 : Math.min(420, window.innerHeight - 120);

  return (
    <div
      className="fixed z-50 rounded-xl shadow-2xl border border-slate-300 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: panelWidth,
        height: panelHeight,
      }}
    >
      {/* Title bar (draggable) */}
      <div
        className="flex items-center justify-between bg-indigo-700 text-white px-4 py-2 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-semibold">Desmos Calculator</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-indigo-600 rounded transition-colors"
            aria-label={minimized ? 'Expand calculator' : 'Minimize calculator'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {minimized
                ? <polyline points="18 15 12 9 6 15" />
                : <line x1="5" y1="12" x2="19" y2="12" />
              }
            </svg>
          </button>
          <button
            onClick={() => { setOpen(false); setMinimized(false); setInitialized(false); }}
            className="p-1 hover:bg-indigo-600 rounded transition-colors"
            aria-label="Close calculator"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calculator body */}
      {!minimized && (
        <div ref={containerRef} style={{ width: '100%', height: panelHeight - 40 }} />
      )}
    </div>
  );
}
