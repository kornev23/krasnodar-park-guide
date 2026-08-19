import { FormEvent, useEffect, useState } from 'react'
import { LockKeyhole, MapPinned } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function AdminAccess() {
  const invitation = window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery')
  const [sessionReady, setSessionReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(() => setSessionReady(true))
  }, [])

  const setPasswordForInvitation = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) { setError('Пароль должен быть не короче 8 символов.'); return }
    if (password !== repeatPassword) { setError('Пароли не совпадают.'); return }
    const { error: updateError } = await supabase!.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); return }
    window.history.replaceState(null, '', `${window.location.pathname}#admin`)
    setDone(true)
  }

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password })
    if (signInError) { setError('Не удалось войти. Проверьте email и пароль.'); return }
    setDone(true)
  }

  return <main className="admin-screen">
    <section className="admin-card">
      <div className="admin-mark"><MapPinned size={24}/></div>
      <p className="eyebrow">ГИД ПО ПАРКУ КРАСНОДАР</p>
      <h1>{done ? 'Доступ подтверждён' : invitation ? 'Создайте пароль' : 'Вход для администратора'}</h1>
      {done ? <p className="admin-copy">Аккаунт администратора готов. Редактор объектов появится здесь следующим обновлением.</p> : invitation ? <form onSubmit={setPasswordForInvitation} className="admin-form"><p className="admin-copy">Придумайте пароль для доступа к редактору карты.</p><label>Пароль<input autoFocus type="password" value={password} onChange={event => setPassword(event.target.value)} /></label><label>Повторите пароль<input type="password" value={repeatPassword} onChange={event => setRepeatPassword(event.target.value)} /></label>{error && <p className="admin-error">{error}</p>}<button type="submit" disabled={!sessionReady}>Сохранить пароль</button></form> : <form onSubmit={signIn} className="admin-form"><p className="admin-copy">Войдите под email, на который было отправлено приглашение.</p><label>Email<input autoFocus type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><label>Пароль<input type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>{error && <p className="admin-error">{error}</p>}<button type="submit"><LockKeyhole size={16}/> Войти</button></form>}
    </section>
  </main>
}
