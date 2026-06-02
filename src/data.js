/* ============================================================
   PEARL DATA — ES module (ported from data.js IIFE)
   ============================================================ */

export const PEARL = [
  { key: "P", name: "Potential",  def: "Future upside, mission alignment, ownership mentality, intentionality" },
  { key: "E", name: "Effort",     def: "Urgency, best effort, personal development, raising standards" },
  { key: "A", name: "Attitude",   def: "Coachability, buy-in, perseverance, character" },
  { key: "R", name: "Results",    def: "KPIs, execution, ownership, beat prior best" },
  { key: "L", name: "Leadership", def: "Teamwork, develops others, accountability, soft like a brick" },
];

export const BANDS = [
  { min: 1,  max: 2,  label: "Serious concern",  tone: "danger" },
  { min: 3,  max: 4,  label: "Below standard",   tone: "warn"   },
  { min: 5,  max: 6,  label: "Minimum standard", tone: "mid"    },
  { min: 7,  max: 8,  label: "Above average",    tone: "good"   },
  { min: 9,  max: 9,  label: "Exceptional",      tone: "great"  },
  { min: 10, max: 10, label: "GOLDEN",           tone: "gold"   },
];

export const GOLDEN_DEF = "Fully embodies the culture, elevates the team, and consistently lives the mission, values, and leadership standards.";

export function band(v) {
  if (v == null || isNaN(v)) return null;
  if (v < 2.5) return BANDS[0];
  if (v < 4.5) return BANDS[1];
  if (v < 6.5) return BANDS[2];
  if (v < 9)   return BANDS[3];
  if (v < 10)  return BANDS[4];
  return BANDS[5];
}

export const TEAM_TYPES = [
  { id: "divider",    n: 1, name: "Divider",    action: "Protect the Culture. Time to Prune.", tone: "danger", short: "Prune"   },
  { id: "subtractor", n: 2, name: "Subtractor", action: "Coach. Clarify. Decide. (3-9-17)",    tone: "warn",   short: "Coach"   },
  { id: "adder",      n: 3, name: "Adder",      action: "Appreciate. Develop. Elevate.",       tone: "good",   short: "Develop" },
  { id: "multiplier", n: 4, name: "Multiplier", action: "Spotlight. Reward. Invest.",          tone: "gold",   short: "Invest"  },
];

export const teamType = (id) => TEAM_TYPES.find((t) => t.id === id) || null;

export const REHIRE = ["Yes", "Maybe", "No"];

export const PROCESS = [
  "Score each manager privately first.",
  "Discuss biggest gaps between executive scores. Debate as needed.",
  "Decide next action: invest, develop, coach, or prune.",
  "Leadership team evaluates management, then management evaluates their teams.",
];

export const round1 = (n) => Math.round(n * 10) / 10;

