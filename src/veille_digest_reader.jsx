import React, { useEffect, useMemo, useState, useCallback } from "react";

const DATA_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

const C = {
  page: "#faf7f0", panel: "#f2ede0", soft: "#f5f1e6", border: "#cbbfa8",
  text: "#1e293b", muted: "#7a6f5c", accent: "#8a4b22", dark: "#2b2a24",
  white: "#fffdf8", chip: "#eee9d8", chipT: "#4f4638", green: "#1f7a45",
};
const SERIF = 'Georgia,"Times New Roman",serif';
const SANS = 'Inter,ui-sans-serif,system-ui,-apple-system,sans-serif';

function cleanHtml(s) {
  return (s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function normalizeArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return String(v).split(";").map(x => x.trim()).filter(Boolean);
}

function scorePill(n) {
  n = Number(n || 0);
  if (n >= 85) return { background: "#dcefdc", color: "#1f7a45" };
  if (n >= 70) return { background: "#f9e7c8", color: "#a16207" };
  if (n >= 50) return { background: "#f2e2da", color: "#9a3412" };
  return { background: "#ece7dc", color: "#6b7280" };
}

function isEvent(item) {
  const t = (item.documentType || "").toLowerCase();
  return ["événement", "evenement", "event", "conférence", "conference", "colloque", "séminaire", "seminaire"].includes(t);
}

function sc() {
  return { fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, fontFamily: SANS };
}

function todayFR() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

function timeNow() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function Btn({ onClick, dark, danger, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 14px", borderRadius: 999, cursor: disabled ? "default" : "pointer",
      border: `1px solid ${danger ? "#fca5a5" : dark ? C.dark : C.border}`,
      background: dark ? C.dark : "transparent",
      color: danger ? "#dc2626" : dark ? C.white : C.text,
      fontSize: 12, fontFamily: SANS, opacity: disabled ? 0.7 : 1,
    }}>{children}</button>
  );
}

