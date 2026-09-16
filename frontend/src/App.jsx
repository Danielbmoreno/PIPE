import { HashRouter as Router } from 'react-router-dom';
import AppRouter from './router/index.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
