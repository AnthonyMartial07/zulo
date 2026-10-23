import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { HouseholdContext, type Household } from './lib/household'
import type { Member, Task } from './lib/types'
import Login from './pages/Login'
import Calendar from './pages/Calendar'
import Fines from './pages/Fines'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!authReady) return <p className="center">Cargando…</p>
  if (!session) return <Login />
  return <LoggedIn email={session.user.email ?? ''} />
}

function LoggedIn({ email }: { email: string }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  async function reload() {
    const [m, t] = await Promise.all([
      supabase.from('members').select('*').order('rotation_order'),
      supabase.from('tasks').select('*').order('rotation_order'),
    ])
    setMembers(m.data ?? [])
    setTasks(t.data ?? [])
  }

  useEffect(() => {
    reload()
  }, [])

  const household = useMemo<Household | null>(() => {
    const me = members?.find((m) => m.email.toLowerCase() === email.toLowerCase())
    if (!members || !me) return null
    return { me, members, tasks, memberById: (id) => members.find((m) => m.id === id), reload }
  }, [members, tasks, email])

  if (!members) return <p className="center">Cargando…</p>
  if (!household) {
    return (
      <div className="center">
        <p>
          <b>{email}</b> no está en la lista de compis del zulo.
        </p>
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    )
  }

  return (
    <HouseholdContext.Provider value={household}>
      <header className="topbar">
        <span className="logo">
          <img src="/logo.svg" alt="" /> Zulo Gitano
        </span>
        <nav>
          <NavLink to="/calendario">Calendario</NavLink>
          <NavLink to="/multas">Multas</NavLink>
          <NavLink to="/ranking">Boxscore</NavLink>
          {household.me.is_admin && <NavLink to="/ajustes">Ajustes</NavLink>}
        </nav>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          {household.me.name} · salir
        </button>
      </header>
      <main>
        <Routes>
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/multas" element={<Fines />} />
          <Route path="/ranking" element={<Leaderboard />} />
          {household.me.is_admin && <Route path="/ajustes" element={<Settings />} />}
          <Route path="*" element={<Navigate to="/calendario" replace />} />
        </Routes>
      </main>
    </HouseholdContext.Provider>
  )
}
