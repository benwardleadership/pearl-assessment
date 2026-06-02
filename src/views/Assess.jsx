import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { Icon, BandTag, TeamTypeTag, ScoreButtons, toneOf, initials } from '../components.jsx'
import * as D from '../data.js'

export default function Assess() {
  const { sessionView, activeAssessor, setActiveAssessor, setRecord } = useApp()
  const [openId, setOpenId] = useState(null)
  const [showRubric, setShowRubric] = useState(false)
  const navigate = useNavigate()

  const aId = activeAssessor
  const myScores = sessionView.scores[aId] || {}
  const scoredCount = sessionView.roster.filter((p) => {
    const r = myScores[p.id]
    return r && D.PEARL.some((d) => r[d.key] != null)
  }).length

  function patch(personId, key, val) {
    const cur = myScores[personId] || D.emptyRecord()
    setRecord(aId, personId, { ...cur, [key]: val })
  }

  return (
    <div className="page fade-in">
      <div className="page-head row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="eyebrow">Step 1 · Score Privately</div>
          <h1 className="page-title">Leadership &amp; Culture Assessment</h1>
          <p className="page-sub">Each executive scores every manager privately on the five PEARL dimensions, 1–10. Switch assessors below — scores are kept separate, then combined in the Master Summary.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowRubric((v) => !v)}>
          <Icon name="eye" size={15} /> {showRubric ? "Hide" : "Show"} scoring rubric
        </button>
      </div>

      {showRubric && <RubricPanel />}

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="field-label">Who is scoring?</div>
        <div className="assessor-tabs">
          {sessionView.assessors.map((a) => {
            const s = sessionView.scores[a.id] || {}
            const done = sessionView.roster.filter((p) => { const r = s[p.id]; return r && D.PEARL.some((d) => r[d.key] != null) }).length
            return (
              <button key={a.id}
                className={"assessor-tab" + (a.id === aId ? " active" : "")}
                onClick={() => { setActiveAssessor(a.id); setOpenId(null) }}>
                <span className="ava">{initials(a.name)}</span>
                {a.name}
                <span className="prog">{done}/{sessionView.roster.length}</span>
              </button>
            )
          })}
        </div>
        <div className="row between" style={{ marginTop: 14, alignItems: 'center' }}>
          <p className="tip" style={{ margin: 0 }}>
            <b style={{ color: 'var(--navy)' }}>{sessionView.assessors.find((a) => a.id === aId)?.name}</b> has scored{' '}
            <b style={{ color: 'var(--teal-600)' }}>{scoredCount}</b> of {sessionView.roster.length} managers.
          </p>
          <ProgressBar value={scoredCount} max={sessionView.roster.length} />
        </div>
      </div>

      {sessionView.roster.length === 0
        ? <EmptyRoster />
        : sessionView.roster.map((person) => (
          <AssessRow key={person.id}
            person={person}
            rec={myScores[person.id] || D.emptyRecord()}
            open={openId === person.id}
            onToggle={() => setOpenId(openId === person.id ? null : person.id)}
            onPatch={(k, v) => patch(person.id, k, v)}
            goPerson={() => navigate(`/manager/${person.id}`)} />
        ))
      }
    </div>
  )
}

function ProgressBar({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--offwhite)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--teal)', borderRadius: 99, transition: 'width .36s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>{pct}%</span>
    </div>
  )
}

