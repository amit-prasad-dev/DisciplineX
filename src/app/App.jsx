import { BrowserRouter } from 'react-router'
import { AuthProvider } from '../context/AuthContext.jsx'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import AppRouter from './router.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
