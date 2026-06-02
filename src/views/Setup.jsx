import { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { Icon, ConfirmDialog, initials } from '../components.jsx'
import { supabase } from '../supabase.js'
import * as D from '../data.js'

export default function Setup() {
  const {
    ws, company, session,
    updateWs, updateSession, updateCompany,
    switchSession, addRound, addBlankSession,
    addPerson, patchPerson, removePerson,
    addAssessor, patchAssessor, removeAssessor,
    loadSample, clearScores, resetAll,
    exportBackup, fileInputRef,
  } = useApp()
  const [confirm, setConfirm] = useState(null)

  const patchSession = (sid, k, v) => updateCompany((c) => ({ ...c, sessions: c.sessions.map((s) => s.id === sid ? { ...s, [k]: v } : s) }))

  async function deleteSession(sid) {
    if (company.sessions.length <= 1) return
    const remaining = company.sessions.filter((s) => s.id !== sid)
    await supabase.from('rounds').delete().eq('id', sid)
    updateCompany((c) => ({ ...c, sessions: remaining }))
    if (sid === session.id) switchSession(remaining[0].id)
  }

  async function deleteCompany() {
    if (ws.companies.length <= 1) return
    await supabase.from('companies').delete().eq('id', company.id)
    updateWs((w) => {
      const companies = w.companies.filter((c) => c.id !== company.id)
      return { ...w, companies, activeCompanyId: companies[0].id, activeSessionId: companies[0].sessions[0]?.id || null }
    })
  }

  return (
    <div className="page page-narrow fade-in">
      <div className="page-head">
        <div className="eyebrow">Configure</div>
        <h1 className="page-title">Setup</h1>
        <p className="page-sub">Manage your company, its review rounds over time, the roster of managers, and the executives who score them.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 24 }}>
          <div className="grow" style={{ minWidth: 240 }}>
            <label className="field-label">Company / Organization</label>
            <input className="text-field" value={company.name} onChange={(e) => updateCompany((c) => ({ ...c, name: e.target.value }))} />
          </div>
          <div className="grow" style={{ minWidth: 200 }}>
            <label className="field-label">Active Round Name</label>
            <input className="text-field" value={session.name} onChange={(e) => updateSession((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="field-label">Date</label>
            <input className="text-field" type="date" value={session.date} onChange={(e) => updateSession((s) => ({ ...s, date: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="eyebrow">Review Rounds Over Time · {company.sessions.length}</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addRound}><Icon name="plus" size={15} /> New round (same roster)</button>
            <button className="btn btn-ghost btn-sm" onClick={addBlankSession}>Blank round</button>
          </div>
        </div>
        <p className="tip" style={{ marginTop: 0, marginBottom: 14 }}>
          A round is one evaluation cycle (e.g. a quarter). <b>New round (same roster)</b> copies these managers &amp; assessors with fresh scores so you can re-evaluate next quarter, then compare side by side.
        </p>
        {company.sessions.map((s) => (
          <div className="list-item" key={s.id} style={s.id === session.id ? { borderColor: 'var(--teal)', borderWidth: 1.5 } : {}}>
            <div className="grow" style={{ display: 'grid', gap: 2 }}>
              <input className="inline" value={s.name} onChange={(e) => patchSession(s.id, "name", e.target.value)} />
              <input className="inline role" type="date" value={s.date} onChange={(e) => patchSession(s.id, "date", e.target.value)} style={{ width: 160 }} />
            </div>
            {s.id === session.id
              ? <span className="band-tag tone-good" style={{ marginRight: 6 }}>Active</span>
              : <button className="btn btn-ghost btn-sm" onClick={() => switchSession(s.id)}>Open</button>}
            <button className="icon-btn" onClick={() => deleteSession(s.id)} disabled={company.sessions.length <= 1} title="Delete round">
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="report-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 16 }}>
            <div className="eyebrow">Roster · {session.roster.length} Managers</div>
            <button className="btn btn-primary btn-sm" onClick={addPerson}><Icon name="plus" size={15} /> Add manager</button>
          </div>
          {session.roster.length === 0 && <p className="tip">No managers yet. Add the people you want to assess.</p>}
          {session.roster.map((p) => (
            <div className="list-item" key={p.id}>
              <span className="person-ava" style={{ width: 34, height: 34, fontSize: 12 }}>{initials(p.name)}</span>
              <div className="grow" style={{ display: 'grid', gap: 2 }}>
                <input className="inline" value={p.name} onChange={(e) => patchPerson(p.id, "name", e.target.value)} placeholder="Name" />
                <input className="inline role" value={p.role} onChange={(e) => patchPerson(p.id, "role", e.target.value)} placeholder="Role / title" />
              </div>
              <button className="icon-btn" onClick={() => removePerson(p.id)} title="Remove"><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <div className="eyebrow">Assessors · {session.assessors.length}</div>
              <button className="btn btn-ghost btn-sm" onClick={addAssessor}><Icon name="plus" size={15} /> Add</button>
            </div>
            {session.assessors.map((a) => (
              <div className="list-item" key={a.id}>
                <span className="ava">{initials(a.name)}</span>
                <input className="inline grow" value={a.name} onChange={(e) => patchAssessor(a.id, e.target.value)} placeholder="Assessor name" />
                <button className="icon-btn" onClick={() => removeAssessor(a.id)} disabled={session.assessors.length <= 1} title="Remove">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Backup &amp; Data</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn btn-navy" onClick={exportBackup}><Icon name="download" size={15} /> Save backup file</button>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}><Icon name="refresh" size={15} /> Restore from backup</button>
              <hr className="divider-line" style={{ margin: '6px 0' }} />
              <button className="btn btn-ghost" onClick={() => setConfirm("sample")}>Load sample data</button>
              <button className="btn btn-ghost" onClick={() => setConfirm("scores")}>Clear scores · this round</button>
              {ws.companies.length > 1 && (
                <button className="btn btn-danger" onClick={() => setConfirm("company")}><Icon name="trash" size={15} /> Delete this company</button>
              )}
              <button className="btn btn-danger" onClick={() => setConfirm("all")}><Icon name="trash" size={15} /> Reset everything</button>
            </div>
            <p className="tip" style={{ marginTop: 12, marginBottom: 0 }}>Saved automatically in this browser. Use <b>Save backup file</b> to move data between computers or keep it safe.</p>
          </div>
        </div>
      </div>

      {confirm === "sample"  && <ConfirmDialog title="Load sample data?" body="Replaces everything with the Endeavor demo — two quarters across one company." confirmLabel="Load sample" onConfirm={loadSample} onClose={() => setConfirm(null)} />}
      {confirm === "scores"  && <ConfirmDialog title="Clear scores for this round?" body={`Removes every score, note, and team-type pick in "${session.name}". Roster and assessors stay.`} danger confirmLabel="Clear scores" onConfirm={clearScores} onClose={() => setConfirm(null)} />}
      {confirm === "company" && <ConfirmDialog title="Delete this company?" body={`Permanently removes "${company.name}" and all its review rounds.`} danger confirmLabel="Delete company" onConfirm={deleteCompany} onClose={() => setConfirm(null)} />}
      {confirm === "all"     && <ConfirmDialog title="Reset everything?" body="Wipes all companies, rounds, and scores back to a blank slate. Save a backup first if unsure." danger confirmLabel="Reset all" onConfirm={resetAll} onClose={() => setConfirm(null)} />}
    </div>
  )
}
