import { FormEvent, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState<'login' | 'register' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<'login' | 'register' | null>(null)

  const handleAction = async (event: FormEvent, action: 'login' | 'register') => {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setLastAction(action)
    setStatus(action === 'login' ? 'Logging in…' : 'Registering your account…')
    setSubmitting(action)
    try {
      if (action === 'login') {
        await signIn(email, password)
        setStatus('Login successful! Redirecting…')
      } else {
        await signUp(email, password)
        setStatus('Registered! If confirmation is required, check your email.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to authenticate'
      setError(message)
      setStatus(`Error: ${message}`)
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={(event) => event.preventDefault()}
        noValidate
        action="javascript:void(0)"
      >
        <header>
          <h1>Accountability App</h1>
          <p>Sign in or create an account to manage your tasks.</p>
        </header>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
        </label>

        {error ? <p className="error">{error}</p> : null}
        {status ? (
          <p className={`status ${status.startsWith('Error:') ? 'status-error' : ''}`}>
            {lastAction ? `[${lastAction}] ` : ''}
            {status}
          </p>
        ) : null}

        <div className="actions">
          <button
            type="button"
            onClick={(event) => handleAction(event, 'login')}
            disabled={submitting !== null}
          >
            {submitting === 'login' ? 'Logging in…' : 'Login'}
          </button>
          <button
            type="button"
            onClick={(event) => handleAction(event, 'register')}
            disabled={submitting !== null}
            className="secondary"
          >
            {submitting === 'register' ? 'Registering…' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}
