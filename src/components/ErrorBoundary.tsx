import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Auto-reload on stale chunk errors (happens after redeployment)
    const msg = error.message || '';
    if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch dynamically')) {
      const reloadKey = 'chunk-reload-' + window.location.pathname;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('dynamically imported module');

      return (
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {isChunkError
                ? 'A new version is available. Please reload the page.'
                : (this.state.error?.message ?? 'An unexpected error occurred.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => isChunkError ? window.location.reload() : this.handleReset()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
                  hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                {isChunkError ? 'Reload' : 'Try Again'}
              </button>
              <button
                onClick={() => {
                  window.location.href = import.meta.env.BASE_URL;
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium
                  hover:bg-slate-200 transition-colors min-h-[44px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
