import { useState } from 'react'
import { supabase } from '../lib/supabase'

/** Login sin contraseña: Supabase manda un enlace mágico al email. */
export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="center card login">
      <h1 className="login-title">
        <img src="/logo.svg" alt="" /> Zulo Gitano
      </h1>
      {sent ? (
        <p>Revisa tu correo y pulsa el enlace para entrar.</p>
      ) : (
        <form onSubmit={submit}>
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Enviar enlace</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
