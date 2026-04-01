import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

// ── COULEURS ──────────────────────────────────────────────
const C = {
  page: "#f2efe8", panel: "#e7e0d0", panelSoft: "#ede7d8",
  border: "#cbbfa8", text: "#1e293b", muted: "#7a6f5c",
  accent: "#8a4b22", dark: "#2b2a24", ink: "#18180f", white: "#fffdf8",
  chip: "#e8e0d0", chipText: "#4f4638",
  green: "#1f7a45", noteBg: "#dbeafe", noteText: "#1d4ed8",
};
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', Inter, ui-sans-serif, sans-serif";

// ── AGENDA ────────────────────────────────────────────────
const AGENDA_TAGS = ["conférence", "séminaire", "échéance", "veille"];
const AGENDA_TAG_STYLES = {
  "conférence": { bg: "#e1f5ee", color: "#0f6e56" },
  "séminaire":  { bg: "#eeedfe", color: "#534ab7" },
  "échéance":   { bg: "#faeeda", color: "#854f0b" },
  "veille":     { bg: "#e8e0d0", color: "#4f4638" },
};
const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FR   = ["L","M","M","J","V","S","D"];

// ── SIGNAUX FAIBLES ───────────────────────────────────────
const SIGNAL_TAGS = ["IA & algorithmes","désinformation","sécurité intérieure","numérique","opinion publique","autre"];
const SIGNAL_STATUSES = {
  "émergent": { bg: "#faeeda", color: "#854f0b" },
  "confirmé": { bg: "#dcefdc", color: "#1f7a45" },
  "critique": { bg: "#f2e2da", color: "#9a3412" },
};

