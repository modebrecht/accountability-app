import AuthPage from './pages/AuthPage'
import TaskListPage from './pages/TaskListPage'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Checking your session…</p>
        </div>
      </div>
    )
  }

  return session ? <TaskListPage /> : <AuthPage />
}

export default App
