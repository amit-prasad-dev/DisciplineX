import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import AppRouter from './router.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  )
}
