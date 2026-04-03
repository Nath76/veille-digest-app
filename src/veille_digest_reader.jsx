import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

// ── COULEURS ──────────────────────────────────────────────
const C = {
  page:"#f2efe8",panel:"#e7e0d0",panelSoft:"#ede7d8",
  border:"#cbbfa8",text:"#1e293b",muted:"#7a6f5c",
  accent:"#8a4b22",dark:"#2b2a24",ink:"#18180f",white:"#fffdf8",
  chip:"#e8e0d0",chipText:"#4f4638",
  green:"#1f7a45",noteBg:"#dbeafe",noteText:"#1d4ed8",
};
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', Inter, ui-sans-serif, sans-serif";

// ── CONSTANTES MODULES ────────────────────────────────────
const AGENDA_TAGS = ["conférence","séminaire","échéance","veille"];
const AGENDA_TAG_S = {
  "conférence":{bg:"#e1f5ee",color:"#0f6e56"},
  "séminaire": {bg:"#eeedfe",color:"#534ab7"},
  "échéance":  {bg:"#faeeda",color:"#854f0b"},
  "veille":    {bg:"#e8e0d0",color:"#4f4638"},
};
const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FR   = ["L","M","M","J","V","S","D"];

const SIGNAL_TAGS = ["IA & algorithmes","désinformation","sécurité intérieure","numérique","opinion publique","autre"];
const SIGNAL_ST   = {
  "émergent":{bg:"#faeeda",color:"#854f0b"},
  "confirmé":{bg:"#dcefdc",color:"#1f7a45"},
  "critique":{bg:"#f2e2da",color:"#9a3412"},
};

const EXPERT_DOMAINS = ["sécurité publique","renseignement","numérique","communication","juridique","autre"];

