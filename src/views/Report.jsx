import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { Icon, BandTag, toneOf, initials } from '../components.jsx'
import * as D from '../data.js'

export default function Report() {
  const { id: personId } = useParams()
  const { sessionView, onPrint } = useApp()
  const navigate = useNavigate()

  const rows = useMemo(() => D.aggregate(sessionView), [sessionView])
  const idx = sessionView.roster.findIndex((p) => p.id === personId)
  const person = sessionView.roster[idx]
  const agg = rows.find((r) => r.person.id === personId)

  if (!person || !agg) return <div className="page"><p>Manager not found.</p></div>

  const perAssessor = sessionView.assessors
    .map((a) => ({ assessor: a, rec: (sessionView.scores[a.id] || {})[personId] }))
    .filter((x) => x.rec && D.PEARL.some((d) => x.rec[d.key] != null))

  const notes = perAssessor.filter((x) => (x.rec.notes || "").trim())
  const tt = D.teamType(agg.teamType)
  const prevP = sessionView.roster[idx - 1]
  const nextP = sessionView.roster[idx + 1]

  return (
    <div className="page page-narrow fade-in">
      <div className="row between no-print" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/summary')}><Icon name="back" size={15} /> Summary</button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" disabled={!prevP} onClick={() => prevP && navigate(`/manager/${prevP.id}`)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={!nextP} onClick={() => nextP && navigate(`/manager/${nextP.id}`)}>Next →</button>
          <button className="btn btn-navy btn-sm" onClick={onPrint}><Icon name="printer" size={15} /> Print / PDF</button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="row between wrap" style={{ alignItems: 'center', gap: 20 }}>
          <div className="report-hero">
            <div className="report-ava">{initials(person.name)}</div>
            <div>
              <div className="eyebrow">{sessionView.org} · {sessionView.sessionName}</div>
              <h1 className="page-title" style={{ fontSize: 30, marginTop: 4 }}>{person.name}</h1>
              <div className="muted" style={{ fontWeight: 600 }}>{person.role}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Overall PEARL</div>
            <div style={{ fontSize: 54, fontWeight: 900, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-.02em' }}>
              {agg.overall != null ? agg.overall.toFixed(1) : "–"}
            </div>
            {agg.overall != null && <BandTag value={Math.round(agg.overall)} />}
            <div style={{ marginTop: 8 }}>
              {agg.rank && <span className="band-tag tone-mid">Rank #{agg.rank} of {sessionView.roster.length}</span>}
            </div>
          </div>
        </div>

        {tt && (
          <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 16,
            background: tt.tone === 'gold' ? 'var(--tone-gold-bg)' : tt.tone === 'good' ? 'var(--tone-good-bg)' : tt.tone === 'warn' ? 'var(--tone-warn-bg)' : 'var(--tone-danger-bg)' }}>
            <div style={{ flex: '0 0 auto', width: 44, height: 44, borderRadius: 12, background: 'var(--white)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, color: 'var(--navy)' }}>{tt.n}</div>
            <div>
              <div style={{ fontWeight: 900, color: 'var(--navy)', fontSize: 16 }}>{tt.name}</div>
              <div style={{ fontSize: 13.5, color: 'var(--body-ink)', fontWeight: 600 }}>{tt.action}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {agg.rehire && <span className={"band-tag tone-" + (agg.rehire === "Yes" ? "good" : agg.rehire === "Maybe" ? "warn" : "danger")}>Would rehire: {agg.rehire}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="report-grid">
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 18 }}>Dimension Averages</div>
          {D.PEARL.map((d) => {
            const v = agg.dims[d.key]
            const t = v != null ? toneOf(v) : "mid"
            return (
              <div className="bar-row" key={d.key}>
                <div className="bar-label">{d.name}<small>{d.key} · {d.def.split(",")[0]}</small></div>
                <div className="bar-track"><div className={"bar-fill fill-" + t} style={{ width: (v != null ? v * 10 : 0) + "%" }} /></div>
                <div className="bar-val">{v != null ? v.toFixed(1) : "–"}</div>
              </div>
            )
          })}
        </div>

        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 16 }}>By Assessor</div>
          {perAssessor.length === 0 ? (
            <p className="tip">No scores recorded yet.</p>
          ) : (
            <table className="mini-tbl">
              <thead>
                <tr>
                  <th>Assessor</th>
                  {D.PEARL.map((d) => <th key={d.key}>{d.key}</th>)}
                  <th>Avg</th>
                </tr>
              </thead>
              <tbody>
                {perAssessor.map((x) => (
                  <tr key={x.assessor.id}>
                    <td>{x.assessor.name}</td>
                    {D.PEARL.map((d) => <td key={d.key}>{x.rec[d.key] != null ? x.rec[d.key] : "–"}</td>)}
                    <td>{D.recordAvg(x.rec)?.toFixed(1) ?? "–"}</td>
                  </tr>
                ))}
                <tr className="agg">
                  <td>Combined</td>
                  {D.PEARL.map((d) => <td key={d.key}>{agg.dims[d.key] != null ? agg.dims[d.key].toFixed(1) : "–"}</td>)}
                  <td>{agg.overall != null ? agg.overall.toFixed(1) : "–"}</td>
                </tr>
              </tbody>
            </table>
          )}
          {agg.spread >= 4 && (
            <p className="spread-flag" style={{ marginTop: 14 }}><Icon name="alert" size={13} /> Assessors disagree by up to {agg.spread} points — worth discussing.</p>
          )}
        </div>
      </div>

      {notes.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Notes &amp; Development</div>
          {notes.map((x) => (
            <div className="note-item" key={x.assessor.id}>
              <div className="note-who">{x.assessor.name}</div>
              <div className="note-text">{x.rec.notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
