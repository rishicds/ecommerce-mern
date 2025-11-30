import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router";
import App from './App.jsx'
import { SyncProvider } from './context/SyncContext.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SyncProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SyncProvider>
  </BrowserRouter>,
)
