import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { UserRoleProvider } from './contexts/UserRoleContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserRoleProvider>
    <App />
    </UserRoleProvider>
  </StrictMode>,
)
