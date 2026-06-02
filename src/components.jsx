import { useState, useEffect, useRef } from 'react'
import { band, PEARL, TEAM_TYPES, emptyRecord } from './data.js'

export function Icon({ name, size = 18, color = "currentColor", style, className }) {
  const paths = {
    summary:  "M3 3v18h18 M7 16l4-5 3 3 5-7",
    grid:     "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
    board:    "M4 4h4v16H4z M10 4h4v10h-4z M16 4h4v13h-4z",
    user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    plus:     "M12 5v14 M5 12h14",
    x:        "M18 6 6 18 M6 6l12 12",
    trash:    "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    printer:  "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
    back:     "M19 12H5 M12 19l-7-7 7-7",
    chevron:  "M9 18l6-6-6-6",
    edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
    check:    "M20 6 9 17l-5-5",
    alert:    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z M12 9v4 M12 17h.01",
    eye:      "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    sparkle:  "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z",
    refresh:  "M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5",
  };
  const d = paths[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i ? "M" : "") + seg} />
      ))}
    </svg>
  );
}

export function initials(name) {
  const p = (name || "").trim().split(/\s+/);
  if (!p.length || !p[0]) return "?";
  return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase();
}

export function toneOf(v) {
  const b = band(v);
  return b ? b.tone : "mid";
}

export function BandTag({ value, showScore }) {
  const b = band(value);
  if (!b) return <span className="muted" style={{ fontSize: 12 }}>—</span>;
  return (
    <span className={"band-tag tone-" + b.tone}>
      <span className={"dot fill-" + b.tone} />
      {showScore ? <b>{value}</b> : null}{b.label}
    </span>
  );
}

export function TeamTypeTag({ id, withAction }) {
  const t = TEAM_TYPES.find((x) => x.id === id) || null;
  if (!t) return <span className="muted" style={{ fontSize: 12 }}>—</span>;
  return (
    <span className={"tt-tag tone-" + t.tone}>
      <span className={"dot fill-" + t.tone} style={{ width: 7, height: 7, borderRadius: "50%" }} />
      {t.name}{withAction ? ` · ${t.short}` : ""}
    </span>
  );
}

export function ScoreButtons({ value, onChange }) {
  return (
    <div className="scorebar">
      {[1,2,3,4,5,6,7,8,9,10].map((n) => {
        const b = band(n);
        const sel = value === n;
        return (
          <button key={n}
            className={`score-btn ${sel ? "sel t-" + b.tone : ""}`}
            onClick={(e) => { e.stopPropagation(); onChange(sel ? null : n); }}
            title={`${n} — ${b.label}`}>
            {n}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className={"modal" + (wide ? " modal-wide" : "")} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h3 className="page-title" style={{ fontSize: 24 }}>{title}</h3>
      <p className="page-sub" style={{ marginTop: 10 }}>{body}</p>
      <div className="row" style={{ marginTop: 24, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={"btn " + (danger ? "btn-danger" : "btn-primary")}
          onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel || "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

export function Menu({ trigger, children, align }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="menu-wrap" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={"menu-pop" + (align === "right" ? " right" : "")} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
