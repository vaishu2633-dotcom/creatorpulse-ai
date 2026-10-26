import React from 'react';
import { AlertCircle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CreatorPulse AI React Error Boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F6F3] dark:bg-[#0F1420] text-[#1F2430] dark:text-[#F1F5F9] flex items-center justify-center p-6">
          <div className="w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-[#171D2B] border border-[#E8E6DF] dark:border-[#232B3E] shadow-soft-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2430] dark:text-white">
                Something went slightly off track
              </h1>
              <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] leading-relaxed">
                CreatorPulse encountered an unexpected rendering error. Your data and settings are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#121724] border border-[#E8E6DF] dark:border-[#232B3E] text-left overflow-x-auto text-xs font-mono text-rose-600 dark:text-rose-400">
                <div className="font-bold mb-1">Error Message:</div>
                <div>{this.state.error?.message || String(this.state.error)}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4B4AC0] text-white font-semibold text-xs shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#202738] hover:bg-[#E4E0D6] dark:hover:bg-[#2A334A] text-[#1F2430] dark:text-[#F1F5F9] font-semibold text-xs transition"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
