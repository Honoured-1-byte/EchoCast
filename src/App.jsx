import React from 'react';
import EchoCastTerminal from './components/layout/EchoCastTerminal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900 text-white p-4">
          <h1>Something went wrong.</h1>
          <pre>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="app-container">
      <ErrorBoundary>
        <EchoCastTerminal />
      </ErrorBoundary>
    </div>
  );
}

export default App;