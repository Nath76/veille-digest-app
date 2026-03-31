import React, { useEffect, useMemo, useState, useCallback } from "react";

const theme = {
  colors: {
    page: "#f2efe8",
    panel: "#e7e0d0",
    panelSoft: "#ede7d8",
    border: "#cbbfa8",
    text: "#1e293b",
    muted: "#7a6f5c",
    accent: "#8a4b22",
    darkLine: "#2b2a24",
    white: "#fffdf8",
    chip: "#f5f0e6",
    chipText: "#4f4638",
    selected: "#f8f3e8",
    favoriteBg: "#fce7b2",
    favoriteText: "#8a4b22",
    noteBg: "#dbeafe",
    noteText: "#1d4ed8",
    green: "#1f7a45",
  },
  fontSans:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSerif: 'Georgia, "Times New Roman", serif',
};

const fallbackData = [
  {
    id: "demo-1",
    date: "2026-03-29",
    title: "Les modèles de langage s'imposent dans les salles de rédaction françaises",
    url: "#",
    source: "lemonde.fr",
    composante: "Veille éditoriale",
    institution: "Le Monde",
    documentType: "article",
    actors: ["Le Figaro", "L'Équipe", "AFP"],
    keywords: ["médias", "IA générative", "rédaction"],
    summary:
      "Plusieurs grands médias annoncent des partenariats et des expérimentations autour de l'IA générative pour accélérer certaines tâches éditoriales, automatiser des formats répétitifs et soutenir la production de contenus. Le document montre toutefois que ces usages restent encadrés par des considérations juridiques, organisationnelles et réputationnelles. Il met aussi en évidence un débat croissant sur les limites de l'automatisation, la vérification des faits et la place du jugement humain dans la chaîne éditoriale.",
    innovations: ["IA générative", "automatisation éditoriale"],
    weakSignal: "Oui",
    strategicImpact: 2,
    relevanceScore: 89,
    themes: ["IA", "médias", "numérique"],
    exploitationAngle:
      "Peut alimenter une note sur la diffusion des usages de l'IA générative dans des organisations soumises à de fortes contraintes de fiabilité.",
    favorite: true,
    noteCandidate: true,
    status: "Nouveau",
  },
  {
    id: "demo-2",
    date: "2026-03-28",
    title: "Le design thinking entre à l'école primaire : bilan d'une expérimentation",
    url: "#",
    source: "educpros",
    composante: "Veille éditoriale",
    institution: "EducPros",
    documentType: "bilan",
    actors: ["enseignants", "ministère"],
    keywords: ["pédagogie", "expérimentation", "coopération"],
    summary:
      "Une étude menée dans plusieurs classes pilotes met en avant des effets positifs sur l'engagement des élèves, la coopération et l'expression des idées. Elle souligne cependant la charge de préparation pour les enseignants et les conditions nécessaires à un passage à l'échelle. Le document intéresse surtout comme exemple de traduction opérationnelle d'une méthode de conception dans un cadre éducatif.",
    innovations: ["design thinking"],
    weakSignal: "Non",
    strategicImpact: 1,
    relevanceScore: 73,
    themes: ["pédagogie", "innovation", "design"],
    exploitationAngle:
      "Peut servir d'appui comparatif sur les usages d'approches de conception collaborative dans des organisations publiques.",
    favorite: false,
    noteCandidate: false,
    status: "Traité",
  },
];

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

function scorePillStyle(score) {
  const n = Number(score || 0);
  if (n >= 85) return { background: "#dcefdc", color: "#1f7a45" };
  if (n >= 70) return { background: "#f9e7c8", color: "#a16207" };
  if (n >= 50) return { background: "#f2e2da", color: "#9a3412" };
  return { background: "#ece7dc", color: "#6b7280" };
}