// ── HELPERS ───────────────────────────────────────────────
function sc(extra = {}) {
  return { fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: C.muted, fontFamily: sans, ...extra };
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
  return String(v).split(";").map(s => s.trim()).filter(Boolean);
}
function cleanHtml(s) {
  return (s || "").replace(/<[^>]+>/g,"").replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").trim();
}
function isEvent(item) { return /[ée]v[ée]nement|event/i.test(item.documentType || ""); }
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayStr() { return toDateStr(new Date()); }
function formatDateFR(s) {
  if (!s) return "";
  try { return new Date(s+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
  catch { return s; }
}
function formatDateShortFR(s) {
  if (!s) return "";
  try { return new Date(s+"T00:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}); }
  catch { return s; }
}
function daysDelta(d1, d2) {
  try { return Math.round(Math.abs(new Date(d2+"T00:00:00")-new Date(d1+"T00:00:00"))/(86400000)); }
  catch { return 0; }
}
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  let dow = firstDay.getDay(); dow = dow===0 ? 6 : dow-1;
  const days = [];
  for (let i=dow-1;i>=0;i--) { const d=new Date(year,month,-i); days.push({str:toDateStr(d),n:d.getDate(),otherMonth:true}); }
  for (let i=1;i<=lastDay.getDate();i++) { const d=new Date(year,month,i); days.push({str:toDateStr(d),n:i,otherMonth:false}); }
  const rem=42-days.length;
  for (let i=1;i<=rem;i++) { const d=new Date(year,month+1,i); days.push({str:toDateStr(d),n:i,otherMonth:true}); }
  return days;
}

// ── COMPOSANT ─────────────────────────────────────────────
export default function VeilleDigestReader() {
  const DATA_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

  // — état digest —
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

  // — état agenda —
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("veille_agenda") || "[]"); } catch { return []; }
  });
  const now0 = new Date();
  const [calYear,     setCalYear]     = useState(now0.getFullYear());
  const [calMonth,    setCalMonth]    = useState(now0.getMonth());
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [agendaForm,  setAgendaForm]  = useState({ title:"", date:todayStr(), note:"", tag:"conférence" });

  // — état signaux —
  const [signals, setSignals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("veille_signaux") || "[]"); } catch { return []; }
  });
  const [sigForm,        setSigForm]        = useState({ text:"", tags:[], status:"émergent" });
  const [sigFilterSt,    setSigFilterSt]    = useState("tous");
  const [sigFilterTag,   setSigFilterTag]   = useState("tous");
  const [confirmingId,   setConfirmingId]   = useState(null);
  const [confirmForm,    setConfirmForm]    = useState({ date:todayStr(), note:"" });

  const prevIdsRef = useRef(new Set());
  const toastTimer = useRef(null);

  // persistance
  useEffect(() => { try { localStorage.setItem("veille_agenda",  JSON.stringify(events));  } catch {} }, [events]);
  useEffect(() => { try { localStorage.setItem("veille_signaux", JSON.stringify(signals)); } catch {} }, [signals]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null), 4000);
  }

  // — chargement données —
  const loadData = useCallback(() => {
    setIsRefreshing(true);
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const seen = new Set();
        const deduped = data.filter(i => { const k=i.url||i.title; if(!k||seen.has(k))return false; seen.add(k); return true; });
        const normalized = deduped
          .filter(i => i.title && cleanHtml(i.title).trim())
          .map((item,idx) => ({
            ...item,
            id: String(item.id&&item.id!=="NONE"&&item.id!=="none" ? item.id : item.url||item.title||idx),
            title:       cleanHtml(item.title),
            actors:      normalizeArray(item.actors),
            keywords:    normalizeArray(item.keywords),
            innovations: normalizeArray(item.innovations),
            themes:      normalizeArray(item.themes),
          }));
        const newIds = new Set(normalized.map(i=>i.id));
        const added  = [...newIds].filter(id=>!prevIdsRef.current.has(id)).length;
        prevIdsRef.current = newIds;
        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter(i=>i.favorite).map(i=>i.id)));
        setNoteIds(new Set(normalized.filter(i=>i.noteCandidate).map(i=>i.id)));
        const t = new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
        setLastUpdated(t);
        if (added>0) showToast(`+${added} nouvelle${added>1?"s":""} production${added>1?"s":""} éditorialisée${added>1?"s":""}`);
        else if (prevIdsRef.current.size>0) showToast("digest à jour");
      })
      .catch(()=>showToast("erreur de chargement"))
      .finally(()=>setIsRefreshing(false));
  }, []);
  useEffect(()=>{ loadData(); },[loadData]);

  // — computed digest —
  const allThemes = useMemo(()=>{
    const s=new Set();
    items.filter(i=>!dismissed.has(i.id)&&!isEvent(i)).forEach(i=>normalizeArray(i.themes).forEach(t=>s.add(t)));
    return ["toutes",...Array.from(s).sort((a,b)=>a.localeCompare(b))];
  },[items,dismissed]);

  const visibleItems = useMemo(()=>{
    const q=query.trim().toLowerCase();
    return items.filter(i=>!dismissed.has(i.id))
      .filter(i=>tab==="événements"?isEvent(i):!isEvent(i))
      .filter(i=>{
        const hay=[i.title,i.summary,i.institution,...(i.themes||[]),...(i.keywords||[])].filter(Boolean).join(" ").toLowerCase();
        return (!q||hay.includes(q))&&(selTheme==="toutes"||(i.themes||[]).includes(selTheme));
      })
      .sort((a,b)=>{
        if(sortBy==="date")  return String(b.date).localeCompare(String(a.date));
        if(sortBy==="title") return String(a.title).localeCompare(String(b.title));
        return Number(b.relevanceScore||0)-Number(a.relevanceScore||0);
      });
  },[items,dismissed,tab,query,selTheme,sortBy]);

  const selectedItem = selectedId ? items.find(i=>i.id===selectedId) : null;
  const pubCount  = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&!isEvent(i)).length,[items,dismissed]);
  const evtCount  = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&isEvent(i)).length,[items,dismissed]);
  const rssSources = useMemo(()=>Array.from(new Set(items.map(i=>i.source).filter(Boolean))),[items]);

  const topSignalsSb = useMemo(()=>
    signals.filter(s=>s.status!=="confirmé")
      .sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected))
      .slice(0,3).map(s=>s.text.slice(0,60))
  ,[signals]);

  const topQuote = useMemo(()=>{
    const best=items.find(i=>!dismissed.has(i.id)&&i.exploitationAngle);
    return best?{text:best.exploitationAngle.slice(0,120),attr:(best.themes||[])[0]||best.source||""}:null;
  },[items,dismissed]);

  // — computed agenda —
  const upcomingEvents = useMemo(()=>
    [...events].filter(e=>e.date>=todayStr()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4)
  ,[events]);
  const calendarDays   = useMemo(()=>getCalendarDays(calYear,calMonth),[calYear,calMonth]);
  const eventsByDay    = useMemo(()=>{ const m={}; events.forEach(e=>{ if(!m[e.date])m[e.date]=[]; m[e.date].push(e); }); return m; },[events]);
  const selectedDayEvts = useMemo(()=>(eventsByDay[selectedDay]||[]).sort((a,b)=>a.date.localeCompare(b.date)),[eventsByDay,selectedDay]);
  const monthUpcoming  = useMemo(()=>{
    const pfx=`${calYear}-${String(calMonth+1).padStart(2,"0")}`;
    return events.filter(e=>e.date.startsWith(pfx)&&e.date!==selectedDay).sort((a,b)=>a.date.localeCompare(b.date));
  },[events,calYear,calMonth,selectedDay]);
  const importSuggestions = useMemo(()=>
    items.filter(i=>isEvent(i)&&!dismissed.has(i.id)&&!events.some(e=>e.importedId===i.id)).slice(0,3)
  ,[items,dismissed,events]);

  // — computed signaux —
  const signalSuggestions = useMemo(()=>
    items.filter(i=>i.weakSignal&&!signals.some(s=>s.sourceId===i.id)).slice(0,3)
  ,[items,signals]);

  const activeSignals = useMemo(()=>
    signals.filter(s=>s.status!=="confirmé")
      .filter(s=>sigFilterSt==="tous"||s.status===sigFilterSt)
      .filter(s=>sigFilterTag==="tous"||s.tags.includes(sigFilterTag))
      .sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected))
  ,[signals,sigFilterSt,sigFilterTag]);

  const confirmedSignals = useMemo(()=>
    signals.filter(s=>s.status==="confirmé"&&s.dateConfirmed)
      .sort((a,b)=>b.dateConfirmed.localeCompare(a.dateConfirmed))
  ,[signals]);

  const allSigTags = useMemo(()=>{
    const s=new Set(["tous"]);
    signals.forEach(sig=>sig.tags.forEach(t=>s.add(t)));
    return Array.from(s);
  },[signals]);

  // — fonctions agenda —
  function prevMonth(){ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }
  function nextMonth(){ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }
  function selectDay(str){ setSelectedDay(str); setAgendaForm(f=>({...f,date:str})); }
  function addEvent(){
    if(!agendaForm.title.trim()||!agendaForm.date) return;
    setEvents(prev=>[...prev,{id:Date.now().toString(),...agendaForm}]);
    setAgendaForm(f=>({...f,title:"",note:""}));
    showToast("événement enregistré");
  }
  function deleteEvent(id){ setEvents(prev=>prev.filter(e=>e.id!==id)); }
  function importToAgenda(item){
    let dateStr=todayStr();
    if(item.date){ if(/^\d{4}-\d{2}-\d{2}$/.test(item.date)){dateStr=item.date;}else{try{const d=new Date(item.date);if(!isNaN(d))dateStr=toDateStr(d);}catch{}} }
    setEvents(prev=>[...prev,{id:Date.now().toString(),title:item.title,date:dateStr,note:String(item.summary||"").slice(0,200),tag:"veille",importedId:item.id,source:item.source||"digest"}]);
    setTab("agenda"); setSelectedDay(dateStr);
    const d=new Date(dateStr+"T00:00:00"); setCalYear(d.getFullYear()); setCalMonth(d.getMonth());
    showToast("événement importé dans l'agenda");
  }

  // — fonctions signaux —
  function toggleSigTag(t){ setSigForm(f=>({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x=>x!==t) : [...f.tags,t] })); }
  function addSignal(){
    if(!sigForm.text.trim()) return;
    setSignals(prev=>[...prev,{id:Date.now().toString(),text:sigForm.text.trim(),dateDetected:todayStr(),tags:sigForm.tags,status:sigForm.status,dateConfirmed:null,confirmedNote:"",source:"manuel",sourceId:null}]);
    setSigForm({text:"",tags:[],status:"émergent"});
    showToast("signal archivé");
  }
  function deleteSignal(id){ setSignals(prev=>prev.filter(s=>s.id!==id)); }
  function importSignal(item){
    setSignals(prev=>[...prev,{id:Date.now().toString(),text:item.weakSignal||item.title,dateDetected:todayStr(),tags:normalizeArray(item.themes).slice(0,2),status:"émergent",dateConfirmed:null,confirmedNote:"",source:item.source||"digest",sourceId:item.id}]);
    showToast("signal archivé dans la bibliothèque");
  }
  function startConfirm(id){ setConfirmingId(id); setConfirmForm({date:todayStr(),note:""}); }
  function saveConfirm(){
    setSignals(prev=>prev.map(s=>s.id===confirmingId?{...s,status:"confirmé",dateConfirmed:confirmForm.date,confirmedNote:confirmForm.note}:s));
    setConfirmingId(null);
    showToast("signal confirmé · ajouté au registre d'anticipation");
  }

  // — fonctions digest —
  function dismiss(id,e){ e?.stopPropagation(); setDismissed(p=>new Set([...p,id])); if(selectedId===id)setSelectedId(null); }
  function toggleFav(id,e){ e?.stopPropagation(); setFavoriteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;}); }
  function toggleNote(id,e){ e?.stopPropagation(); setNoteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;}); }

  const todayLong = new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  // ── CARTE DIGEST ──────────────────────────────────────────
  function Card({ item }) {
    const isFav=favoriteIds.has(item.id), sp=scorePill(item.relevanceScore), scoreN=Math.round((item.relevanceScore||0)/20)||0, isEvt=isEvent(item);
    return (
      <div onClick={()=>setSelectedId(item.id)}
        style={{background:C.white,border:`1px solid ${C.border}`,margin:"-0.5px",padding:"14px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",gap:8,transition:"box-shadow .15s"}}
        onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.1)")}
        onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}>
        <button onClick={e=>dismiss(item.id,e)} style={{position:"absolute",top:8,right:9,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:15,lineHeight:1,opacity:.3,padding:0}}
          onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        {item.date&&<div style={{...sc(),fontSize:9}}>{item.date}</div>}
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <span style={{borderRadius:2,padding:"2px 8px",fontSize:9,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",...sp}}>pertinence {scoreN}/5</span>
        </div>
        {(item.keywords||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{(item.keywords||[]).slice(0,4).map(k=><span key={k} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 8px",fontSize:10,fontFamily:sans}}>{k}</span>)}</div>}
        <div style={{fontFamily:serif,fontSize:15,lineHeight:1.25,fontWeight:700,color:C.ink}}>{item.title}</div>
        <div style={{height:1,background:C.border}}/>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.65,flex:1,fontFamily:sans}}>{String(item.summary||"").slice(0,155)}{(item.summary||"").length>155?"…":""}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...sc(),fontSize:9}}>{(item.themes||[])[0]||""}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isEvt&&<button onClick={e=>{e.stopPropagation();importToAgenda(item);}} style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,color:C.dark,padding:"2px 8px",fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>+ agenda</button>}
            <button onClick={e=>toggleFav(item.id,e)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.accent,opacity:isFav?1:.35,padding:0}}>{isFav?"★":"☆"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE AGENDA ────────────────────────────────────────────
  function AgendaView() {
    return (
      <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"20px 18px",background:C.white,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={prevMonth} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,padding:"0 4px"}}>‹</button>
            <span style={{fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink}}>{MONTHS_FR[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,padding:"0 4px"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
            {DAYS_FR.map((d,i)=><div key={i} style={{...sc(),fontSize:9,textAlign:"center",padding:"4px 0"}}>{d}</div>)}
            {calendarDays.map((day,i)=>{
              const isT=day.str===todayStr(),isSel=day.str===selectedDay,hasEv=!!eventsByDay[day.str]?.length;
              return <div key={i} onClick={()=>selectDay(day.str)} style={{fontSize:12,textAlign:"center",padding:"5px 2px",cursor:"pointer",borderRadius:2,fontFamily:sans,userSelect:"none",background:isSel?C.ink:isT?C.accent:"transparent",color:(isSel||isT)?C.white:day.otherMonth?"#cbbfa8":C.text,opacity:day.otherMonth&&!isSel&&!isT?.5:1,position:"relative"}}>
                {day.n}
                {hasEv&&!isSel&&!isT&&<span style={{display:"block",width:4,height:4,borderRadius:"50%",background:C.accent,margin:"1px auto 0"}}/>}
              </div>;
            })}
          </div>
          <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:14}}>
            <div style={{...sc(),marginBottom:10}}>ajouter un événement</div>
            <input value={agendaForm.title} onChange={e=>setAgendaForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addEvent()} placeholder="titre de l'événement" style={{width:"100%",fontFamily:sans,fontSize:12,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:6,outline:"none"}}/>
            <input type="date" value={agendaForm.date} onChange={e=>setAgendaForm(f=>({...f,date:e.target.value}))} style={{width:"100%",fontFamily:sans,fontSize:12,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:6,outline:"none"}}/>
            <input value={agendaForm.note} onChange={e=>setAgendaForm(f=>({...f,note:e.target.value}))} placeholder="note (optionnel)" style={{width:"100%",fontFamily:sans,fontSize:12,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:8,outline:"none"}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
              {AGENDA_TAGS.map(t=><button key={t} onClick={()=>setAgendaForm(f=>({...f,tag:t}))} style={{fontSize:10,padding:"3px 8px",borderRadius:2,border:`1px solid ${agendaForm.tag===t?C.ink:C.border}`,background:agendaForm.tag===t?C.ink:C.white,color:agendaForm.tag===t?C.white:C.muted,cursor:"pointer",fontFamily:sans}}>{t}</button>)}
            </div>
            <button onClick={addEvent} style={{width:"100%",fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:12,padding:"8px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ enregistrer l'événement</button>
          </div>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto"}}>
          <div style={{...sc(),marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>{formatDateFR(selectedDay)} · {selectedDayEvts.length} événement{selectedDayEvts.length!==1?"s":""}</div>
          {selectedDayEvts.length===0?<div style={{padding:"20px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun événement ce jour</div></div>:selectedDayEvts.map(ev=><EventCard key={ev.id} ev={ev}/>)}
          {monthUpcoming.length>0&&<div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}><div style={{...sc(),marginBottom:12}}>à venir ce mois</div>{monthUpcoming.map(ev=><EventCard key={ev.id} ev={ev}/>)}</div>}
          {importSuggestions.length>0&&<div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <div style={{...sc(),marginBottom:12}}>événements détectés dans le digest</div>
            {importSuggestions.map(item=><div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"12px 14px",marginBottom:10}}>
              <div style={{...sc(),fontSize:9,marginBottom:5}}>depuis le digest{item.date?` · ${item.date}`:""}</div>
              <div style={{fontFamily:serif,fontSize:14,color:C.ink,marginBottom:6}}>{item.title}</div>
              {item.summary&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:8,fontFamily:sans}}>{String(item.summary).slice(0,120)}…</div>}
              <button onClick={()=>importToAgenda(item)} style={{fontFamily:sans,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 12px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ ajouter à l'agenda</button>
            </div>)}
          </div>}
        </div>
      </div>
    );
  }

  function EventCard({ ev }) {
    const ts=AGENDA_TAG_STYLES[ev.tag]||AGENDA_TAG_STYLES["veille"];
    return <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"12px 14px",marginBottom:10,position:"relative"}}>
      <button onClick={()=>deleteEvent(ev.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
      <span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:2,marginBottom:6,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,...ts}}>{ev.tag}</span>
      <div style={{fontFamily:serif,fontSize:15,lineHeight:1.25,color:C.ink,marginBottom:4}}>{ev.title}</div>
      {ev.note&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans,marginBottom:4}}>{ev.note}</div>}
      {ev.date!==selectedDay&&<div style={{...sc(),fontSize:9,marginTop:4}}>{formatDateShortFR(ev.date)}</div>}
    </div>;
  }

  // ── VUE SIGNAUX FAIBLES ───────────────────────────────────
  function SignauxView() {
    return (
      <div style={{flex:1,display:"grid",gridTemplateColumns:"240px 1fr",minHeight:0}}>

        {/* Panneau gauche */}
        <div style={{borderRight:`1px solid ${C.border}`,padding:"18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>

          {/* Filtres statut */}
          <div>
            <div style={{...sc(),marginBottom:8}}>statut</div>
            {[["tous",signals.filter(s=>s.status!=="confirmé").length],["émergent",signals.filter(s=>s.status==="émergent").length],["confirmé",signals.filter(s=>s.status==="confirmé").length],["critique",signals.filter(s=>s.status==="critique").length]].map(([v,n])=>(
              <button key={v} onClick={()=>setSigFilterSt(v)} style={{display:"flex",justifyContent:"space-between",width:"100%",padding:"5px 8px",border:"none",borderRadius:2,background:sigFilterSt===v?C.ink:"transparent",color:sigFilterSt===v?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left"}}>
                <span>{v}</span><span style={{fontSize:10,opacity:.6}}>{n}</span>
              </button>
            ))}
          </div>

          {/* Filtres sujet */}
          <div>
            <div style={{...sc(),marginBottom:8}}>sujets</div>
            {allSigTags.map(t=>(
              <button key={t} onClick={()=>setSigFilterTag(t)} style={{display:"block",width:"100%",padding:"5px 8px",border:"none",borderRadius:2,background:sigFilterTag===t?C.ink:"transparent",color:sigFilterTag===t?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left"}}>{t}</button>
            ))}
          </div>

          {/* Formulaire ajout */}
          <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:12}}>
            <div style={{...sc(),marginBottom:8}}>ajouter un signal</div>
            <textarea value={sigForm.text} onChange={e=>setSigForm(f=>({...f,text:e.target.value}))} placeholder="formulation du signal…" rows={3} style={{width:"100%",fontFamily:sans,fontSize:11,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:6,outline:"none",resize:"vertical"}}/>
            <div style={{...sc(),fontSize:9,marginBottom:5}}>sujet</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {SIGNAL_TAGS.map(t=><button key={t} onClick={()=>toggleSigTag(t)} style={{fontSize:10,padding:"2px 7px",borderRadius:2,border:`1px solid ${sigForm.tags.includes(t)?C.ink:C.border}`,background:sigForm.tags.includes(t)?C.ink:C.white,color:sigForm.tags.includes(t)?C.white:C.muted,cursor:"pointer",fontFamily:sans}}>{t}</button>)}
            </div>
            <div style={{...sc(),fontSize:9,marginBottom:5}}>statut initial</div>
            <div style={{display:"flex",gap:4,marginBottom:8}}>
              {Object.keys(SIGNAL_STATUSES).map(st=><button key={st} onClick={()=>setSigForm(f=>({...f,status:st}))} style={{fontSize:10,padding:"2px 7px",borderRadius:2,border:`1px solid ${sigForm.status===st?C.ink:C.border}`,background:sigForm.status===st?SIGNAL_STATUSES[st].bg:C.white,color:sigForm.status===st?SIGNAL_STATUSES[st].color:C.muted,cursor:"pointer",fontFamily:sans,fontWeight:600}}>{st}</button>)}
            </div>
            <button onClick={addSignal} style={{width:"100%",fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:11,padding:"7px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ archiver</button>
          </div>
        </div>

        {/* Panneau droit */}
        <div style={{padding:"20px 22px",overflowY:"auto"}}>

          {/* Suggestions depuis le digest */}
          {signalSuggestions.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{...sc(),marginBottom:10}}>détectés dans le digest aujourd'hui</div>
              {signalSuggestions.map(item=>(
                <div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 12px",marginBottom:8}}>
                  <div style={{...sc(),fontSize:9,marginBottom:4}}>signal faible · {(item.themes||[])[0]||"veille"}</div>
                  <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.ink,marginBottom:6}}>{item.weakSignal||item.title}</div>
                  <button onClick={()=>importSignal(item)} style={{fontFamily:sans,fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ archiver dans la bibliothèque</button>
                </div>
              ))}
            </div>
          )}

          {/* Bibliothèque */}
          <div style={{...sc(),marginBottom:12}}>bibliothèque · {activeSignals.length} signal{activeSignals.length!==1?"s":""}</div>
          {activeSignals.length===0?(
            <div style={{padding:"30px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun signal dans cette catégorie</div></div>
          ):activeSignals.map(sig=><SignalCard key={sig.id} sig={sig}/>)}

          {/* Registre d'anticipation */}
          {confirmedSignals.length>0&&(
            <div style={{marginTop:28,paddingTop:20,borderTop:`2px solid ${C.ink}`}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:16}}>
                <span style={{fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink}}>registre d'anticipation</span>
                <span style={{...sc(),fontSize:9}}>{confirmedSignals.length} signal{confirmedSignals.length!==1?"s":""} confirmé{confirmedSignals.length!==1?"s":""}</span>
              </div>
              {confirmedSignals.map(sig=>(
                <div key={sig.id} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0,width:120}}>
                    <div style={{...sc(),fontSize:9,color:C.muted}}>détecté</div>
                    <div style={{...sc(),fontSize:9,color:C.muted,marginTop:1}}>{formatDateShortFR(sig.dateDetected)}</div>
                    <div style={{fontSize:11,color:C.accent,fontFamily:sans,margin:"4px 0"}}>↓ {daysDelta(sig.dateDetected,sig.dateConfirmed)} j.</div>
                    <div style={{...sc(),fontSize:9,color:"#1f7a45"}}>confirmé</div>
                    <div style={{...sc(),fontSize:9,color:"#1f7a45",marginTop:1}}>{formatDateShortFR(sig.dateConfirmed)}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.ink,marginBottom:5}}>{sig.text}</div>
                    {sig.tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>{sig.tags.map(t=><span key={t} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{t}</span>)}</div>}
                    {sig.confirmedNote&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans}}>{sig.confirmedNote}</div>}
                  </div>
                  <button onClick={()=>deleteSignal(sig.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0,flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function SignalCard({ sig }) {
    const ss=SIGNAL_STATUSES[sig.status]||SIGNAL_STATUSES["émergent"];
    const isConfirming=confirmingId===sig.id;
    return (
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:sig.status==="critique"?`3px solid #9a3412`:sig.status==="confirmé"?`3px solid #1f7a45`:"1px solid "+C.border,padding:"13px 14px",marginBottom:10,position:"relative"}}>
        <button onClick={()=>deleteSignal(sig.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
          <div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,lineHeight:1.4,color:C.ink,flex:1}}>{sig.text}</div>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:2,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,fontWeight:600,flexShrink:0,...ss}}>{sig.status}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:isConfirming?10:0}}>
          <span style={{...sc(),fontSize:9}}>détecté {formatDateShortFR(sig.dateDetected)}</span>
          {sig.tags.map(t=><span key={t} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{t}</span>)}
        </div>
        {!isConfirming&&sig.status!=="confirmé"&&(
          <button onClick={()=>startConfirm(sig.id)} style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:"none",border:`1px solid #1f7a45`,color:"#1f7a45",cursor:"pointer",fontFamily:sans,marginTop:8}}>marquer comme confirmé →</button>
        )}
        {isConfirming&&(
          <div style={{marginTop:8,padding:10,background:C.panelSoft,border:`1px solid ${C.border}`}}>
            <div style={{...sc(),marginBottom:6}}>confirmation</div>
            <input type="date" value={confirmForm.date} onChange={e=>setConfirmForm(f=>({...f,date:e.target.value}))} style={{width:"100%",fontFamily:sans,fontSize:11,padding:"5px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:5,outline:"none"}}/>
            <input value={confirmForm.note} onChange={e=>setConfirmForm(f=>({...f,note:e.target.value}))} placeholder="contexte de confirmation (source, date média…)" style={{width:"100%",fontFamily:sans,fontSize:11,padding:"5px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:8,outline:"none"}}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={saveConfirm} style={{flex:1,fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:11,padding:"6px",background:"#1f7a45",color:C.white,border:"none",cursor:"pointer"}}>confirmer</button>
              <button onClick={()=>setConfirmingId(null)} style={{padding:"6px 10px",background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontFamily:sans,fontSize:11}}>annuler</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:C.page,fontFamily:sans,color:C.text}}>

      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.ink,color:C.white,padding:"9px 20px",fontSize:12,letterSpacing:".04em",fontFamily:sans,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0,display:"inline-block"}}/>
        {toast}
      </div>}

      {selectedItem&&(
        <div onClick={()=>setSelectedId(null)} style={{position:"fixed",inset:0,background:"rgba(24,16,8,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.white,border:`1px solid ${C.border}`,maxWidth:700,width:"100%",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative"}}>
            <button onClick={()=>setSelectedId(null)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:24,lineHeight:1}}>×</button>
            {selectedItem.date&&<div style={{...sc(),fontSize:10,marginBottom:8}}>{selectedItem.date}{selectedItem.documentType?` · ${selectedItem.documentType}`:""}</div>}
            <span style={{display:"inline-block",borderRadius:2,padding:"3px 9px",fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:14,...scorePill(selectedItem.relevanceScore)}}>pertinence {Math.round((selectedItem.relevanceScore||0)/20)||0}/5</span>
            <div style={{fontFamily:serif,fontSize:30,lineHeight:1.15,fontWeight:700,color:C.ink,marginBottom:6}}>{selectedItem.title}</div>
            <div style={{height:2,background:C.ink,marginBottom:14}}/>
            <div style={{...sc(),marginBottom:16}}>{selectedItem.source}{selectedItem.institution?` · ${selectedItem.institution}`:""}</div>
            {(selectedItem.keywords||[]).length>0&&<div style={{marginBottom:16}}><div style={{...sc(),marginBottom:8}}>concepts clés</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selectedItem.keywords||[]).map(k=><span key={k} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"5px 10px",fontSize:12,fontFamily:sans}}>{k}</span>)}</div></div>}
            {String(selectedItem.summary||"").split(/\n+/).filter(Boolean).map((p,i)=><p key={i} style={{fontSize:15,lineHeight:1.85,color:C.text,marginBottom:12,fontFamily:sans}}>{p}</p>)}
            {(selectedItem.innovations||[]).length>0&&<div style={{marginTop:14,marginBottom:14}}><div style={{...sc(),marginBottom:8}}>innovations</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selectedItem.innovations||[]).map(k=><span key={k} style={{background:C.noteBg,color:C.noteText,borderRadius:2,padding:"5px 10px",fontSize:12,fontFamily:sans}}>{k}</span>)}</div></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:18}}>
              {[["signal faible",selectedItem.weakSignal],["impact stratégique",selectedItem.strategicImpact]].map(([l,v])=><div key={l} style={{padding:14,background:C.panelSoft,border:`1px solid ${C.border}`}}><div style={sc()}>{l}</div><div style={{marginTop:8,lineHeight:1.7,fontSize:14,fontFamily:sans}}>{v||"non renseigné"}</div></div>)}
            </div>
            <div style={{marginTop:12,padding:14,background:C.panelSoft,border:`1px solid ${C.border}`}}><div style={sc()}>angle d'exploitation</div><div style={{marginTop:8,lineHeight:1.8,fontSize:14,fontFamily:sans}}>{selectedItem.exploitationAngle||"aucun angle disponible."}</div></div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
              <button onClick={()=>toggleFav(selectedItem.id)} style={{border:`1px solid ${C.ink}`,background:C.ink,color:C.white,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>{favoriteIds.has(selectedItem.id)?"retirer des favoris":"ajouter aux favoris"}</button>
              <button onClick={()=>toggleNote(selectedItem.id)} style={{border:`1px solid ${C.border}`,background:C.white,color:C.text,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>{noteIds.has(selectedItem.id)?"retirer de la note":"préparer une note"}</button>
              {isEvent(selectedItem)&&<button onClick={()=>{importToAgenda(selectedItem);setSelectedId(null);}} style={{border:`1px solid ${C.border}`,background:C.white,color:C.dark,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>+ agenda</button>}
              {selectedItem.weakSignal&&<button onClick={()=>{importSignal(selectedItem);setSelectedId(null);showToast("signal archivé");}} style={{border:`1px solid ${C.border}`,background:C.white,color:C.dark,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>+ signal faible</button>}
              {selectedItem.url&&<a href={selectedItem.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button style={{border:`1px solid ${C.border}`,background:C.white,color:C.text,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>ouvrir la source</button></a>}
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:1400,margin:"0 auto",padding:26}}>
        <div style={{display:"grid",gridTemplateColumns:"270px 1fr",border:`1px solid ${C.border}`,minHeight:820}}>

          {/* ── SIDEBAR ── */}
          <aside style={{borderRight:`2px solid ${C.ink}`,background:C.panelSoft,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"20px 22px 16px",borderBottom:`4px double ${C.ink}`}}>
              <div style={{...sc(),fontSize:9,marginBottom:6}}>digest éditorial</div>
              <div style={{fontFamily:serif,fontSize:40,fontWeight:900,lineHeight:.9,color:C.ink,letterSpacing:-1}}>Veille</div>
              <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.muted,marginTop:7,lineHeight:1.4,borderTop:`1px solid ${C.border}`,paddingTop:7}}>digest éditorial<br/>propulsé par JSON</div>
            </div>
            <div style={{background:C.ink,padding:"10px 22px"}}>
              <div style={{...sc(),fontSize:9,color:"#9a8f7a"}}>édition du jour</div>
              <div style={{fontFamily:serif,fontSize:14,color:C.white,marginTop:2}}>{todayLong}</div>
              <div style={{fontSize:10,color:"#7a7060",marginTop:2,letterSpacing:".06em"}}>{pubCount} production{pubCount!==1?"s":""} · {evtCount} événement{evtCount!==1?"s":""} · {rssSources.length} source{rssSources.length!==1?"s":""}</div>
            </div>

            {/* Thèmes */}
            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>thèmes</div>
              {allThemes.map(t=>(
                <button key={t} onClick={()=>setSelTheme(t)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"6px 9px",border:"none",borderRadius:2,background:selTheme===t?C.ink:"transparent",color:selTheme===t?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left"}}>
                  <span>{t}</span>
                  <span style={{fontSize:10,opacity:.55}}>{t==="toutes"?items.filter(i=>!dismissed.has(i.id)&&!isEvent(i)).length:items.filter(i=>!dismissed.has(i.id)&&(i.themes||[]).includes(t)).length}</span>
                </button>
              ))}
            </div>

            {/* Prochains événements */}
            {upcomingEvents.length>0&&(
              <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{...sc(),marginBottom:10}}>prochains événements</div>
                {upcomingEvents.map(ev=>{
                  const ts=AGENDA_TAG_STYLES[ev.tag]||AGENDA_TAG_STYLES["veille"];
                  return <div key={ev.id} onClick={()=>{setTab("agenda");setSelectedDay(ev.date);const d=new Date(ev.date+"T00:00:00");setCalYear(d.getFullYear());setCalMonth(d.getMonth());}} style={{marginBottom:9,cursor:"pointer",paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                    <div style={{fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:C.accent,marginBottom:2,fontFamily:sans}}>{formatDateShortFR(ev.date)}</div>
                    <div style={{fontFamily:serif,fontSize:13,lineHeight:1.3,color:C.ink,marginBottom:3}}>{ev.title}</div>
                    <span style={{display:"inline-block",fontSize:9,padding:"1px 6px",borderRadius:2,fontFamily:sans,...ts}}>{ev.tag}</span>
                  </div>;
                })}
              </div>
            )}

            {/* Signaux actifs sidebar */}
            {topSignalsSb.length>0&&(
              <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{...sc(),marginBottom:10}}>signaux faibles</div>
                {topSignalsSb.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
                  <span style={{width:16,height:1,background:C.accent,flexShrink:0,marginTop:8}}/>
                  <span style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.5,color:C.text}}>{s}</span>
                </div>)}
              </div>
            )}

            {/* Pull quote */}
            {topQuote&&<div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`}}>
              <div style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.6,color:C.ink}}>« {topQuote.text} »</div>
              {topQuote.attr&&<div style={{...sc(),fontSize:9,marginTop:6}}>angle · {topQuote.attr}</div>}
            </div>}

            {/* Tri */}
            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>trier par</div>
              {[["relevance","pertinence"],["date","date"],["title","titre"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{display:"block",width:"100%",padding:"6px 9px",border:"none",borderRadius:2,background:sortBy===v?C.ink:"transparent",color:sortBy===v?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left"}}>{l}</button>
              ))}
            </div>

            {/* Mini stats */}
            <div style={{padding:"12px 22px",marginTop:"auto"}}>
              {[
                ["productions",items.filter(i=>!dismissed.has(i.id)).length],
                ["favoris",favoriteIds.size],
                ["agenda",events.length],
                ["signaux actifs",signals.filter(s=>s.status!=="confirmé").length],
                ["confirmés",confirmedSignals.length],
              ].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11,fontFamily:sans}}>
                  <span style={{color:C.muted}}>{l}</span>
                  <span style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink}}>{v}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main style={{background:C.panelSoft,display:"flex",flexDirection:"column"}}>
            <div style={{borderBottom:`3px double ${C.ink}`,padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div>
                <div style={{...sc(),color:C.dark,fontSize:10}}>digest éditorial · {todayLong}</div>
                {lastUpdated&&<div style={{fontFamily:serif,fontStyle:"italic",fontSize:12,color:C.muted,marginTop:2}}>{pubCount} productions éditorialisées · mis à jour à {lastUpdated}</div>}
              </div>
              <button onClick={loadData} disabled={isRefreshing} style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:14,padding:"10px 22px",background:isRefreshing?C.muted:C.ink,color:C.white,border:"none",cursor:isRefreshing?"default":"pointer",display:"flex",alignItems:"center",gap:10,flexShrink:0,transition:"background .15s"}}
                onMouseEnter={e=>{if(!isRefreshing)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!isRefreshing)e.currentTarget.style.background=C.ink;}}>
                <span style={{fontSize:18,lineHeight:1}}>↻</span>{isRefreshing?"actualisation…":"actualiser le digest"}
              </button>
            </div>

            {/* Onglets */}
            <div style={{display:"flex",alignItems:"center",borderBottom:`1px solid ${C.border}`,padding:"0 22px"}}>
              {[["productions",pubCount],["événements",evtCount],["agenda",events.length],["signaux faibles",signals.filter(s=>s.status!=="confirmé").length]].map(([key,count])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:"10px 12px",background:"none",border:"none",borderBottom:tab===key?`2px solid ${C.ink}`:"2px solid transparent",marginBottom:-1,color:tab===key?C.ink:C.muted,cursor:"pointer",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",fontFamily:sans,fontWeight:tab===key?500:400,display:"flex",alignItems:"center",gap:6}}>
                  {key}<span style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"1px 6px",fontSize:10,textTransform:"none",letterSpacing:0,fontWeight:400}}>{count}</span>
                </button>
              ))}
              {tab!=="agenda"&&tab!=="signaux faibles"&&<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="rechercher dans le digest…" style={{marginLeft:"auto",border:"none",background:"transparent",outline:"none",color:C.accent,fontSize:12,fontFamily:serif,fontStyle:"italic",padding:"10px 0",width:200}}/>}
            </div>

            {/* Contenu */}
            {tab==="agenda" ? <AgendaView/> : tab==="signaux faibles" ? <SignauxView/> : (
              <>
                <div style={{flex:1,padding:"20px 22px",overflowY:"auto"}}>
                  {items.length===0?<div style={{textAlign:"center",padding:60,...sc()}}>chargement en cours…</div>
                  :visibleItems.length===0?<div style={{textAlign:"center",padding:60,...sc()}}>aucune production correspondante</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:0}}>{visibleItems.map(item=><Card key={item.id} item={item}/>)}</div>}
                </div>
                <div style={{borderTop:`3px double ${C.ink}`,display:"grid",gridTemplateColumns:"repeat(4, 1fr)",textAlign:"center",padding:"12px 10px",background:C.panel}}>
                  {[[items.filter(i=>!dismissed.has(i.id)).length,"productions"],[favoriteIds.size,"favoris"],[rssSources.length,"sources"],[noteIds.size,"en note"]].map(([n,l])=>(
                    <div key={l}><div style={{fontFamily:serif,fontSize:22,color:C.ink}}>{n}</div><div style={{...sc(),fontSize:9}}>{l}</div></div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>

        {/* Zone note */}
        {noteIds.size>0&&tab!=="agenda"&&tab!=="signaux faibles"&&(
          <div style={{marginTop:18,background:C.panelSoft,border:`1px solid ${C.border}`,padding:22}}>
            <div style={{...sc(),marginBottom:14}}>préparer une note — {noteIds.size} article{noteIds.size>1?"s":""}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:12}}>
              {items.filter(i=>noteIds.has(i.id)).map(item=>(
                <div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,padding:16}}>
                  <span style={{display:"inline-block",borderRadius:2,padding:"3px 8px",fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8,...scorePill(item.relevanceScore)}}>pertinence {Math.round((item.relevanceScore||0)/20)||0}/5</span>
                  <div style={{fontFamily:serif,fontSize:16,lineHeight:1.2,marginBottom:8}}>{item.title}</div>
                  <div style={{fontSize:12,lineHeight:1.7,color:C.muted,marginBottom:8,fontFamily:sans}}>{String(item.summary||"").slice(0,200)}…</div>
                  {item.exploitationAngle&&<div style={{fontSize:12,color:C.accent,lineHeight:1.7,fontFamily:sans}}><strong>angle :</strong> {item.exploitationAngle}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;}
        @media(max-width:1100px){
          div[style*="grid-template-columns: 270px 1fr"]{grid-template-columns:1fr!important;}
          div[style*="grid-template-columns: 280px 1fr"]{grid-template-columns:1fr!important;}
          div[style*="grid-template-columns: 240px 1fr"]{grid-template-columns:1fr!important;}
        }
        @media(max-width:700px){div[style*="repeat(4, 1fr)"]{grid-template-columns:repeat(2,1fr)!important;}}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#cbbfa8;border-radius:2px;}
        button:focus{outline:none;}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer;}
        textarea{resize:vertical;}
      `}</style>
    </div>
  );
}

