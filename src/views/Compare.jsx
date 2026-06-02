import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { Icon, toneOf } from '../components.jsx'
import * as D from '../data.js'

export default function Compare() {
  const { company, onPrint } = useApp()
  const navigate = useNavigate()
  const sessions = [...company.sessions].sort((a, b) => (a.date || "").localeCompare(b.date || ""))
  const [fromId, setFromId] = useState(sessions[0]?.id || null)
  const [toId,   setToId]   = useState(sessions.length ? sessions[sessions.length - 1].id : null)

  if (company.sessions.length < 2) {
    return (
      <div className="page fade-in">
        <div className="page-head">
          <div className="eyebrow">Step 4 · Track Progress</div>
          <h1 className="page-title">Compare Rounds</h1>
        </div>
        <div className="empty-state card">
          <img className="es-mark" src="/s-mark.png" alt="" />
          <h3 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>You need at least two review rounds</h3>
          <p style={{ margin: '0 0 18px' }}>Create a second round to see how your managers move over time.</p>
          <button className="btn btn-primary" onClick={() => navigate('/setup')}><Icon name="plus" size={16} /> Add a review round</button>
        </div>
      </div>
    )
  }

  const fromS = company.sessions.find((s) => s.id === fromId) || sessions[0]
  const toS   = company.sessions.find((s) => s.id === toId)   || sessions[sessions.length - 1]
  const fromRows = useMemo(() => D.aggregate(fromS), [fromS])
  const toRows   = useMemo(() => D.aggregate(toS),   [toS])
  const fromMap = {}; fromRows.forEach((r) => (fromMap[r.person.id] = r))
  const toMap   = {}; toRows.forEach((r) => (toMap[r.person.id] = r))

  const ids = []
  toS.roster.forEach((p) => ids.push(p.id))
  fromS.roster.forEach((p) => { if (!ids.includes(p.id)) ids.push(p.id) })

  const rows = ids.map((id) => {
    const t = toMap[id], f = fromMap[id]
    const person = (t && t.person) || (f && f.person)
    const fo = f ? f.overall : null, to = t ? t.overall : null
    const delta = fo != null && to != null ? D.round1(to - fo) : null
    return { id, person, fo, to, delta, f, t }
  }).filter((r) => r.person)

  rows.sort((a, b) => (b.to == null ? -1 : b.to) - (a.to == null ? -1 : a.to))

  const moved   = rows.filter((r) => r.delta != null)
  const improved = moved.filter((r) => r.delta >  0.05).length
  const declined = moved.filter((r) => r.delta < -0.05).length
  const avgDelta = moved.length ? D.round1(D.mean(moved.map((r) => r.delta))) : null
  const biggest  = moved.slice().sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]

  return (
    <div className="page fade-in">
      <div className="page-head row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="eyebrow">Step 4 · Track Progress</div>
          <h1 className="page-title">Compare Rounds</h1>
          <p className="page-sub">See how every manager has moved between two evaluation rounds — who's climbing, who's slipping, and where to focus.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onPrint}><Icon name="printer" size={15} /> Print / PDF</button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="cmp-controls">
          <div>
            <label className="field-label">Baseline round</label>
            <select className="field-select" style={{ minWidth: 220 }} value={fromS.id} onChange={(e) => setFromId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.date}</option>)}
            </select>
          </div>
          <Icon name="chevron" size={22} style={{ color: 'var(--steel)', alignSelf: 'center', marginTop: 18 }} />
          <div>
            <label className="field-label">Compared round</label>
            <select className="field-select" style={{ minWidth: 220 }} value={toS.id} onChange={(e) => setToId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.date}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="tiles" style={{ marginBottom: 20 }}>
        <div className="tile">
          <div className="tlabel">Team Movement</div>
          <div className={"tval " + (avgDelta > 0 ? "ink-good" : avgDelta < 0 ? "ink-danger" : "")}>{avgDelta != null ? (avgDelta > 0 ? "+" : "") + avgDelta.toFixed(1) : "–"}</div>
          <div className="tsub">avg change in overall</div>
        </div>
        <div className="tile"><div className="tlabel">Improved</div><div className="tval ink-good">{improved}</div><div className="tsub">managers trending up</div></div>
        <div className="tile"><div className="tlabel">Declined</div><div className="tval ink-danger">{declined}</div><div className="tsub">managers trending down</div></div>
        <div className="tile">
          <div className="tlabel">Biggest Mover</div>
          <div className="tval" style={{ fontSize: 24, marginTop: 14 }}>{biggest ? biggest.person.name : "–"}</div>
          <div className="tsub">{biggest ? (biggest.delta > 0 ? "+" : "") + biggest.delta.toFixed(1) + " points" : ""}</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Manager</th>
                <th className="num">{fromS.name}</th>
                <th></th>
                <th className="num">{toS.name}</th>
                <th className="num">Change</th>
                <th>By Dimension (Δ)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/manager/${r.id}`)}>
                  <td><div className="cell-name">{r.person.name}</div><div className="cell-role">{r.person.role}</div></td>
                  <td className="num">{r.fo != null ? <span className={"dim-pill tone-" + toneOf(r.fo)}>{r.fo.toFixed(1)}</span> : <span className="muted">–</span>}</td>
                  <td className="num"><Icon name="chevron" size={14} color="var(--steel)" /></td>
                  <td className="num">{r.to != null ? <span className={"dim-pill tone-" + toneOf(r.to)}>{r.to.toFixed(1)}</span> : <span className="muted">–</span>}</td>
                  <td className="num"><Delta delta={r.delta} /></td>
                  <td>
                    <span className="dim-delta">
                      {D.PEARL.map((d) => {
                        const fv = r.f ? r.f.dims[d.key] : null, tv = r.t ? r.t.dims[d.key] : null
                        const dd = fv != null && tv != null ? D.round1(tv - fv) : null
                        const cls = dd == null ? "flat" : dd > 0.05 ? "up" : dd < -0.05 ? "down" : "flat"
                        return <span key={d.key}>{d.key}<b className={cls}> {dd == null ? "·" : (dd > 0 ? "+" : "") + dd.toFixed(1)}</b></span>
                      })}
                    </span>
                  </td>
                  <td><Icon name="chevron" size={16} color="var(--steel)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Delta({ delta }) {
  if (delta == null) return <span className="delta flat">new</span>
  const cls = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat"
  const sym = delta > 0.05 ? "▲" : delta < -0.05 ? "▼" : "■"
  return <span className={"delta " + cls}>{sym} {delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>
}
