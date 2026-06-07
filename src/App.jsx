import { NavLink, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext.jsx'
import { Icon, Menu } from './components.jsx'
import { supabase } from './supabase.js'

export default function App() {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <footer className="footer no-print">
          Built on The Sellership System® · Identify, develop, and multiply your GOLDEN people.
        </footer>
      </div>
    </AppProvider>
  )
}

function TopBar() {
  const { ws, company, session, isSuperAdmin, switchCompany, switchSession, addCompany, addRound, addBlankSession, exportBackup, exportCSV, onPrint, fileInputRef } = useApp()

  const nav = [
    ...(isSuperAdmin ? [{ to: '/clients', label: 'Clients' }] : []),
    { to: '/setup',   label: 'Setup'          },
    { to: '/assess',  label: 'Assess'         },
    { to: '/summary', label: 'Master Summary' },
    { to: '/board',   label: 'Talent Board'   },
    { to: '/compare', label: 'Compare Rounds' },
  ]

  return (
    <header className="topbar no-print">
      <div className="topbar-inner">
        <div className="brand">
          <img src="/s-mark-on-navy.png" alt="Sellership S mark" />
          <div className="brand-text">
            <span className="brand-eyebrow">The Sellership System<span style={{ fontSize: 7, verticalAlign: 'super' }}>®</span></span>
            <span className="brand-title">PEARL Assessment</span>
          </div>
        </div>

        <nav className="nav">
          {nav.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-spacer" />

        <div className="topbar-actions">
          <div className="switcher">
            {/* Company switcher */}
            <Menu align="right" trigger={
              <button className="switch-btn">
                <span className="sb-label">
                  <span className="sb-kind">Company</span>
                  <span className="sb-name">{company.name}</span>
                </span>
                <Icon name="chevron" size={14} style={{ transform: 'rotate(90deg)', color: 'rgba(255,255,255,.5)' }} />
              </button>
            }>
              <div className="menu-label">Companies</div>
              {ws.companies.map((c) => (
                <button key={c.id} className={"menu-item" + (c.id === company.id ? " on" : "")}
                  onClick={() => switchCompany(c.id)}>
                  <span className="mi-main">
                    {c.name}
                    <span className="mi-sub" style={{ display: 'block' }}>{c.sessions.length} round{c.sessions.length === 1 ? "" : "s"}</span>
                  </span>
                  {c.id === company.id && <Icon name="check" size={15} />}
                </button>
              ))}
              <div className="menu-sep" />
              <button className="menu-item add" onClick={addCompany}><Icon name="plus" size={15} /> New company</button>
            </Menu>

            <div className="switch-div" />

            {/* Round switcher */}
            <Menu align="right" trigger={
              <button className="switch-btn session">
                <span className="sb-label">
                  <span className="sb-kind">Round</span>
                  <span className="sb-name">{session.name}</span>
                </span>
                <Icon name="chevron" size={14} style={{ transform: 'rotate(90deg)', color: 'rgba(255,255,255,.5)' }} />
              </button>
            }>
              <div className="menu-label">{company.name} · Rounds</div>
              {company.sessions.map((s) => (
                <button key={s.id} className={"menu-item" + (s.id === session.id ? " on" : "")}
                  onClick={() => switchSession(s.id)}>
                  <span className="mi-main">
                    {s.name}
                    <span className="mi-sub" style={{ display: 'block' }}>{s.date}</span>
                  </span>
                  {s.id === session.id && <Icon name="check" size={15} />}
                </button>
              ))}
              <div className="menu-sep" />
              <button className="menu-item add" onClick={addRound}><Icon name="plus" size={15} /> New round (same roster)</button>
              <button className="menu-item add" onClick={addBlankSession}><Icon name="plus" size={15} /> Blank round</button>
            </Menu>
          </div>

          {/* Sign out */}
          <button className="btn-ghost-topbar" onClick={() => supabase.auth.signOut()} title="Sign out">
            <Icon name="x" size={15} />
          </button>

          {/* Backup menu */}
          <Menu align="right" trigger={
            <button className="icon-btn" style={{ color: 'rgba(255,255,255,.7)' }} title="Backup & data">
              <Icon name="download" size={18} />
            </button>
          }>
            <div className="menu-label">Backup &amp; Data</div>
            <button className="menu-item" onClick={exportBackup}><Icon name="download" size={15} /> Save backup file (.json)</button>
            <button className="menu-item" onClick={() => fileInputRef.current?.click()}><Icon name="refresh" size={15} /> Restore from backup</button>
            <div className="menu-sep" />
            <button className="menu-item" onClick={exportCSV}><Icon name="grid" size={15} /> Export this round (CSV)</button>
            <button className="menu-item" onClick={onPrint}><Icon name="printer" size={15} /> Print / PDF</button>
          </Menu>
        </div>
      </div>
    </header>
  )
}
