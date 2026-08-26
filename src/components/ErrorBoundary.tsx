"use client";
import { Component, type ReactNode } from "react";

/**
 * Safety net: if any section throws at runtime we show a quiet recovery screen
 * instead of a frozen/blank page, and offer to return to the entry gateway.
 */
interface Props { onReset?: () => void; children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#05070c] px-6 text-center">
          <div className="text-[0.6rem] uppercase tracking-[0.3em] text-[#3d6a94]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
            Owners of Impact
          </div>
          <div className="text-[clamp(1.4rem,3vw,2.2rem)] font-light text-[#e6eef8]" style={{ fontFamily: "var(--font-luxury)" }}>
            The passage has been sealed.
          </div>
          <p className="max-w-md text-sm text-[#657384]">
            Something interrupted the session. Return to the gateway to try again.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-2 rounded-md border border-[#6b9ac8]/30 bg-transparent px-6 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-[#a8cfe8] transition hover:border-[#6b9ac8]/60"
          >
            Return to Gateway
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
