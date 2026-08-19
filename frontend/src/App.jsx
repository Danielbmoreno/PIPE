import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/index.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </Router>
  );
}

export default App;
