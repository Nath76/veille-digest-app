import React, { useEffect, useMemo, useState } from "react";

const fallbackData = [
  {
    id: "demo-1",
    date: "2026-03-29",
    title: "Rapport de démonstration sur les mutations de la criminalité organisée",
    url: "#",
    source: "Google Alert",
    composante: "Veille éditoriale",
    institution: "Europol",
    documentType: "rapport",
    actors: ["Europol", "États membres"],
    keywords: ["criminalité organisée", "trafic", "coopération"],
    summary:
      "Ce rapport de démonstration présente les dynamiques récentes de la criminalité organisée en Europe et insiste sur l'articulation entre adaptation des réseaux, hybridation des trafics et capacité de coopération institutionnelle. Il met en évidence la montée en complexité des chaînes illicites, le rôle croissant de la donnée et l'importance des échanges opérationnels. Le document montre aussi comment certains signaux faibles peuvent annoncer des transformations plus profondes. Pour une activité de veille, l'intérêt principal réside dans la capacité du document à relier tendances, acteurs et implications stratégiques.",
    innovations: ["analyse de données", "outils numériques d'enquête"],
    weakSignal: "Oui",
    strategicImpact: 3,
    relevanceScore: 91,
    themes: ["criminalité organisée", "sécurité européenne", "coopération policière"],
    exploitationAngle:
      "Peut nourrir une note sur l'évolution des formes de coopération face à la criminalité organisée et sur les capacités analytiques à renforcer.",
    favorite: false,
    noteCandidate: true,
    status: "Nouveau",
  },
  {
    id: "demo-2",
    date: "2026-03-27",
    title: "Note de démonstration sur les signaux faibles liés à l'innovation de sûreté",
    url: "#",
    source: "Google Alert",
    composante: "Veille éditoriale",
    institution: "OFDT",
    documentType: "note",
    actors: ["OFDT"],
    keywords: ["innovation", "signal faible", "sûreté"],
    summary:
      "La note rassemble plusieurs observations dispersées sur l'émergence d'outils techniques et de modes d'organisation susceptibles de modifier certains équilibres opérationnels. Elle reste prudente, mais suggère que plusieurs transformations discrètes méritent un suivi rapproché. Elle est utile pour préparer des hypothèses de travail et alimenter une veille orientée anticipation.",
    innovations: ["capteurs", "analyse automatisée"],
    weakSignal: "Oui",
    strategicImpact: 2,
    relevanceScore: 78,
    themes: ["innovation", "anticipation", "sûreté"],
    exploitationAngle:
      "Peut être utilisé comme matériau exploratoire pour un encadré de veille ou une note d'anticipation.",
    favorite: true,
    noteCandidate: false,
    status: "Traité",
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f4ef",
    color: "#0f172a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "24px 16px 40px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.6fr",
    gap: "16px",
    marginBottom: "24px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "16px",
    marginBottom: "24px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
  },
  cardPadding: {
    padding: "24px",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "20px",
  },
  statBox: {
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "16px",
  },
  title: {
    fontSize: "42px",
    lineHeight: 1.05,
    margin: "0 0 12px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  muted: {
    color: "#64748b",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  pill: {
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "9px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  pillActive: {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
  },
  listArea: {
    maxHeight: "680px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  readerArea: {
    maxHeight: "680px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  itemCard: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    background: "#fff",
    padding: "16px",
    textAlign: "left",
    cursor: "pointer",
    marginBottom: "12px",
    boxSizing: "border-box",
  },
  itemSelected: {
    border: "1px solid #0f172a",
    background: "#f8fafc",
  },
  badge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
    marginRight: "6px",
    marginBottom: "6px",
  },
  iconButton: {
    border: "none",
    borderRadius: "999px",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "14px",
  },
  subInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    fontSize: "12px",
    color: "#64748b",
    margin: "10px 0 12px",
  },
  chip: {
    display: "inline-block",
    borderRadius: "999px",
    background: "#f1f5f9",
    padding: "6px 10px",
  },
  softBlock: {
    background: "#f8fafc",
    borderRadius: "24px",
    padding: "20px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "10px",
  },
  readerTitle: {
    fontSize: "34px",
    lineHeight: 1.15,
    margin: "0 0 10px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  summary: {
    background: "#f8fafc",
    borderRadius: "24px",
    padding: "20px",
    fontSize: "15px",
    lineHeight: 1.85,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  noteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  noteBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    background: "#f8fafc",
    padding: "16px",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  actionBtn: {
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    padding: "10px 16px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  primaryBtn: {
    borderRadius: "999px",
    border: "1px solid #0f172a",
    padding: "10px 16px",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
};

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

function scoreLabel(score) {
  const n = Number(score || 0);
  if (n >= 85) return "Très pertinent";
  if (n >= 70) return "Pertinent";
  if (n >= 50) return "À regarder";
  return "Secondaire";
}

function scoreStyle(score) {
  const n = Number(score || 0);
  if (n >= 85) return { background: "#0f172a", color: "#fff" };
  if (n >= 70) return { background: "#e2e8f0", color: "#0f172a" };
  if (n >= 50) return { background: "#fef3c7", color: "#92400e" };
  return { background: "#f1f5f9", color: "#475569" };
}

export default function VeilleDigestReader() {
  const [items, setItems] = useState(fallbackData);
  const [query, setQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Tous");
  const [selectedType, setSelectedType] = useState("Tous");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showNoteOnly, setShowNoteOnly] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [noteIds, setNoteIds] = useState(new Set());

  useEffect(() => {
    fetch("./digests.json")
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

        const favs = new Set(normalized.filter((i) => i.favorite).map((i) => i.id));
        const notes = new Set(normalized.filter((i) => i.noteCandidate).map((i) => i.id));
        setFavoriteIds(favs);
        setNoteIds(notes);
        if (normalized[0]) setSelectedItemId(normalized[0].id);
      })
      .catch(() => {
        const favs = new Set(fallbackData.filter((i) => i.favorite).map((i) => i.id));
        const notes = new Set(fallbackData.filter((i) => i.noteCandidate).map((i) => i.id));
        setFavoriteIds(favs);
        setNoteIds(notes);
        setSelectedItemId(fallbackData[0]?.id ?? null);
      });
  }, []);

  const allThemes = useMemo(() => {
    const values = new Set();
    items.forEach((item) => normalizeArray(item.themes).forEach((theme) => values.add(theme)));
    return ["Tous", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const allTypes = useMemo(() => {
    const values = new Set(items.map((item) => item.documentType).filter(Boolean));
    return ["Tous", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      const haystack = [
        item.title,
        item.summary,
        item.institution,
        item.documentType,
        ...(item.keywords || []),
        ...(item.themes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);
      const matchesTheme = selectedTheme === "Tous" || (item.themes || []).includes(selectedTheme);
      const matchesType = selectedType === "Tous" || item.documentType === selectedType;
      const matchesFavorites = !showFavoritesOnly || favoriteIds.has(item.id);
      const matchesNotes = !showNoteOnly || noteIds.has(item.id);

      return matchesQuery && matchesTheme && matchesType && matchesFavorites && matchesNotes;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
      if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
      return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
    });
  }, [
    items,
    query,
    selectedTheme,
    selectedType,
    sortBy,
    showFavoritesOnly,
    showNoteOnly,
    favoriteIds,
    noteIds,
  ]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId(null);
      return;
    }
    if (!selectedItemId || !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) || filteredItems[0] || null;

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

  const notePrepItems = filteredItems.filter((item) => noteIds.has(item.id));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topGrid}>
          <div style={styles.card}>
            <div style={styles.cardPadding}>
              <div style={{ ...styles.muted, fontSize: "14px", marginBottom: "12px" }}>
                ✦ Lecteur éditorial de veille
              </div>
              <h1 style={styles.title}>Digest de veille</h1>
              <p style={{ ...styles.muted, fontSize: "15px", lineHeight: 1.7, maxWidth: "760px" }}>
                Une interface de consultation pensée comme une revue : recherche, filtres,
                score de pertinence, favoris, vue lecture et présélection pour préparer une note.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.statGrid}>
              <div style={styles.statBox}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>
                  Items
                </div>
                <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                  {filteredItems.length}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>
                  Favoris
                </div>
                <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                  {favoriteIds.size}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>
                  Pour note
                </div>
                <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                  {noteIds.size}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>
                  Thèmes
                </div>
                <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                  {Math.max(0, allThemes.length - 1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.card}>
            <div style={styles.cardPadding}>
              <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px" }}>Filtres</h2>

              <div style={{ marginBottom: "18px" }}>
                <div style={styles.label}>Recherche</div>
                <input
                  style={styles.input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Titre, thème, institution..."
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <div style={styles.label}>Thème</div>
                <div style={styles.buttonGroup}>
                  {allThemes.map((theme) => (
                    <button
                      key={theme}
                      style={{
                        ...styles.pill,
                        ...(selectedTheme === theme ? styles.pillActive : {}),
                      }}
                      onClick={() => setSelectedTheme(theme)}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <div style={styles.label}>Type</div>
                <div style={styles.buttonGroup}>
                  {allTypes.map((type) => (
                    <button
                      key={type}
                      style={{
                        ...styles.pill,
                        ...(selectedType === type ? styles.pillActive : {}),
                      }}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <div style={styles.label}>Tri</div>
                <div style={styles.buttonGroup}>
                  <button
                    style={{ ...styles.pill, ...(sortBy === "relevance" ? styles.pillActive : {}) }}
                    onClick={() => setSortBy("relevance")}
                  >
                    Pertinence
                  </button>
                  <button
                    style={{ ...styles.pill, ...(sortBy === "date" ? styles.pillActive : {}) }}
                    onClick={() => setSortBy("date")}
                  >
                    Date
                  </button>
                  <button
                    style={{ ...styles.pill, ...(sortBy === "title" ? styles.pillActive : {}) }}
                    onClick={() => setSortBy("title")}
                  >
                    Titre
                  </button>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  style={{
                    ...styles.pill,
                    ...(showFavoritesOnly ? styles.pillActive : {}),
                  }}
                  onClick={() => setShowFavoritesOnly((v) => !v)}
                >
                  ★ Favoris
                </button>
                <button
                  style={{
                    ...styles.pill,
                    ...(showNoteOnly ? styles.pillActive : {}),
                  }}
                  onClick={() => setShowNoteOnly((v) => !v)}
                >
                  ✎ Préparer une note
                </button>
              </div>
            </div>
          </div>

          <div style={styles.contentGrid}>
            <div style={styles.card}>
              <div style={styles.cardPadding}>
                <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px" }}>Cartes</h2>
                <div style={styles.listArea}>
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isFavorite = favoriteIds.has(item.id);
                    const isForNote = noteIds.has(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        style={{
                          ...styles.itemCard,
                          ...(isSelected ? styles.itemSelected : {}),
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <span
                            style={{
                              ...styles.badge,
                              ...scoreStyle(item.relevanceScore),
                            }}
                          >
                            {item.relevanceScore ?? "—"} · {scoreLabel(item.relevanceScore)}
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                              style={{
                                ...styles.iconButton,
                                background: isFavorite ? "#fef3c7" : "#f1f5f9",
                                color: isFavorite ? "#92400e" : "#64748b",
                              }}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNote(item.id);
                              }}
                              style={{
                                ...styles.iconButton,
                                background: isForNote ? "#dbeafe" : "#f1f5f9",
                                color: isForNote ? "#1d4ed8" : "#64748b",
                              }}
                            >
                              ⌁
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.35, marginBottom: "10px" }}>
                          {item.title}
                        </div>

                        <div style={styles.subInfo}>
                          {item.documentType && <span style={styles.chip}>{item.documentType}</span>}
                          {item.institution && <span style={styles.chip}>{item.institution}</span>}
                          {item.date && <span style={styles.chip}>{item.date}</span>}
                        </div>

                        <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#475569" }}>
                          {item.summary}
                        </div>

                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            color: "#64748b",
                          }}
                        >
                          <span>{item.source || "Source non renseignée"}</span>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>Lire →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardPadding}>
                <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px" }}>Vue lecture</h2>
                {selectedItem ? (
                  <div style={styles.readerArea}>
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ ...styles.badge, ...scoreStyle(selectedItem.relevanceScore) }}>
                        {selectedItem.relevanceScore ?? "—"}
                      </span>
                      {selectedItem.documentType && (
                        <span style={{ ...styles.badge, background: "#e2e8f0", color: "#0f172a" }}>
                          {selectedItem.documentType}
                        </span>
                      )}
                      {selectedItem.status && (
                        <span style={{ ...styles.badge, background: "#fff", color: "#475569", border: "1px solid #cbd5e1" }}>
                          {selectedItem.status}
                        </span>
                      )}
                    </div>

                    <h3 style={styles.readerTitle}>{selectedItem.title}</h3>

                    <div style={{ ...styles.muted, fontSize: "14px", display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
                      {selectedItem.date && <span>🗓 {selectedItem.date}</span>}
                      {selectedItem.institution && <span>🏛 {selectedItem.institution}</span>}
                      {selectedItem.source && <span>{selectedItem.source}</span>}
                    </div>

                    {(selectedItem.themes || []).length > 0 && (
                      <div style={{ marginBottom: "18px" }}>
                        <div style={styles.sectionTitle}>Thèmes</div>
                        <div style={styles.buttonGroup}>
                          {selectedItem.themes.map((theme) => (
                            <span key={theme} style={{ ...styles.badge, background: "#e2e8f0", color: "#0f172a" }}>
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: "18px" }}>
                      <div style={styles.sectionTitle}>Résumé</div>
                      <div style={styles.summary}>
                        {selectedItem.summary || "Aucun résumé disponible."}
                      </div>
                    </div>

                    {(selectedItem.keywords || []).length > 0 && (
                      <div style={{ marginBottom: "18px" }}>
                        <div style={styles.sectionTitle}>Concepts clés</div>
                        <div style={styles.buttonGroup}>
                          {selectedItem.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              style={{ ...styles.badge, background: "#fff", color: "#334155", border: "1px solid #cbd5e1" }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedItem.innovations || []).length > 0 && (
                      <div style={{ marginBottom: "18px" }}>
                        <div style={styles.sectionTitle}>Innovations technologiques</div>
                        <div style={styles.buttonGroup}>
                          {selectedItem.innovations.map((innovation) => (
                            <span
                              key={innovation}
                              style={{ ...styles.badge, background: "#dbeafe", color: "#1e3a8a" }}
                            >
                              {innovation}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedItem.actors || []).length > 0 && (
                      <div style={{ marginBottom: "18px" }}>
                        <div style={styles.sectionTitle}>Acteurs mentionnés</div>
                        <div style={styles.buttonGroup}>
                          {selectedItem.actors.map((actor) => (
                            <span
                              key={actor}
                              style={{ ...styles.badge, background: "#e2e8f0", color: "#0f172a" }}
                            >
                              {actor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                      <div style={styles.softBlock}>
                        <div style={styles.sectionTitle}>Signal faible</div>
                        <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#334155" }}>
                          {selectedItem.weakSignal || "Non renseigné"}
                        </div>
                      </div>
                      <div style={styles.softBlock}>
                        <div style={styles.sectionTitle}>Impact stratégique</div>
                        <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#334155" }}>
                          {selectedItem.strategicImpact ?? "Non renseigné"}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.softBlock, marginBottom: "18px" }}>
                      <div style={styles.sectionTitle}>Angle d’exploitation</div>
                      <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#334155" }}>
                        {selectedItem.exploitationAngle || "Aucun angle d’exploitation disponible."}
                      </div>
                    </div>

                    <div style={styles.actionRow}>
                      <button style={styles.primaryBtn} onClick={() => toggleFavorite(selectedItem.id)}>
                        {favoriteIds.has(selectedItem.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      </button>
                      <button style={styles.actionBtn} onClick={() => toggleNote(selectedItem.id)}>
                        {noteIds.has(selectedItem.id) ? "Retirer de la note" : "Préparer une note"}
                      </button>
                      <a href={selectedItem.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <button style={styles.actionBtn}>Ouvrir la source</button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={styles.softBlock}>Aucun item ne correspond aux filtres.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px" }}>
              Mode “Préparer une note”
            </h2>
            {notePrepItems.length === 0 ? (
              <div style={styles.softBlock}>Aucun item n’est encore marqué pour une note.</div>
            ) : (
              <div style={styles.noteGrid}>
                {notePrepItems.map((item) => (
                  <div key={item.id} style={styles.noteBox}>
                    <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...styles.badge, ...scoreStyle(item.relevanceScore) }}>
                        {item.relevanceScore ?? "—"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.4, marginBottom: "10px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#475569", marginBottom: "10px" }}>
                      {item.summary}
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#334155" }}>
                      <strong>Angle :</strong> {item.exploitationAngle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .dummy {}
        }
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: 1.4fr 0.6fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 320px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 0.9fr 1.1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
