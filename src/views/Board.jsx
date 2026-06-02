import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { Icon, toneOf } from '../components.jsx'
import * as D from '../data.js'

export default function Board() {
  const { sessionView, onPrint } = useApp()
  const navigate = useNavigate()
  const rows = useMemo(() => D.aggregate(sessionView), [sessionView])
  const scored = rows.filter((r) => r.overall != null)

  const buckets = {}
  D.TEAM_TYPES.forEach((t) => (buckets[t.id] = []))
  const unassigned = []
  scored.forEach((r) => {
    if (r.teamType && buckets[r.teamType]) buckets[r.teamType].push(r)
    else unassigned.push(r)
  })
  D.TEAM_TYPES.forEach((t) => buckets[t.id].sort((a, b) => b.overall - a.overall))

  return (
    <div className="page fade-in">
      <div className="page-head row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="eyebrow">Step 3 · Decide</div>
          <h1 className="page-title">Talent Board</h1>
          <p className="page-sub">Every manager grouped by their consensus team type. Protect the culture, coach the wavering, develop the adders, and invest in your multipliers.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onPrint}><Icon name="printer" size={15} /> Print / PDF</button>
      </div>

      <div className="board">
        {D.TEAM_TYPES.map((t) => (
          <div className="board-col" key={t.id}>
            <div className={"board-head " + t.id}>
              <span className="cnt">{buckets[t.id].length}</span>
              <div className="n">TYPE {t.n} · {t.short.toUpperCase()}</div>
              <div className="nm">{t.name}</div>
              <div className="act">{t.action}</div>
            </div>
            <div className="board-body">
              {buckets[t.id].length === 0
                ? <div className="board-empty">No managers</div>
                : buckets[t.id].map((r) => (
                  <div className="board-card" key={r.person.id} onClick={() => navigate(`/manager/${r.person.id}`)}>
                    <div className="bc-top">
                      <span className="bc-name">{r.person.name}</span>
                      <span className={"bc-score ink-" + (['gold','good'].includes(toneOf(r.overall)) ? toneOf(r.overall) : toneOf(r.overall) === 'danger' ? 'danger' : toneOf(r.overall) === 'warn' ? 'warn' : 'good')}>{r.overall.toFixed(1)}</span>
                    </div>
                    <div className="bc-role">{r.person.role}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Scored · No team type chosen yet</div>
          <div className="row wrap" style={{ gap: 10 }}>
            {unassigned.map((r) => (
              <button key={r.person.id} className="board-card" style={{ minWidth: 150 }} onClick={() => navigate(`/manager/${r.person.id}`)}>
                <div className="bc-top"><span className="bc-name">{r.person.name}</span><span className="bc-score" style={{ color: 'var(--navy)' }}>{r.overall.toFixed(1)}</span></div>
                <div className="bc-role">{r.person.role}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {scored.length === 0 && (
        <div className="empty-state card" style={{ marginTop: 18 }}>
          <img className="es-mark" src="/s-mark.png" alt="" />
          <p style={{ margin: 0 }}>Score the roster in <b>Assess</b> to populate the board.</p>
        </div>
      )}
    </div>
  )
}