function PointVeilleModal({ items, noteIds, onClose }) {
  const candidates = items.filter(i => noteIds.has(i.id));
  const src = candidates.length > 0 ? candidates : items.slice(0, 3);
  const d = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const txt = `POINT DE VEILLE — ${d.toUpperCase()}\n\n${src.map((x, i) =>
    `${i + 1}. ${x.title}\n   Source : ${x.institution || x.source} | ${x.documentType} | Score : ${x.relevanceScore}/100\n\n   ${(x.summary || "").slice(0, 300)}…\n\n   Angle d'exploitation : ${x.exploitationAngle || ""}`
  ).join("\n\n---\n\n")}\n\n---\nVeille automatisée · Digest éditorial`;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, width: 660, maxHeight: "80vh", display: "flex", flexDirection: "column", borderRadius: 4 }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700 }}>Rédiger un point veille</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: "18px 22px", flex: 1, overflowY: "auto" }}>
          <div style={{ ...sc(), marginBottom: 10 }}>{candidates.length > 0 ? `${candidates.length} publication(s) marquées` : "Publications récentes"}</div>
          <textarea id="ptxt" defaultValue={txt} style={{ width: "100%", height: 360, fontFamily: SANS, fontSize: 13, lineHeight: 1.75, border: `1px solid ${C.border}`, padding: 14, background: C.page, color: C.text, resize: "vertical", borderRadius: 4, boxSizing: "border-box" }} />
        </div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <Btn dark onClick={() => { const t = document.getElementById("ptxt"); if (t) navigator.clipboard.writeText(t.value); }}>Copier le texte</Btn>
          <Btn onClick={onClose}>Fermer</Btn>
        </div>
      </div>
    </div>
  );
}

export default function VeilleDigestReader() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("productions");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedId, setSelectedId] = useState(null);
  const [favs, setFavs] = useState(new Set());
  const [notes, setNotes] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpd, setLastUpd] = useState("");
  const [modal, setModal] = useState(false);

  const loadData = useCallback(() => {
    setRefreshing(true);
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        // Dédoublonnage par URL
        const seen = new Set();
        const deduped = data.filter(i => {
          const k = i.url || i.title;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        // Normalisation + id garanti unique
        const norm = deduped.map((i, index) => ({
          ...i,
          id: String(i.id || i.url || i.title || index),
          title: cleanHtml(i.title),
          actors: normalizeArray(i.actors),
          keywords: normalizeArray(i.keywords),
          innovations: normalizeArray(i.innovations),
          themes: normalizeArray(i.themes),
          favorite: Boolean(i.favorite),
          noteCandidate: Boolean(i.noteCandidate),
        }));
        setItems(norm);
        setFavs(new Set(norm.filter(i => i.favorite).map(i => i.id)));
        setNotes(new Set(norm.filter(i => i.noteCandidate).map(i => i.id)));
        if (norm.length > 0) setSelectedId(norm[0].id);
        setLastUpd(timeNow());
      })
      .catch(() => { setLastUpd(timeNow()); })
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const productions = useMemo(() => items.filter(i => !isEvent(i)), [items]);
  const evenements = useMemo(() => items.filter(i => isEvent(i)), [items]);

  const filtered = useMemo(() => {
    const src = activeTab === "productions" ? productions : evenements;
    const q = query.trim().toLowerCase();
    return [...src]
      .filter(i => !q || [i.title, i.summary, i.institution, ...(i.themes || []), ...(i.keywords || [])].join(" ").toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
        return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
      });
  }, [items, activeTab, query, sortBy, productions, evenements]);

  useEffect(() => {
    if (!filtered.length) { setSelectedId(null); return; }
    if (!filtered.some(i => i.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const sel = filtered.find(i => i.id === selectedId) || null;

  const toggleFav = id => setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleNote = id => setNotes(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const deleteItem = id => setItems(p => p.filter(i => i.id !== id));

  return (
    <div style={{ minHeight: "100vh", background: C.page, color: C.text, fontFamily: SANS }}>
      {modal && <PointVeilleModal items={filtered} noteIds={notes} onClose={() => setModal(false)} />}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 26 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottom: `3px solid ${C.dark}`, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: C.dark, lineHeight: 0.95 }}>Veille</div>
            <div style={{ ...sc(), marginTop: 8 }}>Digest éditorial · propulsé par données JSON</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn onClick={loadData} disabled={refreshing}>{refreshing ? "Actualisation..." : "Actualiser le digest"}</Btn>
            <span style={sc()}>{lastUpd ? `Maj ${lastUpd}` : ""}</span>
            <Btn dark onClick={() => setModal(true)}>✍ Rédiger un point veille</Btn>
          </div>
        </div>

        {/* Date */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
          <span style={{ ...sc(), marginRight: 10 }}>Digest</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: C.dark }}>{todayFR()}</span>
        </div>

        {/* Tabs + search */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
          {[["productions", `Productions (${productions.length})`], ["evenements", `Événements (${evenements.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "11px 22px", border: "none", borderBottom: `3px solid ${activeTab === key ? C.dark : "transparent"}`,
              background: "transparent", cursor: "pointer", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase",
              fontFamily: SANS, color: activeTab === key ? C.dark : C.muted, fontWeight: activeTab === key ? 700 : 400,
            }}>{label}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, paddingBottom: 10, alignItems: "center" }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher..."
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: 14, padding: "7px 12px", borderRadius: 4, fontFamily: SANS, width: 200 }} />
            {[["relevance", "Pertinence"], ["date", "Date"], ["title", "Titre"]].map(([s, l]) => (
              <Btn key={s} dark={sortBy === s} onClick={() => setSortBy(s)}>{l}</Btn>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", ...sc() }}>
                {items.length === 0 ? "Chargement en cours..." : "Aucune publication"}
              </div>
            )}
            {filtered.map(item => (
              <div key={item.id} onClick={() => setSelectedId(item.id)} style={{
                border: `1px solid ${item.id === selectedId ? C.dark : C.border}`,
                borderLeft: `3px solid ${item.id === selectedId ? C.dark : isEvent(item) ? C.green : C.accent}`,
                background: item.id === selectedId ? C.white : C.soft,
                padding: 16, cursor: "pointer", transition: "all .15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div style={{ ...sc(), color: C.accent }}>{item.source}</div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button type="button" onClick={e => { e.stopPropagation(); toggleFav(item.id); }}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15, color: favs.has(item.id) ? "#f59e0b" : C.muted }}>
                      {favs.has(item.id) ? "★" : "☆"}
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: C.muted, padding: "2px 4px" }}>✕</button>
                  </div>
                </div>
                <div style={{ ...sc(), marginBottom: 8, color: C.muted }}>{item.date} · {item.documentType}</div>
                <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.dark, lineHeight: 1.25, marginBottom: 10 }}>{item.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {(item.keywords || []).slice(0, 3).map(k => (
                    <span key={k} style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "3px 9px", fontSize: 12 }}>{k}</span>
                  ))}
                </div>
                <div style={{ fontSize: 14, color: C.accent, lineHeight: 1.8, marginBottom: 12 }}>{(item.summary || "").slice(0, 110)}…</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, ...scorePill(item.relevanceScore) }}>
                    PERTINENCE {Math.round((item.relevanceScore || 0) / 20)}/5
                  </span>
                  <span style={{ fontSize: 13, color: C.accent }}>LIRE →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ position: "sticky", top: 20 }}>
            {sel ? (
              <>
                <div style={{ border: `1px solid ${C.border}`, background: C.white }}>
                  <div style={{ padding: 18, borderBottom: `1px solid ${C.border}`, background: C.soft }}>
                    <div style={{ ...sc(), marginBottom: 6 }}>{sel.date} · {sel.institution}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.dark, lineHeight: 1.25, marginBottom: 12 }}>{sel.title}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, ...scorePill(sel.relevanceScore) }}>
                        PERTINENCE {Math.round((sel.relevanceScore || 0) / 20)}/5
                      </span>
                      <span style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "3px 9px", fontSize: 12 }}>{sel.documentType}</span>
                      <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, background: sel.strategicImpact === 3 ? "#fee2e2" : "#ece7dc", color: sel.strategicImpact === 3 ? "#dc2626" : "#6b7280" }}>
                        Impact {sel.strategicImpact}/3
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: 20, maxHeight: 500, overflowY: "auto" }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ ...sc(), marginBottom: 8 }}>Concepts clés</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(sel.keywords || []).map(k => <span key={k} style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "4px 10px", fontSize: 12 }}>{k}</span>)}
                      </div>
                    </div>
                    <div style={{ ...sc(), marginBottom: 8 }}>Résumé analytique</div>
                    <p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, marginBottom: 16 }}>{sel.summary}</p>
                    {sel.weakSignal && sel.weakSignal !== "Aucun signal faible identifié" && (
                      <div style={{ padding: 12, background: "#fef9c3", border: "1px solid #fde047", marginBottom: 14 }}>
                        <div style={{ ...sc(), color: "#713f12", marginBottom: 4 }}>Signal faible</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#713f12" }}>{sel.weakSignal}</div>
                      </div>
                    )}
                    <div style={{ padding: 12, background: C.soft, border: `1px solid ${C.border}`, marginBottom: 18 }}>
                      <div style={{ ...sc(), marginBottom: 6 }}>Angle d'exploitation</div>
                      <div style={{ fontSize: 13, lineHeight: 1.75 }}>{sel.exploitationAngle || "Aucun angle disponible."}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn dark={notes.has(sel.id)} onClick={() => toggleNote(sel.id)}>
                        {notes.has(sel.id) ? "✓ En note" : "+ Préparer une note"}
                      </Btn>
                      <a href={sel.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <Btn>Ouvrir la source</Btn>
                      </a>
                      <Btn danger onClick={() => deleteItem(sel.id)}>Supprimer</Btn>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", padding: "12px 8px", background: C.panel, border: `1px solid ${C.border}` }}>
                  {[[productions.length, "Productions"], [evenements.length, "Événements"], [favs.size, "Favoris"], [notes.size, "En note"]].map(([v, l]) => (
                    <div key={l} style={{ padding: "4px 0" }}>
                      <div style={{ fontFamily: SERIF, fontSize: 26, color: C.dark }}>{v}</div>
                      <div style={sc()}>{l}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: 32, textAlign: "center", border: `1px solid ${C.border}`, color: C.muted, ...sc() }}>
                {items.length === 0 ? "Chargement en cours..." : "Sélectionnez une publication"}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}



