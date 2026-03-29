import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, FileText, Filter, ChevronRight, Bookmark, NotebookPen, CalendarDays, Building2, Tag, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Dépose ton fichier digests.json dans /public/digests.json
// Format attendu : un tableau d'objets avec les clés du JSON généré depuis Google Sheets.

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

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
};

const scoreLabel = (score) => {
  const n = Number(score || 0);
  if (n >= 85) return "Très pertinent";
  if (n >= 70) return "Pertinent";
  if (n >= 50) return "À regarder";
  return "Secondaire";
};

const scoreClass = (score) => {
  const n = Number(score || 0);
  if (n >= 85) return "bg-slate-900 text-white";
  if (n >= 70) return "bg-slate-200 text-slate-900";
  if (n >= 50) return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
};

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
    fetch("/digests.json")
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
      const matchesQuery =
        !q ||
        [
          item.title,
          item.summary,
          item.institution,
          item.documentType,
          ...(item.keywords || []),
          ...(item.themes || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesTheme = selectedTheme === "Tous" || (item.themes || []).includes(selectedTheme);
      const matchesType = selectedType === "Tous" || item.documentType === selectedType;
      const matchesFavorites = !showFavoritesOnly || favoriteIds.has(item.id);
      const matchesNotes = !showNoteOnly || noteIds.has(item.id);

      return matchesQuery && matchesTheme && matchesType && matchesFavorites && matchesNotes;
    });

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
      if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
      return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
    });

    return sorted;
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

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNote = (id) => {
    setNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const notePrepItems = filteredItems.filter((item) => noteIds.has(item.id));

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]"
        >
          <Card className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="h-4 w-4" />
                Lecteur éditorial de veille
              </div>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Digest de veille
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Une interface de consultation pensée comme une revue : recherche, filtres, score de pertinence,
                favoris, vue lecture et présélection pour préparer une note.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="grid h-full grid-cols-2 gap-3 p-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Items</div>
                <div className="mt-2 text-2xl font-semibold">{filteredItems.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Favoris</div>
                <div className="mt-2 text-2xl font-semibold">{favoriteIds.size}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Pour note</div>
                <div className="mt-2 text-2xl font-semibold">{noteIds.size}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Thèmes</div>
                <div className="mt-2 text-2xl font-semibold">{Math.max(0, allThemes.length - 1)}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" /> Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 text-sm font-medium">Recherche</div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Titre, thème, institution..."
                    className="rounded-2xl border-slate-200 pl-9"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Thème</div>
                <div className="flex flex-wrap gap-2">
                  {allThemes.map((theme) => (
                    <Button
                      key={theme}
                      variant={selectedTheme === theme ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setSelectedTheme(theme)}
                    >
                      {theme}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Type</div>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Tri</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={sortBy === "relevance" ? "default" : "outline"} className="rounded-full" onClick={() => setSortBy("relevance")}>Pertinence</Button>
                  <Button variant={sortBy === "date" ? "default" : "outline"} className="rounded-full" onClick={() => setSortBy("date")}>Date</Button>
                  <Button variant={sortBy === "title" ? "default" : "outline"} className="rounded-full" onClick={() => setSortBy("title")}>Titre</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setShowFavoritesOnly((v) => !v)}
                >
                  <Star className="mr-2 h-4 w-4" /> Favoris
                </Button>
                <Button
                  variant={showNoteOnly ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setShowNoteOnly((v) => !v)}
                >
                  <NotebookPen className="mr-2 h-4 w-4" /> Préparer une note
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cartes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[680px] pr-3">
                  <div className="space-y-3">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const isFavorite = favoriteIds.has(item.id);
                      const isForNote = noteIds.has(item.id);

                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ y: -2 }}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${
                            isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <Badge className={`rounded-full ${scoreClass(item.relevanceScore)}`}>
                              {item.relevanceScore ?? "—"} · {scoreLabel(item.relevanceScore)}
                            </Badge>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className={`rounded-full p-2 ${isFavorite ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                              >
                                <Star className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNote(item.id);
                                }}
                                className={`rounded-full p-2 ${isForNote ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}
                              >
                                <Bookmark className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <h3 className="mb-2 text-lg font-semibold leading-6">{item.title}</h3>

                          <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            {item.documentType && <span className="rounded-full bg-slate-100 px-2 py-1">{item.documentType}</span>}
                            {item.institution && <span className="rounded-full bg-slate-100 px-2 py-1">{item.institution}</span>}
                            {item.date && <span className="rounded-full bg-slate-100 px-2 py-1">{item.date}</span>}
                          </div>

                          <p className="line-clamp-4 text-sm leading-6 text-slate-600">{item.summary}</p>

                          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                            <span>{item.source || "Source non renseignée"}</span>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                              Lire <ChevronRight className="h-4 w-4" />
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Vue lecture</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItem ? (
                  <ScrollArea className="h-[680px] pr-4">
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full ${scoreClass(selectedItem.relevanceScore)}`}>
                          {selectedItem.relevanceScore ?? "—"}
                        </Badge>
                        {selectedItem.documentType && <Badge variant="secondary" className="rounded-full">{selectedItem.documentType}</Badge>}
                        {selectedItem.status && <Badge variant="outline" className="rounded-full">{selectedItem.status}</Badge>}
                      </div>

                      <div>
                        <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{selectedItem.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                          {selectedItem.date && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{selectedItem.date}</span>
                          )}
                          {selectedItem.institution && (
                            <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />{selectedItem.institution}</span>
                          )}
                          {selectedItem.source && <span>{selectedItem.source}</span>}
                        </div>
                      </div>

                      {(selectedItem.themes || []).length > 0 && (
                        <div>
                          <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700"><Tag className="h-4 w-4" /> Thèmes</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.themes.map((theme) => (
                              <Badge key={theme} variant="secondary" className="rounded-full">{theme}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="mb-2 text-sm font-medium text-slate-700">Résumé</div>
                        <div className="rounded-3xl bg-slate-50 p-5 text-[15px] leading-7 text-slate-700 whitespace-pre-wrap">
                          {selectedItem.summary || "Aucun résumé disponible."}
                        </div>
                      </div>

                      {(selectedItem.keywords || []).length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium text-slate-700">Concepts clés</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.keywords.map((keyword) => (
                              <Badge key={keyword} variant="outline" className="rounded-full">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedItem.innovations || []).length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium text-slate-700">Innovations technologiques</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.innovations.map((innovation) => (
                              <Badge key={innovation} className="rounded-full bg-sky-100 text-sky-800 hover:bg-sky-100">{innovation}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedItem.actors || []).length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium text-slate-700">Acteurs mentionnés</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.actors.map((actor) => (
                              <Badge key={actor} variant="secondary" className="rounded-full">{actor}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="mb-2 text-sm font-medium text-slate-700">Signal faible</div>
                          <div className="text-sm leading-6 text-slate-700">{selectedItem.weakSignal || "Non renseigné"}</div>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="mb-2 text-sm font-medium text-slate-700">Impact stratégique</div>
                          <div className="text-sm leading-6 text-slate-700">{selectedItem.strategicImpact ?? "Non renseigné"}</div>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-slate-50 p-5">
                        <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700"><FileText className="h-4 w-4" /> Angle d’exploitation</div>
                        <p className="text-sm leading-6 text-slate-700">{selectedItem.exploitationAngle || "Aucun angle d’exploitation disponible."}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="rounded-full" onClick={() => toggleFavorite(selectedItem.id)}>
                          <Star className="mr-2 h-4 w-4" /> {favoriteIds.has(selectedItem.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        </Button>
                        <Button variant="outline" className="rounded-full" onClick={() => toggleNote(selectedItem.id)}>
                          <NotebookPen className="mr-2 h-4 w-4" /> {noteIds.has(selectedItem.id) ? "Retirer de la note" : "Préparer une note"}
                        </Button>
                        <a href={selectedItem.url || "#"} target="_blank" rel="noreferrer">
                          <Button variant="outline" className="rounded-full">Ouvrir la source</Button>
                        </a>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-8 text-sm text-slate-500">
                    Aucun item ne correspond aux filtres.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mode “Préparer une note”</CardTitle>
          </CardHeader>
          <CardContent>
            {notePrepItems.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
                Aucun item n’est encore marqué pour une note.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {notePrepItems.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className={`rounded-full ${scoreClass(item.relevanceScore)}`}>{item.relevanceScore ?? "—"}</Badge>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold leading-6">{item.title}</h3>
                    <p className="mb-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.summary}</p>
                    <p className="text-sm leading-6 text-slate-700"><span className="font-medium">Angle :</span> {item.exploitationAngle}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