// ── HELPERS ───────────────────────────────────────────────
const sc  = (x={}) => ({fontSize:11,letterSpacing:".14em",textTransform:"uppercase",color:C.muted,fontFamily:sans,...x});
const sp  = s => { const n=Number(s||0); if(n>=85)return{background:"#dcefdc",color:"#1f7a45"}; if(n>=70)return{background:"#f9e7c8",color:"#a16207"}; if(n>=50)return{background:"#f2e2da",color:"#9a3412"}; return{background:"#ece7dc",color:"#6b7280"}; };
const pArr = v => { if(Array.isArray(v))return v; if(!v)return []; return String(v).split(";").map(s=>s.trim()).filter(Boolean); };
const sArr = a => Array.isArray(a)?a.join(";"):(a||"");
const norm = v => Array.isArray(v)?v:pArr(v);
const cHtml = s => (s||"").replace(/<[^>]+>/g,"").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").trim();
const isEv  = i => /[ée]v[ée]nement|event/i.test(i.documentType||"");
const tds   = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => tds(new Date());
const fFR   = s => { if(!s)return""; try{return new Date(s+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}catch{return s;} };
const fsFR  = s => { if(!s)return""; try{return new Date(s+"T00:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});}catch{return s;} };
const delta = (a,b) => { try{return Math.round(Math.abs(new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);}catch{return 0;} };
const calDays = (y,m) => {
  const fd=new Date(y,m,1),ld=new Date(y,m+1,0);
  let dow=fd.getDay(); dow=dow===0?6:dow-1;
  const days=[];
  for(let i=dow-1;i>=0;i--){const d=new Date(y,m,-i);days.push({str:tds(d),n:d.getDate(),o:true});}
  for(let i=1;i<=ld.getDate();i++){const d=new Date(y,m,i);days.push({str:tds(d),n:i,o:false});}
  const r=42-days.length; for(let i=1;i<=r;i++){const d=new Date(y,m+1,i);days.push({str:tds(d),n:i,o:true});}
  return days;
};

// ── API SHEETS ────────────────────────────────────────────
// Toutes les opérations passent par le même Apps Script URL.
// Le script doit être redéployé avec le nouveau Code.gs.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

const api = {
  read:   async (sheet) => { try{ const r=await fetch(`${SCRIPT_URL}?action=read&sheet=${sheet}&t=${Date.now()}`); return r.ok?await r.json():[];}catch{return[];} },
  add:    async (sheet,data) => { try{ await fetch(`${SCRIPT_URL}?action=add&sheet=${sheet}&payload=${encodeURIComponent(JSON.stringify(data))}&t=${Date.now()}`);}catch{} },
  update: async (sheet,data) => { try{ await fetch(`${SCRIPT_URL}?action=update&sheet=${sheet}&payload=${encodeURIComponent(JSON.stringify(data))}&t=${Date.now()}`);}catch{} },
  del:    async (sheet,id)   => { try{ await fetch(`${SCRIPT_URL}?action=delete&sheet=${sheet}&id=${id}&t=${Date.now()}`);}catch{} },
};

// ── COMPOSANT ─────────────────────────────────────────────
export default function VeilleDigestReader() {

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
  const [events,      setEvents]     = useState([]);
  const n0 = new Date();
  const [calY, setCalY] = useState(n0.getFullYear());
  const [calM, setCalM] = useState(n0.getMonth());
  const [selDay, setSelDay] = useState(today());
  const [aForm, setAForm]  = useState({title:"",date:today(),note:"",tag:"conférence"});

  // — état signaux —
  const [signals,      setSignals]    = useState([]);
  const [sigForm,      setSigForm]    = useState({text:"",tags:[],status:"émergent"});
  const [sigFSt,       setSigFSt]     = useState("tous");
  const [sigFTag,      setSigFTag]    = useState("tous");
  const [confirmId,    setConfirmId]  = useState(null);
  const [confForm,     setConfForm]   = useState({date:today(),note:""});

  // — état experts —
  const [experts,      setExperts]    = useState([]);
  const [exForm,       setExForm]     = useState({name:"",role:"",context:"",domains:[],note:""});
  const [exSearch,     setExSearch]   = useState("");
  const [exFilter,     setExFilter]   = useState("tous");

  const [userDataLoading, setUserDataLoading] = useState(true);

  // — état produire —
  const [prodApiKey,    setProdApiKey]    = useState("");
  const [prodSelItems,  setProdSelItems]  = useState(new Set());
  const [prodTheme,     setProdTheme]     = useState("tous");
  const [prodFormat,    setProdFormat]    = useState("synthèse");
  const [prodNarCount,  setProdNarCount]  = useState("top 10");
  const [prodLoading,   setProdLoading]   = useState(false);
  const [prodResult,    setProdResult]    = useState(null);
  const [prodError,     setProdError]     = useState("");
  const [prodCommItem,  setProdCommItem]  = useState(null);

  const prevIds  = useRef(new Set());
  const toastTmr = useRef(null);

  const showToast = msg => {
    setToast(msg);
    if(toastTmr.current)clearTimeout(toastTmr.current);
    toastTmr.current = setTimeout(()=>setToast(null),4000);
  };

  // — chargement digest —
  const loadDigest = useCallback(()=>{
    setIsRefreshing(true);
    fetch(`${SCRIPT_URL}?t=${Date.now()}`)
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{
        const seen=new Set();
        const deduped=data.filter(i=>{const k=i.url||i.title;if(!k||seen.has(k))return false;seen.add(k);return true;});
        const normalized=deduped.filter(i=>i.title&&cHtml(i.title).trim()).map((item,idx)=>({
          ...item,
          id:String(item.id&&item.id!=="NONE"&&item.id!=="none"?item.id:item.url||item.title||idx),
          title:cHtml(item.title),
          actors:norm(item.actors),keywords:norm(item.keywords),
          innovations:norm(item.innovations),themes:norm(item.themes),
        }));
        const nids=new Set(normalized.map(i=>i.id));
        const added=[...nids].filter(id=>!prevIds.current.has(id)).length;
        prevIds.current=nids;
        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter(i=>i.favorite).map(i=>i.id)));
        setNoteIds(new Set(normalized.filter(i=>i.noteCandidate).map(i=>i.id)));
        const t=new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
        setLastUpdated(t);
        if(added>0)showToast(`+${added} nouvelle${added>1?"s":""} production${added>1?"s":""} éditorialisée${added>1?"s":""}`);
        else if(prevIds.current.size>0)showToast("digest à jour");
      })
      .catch(()=>showToast("erreur de chargement"))
      .finally(()=>setIsRefreshing(false));
  },[]);

  // — chargement données utilisateur —
  const loadUserData = useCallback(async()=>{
    setUserDataLoading(true);
    const [ag,si,ex] = await Promise.all([api.read("Agenda"),api.read("Signaux"),api.read("Experts")]);
    setEvents((ag||[]).map(r=>({...r})));
    setSignals((si||[]).map(r=>({...r,tags:pArr(r.tags)})));
    setExperts((ex||[]).map(r=>({...r,domains:pArr(r.domains),sourceIds:pArr(r.sourceIds),mentions:parseInt(r.mentions)||0})));
    setUserDataLoading(false);
  },[]);

  useEffect(()=>{ loadDigest(); loadUserData(); },[loadDigest,loadUserData]);

  // — fonctions produire (Claude via Apps Script, pas de CORS) —
  async function callClaude(prompt) {
    const r = await fetch(`${SCRIPT_URL}?action=claude&prompt=${encodeURIComponent(prompt)}&t=${Date.now()}`);
    if(!r.ok) throw new Error("erreur serveur");
    const d = await r.json();
    if(d.error) throw new Error(d.error);
    return d.result;
  }

  const prodItems = useMemo(()=>
    items.filter(i=>!dismissed.has(i.id)&&!isEv(i)&&i.title&&i.summary)
      .filter(i=>prodTheme==="tous"||(i.themes||[]).join(";").toLowerCase().includes(prodTheme.toLowerCase()))
  ,[items,dismissed,prodTheme]);

  const prodSelected = useMemo(()=>
    prodSelItems.size>0 ? prodItems.filter(i=>prodSelItems.has(i.id)) : prodItems
  ,[prodItems,prodSelItems]);

  function toggleProdItem(id){
    setProdSelItems(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  }
  function selectAllProd(){ setProdSelItems(new Set(prodItems.map(i=>i.id))); }
  function clearProdSel(){ setProdSelItems(new Set()); }

  async function generateProd(format){
    const sel = prodSelected.slice(0, format==="comm"?1:20);
    if(sel.length===0){setProdError("aucun article sélectionné");return;}
    setProdLoading(true);setProdResult(null);setProdError("");
    try {
      let prompt = "";
      if(format==="synthèse"){
        const list=sel.map((a,i)=>`${i+1}. ${a.title}\nRésumé: ${String(a.summary||"").slice(0,300)}\nThèmes: ${norm(a.themes).join(", ")}`).join("\n\n");
        prompt=`Tu es un analyste de veille pour le département de l'influence du ministère de l'Intérieur français.\n\nProduis une synthèse thématique hebdomadaire structurée à partir de ces ${sel.length} articles de veille. Organise par thèmes, identifie les tendances, les signaux importants et les enjeux pour le ministère. Rédige en français, avec un style éditorial professionnel.\n\nArticles :\n${list}`;
      } else if(format==="narrative"){
        const n = prodNarCount==="top 5"?5:prodNarCount==="top 15"?15:10;
        const top=sel.slice(0,n);
        const list=top.map(a=>`- ${a.title} : ${String(a.summary||"").slice(0,200)}`).join("\n");
        prompt=`Tu es un éditorialiste senior spécialisé dans les affaires intérieures françaises.\n\nRédige une revue de presse narrative de la semaine à partir de ces articles. Raconte l'actualité comme un éditorialiste : un fil conducteur, une mise en perspective, une voix. Pas de liste, pas de titres — du texte continu, vivant, avec du sens.\n\nArticles :\n${list}`;
      } else if(format==="comm"){
        const a=sel[0];
        prompt=`Tu es expert en communication institutionnelle pour le ministère de l'Intérieur français, département de l'influence.\n\nPour cet article de veille, propose 4 formats de production concrets pour faire passer l'information efficacement :\n\nArticle : ${a.title}\nRésumé : ${String(a.summary||"").slice(0,400)}\nAngle d'exploitation : ${a.exploitationAngle||""}\n\nPour chaque format, donne : un titre court (3-4 mots), et une description de 2-3 phrases expliquant le format et son intérêt. Formate ta réponse ainsi :\n\nFORMAT 1 : [titre]\n[description]\n\nFORMAT 2 : [titre]\n[description]\n\netc.`;
      }
      const result = await callClaude(prompt);
      setProdResult({text:result, format, timestamp:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})});
    } catch(e){
      setProdError(e.message);
    }
    setProdLoading(false);
  }

  // — computed digest —
  const allThemes = useMemo(()=>{
    const s=new Set();
    items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).forEach(i=>norm(i.themes).forEach(t=>s.add(t)));
    return["toutes",...Array.from(s).sort((a,b)=>a.localeCompare(b))];
  },[items,dismissed]);

  const visibleItems = useMemo(()=>{
    const q=query.trim().toLowerCase();
    return items.filter(i=>!dismissed.has(i.id))
      .filter(i=>tab==="événements"?isEv(i):!isEv(i))
      .filter(i=>{
        const hay=[i.title,i.summary,i.institution,...(i.themes||[]),...(i.keywords||[])].filter(Boolean).join(" ").toLowerCase();
        return(!q||hay.includes(q))&&(selTheme==="toutes"||(i.themes||[]).includes(selTheme));
      })
      .sort((a,b)=>sortBy==="date"?String(b.date).localeCompare(String(a.date)):sortBy==="title"?String(a.title).localeCompare(String(b.title)):Number(b.relevanceScore||0)-Number(a.relevanceScore||0));
  },[items,dismissed,tab,query,selTheme,sortBy]);

  const selectedItem = selectedId?items.find(i=>i.id===selectedId):null;
  const pubCount  = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).length,[items,dismissed]);
  const evtCount  = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&isEv(i)).length,[items,dismissed]);
  const rss       = useMemo(()=>Array.from(new Set(items.map(i=>i.source).filter(Boolean))),[items]);

  const sbSignals = useMemo(()=>signals.filter(s=>s.status!=="confirmé").sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected)).slice(0,3).map(s=>s.text.slice(0,60)),[signals]);
  const topQuote  = useMemo(()=>{const b=items.find(i=>!dismissed.has(i.id)&&i.exploitationAngle);return b?{text:b.exploitationAngle.slice(0,120),attr:(b.themes||[])[0]||b.source||""}:null;},[items,dismissed]);

  // — computed agenda —
  const upcoming   = useMemo(()=>[...events].filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4),[events]);
  const calDays2   = useMemo(()=>calDays(calY,calM),[calY,calM]);
  const byDay      = useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);
  const dayEvts    = useMemo(()=>(byDay[selDay]||[]).sort((a,b)=>a.date.localeCompare(b.date)),[byDay,selDay]);
  const monthUp    = useMemo(()=>{const p=`${calY}-${String(calM+1).padStart(2,"0")}`;return events.filter(e=>e.date.startsWith(p)&&e.date!==selDay).sort((a,b)=>a.date.localeCompare(b.date));},[events,calY,calM,selDay]);
  const importSug  = useMemo(()=>items.filter(i=>isEv(i)&&!dismissed.has(i.id)&&!events.some(e=>e.importedId===i.id)).slice(0,3),[items,dismissed,events]);

  // — computed signaux —
  const sigSug     = useMemo(()=>items.filter(i=>i.weakSignal&&!signals.some(s=>s.sourceId===i.id)).slice(0,3),[items,signals]);
  const activeSigs = useMemo(()=>signals.filter(s=>s.status!=="confirmé").filter(s=>sigFSt==="tous"||s.status===sigFSt).filter(s=>sigFTag==="tous"||s.tags.includes(sigFTag)).sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected)),[signals,sigFSt,sigFTag]);
  const confSigs   = useMemo(()=>signals.filter(s=>s.status==="confirmé"&&s.dateConfirmed).sort((a,b)=>b.dateConfirmed.localeCompare(a.dateConfirmed)),[signals]);
  const allSigTags = useMemo(()=>{const s=new Set(["tous"]);signals.forEach(g=>g.tags.forEach(t=>s.add(t)));return Array.from(s);},[signals]);

  // — computed experts —
  const exSug = useMemo(()=>{
    const acc=[];
    items.forEach(item=>norm(item.actors).forEach(actor=>{
      if(!actor)return;
      const already=experts.some(e=>e.name.toLowerCase()===actor.toLowerCase());
      if(already)return;
      const ex=acc.find(a=>a.actor.toLowerCase()===actor.toLowerCase());
      if(ex)ex.items.push(item); else acc.push({actor,items:[item]});
    }));
    return acc.slice(0,5);
  },[items,experts]);

  const filteredEx = useMemo(()=>{
    const q=exSearch.trim().toLowerCase();
    return experts
      .filter(e=>exFilter==="tous"||e.domains.includes(exFilter))
      .filter(e=>!q||e.name.toLowerCase().includes(q)||e.role.toLowerCase().includes(q)||e.context.toLowerCase().includes(q))
      .sort((a,b)=>b.mentions-a.mentions);
  },[experts,exFilter,exSearch]);

  // — fonctions agenda —
  const prevM = ()=>{if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);};
  const nextM = ()=>{if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);};
  const selD  = s=>{setSelDay(s);setAForm(f=>({...f,date:s}));};

  const addEvent = async()=>{
    if(!aForm.title.trim()||!aForm.date)return;
    const e={id:Date.now().toString(),...aForm};
    setEvents(p=>[...p,e]);
    setAForm(f=>({...f,title:"",note:""}));
    showToast("événement enregistré");
    await api.add("Agenda",e);
  };
  const delEvent = async id=>{
    setEvents(p=>p.filter(e=>e.id!==id));
    await api.del("Agenda",id);
  };
  const importToAgenda = async item=>{
    let ds=today();
    if(item.date){if(/^\d{4}-\d{2}-\d{2}$/.test(item.date)){ds=item.date;}else{try{const d=new Date(item.date);if(!isNaN(d))ds=tds(d);}catch{}}}
    const e={id:Date.now().toString(),title:item.title,date:ds,note:String(item.summary||"").slice(0,200),tag:"veille",importedId:item.id,source:item.source||"digest"};
    setEvents(p=>[...p,e]);
    setTab("agenda");setSelDay(ds);
    const d=new Date(ds+"T00:00:00");setCalY(d.getFullYear());setCalM(d.getMonth());
    showToast("événement importé dans l'agenda");
    await api.add("Agenda",e);
  };

  // — fonctions signaux —
  const togSigTag = t=>setSigForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}));
  const addSignal = async()=>{
    if(!sigForm.text.trim())return;
    const s={id:Date.now().toString(),text:sigForm.text.trim(),dateDetected:today(),tags:sigForm.tags,status:sigForm.status,dateConfirmed:"",confirmedNote:"",source:"manuel",sourceId:""};
    setSignals(p=>[...p,s]);
    setSigForm({text:"",tags:[],status:"émergent"});
    showToast("signal archivé");
    await api.add("Signaux",{...s,tags:sArr(s.tags)});
  };
  const delSignal = async id=>{setSignals(p=>p.filter(s=>s.id!==id));await api.del("Signaux",id);};
  const importSignal = async item=>{
    const s={id:Date.now().toString(),text:item.weakSignal||item.title,dateDetected:today(),tags:norm(item.themes).slice(0,2),status:"émergent",dateConfirmed:"",confirmedNote:"",source:item.source||"digest",sourceId:item.id};
    setSignals(p=>[...p,s]);
    showToast("signal archivé dans la bibliothèque");
    await api.add("Signaux",{...s,tags:sArr(s.tags)});
  };
  const startConf = id=>{setConfirmId(id);setConfForm({date:today(),note:""});};
  const saveConf  = async()=>{
    const updated=signals.map(s=>s.id===confirmId?{...s,status:"confirmé",dateConfirmed:confForm.date,confirmedNote:confForm.note}:s);
    setSignals(updated);
    const sig=updated.find(s=>s.id===confirmId);
    setConfirmId(null);
    showToast("signal confirmé · ajouté au registre d'anticipation");
    if(sig)await api.update("Signaux",{...sig,tags:sArr(sig.tags)});
  };

  // — fonctions experts —
  const togExDom = d=>setExForm(f=>({...f,domains:f.domains.includes(d)?f.domains.filter(x=>x!==d):[...f.domains,d]}));
  const addExpert = async()=>{
    if(!exForm.name.trim())return;
    const e={id:Date.now().toString(),name:exForm.name.trim(),role:exForm.role.trim(),context:exForm.context.trim(),domains:exForm.domains,dateFirstSeen:today(),dateLastSeen:today(),note:exForm.note.trim(),sourceIds:[],mentions:0};
    setExperts(p=>[...p,e]);
    setExForm({name:"",role:"",context:"",domains:[],note:""});
    showToast("expert référencé");
    await api.add("Experts",{...e,domains:sArr(e.domains),sourceIds:sArr(e.sourceIds)});
  };
  const delExpert = async id=>{setExperts(p=>p.filter(e=>e.id!==id));await api.del("Experts",id);};
  const importExpert = async(actor,item)=>{
    const existing=experts.find(e=>e.name.toLowerCase()===actor.toLowerCase());
    if(existing){
      const updated={...existing,mentions:existing.mentions+1,dateLastSeen:today(),sourceIds:[...existing.sourceIds,item.id]};
      setExperts(p=>p.map(e=>e.id===existing.id?updated:e));
      showToast(`mention ajoutée pour ${actor}`);
      await api.update("Experts",{...updated,domains:sArr(updated.domains),sourceIds:sArr(updated.sourceIds)});
    } else {
      const e={id:Date.now().toString(),name:actor,role:"",context:"identifié dans le digest",domains:norm(item.themes).slice(0,1),dateFirstSeen:today(),dateLastSeen:today(),note:"",sourceIds:[item.id],mentions:1};
      setExperts(p=>[...p,e]);
      showToast(`${actor} référencé`);
      await api.add("Experts",{...e,domains:sArr(e.domains),sourceIds:sArr(e.sourceIds)});
    }
  };

  // — fonctions digest —
  const dismiss   = (id,e)=>{e?.stopPropagation();setDismissed(p=>new Set([...p,id]));if(selectedId===id)setSelectedId(null);};
  const togFav    = (id,e)=>{e?.stopPropagation();setFavoriteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});};
  const togNote   = (id,e)=>{e?.stopPropagation();setNoteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});};

  const todayLong = new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  // ── STYLES COMMUNS ────────────────────────────────────────
  const btn = (active,extra={}) => ({display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"6px 9px",border:"none",borderRadius:2,background:active?C.ink:"transparent",color:active?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left",...extra});
  const inp = (extra={}) => ({width:"100%",fontFamily:sans,fontSize:11,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:6,outline:"none",...extra});
  const pill = (sel) => ({fontSize:10,padding:"2px 7px",borderRadius:2,border:`1px solid ${sel?C.ink:C.border}`,background:sel?C.ink:C.white,color:sel?C.white:C.muted,cursor:"pointer",fontFamily:sans});
  const saveBtn = (extra={}) => ({width:"100%",fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:12,padding:"8px",background:C.ink,color:C.white,border:"none",cursor:"pointer",...extra});

  // ── CARTE DIGEST ──────────────────────────────────────────
  function Card({item}){
    const isFav=favoriteIds.has(item.id),scoreN=Math.round((item.relevanceScore||0)/20)||0;
    return(
      <div onClick={()=>setSelectedId(item.id)} style={{background:C.white,border:`1px solid ${C.border}`,margin:"-0.5px",padding:"14px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",gap:8,transition:"box-shadow .15s"}}
        onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.1)")} onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}>
        <button onClick={e=>dismiss(item.id,e)} style={{position:"absolute",top:8,right:9,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:15,lineHeight:1,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        {item.date&&<div style={{...sc(),fontSize:9}}>{item.date}</div>}
        <div style={{display:"flex",justifyContent:"flex-end"}}><span style={{borderRadius:2,padding:"2px 8px",fontSize:9,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",...sp(item.relevanceScore)}}>pertinence {scoreN}/5</span></div>
        {(item.keywords||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{(item.keywords||[]).slice(0,4).map(k=><span key={k} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 8px",fontSize:10,fontFamily:sans}}>{k}</span>)}</div>}
        <div style={{fontFamily:serif,fontSize:17,lineHeight:1.25,fontWeight:700,color:C.ink}}>{item.title}</div>
        <div style={{height:1,background:C.border}}/>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.65,flex:1,fontFamily:sans}}>{String(item.summary||"").slice(0,155)}{(item.summary||"").length>155?"…":""}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...sc(),fontSize:9}}>{(item.themes||[])[0]||""}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isEv(item)&&<button onClick={e=>{e.stopPropagation();importToAgenda(item);}} style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,color:C.dark,padding:"2px 8px",fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>+ agenda</button>}
            <button onClick={e=>togFav(item.id,e)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.accent,opacity:isFav?1:.35,padding:0}}>{isFav?"★":"☆"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE AGENDA ────────────────────────────────────────────
  function AgendaView(){
    const td=today();
    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"20px 18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,padding:"0 4px"}}>‹</button>
            <span style={{fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink}}>{MONTHS_FR[calM]} {calY}</span>
            <button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,padding:"0 4px"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
            {DAYS_FR.map((d,i)=><div key={i} style={{...sc(),fontSize:9,textAlign:"center",padding:"4px 0"}}>{d}</div>)}
            {calDays2.map((day,i)=>{const isT=day.str===td,iS=day.str===selDay,hEv=!!byDay[day.str]?.length;return<div key={i} onClick={()=>selD(day.str)} style={{fontSize:12,textAlign:"center",padding:"5px 2px",cursor:"pointer",borderRadius:2,fontFamily:sans,userSelect:"none",background:iS?C.ink:isT?C.accent:"transparent",color:(iS||isT)?C.white:day.o?"#cbbfa8":C.text,opacity:day.o&&!iS&&!isT?.5:1,position:"relative"}}>{day.n}{hEv&&!iS&&!isT&&<span style={{display:"block",width:4,height:4,borderRadius:"50%",background:C.accent,margin:"1px auto 0"}}/>}</div>;})}
          </div>
          <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:14}}>
            <div style={{...sc(),marginBottom:10}}>ajouter un événement</div>
            <input value={aForm.title} onChange={e=>setAForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addEvent()} placeholder="titre de l'événement" style={inp()}/>
            <input type="date" value={aForm.date} onChange={e=>setAForm(f=>({...f,date:e.target.value}))} style={inp()}/>
            <input value={aForm.note} onChange={e=>setAForm(f=>({...f,note:e.target.value}))} placeholder="note (optionnel)" style={inp({marginBottom:8})}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>{AGENDA_TAGS.map(t=><button key={t} onClick={()=>setAForm(f=>({...f,tag:t}))} style={pill(aForm.tag===t)}>{t}</button>)}</div>
            <button onClick={addEvent} style={saveBtn()} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ enregistrer l'événement</button>
          </div>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto"}}>
          <div style={{...sc(),marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>{fFR(selDay)} · {dayEvts.length} événement{dayEvts.length!==1?"s":""}</div>
          {dayEvts.length===0?<div style={{padding:"20px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun événement ce jour</div></div>:dayEvts.map(e=><EvCard key={e.id} ev={e}/>)}
          {monthUp.length>0&&<div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}><div style={{...sc(),marginBottom:12}}>à venir ce mois</div>{monthUp.map(e=><EvCard key={e.id} ev={e}/>)}</div>}
          {importSug.length>0&&<div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <div style={{...sc(),marginBottom:12}}>événements détectés dans le digest</div>
            {importSug.map(item=><div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"12px 14px",marginBottom:10}}>
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
  function EvCard({ev}){const ts=AGENDA_TAG_S[ev.tag]||AGENDA_TAG_S["veille"];return<div style={{background:C.white,border:`1px solid ${C.border}`,padding:"12px 14px",marginBottom:10,position:"relative"}}><button onClick={()=>delEvent(ev.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button><span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:2,marginBottom:6,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,...ts}}>{ev.tag}</span><div style={{fontFamily:serif,fontSize:15,lineHeight:1.25,color:C.ink,marginBottom:4}}>{ev.title}</div>{ev.note&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans,marginBottom:4}}>{ev.note}</div>}{ev.date!==selDay&&<div style={{...sc(),fontSize:9,marginTop:4}}>{fsFR(ev.date)}</div>}</div>;}

  // ── VUE SIGNAUX FAIBLES ───────────────────────────────────
  function SignauxView(){
    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"240px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          <div>
            <div style={{...sc(),marginBottom:8}}>statut</div>
            {[["tous",signals.filter(s=>s.status!=="confirmé").length],["émergent",signals.filter(s=>s.status==="émergent").length],["critique",signals.filter(s=>s.status==="critique").length]].map(([v,n])=><button key={v} onClick={()=>setSigFSt(v)} style={btn(sigFSt===v)}><span>{v}</span><span style={{fontSize:10,opacity:.6}}>{n}</span></button>)}
          </div>
          <div>
            <div style={{...sc(),marginBottom:8}}>sujets</div>
            {allSigTags.map(t=><button key={t} onClick={()=>setSigFTag(t)} style={btn(sigFTag===t)}>{t}</button>)}
          </div>
          <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:12}}>
            <div style={{...sc(),marginBottom:8}}>ajouter un signal</div>
            <textarea value={sigForm.text} onChange={e=>setSigForm(f=>({...f,text:e.target.value}))} placeholder="formulation du signal…" rows={3} style={{...inp(),resize:"vertical"}}/>
            <div style={{...sc(),fontSize:9,marginBottom:5}}>sujet</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{SIGNAL_TAGS.map(t=><button key={t} onClick={()=>togSigTag(t)} style={pill(sigForm.tags.includes(t))}>{t}</button>)}</div>
            <div style={{...sc(),fontSize:9,marginBottom:5}}>statut initial</div>
            <div style={{display:"flex",gap:4,marginBottom:8}}>{Object.keys(SIGNAL_ST).map(st=><button key={st} onClick={()=>setSigForm(f=>({...f,status:st}))} style={{...pill(sigForm.status===st),background:sigForm.status===st?SIGNAL_ST[st].bg:C.white,color:sigForm.status===st?SIGNAL_ST[st].color:C.muted,fontWeight:600}}>{st}</button>)}</div>
            <button onClick={addSignal} style={saveBtn()} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ archiver</button>
          </div>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto"}}>
          {sigSug.length>0&&<div style={{marginBottom:20}}>
            <div style={{...sc(),marginBottom:10}}>détectés dans le digest aujourd'hui</div>
            {sigSug.map(item=><div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 12px",marginBottom:8}}>
              <div style={{...sc(),fontSize:9,marginBottom:4}}>signal faible · {(item.themes||[])[0]||"veille"}</div>
              <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.ink,marginBottom:6}}>{item.weakSignal||item.title}</div>
              <button onClick={()=>importSignal(item)} style={{fontFamily:sans,fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ archiver dans la bibliothèque</button>
            </div>)}
          </div>}
          <div style={{...sc(),marginBottom:12}}>bibliothèque · {activeSigs.length} signal{activeSigs.length!==1?"s":""}</div>
          {activeSigs.length===0?<div style={{padding:"30px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun signal dans cette catégorie</div></div>:activeSigs.map(sig=><SigCard key={sig.id} sig={sig}/>)}
          {confSigs.length>0&&<div style={{marginTop:28,paddingTop:20,borderTop:`2px solid ${C.ink}`}}>
            <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:16}}>
              <span style={{fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink}}>registre d'anticipation</span>
              <span style={{...sc(),fontSize:9}}>{confSigs.length} signal{confSigs.length!==1?"s":""} confirmé{confSigs.length!==1?"s":""}</span>
            </div>
            {confSigs.map(sig=><div key={sig.id} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`,alignItems:"flex-start"}}>
              <div style={{flexShrink:0,width:120}}>
                <div style={{...sc(),fontSize:9,color:C.muted}}>détecté</div>
                <div style={{...sc(),fontSize:9,color:C.muted,marginTop:1}}>{fsFR(sig.dateDetected)}</div>
                <div style={{fontSize:11,color:C.accent,fontFamily:sans,margin:"4px 0"}}>↓ {delta(sig.dateDetected,sig.dateConfirmed)} j.</div>
                <div style={{...sc(),fontSize:9,color:"#1f7a45"}}>confirmé</div>
                <div style={{...sc(),fontSize:9,color:"#1f7a45",marginTop:1}}>{fsFR(sig.dateConfirmed)}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.ink,marginBottom:5}}>{sig.text}</div>
                {sig.tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>{sig.tags.map(t=><span key={t} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{t}</span>)}</div>}
                {sig.confirmedNote&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans}}>{sig.confirmedNote}</div>}
              </div>
              <button onClick={()=>delSignal(sig.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0,flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
            </div>)}
          </div>}
        </div>
      </div>
    );
  }
  function SigCard({sig}){
    const ss=SIGNAL_ST[sig.status]||SIGNAL_ST["émergent"];
    const isCf=confirmId===sig.id;
    return<div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:sig.status==="critique"?`3px solid #9a3412`:sig.status==="confirmé"?`3px solid #1f7a45`:`1px solid ${C.border}`,padding:"13px 14px",marginBottom:10,position:"relative"}}>
      <button onClick={()=>delSignal(sig.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,lineHeight:1.4,color:C.ink,flex:1}}>{sig.text}</div><span style={{fontSize:9,padding:"2px 8px",borderRadius:2,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,fontWeight:600,flexShrink:0,...ss}}>{sig.status}</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:isCf?10:0}}>
        <span style={{...sc(),fontSize:9}}>détecté {fsFR(sig.dateDetected)}</span>
        {sig.tags.map(t=><span key={t} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{t}</span>)}
      </div>
      {!isCf&&sig.status!=="confirmé"&&<button onClick={()=>startConf(sig.id)} style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:"none",border:`1px solid #1f7a45`,color:"#1f7a45",cursor:"pointer",fontFamily:sans,marginTop:8}}>marquer comme confirmé →</button>}
      {isCf&&<div style={{marginTop:8,padding:10,background:C.panelSoft,border:`1px solid ${C.border}`}}>
        <div style={{...sc(),marginBottom:6}}>confirmation</div>
        <input type="date" value={confForm.date} onChange={e=>setConfForm(f=>({...f,date:e.target.value}))} style={inp()}/>
        <input value={confForm.note} onChange={e=>setConfForm(f=>({...f,note:e.target.value}))} placeholder="contexte de confirmation (source, date média…)" style={inp({marginBottom:8})}/>
        <div style={{display:"flex",gap:6}}>
          <button onClick={saveConf} style={{flex:1,fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:11,padding:"6px",background:"#1f7a45",color:C.white,border:"none",cursor:"pointer"}}>confirmer</button>
          <button onClick={()=>setConfirmId(null)} style={{padding:"6px 10px",background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontFamily:sans,fontSize:11}}>annuler</button>
        </div>
      </div>}
    </div>;
  }

  // ── VUE EXPERTS ───────────────────────────────────────────
  function ExpertsView(){
    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"240px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          <div>
            <div style={{...sc(),marginBottom:8}}>domaines</div>
            {["tous",...EXPERT_DOMAINS].map(d=><button key={d} onClick={()=>setExFilter(d)} style={btn(exFilter===d)}><span>{d}</span><span style={{fontSize:10,opacity:.6}}>{d==="tous"?experts.length:experts.filter(e=>e.domains.includes(d)).length}</span></button>)}
          </div>
          <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:12}}>
            <div style={{...sc(),marginBottom:8}}>ajouter manuellement</div>
            <input value={exForm.name} onChange={e=>setExForm(f=>({...f,name:e.target.value}))} placeholder="nom et prénom" style={inp()}/>
            <input value={exForm.role} onChange={e=>setExForm(f=>({...f,role:e.target.value}))} placeholder="titre / fonction" style={inp()}/>
            <input value={exForm.context} onChange={e=>setExForm(f=>({...f,context:e.target.value}))} placeholder="lien avec le ministère" style={inp()}/>
            <div style={{...sc(),fontSize:9,marginBottom:5}}>domaine</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{EXPERT_DOMAINS.map(d=><button key={d} onClick={()=>togExDom(d)} style={pill(exForm.domains.includes(d))}>{d}</button>)}</div>
            <input value={exForm.note} onChange={e=>setExForm(f=>({...f,note:e.target.value}))} placeholder="note (optionnel)" style={inp({marginBottom:8})}/>
            <button onClick={addExpert} style={saveBtn()} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ référencer</button>
          </div>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto"}}>
          {exSug.length>0&&<div style={{marginBottom:20}}>
            <div style={{...sc(),marginBottom:10}}>noms détectés dans le digest · à valider</div>
            {exSug.map(({actor,items:its})=><div key={actor} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div>
                <div style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.ink,marginBottom:2}}>{actor}</div>
                <div style={{fontSize:9,color:C.accent,fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>détecté dans {its.length} article{its.length>1?"s":""} · {its[0]?.source||""}</div>
              </div>
              <button onClick={()=>importExpert(actor,its[0])} style={{fontFamily:sans,fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 10px",background:C.ink,color:C.white,border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ référencer</button>
            </div>)}
          </div>}

          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{...sc()}}>annuaire · {filteredEx.length} expert{filteredEx.length!==1?"s":""}</div>
            <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="rechercher…" style={{flex:1,fontFamily:sans,fontSize:12,padding:"5px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,outline:"none"}}/>
          </div>

          {filteredEx.length===0?<div style={{padding:"30px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun expert référencé</div></div>
          :filteredEx.map(ex=><div key={ex.id} style={{background:C.white,border:`1px solid ${C.border}`,padding:"16px",marginBottom:10,position:"relative",display:"flex",gap:14,alignItems:"flex-start"}}>
            <button onClick={()=>delExpert(ex.id)} style={{position:"absolute",top:10,right:12,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
            <div style={{width:42,height:42,borderRadius:2,background:C.dark,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:16,fontWeight:700,flexShrink:0}}>
              {ex.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:2}}>{ex.name}</div>
              {ex.role&&<div style={{fontSize:12,color:C.accent,fontFamily:sans,marginBottom:5}}>{ex.role}</div>}
              {ex.context&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans,marginBottom:7,fontStyle:"italic"}}>{ex.context}</div>}
              {ex.domains.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:7}}>{ex.domains.map(d=><span key={d} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{d}</span>)}</div>}
              {ex.note&&<div style={{fontSize:11,color:C.muted,fontFamily:sans,marginBottom:5}}>{ex.note}</div>}
              <div style={{...sc(),fontSize:9}}>premier signalement {fsFR(ex.dateFirstSeen)}</div>
            </div>
            <div style={{textAlign:"center",flexShrink:0,paddingLeft:8}}>
              <div style={{fontFamily:serif,fontSize:22,fontWeight:700,color:C.ink}}>{ex.mentions}</div>
              <div style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:C.muted,fontFamily:sans}}>mention{ex.mentions!==1?"s":""}</div>
            </div>
          </div>)}
        </div>
      </div>
    );
  }

  // ── VUE PRODUIRE ─────────────────────────────────────────
  function ProduireView() {
    const allThemesList = useMemo(()=>{
      const s=new Set(["tous"]);
      items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).forEach(i=>norm(i.themes).forEach(t=>{if(t)s.add(t);}));
      return Array.from(s);
    },[]);

    const fmtResult = (text) => {
      return text.split("\n").filter(Boolean).map((line,i)=>{
        if(/^FORMAT\s+\d+\s*:/i.test(line)||/^#{1,3}\s/.test(line)){
          return <div key={i} style={{fontFamily:serif,fontSize:15,fontWeight:700,color:C.ink,marginTop:16,marginBottom:4}}>{line.replace(/^#+\s*/,"").replace(/^FORMAT\s+\d+\s*:\s*/i,"")}</div>;
        }
        return <p key={i} style={{fontSize:13,lineHeight:1.8,color:"#3a3020",fontFamily:serif,fontStyle:"italic",marginBottom:8}}>{line}</p>;
      });
    };

    return (
      <div style={{flex:1,padding:"24px 28px",overflowY:"auto",display:"flex",flexDirection:"column",gap:22}}>

{/* Bandeau informatif */}
<div style={{background:"#f0faf4",border:"1px solid #9FE1CB",padding:"12px 18px",display:"flex",gap:10,alignItems:"flex-start"}}>
  <span style={{fontSize:14,color:C.green,flexShrink:0}}>✓</span>
  <div>
    <span style={{fontSize:12,color:"#085041",fontFamily:sans}}>génération propulsée par Claude · via Apps Script · aucune configuration requise</span>
    <div style={{fontSize:11,color:"#085041",fontFamily:sans,marginTop:4,opacity:.8}}>en cas d'erreur réseau, faire <strong>Ctrl+Shift+R</strong> (ou Ctrl+F5) pour forcer le rechargement sans cache.</div>
  </div>
</div>
          {/* Filtre thème */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {allThemesList.slice(0,8).map(t=>(
              <button key={t} onClick={()=>{setProdTheme(t);clearProdSel();}} style={pill(prodTheme===t)}>{t}</button>
            ))}
          </div>

          {/* Liste articles cochables */}
          <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
            {prodItems.length===0
              ?<div style={{...sc(),padding:"20px 0",textAlign:"center"}}>aucun article disponible</div>
              :prodItems.map(item=>{
                const sel=prodSelItems.has(item.id);
                return(
                  <div key={item.id} onClick={()=>toggleProdItem(item.id)}
                    style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",cursor:"pointer",borderRadius:2,background:sel?"#f0faf4":C.panelSoft,border:`1px solid ${sel?"#9FE1CB":C.border}`,transition:"all .15s"}}>
                    <div style={{width:16,height:16,borderRadius:2,border:`1.5px solid ${sel?C.green:C.border}`,background:sel?C.green:"transparent",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {sel&&<span style={{color:C.white,fontSize:10,lineHeight:1}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:serif,fontSize:13,color:C.ink,lineHeight:1.3,marginBottom:2}}>{item.title}</div>
                      <div style={{fontSize:10,color:C.muted,fontFamily:sans}}>{item.source||""}{item.date?` · ${item.date}`:""}</div>
                    </div>
                    <span style={{...sc(),fontSize:9,flexShrink:0}}>{(norm(item.themes)[0]||"").slice(0,15)}</span>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Format 1 Synthèse thématique */}
        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>synthèse thématique hebdomadaire</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Claude analyse les articles sélectionnés et produit une synthèse structurée par thème avec les tendances et signaux importants.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#e1f5ee",color:"#0f6e56",fontFamily:sans,flexShrink:0,marginLeft:12}}>{prodSelected.length} article{prodSelected.length!==1?"s":""}</span>
          </div>
          <button onClick={()=>generateProd("synthèse")} disabled={prodLoading} style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:13,padding:"9px 20px",background:prodLoading?C.muted:C.ink,color:C.white,border:"none",cursor:prodLoading?"default":"pointer",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>{if(!prodLoading)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading)e.currentTarget.style.background=prodLoading?C.muted:C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="synthèse"?"génération en cours…":"générer la synthèse"}
          </button>
          {prodResult?.format==="synthèse"&&<div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
            <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>synthèse générée à {prodResult.timestamp}</div>
            <div>{fmtResult(prodResult.text)}</div>
          </div>}
        </div>

        {/* Format 2 : Revue narrative */}
        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>revue de presse narrative</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Claude raconte la semaine comme un éditorialiste — les faits marquants mis en perspective, avec un fil conducteur.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#eeedfe",color:"#534ab7",fontFamily:sans,flexShrink:0,marginLeft:12}}>ton éditorial</span>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["top 5","top 10","top 15"].map(v=><button key={v} onClick={()=>setProdNarCount(v)} style={pill(prodNarCount===v)}>{v}</button>)}
          </div>
          <button onClick={()=>{setProdFormat("narrative");generateProd("narrative");}} disabled={prodLoading} style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:13,padding:"9px 20px",background:prodLoading?C.muted:C.ink,color:C.white,border:"none",cursor:prodLoading?"default":"pointer",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>{if(!prodLoading)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading)e.currentTarget.style.background=prodLoading?C.muted:C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="narrative"?"génération en cours…":"générer la revue"}
          </button>
          {prodResult?.format==="narrative"&&<div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
            <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>revue générée à {prodResult.timestamp}</div>
            <div>{fmtResult(prodResult.text)}</div>
          </div>}
        </div>

        {/* Format 3 : Fiche angle de communication */}
        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>fiche angle de communication</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Pour un article donné, Claude propose des formats de production concrets pour bien faire passer l'information.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#faeeda",color:"#854f0b",fontFamily:sans,flexShrink:0,marginLeft:12}}>par article</span>
          </div>

          {/* Sélection article unique */}
          <div style={{...sc(),marginBottom:8}}>sélectionner un article</div>
          <div style={{maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,marginBottom:14}}>
            {prodItems.slice(0,15).map(item=>{
              const sel=prodCommItem?.id===item.id;
              return(
                <div key={item.id} onClick={()=>setProdCommItem(item)}
                  style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",cursor:"pointer",borderRadius:2,background:sel?"#fdf3e7":C.panelSoft,border:`1px solid ${sel?"#c8401a":C.border}`,transition:"all .15s"}}>
                  <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${sel?C.accent:C.border}`,background:sel?C.accent:"transparent",flexShrink:0,marginTop:2}}/>
                  <div style={{fontFamily:serif,fontSize:12,color:C.ink,lineHeight:1.3,flex:1}}>{item.title}</div>
                </div>
              );
            })}
          </div>

          {prodCommItem&&<div style={{background:C.panelSoft,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontFamily:serif,fontSize:13,color:C.ink,marginBottom:3}}>{prodCommItem.title}</div>
            <div style={{...sc(),fontSize:9,color:C.accent}}>{prodCommItem.source||""}</div>
          </div>}

          <button onClick={()=>{if(!prodCommItem){setProdError("sélectionnez un article");return;}setProdFormat("comm");generateProd("comm");}} disabled={prodLoading||!prodCommItem}
            style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:13,padding:"9px 20px",background:(!prodCommItem||prodLoading)?C.muted:C.ink,color:C.white,border:"none",cursor:(!prodCommItem||prodLoading)?"default":"pointer",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>{if(!prodLoading&&prodCommItem)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading&&prodCommItem)e.currentTarget.style.background=C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="comm"?"génération en cours…":"générer la fiche"}
          </button>
          {prodResult?.format==="comm"&&<div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
            <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>fiche générée à {prodResult.timestamp}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {prodResult.text.split(/\n\n+/).filter(Boolean).filter(b=>b.trim()).map((block,i)=>{
                const lines=block.split("\n").filter(Boolean);
                const title=lines[0].replace(/^FORMAT\s+\d+\s*:\s*/i,"").replace(/^#+\s*/,"");
                const body=lines.slice(1).join(" ");
                return(
                  <div key={i} style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                    <div style={{...sc(),fontSize:9,color:C.accent,marginBottom:6}}>{title}</div>
                    <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.ink,lineHeight:1.55}}>{body}</div>
                  </div>
                );
              })}
            </div>
          </div>}
        </div>

        {prodError&&<div style={{background:"#fce4de",border:"1px solid #e8b0a0",padding:"10px 16px",fontSize:12,color:"#8a2010",fontFamily:sans}}>{prodError}</div>}
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────
  return(
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
            <span style={{display:"inline-block",borderRadius:2,padding:"3px 9px",fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:14,...sp(selectedItem.relevanceScore)}}>pertinence {Math.round((selectedItem.relevanceScore||0)/20)||0}/5</span>
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
              <button onClick={()=>togFav(selectedItem.id)} style={{border:`1px solid ${C.ink}`,background:C.ink,color:C.white,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>{favoriteIds.has(selectedItem.id)?"retirer des favoris":"ajouter aux favoris"}</button>
              <button onClick={()=>togNote(selectedItem.id)} style={{border:`1px solid ${C.border}`,background:C.white,color:C.text,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>{noteIds.has(selectedItem.id)?"retirer de la note":"préparer une note"}</button>
              {isEv(selectedItem)&&<button onClick={()=>{importToAgenda(selectedItem);setSelectedId(null);}} style={{border:`1px solid ${C.border}`,background:C.white,color:C.dark,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>+ agenda</button>}
              {selectedItem.weakSignal&&<button onClick={()=>{importSignal(selectedItem);setSelectedId(null);}} style={{border:`1px solid ${C.border}`,background:C.white,color:C.dark,padding:"9px 16px",cursor:"pointer",fontSize:12,fontFamily:sans}}>+ signal faible</button>}
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
              <div style={{fontSize:10,color:"#7a7060",marginTop:2,letterSpacing:".06em"}}>{pubCount} production{pubCount!==1?"s":""} · {evtCount} événement{evtCount!==1?"s":""} · {rss.length} source{rss.length!==1?"s":""}</div>
            </div>

            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>thèmes</div>
              {allThemes.map(t=><button key={t} onClick={()=>setSelTheme(t)} style={btn(selTheme===t)}><span>{t}</span><span style={{fontSize:10,opacity:.55}}>{t==="toutes"?items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).length:items.filter(i=>!dismissed.has(i.id)&&(i.themes||[]).includes(t)).length}</span></button>)}
            </div>

            {upcoming.length>0&&<div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>prochains événements</div>
              {upcoming.map(ev=>{const ts=AGENDA_TAG_S[ev.tag]||AGENDA_TAG_S["veille"];return<div key={ev.id} onClick={()=>{setTab("agenda");setSelDay(ev.date);const d=new Date(ev.date+"T00:00:00");setCalY(d.getFullYear());setCalM(d.getMonth());}} style={{marginBottom:9,cursor:"pointer",paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:C.accent,marginBottom:2,fontFamily:sans}}>{fsFR(ev.date)}</div>
                <div style={{fontFamily:serif,fontSize:13,lineHeight:1.3,color:C.ink,marginBottom:3}}>{ev.title}</div>
                <span style={{display:"inline-block",fontSize:9,padding:"1px 6px",borderRadius:2,fontFamily:sans,...ts}}>{ev.tag}</span>
              </div>;})}
            </div>}

            {sbSignals.length>0&&<div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>signaux faibles</div>
              {sbSignals.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}><span style={{width:16,height:1,background:C.accent,flexShrink:0,marginTop:8}}/><span style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.5,color:C.text}}>{s}</span></div>)}
            </div>}

            {topQuote&&<div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`}}>
              <div style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.6,color:C.ink}}>« {topQuote.text} »</div>
              {topQuote.attr&&<div style={{...sc(),fontSize:9,marginTop:6}}>angle · {topQuote.attr}</div>}
            </div>}

            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>trier par</div>
              {[["relevance","pertinence"],["date","date"],["title","titre"]].map(([v,l])=><button key={v} onClick={()=>setSortBy(v)} style={btn(sortBy===v,{justifyContent:"flex-start"})}>{l}</button>)}
            </div>

            <div style={{padding:"12px 22px",marginTop:"auto"}}>
              {[["productions",items.filter(i=>!dismissed.has(i.id)).length],["favoris",favoriteIds.size],["agenda",events.length],["signaux actifs",signals.filter(s=>s.status!=="confirmé").length],["signaux confirmés",confSigs.length],["experts",experts.length]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11,fontFamily:sans}}>
                  <span style={{color:C.muted}}>{l}</span>
                  <span style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink}}>{userDataLoading&&l!=="productions"&&l!=="favoris"?"…":v}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main style={{background:C.panelSoft,display:"flex",flexDirection:"column"}}>
            <div style={{borderBottom:`3px double ${C.ink}`,padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div>
                <div style={{...sc(),color:C.dark,fontSize:12}}>digest éditorial · {todayLong}</div>
                {lastUpdated&&<div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.muted,marginTop:2}}>{pubCount} productions éditorialisées · mis à jour à {lastUpdated}</div>}
              </div>
              <button onClick={loadDigest} disabled={isRefreshing} style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:14,padding:"10px 22px",background:isRefreshing?C.muted:C.ink,color:C.white,border:"none",cursor:isRefreshing?"default":"pointer",display:"flex",alignItems:"center",gap:10,flexShrink:0,transition:"background .15s"}}
                onMouseEnter={e=>{if(!isRefreshing)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!isRefreshing)e.currentTarget.style.background=C.ink;}}>
                <span style={{fontSize:18,lineHeight:1}}>↻</span>{isRefreshing?"actualisation…":"actualiser le digest"}
              </button>
            </div>

            <div style={{display:"flex",alignItems:"center",borderBottom:`1px solid ${C.border}`,padding:"0 22px"}}>
              {[["productions",pubCount],["événements",evtCount],["agenda",events.length],["signaux faibles",signals.filter(s=>s.status!=="confirmé").length],["experts",experts.length],["produire",""]].map(([key,count])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:"10px 11px",background:"none",border:"none",borderBottom:tab===key?`2px solid ${C.ink}`:"2px solid transparent",marginBottom:-1,color:tab===key?C.ink:C.muted,cursor:"pointer",fontSize:12,letterSpacing:".08em",textTransform:"uppercase",fontFamily:sans,fontWeight:tab===key?500:400,display:"flex",alignItems:"center",gap:6}}>
                  {key}{count!==""&&<span style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"1px 6px",fontSize:10,textTransform:"none",letterSpacing:0,fontWeight:400}}>{count}</span>}
                </button>
              ))}
              {tab!=="agenda"&&tab!=="signaux faibles"&&tab!=="experts"&&tab!=="produire"&&<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="rechercher dans le digest…" style={{marginLeft:"auto",border:"none",background:"transparent",outline:"none",color:C.accent,fontSize:12,fontFamily:serif,fontStyle:"italic",padding:"10px 0",width:190}}/>}
            </div>

            {tab==="agenda"?"":tab==="signaux faibles"?"":tab==="experts"?"":tab==="produire"?"":null}
            {tab==="agenda" ? <AgendaView/>
            :tab==="signaux faibles" ? <SignauxView/>
            :tab==="experts" ? <ExpertsView/>
            :tab==="produire" ? <ProduireView/>
            :(
              <>
                <div style={{flex:1,padding:"20px 22px",overflowY:"auto"}}>
                  {items.length===0?<div style={{textAlign:"center",padding:60,...sc()}}>chargement en cours…</div>
                  :visibleItems.length===0?<div style={{textAlign:"center",padding:60,...sc()}}>aucune production correspondante</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:0}}>{visibleItems.map(item=><Card key={item.id} item={item}/>)}</div>}
                </div>
                <div style={{borderTop:`3px double ${C.ink}`,display:"grid",gridTemplateColumns:"repeat(4, 1fr)",textAlign:"center",padding:"12px 10px",background:C.panel}}>
                  {[[items.filter(i=>!dismissed.has(i.id)).length,"productions"],[favoriteIds.size,"favoris"],[rss.length,"sources"],[noteIds.size,"en note"]].map(([n,l])=><div key={l}><div style={{fontFamily:serif,fontSize:22,color:C.ink}}>{n}</div><div style={{...sc(),fontSize:9}}>{l}</div></div>)}
                </div>
              </>
            )}
          </main>
        </div>

        {noteIds.size>0&&!["agenda","signaux faibles","experts","produire"].includes(tab)&&(
          <div style={{marginTop:18,background:C.panelSoft,border:`1px solid ${C.border}`,padding:22}}>
            <div style={{...sc(),marginBottom:14}}>préparer une note — {noteIds.size} article{noteIds.size>1?"s":""}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:12}}>
              {items.filter(i=>noteIds.has(i.id)).map(item=><div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,padding:16}}>
                <span style={{display:"inline-block",borderRadius:2,padding:"3px 8px",fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8,...sp(item.relevanceScore)}}>pertinence {Math.round((item.relevanceScore||0)/20)||0}/5</span>
                <div style={{fontFamily:serif,fontSize:16,lineHeight:1.2,marginBottom:8}}>{item.title}</div>
                <div style={{fontSize:12,lineHeight:1.7,color:C.muted,marginBottom:8,fontFamily:sans}}>{String(item.summary||"").slice(0,200)}…</div>
                {item.exploitationAngle&&<div style={{fontSize:12,color:C.accent,lineHeight:1.7,fontFamily:sans}}><strong>angle :</strong> {item.exploitationAngle}</div>}
              </div>)}
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
        textarea{resize:vertical;font-family:inherit;}
      `}</style>
    </div>
  );
}
