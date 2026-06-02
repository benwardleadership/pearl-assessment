import { createContext, useContext, useState, useEffect, useRef } from 'react'
import * as D from './data.js'
import { supabase } from './supabase.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/* ── helpers ──────────────────────────────────────────────── */

function patchSessionInWs(w, sessionId, patch) {
  return {
    ...w,
    companies: w.companies.map((c) => ({
      ...c,
      sessions: c.sessions.map((s) => s.id === sessionId ? { ...s, ...patch } : s),
    })),
  }
}

/* Shapes a Supabase scores[] array into { [assessorId]: { [managerId]: record } } */
function shapeScores(rows) {
  const out = {}
  ;(rows || []).forEach((s) => {
    if (!out[s.assessor_id]) out[s.assessor_id] = {}
    out[s.assessor_id][s.manager_id] = {
      P: s.p, E: s.e, A: s.a, R: s.r, L: s.l,
      rehire: s.rehire,
      teamType: s.team_type,
      notes: s.notes || '',
    }
  })
  return out
}

/* ── provider ─────────────────────────────────────────────── */

export function AppProvider({ children }) {
  const [loading, setLoading]           = useState(true)
  const [ws, setWs]                     = useState(null)
  const [userId, setUserId]             = useState(null)
  const [activeAssessor, setActiveAssessor] = useState(null)
  const [saveError, setSaveError]       = useState(null)
  const fileInput  = useRef(null)
  const saveTimers = useRef({})        // keyed by "roundId:managerId"
  const dbTimers   = useRef({})        // keyed by "company" | "round"

  /* ── initial load ────────────────────────────────────────── */

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)

      // Companies accessible to this user (RLS handles filtering)
      const { data: companies, error: cErr } = await supabase
        .from('companies').select('id, name').order('name')
      if (cErr) throw cErr

      // All rounds for accessible companies
      const { data: rounds, error: rErr } = await supabase
        .from('rounds').select('id, company_id, name, round_date').order('round_date', { ascending: false })
      if (rErr) throw rErr

      const roundsByCompany = {}
      rounds.forEach((r) => {
        if (!roundsByCompany[r.company_id]) roundsByCompany[r.company_id] = []
        roundsByCompany[r.company_id].push(r)
      })

      const wsCompanies = companies.map((c) => ({
        id: c.id,
        name: c.name,
        sessions: (roundsByCompany[c.id] || []).map((r) => ({
          id: r.id, name: r.name, date: r.round_date,
          assessors: [], roster: [], scores: {},
        })),
      }))

      const firstCompany = wsCompanies[0] || null
      const firstSession = firstCompany?.sessions[0] || null

      const initialWs = {
        companies: wsCompanies,
        activeCompanyId: firstCompany?.id || null,
        activeSessionId: firstSession?.id || null,
      }

      setWs(initialWs)

      if (firstSession) {
        const detail = await loadRoundDetail(firstSession.id, firstCompany.id, user.id)
        setWs((w) => patchSessionInWs(w, firstSession.id, detail))
        setActiveAssessor(user.id)
      }
    } catch (e) {
      console.error('AppContext load error:', e)
    } finally {
      setLoading(false)
    }
  }

  /* ── load one round's detail (roster, assessors, scores) ── */

  async function loadRoundDetail(roundId, companyId, uid) {
    const [partRes, membRes, scoreRes] = await Promise.all([
      supabase.from('round_participants')
        .select('manager_id, managers(id, name, title)')
        .eq('round_id', roundId),
      supabase.from('company_members')
        .select('user_id, role, profiles(id, full_name)')
        .eq('company_id', companyId),
      supabase.from('scores').select('*').eq('round_id', roundId),
    ])

    const roster = (partRes.data || []).map((p) => ({
      id: p.manager_id,
      name: p.managers?.name || '',
      role: p.managers?.title || '',
    }))

    const memberMap = {}
    ;(membRes.data || []).forEach((m) => {
      memberMap[m.user_id] = m.profiles?.full_name || 'User'
    })

    // Always include the logged-in user as an assessor
    if (!memberMap[uid]) {
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', uid).single()
      memberMap[uid] = prof?.full_name || 'Me'
    }

    const assessors = Object.entries(memberMap).map(([id, name]) => ({ id, name }))
    const scores    = shapeScores(scoreRes.data)

    return { assessors, roster, scores }
  }

  /* ── derived state ───────────────────────────────────────── */

  const company = ws ? (ws.companies.find((c) => c.id === ws.activeCompanyId) || ws.companies[0]) : null
  const session  = company ? (company.sessions.find((s) => s.id === ws.activeSessionId) || company.sessions[0]) : null

  /* ── switch company / round ──────────────────────────────── */

  async function switchCompany(cid) {
    const c = ws.companies.find((x) => x.id === cid)
    const first = c?.sessions[0]
    setWs((w) => ({ ...w, activeCompanyId: cid, activeSessionId: first?.id || null }))
    if (first) {
      const { data: { user } } = await supabase.auth.getUser()
      const detail = await loadRoundDetail(first.id, cid, user.id)
      setWs((w) => patchSessionInWs(w, first.id, detail))
      setActiveAssessor(user.id)
    }
  }

  async function switchSession(sid) {
    setWs((w) => ({ ...w, activeSessionId: sid }))
    // Lazy-load detail if roster is empty
    const existing = company?.sessions.find((s) => s.id === sid)
    if (existing && existing.roster.length === 0) {
      const { data: { user } } = await supabase.auth.getUser()
      const detail = await loadRoundDetail(sid, company.id, user.id)
      setWs((w) => patchSessionInWs(w, sid, detail))
    }
  }

  /* ── in-memory updaters (also flush to DB for name/date) ── */

  function updateWs(fn) {
    setWs((w) => (typeof fn === 'function' ? fn(w) : fn))
  }

  function updateSession(fn) {
    setWs((w) => {
      const next = {
        ...w,
        companies: w.companies.map((c) => c.id !== company.id ? c : {
          ...c,
          sessions: c.sessions.map((s) => s.id !== session.id ? s : fn(s)),
        }),
      }
      // Debounced flush of name/date to DB
      const nextSession = next.companies
        .find((c) => c.id === company.id)?.sessions
        .find((s) => s.id === session.id)
      if (nextSession) scheduleRoundFlush(nextSession)
      return next
    })
  }

  function updateCompany(fn) {
    setWs((w) => {
      const next = {
        ...w,
        companies: w.companies.map((c) => c.id !== company.id ? c : fn(c)),
      }
      const nextCompany = next.companies.find((c) => c.id === company.id)
      if (nextCompany) scheduleCompanyFlush(nextCompany)
      return next
    })
  }

  function scheduleRoundFlush(s) {
    clearTimeout(dbTimers.current['round'])
    dbTimers.current['round'] = setTimeout(async () => {
      await supabase.from('rounds').update({ name: s.name, round_date: s.date }).eq('id', s.id)
    }, 1000)
  }

  function scheduleCompanyFlush(c) {
    clearTimeout(dbTimers.current['company'])
    dbTimers.current['company'] = setTimeout(async () => {
      await supabase.from('companies').update({ name: c.name }).eq('id', c.id)
    }, 1000)
  }

  /* ── roster mutations (DB-backed) ────────────────────────── */

  async function addPerson() {
    // Insert into managers + round_participants, then update local state
    const { data: mgr, error } = await supabase.from('managers')
      .insert({ company_id: company.id, name: 'New Manager', title: '' })
      .select().single()
    if (error) { console.error(error); return }
    await supabase.from('round_participants').insert({ round_id: session.id, manager_id: mgr.id })
    const newPerson = { id: mgr.id, name: mgr.name, role: mgr.title }
    updateSession((s) => ({ ...s, roster: [...s.roster, newPerson] }))
  }

  async function patchPerson(id, k, v) {
    // Update in-memory immediately
    updateSession((s) => ({ ...s, roster: s.roster.map((p) => p.id === id ? { ...p, [k]: v } : p) }))
    // Flush to DB (k is 'name' or 'role'; DB columns are name, title)
    const col = k === 'role' ? 'title' : 'name'
    clearTimeout(dbTimers.current[`person_${id}`])
    dbTimers.current[`person_${id}`] = setTimeout(async () => {
      await supabase.from('managers').update({ [col]: v }).eq('id', id)
    }, 1000)
  }

  async function removePerson(id) {
    await supabase.from('round_participants').delete()
      .eq('round_id', session.id).eq('manager_id', id)
    updateSession((s) => {
      const scores = { ...s.scores }
      Object.keys(scores).forEach((aid) => { const sc = { ...scores[aid] }; delete sc[id]; scores[aid] = sc })
      return { ...s, roster: s.roster.filter((p) => p.id !== id), scores }
    })
  }

  /* ── assessor stubs (Prompt 6 will flesh these out) ───────── */

  const addAssessor    = () => updateSession((s) => ({ ...s, assessors: [...s.assessors, { id: D.uid('a'), name: 'New Assessor' }] }))
  const patchAssessor  = (id, name) => updateSession((s) => ({ ...s, assessors: s.assessors.map((a) => a.id === id ? { ...a, name } : a) }))
  const removeAssessor = (id) => updateSession((s) => { const sc = { ...s.scores }; delete sc[id]; return { ...s, assessors: s.assessors.filter((a) => a.id !== id), scores: sc } })

  /* ── score saving ─────────────────────────────────────────── */

  function setRecord(assessorId, managerId, rec) {
    // Optimistic update
    setWs((w) => ({
      ...w,
      companies: w.companies.map((c) => c.id !== company.id ? c : {
        ...c,
        sessions: c.sessions.map((s) => {
          if (s.id !== session.id) return s
          return { ...s, scores: { ...s.scores, [assessorId]: { ...(s.scores[assessorId] || {}), [managerId]: rec } } }
        }),
      }),
    }))
    // Debounce DB write
    const key = `${session.id}:${managerId}`
    clearTimeout(saveTimers.current[key])
    saveTimers.current[key] = setTimeout(() => saveScore(session.id, managerId, assessorId, rec), 800)
  }

  async function saveScore(roundId, managerId, assessorId, rec) {
    const { error } = await supabase.from('scores').upsert({
      round_id: roundId, manager_id: managerId, assessor_id: assessorId,
      p: rec.P ?? null, e: rec.E ?? null, a: rec.A ?? null, r: rec.R ?? null, l: rec.L ?? null,
      rehire: rec.rehire || null, team_type: rec.teamType || null,
      notes: rec.notes || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'round_id,manager_id,assessor_id' })
    if (error) {
      console.error('Score save error:', error)
      setSaveError('Score not saved — check your connection.')
      setTimeout(() => setSaveError(null), 4000)
    }
  }

  /* ── add company / round ─────────────────────────────────── */

  async function addCompany() {
    const { data, error } = await supabase.from('companies')
      .insert({ name: 'New Company' }).select().single()
    if (error) { console.error(error); return }
    const newCo = { id: data.id, name: data.name, sessions: [] }
    setWs((w) => ({ ...w, companies: [...w.companies, newCo], activeCompanyId: data.id, activeSessionId: null }))
  }

  async function addRound() {
    const { data, error } = await supabase.from('rounds')
      .insert({ company_id: company.id, name: 'New Review Round', round_date: D.today() })
      .select().single()
    if (error) { console.error(error); return }
    // Clone roster
    if (session?.roster.length) {
      await supabase.from('round_participants').insert(
        session.roster.map((p) => ({ round_id: data.id, manager_id: p.id }))
      )
    }
    const newSession = {
      id: data.id, name: data.name, date: data.round_date,
      assessors: session?.assessors || [], roster: session?.roster || [], scores: {},
    }
    setWs((w) => ({
      ...w,
      companies: w.companies.map((c) => c.id !== company.id ? c : { ...c, sessions: [...c.sessions, newSession] }),
      activeSessionId: data.id,
    }))
  }

  async function addBlankSession() {
    const { data, error } = await supabase.from('rounds')
      .insert({ company_id: company.id, name: 'Review ' + (company.sessions.length + 1), round_date: D.today() })
      .select().single()
    if (error) { console.error(error); return }
    const newSession = { id: data.id, name: data.name, date: data.round_date, assessors: [], roster: [], scores: {} }
    setWs((w) => ({
      ...w,
      companies: w.companies.map((c) => c.id !== company.id ? c : { ...c, sessions: [...c.sessions, newSession] }),
      activeSessionId: data.id,
    }))
  }

  /* ── utility ─────────────────────────────────────────────── */

  function clearScores() {
    supabase.from('scores').delete().eq('round_id', session.id)
    updateSession((s) => ({ ...s, scores: {} }))
  }

  function resetAll() { loadAll() }  // just reload from DB
  function loadSample() {}           // no-op in cloud mode

  /* ── export ──────────────────────────────────────────────── */

  function exportBackup() {
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `PEARL_Backup_${D.today()}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function exportCSV() {
    if (!session) return
    const rows   = D.aggregate(session)
    const ranked = [...rows].sort((a, b) => (a.rank || 999) - (b.rank || 999))
    const esc    = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
    const lines  = [[`${company.name} — ${session.name} (${session.date})`].map(esc).join(',')]
    lines.push(['Rank','Manager','Role',...D.PEARL.map((d) => d.key),'Overall','Would Rehire','Team Type','Action','Responses'].map(esc).join(','))
    ranked.forEach((r) => {
      const tt = D.teamType(r.teamType)
      lines.push([r.rank ?? '', r.person.name, r.person.role, ...D.PEARL.map((d) => r.dims[d.key] != null ? r.dims[d.key].toFixed(1) : ''),
        r.overall != null ? r.overall.toFixed(1) : '', r.rehire || '', tt ? tt.name : '', tt ? tt.action : '', r.responses].map(esc).join(','))
    })
    lines.push(''); lines.push(['Assessor-level detail'].map(esc).join(','))
    lines.push(['Assessor','Manager',...D.PEARL.map((d) => d.key),'Avg','Rehire','Team Type','Notes'].map(esc).join(','))
    session.assessors.forEach((a) => session.roster.forEach((p) => {
      const rec = (session.scores[a.id] || {})[p.id]
      if (rec && D.PEARL.some((d) => rec[d.key] != null)) {
        const tt = D.teamType(rec.teamType)
        lines.push([a.name, p.name, ...D.PEARL.map((d) => rec[d.key] ?? ''), D.recordAvg(rec) ?? '', rec.rehire || '', tt ? tt.name : '', rec.notes || ''].map(esc).join(','))
      }
    }))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${company.name.replace(/\s+/g, '_')}_${session.name.replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /* ── render ──────────────────────────────────────────────── */

  if (loading || !ws || !company || !session) return <LoadingState />

  const sessionView = { ...session, org: company.name, sessionName: session.name }

  return (
    <Ctx.Provider value={{
      ws, company, session, sessionView, activeAssessor, setActiveAssessor, userId,
      updateWs, updateSession, updateCompany, setRecord,
      switchCompany, switchSession,
      addCompany, addRound, addBlankSession,
      addPerson, patchPerson, removePerson,
      addAssessor, patchAssessor, removeAssessor,
      loadSample, clearScores, resetAll,
      exportBackup, exportCSV,
      onPrint: () => window.print(),
      fileInputRef: fileInput,
      saveError,
    }}>
      {children}
      {saveError && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#c0392b',
          color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,.3)', zIndex: 9999,
        }}>
          ⚠ {saveError}
        </div>
      )}
      <input ref={fileInput} type="file" accept="application/json,.json" style={{ display: 'none' }}
        onChange={(e) => { e.target.value = '' }} />
    </Ctx.Provider>
  )
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy, #0d1b2a)' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 14 }}>
        <img src="/s-mark-on-navy.png" alt="" style={{ height: 40, opacity: .7, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
        Loading workspace…
      </div>
    </div>
  )
}
