import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado en la interfaz PIPE:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page-shell">
        <div className="alert-box">
          No se pudo mostrar esta sección. Recarga la página o vuelve a intentarlo.
          {this.state.error?.message && <div>{this.state.error.message}</div>}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
