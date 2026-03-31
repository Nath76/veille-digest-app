ader · JSX
Copier
1
import React, { useEffect, useMemo, useState, useCallback } from "react";
2
 
3
const DATA_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";
4
 
5
const C = {
6
  page: "#faf7f0", panel: "#f2ede0", soft: "#f5f1e6", border: "#cbbfa8",
7
  text: "#1e293b", muted: "#7a6f5c", accent: "#8a4b22", dark: "#2b2a24",
8
  white: "#fffdf8", chip: "#eee9d8", chipT: "#4f4638", green: "#1f7a45",
9
};
10
const SERIF = 'Georgia,"Times New Roman",serif';
11
const SANS = 'Inter,ui-sans-serif,system-ui,-apple-system,sans-serif';
12
 
13
function cleanHtml(s) {
14
  return (s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
15
}
16
 
17
function normalizeArray(v) {
18
  if (Array.isArray(v)) return v;
19
  if (!v) return [];
20
  return String(v).split(";").map(x => x.trim()).filter(Boolean);
21
}
22
 
23
function scorePill(n) {
24
  n = Number(n || 0);
25
  if (n >= 85) return { background: "#dcefdc", color: "#1f7a45" };
26
  if (n >= 70) return { background: "#f9e7c8", color: "#a16207" };
27
  if (n >= 50) return { background: "#f2e2da", color: "#9a3412" };
28
  return { background: "#ece7dc", color: "#6b7280" };
29
}
30
 
31
function isEvent(item) {
32
  const t = (item.documentType || "").toLowerCase();
33
  return ["événement", "evenement", "event", "conférence", "conference", "colloque", "séminaire", "seminaire"].includes(t);
34
}
35
 
36
function sc() {
37
  return { fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, fontFamily: SANS };
38
}
39
 
40
function todayFR() {
41
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
42
}
43
 
44
function timeNow() {
45
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
46
}
47
 
48
function Btn({ onClick, dark, danger, disabled, children }) {
49
  return (
50
    <button onClick={onClick} disabled={disabled} style={{
51
      padding: "8px 14px", borderRadius: 999, cursor: disabled ? "default" : "pointer",
52
      border: `1px solid ${danger ? "#fca5a5" : dark ? C.dark : C.border}`,
53
      background: dark ? C.dark : "transparent",
54
      color: danger ? "#dc2626" : dark ? C.white : C.text,
55
      fontSize: 12, fontFamily: SANS, opacity: disabled ? 0.7 : 1,
56
    }}>{children}</button>
57
  );
58
}
59
 
60
function PointVeilleModal({ items, noteIds, onClose }) {
61
  const candidates = items.filter(i => noteIds.has(i.id));
62
  const src = candidates.length > 0 ? candidates : items.slice(0, 3);
63
  const d = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
64
  const txt = `POINT DE VEILLE — ${d.toUpperCase()}\n\n${src.map((x, i) =>
65
    `${i + 1}. ${x.title}\n   Source : ${x.institution || x.source} | ${x.documentType} | Score : ${x.relevanceScore}/100\n\n   ${(x.summary || "").slice(0, 300)}…\n\n   Angle d'exploitation : ${x.exploitationAngle || ""}`
66
  ).join("\n\n---\n\n")}\n\n---\nVeille automatisée · Digest éditorial`;
67
 
68
  return (
69
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
70
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
71
      <div style={{ background: C.white, border: `1px solid ${C.border}`, width: 660, maxHeight: "80vh", display: "flex", flexDirection: "column", borderRadius: 4 }}>
72
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
73
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700 }}>Rédiger un point veille</div>
74
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>✕</button>
75
        </div>
76
        <div style={{ padding: "18px 22px", flex: 1, overflowY: "auto" }}>
77
          <div style={{ ...sc(), marginBottom: 10 }}>{candidates.length > 0 ? `${candidates.length} publication(s) marquées` : "Publications récentes"}</div>
78
          <textarea id="ptxt" defaultValue={txt} style={{ width: "100%", height: 360, fontFamily: SANS, fontSize: 13, lineHeight: 1.75, border: `1px solid ${C.border}`, padding: 14, background: C.page, color: C.text, resize: "vertical", borderRadius: 4, boxSizing: "border-box" }} />
79
        </div>
80
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
81
          <Btn dark onClick={() => { const t = document.getElementById("ptxt"); if (t) navigator.clipboard.writeText(t.value); }}>Copier le texte</Btn>
82
          <Btn onClick={onClose}>Fermer</Btn>
83
        </div>
84
      </div>
85
    </div>
86
  );
87
}
88
 
89
export default function VeilleDigestReader() {
90
  const [items, setItems] = useState([]);
91
  const [query, setQuery] = useState("");
92
  const [activeTab, setActiveTab] = useState("productions");
93
  const [sortBy, setSortBy] = useState("relevance");
94
  const [selectedId, setSelectedId] = useState(null);
95
  const [favs, setFavs] = useState(new Set());
96
  const [notes, setNotes] = useState(new Set());
97
  const [refreshing, setRefreshing] = useState(false);
98
  const [lastUpd, setLastUpd] = useState("");
99
  const [modal, setModal] = useState(false);
100
 
101
  const loadData = useCallback(() => {
102
    setRefreshing(true);
103
    fetch(`${DATA_URL}?t=${Date.now()}`)
104
      .then(r => r.ok ? r.json() : Promise.reject())
105
      .then(data => {
106
        // Dédoublonnage par URL
107
        const seen = new Set();
108
        const deduped = data.filter(i => {
109
          const k = i.url || i.title;
110
          if (!k || seen.has(k)) return false;
111
          seen.add(k);
112
          return true;
113
        });
114
 
115
        const norm = deduped.map((i, index) => ({
116
          ...i,
117
          // Fix: "NONE" n'est pas un vrai id
118
          id: String(i.id && i.id !== "NONE" && i.id !== "none" ? i.id : i.url || i.title || index),
119
          title: cleanHtml(i.title),
120
          actors: normalizeArray(i.actors),
121
          keywords: normalizeArray(i.keywords),
122
          innovations: normalizeArray(i.innovations),
123
          themes: normalizeArray(i.themes),
124
          favorite: Boolean(i.favorite),
125
          noteCandidate: Boolean(i.noteCandidate),
126
        }));
127
 
128
        // Garde uniquement les items avec au moins un titre
129
        const valid = norm.filter(i => i.title && i.title.trim() !== "");
130
 
131
        setItems(valid);
132
        setFavs(new Set(valid.filter(i => i.favorite).map(i => i.id)));
133
        setNotes(new Set(valid.filter(i => i.noteCandidate).map(i => i.id)));
134
        if (valid.length > 0) setSelectedId(valid[0].id);
135
        setLastUpd(timeNow());
136
      })
137
      .catch(() => { setLastUpd(timeNow()); })
138
      .finally(() => setRefreshing(false));
139
  }, []);
140
 
141
  useEffect(() => { loadData(); }, [loadData]);
142
 
143
  const productions = useMemo(() => items.filter(i => !isEvent(i)), [items]);
144
  const evenements = useMemo(() => items.filter(i => isEvent(i)), [items]);
145
 
146
  const filtered = useMemo(() => {
147
    const src = activeTab === "productions" ? productions : evenements;
148
    const q = query.trim().toLowerCase();
149
    return [...src]
150
      .filter(i => !q || [i.title, i.summary, i.institution, ...(i.themes || []), ...(i.keywords || [])].join(" ").toLowerCase().includes(q))
151
      .sort((a, b) => {
152
        if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
153
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
154
        return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
155
      });
156
  }, [items, activeTab, query, sortBy, productions, evenements]);
157
 
158
  useEffect(() => {
159
    if (!filtered.length) { setSelectedId(null); return; }
160
    if (!filtered.some(i => i.id === selectedId)) setSelectedId(filtered[0].id);
161
  }, [filtered, selectedId]);
162
 
163
  const sel = filtered.find(i => i.id === selectedId) || null;
164
 
165
  const toggleFav = id => setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
166
  const toggleNote = id => setNotes(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
167
  const deleteItem = id => setItems(p => p.filter(i => i.id !== id));
168
 
169
  return (
170
    <div style={{ minHeight: "100vh", background: C.page, color: C.text, fontFamily: SANS }}>
171
      {modal && <PointVeilleModal items={filtered} noteIds={notes} onClose={() => setModal(false)} />}
172
 
173
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 26 }}>
174
 
175
        {/* Header */}
176
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottom: `3px solid ${C.dark}`, marginBottom: 20 }}>
177
          <div>
178
            <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: C.dark, lineHeight: 0.95 }}>Veille</div>
179
            <div style={{ ...sc(), marginTop: 8 }}>Digest éditorial · propulsé par données JSON</div>
180
          </div>
181
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
182
            <Btn onClick={loadData} disabled={refreshing}>{refreshing ? "Actualisation..." : "Actualiser le digest"}</Btn>
183
            <span style={sc()}>{lastUpd ? `Maj ${lastUpd}` : ""}</span>
184
            <Btn dark onClick={() => setModal(true)}>✍ Rédiger un point veille</Btn>
185
          </div>
186
        </div>
187
 
188
        {/* Date */}
189
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
190
          <span style={{ ...sc(), marginRight: 10 }}>Digest</span>
191
          <span style={{ fontSize: 17, fontWeight: 600, color: C.dark }}>{todayFR()}</span>
192
        </div>
193
 
194
        {/* Tabs + search */}
195
        <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
196
          {[["productions", `Productions (${productions.length})`], ["evenements", `Événements (${evenements.length})`]].map(([key, label]) => (
197
            <button key={key} onClick={() => setActiveTab(key)} style={{
198
              padding: "11px 22px", border: "none", borderBottom: `3px solid ${activeTab === key ? C.dark : "transparent"}`,
199
              background: "transparent", cursor: "pointer", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase",
200
              fontFamily: SANS, color: activeTab === key ? C.dark : C.muted, fontWeight: activeTab === key ? 700 : 400,
201
            }}>{label}</button>
202
          ))}
203
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, paddingBottom: 10, alignItems: "center" }}>
204
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher..."
205
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: 14, padding: "7px 12px", borderRadius: 4, fontFamily: SANS, width: 200 }} />
206
            {[["relevance", "Pertinence"], ["date", "Date"], ["title", "Titre"]].map(([s, l]) => (
207
              <Btn key={s} dark={sortBy === s} onClick={() => setSortBy(s)}>{l}</Btn>
208
            ))}
209
          </div>
210
        </div>
211
 
212
        {/* Main grid */}
213
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
214
 
215
          {/* Cards */}
216
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
217
            {filtered.length === 0 && (
218
              <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", ...sc() }}>
219
                {items.length === 0 ? "Chargement en cours..." : "Aucune publication"}
220
              </div>
221
            )}
222
            {filtered.map(item => (
223
              <div key={item.id} onClick={() => setSelectedId(item.id)} style={{
224
                border: `1px solid ${item.id === selectedId ? C.dark : C.border}`,
225
                borderLeft: `3px solid ${item.id === selectedId ? C.dark : isEvent(item) ? C.green : C.accent}`,
226
                background: item.id === selectedId ? C.white : C.soft,
227
                padding: 16, cursor: "pointer", transition: "all .15s",
228
              }}>
229
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
230
                  <div style={{ ...sc(), color: C.accent }}>{item.source}</div>
231
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
232
                    <button type="button" onClick={e => { e.stopPropagation(); toggleFav(item.id); }}
233
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15, color: favs.has(item.id) ? "#f59e0b" : C.muted }}>
234
                      {favs.has(item.id) ? "★" : "☆"}
235
                    </button>
236
                    <button type="button" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
237
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: C.muted, padding: "2px 4px" }}>✕</button>
238
                  </div>
239
                </div>
240
                <div style={{ ...sc(), marginBottom: 8, color: C.muted }}>{item.date} · {item.documentType}</div>
241
                <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.dark, lineHeight: 1.25, marginBottom: 10 }}>{item.title}</div>
242
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
243
                  {(item.keywords || []).slice(0, 3).map(k => (
244
                    <span key={k} style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "3px 9px", fontSize: 12 }}>{k}</span>
245
                  ))}
246
                </div>
247
                <div style={{ fontSize: 14, color: C.accent, lineHeight: 1.8, marginBottom: 12 }}>{(item.summary || "").slice(0, 110)}…</div>
248
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
249
                  <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, ...scorePill(item.relevanceScore) }}>
250
                    PERTINENCE {Math.round((item.relevanceScore || 0) / 20)}/5
251
                  </span>
252
                  <span style={{ fontSize: 13, color: C.accent }}>LIRE →</span>
253
                </div>
254
              </div>
255
            ))}
256
          </div>
257
 
258
          {/* Right panel */}
259
          <div style={{ position: "sticky", top: 20 }}>
260
            {sel ? (
261
              <>
262
                <div style={{ border: `1px solid ${C.border}`, background: C.white }}>
263
                  <div style={{ padding: 18, borderBottom: `1px solid ${C.border}`, background: C.soft }}>
264
                    <div style={{ ...sc(), marginBottom: 6 }}>{sel.date} · {sel.institution}</div>
265
                    <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.dark, lineHeight: 1.25, marginBottom: 12 }}>{sel.title}</div>
266
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
267
                      <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, ...scorePill(sel.relevanceScore) }}>
268
                        PERTINENCE {Math.round((sel.relevanceScore || 0) / 20)}/5
269
                      </span>
270
                      <span style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "3px 9px", fontSize: 12 }}>{sel.documentType}</span>
271
                      <span style={{ display: "inline-block", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, background: sel.strategicImpact === 3 ? "#fee2e2" : "#ece7dc", color: sel.strategicImpact === 3 ? "#dc2626" : "#6b7280" }}>
272
                        Impact {sel.strategicImpact}/3
273
                      </span>
274
                    </div>
275
                  </div>
276
                  <div style={{ padding: 20, maxHeight: 500, overflowY: "auto" }}>
277
                    <div style={{ marginBottom: 16 }}>
278
                      <div style={{ ...sc(), marginBottom: 8 }}>Concepts clés</div>
279
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
280
                        {(sel.keywords || []).map(k => <span key={k} style={{ background: C.chip, color: C.chipT, borderRadius: 999, padding: "4px 10px", fontSize: 12 }}>{k}</span>)}
281
                      </div>
282
                    </div>
283
                    <div style={{ ...sc(), marginBottom: 8 }}>Résumé analytique</div>
284
                    <p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, marginBottom: 16 }}>{sel.summary}</p>
285
                    {sel.weakSignal && sel.weakSignal !== "Aucun signal faible identifié" && (
286
                      <div style={{ padding: 12, background: "#fef9c3", border: "1px solid #fde047", marginBottom: 14 }}>
287
                        <div style={{ ...sc(), color: "#713f12", marginBottom: 4 }}>Signal faible</div>
288
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#713f12" }}>{sel.weakSignal}</div>
289
                      </div>
290
                    )}
291
                    <div style={{ padding: 12, background: C.soft, border: `1px solid ${C.border}`, marginBottom: 18 }}>
292
                      <div style={{ ...sc(), marginBottom: 6 }}>Angle d'exploitation</div>
293
                      <div style={{ fontSize: 13, lineHeight: 1.75 }}>{sel.exploitationAngle || "Aucun angle disponible."}</div>
294
                    </div>
295
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
296
                      <Btn dark={notes.has(sel.id)} onClick={() => toggleNote(sel.id)}>
297
                        {notes.has(sel.id) ? "✓ En note" : "+ Préparer une note"}
298
                      </Btn>
299
                      <a href={sel.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
300
                        <Btn>Ouvrir la source</Btn>
301
                      </a>
302
                      <Btn danger onClick={() => deleteItem(sel.id)}>Supprimer</Btn>
303
                    </div>
304
                  </div>
305
                </div>
306
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", padding: "12px 8px", background: C.panel, border: `1px solid ${C.border}` }}>
307
                  {[[productions.length, "Productions"], [evenements.length, "Événements"], [favs.size, "Favoris"], [notes.size, "En note"]].map(([v, l]) => (
308
                    <div key={l} style={{ padding: "4px 0" }}>
309
                      <div style={{ fontFamily: SERIF, fontSize: 26, color: C.dark }}>{v}</div>
310
                      <div style={sc()}>{l}</div>
311
                    </div>
312
                  ))}
313
                </div>
314
              </>
315
            ) : (
316
              <div style={{ padding: 32, textAlign: "center", border: `1px solid ${C.border}`, color: C.muted, ...sc() }}>
317
                {items.length === 0 ? "Chargement en cours..." : "Sélectionnez une publication"}
318
              </div>
319
            )}
320
          </div>
321
        </div>
322
      </div>
323
 
324
      <style>{`
325
        @media (max-width: 1100px) {
326
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
327
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
328
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
329
        }
330
      `}</style>
331
    </div>
332
  );
333
}



