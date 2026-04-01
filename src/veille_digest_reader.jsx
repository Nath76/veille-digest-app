import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

const C = {
  page: "#f2efe8", panel: "#e7e0d0", panelSoft: "#ede7d8",
  border: "#cbbfa8", text: "#1e293b", muted: "#7a6f5c",
  accent: "#8a4b22", dark: "#2b2a24", ink: "#18180f", white: "#fffdf8",
  chip: "#e8e0d0", chipText: "#4f4638",
  green: "#1f7a45", noteBg: "#dbeafe", noteText: "#1d4ed8",
};
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', Inter, ui-sans-serif, sans-serif";

function sc(extra = {}) {
  return { fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase",
    color: C.muted, fontFamily: sans, ...extra };
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
    .replace(/<[^>]+>/g, "").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").trim();
}

function isEvent(item) {
  return /[ée]v[ée]nement|event/i.test(item.documentType || "");
}

export default function VeilleDigestReader() {
  const DATA_URL =
    "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

  const [items,        setItems]        = useState([]);
  const [dismissed,    setDismissed]    = useState(new Set());
  const [query,        setQuery]        = useState("");
  const [selTheme,     setSelTheme]     = useState("toutes");
  const [sortBy,       setSortBy]       = useState("relevance");
  const [tab,          setTab]          = useState("productions");
  const [selectedId,   setSelectedId]   = useState(null);
  const [favoriteIds,  setFavoriteIds]  = useState(new Set());
  const [noteIds,      setNoteIds]      = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState("");
  const [toast,        setToast]        = useState(null);

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
        const seen = new Set();
        const deduped = data.filter((i) => {
          const k = i.url || i.title;
          if (!k || seen.has(k)) return false;
          seen.add(k); return true;
        });
        const normalized = deduped
          .filter((i) => i.title && cleanHtml(i.title).trim())
          .map((item, idx) => ({
            ...item,
            id: String(
              item.id && item.id !== "NONE" && item.id !== "none"
                ? item.id : item.url || item.title || idx
            ),
            title:       cleanHtml(item.title),
            actors:      normalizeArray(item.actors),
            keywords:    normalizeArray(item.keywords),
            innovations: normalizeArray(item.innovations),
            themes:      normalizeArray(item.themes),
          }));

        const newIds = new Set(normalized.map((i) => i.id));
        const added  = [...newIds].filter((id) => !prevIdsRef.current.has(id)).length;
        prevIdsRef.current = newIds;

        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(normalized.filter((i) => i.noteCandidate).map((i) => i.id)));

        const t = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        setLastUpdated(t);

        if (added > 0)
          showToast(`+${added} nouvelle${added > 1 ? "s" : ""} production${added > 1 ? "s" : ""} éditorialisée${added > 1 ? "s" : ""}`);
        else if (prevIdsRef.current.size > 0)
          showToast("digest à jour");
      })
      .catch(() => showToast("erreur de chargement"))
      .finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const allThemes = useMemo(() => {
    const s = new Set();
    items.filter((i) => !dismissed.has(i.id) && !isEvent(i))
      .forEach((i) => normalizeArray(i.themes).forEach((t) => s.add(t)));
    return ["toutes", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [items, dismissed]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => !dismissed.has(i.id))
      .filter((i) => tab === "événements" ? isEvent(i) : !isEvent(i))
      .filter((i) => {
        const hay = [i.title, i.summary, i.institution, ...(i.themes || []), ...(i.keywords || [])]
          .filter(Boolean).join(" ").toLowerCase();
        return (!q || hay.includes(q)) &&
          (selTheme === "toutes" || (i.themes || []).includes(selTheme));
      })
      .sort((a, b) => {
        if (sortBy === "date")  return String(b.date).localeCompare(String(a.date));
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
        return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
      });
  }, [items, dismissed, tab, query, selTheme, sortBy]);

  const selectedItem  = selectedId ? items.find((i) => i.id === selectedId) : null;
  const pubCount      = useMemo(() => items.filter((i) => !dismissed.has(i.id) && !isEvent(i)).length, [items, dismissed]);
  const evtCount      = useMemo(() => items.filter((i) => !dismissed.has(i.id) &&  isEvent(i)).length, [items, dismissed]);
  const rssSources    = useMemo(() => Array.from(new Set(items.map((i) => i.source).filter(Boolean))), [items]);

  const topSignals = useMemo(() =>
    items.filter((i) => !dismissed.has(i.id) && !isEvent(i))
      .sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0))
      .slice(0, 3)
      .map((i) => (i.weakSignal || (i.keywords || [])[0] || i.title || "").slice(0, 60))
  , [items, dismissed]);

  const topQuote = useMemo(() => {
    const best = items.find((i) => !dismissed.has(i.id) && i.exploitationAngle);
    return best
      ? { text: best.exploitationAngle.slice(0, 120), attr: (best.themes || [])[0] || best.source || "" }
      : null;
  }, [items, dismissed]);

  function dismiss(id, e) {
    e?.stopPropagation();
    setDismissed((p) => new Set([...p, id]));
    if (selectedId === id) setSelectedId(null);
  }

  function toggleFav(id, e) {
    e?.stopPropagation();
    setFavoriteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleNote(id, e) {
    e?.stopPropagation();
    setNoteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const todayLong = new Date().toLocaleDateString("fr-FR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── CARD ──
  function Card({ item }) {
    const isFav     = favoriteIds.has(item.id);
    const scoreN    = Math.round((item.relevanceScore || 0) / 20) || 0;
    const sp        = scorePill(item.relevanceScore);

    return (
      <div
        onClick={() => setSelectedId(item.id)}
        style={{ background: C.white, border: `1px solid ${C.border}`, margin: "-0.5px",
          padding: "14px", cursor: "pointer", position: "relative",
          display: "flex", flexDirection: "column", gap: 8, transition: "box-shadow .15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <button onClick={(e) => dismiss(item.id, e)}
          style={{ position: "absolute", top: 8, right: 9, background: "none", border: "none",
            cursor: "pointer", color: C.muted, fontSize: 15, lineHeight: 1, opacity: .3, padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = .3)}
        >×</button>

        {item.date && <div style={{ ...sc(), fontSize: 9 }}>{item.date}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ borderRadius: 2, padding: "2px 8px", fontSize: 9, fontWeight: 600,
            letterSpacing: ".06em", textTransform: "uppercase", ...sp }}>
            pertinence {scoreN}/5
          </span>
        </div>

        {(item.keywords || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(item.keywords || []).slice(0, 4).map((k) => (
              <span key={k} style={{ background: C.chip, color: C.chipText, borderRadius: 2,
                padding: "2px 8px", fontSize: 10, fontFamily: sans }}>{k}</span>
            ))}
          </div>
        )}

        <div style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.25, fontWeight: 700, color: C.ink }}>
          {item.title}
        </div>

        <div style={{ height: 1, background: C.border }} />

        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.65, flex: 1, fontFamily: sans }}>
          {String(item.summary || "").slice(0, 155)}{(item.summary || "").length > 155 ? "…" : ""}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...sc(), fontSize: 9 }}>{(item.themes || [])[0] || ""}</span>
          <button onClick={(e) => toggleFav(item.id, e)}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: C.accent, opacity: isFav ? 1 : .35, padding: 0 }}>
            {isFav ? "★" : "☆"}
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER ──
  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: sans, color: C.text }}>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: C.ink, color: C.white, padding: "9px 20px",
          fontSize: 12, letterSpacing: ".04em", fontFamily: sans,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%",
            background: C.accent, flexShrink: 0, display: "inline-block" }} />
          {toast}
        </div>
      )}

      {selectedItem && (
        <div onClick={() => setSelectedId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(24,16,8,.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.border}`, maxWidth: 700,
              width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 32, position: "relative" }}>

            <button onClick={() => setSelectedId(null)}
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none",
                cursor: "pointer", color: C.muted, fontSize: 24, lineHeight: 1 }}>×</button>

            {selectedItem.date && (
              <div style={{ ...sc(), fontSize: 10, marginBottom: 8 }}>
                {selectedItem.date}{selectedItem.documentType ? ` · ${selectedItem.documentType}` : ""}
              </div>
            )}

            <span style={{ display: "inline-block", borderRadius: 2, padding: "3px 9px",
              fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
              marginBottom: 14, ...scorePill(selectedItem.relevanceScore) }}>
              pertinence {Math.round((selectedItem.relevanceScore || 0) / 20) || 0}/5
            </span>

            <div style={{ fontFamily: serif, fontSize: 30, lineHeight: 1.15, fontWeight: 700,
              color: C.ink, marginBottom: 6 }}>{selectedItem.title}</div>
            <div style={{ height: 2, background: C.ink, marginBottom: 14 }} />
            <div style={{ ...sc(), marginBottom: 16 }}>
              {selectedItem.source}{selectedItem.institution ? ` · ${selectedItem.institution}` : ""}
            </div>

            {(selectedItem.keywords || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...sc(), marginBottom: 8 }}>concepts clés</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(selectedItem.keywords || []).map((k) => (
                    <span key={k} style={{ background: C.chip, color: C.chipText, borderRadius: 2,
                      padding: "5px 10px", fontSize: 12, fontFamily: sans }}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            {String(selectedItem.summary || "").split(/\n+/).filter(Boolean).map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.85, color: C.text,
                marginBottom: 12, fontFamily: sans }}>{p}</p>
            ))}

            {(selectedItem.innovations || []).length > 0 && (
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <div style={{ ...sc(), marginBottom: 8 }}>innovations</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(selectedItem.innovations || []).map((k) => (
                    <span key={k} style={{ background: C.noteBg, color: C.noteText, borderRadius: 2,
                      padding: "5px 10px", fontSize: 12, fontFamily: sans }}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
              {[["signal faible", selectedItem.weakSignal], ["impact stratégique", selectedItem.strategicImpact]].map(([label, val]) => (
                <div key={label} style={{ padding: 14, background: C.panelSoft, border: `1px solid ${C.border}` }}>
                  <div style={sc()}>{label}</div>
                  <div style={{ marginTop: 8, lineHeight: 1.7, fontSize: 14, fontFamily: sans }}>
                    {val || "non renseigné"}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: 14, background: C.panelSoft, border: `1px solid ${C.border}` }}>
              <div style={sc()}>angle d'exploitation</div>
              <div style={{ marginTop: 8, lineHeight: 1.8, fontSize: 14, fontFamily: sans }}>
                {selectedItem.exploitationAngle || "aucun angle disponible."}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button onClick={() => toggleFav(selectedItem.id)}
                style={{ border: `1px solid ${C.ink}`, background: C.ink, color: C.white,
                  padding: "9px 16px", cursor: "pointer", fontSize: 12, fontFamily: sans }}>
                {favoriteIds.has(selectedItem.id) ? "retirer des favoris" : "ajouter aux favoris"}
              </button>
              <button onClick={() => toggleNote(selectedItem.id)}
                style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text,
                  padding: "9px 16px", cursor: "pointer", fontSize: 12, fontFamily: sans }}>
                {noteIds.has(selectedItem.id) ? "retirer de la note" : "préparer une note"}
              </button>
              {selectedItem.url && (
                <a href={selectedItem.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <button style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text,
                    padding: "9px 16px", cursor: "pointer", fontSize: 12, fontFamily: sans }}>
                    ouvrir la source
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 26 }}>
        <div style={{ display: "grid", gridTemplateColumns: "270px 1fr",
          border: `1px solid ${C.border}`, minHeight: 820 }}>

          {/* ── SIDEBAR ── */}
          <aside style={{ borderRight: `2px solid ${C.ink}`, background: C.panelSoft,
            display: "flex", flexDirection: "column" }}>

            <div style={{ padding: "20px 22px 16px", borderBottom: `4px double ${C.ink}` }}>
              <div style={{ ...sc(), fontSize: 9, marginBottom: 6 }}>digest éditorial</div>
              <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 900, lineHeight: .9,
                color: C.ink, letterSpacing: -1 }}>Veille</div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: C.muted,
                marginTop: 7, lineHeight: 1.4, borderTop: `1px solid ${C.border}`, paddingTop: 7 }}>
                digest éditorial<br />propulsé par JSON
              </div>
            </div>

            <div style={{ background: C.ink, padding: "10px 22px" }}>
              <div style={{ ...sc(), fontSize: 9, color: "#9a8f7a" }}>édition du jour</div>
              <div style={{ fontFamily: serif, fontSize: 14, color: C.white, marginTop: 2 }}>{todayLong}</div>
              <div style={{ fontSize: 10, color: "#7a7060", marginTop: 2, letterSpacing: ".06em" }}>
                {pubCount} production{pubCount !== 1 ? "s" : ""} · {evtCount} événement{evtCount !== 1 ? "s" : ""} · {rssSources.length} source{rssSources.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ ...sc(), marginBottom: 10 }}>thèmes</div>
              {allThemes.map((t) => (
                <button key={t} onClick={() => setSelTheme(t)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "6px 9px", border: "none", borderRadius: 2,
                    background: selTheme === t ? C.ink : "transparent",
                    color: selTheme === t ? C.white : C.text,
                    cursor: "pointer", fontSize: 12, fontFamily: sans, marginBottom: 2, textAlign: "left" }}>
                  <span>{t}</span>
                  <span style={{ fontSize: 10, opacity: .55 }}>
                    {t === "toutes"
                      ? items.filter((i) => !dismissed.has(i.id) && !isEvent(i)).length
                      : items.filter((i) => !dismissed.has(i.id) && (i.themes || []).includes(t)).length}
                  </span>
                </button>
              ))}
            </div>

            {topSignals.length > 0 && (
              <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ ...sc(), marginBottom: 10 }}>signaux faibles</div>
                {topSignals.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start" }}>
                    <span style={{ width: 16, height: 1, background: C.accent, flexShrink: 0, marginTop: 8 }} />
                    <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 12,
                      lineHeight: 1.5, color: C.text }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {topQuote && (
              <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 12,
                  lineHeight: 1.6, color: C.ink }}>« {topQuote.text} »</div>
                {topQuote.attr && (
                  <div style={{ ...sc(), fontSize: 9, marginTop: 6 }}>angle · {topQuote.attr}</div>
                )}
              </div>
            )}

            <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ ...sc(), marginBottom: 10 }}>trier par</div>
              {[["relevance", "pertinence"], ["date", "date"], ["title", "titre"]].map(([v, l]) => (
                <button key={v} onClick={() => setSortBy(v)}
                  style={{ display: "block", width: "100%", padding: "6px 9px", border: "none", borderRadius: 2,
                    background: sortBy === v ? C.ink : "transparent",
                    color: sortBy === v ? C.white : C.text,
                    cursor: "pointer", fontSize: 12, fontFamily: sans, marginBottom: 2, textAlign: "left" }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ padding: "12px 22px", marginTop: "auto" }}>
              {[
                ["productions", items.filter((i) => !dismissed.has(i.id)).length],
                ["favoris",     favoriteIds.size],
                ["en note",     noteIds.size],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", padding: "5px 0",
                  borderBottom: `1px solid ${C.border}`, fontSize: 11, fontFamily: sans }}>
                  <span style={{ color: C.muted }}>{label}</span>
                  <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: C.ink }}>{val}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main style={{ background: C.panelSoft, display: "flex", flexDirection: "column" }}>

            <div style={{ borderBottom: `3px double ${C.ink}`, padding: "12px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ ...sc(), color: C.dark, fontSize: 10 }}>
                  digest éditorial · {todayLong}
                </div>
                {lastUpdated && (
                  <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {pubCount} productions éditorialisées · mis à jour à {lastUpdated}
                  </div>
                )}
              </div>

              <button onClick={loadData} disabled={isRefreshing}
                style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 700, fontSize: 14,
                  padding: "10px 22px", background: isRefreshing ? C.muted : C.ink,
                  color: C.white, border: "none", cursor: isRefreshing ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
                  transition: "background .15s", letterSpacing: ".01em" }}
                onMouseEnter={(e) => { if (!isRefreshing) e.currentTarget.style.background = C.accent; }}
                onMouseLeave={(e) => { if (!isRefreshing) e.currentTarget.style.background = C.ink; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>↻</span>
                {isRefreshing ? "actualisation…" : "actualiser le digest"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center",
              borderBottom: `1px solid ${C.border}`, padding: "0 22px" }}>
              {[["productions", pubCount], ["événements", evtCount]].map(([key, count]) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{ padding: "10px 14px", background: "none", border: "none",
                    borderBottom: tab === key ? `2px solid ${C.ink}` : "2px solid transparent",
                    marginBottom: -1, color: tab === key ? C.ink : C.muted,
                    cursor: "pointer", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase",
                    fontFamily: sans, fontWeight: tab === key ? 500 : 400,
                    display: "flex", alignItems: "center", gap: 7 }}>
                  {key}
                  <span style={{ background: C.chip, color: C.chipText, borderRadius: 2,
                    padding: "1px 7px", fontSize: 10, textTransform: "none",
                    letterSpacing: 0, fontWeight: 400 }}>{count}</span>
                </button>
              ))}
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="rechercher dans le digest…"
                style={{ marginLeft: "auto", border: "none", background: "transparent",
                  outline: "none", color: C.accent, fontSize: 12, fontFamily: serif,
                  fontStyle: "italic", padding: "10px 0", width: 200 }} />
            </div>

            <div style={{ flex: 1, padding: "20px 22px", overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, ...sc() }}>chargement en cours…</div>
              ) : visibleItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, ...sc() }}>aucune production correspondante</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 0 }}>
                  {visibleItems.map((item) => <Card key={item.id} item={item} />)}
                </div>
              )}
            </div>

            <div style={{ borderTop: `3px double ${C.ink}`,
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              textAlign: "center", padding: "12px 10px", background: C.panel }}>
              {[
                [items.filter((i) => !dismissed.has(i.id)).length, "productions"],
                [favoriteIds.size,  "favoris"],
                [rssSources.length, "sources"],
                [noteIds.size,      "en note"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: serif, fontSize: 22, color: C.ink }}>{n}</div>
                  <div style={{ ...sc(), fontSize: 9 }}>{l}</div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {noteIds.size > 0 && (
          <div style={{ marginTop: 18, background: C.panelSoft,
            border: `1px solid ${C.border}`, padding: 22 }}>
            <div style={{ ...sc(), marginBottom: 14 }}>
              préparer une note — {noteIds.size} article{noteIds.size > 1 ? "s" : ""}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {items.filter((i) => noteIds.has(i.id)).map((item) => (
                <div key={item.id} style={{ background: C.white, border: `1px solid ${C.border}`, padding: 16 }}>
                  <span style={{ display: "inline-block", borderRadius: 2, padding: "3px 8px",
                    fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
                    marginBottom: 8, ...scorePill(item.relevanceScore) }}>
                    pertinence {Math.round((item.relevanceScore || 0) / 20) || 0}/5
                  </span>
                  <div style={{ fontFamily: serif, fontSize: 16, lineHeight: 1.2, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, color: C.muted, marginBottom: 8, fontFamily: sans }}>
                    {String(item.summary || "").slice(0, 200)}…
                  </div>
                  {item.exploitationAngle && (
                    <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.7, fontFamily: sans }}>
                      <strong>angle :</strong> {item.exploitationAngle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: 270px 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbbfa8; border-radius: 2px; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
