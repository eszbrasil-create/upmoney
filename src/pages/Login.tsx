import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type LoginPageProps = {
  passwordRecoveryMode?: boolean
  onPasswordResetDone?: () => void
}

export function LoginPage({
  passwordRecoveryMode = false,
  onPasswordResetDone,
}: LoginPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleSignIn = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError('Não foi possível entrar. Verifique seus dados.')
    }
    setBusy(false)
  }

  const handleSignUp = async () => {
    if (!supabase) return
    if (!fullName.trim()) {
      setError('Informe seu nome para criar a conta.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })
    if (signUpError) {
      setError('Não foi possível criar a conta.')
    } else {
      setMessage('Conta criada. Verifique seu email se necessário.')
    }
    setBusy(false)
  }

  const handleForgotPassword = async () => {
    if (!supabase) return
    if (!email.trim()) {
      setError('Informe seu email para recuperar a senha.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.origin,
      }
    )
    if (resetError) {
      setError('Não foi possível enviar o email de recuperação.')
    } else {
      setMessage(
        'Enviamos um link de recuperação para seu email. Abra o link para definir uma nova senha.'
      )
    }
    setBusy(false)
  }

  const handleUpdatePassword = async () => {
    if (!supabase) return
    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateError) {
      setError('Não foi possível atualizar sua senha.')
      setBusy(false)
      return
    }
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${window.location.search}`
    )
    setMessage('Senha atualizada com sucesso.')
    setNewPassword('')
    setConfirmPassword('')
    onPasswordResetDone?.()
    setBusy(false)
  }

  const inPasswordRecovery = passwordRecoveryMode

  return (
    <div className="login-page">
      <div className="auth-card">
        <h2>{inPasswordRecovery ? 'Redefinir senha' : 'Entrar no Upmoney'}</h2>
        <p>
          {inPasswordRecovery
            ? 'Defina uma nova senha para continuar.'
            : 'Use seu email para acessar suas carteiras e ativos.'}
        </p>
        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}
        {inPasswordRecovery ? (
          <>
            <label>
              Nova senha
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            <label>
              Confirmar nova senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            <div className="auth-actions">
              <button className="btn primary" onClick={handleUpdatePassword} disabled={busy}>
                Atualizar senha
              </button>
            </div>
          </>
        ) : (
          <>
            <label>
              Nome
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            <button
              className="auth-link"
              onClick={() => {
                setShowForgotPassword((prev) => !prev)
                setMessage(null)
                setError(null)
              }}
              disabled={busy}
            >
              Esqueceu a senha?
            </button>
            {showForgotPassword ? (
              <div className="auth-actions">
                <button className="btn ghost" onClick={handleForgotPassword} disabled={busy}>
                  Enviar link de recuperação
                </button>
              </div>
            ) : null}
            <div className="auth-actions">
              <button className="btn auth-signin" onClick={handleSignIn} disabled={busy}>
                Entrar
              </button>
              <button className="btn auth-signup" onClick={handleSignUp} disabled={busy}>
                Criar conta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
