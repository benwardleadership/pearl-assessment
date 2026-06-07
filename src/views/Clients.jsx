import { useState, useEffect } from 'react'
import { useApp } from '../AppContext.jsx'
import { Icon, initials, ConfirmDialog } from '../components.jsx'
import { supabase } from '../supabase.js'
import * as D from '../data.js'

export default function Clients() {
  const { ws, isSuperAdmin, switchCompany } = useApp()
  const [selectedId, setSelectedId] = useState(ws?.companies[0]?.id || null)
  const [companies, setCompanies]   = useState(ws?.companies || [])
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  if (!isSuperAdmin) {
    return (
      <div className="page fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--text-muted)' }}>You don't have access to this page.</p>
      </div>
    )
  }

  const selected = companies.find((c) => c.id === selectedId) || companies[0]

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function createCompany() {
    const { data, error } = await supabase.from('companies')
      .insert({ name: 'New Company' }).select().single()
    if (error) { showToast('Could not create company.', 'err'); return }
    const co = { id: data.id, name: data.name, sessions: [], assessors: [] }
    setCompanies((cs) => [...cs, co])
    setSelectedId(data.id)
  }

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Super Admin</div>
        <h1 className="page-title">Clients</h1>
        <p className="page-sub">Manage client companies, review rounds, rosters, and assessor access.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Company list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow" style={{ margin: 0 }}>Companies</span>
            <button className="btn btn-primary btn-sm" onClick={createCompany}>
              <Icon name="plus" size={14} /> New
            </button>
          </div>
          {companies.map((c) => (
            <button key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 16px', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: c.id === selectedId ? 'var(--teal-light, #e8f7f7)' : 'transparent',
                fontWeight: c.id === selectedId ? 600 : 400,
                color: 'var(--text)',
              }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Company detail */}
        {selected && (
          <CompanyDetail
            key={selected.id}
            company={selected}
            onUpdate={(updated) => setCompanies((cs) => cs.map((c) => c.id === updated.id ? updated : c))}
            onDelete={(id) => {
              setCompanies((cs) => cs.filter((c) => c.id !== id))
              setSelectedId(companies.find((c) => c.id !== id)?.id || null)
            }}
            onOpen={() => { switchCompany(selected.id) }}
            showToast={showToast}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'err' ? '#c0392b' : 'var(--navy)',
          color: '#fff', padding: '10px 16px', borderRadius: 8,
          fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.25)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ── Company detail panel ────────────────────────────────── */

function CompanyDetail({ company, onUpdate, onDelete, onOpen, showToast }) {
  const [name, setName]         = useState(company.name)
  const [rounds, setRounds]     = useState([])
  const [assessors, setAssessors] = useState([])
  const [loading, setLoading]   = useState(true)
  const [confirm, setConfirm]   = useState(null)
  const dbTimer = useState(null)

  useEffect(() => {
    loadDetail()
  }, [company.id])

  async function loadDetail() {
    setLoading(true)
    const [rRes, aRes] = await Promise.all([
      supabase.from('rounds').select('id, name, round_date').eq('company_id', company.id).order('round_date', { ascending: false }),
      supabase.from('company_members').select('user_id, role, profiles(id, full_name, email)').eq('company_id', company.id),
    ])
    setRounds(rRes.data || [])
    setAssessors((aRes.data || []).map((m) => ({
      userId: m.user_id,
      role: m.role,
      name: m.profiles?.full_name || '',
      email: m.profiles?.email || '',
    })))
    setLoading(false)
  }

  function saveName(val) {
    setName(val)
    onUpdate({ ...company, name: val })
    clearTimeout(dbTimer[0])
    dbTimer[0] = setTimeout(() => supabase.from('companies').update({ name: val }).eq('id', company.id), 1000)
  }

  async function addRound() {
    const { data, error } = await supabase.from('rounds')
      .insert({ company_id: company.id, name: 'New Review Round', round_date: D.today() })
      .select().single()
    if (error) { showToast('Could not create round.', 'err'); return }
    setRounds((rs) => [data, ...rs])
  }

  async function deleteRound(id) {
    await supabase.from('rounds').delete().eq('id', id)
    setRounds((rs) => rs.filter((r) => r.id !== id))
  }

  async function deleteCompany() {
    await supabase.from('companies').delete().eq('id', company.id)
    onDelete(company.id)
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Company name */}
      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Company Details</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onOpen}>Open in app →</button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirm('company')}>
              <Icon name="trash" size={14} /> Delete
            </button>
          </div>
        </div>
        <label className="field-label">Company Name</label>
        <input className="text-field" value={name} onChange={(e) => saveName(e.target.value)} />
      </div>

      {/* Rounds */}
      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="eyebrow">Review Rounds · {rounds.length}</div>
          <button className="btn btn-primary btn-sm" onClick={addRound}>
            <Icon name="plus" size={14} /> Add Round
          </button>
        </div>
        {loading && <p className="tip">Loading…</p>}
        {!loading && rounds.length === 0 && <p className="tip">No rounds yet. Add one to get started.</p>}
        {rounds.map((r) => (
          <RoundRow key={r.id} round={r} companyId={company.id}
            onDelete={() => deleteRound(r.id)}
            onUpdate={(updated) => setRounds((rs) => rs.map((x) => x.id === updated.id ? updated : x))}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Assessors */}
      <div className="card card-pad">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Assessors · {assessors.length}</div>
        <p className="tip" style={{ marginTop: 0, marginBottom: 14 }}>
          Assessors can sign in and score managers for this company. Add them by email — they must already have an account or you must invite them via Supabase first.
        </p>
        {assessors.map((a) => (
          <div className="list-item" key={a.userId}>
            <span className="ava">{initials(a.name || a.email)}</span>
            <div className="grow">
              <div style={{ fontWeight: 500, fontSize: 14 }}>{a.name || '(no name)'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email} · {a.role}</div>
            </div>
            <button className="icon-btn" title="Remove assessor"
              onClick={async () => {
                await supabase.from('company_members').delete()
                  .eq('company_id', company.id).eq('user_id', a.userId)
                setAssessors((as) => as.filter((x) => x.userId !== a.userId))
              }}>
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        <AddAssessorForm companyId={company.id} existing={assessors}
          onAdded={(a) => setAssessors((as) => [...as, a])}
          showToast={showToast}
        />
      </div>

      {confirm === 'company' && (
        <ConfirmDialog
          title={`Delete "${name}"?`}
          body="This permanently deletes the company, all its rounds, roster, and scores. This cannot be undone."
          danger confirmLabel="Delete company"
          onConfirm={deleteCompany}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

/* ── Round row ───────────────────────────────────────────── */

function RoundRow({ round, companyId, onDelete, onUpdate, showToast }) {
  const [name, setName]         = useState(round.name)
  const [date, setDate]         = useState(round.round_date)
  const [managerCount, setManagerCount] = useState(null)
  const dbTimer = useState(null)

  useEffect(() => {
    supabase.from('round_participants').select('manager_id', { count: 'exact', head: true })
      .eq('round_id', round.id)
      .then(({ count }) => setManagerCount(count || 0))
  }, [round.id])

  function save(field, val) {
    if (field === 'name') setName(val)
    else setDate(val)
    clearTimeout(dbTimer[0])
    dbTimer[0] = setTimeout(() => {
      supabase.from('rounds').update({ [field === 'name' ? 'name' : 'round_date']: val }).eq('id', round.id)
    }, 1000)
  }

  return (
    <div className="list-item">
      <div className="grow" style={{ display: 'grid', gap: 4 }}>
        <input className="inline" value={name} onChange={(e) => save('name', e.target.value)} placeholder="Round name" />
        <div className="row" style={{ gap: 12 }}>
          <input className="inline role" type="date" value={date} onChange={(e) => save('date', e.target.value)} style={{ width: 150 }} />
          {managerCount !== null && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{managerCount} manager{managerCount !== 1 ? 's' : ''}</span>}
        </div>
      </div>
      <button className="icon-btn" title="Delete round" onClick={onDelete}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  )
}

/* ── Add assessor form ───────────────────────────────────── */

function AddAssessorForm({ companyId, existing, onAdded, showToast }) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState('assessor')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    setLoading(true)
    const trimmed = email.trim().toLowerCase()

    // Look up user by email
    const { data: profiles, error } = await supabase.rpc('get_profile_by_email', { p_email: trimmed })
    if (error || !profiles?.length) {
      showToast(`No account found for ${trimmed}. Invite them via Supabase first, then add them here.`, 'err')
      setLoading(false)
      return
    }

    const profile = profiles[0]
    if (existing.find((a) => a.userId === profile.id)) {
      showToast('This person is already an assessor.', 'err')
      setLoading(false)
      return
    }

    const { error: insErr } = await supabase.from('company_members').insert({
      company_id: companyId, user_id: profile.id, role,
    })
    if (insErr) { showToast('Could not add assessor.', 'err'); setLoading(false); return }

    onAdded({ userId: profile.id, name: profile.full_name, email: profile.email, role })
    setEmail('')
    showToast(`${profile.full_name || trimmed} added as ${role}.`)
    setLoading(false)
  }

  return (
    <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      <input className="text-field" style={{ flex: 1, minWidth: 200 }}
        type="email" placeholder="Email address" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <select className="text-field" style={{ width: 130 }}
        value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="assessor">Assessor</option>
        <option value="viewer">Viewer</option>
        <option value="client_admin">Admin</option>
      </select>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Adding…' : 'Add assessor'}
      </button>
    </form>
  )
}
