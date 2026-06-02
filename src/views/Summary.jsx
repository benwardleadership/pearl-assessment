import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { Icon, BandTag, TeamTypeTag, toneOf } from '../components.jsx'
import * as D from '../data.js'

export default function Summary() {
  const { sessionView, exportCSV, onPrint } = useApp()
  const navigate = useNavigate()
  const rows = useMemo(() => D.aggregate(sessionView), [sessionView])
  const ranked = [...rows].sort((a, b) => (a.rank || 999) - (b.rank || 999))
  const scored = rows.filter((r) => r.overall != null)

  const goldenCount  = scored.filter((r) => r.overall >= 9).length
  const concernCount = scored.filter((r) => r.overall < 5).length
  const avgScore     = scored.length ? D.round1(D.mean(scored.map((r) => r.overall))) : null
  const totalAssessors = sessionView.assessors.filter((a) => {
    const s = sessionView.scores[a.id] || {}
    return sessionView.roster.some((p) => { const r = s[p.id]; return r && D.PEARL.some((d) => r[d.key] != null) })
  }).length

  return (
    <div className="page fade-in">
      <div className="page-head row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="eyebrow">Step 2 · Combine &amp; Rank</div>
          <h1 className="page-title">Master Summary</h1>
          <p className="page-sub">Every assessor's scores, averaged per dimension and ranked. Discuss the biggest gaps, then decide the next action.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}><Icon name="download" size={15} /> CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={onPrint}><Icon name="printer" size={15} /> Print / PDF</button>
        </div>
      </div>

      <div className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile">
          <div className="tlabel">Managers Assessed</div>
          <div className="tval">{scored.length}<span style={{ fontSize: 20, color: 'var(--steel)' }}>/{sessionView.roster.length}</span></div>
          <div className="tsub">across {totalAssessors} assessor{totalAssessors === 1 ? "" : "s"}</div>
        </div>
        <div className="tile">
          <div className="tlabel">Team Average</div>
          <div className="tval">{avgScore != null ? avgScore.toFixed(1) : "–"}</div>
          <div className="tsub">{avgScore != null ? D.band(Math.round(avgScore)).label : "Awaiting scores"}</div>
        </div>
        <div className="tile">
          <div className="tlabel">Exceptional / Golden</div>
          <div className="tval ink-gold">{goldenCount}</div>
          <div className="tsub">scoring 9.0 or above</div>
        </div>
        <div className="tile">
          <div className="tlabel">Need Attention</div>
          <div className="tval ink-danger">{concernCount}</div>
          <div className="tsub">below minimum standard</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th className="num" style={{ width: 50 }}>Rank</th>
                <th>Manager</th>
                {D.PEARL.map((d) => <th key={d.key} className="num" title={d.name}>{d.key}</th>)}
                <th className="num">Overall</th>
                <th>Rehire</th>
                <th>Team Type → Action</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.person.id} onClick={() => navigate(`/manager/${r.person.id}`)}>
                  <td className="num">
                    {r.rank
                      ? <span className={"rank-badge" + (r.rank === 1 ? " top" : "")}>{r.rank}</span>
                      : <span className="muted">–</span>}
                  </td>
                  <td>
                    <div className="cell-name">{r.person.name}</div>
                    <div className="cell-role">{r.person.role}</div>
                    {r.spread >= 4 && (
                      <span className="spread-flag"><Icon name="alert" size={12} /> {r.spread}-pt gap between assessors</span>
                    )}
                  </td>
                  {D.PEARL.map((d) => (
                    <td key={d.key} className="num">
                      {r.dims[d.key] != null
                        ? <span className={"dim-pill tone-" + toneOf(r.dims[d.key])}>{r.dims[d.key].toFixed(1)}</span>
                        : <span className="muted">–</span>}
                    </td>
                  ))}
                  <td className="num"><span className="overall-num">{r.overall != null ? r.overall.toFixed(1) : "–"}</span></td>
                  <td>
                    {r.rehire
                      ? <span className={"band-tag tone-" + (r.rehire === "Yes" ? "good" : r.rehire === "Maybe" ? "warn" : "danger")}>{r.rehire}</span>
                      : <span className="muted">–</span>}
                  </td>
                  <td><TeamTypeTag id={r.teamType} withAction /></td>
                  <td><Icon name="chevron" size={16} color="var(--steel)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {scored.length === 0 && (
        <p className="tip" style={{ textAlign: 'center', marginTop: 18 }}>No scores yet — go to <b>Assess</b> to begin scoring the roster.</p>
      )}

      <ProcessStrip />
    </div>
  )
}

function ProcessStrip() {
  return (
    <div className="card card-pad" style={{ marginTop: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Recommended Executive Process</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {D.PROCESS.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: 9, background: 'var(--navy)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14 }}>{i + 1}</div>
            <div style={{ fontSize: 13.5, color: 'var(--body-ink)', lineHeight: 1.45 }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
