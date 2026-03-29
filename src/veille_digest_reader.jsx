import React, { useEffect, useMemo, useState } from "react";

const theme = {
  colors: {
    page: "#f4f0e8",
    surface: "rgba(255,255,255,0.92)",
    surfaceSoft: "#f8f5ef",
    border: "#ddd4c5",
    text: "#1f2937",
    muted: "#6b7280",
    accent: "#9a3412",
    accentSoft: "#f7d9c7",
    dark: "#111827",
    chip: "#efe7da",
    chipText: "#4b5563",
    selected: "#f7f2ea",
    favoriteBg: "#fef3c7",
    favoriteText: "#92400e",
    noteBg: "#dbeafe",
    noteText: "#1d4ed8",
  },
  radius: {
    xl: 22,
    lg: 18,
    md: 14,
    pill: 999,
  },
  shadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  font: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

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
  if (n >= 85) return { background: theme.colors.dark, color: "#fff" };
  if (n >= 70) return { background: theme.colors.chip, color: theme.colors.text };
  if (n >= 50) return { background: "#fef3c7", color: "#92400e" };
  return { background: "#eef2f7", color: "#475569" };
}

function splitParagraphs(text) {
  return String(text || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function PremiumCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
        boxShadow: theme.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: theme.radius.pill,
        border: `1px solid ${active ? theme.colors.dark : theme.colors.border}`,
        background: active ? theme.colors.dark : "#fff",
        color: active ? "#fff" : theme.colors.text,
        padding: "9px 14px",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SoftBadge({ children, style = {} }) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: theme.radius.pill,
        background: theme.colors.chip,
        color: theme.colors.chipText,
        padding: "6px 10px",
        fontSize: 12,
        marginRight: 6,
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </span>
  );
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
        setFavoriteIds(new Set(normalized.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(normalized.filter((i) => i.noteCandidate).map((i) => i.id)));
        if (normalized[0]) setSelectedItemId(normalized[0].id);
      })
      .catch(() => {
        setFavoriteIds(new Set(fallbackData.filter((i) => i.favorite).map((i) => i.id)));
        setNoteIds(new Set(fallbackData.filter((i) => i.noteCandidate).map((i) => i.id)));
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
  }, [items, query, selectedTheme, selectedType, sortBy, showFavoritesOnly, showNoteOnly, favoriteIds, noteIds]);

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
    <div style={{ minHeight: "100vh", background: theme.colors.page, color: theme.colors.text, fontFamily: theme.font }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 18px 48px" }}>
        <PremiumCard style={{ marginBottom: 18 }}>
          <div style={{ padding: 28, display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: theme.colors.accent, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 13, marginBottom: 10 }}>
                Digest éditorial personnel
              </div>
              <h1 style={{ fontSize: 46, lineHeight: 1, margin: "0 0 10px", fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Veille.
              </h1>
              <div style={{ color: theme.colors.muted, maxWidth: 760, lineHeight: 1.7, fontSize: 15 }}>
                Une lecture éditoriale de tes flux : filtres, vue lecture, favoris et présélection pour préparer une note.
              </div>
            </div>
            <div style={{ textAlign: "right", color: theme.colors.muted, fontSize: 14 }}>
              <div>{filteredItems.length} articles · {Math.max(0, allThemes.length - 1)} thèmes</div>
              <div style={{ marginTop: 6 }}>{favoriteIds.size} favoris · {noteIds.size} pour note</div>
            </div>
          </div>
        </PremiumCard>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
          <PremiumCard>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".14em", color: theme.colors.muted, marginBottom: 14 }}>
                Filtres
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherche par titre, thème, institution..."
                style={{ width: "100%", padding: "12px 14px", borderRadius: 16, border: `1px solid ${theme.colors.border}`, fontSize: 14, marginBottom: 18, boxSizing: "border-box" }}
              />

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Thèmes</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allThemes.map((themeName) => (
                    <PillButton key={themeName} active={selectedTheme === themeName} onClick={() => setSelectedTheme(themeName)}>
                      {themeName}
                    </PillButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Type</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allTypes.map((type) => (
                    <PillButton key={type} active={selectedType === type} onClick={() => setSelectedType(type)}>
                      {type}
                    </PillButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Tri</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <PillButton active={sortBy === "relevance"} onClick={() => setSortBy("relevance")}>Pertinence</PillButton>
                  <PillButton active={sortBy === "date"} onClick={() => setSortBy("date")}>Date</PillButton>
                  <PillButton active={sortBy === "title"} onClick={() => setSortBy("title")}>Titre</PillButton>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <PillButton active={showFavoritesOnly} onClick={() => setShowFavoritesOnly((v) => !v)}>Favoris</PillButton>
                <PillButton active={showNoteOnly} onClick={() => setShowNoteOnly((v) => !v)}>Préparer une note</PillButton>
              </div>
            </div>
          </PremiumCard>

          <div style={{ display: "grid", gridTemplateColumns: "0.88fr 1.12fr", gap: 18 }}>
            <PremiumCard>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".14em", color: theme.colors.muted, marginBottom: 14 }}>
                  Cartes
                </div>
                <div style={{ maxHeight: 720, overflowY: "auto", paddingRight: 6 }}>
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isFavorite = favoriteIds.has(item.id);
                    const isForNote = noteIds.has(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          borderRadius: 22,
                          border: `1px solid ${isSelected ? theme.colors.dark : theme.colors.border}`,
                          background: isSelected ? theme.colors.selected : "#fff",
                          padding: 18,
                          marginBottom: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                          <SoftBadge style={scoreStyle(item.relevanceScore)}>
                            Pertinence {item.relevanceScore ?? "—"}/100
                          </SoftBadge>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                              style={{ border: "none", borderRadius: 999, padding: "8px 10px", cursor: "pointer", background: isFavorite ? theme.colors.favoriteBg : "#f3f4f6", color: isFavorite ? theme.colors.favoriteText : theme.colors.muted }}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleNote(item.id); }}
                              style={{ border: "none", borderRadius: 999, padding: "8px 10px", cursor: "pointer", background: isForNote ? theme.colors.noteBg : "#f3f4f6", color: isForNote ? theme.colors.noteText : theme.colors.muted }}
                            >
                              ✎
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: 15, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>
                          {item.source || "Source"}
                        </div>
                        <div style={{ fontSize: 34, lineHeight: 1.15, fontFamily: 'Georgia, "Times New Roman", serif', marginBottom: 14, fontWeight: 700 }}>
                          {item.title}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          {item.documentType && <SoftBadge>{item.documentType}</SoftBadge>}
                          {item.institution && <SoftBadge>{item.institution}</SoftBadge>}
                          {item.date && <SoftBadge>{item.date}</SoftBadge>}
                        </div>

                        <div style={{ color: theme.colors.text, lineHeight: 1.75, fontSize: 15 }}>
                          {String(item.summary || "").slice(0, 320)}{String(item.summary || "").length > 320 ? "…" : ""}
                        </div>

                        <div style={{ marginTop: 14, color: theme.colors.accent, fontWeight: 600, textAlign: "right" }}>
                          Lire →
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </PremiumCard>

            <PremiumCard>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".14em", color: theme.colors.muted, marginBottom: 16 }}>
                  Vue lecture
                </div>
                {selectedItem ? (
                  <div style={{ maxHeight: 720, overflowY: "auto", paddingRight: 6 }}>
                    <div style={{ marginBottom: 12 }}>
                      <SoftBadge style={scoreStyle(selectedItem.relevanceScore)}>
                        {scoreLabel(selectedItem.relevanceScore)}
                      </SoftBadge>
                      {selectedItem.documentType && <SoftBadge>{selectedItem.documentType}</SoftBadge>}
                      {selectedItem.status && <SoftBadge>{selectedItem.status}</SoftBadge>}
                    </div>

                    <div style={{ fontSize: 46, lineHeight: 1.04, marginBottom: 12, fontWeight: 700, fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {selectedItem.title}
                    </div>

                    <div style={{ color: theme.colors.muted, fontSize: 14, marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {selectedItem.date && <span>{selectedItem.date}</span>}
                      {selectedItem.institution && <span>{selectedItem.institution}</span>}
                      {selectedItem.source && <span>{selectedItem.source}</span>}
                    </div>

                    {(selectedItem.themes || []).length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Thèmes</div>
                        {(selectedItem.themes || []).map((themeName) => <SoftBadge key={themeName}>{themeName}</SoftBadge>)}
                      </div>
                    )}

                    <div style={{ background: theme.colors.surfaceSoft, borderRadius: 22, padding: 22, marginBottom: 18 }}>
                      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 12 }}>Résumé</div>
                      {splitParagraphs(selectedItem.summary || "Aucun résumé disponible.").map((p, idx) => (
                        <p key={idx} style={{ margin: idx === 0 ? 0 : "0 0 12px", fontSize: 16, lineHeight: 1.9, color: theme.colors.text }}>
                          {p}
                        </p>
                      ))}
                    </div>

                    {(selectedItem.keywords || []).length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Concepts clés</div>
                        {(selectedItem.keywords || []).map((keyword) => <SoftBadge key={keyword}>{keyword}</SoftBadge>)}
                      </div>
                    )}

                    {(selectedItem.innovations || []).length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Innovations technologiques</div>
                        {(selectedItem.innovations || []).map((innovation) => <SoftBadge key={innovation} style={{ background: theme.colors.noteBg, color: theme.colors.noteText }}>{innovation}</SoftBadge>)}
                      </div>
                    )}

                    {(selectedItem.actors || []).length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 10 }}>Acteurs mentionnés</div>
                        {(selectedItem.actors || []).map((actor) => <SoftBadge key={actor}>{actor}</SoftBadge>)}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                      <div style={{ background: theme.colors.surfaceSoft, borderRadius: 18, padding: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 8 }}>Signal faible</div>
                        <div style={{ lineHeight: 1.7 }}>{selectedItem.weakSignal || "Non renseigné"}</div>
                      </div>
                      <div style={{ background: theme.colors.surfaceSoft, borderRadius: 18, padding: 18 }}>
                        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 8 }}>Impact stratégique</div>
                        <div style={{ lineHeight: 1.7 }}>{selectedItem.strategicImpact ?? "Non renseigné"}</div>
                      </div>
                    </div>

                    <div style={{ background: theme.colors.surfaceSoft, borderRadius: 18, padding: 18, marginBottom: 18 }}>
                      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: theme.colors.muted, marginBottom: 8 }}>Angle d’exploitation</div>
                      <div style={{ lineHeight: 1.8 }}>{selectedItem.exploitationAngle || "Aucun angle d’exploitation disponible."}</div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <button onClick={() => toggleFavorite(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${theme.colors.dark}`, background: theme.colors.dark, color: "#fff", padding: "10px 16px", cursor: "pointer" }}>
                        {favoriteIds.has(selectedItem.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      </button>
                      <button onClick={() => toggleNote(selectedItem.id)} style={{ borderRadius: 999, border: `1px solid ${theme.colors.border}`, background: "#fff", color: theme.colors.text, padding: "10px 16px", cursor: "pointer" }}>
                        {noteIds.has(selectedItem.id) ? "Retirer de la note" : "Préparer une note"}
                      </button>
                      <a href={selectedItem.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <button style={{ borderRadius: 999, border: `1px solid ${theme.colors.border}`, background: "#fff", color: theme.colors.text, padding: "10px 16px", cursor: "pointer" }}>
                          Ouvrir la source
                        </button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: theme.colors.surfaceSoft, borderRadius: 18, padding: 18 }}>Aucun item ne correspond aux filtres.</div>
                )}
              </div>
            </PremiumCard>
          </div>
        </div>

        <PremiumCard style={{ marginTop: 18 }}>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".14em", color: theme.colors.muted, marginBottom: 16 }}>
              Mode “Préparer une note”
            </div>
            {notePrepItems.length === 0 ? (
              <div style={{ background: theme.colors.surfaceSoft, borderRadius: 18, padding: 18 }}>Aucun item n’est encore marqué pour une note.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {notePrepItems.map((item) => (
                  <div key={item.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 22, background: theme.colors.surfaceSoft, padding: 16 }}>
                    <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <SoftBadge style={scoreStyle(item.relevanceScore)}>{item.relevanceScore ?? "—"}</SoftBadge>
                      <span style={{ fontSize: 12, color: theme.colors.muted }}>{item.date}</span>
                    </div>
                    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, lineHeight: 1.15, marginBottom: 10, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: theme.colors.text, marginBottom: 10 }}>
                      {String(item.summary || "").slice(0, 260)}{String(item.summary || "").length > 260 ? "…" : ""}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: theme.colors.text }}>
                      <strong>Angle :</strong> {item.exploitationAngle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PremiumCard>
      </div>

      <style>{`
        @media (max-width: 1120px) {
          div[style*="grid-template-columns: 320px 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 0.88fr 1.12fr"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