function AssessRow({ person, rec, open, onToggle, onPatch, goPerson }) {
  const avg = D.recordAvg(rec)
  const scored = D.PEARL.some((d) => rec[d.key] != null)
  return (
    <div className={"score-row" + (scored ? " done" : "")}
      style={{ display: 'block', cursor: open ? 'default' : 'pointer', marginTop: 10 }}
      onClick={() => !open && onToggle()}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px,1fr) auto auto auto auto', alignItems: 'center', gap: 18 }}>
        <div className="person-cell">
          <span className="person-ava">{initials(person.name)}</span>
          <div>
            <div className="person-name">{person.name}</div>
            <div className="person-role">{person.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {D.PEARL.map((d) => (
            <div key={d.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.06em' }}>{d.key}</div>
              <span className={rec[d.key] != null ? "dim-pill tone-" + toneOf(rec[d.key]) : "dim-pill"}
                style={rec[d.key] == null ? { color: 'var(--steel)', background: 'var(--offwhite)' } : {}}>
                {rec[d.key] != null ? rec[d.key] : "–"}
              </span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.06em' }}>AVG</div>
          <div className={"dim-avg" + (avg == null ? " empty" : "")}>{avg != null ? avg.toFixed(1) : "–"}</div>
        </div>
        <div style={{ minWidth: 120, display: 'flex', justifyContent: 'center' }}>
          <TeamTypeTag id={rec.teamType} />
        </div>
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onToggle() }} title={open ? "Collapse" : "Score"}>
          <Icon name="chevron" size={18} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
        </button>
      </div>

      {open && (
        <div className="fade-in" style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #EEF2F6' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {D.PEARL.map((d) => (
              <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '210px 1fr auto', alignItems: 'center', gap: 18 }}>
                <div>
                  <div style={{ fontWeight: 900, color: 'var(--navy)', fontSize: 15 }}>
                    <span style={{ color: 'var(--teal)' }}>{d.key}</span> — {d.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4, marginTop: 2 }}>{d.def}</div>
                </div>
                <ScoreButtons value={rec[d.key]} onChange={(v) => onPatch(d.key, v)} />
                <div style={{ minWidth: 132 }}>
                  {rec[d.key] != null ? <BandTag value={rec[d.key]} /> : <span className="muted" style={{ fontSize: 12 }}>Not scored</span>}
                </div>
              </div>
            ))}
          </div>

          <hr className="divider-line" />

          <div className="row wrap" style={{ gap: 28, alignItems: 'flex-start' }}>
            <div>
              <div className="field-label">Would Rehire?</div>
              <div className="rehire-seg">
                {D.REHIRE.map((opt) => (
                  <button key={opt}
                    className={rec.rehire === opt ? "on-" + opt.toLowerCase() : ""}
                    onClick={() => onPatch("rehire", rec.rehire === opt ? null : opt)}>{opt}</button>
                ))}
              </div>
            </div>
            <div style={{ minWidth: 220 }}>
              <div className="field-label">Team Type → Next Step</div>
              <select className="field-select" value={rec.teamType || ""} onChange={(e) => onPatch("teamType", e.target.value || null)}>
                <option value="">Select…</option>
                {D.TEAM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.n} · {t.name} — {t.action}</option>
                ))}
              </select>
            </div>
            <div className="grow" style={{ minWidth: 240 }}>
              <div className="field-label">Notes</div>
              <textarea className="notes-input" placeholder="Context, development plan, observations…"
                value={rec.notes} onChange={(e) => onPatch("notes", e.target.value)} />
            </div>
          </div>

          <div className="row between" style={{ marginTop: 18 }}>
            <button className="btn btn-ghost btn-sm" onClick={goPerson}><Icon name="user" size={15} /> View report card</button>
            <button className="btn btn-primary btn-sm" onClick={onToggle}><Icon name="check" size={15} /> Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function RubricPanel() {
  return (
    <div className="card card-pad fade-in" style={{ marginBottom: 18 }}>
      <div className="pearl-legend" style={{ marginBottom: 18 }}>
        {D.PEARL.map((d) => (
          <div className="pearl-cell" key={d.key}>
            <div className="pearl-key"><b>{d.key}</b></div>
            <div className="pearl-name">{d.name}</div>
            <div className="pearl-def">{d.def}</div>
          </div>
        ))}
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        {D.BANDS.map((b) => (
          <span key={b.label} className={"band-tag tone-" + b.tone}>
            <span className={"dot fill-" + b.tone} />
            {b.min === b.max ? b.min : `${b.min}–${b.max}`} · {b.label}
          </span>
        ))}
      </div>
      <p className="tip" style={{ marginTop: 12, marginBottom: 0 }}>
        <b style={{ color: 'var(--tone-gold)' }}>GOLDEN (10)</b> — {D.GOLDEN_DEF}
      </p>
    </div>
  )
}

function EmptyRoster() {
  return (
    <div className="empty-state card">
      <img className="es-mark" src="/s-mark.png" alt="" />
      <h3 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>No managers on the roster yet</h3>
      <p style={{ margin: 0 }}>Head to <b>Setup</b> to add the people you want to assess.</p>
    </div>
  )
}
