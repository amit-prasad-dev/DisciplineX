import { BrowserRouter } from 'react-router'
import { HabitsProvider } from '../context/HabitsContext.jsx'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import AppRouter from './router.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <HabitsProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </HabitsProvider>
    </ThemeProvider>
  )
}