export function mean(arr) {
  const vals = arr.filter((v) => v != null && !isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function recordAvg(rec) {
  if (!rec) return null;
  const m = mean(PEARL.map((d) => rec[d.key]));
  return m == null ? null : round1(m);
}

let _seq = 0;
export const uid = (p) => `${p}_${Date.now().toString(36)}${(_seq++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
export const emptyRecord = () => ({ P: null, E: null, A: null, R: null, L: null, rehire: null, teamType: null, notes: "" });

export const today = () => new Date().toISOString().slice(0, 10);
export const clone = (x) => JSON.parse(JSON.stringify(x));

function shiftScores(scores, by) {
  const out = {};
  Object.keys(scores).forEach((aid) => {
    out[aid] = {};
    Object.keys(scores[aid]).forEach((pid) => {
      const rec = { ...scores[aid][pid] };
      PEARL.forEach((d) => { if (rec[d.key] != null) rec[d.key] = Math.max(1, Math.min(10, rec[d.key] + by)); });
      out[aid][pid] = rec;
    });
  });
  return out;
}

export function newSession(name) {
  return { id: uid("s"), name: name || "New Review Round", date: today(),
    assessors: [{ id: uid("a"), name: "Assessor 1" }], roster: [], scores: {} };
}

export function newCompany(name) {
  return { id: uid("c"), name: name || "New Company", sessions: [newSession("Review 1")] };
}

export function cloneRound(session, name) {
  return { id: uid("s"), name: name || "New Review Round", date: today(),
    assessors: clone(session.assessors), roster: clone(session.roster), scores: {} };
}

function sampleSession() {
  const roster = [
    { id: "m1",  name: "Amber K",     role: "Operations Manager" },
    { id: "m2",  name: "Lilly G",     role: "Team Lead" },
    { id: "m3",  name: "Shelley N",   role: "Team Lead" },
    { id: "m4",  name: "Katherine G", role: "Sales Director" },
    { id: "m5",  name: "Charlene T",  role: "Team Lead" },
    { id: "m6",  name: "Arin Y",      role: "Business Development" },
    { id: "m7",  name: "Shelly R",    role: "Team Lead" },
    { id: "m8",  name: "Landon S",    role: "Sales Manager" },
    { id: "m9",  name: "Teresa G",    role: "Team Lead" },
    { id: "m10", name: "Fird H",      role: "Team Lead" },
    { id: "m11", name: "Rosie M",     role: "Team Lead" },
    { id: "m12", name: "Liz G",       role: "Team Lead" },
    { id: "m13", name: "Chase D",     role: "Account Manager" },
  ];
  const assessors = [
    { id: "a1", name: "Ben" },
    { id: "a2", name: "Joe" },
    { id: "a3", name: "Chris" },
    { id: "a4", name: "Dan" },
    { id: "a5", name: "Jeff" },
    { id: "a6", name: "Dave" },
  ];
  const r = (P, E, A, R, L, rehire, tt, notes) => ({ P, E, A, R, L, rehire, teamType: tt, notes: notes || "" });
  const scores = {
    a1: {
      m1: r(5,7,6,2,5,"No","subtractor"), m2: r(8,9,9,8,8,"Yes","adder"), m3: r(7,7,8,8,8,"Yes","adder"),
      m4: r(9,9,9,9,9,"Yes","multiplier"), m5: r(8,10,8,8,6,"Yes","adder"), m6: r(8,9,9,9,7,"Yes","adder"),
      m7: r(8,9,8,9,6,"Yes","adder"), m8: r(8,8,9,7,7,"Yes","multiplier"), m9: r(7,8,7,8,5,"Yes","adder"),
      m10: r(7,7,7,7,7,"Yes","adder"), m11: r(7,7,7,7,7,"Yes","adder"), m12: r(7,7,7,7,7,"Yes","adder"),
      m13: r(7,8,8,7,6,"Yes","adder"),
    },
    a2: {
      m1: r(4,6,4,3,4,"Maybe","subtractor","Would be a solid individual contributor if we had a spot and she'd take a pay cut."),
      m2: r(8,7,7,7,8,"Yes","adder"), m3: r(6,6,7,4,6,"Maybe","subtractor","Subtractor +"),
      m4: r(10,10,10,10,9,"Yes","multiplier"), m5: r(7,8,6,8,6,"Yes","adder"), m6: r(7,6,7,7,8,"Yes","adder"),
      m7: emptyRecord(), m8: r(9,9,8,7,9,"Yes","adder"), m9: r(7,5,7,8,7,"Yes","adder"),
      m10: r(6,6,6,6,6,"Maybe","subtractor","Too early to tell."), m11: r(7,7,7,7,8,"Yes","adder"),
      m12: r(6,6,6,6,6,"Yes","adder","Too early to tell."), m13: r(7,8,8,7,8,"Yes","adder"),
    },
    a3: {
      m1: r(2,5,3,2,2,"No","subtractor"), m2: r(6,6,6,6,6,"Yes","adder"),
      m3: r(3,3,4,2,4,"No","subtractor","Wonderful, quiet, passive. Could be a solid contributor, not a strong leader."),
      m4: r(8,8,8,8,8,"Yes","adder"), m5: r(7,7,7,8,7,"Yes","adder"),
      m6: r(6,8,7,6,7,"Yes","adder","Build a development plan — what will it take to carry BD into the future?"),
      m7: emptyRecord(), m8: r(9,8,8,8,8,"Yes","adder"),
      m9: r(5,6,5,5,5,"No","subtractor","Help her find her groove and let her fly."),
      m10: emptyRecord(), m11: r(6,5,5,6,6,"Yes","adder"), m12: emptyRecord(), m13: r(5,6,6,5,6,"Yes","adder"),
    },
    a4: {
      m1: r(5,8,3,4,5,"No","subtractor","Historical knowledge & effort are great — possibly another role at a pay cut, or part ways."),
      m2: r(8,7,7,4,7,"Yes","adder"), m3: r(6,6,6,4,5,"Maybe","subtractor","Need to set expectations."),
      m4: r(9,9,9,8,9,"Yes","multiplier"), m5: r(8,8,7,8,8,"Yes","multiplier"), m6: r(8,8,8,8,8,"Yes","multiplier"),
      m7: r(9,9,8,8,8,"Yes","multiplier"), m8: r(9,7,9,6,8,"Yes","adder"), m9: r(7,7,6,6,7,"Yes","adder"),
      m10: r(8,7,6,6,7,"Yes","adder","This is my estimate."), m11: r(8,8,6,6,7,"Yes","multiplier"),
      m12: r(7,7,6,6,6,"Maybe","adder","This is my estimate."),
      m13: r(7,5,6,5,6,"Yes","subtractor","Needs to be more assertive with better follow-up; build an ownership mindset."),
    },
    a5: {}, a6: {},
  };
  return { assessors, roster, scores };
}

export function sampleWorkspace() {
  const base = sampleSession();
  const q2 = { id: "s2", name: "Q2 2026 Review", date: "2026-04-15", assessors: base.assessors, roster: base.roster, scores: base.scores };
  const q1 = { id: "s1", name: "Q1 2026 Review", date: "2026-01-15", assessors: clone(base.assessors), roster: clone(base.roster), scores: shiftScores(base.scores, -1) };
  const company = { id: "c1", name: "Endeavor", sessions: [q1, q2] };
  return { version: 2, companies: [company], activeCompanyId: "c1", activeSessionId: "s2" };
}

export function blankWorkspace() {
  const c = newCompany("Your Company");
  return { version: 2, companies: [c], activeCompanyId: c.id, activeSessionId: c.sessions[0].id };
}

export function migrate(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.version === 2 && Array.isArray(raw.companies)) return raw;
  if (raw.version === 1) {
    const session = { id: uid("s"), name: raw.sessionName || "Review", date: today(),
      assessors: raw.assessors || [], roster: raw.roster || [], scores: raw.scores || {} };
    const company = { id: uid("c"), name: raw.org || "Company", sessions: [session] };
    return { version: 2, companies: [company], activeCompanyId: company.id, activeSessionId: session.id };
  }
  return null;
}

export function aggregate(state) {
  const rows = state.roster.map((person) => {
    const recs = state.assessors
      .map((a) => (state.scores[a.id] || {})[person.id])
      .filter(Boolean);
    const dims = {};
    PEARL.forEach((d) => {
      const m = mean(recs.map((rec) => rec[d.key]));
      dims[d.key] = m == null ? null : round1(m);
    });
    const dimVals = PEARL.map((d) => dims[d.key]).filter((v) => v != null);
    const overall = dimVals.length ? round1(mean(dimVals)) : null;
    const rehireCounts = {};
    recs.forEach((rec) => { if (rec.rehire) rehireCounts[rec.rehire] = (rehireCounts[rec.rehire] || 0) + 1; });
    let rehire = null, rc = -1;
    Object.entries(rehireCounts).forEach(([k, v]) => { if (v > rc) { rc = v; rehire = k; } });
    const ttCounts = {};
    recs.forEach((rec) => { if (rec.teamType) ttCounts[rec.teamType] = (ttCounts[rec.teamType] || 0) + 1; });
    let tt = null, tc = -1;
    Object.entries(ttCounts).forEach(([k, v]) => { if (v > tc) { tc = v; tt = k; } });
    let spread = 0;
    PEARL.forEach((d) => {
      const vals = recs.map((rec) => rec[d.key]).filter((v) => v != null);
      if (vals.length > 1) spread = Math.max(spread, Math.max(...vals) - Math.min(...vals));
    });
    return { person, dims, overall, rehire, teamType: tt, responses: recs.length, spread };
  });
  const ranked = [...rows].sort((a, b) => {
    if (a.overall == null && b.overall == null) return 0;
    if (a.overall == null) return 1;
    if (b.overall == null) return -1;
    return b.overall - a.overall;
  });
  ranked.forEach((row, i) => { row.rank = row.overall == null ? null : i + 1; });
  return rows.map((row) => ranked.find((r) => r.person.id === row.person.id));
}