function splitParagraphs(text) {
  return String(text || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function smallCaps(text) {
  return {
    fontSize: 12,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    color: theme.colors.muted,
  };
}

export default function VeilleDigestReader() {
  const DATA_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";
  const [items, setItems] = useState(fallbackData);
  const [query, setQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Toutes les productions éditorialisées");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [noteIds, setNoteIds] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadData = useCallback(() => {
    setIsRefreshing(true);
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("No JSON found"))))
      .then((data) => {
        const normalized = data.map((item) => ({
          ...item,
          actors: normalizeArray(item.actors),
          keywords: normalizeArray(item.keywords),
          innovations: normalizeArray(item.innovations),
          themes: normalizeArray(item.themes),
          favorite: Boolean(item.favorite),
          noteCandidate: Boolean(item.noteCandidate),
        }));
        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(normalized.filter((i) => i.noteCandidate).map((i) => i.id)));
        if (normalized[0]) setSelectedItemId((prev) => prev && normalized.some((i) => i.id === prev) ? prev : normalized[0].id);
        setLastUpdated(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {
        setFavoriteIds(new Set(fallbackData.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(fallbackData.filter((i) => i.noteCandidate).map((i) => i.id)));
        setSelectedItemId(fallbackData[0]?.id ?? null);
        setLastUpdated(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allThemes = useMemo(() => {
    const values = new Set();
    items.forEach((item) => normalizeArray(item.themes).forEach((theme) => values.add(theme)));
    return ["Toutes les productions éditorialisées", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      const haystack = [
        item.title,
        item.summary,
        item.institution,
        ...(item.themes || []),
        ...(item.keywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);
      const matchesTheme =
        selectedTheme === "Toutes les productions éditorialisées" || (item.themes || []).includes(selectedTheme);
      return matchesQuery && matchesTheme;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
      if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
      return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
    });
  }, [items, query, selectedTheme, sortBy]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId(null);
      return;
    }
    if (!selectedItemId || !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) || filteredItems[0] || null;
  const notePrepItems = filteredItems.filter((item) => noteIds.has(item.id));
  const rssSources = Array.from(new Set(items.map((i) => i.source).filter(Boolean)));

  function toggleFavorite(id) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleNote(id) {
    setNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.page, color: theme.colors.text, fontFamily: theme.fontSans }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 26 }}>
        <div style={{ marginBottom: 18, color: "#6b7280", fontSize: 14 }}>
          Envisioned polished editorial design with fonctionnalités enrichies
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", border: `1px solid ${theme.colors.border}`, background: theme.colors.panel, minHeight: 820 }}>
          <aside style={{ borderRight: `1px solid ${theme.colors.border}`, background: theme.colors.panelSoft }}>
            <div style={{ padding: 22, borderBottom: `3px solid ${theme.colors.darkLine}` }}>
              <div style={{ fontFamily: theme.fontSerif, fontSize: 44, lineHeight: 0.95, fontWeight: 700, color: theme.colors.darkLine }}>Veille.</div>
              <div style={{ ...smallCaps(), marginTop: 8 }}>Digest éditorial · propulsé par données JSON</div>
            </div>

            <div style={{ padding: 22, borderBottom: `1px solid ${theme.colors.border}` }}>
              <div style={smallCaps()}>Thèmes</div>
              <div style={{ marginTop: 18 }}>
                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.white,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  <span>● {selectedTheme}</span>
                  <span style={{ color: theme.colors.muted }}>—</span>
                </button>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allThemes.slice(0, 8).map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => setSelectedTheme(themeName)}
                    style={{
                      border: `1px solid ${selectedTheme === themeName ? theme.colors.darkLine : theme.colors.border}`,
                      background: selectedTheme === themeName ? theme.colors.darkLine : theme.colors.white,
                      color: selectedTheme === themeName ? theme.colors.white : theme.colors.text,
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {themeName}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 22, borderBottom: `1px solid ${theme.colors.border}` }}>
              <div style={smallCaps()}>Sources RSS</div>
              <div style={{ marginTop: 16 }}>
                {rssSources.map((source) => (
                  <div key={source} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: theme.colors.accent }}>
                    <span style={{ color: theme.colors.green, fontSize: 12 }}>●</span>
                    <span style={{ fontSize: 15 }}>{source}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1, background: theme.colors.white, border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: "10px 12px", color: "#8b95a7", fontSize: 16 }}>
                  URL du flux RSS.
                </div>
                <button style={{ width: 42, borderRadius: 10, border: `1px solid ${theme.colors.border}`, background: theme.colors.panel, cursor: "pointer", fontSize: 20 }}>+</button>
              </div>
            </div>

            <div style={{ padding: 22 }}>
              <div style={smallCaps()}>Actions</div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button onClick={() => setSortBy("relevance")} style={{ borderRadius: 999, border: `1px solid ${sortBy === "relevance" ? theme.colors.darkLine : theme.colors.border}`, background: sortBy === "relevance" ? theme.colors.darkLine : theme.colors.white, color: sortBy === "relevance" ? theme.colors.white : theme.colors.text, padding: "9px 14px", cursor: "pointer" }}>Pertinence</button>
                <button onClick={() => setSortBy("date")} style={{ borderRadius: 999, border: `1px solid ${sortBy === "date" ? theme.colors.darkLine : theme.colors.border}`, background: sortBy === "date" ? theme.colors.darkLine : theme.colors.white, color: sortBy === "date" ? theme.colors.white : theme.colors.text, padding: "9px 14px", cursor: "pointer" }}>Date</button>
                <button onClick={() => setSortBy("title")} style={{ borderRadius: 999, border: `1px solid ${sortBy === "title" ? theme.colors.darkLine : theme.colors.border}`, background: sortBy === "title" ? theme.colors.darkLine : theme.colors.white, color: sortBy === "title" ? theme.colors.white : theme.colors.text, padding: "9px 14px", cursor: "pointer" }}>Titre</button>
              </div>
            </div>
          </aside>

          <main style={{ background: theme.colors.panelSoft }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", borderBottom: `1px solid ${theme.colors.border}` }}>
              <div style={{ padding: "16px 20px" }}>
                <span style={{ ...smallCaps(), marginRight: 12 }}>Digest</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: theme.colors.darkLine }}>
                  {selectedItem?.date ? selectedItem.date.replace(/-/g, " ") : "DIMANCHE 29 MARS 2026"}
                </span>
              </div>
              <div style={{ padding: "16px 20px", color: theme.colors.muted, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={loadData}
                disabled={isRefreshing}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.white,
                  color: theme.colors.text,
                  padding: "8px 14px",
                  cursor: isRefreshing ? "default" : "pointer",
                  opacity: isRefreshing ? 0.7 : 1,
                }}
              >
                {isRefreshing ? "Actualisation..." : "Actualiser le digest"}
              </button>
              <span>{lastUpdated ? `Maj ${lastUpdated}` : ""}</span>
            </div>
            </div>

            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${theme.colors.border}`, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={smallCaps()}>Filtrer :</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Générez un digest pour voir les thèmes"
                style={{ flex: 1, minWidth: 220, border: "none", background: "transparent", outline: "none", color: theme.colors.accent, fontSize: 16, fontStyle: "italic" }}
              />
            </div>

            <div style={{ padding: 0, display: "grid", gridTemplateRows: "1fr auto", minHeight: 705 }}>
              <div style={{ display: "grid", gridTemplateColumns: selectedItem ? "1fr 1fr" : "1fr" }}>
                <div style={{ padding: 24, borderRight: selectedItem ? `1px solid ${theme.colors.border}` : "none", maxHeight: 620, overflowY: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    {filteredItems.map((item) => {
                      const selected = selectedItem?.id === item.id;
                      const isFavorite = favoriteIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            textAlign: "left",
                            padding: 0,
                            cursor: "pointer",
                            opacity: selectedItem && !selected ? 0.94 : 1,
                          }}
                        >
                          <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <div style={{ ...smallCaps(), color: theme.colors.accent }}>{item.source}</div>
                              <span style={{ display: "inline-block", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, ...scorePillStyle(item.relevanceScore) }}>
                                PERTINENCE {Math.round((item.relevanceScore || 0) / 20) || 0}/5
                              </span>
                            </div>
                            <div style={{ fontFamily: theme.fontSerif, fontSize: 24, lineHeight: 1.23, fontWeight: 700, color: theme.colors.darkLine, marginBottom: 12 }}>
                              {item.title}
                            </div>
                            <div style={{ color: theme.colors.accent, fontSize: 15, lineHeight: 1.9, minHeight: 118 }}>
                              {splitParagraphs(item.summary || "").slice(0, 1).map((p, idx) => (
                                <p key={idx} style={{ margin: 0 }}>{p}</p>
                              ))}
                              {(item.keywords || []).slice(0, 3).map((k) => (
                                <div key={k}>— {k}</div>
                              ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                              <div>
                                {(item.themes || []).slice(0, 1).map((t) => (
                                  <span key={t} style={{ display: "inline-block", background: theme.colors.chip, color: theme.colors.chipText, borderRadius: 4, padding: "4px 8px", fontSize: 12 }}>{t}</span>
                                ))}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.colors.accent, fontSize: 14 }}>
                                <span>LIRE →</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                  style={{ border: "none", background: "transparent", cursor: "pointer", color: isFavorite ? theme.colors.favoriteText : theme.colors.muted, fontSize: 16 }}
                                >
                                  {isFavorite ? "★" : "☆"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedItem && (
                  <div style={{ padding: 28, maxHeight: 620, overflowY: "auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 18 }}>
                      <div style={{ fontFamily: theme.fontSerif, fontSize: 50, lineHeight: 1.02, color: theme.colors.darkLine, marginBottom: 12 }}>
                        Votre digest du jour
                      </div>
                      <div style={{ color: theme.colors.accent, fontSize: 16, lineHeight: 1.8 }}>
                        {selectedItem.institution || "Ajoutez des sources RSS, renseignez votre clé API et cliquez sur Générer le digest"}
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 18 }}>
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ display: "inline-block", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, ...scorePillStyle(selectedItem.relevanceScore) }}>
                          PERTINENCE {Math.round((selectedItem.relevanceScore || 0) / 20) || 0}/5
                        </span>
                      </div>
                      <div style={{ fontFamily: theme.fontSerif, fontSize: 34, lineHeight: 1.12, color: theme.colors.darkLine, marginBottom: 14, fontWeight: 700 }}>
                        {selectedItem.title}
                      </div>
                      <div style={{ ...smallCaps(), marginBottom: 14 }}>
                        {selectedItem.documentType} · {selectedItem.date} · {selectedItem.source}
                      </div>

                      {splitParagraphs(selectedItem.summary || "").map((p, idx) => (
                        <p key={idx} style={{ color: theme.colors.text, fontSize: 16, lineHeight: 1.9, marginTop: idx === 0 ? 0 : 0, marginBottom: 14 }}>
                          {p}
                        </p>
                      ))}

                      {(selectedItem.keywords || []).length > 0 && (
                        <div style={{ marginTop: 18 }}>
                          <div style={smallCaps()}>Concepts clés</div>
                          <div style={{ marginTop: 10 }}>
                            {(selectedItem.keywords || []).map((k) => <span key={k} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, borderRadius: 999, background: theme.colors.chip, color: theme.colors.chipText, padding: "6px 10px", fontSize: 13 }}>{k}</span>)}
                          </div>
                        </div>
                      )}

                      {(selectedItem.innovations || []).length > 0 && (
                        <div style={{ marginTop: 18 }}>
                          <div style={smallCaps()}>Innovations</div>
                          <div style={{ marginTop: 10 }}>
                            {(selectedItem.innovations || []).map((k) => <span key={k} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, borderRadius: 999, background: theme.colors.noteBg, color: theme.colors.noteText, padding: "6px 10px", fontSize: 13 }}>{k}</span>)}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                        <div style={{ padding: 14, background: theme.colors.white, border: `1px solid ${theme.colors.border}` }}>
                          <div style={smallCaps()}>Signal faible</div>
                          <div style={{ marginTop: 8, lineHeight: 1.7 }}>{selectedItem.weakSignal || "Non renseigné"}</div>
                        </div>
                        <div style={{ padding: 14, background: theme.colors.white, border: `1px solid ${theme.colors.border}` }}>
                          <div style={smallCaps()}>Impact stratégique</div>
                          <div style={{ marginTop: 8, lineHeight: 1.7 }}>{selectedItem.strategicImpact ?? "Non renseigné"}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 18, padding: 14, background: theme.colors.white, border: `1px solid ${theme.colors.border}` }}>
                        <div style={smallCaps()}>Angle d’exploitation</div>
                        <div style={{ marginTop: 8, lineHeight: 1.8 }}>{selectedItem.exploitationAngle || "Aucun angle disponible."}</div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                        <button onClick={() => toggleFavorite(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${theme.colors.darkLine}`, background: theme.colors.darkLine, color: theme.colors.white, padding: "10px 16px", cursor: "pointer" }}>
                          {favoriteIds.has(selectedItem.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        </button>
                        <button onClick={() => toggleNote(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${theme.colors.border}`, background: theme.colors.white, color: theme.colors.text, padding: "10px 16px", cursor: "pointer" }}>
                          {noteIds.has(selectedItem.id) ? "Retirer de la note" : "Préparer une note"}
                        </button>
                        <a href={selectedItem.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                          <button style={{ borderRadius: 999, border: `1px solid ${theme.colors.border}`, background: theme.colors.white, color: theme.colors.text, padding: "10px 16px", cursor: "pointer" }}>
                            Ouvrir la source
                          </button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${theme.colors.border}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", padding: "14px 10px", background: theme.colors.panel }}>
                <div>
                  <div style={{ fontSize: 28, fontFamily: theme.fontSerif }}>—</div>
                  <div style={smallCaps()}>Résumés</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontFamily: theme.fontSerif }}>{favoriteIds.size}</div>
                  <div style={smallCaps()}>Favoris</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontFamily: theme.fontSerif }}>{rssSources.length}</div>
                  <div style={smallCaps()}>Sources</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontFamily: theme.fontSerif }}>—</div>
                  <div style={smallCaps()}>Score moy</div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {notePrepItems.length > 0 && (
          <div style={{ marginTop: 18, background: theme.colors.panelSoft, border: `1px solid ${theme.colors.border}`, borderRadius: 24, padding: 20 }}>
            <div style={{ ...smallCaps(), marginBottom: 14 }}>Préparer une note</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {notePrepItems.map((item) => (
                <div key={item.id} style={{ background: theme.colors.white, border: `1px solid ${theme.colors.border}`, borderRadius: 18, padding: 14 }}>
                  <div style={{ marginBottom: 8 }}><span style={{ display: "inline-block", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, ...scorePillStyle(item.relevanceScore) }}>PERTINENCE {Math.round((item.relevanceScore || 0) / 20) || 0}/5</span></div>
                  <div style={{ fontFamily: theme.fontSerif, fontSize: 24, lineHeight: 1.14, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ color: theme.colors.text, lineHeight: 1.8, fontSize: 14, marginBottom: 8 }}>{String(item.summary || "").slice(0, 220)}...</div>
                  <div style={{ color: theme.colors.accent, lineHeight: 1.7, fontSize: 14 }}><strong>Angle :</strong> {item.exploitationAngle}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1160px) {
          div[style*="grid-template-columns: 340px 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

