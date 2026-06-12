import React from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-slate-200 p-8 box-border bg-transparent">
          <div className="glass-panel max-w-lg w-full text-center p-10 flex flex-col items-center gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-red-500/20 rounded-2xl bg-black/45 backdrop-blur-md">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertOctagon size={48} className="text-red-400" />
            </div>
            <h2 className="m-0 text-2xl font-bold text-red-400">Something Went Wrong</h2>
            <p className="m-0 text-sm text-slate-400 leading-relaxed">
              An unexpected error occurred in this section of the HIPS application. The error details have been logged in the console.
            </p>
            <div className="bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-left text-xs text-red-400/90 w-full overflow-x-auto max-h-[120px] custom-scrollbar">
              {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            </div>
            <button 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 cursor-pointer mt-2"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
