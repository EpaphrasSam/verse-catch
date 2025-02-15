"use client";

import React from "react";
import toast from "react-hot-toast";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log the error
    console.error("ErrorBoundary caught an error:", error);

    // Show error toast
    toast.error(this.formatErrorMessage(error), {
      duration: 4000,
      icon: "⚠️",
      style: {
        background: "#EF4444",
        color: "#FFFFFF",
        padding: "16px",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "500",
      },
    });
  }

  private formatErrorMessage(error: Error): string {
    // Handle different types of errors
    if (error.message.includes("ECONNRESET")) {
      return "Connection lost. Please try again.";
    }

    if (error.message.includes("exceeds")) {
      return error.message; // Size limit errors are already formatted
    }

    // Handle server errors that might come through as JSON
    try {
      const parsed = JSON.parse(error.message);
      return parsed.error || parsed.message || "An unexpected error occurred";
    } catch {
      // If not JSON or other specific cases, return a user-friendly message
      return error.message || "An unexpected error occurred";
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-600">
              Something went wrong processing your request.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 text-sm text-red-700 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
