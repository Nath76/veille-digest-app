import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

const C = {
  page: "#f2efe8", panel: "#e7e0d0", panelSoft: "#ede7d8",
  border: "#cbbfa8", text: "#1e293b", muted: "#7a6f5c",
  accent: "#8a4b22", dark: "#2b2a24", white: "#fffdf8",
  chip: "#f5f0e6", chipText: "#4f4638",
  green: "#1f7a45", noteBg: "#dbeafe", noteText: "#1d4ed8",
};
const serif = 'Georgia, "Times New Roman", serif';
const sans = 'Inter, ui-sans-serif, system-ui, sans-serif';

function sc(extra = {}) {
  return { fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, ...extra };
}

function scorePill(score) {
  const n = Number(score || 0);
  if (n >= 85) return { background: "#dcefdc", color: "#1f7a45" };
  if (n >= 70) return { background: "#f9e7c8", color: "#a16207" };
  if (n >= 50) return { background: "#f2e2da", color: "#9a3412" };
  return { background: "#ece7dc", color: "#6b7280" };
}

function normalizeArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return String(v).split(";").map((s) => s.trim()).filter(Boolean);
}

function cleanHtml(s) {
  return (s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .trim();
}

// Un item est un événement si son documentType le mentionne
function isEvent(item) {
  return /[ée]v[ée]nement|event/i.test(item.documentType || "");
}

export default function VeilleDigestReader() {
  const DATA_URL =
    "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [query, setQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Toutes");
  const [sortBy, setSortBy] = useState("relevance");
  const [tab, setTab] = useState("publications"); // "publications" | "evenements"
  const [selectedId, setSelectedId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [noteIds, setNoteIds] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [toast, setToast] = useState(null);

  const prevIdsRef = useRef(new Set());
  const toastTimer = useRef(null);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  const loadData = useCallback(() => {
    setIsRefreshing(true);
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        // Dédoublonnage strict par URL ou titre
        const seen = new Set();
        const deduped = data.filter((i) => {
          const k = i.url || i.title;
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        const normalized = deduped
          .filter((i) => i.title && cleanHtml(i.title).trim())
          .map((item, idx) => ({
            ...item,
            id: String(
              item.id && item.id !== "NONE" && item.id !== "none"
                ? item.id
                : item.url || item.title || idx
            ),
            title: cleanHtml(item.title),
            actors: normalizeArray(item.actors),
            keywords: normalizeArray(item.keywords),
            innovations: normalizeArray(item.innovations),
            themes: normalizeArray(item.themes),
          }));

        // Calcul des ajouts depuis la dernière actualisation
        const newIds = new Set(normalized.map((i) => i.id));
        const addedCount = [...newIds].filter((id) => !prevIdsRef.current.has(id)).length;
        prevIdsRef.current = newIds;

        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(normalized.filter((i) => i.noteCandidate).map((i) => i.id)));

        const t = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        setLastUpdated(t);

        if (addedCount > 0) {
          showToast(`+${addedCount} nouvelle${addedCount > 1 ? "s" : ""} production${addedCount > 1 ? "s" : ""} ajoutée${addedCount > 1 ? "s" : ""}`);
        } else if (prevIdsRef.current.size > 0) {
          showToast("Digest à jour");
        }
      })
      .catch(() => showToast("Erreur de chargement"))
      .finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Thèmes disponibles (productions seulement, hors dismissed)
  const allThemes = useMemo(() => {
    const s = new Set();
    items
      .filter((i) => !dismissed.has(i.id) && !isEvent(i))
      .forEach((i) => normalizeArray(i.themes).forEach((t) => s.add(t)));
    return ["Toutes", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items, dismissed]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => !dismissed.has(i.id))
      .filter((i) => (tab === "evenements" ? isEvent(i) : !isEvent(i)))
      .filter((i) => {
        const hay = [i.title, i.summary, i.institution, ...(i.themes || []), ...(i.keywords || [])]
          .filter(Boolean).join(" ").toLowerCase();
        const matchQ = !q || hay.includes(q);
        const matchT = selectedTheme === "Toutes" || (i.themes || []).includes(selectedTheme);
        return matchQ && matchT;
      })
      .sort((a, b) => {
        if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
        return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
      });
  }, [items, dismissed, tab, query, selectedTheme, sortBy]);

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;
  const pubCount = useMemo(() => items.filter((i) => !dismissed.has(i.id) && !isEvent(i)).length, [items, dismissed]);
  const evtCount = useMemo(() => items.filter((i) => !dismissed.has(i.id) && isEvent(i)).length, [items, dismissed]);
  const rssSources = useMemo(() => Array.from(new Set(items.map((i) => i.source).filter(Boolean))), [items]);

  function dismiss(id, e) {
    e.stopPropagation();
    setDismissed((prev) => new Set([...prev, id]));
    if (selectedId === id) setSelectedId(null);
  }

  function toggleFav(id, e) {
    if (e) e.stopPropagation();
    setFavoriteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleNote(id, e) {
    if (e) e.stopPropagation();
    setNoteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── CARD ──────────────────────────────────────────────────
  function Card({ item }) {
    const isFav = favoriteIds.has(item.id);
    const isNote = noteIds.has(item.id);
    const scoreN = Math.round((item.relevanceScore || 0) / 20) || 0;

    return (
      <div
        onClick={() => setSelectedId(item.id)}
        style={{
          background: C.white, border: `1px solid ${C.border}`,
          padding: "16px 16px 13px", cursor: "pointer", position: "relative",
          display: "flex", flexDirection: "column", gap: 9,
          transition: "box-shadow .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,.09)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        {/* Supprimer */}
        <button
          onClick={(e) => dismiss(item.id, e)}
          title="Masquer cette publication"
          style={{ position: "absolute", top: 9, right: 9, background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 17, lineHeight: 1, opacity: .4, padding: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = .4)}
        >×</button>

        {/* Date en haut */}
        {item.date && (
          <div style={{ ...sc(), fontSize: 10 }}>{item.date}</div>
        )}

        {/* Source + score */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...sc(), color: C.accent, fontSize: 10 }}>{item.source}</div>
          <span style={{ borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600, ...scorePill(item.relevanceScore) }}>
            {scoreN}/5
          </span>
        </div>

        {/* Mots-clés au-dessus du résumé */}
        {(item.keywords || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(item.keywords || []).slice(0, 4).map((k) => (
              <span key={k} style={{ background: C.chip, color: C.chipText, borderRadius: 999, padding: "3px 8px", fontSize: 11 }}>{k}</span>
            ))}
          </div>
        )}

        {/* Titre */}
        <div style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.25, fontWeight: 700, color: C.dark }}>
          {item.title}
        </div>

        {/* Résumé */}
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, flex: 1 }}>
          {String(item.summary || "").slice(0, 155)}{(item.summary || "").length > 155 ? "…" : ""}
        </div>

        {/* Footer carte */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <div>
            {(item.themes || []).slice(0, 1).map((t) => (
              <span key={t} style={{ background: C.chip, color: C.chipText, borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>{t}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={(e) => toggleNote(item.id, e)} title="Préparer une note" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: isNote ? C.noteText : C.muted }}>✎</button>
            <button onClick={(e) => toggleFav(item.id, e)} title="Ajouter aux favoris" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: isFav ? C.accent : C.muted }}>
              {isFav ? "★" : "☆"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: sans, color: C.text }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: C.dark, color: C.white, padding: "10px 20px", borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.2)", letterSpacing: ".04em" }}>
          {toast}
        </div>
      )}

      {/* Modal détail */}
      {selectedItem && (
        <div
          onClick={() => setSelectedId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,20,10,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.border}`, maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 32, position: "relative" }}
          >
            <button onClick={() => setSelectedId(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 24, lineHeight: 1 }}>×</button>

            {/* Date en haut */}
            {selectedItem.date && (
              <div style={{ ...sc(), fontSize: 11, marginBottom: 8 }}>{selectedItem.date} · {selectedItem.documentType}</div>
            )}

            {/* Score */}
            <span style={{ display: "inline-block", borderRadius: 4, padding: "4px 9px", fontSize: 12, fontWeight: 600, marginBottom: 14, ...scorePill(selectedItem.relevanceScore) }}>
              PERTINENCE {Math.round((selectedItem.relevanceScore || 0) / 20) || 0}/5
            </span>

            {/* Titre */}
            <div style={{ fontFamily: serif, fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: C.dark, marginBottom: 10 }}>
              {selectedItem.title}
            </div>

            <div style={{ ...sc(), marginBottom: 18 }}>{selectedItem.source}{selectedItem.institution ? ` · ${selectedItem.institution}` : ""}</div>

            {/* Mots-clés au-dessus du résumé */}
            {(selectedItem.keywords || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...sc(), marginBottom: 8 }}>Concepts clés</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(selectedItem.keywords || []).map((k) => (
                    <span key={k} style={{ background: C.chip, color: C.chipText, borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé */}
            {String(selectedItem.summary || "").split(/\n+/).filter(Boolean).map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.85, color: C.text, marginBottom: 12 }}>{p}</p>
            ))}

            {/* Innovations */}
            {(selectedItem.innovations || []).length > 0 && (
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <div style={{ ...sc(), marginBottom: 8 }}>Innovations</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(selectedItem.innovations || []).map((k) => (
                    <span key={k} style={{ background: C.noteBg, color: C.noteText, borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Signal + Impact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
              <div style={{ padding: 14, background: C.panelSoft, border: `1px solid ${C.border}` }}>
                <div style={sc()}>Signal faible</div>
                <div style={{ marginTop: 8, lineHeight: 1.7, fontSize: 14 }}>{selectedItem.weakSignal || "Non renseigné"}</div>
              </div>
              <div style={{ padding: 14, background: C.panelSoft, border: `1px solid ${C.border}` }}>
                <div style={sc()}>Impact stratégique</div>
                <div style={{ marginTop: 8, lineHeight: 1.7, fontSize: 14 }}>{selectedItem.strategicImpact || "Non renseigné"}</div>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: 14, background: C.panelSoft, border: `1px solid ${C.border}` }}>
              <div style={sc()}>Angle d'exploitation</div>
              <div style={{ marginTop: 8, lineHeight: 1.8, fontSize: 14 }}>{selectedItem.exploitationAngle || "Aucun angle disponible."}</div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button onClick={() => toggleFav(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${C.dark}`, background: C.dark, color: C.white, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: sans }}>
                {favoriteIds.has(selectedItem.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>
              <button onClick={() => toggleNote(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${C.border}`, background: C.white, color: C.text, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: sans }}>
                {noteIds.has(selectedItem.id) ? "Retirer de la note" : "Préparer une note"}
              </button>
              {selectedItem.url && (
                <a href={selectedItem.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <button style={{ borderRadius: 999, border: `1px solid ${C.border}`, background: C.white, color: C.text, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: sans }}>
                    Ouvrir la source
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 26 }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", border: `1px solid ${C.border}`, background: C.panel, minHeight: 820 }}>

          {/* ── SIDEBAR ── */}
          <aside style={{ borderRight: `1px solid ${C.border}`, background: C.panelSoft }}>

            {/* Logo sans point */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `3px solid ${C.dark}` }}>
              <div style={{ fontFamily: serif, fontSize: 42, lineHeight: .95, fontWeight: 700, color: C.dark }}>Veille</div>
              <div style={{ ...sc(), marginTop: 8 }}>Digest éditorial · Propulsé par données</div>
            </div>

            {/* Thèmes */}
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
              <div style={sc()}>Thèmes</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                {allThemes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTheme(t)}
                    style={{ textAlign: "left", padding: "7px 10px", border: "none", borderRadius: 4, background: selectedTheme === t ? C.dark : "transparent", color: selectedTheme === t ? C.white : C.text, cursor: "pointer", fontSize: 13, fontFamily: sans }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
              <div style={sc()}>Sources</div>
              <div style={{ marginTop: 12 }}>
                {rssSources.map((s) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: C.green, fontSize: 10 }}>●</span>
                    <span style={{ fontSize: 13, color: C.text }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div style={{ padding: "18px 22px" }}>
              <div style={sc()}>Trier par</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                {[["relevance", "Pertinence"], ["date", "Date"], ["title", "Titre"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setSortBy(v)}
                    style={{ textAlign: "left", padding: "7px 10px", border: "none", borderRadius: 4, background: sortBy === v ? C.dark : "transparent", color: sortBy === v ? C.white : C.text, cursor: "pointer", fontSize: 13, fontFamily: sans }}
                  >{l}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main style={{ background: C.panelSoft, display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, padding: "12px 24px" }}>
              <span style={{ ...sc(), color: C.dark }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {lastUpdated && <span style={{ ...sc(), fontSize: 10 }}>Maj {lastUpdated}</span>}
                <button
                  onClick={loadData}
                  disabled={isRefreshing}
                  style={{ borderRadius: 999, border: `1px solid ${C.border}`, background: C.white, color: C.text, padding: "7px 16px", cursor: isRefreshing ? "default" : "pointer", fontSize: 12, opacity: isRefreshing ? .7 : 1, fontFamily: sans }}
                >{isRefreshing ? "Actualisation…" : "Actualiser"}</button>
              </div>
            </div>

            {/* Onglets Productions / Événements + recherche */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
              {[
                ["publications", `Productions`, pubCount],
                ["evenements", `Événements`, evtCount],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: tab === key ? `2px solid ${C.dark}` : "2px solid transparent", color: tab === key ? C.dark : C.muted, cursor: "pointer", fontSize: 13, fontFamily: sans, fontWeight: tab === key ? 600 : 400, display: "flex", alignItems: "center", gap: 7 }}
                >
                  {label}
                  <span style={{ background: C.chip, color: C.chipText, borderRadius: 999, padding: "2px 7px", fontSize: 11, fontWeight: 500 }}>{count}</span>
                </button>
              ))}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                style={{ marginLeft: "auto", border: "none", background: "transparent", outline: "none", color: C.accent, fontSize: 14, padding: "12px 0", width: 200, fontFamily: sans }}
              />
            </div>

            {/* Galerie de cartes */}
            <div style={{ flex: 1, padding: 22, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, ...sc() }}>Chargement en cours…</div>
              ) : visibleItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, ...sc() }}>Aucune publication correspondante</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
                  {visibleItems.map((item) => <Card key={item.id} item={item} />)}
                </div>
              )}
            </div>

            {/* Barre de stats */}
            <div style={{ borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", padding: "12px 10px", background: C.panel }}>
              {[
                [items.filter((i) => !dismissed.has(i.id)).length, "Publications"],
                [favoriteIds.size, "Favoris"],
                [rssSources.length, "Sources"],
                [noteIds.size, "En note"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 26, fontFamily: serif }}>{n}</div>
                  <div style={{ ...sc(), fontSize: 10 }}>{l}</div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Zone "Préparer une note" */}
        {noteIds.size > 0 && (
          <div style={{ marginTop: 18, background: C.panelSoft, border: `1px solid ${C.border}`, padding: 22 }}>
            <div style={{ ...sc(), marginBottom: 14 }}>Préparer une note — {noteIds.size} article{noteIds.size > 1 ? "s" : ""}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 }}>
              {items.filter((i) => noteIds.has(i.id)).map((item) => (
                <div key={item.id} style={{ background: C.white, border: `1px solid ${C.border}`, padding: 16 }}>
                  <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 7px", fontSize: 11, fontWeight: 600, marginBottom: 8, ...scorePill(item.relevanceScore) }}>
                    PERTINENCE {Math.round((item.relevanceScore || 0) / 20) || 0}/5
                  </span>
                  <div style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.2, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: C.muted, marginBottom: 8 }}>{String(item.summary || "").slice(0, 200)}…</div>
                  {item.exploitationAngle && (
                    <div style={{ fontSize: 13, color: C.accent, lineHeight: 1.7 }}>
                      <strong>Angle :</strong> {item.exploitationAngle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: 280px 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbbfa8; border-radius: 3px; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
