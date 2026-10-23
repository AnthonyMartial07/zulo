import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Login sin contraseña: Supabase manda un código por email y se escribe aquí.
 * (Más cómodo que el enlace: da igual en qué navegador se abra el correo.)
 * La plantilla de email de Supabase tiene que incluir {{ .Token }}.
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    // Si va bien, onAuthStateChange en App.tsx se encarga de entrar.
    if (error) setError('Código incorrecto o caducado')
  }

  return (
    <div className="center card login">
      <h1 className="login-title">
        <img src="/logo.svg" alt="" /> Zulo Gitano
      </h1>
      {step === 'email' ? (
        <form onSubmit={sendCode}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar código'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="muted">
            Te hemos mandado un código a <b>{email}</b>
          </p>
          <input
            className="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            required
            autoFocus
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" disabled={busy || code.length < 6}>
            {busy ? 'Comprobando…' : 'Entrar'}
          </button>
          {error && <p className="error">{error}</p>}
          <div className="row between">
            <button type="button" className="link" onClick={() => sendCode()} disabled={busy}>
              Reenviar código
            </button>
            <button
              type="button"
              className="link"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
            >
              Cambiar email
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
