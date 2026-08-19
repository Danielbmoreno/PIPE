import { HashRouter as Router } from 'react-router-dom';
import AppRouter from './router/index.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
