import { HashRouter as Router } from 'react-router-dom';
import AppRouter from './router/index.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
export default function App() {
  return <Router><ToastProvider><ErrorBoundary><AuthProvider><AppRouter /></AuthProvider></ErrorBoundary></ToastProvider></Router>;
}
