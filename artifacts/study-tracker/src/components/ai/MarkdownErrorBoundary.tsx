import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackText: string;
}

interface State {
  hasError: boolean;
}

export class MarkdownErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Markdown rendering error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <span className="text-destructive/80 italic">{this.props.fallbackText}</span>;
    }

    return this.props.children;
  }
}
