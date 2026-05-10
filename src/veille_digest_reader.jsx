import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
const C = {
  page:"#f2efe8",
  panel:"#e7e0d0",
  panelSoft:"#ede7d8",
  border:"#cbbfa8",
  text:"#1e293b",
  muted:"#7a6f5c",
  accent:"#8a4b22",
  dark:"#2b2a24",
  ink:"#18180f",
  white:"#fffdf8",
  chip:"#e8e0d0",
  chipText:"#4f4638",
  green:"#1f7a45",
  noteBg:"#dbeafe",
  noteText:"#1d4ed8",
};
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', Inter, ui-sans-serif, sans-serif";

const AGENDA_TAGS  = ["conférence","séminaire","échéance","veille"];
const AGENDA_TAG_S = {
  "conférence":{bg:"#e1f5ee",color:"#0f6e56"},
  "séminaire": {bg:"#eeedfe",color:"#534ab7"},
  "échéance":  {bg:"#faeeda",color:"#854f0b"},
  "veille":    {bg:"#e8e0d0",color:"#4f4638"},
};
const MONTHS_FR    = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FR      = ["L","M","M","J","V","S","D"];
const SIGNAL_TAGS  = ["IA & algorithmes","désinformation","sécurité intérieure","numérique","opinion publique","autre"];
const SIGNAL_ST    = {
  "émergent":{bg:"#faeeda",color:"#854f0b"},
  "confirmé":{bg:"#dcefdc",color:"#1f7a45"},
  "critique":{bg:"#f2e2da",color:"#9a3412"},
};
const EXPERT_DOMAINS = ["sécurité publique","renseignement","numérique","communication","juridique","autre"];

// ── CALENDRIER 2026 ───────────────────────────────────────
// Événements fixes — fenêtres d'opportunité pour le travail d'influence.
// Codés directement, visibles par tous les utilisateurs, non modifiables.
const CALENDRIER_2026 = [
  // AVRIL
  {id:"c001",title:"PJL constitutionnel relatif à la Nouvelle-Calédonie",date:"2026-04-03",type:"législatif"},
  {id:"c002",title:"Journée mondiale de la santé",date:"2026-04-07",type:"journée"},
  {id:"c003",title:"PPL Gouvernance claire, juste et solidaire pour la gestion des milieux aquatiques et prévention des inondations",date:"2026-04-07",type:"législatif"},
  {id:"c004",title:"PPL visant à mettre fin au devoir conjugal",date:"2026-04-09",type:"législatif"},
  {id:"c005",title:"PJL organique relatif au renforcement des juridictions criminelles",date:"2026-04-13",type:"législatif"},
  {id:"c006",title:"PJL sur la justice criminelle et le respect des victimes",date:"2026-04-13",type:"législatif"},
  {id:"c007",title:"Journée de la créativité et de l'innovation",date:"2026-04-21",type:"journée"},
  {id:"c008",title:"Journée de la terre",date:"2026-04-22",type:"journée"},
  {id:"c009",title:"Journée de la santé et de la sécurité au travail",date:"2026-04-28",type:"journée"},
  {id:"c010",title:"Foire de Paris & concours Lépine",date:"2026-04-30",type:"culturel"},
  // DATES À VENIR
  {id:"c011",title:"PPL visant à garantir le droit de visite des parlementaires et des bâtonniers dans les lieux de privation de liberté",date:null,type:"législatif"},
  {id:"c012",title:"PPL visant à lutter contre l'exploitation sexuelle en ligne",date:null,type:"législatif"},
  {id:"c013",title:"Proposition de résolution visant à renforcer la lutte contre la contrefaçon, vecteur de criminalité organisée et de blanchiment d'argent",date:null,type:"législatif"},
  {id:"c014",title:"PJL relatif à l'extension des prérogatives, des moyens, de l'organisation et du contrôle des polices municipales et des gardes champêtres",date:null,type:"législatif"},
  {id:"c015",title:"PJL relatif à la restitution de biens culturels provenant d'État qui, du fait d'une appropriation illicite, en ont été privés",date:null,type:"législatif"},
  {id:"c016",title:"PJL relatif à la lutte contre les fraudes sociales et fiscales",date:null,type:"législatif"},
  {id:"c017",title:"PJL relatif à la résilience des infrastructures critiques et au renforcement de la cybersécurité",date:null,type:"législatif"},
  // MAI
  {id:"c018",title:"Fête du travail",date:"2026-05-01",type:"commémoration"},
  {id:"c019",title:"Journée mondiale du rire",date:"2026-05-03",type:"journée"},
  {id:"c020",title:"PPL visant à lutter contre l'entrisme islamique en France",date:"2026-05-05",type:"législatif"},
  {id:"c021",title:"PPL améliorant la protection des personnes ciblées par les réseaux de criminalité organisée",date:"2026-05-07",type:"législatif"},
  {id:"c022",title:"Commémorations Armistice 1945",date:"2026-05-08",type:"commémoration"},
  {id:"c023",title:"Journée de l'Europe",date:"2026-05-09",type:"journée"},
  {id:"c024",title:"Sommet franco-africain à Nairobi (Africa Forward)",date:"2026-05-11",type:"institutionnel"},
  {id:"c025",title:"Ouverture du Festival de Cannes",date:"2026-05-12",type:"culturel"},
  {id:"c026",title:"Finale de l'Eurovision",date:"2026-05-16",type:"culturel"},
  {id:"c027",title:"Journée internationale de lutte contre l'homophobie",date:"2026-05-17",type:"journée"},
  {id:"c028",title:"PJL visant à offrir des réponses immédiates aux phénomènes troublant l'ordre public (RIPOST)",date:"2026-05-18",type:"législatif"},
  {id:"c029",title:"Journée mondiale de la biodiversité",date:"2026-05-22",type:"journée"},
  {id:"c030",title:"Nuit des musées",date:"2026-05-23",type:"culturel"},
  {id:"c031",title:"Début de Roland Garros",date:"2026-05-24",type:"culturel"},
  {id:"c032",title:"Fête des voisins",date:"2026-05-29",type:"culturel"},
  {id:"c033",title:"Finale Ligue des Champions",date:"2026-05-30",type:"culturel"},
  {id:"c034",title:"Fête des mères",date:"2026-05-31",type:"commémoration"},
  {id:"c035",title:"Journée mondiale sans tabac",date:"2026-05-31",type:"journée"},
  {id:"c036",title:"90e anniversaire des grandes grèves de 1936",date:"2026-05-01",type:"commémoration"},
  // JUIN
  {id:"c037",title:"Début du mois des Fiertés",date:"2026-06-01",type:"culturel"},
  {id:"c038",title:"Nomination d'un nouveau Défenseur des droits",date:"2026-06-01",type:"institutionnel"},
  {id:"c039",title:"Salon des maires de France",date:"2026-06-02",type:"institutionnel"},
  {id:"c040",title:"Journée mondiale du vélo et de la course à pied",date:"2026-06-03",type:"journée"},
  {id:"c041",title:"Journée mondiale de l'environnement",date:"2026-06-05",type:"journée"},
  {id:"c042",title:"Nuit Blanche",date:"2026-06-06",type:"culturel"},
  {id:"c043",title:"Journée mondiale des Océans",date:"2026-06-08",type:"journée"},
  {id:"c044",title:"24H du Mans",date:"2026-06-10",type:"culturel"},
  {id:"c045",title:"Journée mondiale du bien-être",date:"2026-06-11",type:"journée"},
  {id:"c046",title:"Ouverture de la coupe du monde de football",date:"2026-06-11",type:"culturel"},
  {id:"c047",title:"Journée mondiale des donneurs de sang",date:"2026-06-14",type:"journée"},
  {id:"c048",title:"Début du baccalauréat",date:"2026-06-15",type:"institutionnel"},
  {id:"c049",title:"G7 à Evian",date:"2026-06-15",type:"institutionnel"},
  {id:"c050",title:"Salon VivaTech",date:"2026-06-17",type:"institutionnel"},
  {id:"c051",title:"Fête des pères",date:"2026-06-21",type:"commémoration"},
  {id:"c052",title:"Fête de la musique",date:"2026-06-21",type:"culturel"},
  {id:"c053",title:"Panthéonisation de Marc Bloch",date:"2026-06-23",type:"commémoration"},
  {id:"c054",title:"Soldes d'été",date:"2026-06-24",type:"culturel"},
  {id:"c055",title:"Meeting de Paris (athlétisme)",date:"2026-06-26",type:"culturel"},
  {id:"c056",title:"Festival Solidays",date:"2026-06-26",type:"culturel"},
  {id:"c057",title:"Marche des fiertés",date:"2026-06-27",type:"culturel"},
  // JUILLET
  {id:"c058",title:"Festival Calvi on the Rocks",date:"2026-07-02",type:"culturel"},
  {id:"c059",title:"Indépendance américaine - 250 ans",date:"2026-07-04",type:"commémoration"},
  {id:"c060",title:"Paris Plage",date:"2026-07-04",type:"culturel"},
  {id:"c061",title:"Départ du Tour de France",date:"2026-07-04",type:"culturel"},
  {id:"c062",title:"Festival d'Avignon",date:"2026-07-04",type:"culturel"},
  {id:"c063",title:"Rencontres de la photographie à Arles",date:"2026-07-06",type:"culturel"},
  {id:"c064",title:"Japan Expo à Paris",date:"2026-07-09",type:"culturel"},
  {id:"c065",title:"10 ans de la catastrophe Seveso",date:"2026-07-10",type:"commémoration"},
  {id:"c066",title:"Cérémonie en souvenir d'Alfred Dreyfus",date:"2026-07-12",type:"commémoration"},
  {id:"c067",title:"Fête nationale",date:"2026-07-14",type:"commémoration"},
  {id:"c068",title:"10 ans des attentats de Nice",date:"2026-07-14",type:"commémoration"},
  {id:"c069",title:"10 ans de la mort d'Adama Traoré",date:"2026-07-19",type:"commémoration"},
  {id:"c070",title:"Anniversaire 2 ans de la cérémonie d'ouverture JOP 2024",date:"2026-07-26",type:"commémoration"},
  {id:"c071",title:"Championnats d'Europe de natation",date:"2026-07-31",type:"culturel"},
  // AOÛT
  {id:"c072",title:"Journée du chat",date:"2026-08-08",type:"journée"},
  {id:"c073",title:"Eclipse totale du soleil",date:"2026-08-12",type:"culturel"},
  {id:"c074",title:"Journée du chien",date:"2026-08-26",type:"journée"},
  {id:"c075",title:"Rock en Seine",date:"2026-08-26",type:"culturel"},
  // SEPTEMBRE
  {id:"c076",title:"Festival du cinéma américain à Deauville",date:"2026-09-04",type:"culturel"},
  {id:"c077",title:"Grande braderie de Lille",date:"2026-09-05",type:"culturel"},
  {id:"c078",title:"Journée mondiale de la prévention du suicide",date:"2026-09-10",type:"journée"},
  {id:"c079",title:"Fête de l'Huma",date:"2026-09-11",type:"culturel"},
  {id:"c080",title:"25 ans de l'attentat du World Trade Center",date:"2026-09-11",type:"commémoration"},
  {id:"c081",title:"Journée mondiale des premiers secours",date:"2026-09-12",type:"journée"},
  {id:"c082",title:"Journées européennes du patrimoine",date:"2026-09-19",type:"culturel"},
  {id:"c083",title:"25e anniversaire explosion AZF",date:"2026-09-21",type:"commémoration"},
  {id:"c084",title:"Elections sénatoriales",date:"2026-09-27",type:"institutionnel"},
  // OCTOBRE
  {id:"c085",title:"Début Octobre rose",date:"2026-10-01",type:"journée"},
  {id:"c086",title:"Journée internationale des personnes âgées",date:"2026-10-01",type:"journée"},
  {id:"c087",title:"Journée mondiale des animaux",date:"2026-10-04",type:"journée"},
  {id:"c088",title:"Journée nationale des aveugles et malvoyants",date:"2026-10-04",type:"journée"},
  {id:"c089",title:"Journée mondiale du handicap",date:"2026-10-09",type:"journée"},
  {id:"c090",title:"Journée mondiale de la santé mentale",date:"2026-10-10",type:"journée"},
  {id:"c091",title:"Mondial de l'auto",date:"2026-10-12",type:"culturel"},
  {id:"c092",title:"Journée mondiale de la vue",date:"2026-10-12",type:"journée"},
  {id:"c093",title:"Journée nationale des toxicomanies",date:"2026-10-15",type:"journée"},
  {id:"c094",title:"Paris Games Week",date:"2026-10-21",type:"culturel"},
  {id:"c095",title:"Art Basel Paris",date:"2026-10-23",type:"culturel"},
  {id:"c096",title:"Salon du chocolat",date:"2026-10-28",type:"culturel"},
  {id:"c097",title:"Halloween",date:"2026-10-31",type:"culturel"},
  {id:"c098",title:"Rolex Paris Masters",date:"2026-10-31",type:"culturel"},
  {id:"c099",title:"108e Congrès des maires",date:"2026-11-01",type:"institutionnel"},
  // NOVEMBRE
  {id:"c100",title:"Départ de la Route du Rhum à Saint Malo",date:"2026-11-01",type:"culturel"},
  {id:"c101",title:"Journée de la gentillesse",date:"2026-11-03",type:"journée"},
  {id:"c102",title:"Elections des mid-terms USA",date:"2026-11-03",type:"institutionnel"},
  {id:"c103",title:"Journée nationale de lutte contre le harcèlement scolaire",date:"2026-11-05",type:"journée"},
  {id:"c104",title:"Armistice 1918",date:"2026-11-11",type:"commémoration"},
  {id:"c105",title:"Salon du Made in France",date:"2026-11-12",type:"institutionnel"},
  {id:"c106",title:"Sommet de la francophonie",date:"2026-11-15",type:"institutionnel"},
  {id:"c107",title:"Beaujolais nouveau",date:"2026-11-19",type:"culturel"},
  {id:"c108",title:"Black Friday",date:"2026-11-27",type:"culturel"},
  // DÉCEMBRE
  {id:"c109",title:"Journée mondiale de lutte contre le SIDA",date:"2026-12-01",type:"journée"},
  {id:"c110",title:"Journée internationale des personnes handicapées",date:"2026-12-03",type:"journée"},
  {id:"c111",title:"Fête des Lumières à Lyon",date:"2026-12-05",type:"culturel"},
  {id:"c112",title:"Journée mondiale du bénévolat",date:"2026-12-05",type:"journée"},
  {id:"c113",title:"40e anniversaire de la mort de Malik Oussekine",date:"2026-12-06",type:"commémoration"},
  {id:"c114",title:"Journée mondiale du climat",date:"2026-12-08",type:"journée"},
  {id:"c115",title:"Journées des droits de l'homme",date:"2026-12-10",type:"journée"},
];

const CAL_TYPE_S = {
  "législatif":   {bg:"#e8effe",color:"#3730a3"},
  "journée":      {bg:"#e1f5ee",color:"#0f6e56"},
  "commémoration":{bg:"#f2e2da",color:"#9a3412"},
  "culturel":     {bg:"#faeeda",color:"#854f0b"},
  "institutionnel":{bg:"#ece7dc",color:"#4f4638"},
};

const sc    = (x={}) => ({fontSize:11,letterSpacing:".14em",textTransform:"uppercase",color:C.muted,fontFamily:sans,...x});
const sp    = s => { const n=Number(s||0); if(n>=85)return{background:"#dcefdc",color:"#1f7a45"}; if(n>=70)return{background:"#f9e7c8",color:"#a16207"}; if(n>=50)return{background:"#f2e2da",color:"#9a3412"}; return{background:"#ece7dc",color:"#6b7280"}; };
const pArr  = v => { if(Array.isArray(v))return v; if(!v)return []; return String(v).split(";").map(s=>s.trim()).filter(Boolean); };
const sArr  = a => Array.isArray(a)?a.join(";"):(a||"");
const norm  = v => Array.isArray(v)?v:pArr(v);
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

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0EXVm6kKCqWh3Zy1xMiMqDBmUAUqKpVfsmx5QE2iSUvqCpj-Rs-8Bs5izhF-Td88oEA/exec";

const api = {
  read:   async (sheet) => { try{ const r=await fetch(`${SCRIPT_URL}?action=read&sheet=${sheet}&t=${Date.now()}`); return r.ok?await r.json():[];}catch{return[];} },
  add:    async (sheet,data) => { try{ await fetch(`${SCRIPT_URL}?action=add&sheet=${sheet}&payload=${encodeURIComponent(JSON.stringify(data))}&t=${Date.now()}`);}catch{} },
  update: async (sheet,data) => { try{ await fetch(`${SCRIPT_URL}?action=update&sheet=${sheet}&payload=${encodeURIComponent(JSON.stringify(data))}&t=${Date.now()}`);}catch{} },
  del:    async (sheet,id)   => { try{ await fetch(`${SCRIPT_URL}?action=delete&sheet=${sheet}&id=${id}&t=${Date.now()}`);}catch{} },
};

export default function VeilleDigestReader() {

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

  const [events,  setEvents]  = useState([]);
  const n0 = new Date();
  const [calY,   setCalY]   = useState(n0.getFullYear());
  const [calM,   setCalM]   = useState(n0.getMonth());
  const [selDay, setSelDay] = useState(today());
  const [aForm,  setAForm]  = useState({title:"",date:today(),note:"",tag:"conférence"});

  const [signals,   setSignals]   = useState([]);
  const [sigForm,   setSigForm]   = useState({text:"",tags:[],status:"émergent"});
  const [sigFSt,    setSigFSt]    = useState("tous");
  const [sigFTag,   setSigFTag]   = useState("tous");
  const [confirmId, setConfirmId] = useState(null);
  const [confForm,  setConfForm]  = useState({date:today(),note:""});

  const [experts,  setExperts]  = useState([]);
  const [exForm,   setExForm]   = useState({name:"",role:"",context:"",domains:[],note:""});
  const [exSearch, setExSearch] = useState("");
  const [exFilter, setExFilter] = useState("tous");

  const [userDataLoading, setUserDataLoading] = useState(true);

  const [prodSelItems, setProdSelItems] = useState(new Set());
  const [prodTheme,    setProdTheme]    = useState("tous");
  const [prodFormat,   setProdFormat]   = useState("synthèse");
  const [prodNarCount, setProdNarCount] = useState("top 10");
  const [prodLoading,  setProdLoading]  = useState(false);
  const [prodResult,   setProdResult]   = useState(null);
  const [prodError,    setProdError]    = useState("");
  const [prodCommItem, setProdCommItem] = useState(null);

  const [pvSelectedForPV, setPvSelectedForPV] = useState(new Set());
const [graphSelectedIds, setGraphSelectedIds] = useState(new Set());
  // ── DOSSIERS / CAPITALISATION ─────────────────────────────
// folders = liste des dossiers créés
// folderItems = articles conservés dans chaque dossier
// hiddenFromMain = articles masqués du flux principal mais conservés ailleurs
// folderDraftName = champ de création rapide d’un dossier
const [folders, setFolders] = useState([]);
const [folderItems, setFolderItems] = useState({});
const [hiddenFromMain, setHiddenFromMain] = useState(new Set());
const [folderDraftName, setFolderDraftName] = useState("");
const [pvWordColor,     setPvWordColor]     = useState("#18180f");
  const [pvDirectAssign,  setPvDirectAssign]  = useState({});
  const [pvAssignedTop,   setPvAssignedTop]   = useState({s1:[],s2:[],s3:[],s4:[]});
  const [pvExternalsTop,  setPvExternalsTop]  = useState({s1:[],s2:[],s3:[],s4:[]});

  const prevIds  = useRef(new Set());
  const toastTmr = useRef(null);

  const showToast = msg => {
    setToast(msg);
    if(toastTmr.current) clearTimeout(toastTmr.current);
    toastTmr.current = setTimeout(()=>setToast(null), 4000);
  };

  // ── NETTOYAGE DES DONNÉES À LA SOURCE ──────────────────────
const pick = (item, keys, fallback = "") => {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== "") {
      return item[key];
    }
  }
  return fallback;
};

// ── NETTOYAGE DES DONNÉES À LA SOURCE ──────────────────────
const cleanItem = item => ({
  ...item,

  id: String(pick(item, ["id", "ID", "Id", "url", "URL", "title", "Titre"], Math.random())),
  title: String(pick(item, ["title", "Titre", "titre"], "")),
  summary: String(pick(item, ["summary", "Résumé", "resume", "résumé", "outputSummary"], "")),
  source: String(pick(item, ["source", "Source"], "")),
  date: String(pick(item, ["date", "Date", "Date de publication du document"], "")),
  url: String(pick(item, ["url", "URL", "Lien"], "")),

  component: String(pick(item, ["component", "Composante", "composante"], "")),
  institution: String(pick(item, ["institution", "Institution émettrice", "institution_normalisée"], "")),
  documentType: String(pick(item, ["documentType", "Type de document", "Type de source"], "")),

  actors: norm(pick(item, [
    "actors",
    "Acteurs cités",
    "Acteurs mentionnés",
    "acteurs_cités_normalisés",
    "acteurs"
  ], "")),

  keywords: norm(pick(item, [
    "keywords",
    "Concepts clés",
    "Concepts - clés",
    "Concepts-clés",
    "Concepts",
    "concepts_normalisés",
    "concepts"
  ], "")),

  themes: norm(pick(item, [
    "themes",
    "Thèmes",
    "Thèmes normalisés",
    "thèmes_normalisés",
    "themes_normalisés"
  ], "")),

  innovations: norm(pick(item, [
    "innovations",
    "Innovations technologiques",
    "Innovation technologique",
    "innovation_technologique_normalisée",
    "lien techno"
  ], "")),

  relevanceScore: Number(pick(item, ["relevanceScore", "stratégie de pertinence / score", "score", "pertinence"], 0)),
  weakSignal: String(pick(item, ["weakSignal", "Signal faible", "Signal faible ?", "signal_faible_normalisé"], "")),
  exploitationAngle: String(pick(item, ["exploitationAngle", "Angle d’exploitation", "Angle d'exploitation"], "")),
  strategicImpact: String(pick(item, ["strategicImpact", "Impact stratégique estimé (1-3)"], "")),
});

  const cleanEvent = r => ({
    id:    String(r.id||Date.now()),
    title: String(r.title||""),
    date:  String(r.date||""),
    note:  String(r.note||""),
    tag:   String(r.tag||"veille"),
    importedId: String(r.importedId||""),
    source:     String(r.source||""),
  });

  const cleanSignal = r => ({
    id:            String(r.id||Date.now()),
    text:          String(r.text||""),
    dateDetected:  String(r.dateDetected||""),
    dateConfirmed: String(r.dateConfirmed||""),
    confirmedNote: String(r.confirmedNote||""),
    status:        String(r.status||"émergent"),
    source:        String(r.source||""),
    sourceId:      String(r.sourceId||""),
    tags:          pArr(r.tags),
  });

  const cleanExpert = r => ({
    id:           String(r.id||Date.now()),
    name:         String(r.name||""),
    role:         String(r.role||""),
    context:      String(r.context||""),
    note:         String(r.note||""),
    dateFirstSeen:String(r.dateFirstSeen||""),
    dateLastSeen: String(r.dateLastSeen||""),
    domains:      pArr(r.domains),
    sourceIds:    pArr(r.sourceIds),
    mentions:     parseInt(r.mentions)||0,
  });

  const loadDigest = useCallback(()=>{
    setIsRefreshing(true);
    fetch(`${SCRIPT_URL}?t=${Date.now()}`)
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{
        const seen=new Set();
        const deduped=data.filter(i=>{const k=i.url||i.title;if(!k||seen.has(k))return false;seen.add(k);return true;});
        const normalized=deduped
          .filter(i=>i.title&&cHtml(i.title).trim())
          .map((item,idx)=>cleanItem({
            ...item,
            id:item.id&&item.id!=="NONE"&&item.id!=="none"?item.id:item.url||item.title||idx,
            title:cHtml(item.title),
          }));
        const nids=new Set(normalized.map(i=>i.id));
        const added=[...nids].filter(id=>!prevIds.current.has(id)).length;
        prevIds.current=nids;
        setItems(normalized);
        setFavoriteIds(new Set(normalized.filter(i=>i.favorite).map(i=>i.id)));
        setNoteIds(new Set(normalized.filter(i=>i.noteCandidate).map(i=>i.id)));
        const t=new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
        setLastUpdated(t);
        if(added>0) showToast(`+${added} nouvelle${added>1?"s":""} production${added>1?"s":""} éditorialisée${added>1?"s":""}`);
        else if(prevIds.current.size>0) showToast("digest à jour");
      })
      .catch(()=>showToast("erreur de chargement"))
      .finally(()=>setIsRefreshing(false));
  },[]);

  const loadUserData = useCallback(async()=>{
    setUserDataLoading(true);
    const [ag,si,ex] = await Promise.all([api.read("Agenda"),api.read("Signaux"),api.read("Experts")]);
    setEvents((ag||[]).filter(r=>r&&r.id).map(cleanEvent));
    setSignals((si||[]).filter(r=>r&&r.id).map(cleanSignal));
    setExperts((ex||[]).filter(r=>r&&r.id).map(cleanExpert));
    setUserDataLoading(false);
  },[]);

  useEffect(()=>{ loadDigest(); loadUserData(); },[loadDigest,loadUserData]);

  async function callClaude(prompt) {
    const r = await fetch(SCRIPT_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body:JSON.stringify({action:"claude",prompt}),
    });
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

  function toggleProdItem(id){ setProdSelItems(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;}); }
  function selectAllProd(){ setProdSelItems(new Set(prodItems.map(i=>i.id))); }
  function clearProdSel(){ setProdSelItems(new Set()); }

  async function generateProd(format){
    const sel=prodSelected.slice(0,format==="comm"?1:20);
    if(sel.length===0){setProdError("aucun article sélectionné");return;}
    setProdLoading(true);setProdResult(null);setProdError("");

    const td=today();
    const upcoming30=CALENDRIER_2026
      .filter(e=>e.date&&e.date>=td&&e.date<=`${td.slice(0,7)}-31`)
      .sort((a,b)=>a.date.localeCompare(b.date))
      .slice(0,8)
      .map(e=>`- ${fsFR(e.date)} : ${e.title} (${e.type})`)
      .join("\n");
    const calContext=upcoming30?`\nFenêtres d'opportunité à venir :\n${upcoming30}\n`:"";

    try {
      let prompt="";
      if(format==="synthèse"){
        const list=sel.map((a,i)=>`${i+1}. ${a.title}\nRésumé: ${String(a.summary||"").slice(0,300)}\nThèmes: ${norm(a.themes).join(", ")}`).join("\n\n");
        prompt=`Tu es un analyste de veille pour le département de l'influence du ministère de l'Intérieur français.\n${calContext}\nProduis une synthèse thématique hebdomadaire structurée à partir de ces ${sel.length} articles de veille. Organise par thèmes, identifie les tendances, les signaux importants et les enjeux pour le ministère. Si des fenêtres d'opportunité sont mentionnées ci-dessus, indique comment les articles peuvent être mobilisés à ces occasions. Rédige en français, avec un style éditorial professionnel.\n\nArticles :\n${list}`;
      } else if(format==="narrative"){
        const n=prodNarCount==="top 5"?5:prodNarCount==="top 15"?15:10;
        const list=sel.slice(0,n).map(a=>`- ${a.title} : ${String(a.summary||"").slice(0,200)}`).join("\n");
        prompt=`Tu es un éditorialiste senior spécialisé dans les affaires intérieures françaises.\n${calContext}\nRédige une revue de presse narrative de la semaine à partir de ces articles. Raconte l'actualité comme un éditorialiste : un fil conducteur, une mise en perspective, une voix. Si des fenêtres d'opportunité sont proches, intègre-les naturellement dans le récit. Pas de liste, pas de titres — du texte continu, vivant, avec du sens.\n\nArticles :\n${list}`;
      } else if(format==="comm"){
        const a=sel[0];
        prompt=`Tu es expert en communication institutionnelle pour le ministère de l'Intérieur français, département de l'influence.\n${calContext}\nPour cet article de veille, propose 4 formats de production concrets pour faire passer l'information efficacement. Si des fenêtres d'opportunité sont proches, propose des formats qui s'appuient sur ces échéances.\n\nArticle : ${a.title}\nRésumé : ${String(a.summary||"").slice(0,400)}\nAngle d'exploitation : ${a.exploitationAngle||""}\n\nPour chaque format, donne un titre court (3-4 mots) et une description de 2-3 phrases. Formate ainsi :\n\nFORMAT 1 - [titre]\n[description]\n\nFORMAT 2 - [titre]\n[description]\n\netc.`;
      }
      const result=await callClaude(prompt);
      setProdResult({text:result,format,timestamp:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})});
    } catch(e){ setProdError(e.message); }
    setProdLoading(false);
  }

  const allThemes = useMemo(()=>{
    const s=new Set();
    items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).forEach(i=>norm(i.themes).forEach(t=>s.add(t)));
    return["toutes",...Array.from(s).sort((a,b)=>a.localeCompare(b))];
  },[items,dismissed]);

  const visibleItems = useMemo(()=>{
  const q=query.trim().toLowerCase();
  return items
    .filter(i=>!dismissed.has(i.id))
    .filter(i=>!hiddenFromMain.has(i.id))
      .filter(i=>tab==="événements"?isEv(i):!isEv(i))
      .filter(i=>{
        const hay=[i.title,i.summary,i.institution,...(i.themes||[]),...(i.keywords||[])].filter(Boolean).join(" ").toLowerCase();
        return(!q||hay.includes(q))&&(selTheme==="toutes"||(i.themes||[]).includes(selTheme));
      })
      .sort((a,b)=>sortBy==="date"?String(b.date).localeCompare(String(a.date)):sortBy==="title"?String(a.title).localeCompare(String(b.title)):Number(b.relevanceScore||0)-Number(a.relevanceScore||0));
},[items,dismissed,hiddenFromMain,tab,query,selTheme,sortBy]);

  const selectedItem = selectedId?items.find(i=>i.id===selectedId):null;
  const pubCount   = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).length,[items,dismissed]);
  const evtCount   = useMemo(()=>items.filter(i=>!dismissed.has(i.id)&&isEv(i)).length,[items,dismissed]);
  const rss        = useMemo(()=>Array.from(new Set(items.map(i=>i.source).filter(Boolean))),[items]);
  const sbSignals  = useMemo(()=>signals.filter(s=>s.status!=="confirmé").sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected)).slice(0,3).map(s=>s.text.slice(0,60)),[signals]);
  const topQuote   = useMemo(()=>{const b=items.find(i=>!dismissed.has(i.id)&&i.exploitationAngle);return b?{text:b.exploitationAngle.slice(0,120),attr:(b.themes||[])[0]||b.source||""}:null;},[items,dismissed]);
  const upcoming   = useMemo(()=>[...events].filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4),[events]);
  const calDays2   = useMemo(()=>calDays(calY,calM),[calY,calM]);
  const byDay      = useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);
  const dayEvts    = useMemo(()=>(byDay[selDay]||[]).sort((a,b)=>a.date.localeCompare(b.date)),[byDay,selDay]);
  const monthUp    = useMemo(()=>{const p=`${calY}-${String(calM+1).padStart(2,"0")}`;return events.filter(e=>e.date&&e.date.startsWith(p)&&e.date!==selDay).sort((a,b)=>a.date.localeCompare(b.date));},[events,calY,calM,selDay]);
  const importSug  = useMemo(()=>items.filter(i=>isEv(i)&&!dismissed.has(i.id)&&!events.some(e=>e.importedId===i.id)).slice(0,3),[items,dismissed,events]);
  const sigSug     = useMemo(()=>items.filter(i=>i.weakSignal&&!signals.some(s=>s.sourceId===i.id)).slice(0,3),[items,signals]);
  const activeSigs = useMemo(()=>signals.filter(s=>s.status!=="confirmé").filter(s=>sigFSt==="tous"||s.status===sigFSt).filter(s=>sigFTag==="tous"||s.tags.includes(sigFTag)).sort((a,b)=>b.dateDetected.localeCompare(a.dateDetected)),[signals,sigFSt,sigFTag]);
  const confSigs   = useMemo(()=>signals.filter(s=>s.status==="confirmé"&&s.dateConfirmed).sort((a,b)=>b.dateConfirmed.localeCompare(a.dateConfirmed)),[signals]);
  const allSigTags = useMemo(()=>{const s=new Set(["tous"]);signals.forEach(g=>g.tags.forEach(t=>s.add(t)));return Array.from(s);},[signals]);
  const exSug      = useMemo(()=>{
    const acc=[];
    items.forEach(item=>norm(item.actors).forEach(actor=>{
      if(!actor)return;
      const already=experts.some(e=>(e.name||"").toLowerCase()===(actor||"").toLowerCase());
      if(already)return;
      const ex=acc.find(a=>(a.actor||"").toLowerCase()===(actor||"").toLowerCase());
      if(ex)ex.items.push(item); else acc.push({actor,items:[item]});
    }));
    return acc.slice(0,5);
  },[items,experts]);
  const filteredEx = useMemo(()=>{
    const q=exSearch.trim().toLowerCase();
    return experts.filter(e=>exFilter==="tous"||e.domains.includes(exFilter)).filter(e=>!q||(e.name||"").toLowerCase().includes(q)||(e.role||"").toLowerCase().includes(q)).sort((a,b)=>b.mentions-a.mentions);
  },[experts,exFilter,exSearch]);

  const prevM = ()=>{if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);};
  const nextM = ()=>{if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);};
  const selD  = s=>{setSelDay(s);setAForm(f=>({...f,date:s}));};

  const addEvent = async()=>{
    if(!aForm.title.trim()||!aForm.date)return;
    const e={id:Date.now().toString(),...aForm};
    setEvents(p=>[...p,e]);setAForm(f=>({...f,title:"",note:""}));
    showToast("événement enregistré");await api.add("Agenda",e);
  };
  const delEvent = async id=>{setEvents(p=>p.filter(e=>e.id!==id));await api.del("Agenda",id);};
  const importToAgenda = async item=>{
    let ds=today();
    if(item.date){if(/^\d{4}-\d{2}-\d{2}$/.test(item.date)){ds=item.date;}else{try{const d=new Date(item.date);if(!isNaN(d))ds=tds(d);}catch{}}}
    const e={id:Date.now().toString(),title:item.title,date:ds,note:String(item.summary||"").slice(0,200),tag:"veille",importedId:item.id,source:item.source||"digest"};
    setEvents(p=>[...p,e]);setTab("agenda");setSelDay(ds);
    const d=new Date(ds+"T00:00:00");setCalY(d.getFullYear());setCalM(d.getMonth());
    showToast("événement importé dans l'agenda");await api.add("Agenda",e);
  };

  const togSigTag = t=>setSigForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}));
  const addSignal = async()=>{
    if(!sigForm.text.trim())return;
    const s={id:Date.now().toString(),text:sigForm.text.trim(),dateDetected:today(),tags:sigForm.tags,status:sigForm.status,dateConfirmed:"",confirmedNote:"",source:"manuel",sourceId:""};
    setSignals(p=>[...p,s]);setSigForm({text:"",tags:[],status:"émergent"});
    showToast("signal archivé");await api.add("Signaux",{...s,tags:sArr(s.tags)});
  };
  const delSignal = async id=>{setSignals(p=>p.filter(s=>s.id!==id));await api.del("Signaux",id);};
  const importSignal = async item=>{
    const s={id:Date.now().toString(),text:item.weakSignal||item.title,dateDetected:today(),tags:norm(item.themes).slice(0,2),status:"émergent",dateConfirmed:"",confirmedNote:"",source:item.source||"digest",sourceId:item.id};
    setSignals(p=>[...p,s]);showToast("signal archivé dans la bibliothèque");
    await api.add("Signaux",{...s,tags:sArr(s.tags)});
  };
  const startConf = id=>{setConfirmId(id);setConfForm({date:today(),note:""});};
  const saveConf  = async()=>{
    const updated=signals.map(s=>s.id===confirmId?{...s,status:"confirmé",dateConfirmed:confForm.date,confirmedNote:confForm.note}:s);
    setSignals(updated);const sig=updated.find(s=>s.id===confirmId);setConfirmId(null);
    showToast("signal confirmé · ajouté au registre d'anticipation");
    if(sig)await api.update("Signaux",{...sig,tags:sArr(sig.tags)});
  };

  const togExDom  = d=>setExForm(f=>({...f,domains:f.domains.includes(d)?f.domains.filter(x=>x!==d):[...f.domains,d]}));
  const addExpert = async()=>{
    if(!exForm.name.trim())return;
    const e={id:Date.now().toString(),name:exForm.name.trim(),role:exForm.role.trim(),context:exForm.context.trim(),domains:exForm.domains,dateFirstSeen:today(),dateLastSeen:today(),note:exForm.note.trim(),sourceIds:[],mentions:0};
    setExperts(p=>[...p,e]);setExForm({name:"",role:"",context:"",domains:[],note:""});
    showToast("expert référencé");await api.add("Experts",{...e,domains:sArr(e.domains),sourceIds:sArr(e.sourceIds)});
  };
  const delExpert = async id=>{setExperts(p=>p.filter(e=>e.id!==id));await api.del("Experts",id);};
  const importExpert = async(actor,item)=>{
    const existing=experts.find(e=>(e.name||"").toLowerCase()===(actor||"").toLowerCase());
    if(existing){
      const updated={...existing,mentions:existing.mentions+1,dateLastSeen:today(),sourceIds:[...existing.sourceIds,item.id]};
      setExperts(p=>p.map(e=>e.id===existing.id?updated:e));
      showToast(`mention ajoutée pour ${actor}`);
      await api.update("Experts",{...updated,domains:sArr(updated.domains),sourceIds:sArr(updated.sourceIds)});
    } else {
      const e={id:Date.now().toString(),name:actor,role:"",context:"identifié dans le digest",domains:norm(item.themes).slice(0,1),dateFirstSeen:today(),dateLastSeen:today(),note:"",sourceIds:[item.id],mentions:1};
      setExperts(p=>[...p,e]);showToast(`${actor} référencé`);
      await api.add("Experts",{...e,domains:sArr(e.domains),sourceIds:sArr(e.sourceIds)});
    }
  };

  const dismiss = (id,e)=>{e?.stopPropagation();setDismissed(p=>new Set([...p,id]));if(selectedId===id)setSelectedId(null);};
  const togFav  = (id,e)=>{e?.stopPropagation();setFavoriteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});};
  const togNote = (id,e)=>{e?.stopPropagation();setNoteIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});};
  function createFolder() {
  const name = folderDraftName.trim();
  if (!name) return;

  const id = `folder_${Date.now()}`;

  setFolders(prev => [
    ...prev,
    { id, name, createdAt: today() }
  ]);

  setFolderItems(prev => ({
    ...prev,
    [id]: []
  }));

  setFolderDraftName("");
  showToast(`Dossier créé : ${name}`);
}

function addItemToFolder(itemId, folderId) {
  setFolderItems(prev => {
    const current = prev[folderId] || [];

    if (current.includes(itemId)) return prev;

    return {
      ...prev,
      [folderId]: [...current, itemId]
    };
  });

  showToast("Article ajouté au dossier");
}

function hideFromMain(itemId) {
  setHiddenFromMain(prev => new Set([...prev, itemId]));

  if (selectedId === itemId) setSelectedId(null);

  showToast("Article masqué du flux principal");
}

function removeItemFromFolder(itemId, folderId) {
  setFolderItems(prev => ({
    ...prev,
    [folderId]: (prev[folderId] || []).filter(id => id !== itemId)
  }));

  showToast("Article retiré du dossier");
}

function restoreToMain(itemId) {
  setHiddenFromMain(prev => {
    const n = new Set(prev);
    n.delete(itemId);
    return n;
  });

  showToast("Article réaffiché dans le flux principal");
}

  const todayLong = new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const btn     = (active,extra={}) => ({display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"6px 9px",border:"none",borderRadius:2,background:active?C.ink:"transparent",color:active?C.white:C.text,cursor:"pointer",fontSize:12,fontFamily:sans,marginBottom:2,textAlign:"left",...extra});
  const inp     = (extra={}) => ({width:"100%",fontFamily:sans,fontSize:11,padding:"6px 8px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,marginBottom:6,outline:"none",...extra});
  const pill    = (sel) => ({fontSize:10,padding:"2px 7px",borderRadius:2,border:`1px solid ${sel?C.ink:C.border}`,background:sel?C.ink:C.white,color:sel?C.white:C.muted,cursor:"pointer",fontFamily:sans});
  const saveBtn = (extra={}) => ({width:"100%",fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:12,padding:"8px",background:C.ink,color:C.white,border:"none",cursor:"pointer",...extra});
  const genBtn  = (loading,disabled) => ({fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:13,padding:"9px 20px",background:(loading||disabled)?C.muted:C.ink,color:C.white,border:"none",cursor:(loading||disabled)?"default":"pointer",display:"flex",alignItems:"center",gap:8});

  const PV_SECTIONS_LABELS = [{id:"s1",label:"Actionnable"},{id:"s2",label:"Possiblement à préparer"},{id:"s3",label:"Centre de documentation"},{id:"s4",label:"Actualité de l'ATE"}];

 function Card({item}){
  const isFav=favoriteIds.has(item.id),scoreN=Math.round((item.relevanceScore||0)/20)||0;

  const isSelPV = pvSelectedForPV.has(item.id);
  const isSelGraph = graphSelectedIds.has(item.id);

  const togPV = (e) => {
    e.stopPropagation();
    setPvSelectedForPV(p => {
      const n = new Set(p);
      n.has(item.id) ? n.delete(item.id) : n.add(item.id);
      return n;
    });
  };

  const togGraph = (e) => {
    e.stopPropagation();
    setGraphSelectedIds(p => {
      const n = new Set(p);
      n.has(item.id) ? n.delete(item.id) : n.add(item.id);
      return n;
    });
  };
    const assignDirect=(e,secId)=>{
      e.stopPropagation();
      setPvSelectedForPV(p=>{const n=new Set(p);n.add(item.id);return n;});
      // Assignation directe dans pvAssignedTop
      setPvAssignedTop(prev=>{
        const next={...prev};
        Object.keys(next).forEach(k=>{next[k]=next[k].filter(x=>x!==item.id);});
        if(next[secId]) next[secId]=[...next[secId],item.id];
        return next;
      });
      setPvDirectAssign(p=>({...p,[item.id]:secId}));
      showToast(`Article assigné à "${PV_SECTIONS_LABELS.find(s=>s.id===secId)?.label}"`);
    };
    return(
      <div onClick={()=>setSelectedId(item.id)} style={{background:isSelPV?"#fdf5f0":C.white,border:`1px solid ${isSelPV?C.accent:C.border}`,borderWidth:isSelPV?"2px":"1px",margin:"-0.5px",padding:"14px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",gap:8,transition:"box-shadow .15s"}}
        onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.1)")} onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}>
        <button onClick={e=>dismiss(item.id,e)} style={{position:"absolute",top:8,right:9,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:15,lineHeight:1,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
  <div onClick={togPV} style={{width:16,height:16,borderRadius:2,border:`1.5px solid ${isSelPV?C.accent:C.border}`,background:isSelPV?C.accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}} title="Sélectionner pour le Point Veille">
    {isSelPV&&<span style={{color:C.white,fontSize:10,lineHeight:1,fontWeight:700}}>✓</span>}
  </div>

  <div onClick={togGraph} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",border:`1px solid ${isSelGraph?C.green:C.border}`,background:isSelGraph?"#f0faf4":C.white,color:isSelGraph?C.green:C.muted,borderRadius:2,cursor:"pointer",fontSize:9,fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase",flexShrink:0}} title="Sélectionner pour le graphe">
    <span style={{width:12,height:12,borderRadius:2,border:`1.3px solid ${isSelGraph?C.green:C.border}`,background:isSelGraph?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:8,lineHeight:1}}>
      {isSelGraph ? "✓" : ""}
    </span>
    Graphe
  </div>

  {item.date&&<div style={{...sc(),fontSize:9}}>{item.date}</div>}
          <div style={{marginLeft:"auto"}}><span style={{borderRadius:2,padding:"2px 8px",fontSize:9,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",...sp(item.relevanceScore)}}>pertinence {scoreN}/5</span></div>
        </div>
        {(item.keywords||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{(item.keywords||[]).slice(0,4).map(k=><span key={k} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 8px",fontSize:10,fontFamily:sans}}>{k}</span>)}</div>}
        <div style={{fontFamily:serif,fontSize:17,lineHeight:1.25,fontWeight:700,color:C.ink}}>{item.title}</div>
        <div style={{height:1,background:C.border}}/>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.65,flex:1,fontFamily:sans}}>{String(item.summary||"").slice(0,155)}{(item.summary||"").length>155?"…":""}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
          <span style={{...sc(),fontSize:9}}>{(item.themes||[])[0]||""}</span>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:3}} onClick={e=>e.stopPropagation()}>
              {PV_SECTIONS_LABELS.map(s=>(
                <button key={s.id} onClick={e=>assignDirect(e,s.id)}
                  style={{fontSize:8,padding:"2px 6px",border:`1px solid ${pvDirectAssign[item.id]===s.id?C.accent:C.border}`,background:pvDirectAssign[item.id]===s.id?C.accent:C.white,color:pvDirectAssign[item.id]===s.id?C.white:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans,letterSpacing:".04em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                  {s.id.replace("s","")}·{s.label.slice(0,4)}
                </button>
              ))}
            </div>
            {isEv(item)&&<button onClick={e=>{e.stopPropagation();importToAgenda(item);}} style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,color:C.dark,padding:"2px 8px",fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>+ agenda</button>}
            <button onClick={e=>togFav(item.id,e)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.accent,opacity:isFav?1:.35,padding:0}}>{isFav?"★":"☆"}</button>
          </div>
        </div>
      </div>
    );
  }

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
            {calDays2.map((day,i)=>{
              const isT=day.str===td,iS=day.str===selDay,hEv=!!byDay[day.str]?.length;
              return(
                <div key={i} onClick={()=>selD(day.str)} style={{fontSize:12,textAlign:"center",padding:"5px 2px",cursor:"pointer",borderRadius:2,fontFamily:sans,userSelect:"none",background:iS?C.ink:isT?C.accent:"transparent",color:(iS||isT)?C.white:day.o?"#cbbfa8":C.text,opacity:day.o&&!iS&&!isT?.5:1,position:"relative"}}>
                  {day.n}
                  {hEv&&!iS&&!isT&&<span style={{display:"block",width:4,height:4,borderRadius:"50%",background:C.accent,margin:"1px auto 0"}}/>}
                </div>
              );
            })}
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
          {dayEvts.length===0
            ?<div style={{padding:"20px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun événement ce jour</div></div>
            :dayEvts.map(e=><EvCard key={e.id} ev={e}/>)
          }
          {monthUp.length>0&&(
            <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:12}}>à venir ce mois</div>
              {monthUp.map(e=><EvCard key={e.id} ev={e}/>)}
            </div>
          )}
          {(()=>{
            const p=`${calY}-${String(calM+1).padStart(2,"0")}`;
            const calMonth=CALENDRIER_2026.filter(e=>e.date&&e.date.startsWith(p)).sort((a,b)=>a.date.localeCompare(b.date));
            const calSansDates=CALENDRIER_2026.filter(e=>!e.date);
            return calMonth.length>0||calSansDates.length>0?(
              <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{...sc()}}>opportunités ce mois</div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:2,background:"#e8effe",color:"#3730a3",fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>calendrier 2026</span>
                </div>
                {calMonth.map(ev=><CalCard key={ev.id} ev={ev}/>)}
                {calSansDates.length>0&&calM===new Date().getMonth()&&calY===new Date().getFullYear()&&(
                  <div style={{marginTop:12}}>
                    <div style={{...sc(),fontSize:9,marginBottom:8}}>dates à confirmer</div>
                    {calSansDates.map(ev=><CalCard key={ev.id} ev={ev}/>)}
                  </div>
                )}
              </div>
            ):null;
          })()}
          {importSug.length>0&&(
            <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:12}}>événements détectés dans le digest</div>
              {importSug.map(item=>(
                <div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"12px 14px",marginBottom:10}}>
                  <div style={{...sc(),fontSize:9,marginBottom:5}}>depuis le digest{item.date?` · ${item.date}`:""}</div>
                  <div style={{fontFamily:serif,fontSize:14,color:C.ink,marginBottom:6}}>{item.title}</div>
                  {item.summary&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:8,fontFamily:sans}}>{String(item.summary).slice(0,120)}…</div>}
                  <button onClick={()=>importToAgenda(item)} style={{fontFamily:sans,fontSize:10,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 12px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ ajouter à l'agenda</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function EvCard({ev}){
    const ts=AGENDA_TAG_S[ev.tag]||AGENDA_TAG_S["veille"];
    return(
      <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"12px 14px",marginBottom:10,position:"relative"}}>
        <button onClick={()=>delEvent(ev.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        <span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:2,marginBottom:6,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,...ts}}>{ev.tag}</span>
        <div style={{fontFamily:serif,fontSize:15,lineHeight:1.25,color:C.ink,marginBottom:4}}>{ev.title}</div>
        {ev.note&&<div style={{fontSize:11,color:C.muted,lineHeight:1.6,fontFamily:sans,marginBottom:4}}>{ev.note}</div>}
        {ev.date!==selDay&&<div style={{...sc(),fontSize:9,marginTop:4}}>{fsFR(ev.date)}</div>}
      </div>
    );
  }

  function CalCard({ev}){
    const ts=CAL_TYPE_S[ev.type]||CAL_TYPE_S["institutionnel"];
    return(
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${ts.color}`,padding:"10px 14px",marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{fontFamily:serif,fontSize:14,color:C.ink,lineHeight:1.3,flex:1}}>{ev.title}</div>
          <span style={{fontSize:9,padding:"2px 7px",borderRadius:2,fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase",flexShrink:0,...ts}}>{ev.type}</span>
        </div>
        {ev.date&&<div style={{...sc(),fontSize:9,marginTop:4,color:ts.color}}>{fsFR(ev.date)}</div>}
        {!ev.date&&<div style={{...sc(),fontSize:9,marginTop:4,color:C.muted}}>date à confirmer</div>}
      </div>
    );
  }

  function SignauxView(){
    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"240px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          <div>
            <div style={{...sc(),marginBottom:8}}>statut</div>
            {[["tous",signals.filter(s=>s.status!=="confirmé").length],["émergent",signals.filter(s=>s.status==="émergent").length],["critique",signals.filter(s=>s.status==="critique").length]].map(([v,n])=>(
              <button key={v} onClick={()=>setSigFSt(v)} style={btn(sigFSt===v)}><span>{v}</span><span style={{fontSize:10,opacity:.6}}>{n}</span></button>
            ))}
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
          {sigSug.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{...sc(),marginBottom:10}}>détectés dans le digest aujourd'hui</div>
              {sigSug.map(item=>(
                <div key={item.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 12px",marginBottom:8}}>
                  <div style={{...sc(),fontSize:9,marginBottom:4}}>signal faible · {(item.themes||[])[0]||"veille"}</div>
                  <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.ink,marginBottom:6}}>{item.weakSignal||item.title}</div>
                  <button onClick={()=>importSignal(item)} style={{fontFamily:sans,fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:C.ink,color:C.white,border:"none",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ archiver dans la bibliothèque</button>
                </div>
              ))}
            </div>
          )}
          <div style={{...sc(),marginBottom:12}}>bibliothèque · {activeSigs.length} signal{activeSigs.length!==1?"s":""}</div>
          {activeSigs.length===0
            ?<div style={{padding:"30px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun signal dans cette catégorie</div></div>
            :activeSigs.map(sig=><SigCard key={sig.id} sig={sig}/>)
          }
          {confSigs.length>0&&(
            <div style={{marginTop:28,paddingTop:20,borderTop:`2px solid ${C.ink}`}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:16}}>
                <span style={{fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink}}>registre d'anticipation</span>
                <span style={{...sc(),fontSize:9}}>{confSigs.length} signal{confSigs.length!==1?"s":""} confirmé{confSigs.length!==1?"s":""}</span>
              </div>
              {confSigs.map(sig=>(
                <div key={sig.id} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`,alignItems:"flex-start"}}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function SigCard({sig}){
    const ss=SIGNAL_ST[sig.status]||SIGNAL_ST["émergent"];
    const isCf=confirmId===sig.id;
    return(
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:sig.status==="critique"?`3px solid #9a3412`:sig.status==="confirmé"?`3px solid #1f7a45`:`1px solid ${C.border}`,padding:"13px 14px",marginBottom:10,position:"relative"}}>
        <button onClick={()=>delSignal(sig.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
          <div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,lineHeight:1.4,color:C.ink,flex:1}}>{sig.text}</div>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:2,letterSpacing:".06em",textTransform:"uppercase",fontFamily:sans,fontWeight:600,flexShrink:0,...ss}}>{sig.status}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:isCf?10:0}}>
          <span style={{...sc(),fontSize:9}}>détecté {fsFR(sig.dateDetected)}</span>
          {sig.tags.map(t=><span key={t} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"2px 7px",fontSize:10,fontFamily:sans}}>{t}</span>)}
        </div>
        {!isCf&&sig.status!=="confirmé"&&(
          <button onClick={()=>startConf(sig.id)} style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",background:"none",border:`1px solid #1f7a45`,color:"#1f7a45",cursor:"pointer",fontFamily:sans,marginTop:8}}>marquer comme confirmé →</button>
        )}
        {isCf&&(
          <div style={{marginTop:8,padding:10,background:C.panelSoft,border:`1px solid ${C.border}`}}>
            <div style={{...sc(),marginBottom:6}}>confirmation</div>
            <input type="date" value={confForm.date} onChange={e=>setConfForm(f=>({...f,date:e.target.value}))} style={inp()}/>
            <input value={confForm.note} onChange={e=>setConfForm(f=>({...f,note:e.target.value}))} placeholder="contexte de confirmation (source, date média…)" style={inp({marginBottom:8})}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={saveConf} style={{flex:1,fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:11,padding:"6px",background:"#1f7a45",color:C.white,border:"none",cursor:"pointer"}}>confirmer</button>
              <button onClick={()=>setConfirmId(null)} style={{padding:"6px 10px",background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontFamily:sans,fontSize:11}}>annuler</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ExpertsView(){
    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"240px 1fr",minHeight:0}}>
        <div style={{borderRight:`1px solid ${C.border}`,padding:"18px",background:C.white,display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>
          <div>
            <div style={{...sc(),marginBottom:8}}>domaines</div>
            {["tous",...EXPERT_DOMAINS].map(d=>(
              <button key={d} onClick={()=>setExFilter(d)} style={btn(exFilter===d)}>
                <span>{d}</span>
                <span style={{fontSize:10,opacity:.6}}>{d==="tous"?experts.length:experts.filter(e=>e.domains.includes(d)).length}</span>
              </button>
            ))}
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
          {exSug.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{...sc(),marginBottom:10}}>noms détectés dans le digest · à valider</div>
              {exSug.map(({actor,items:its})=>(
                <div key={actor} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div>
                    <div style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.ink,marginBottom:2}}>{actor}</div>
                    <div style={{fontSize:9,color:C.accent,fontFamily:sans,letterSpacing:".06em",textTransform:"uppercase"}}>détecté dans {its.length} article{its.length>1?"s":""} · {its[0]?.source||""}</div>
                  </div>
                  <button onClick={()=>importExpert(actor,its[0])} style={{fontFamily:sans,fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 10px",background:C.ink,color:C.white,border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.background=C.accent)} onMouseLeave={e=>(e.currentTarget.style.background=C.ink)}>+ référencer</button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{...sc()}}>annuaire · {filteredEx.length} expert{filteredEx.length!==1?"s":""}</div>
            <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="rechercher…" style={{flex:1,fontFamily:sans,fontSize:12,padding:"5px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.ink,outline:"none"}}/>
          </div>
          {filteredEx.length===0
            ?<div style={{padding:"30px 0",textAlign:"center"}}><div style={{fontFamily:serif,fontStyle:"italic",fontSize:14,color:C.muted}}>aucun expert référencé</div></div>
            :filteredEx.map(ex=>(
              <div key={ex.id} style={{background:C.white,border:`1px solid ${C.border}`,padding:"16px",marginBottom:10,position:"relative",display:"flex",gap:14,alignItems:"flex-start"}}>
                <button onClick={()=>delExpert(ex.id)} style={{position:"absolute",top:10,right:12,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,opacity:.3,padding:0}} onMouseEnter={e=>(e.currentTarget.style.opacity=1)} onMouseLeave={e=>(e.currentTarget.style.opacity=.3)}>×</button>
                <div style={{width:42,height:42,borderRadius:2,background:C.dark,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:16,fontWeight:700,flexShrink:0}}>
                  {(ex.name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}
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
              </div>
            ))
          }
        </div>
      </div>
    );
  }
function GrapheView(){
  const graphItems = items.filter(i => graphSelectedIds.has(i.id) && !dismissed.has(i.id) && !isEv(i));
  const count = graphItems.length;

  const [activeGraphView, setActiveGraphView] = useState("institutionThemes");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterTheme, setFilterTheme] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [filterConcept, setFilterConcept] = useState("");
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [hideIsolated, setHideIsolated] = useState(false);

  const [mergeNodeType, setMergeNodeType] = useState("actors");
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const graphStats = useMemo(() => {
    const institutions = new Set();
    const acteurs = new Set();
    const concepts = new Set();
    const themes = new Set();
    const innovations = new Set();

    const institutionThemes = new Map();
    const institutionConcepts = new Map();
    const actorThemes = new Map();
    const actorConcepts = new Map();

    const addToMapSet = (map, key, value) => {
      if (!key || !value) return;

      const cleanKey = String(key).trim();
      const cleanValue = String(value).trim();

      if (!cleanKey || !cleanValue) return;

      if (!map.has(cleanKey)) map.set(cleanKey, new Set());
      map.get(cleanKey).add(cleanValue);
    };

    const mapSetToArray = (map) => {
      return Array.from(map.entries())
        .map(([name, values]) => ({
          name,
          values: Array.from(values).sort((a, b) => a.localeCompare(b, "fr")),
          count: values.size,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
    };

    const getActorsFromItem = (item) => {
      const direct =
        item.actors ||
        item.acteurs ||
        item.acteursCles ||
        item.acteursClés ||
        item.acteurs_cles ||
        item.acteurs_clés ||
        item.acteursCites ||
        item.acteurs_cites ||
        item.acteurs_cités ||
        item.acteurs_cités_normalisés ||
        item.acteurs_cites_normalises ||
        item.acteursMentionnes ||
        item.acteurs_mentionnes ||
        item.acteurs_mentionnés ||
        item["Acteurs clés"] ||
        item["acteurs clés"] ||
        item["Acteurs cles"] ||
        item["acteurs cles"] ||
        item["Acteurs cités"] ||
        item["Acteurs mentionnés"] ||
        item["acteurs cités"] ||
        item["acteurs mentionnés"];

      if (direct) return direct;

      const actorKey = Object.keys(item).find(key => {
        const cleanKey = key
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return cleanKey.includes("acteur") || cleanKey.includes("actor");
      });

      return actorKey ? item[actorKey] : "";
    };

    graphItems.forEach(item => {
      const institution = item.institution ? String(item.institution).trim() : "";

      const itemActors = norm(getActorsFromItem(item))
        .map(v => String(v).trim())
        .filter(Boolean);

      const itemConcepts = norm(item.keywords)
        .map(v => String(v).trim())
        .filter(Boolean);

      const itemThemes = norm(item.themes)
        .map(v => String(v).trim())
        .filter(Boolean);

      const itemInnovations = norm(item.innovations)
        .map(v => String(v).trim())
        .filter(v => v && v !== "Aucune" && v !== "Aucun");

      if (institution) institutions.add(institution);
      itemActors.forEach(actor => acteurs.add(actor));
      itemConcepts.forEach(concept => concepts.add(concept));
      itemThemes.forEach(theme => themes.add(theme));
      itemInnovations.forEach(innovation => innovations.add(innovation));

      if (institution) {
        itemThemes.forEach(theme => addToMapSet(institutionThemes, institution, theme));
        itemConcepts.forEach(concept => addToMapSet(institutionConcepts, institution, concept));
      }

      itemActors.forEach(actor => {
        itemThemes.forEach(theme => addToMapSet(actorThemes, actor, theme));
        itemConcepts.forEach(concept => addToMapSet(actorConcepts, actor, concept));
      });
    });

    return {
      articles: graphItems.length,
      institutions: institutions.size,
      acteurs: acteurs.size,
      concepts: concepts.size,
      themes: themes.size,
      innovations: innovations.size,

      institutionList: Array.from(institutions).sort((a, b) => a.localeCompare(b, "fr")),
      actorList: Array.from(acteurs).sort((a, b) => a.localeCompare(b, "fr")),
      conceptList: Array.from(concepts).sort((a, b) => a.localeCompare(b, "fr")),
      themeList: Array.from(themes).sort((a, b) => a.localeCompare(b, "fr")),

      institutionThemes: mapSetToArray(institutionThemes),
      institutionConcepts: mapSetToArray(institutionConcepts),
      actorThemes: mapSetToArray(actorThemes),
      actorConcepts: mapSetToArray(actorConcepts),
    };
  }, [graphItems]);

  const graphStatus =
    count === 0 ? "empty" :
    count < 5 ? "too-small" :
    count > 25 ? "too-large" :
    "ok";

  const resetFilters = () => {
    setFilterInstitution("");
    setFilterTheme("");
    setFilterActor("");
    setFilterConcept("");
    setShowTopOnly(false);
    setHideIsolated(false);
  };

  const filterRows = (rows, type) => {
    let filtered = [...rows];

    if (hideIsolated) filtered = filtered.filter(row => row.count > 1);

    if ((type === "institutionThemes" || type === "institutionConcepts") && filterInstitution) {
      filtered = filtered.filter(row => row.name === filterInstitution);
    }

    if ((type === "actorThemes" || type === "actorConcepts") && filterActor) {
      filtered = filtered.filter(row => row.name === filterActor);
    }

    if ((type === "institutionThemes" || type === "actorThemes") && filterTheme) {
      filtered = filtered
        .map(row => ({
          ...row,
          values: row.values.filter(v => v === filterTheme),
        }))
        .filter(row => row.values.length > 0)
        .map(row => ({
          ...row,
          count: row.values.length,
        }));
    }

    if ((type === "institutionConcepts" || type === "actorConcepts") && filterConcept) {
      filtered = filtered
        .map(row => ({
          ...row,
          values: row.values.filter(v => v === filterConcept),
        }))
        .filter(row => row.values.length > 0)
        .map(row => ({
          ...row,
          count: row.values.length,
        }));
    }

    if (showTopOnly) filtered = filtered.slice(0, 10);

    return filtered;
  };

  const graphViews = {
    institutionThemes: {
      title: "Institutions → Thèmes",
      short: "Institutions → Thèmes",
      sourceLabel: "Institutions",
      targetLabel: "Thèmes",
      subtitle: "Visualiser la surface thématique des institutions présentes dans la sélection.",
      rows: filterRows(graphStats.institutionThemes, "institutionThemes"),
      sourceColor: "#5b3758",
      targetColor: "#b8653b",
      emptyText: "Aucune relation Institution → Thème détectée.",
    },
    institutionConcepts: {
      title: "Institutions → Concepts",
      short: "Institutions → Concepts",
      sourceLabel: "Institutions",
      targetLabel: "Concepts",
      subtitle: "Visualiser la surface conceptuelle des institutions présentes dans la sélection.",
      rows: filterRows(graphStats.institutionConcepts, "institutionConcepts"),
      sourceColor: "#5b3758",
      targetColor: "#8a6a38",
      emptyText: "Aucune relation Institution → Concept détectée.",
    },
    actorThemes: {
      title: "Acteurs → Thèmes",
      short: "Acteurs → Thèmes",
      sourceLabel: "Acteurs",
      targetLabel: "Thèmes",
      subtitle: "Observer les thèmes associés aux acteurs cités par les articles.",
      rows: filterRows(graphStats.actorThemes, "actorThemes"),
      sourceColor: "#60724d",
      targetColor: "#b8653b",
      emptyText: "Aucune relation Acteur → Thème détectée.",
    },
    actorConcepts: {
      title: "Acteurs → Concepts",
      short: "Acteurs → Concepts",
      sourceLabel: "Acteurs",
      targetLabel: "Concepts",
      subtitle: "Observer les concepts associés aux acteurs cités par les articles.",
      rows: filterRows(graphStats.actorConcepts, "actorConcepts"),
      sourceColor: "#60724d",
      targetColor: "#8a6a38",
      emptyText: "Aucune relation Acteur → Concept détectée.",
    },
  };

  const activeView = graphViews[activeGraphView];

  const mergeValues = useMemo(() => {
    if (mergeNodeType === "institutions") return graphStats.institutionList;
    if (mergeNodeType === "actors") return graphStats.actorList;
    if (mergeNodeType === "themes") return graphStats.themeList;
    if (mergeNodeType === "concepts") return graphStats.conceptList;
    return [];
  }, [mergeNodeType, graphStats]);

  const mergeSuggestions = mergeValues.filter(value => {
    if (!mergeSearch.trim()) return true;

    const a = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const b = mergeSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return a.includes(b);
  }).slice(0, 18);

  const pageStyle = {
    padding: 18,
    background: C.page,
    minHeight: "100vh",
    color: C.text,
  };

  const panelStyle = {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 2,
    boxShadow: "0 10px 26px rgba(43,42,36,.06)",
  };

  const panelPad = {
    padding: 18,
  };

  const eyebrowStyle = {
    ...sc(),
    color: C.accent,
    marginBottom: 8,
  };

  const softButton = (active = false) => ({
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent : C.white,
    color: active ? C.white : C.muted,
    padding: "7px 10px",
    borderRadius: 2,
    cursor: "pointer",
    fontSize: 10,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    fontFamily: sans,
  });

  const fieldStyle = {
    width: "100%",
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.ink,
    padding: "8px 9px",
    fontSize: 11,
    fontFamily: sans,
    outline: "none",
    borderRadius: 2,
  };

  const statBox = (value, label) => (
    <div style={{
      background: C.panelSoft,
      border: `1px solid ${C.border}`,
      padding: "10px 12px",
      minWidth: 105,
    }}>
      <div style={{fontFamily: serif, fontSize: 25, fontWeight: 700, color: C.ink, lineHeight: 1}}>
        {value}
      </div>
      <div style={{...sc(), fontSize: 8, marginTop: 4}}>
        {label}
      </div>
    </div>
  );

  const tagStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 7px",
    borderRadius: 2,
    background: C.chip,
    color: C.chipText,
    fontSize: 10,
    fontFamily: sans,
    marginRight: 5,
    marginBottom: 5,
  };

  const graphRowsForDrawing = activeView ? activeView.rows.slice(0, showTopOnly ? 8 : 10) : [];

  const renderGraphSvg = () => {
    if (!activeView || graphRowsForDrawing.length === 0) {
      return (
        <div style={{
          minHeight: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfaf6",
          border: `1px dashed ${C.border}`,
          color: C.muted,
          fontFamily: serif,
          fontStyle: "italic",
        }}>
          {activeView?.emptyText || "Aucune vue active."}
        </div>
      );
    }

    const leftNodes = graphRowsForDrawing.slice(0, 6);
    const targetSet = new Set();
    leftNodes.forEach(row => row.values.slice(0, 5).forEach(v => targetSet.add(v)));
    const rightNodes = Array.from(targetSet).slice(0, 10);

    const W = 780;
    const H = 500;
    const leftX = 170;
    const rightX = 610;

    const leftY = leftNodes.map((_, i) => 80 + i * (Math.min(360, H - 150) / Math.max(1, leftNodes.length - 1 || 1)));
    const rightY = rightNodes.map((_, i) => 55 + i * (Math.min(410, H - 100) / Math.max(1, rightNodes.length - 1 || 1)));

    const rightIndex = {};
    rightNodes.forEach((n, i) => { rightIndex[n] = i; });

    const shortLabel = (txt, max = 25) => {
      const s = String(txt || "");
      return s.length > max ? s.slice(0, max - 1) + "…" : s;
    };

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="500" role="img" style={{
        display: "block",
        background: "#fbfaf6",
        border: `1px solid ${C.border}`,
      }}>
        <defs>
          <filter id="softShadowGraph" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2b2a24" floodOpacity="0.12" />
          </filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="#fbfaf6" />

        {leftNodes.map((row, i) => {
          const y1 = leftY[i];

          return row.values.slice(0, 5).map(target => {
            const j = rightIndex[target];
            if (j === undefined) return null;

            const y2 = rightY[j];
            const strength = Math.min(4, Math.max(1.2, row.count / 2));

            return (
              <path
                key={`${row.name}-${target}`}
                d={`M ${leftX + 36} ${y1} C ${leftX + 190} ${y1}, ${rightX - 190} ${y2}, ${rightX - 36} ${y2}`}
                fill="none"
                stroke="#b89b7a"
                strokeWidth={strength}
                opacity="0.38"
              />
            );
          });
        })}

        {leftNodes.map((row, i) => {
          const y = leftY[i];
          const r = 23 + Math.min(12, row.count * 2);

          return (
            <g key={row.name} filter="url(#softShadowGraph)">
              <circle cx={leftX} cy={y} r={r} fill={activeView.sourceColor} />
              <text
                x={leftX}
                y={y + 4}
                textAnchor="middle"
                fontFamily={sans}
                fontSize="10"
                fontWeight="700"
                fill="#fffdf8"
              >
                {row.count}
              </text>
              <text
                x={leftX - r - 10}
                y={y + 4}
                textAnchor="end"
                fontFamily={sans}
                fontSize="11"
                fill={C.ink}
              >
                {shortLabel(row.name, 26)}
              </text>
            </g>
          );
        })}

        {rightNodes.map((name, i) => {
          const y = rightY[i];

          return (
            <g key={name} filter="url(#softShadowGraph)">
              <circle cx={rightX} cy={y} r="20" fill={activeView.targetColor} />
              <text
                x={rightX + 28}
                y={y + 4}
                fontFamily={sans}
                fontSize="11"
                fill={C.ink}
              >
                {shortLabel(name, 30)}
              </text>
            </g>
          );
        })}

        <g transform="translate(24 455)">
          <circle cx="0" cy="0" r="7" fill={activeView.sourceColor} />
          <text x="14" y="4" fontFamily={sans} fontSize="10" fill={C.muted}>{activeView.sourceLabel}</text>

          <circle cx="125" cy="0" r="7" fill={activeView.targetColor} />
          <text x="139" y="4" fontFamily={sans} fontSize="10" fill={C.muted}>{activeView.targetLabel}</text>

          <line x1="270" y1="0" x2="320" y2="0" stroke="#b89b7a" strokeWidth="4" opacity="0.5" />
          <text x="330" y="4" fontFamily={sans} fontSize="10" fill={C.muted}>lien plus fréquent</text>
        </g>
      </svg>
    );
  };

  const renderLeftControls = () => (
    <aside style={{
      ...panelStyle,
      padding: 16,
      minWidth: 0,
    }}>
      <div style={eyebrowStyle}>Affiner la vue</div>

      <p style={{
        fontSize: 12,
        lineHeight: 1.55,
        color: C.muted,
        margin: "0 0 14px",
      }}>
        Ces options réduisent la vue affichée. Elles ne modifient pas les données du digest.
      </p>

      {(activeGraphView === "institutionThemes" || activeGraphView === "institutionConcepts") && (
        <label style={{display:"block",marginBottom:12}}>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Institution</div>
          <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)} style={fieldStyle}>
            <option value="">Toutes les institutions</option>
            {graphStats.institutionList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      )}

      {(activeGraphView === "actorThemes" || activeGraphView === "actorConcepts") && (
        <label style={{display:"block",marginBottom:12}}>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Acteur</div>
          <select value={filterActor} onChange={e => setFilterActor(e.target.value)} style={fieldStyle}>
            <option value="">Tous les acteurs</option>
            {graphStats.actorList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      )}

      {(activeGraphView === "institutionThemes" || activeGraphView === "actorThemes") && (
        <label style={{display:"block",marginBottom:12}}>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Thème</div>
          <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)} style={fieldStyle}>
            <option value="">Tous les thèmes</option>
            {graphStats.themeList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      )}

      {(activeGraphView === "institutionConcepts" || activeGraphView === "actorConcepts") && (
        <label style={{display:"block",marginBottom:12}}>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Concept</div>
          <select value={filterConcept} onChange={e => setFilterConcept(e.target.value)} style={fieldStyle}>
            <option value="">Tous les concepts</option>
            {graphStats.conceptList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:14}}>
        <button onClick={() => setHideIsolated(v => !v)} style={softButton(hideIsolated)}>
          Masquer les isolés
        </button>

        <button onClick={() => setShowTopOnly(v => !v)} style={softButton(showTopOnly)}>
          Top 10
        </button>

        <button onClick={resetFilters} style={softButton(false)}>
          Réinitialiser
        </button>
      </div>
    </aside>
  );

  const renderRightPanel = () => (
    <aside style={{
      ...panelStyle,
      padding: 16,
      minWidth: 0,
    }}>
      <div style={eyebrowStyle}>Lecture relationnelle</div>

      {activeView && (
        <div style={{
          background: C.panelSoft,
          border: `1px solid ${C.border}`,
          padding: 12,
          marginBottom: 14,
        }}>
          <div style={{...sc(),fontSize:8,marginBottom:6}}>Vue active</div>
          <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:5}}>
            {activeView.title}
          </div>
          <div style={{fontSize:12,lineHeight:1.55,color:C.muted}}>
            {activeView.subtitle}
          </div>
        </div>
      )}

      <div style={{marginBottom:14}}>
        <div style={{...sc(),fontSize:8,marginBottom:8}}>Comment lire ce graphe ?</div>

        <div style={{fontSize:12,lineHeight:1.65,color:C.text,display:"grid",gap:8}}>
          <div>● Les nœuds de gauche sont les entités de départ.</div>
          <div>● Les nœuds de droite sont les thèmes ou concepts associés.</div>
          <div>● Plus un nœud est gros, plus il porte d’associations.</div>
          <div>● Les liens représentent les associations issues des articles sélectionnés.</div>
        </div>
      </div>

      <div style={{
        background: "#fffaf1",
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        padding: 12,
      }}>
        <div style={{...sc(),fontSize:8,marginBottom:6,color:C.accent}}>Fusion des nœuds</div>
        <div style={{fontSize:12,lineHeight:1.6,color:C.muted}}>
          Le sous-module de fusion sert à repérer les variantes lexicales :
          par exemple “Gendarmerie nationale”, “Gendarmerie Nationale” ou “Gendarmerie”.
        </div>

        <button onClick={() => setActiveGraphView("fusion")} style={{
          ...softButton(activeGraphView === "fusion"),
          marginTop: 10,
          width: "100%",
        }}>
          Ouvrir la fusion
        </button>
      </div>
    </aside>
  );

  const renderFusionCenter = () => (
    <div style={{
      ...panelStyle,
      padding: 18,
      minHeight: 500,
    }}>
      <div style={eyebrowStyle}>Consolidation</div>

      <h2 style={{fontFamily:serif,fontSize:26,margin:"0 0 8px",color:C.ink}}>
        Fusion des nœuds
      </h2>

      <p style={{fontSize:13,lineHeight:1.7,color:C.muted,margin:"0 0 18px",maxWidth:740}}>
        Cette zone prépare le rapprochement des variantes d’un même acteur, concept, thème ou institution.
        En V1, elle sert de contrôle visuel : elle n’écrit pas encore dans la Google Sheet.
      </p>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",
        gap:12,
        marginBottom:16,
      }}>
        <label>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Type de nœud</div>
          <select value={mergeNodeType} onChange={e => setMergeNodeType(e.target.value)} style={fieldStyle}>
            <option value="actors">Acteurs</option>
            <option value="institutions">Institutions</option>
            <option value="themes">Thèmes</option>
            <option value="concepts">Concepts</option>
          </select>
        </label>

        <label>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Rechercher une valeur</div>
          <input value={mergeSearch} onChange={e => setMergeSearch(e.target.value)} placeholder="ex. gendarmerie nationale" style={fieldStyle}/>
        </label>

        <label>
          <div style={{...sc(),fontSize:8,marginBottom:5}}>Valeur cible</div>
          <input value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="ex. Gendarmerie nationale" style={fieldStyle}/>
        </label>
      </div>

      <div style={{
        background:C.panelSoft,
        border:`1px solid ${C.border}`,
        padding:14,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:10}}>
          <strong style={{fontFamily:serif,fontSize:16,color:C.ink}}>Suggestions de rapprochement</strong>
          <span style={{...sc(),fontSize:8}}>{mergeSuggestions.length} valeur{mergeSuggestions.length > 1 ? "s" : ""}</span>
        </div>

        {mergeSuggestions.length === 0 ? (
          <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.muted}}>
            Aucune valeur trouvée.
          </div>
        ) : (
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {mergeSuggestions.map(value => (
              <button
                key={value}
                onClick={() => {
                  setMergeSearch(value);
                  if (!mergeTarget) setMergeTarget(value);
                }}
                style={{
                  border:`1px solid ${C.border}`,
                  background:C.white,
                  color:C.text,
                  padding:"5px 8px",
                  borderRadius:2,
                  cursor:"pointer",
                  fontSize:11,
                  fontFamily:sans,
                }}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main style={pageStyle}>
      <section style={{
        ...panelStyle,
        ...panelPad,
        marginBottom: 14,
        borderLeft: `4px solid ${C.accent}`,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{minWidth:280,flex:"1 1 420px"}}>
            <div style={eyebrowStyle}>Sélection active</div>

            <h1 style={{
              fontFamily:serif,
              fontSize:34,
              lineHeight:1,
              margin:"0 0 8px",
              color:C.ink,
              letterSpacing:-.5,
            }}>
              Corpus analysé
            </h1>

            <p style={{
              fontSize:13,
              lineHeight:1.65,
              color:C.muted,
              margin:0,
              maxWidth:650,
            }}>
              Cette sélection constitue le socle documentaire de la lecture relationnelle.
              Les liens affichés ci-dessous sont déduits des articles cochés pour le graphe.
            </p>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {statBox(graphStats.articles, "articles")}
            {statBox(graphStats.institutions, "institutions")}
            {statBox(graphStats.acteurs, "acteurs")}
            {statBox(graphStats.concepts, "concepts")}
            {statBox(graphStats.themes, "thèmes")}
            {statBox(graphStats.innovations, "innovations")}
          </div>
        </div>

        {graphItems.length > 0 && (
          <div style={{
            display:"flex",
            gap:8,
            marginTop:14,
            overflowX:"auto",
            paddingBottom:2,
          }}>
            {graphItems.slice(0, 4).map(item => (
              <div key={item.id} style={{
                flex:"0 0 auto",
                maxWidth:260,
                background:C.panelSoft,
                border:`1px solid ${C.border}`,
                padding:"8px 10px",
                fontSize:11,
                lineHeight:1.35,
                color:C.text,
              }}>
                {String(item.title || "Article sans titre").slice(0, 72)}
                {String(item.title || "").length > 72 ? "…" : ""}
              </div>
            ))}

            {graphItems.length > 4 && (
              <div style={{
                flex:"0 0 auto",
                background:C.ink,
                color:C.white,
                padding:"8px 10px",
                fontSize:11,
                display:"flex",
                alignItems:"center",
              }}>
                +{graphItems.length - 4} autres
              </div>
            )}
          </div>
        )}
      </section>

      {graphStatus !== "ok" && (
        <section style={{
          ...panelStyle,
          padding: 26,
          textAlign: "center",
        }}>
          {graphStatus === "empty" && (
            <>
              <div style={{fontFamily:serif,fontSize:24,color:C.ink,marginBottom:8}}>
                Aucun article sélectionné
              </div>
              <div style={{color:C.muted,fontSize:13}}>
                Retourne dans l’onglet Productions et coche quelques articles avec le bouton “Graphe”.
              </div>
            </>
          )}

          {graphStatus === "too-small" && (
            <>
              <div style={{fontFamily:serif,fontSize:24,color:C.ink,marginBottom:8}}>
                Sélection encore trop courte
              </div>
              <div style={{color:C.muted,fontSize:13}}>
                La sélection contient {count} article{count > 1 ? "s" : ""}. Il faut au moins 5 articles pour produire une première lecture relationnelle.
              </div>
            </>
          )}

          {graphStatus === "too-large" && (
            <>
              <div style={{fontFamily:serif,fontSize:24,color:C.ink,marginBottom:8}}>
                Sélection trop large pour la V1
              </div>
              <div style={{color:C.muted,fontSize:13}}>
                La sélection contient {count} articles. Pour cette V1, limite la sélection à 25 articles.
              </div>
            </>
          )}
        </section>
      )}

      {graphStatus === "ok" && (
        <>
          <section style={{
            display:"grid",
            gridTemplateColumns:"250px minmax(0, 1fr) 280px",
            gap:14,
            alignItems:"stretch",
            marginBottom:14,
          }}>
            {renderLeftControls()}

            <section style={{
              ...panelStyle,
              padding: 16,
              minWidth:0,
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
                <div>
                  <div style={eyebrowStyle}>Graphe relationnel</div>

                  <h2 style={{
                    fontFamily:serif,
                    fontSize:28,
                    margin:"0 0 5px",
                    color:C.ink,
                    lineHeight:1.1,
                  }}>
                    {activeGraphView === "fusion" ? "Consolider les nœuds" : activeView?.title}
                  </h2>

                  {activeGraphView !== "fusion" && activeView && (
                    <p style={{fontSize:13,lineHeight:1.6,color:C.muted,margin:0}}>
                      {activeView.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                display:"flex",
                flexWrap:"wrap",
                gap:6,
                marginBottom:14,
              }}>
                {Object.entries(graphViews).map(([key, view]) => (
                  <button
                    key={key}
                    onClick={() => setActiveGraphView(key)}
                    style={softButton(activeGraphView === key)}
                  >
                    {view.short}
                  </button>
                ))}

                <button
                  onClick={() => setActiveGraphView("fusion")}
                  style={softButton(activeGraphView === "fusion")}
                >
                  Fusion des nœuds
                </button>
              </div>

              {activeGraphView === "fusion" ? renderFusionCenter() : renderGraphSvg()}

              {activeGraphView !== "fusion" && activeView && activeView.rows.length > 0 && (
                <div style={{
                  marginTop:12,
                  background:C.panelSoft,
                  border:`1px solid ${C.border}`,
                  padding:12,
                }}>
                  <div style={{...sc(),fontSize:8,marginBottom:8}}>
                    Principales associations visibles
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:8}}>
                    {activeView.rows.slice(0, 6).map(row => (
                      <div key={row.name} style={{
                        background:C.white,
                        border:`1px solid ${C.border}`,
                        padding:10,
                      }}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                          <strong style={{fontFamily:serif,fontSize:14,color:C.ink,lineHeight:1.25}}>
                            {row.name}
                          </strong>
                          <span style={{color:C.accent,fontFamily:serif,fontWeight:700}}>
                            {row.count}
                          </span>
                        </div>

                        <div style={{marginTop:8}}>
                          {row.values.slice(0, 5).map(value => (
                            <span key={value} style={tagStyle}>{value}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {renderRightPanel()}
          </section>

          {graphItems.length > 0 && (
            <section style={{
              ...panelStyle,
              padding: 18,
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:12}}>
                <div>
                  <div style={eyebrowStyle}>Socle documentaire</div>
                  <h2 style={{fontFamily:serif,fontSize:24,margin:0,color:C.ink}}>
                    Articles mobilisés
                  </h2>
                </div>

                <button
                  onClick={() => setGraphSelectedIds(new Set())}
                  style={softButton(false)}
                >
                  Vider la sélection
                </button>
              </div>

              <div style={{
                borderTop:`1px solid ${C.border}`,
              }}>
                {graphItems.map(item => (
                  <article key={item.id} style={{
                    display:"grid",
                    gridTemplateColumns:"minmax(0, 1.5fr) 180px 120px minmax(180px, .8fr)",
                    gap:12,
                    alignItems:"center",
                    padding:"11px 0",
                    borderBottom:`1px solid ${C.border}`,
                    fontSize:12,
                  }}>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.ink,lineHeight:1.25}}>
                        {item.title || item.titre || "Article sans titre"}
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{
                          color:C.accent,
                          fontSize:10,
                          textDecoration:"none",
                        }}>
                          ouvrir la source ↗
                        </a>
                      )}
                    </div>

                    <div style={{color:C.muted}}>
                      {item.institution || item.source || "Non renseigné"}
                    </div>

                    <div style={{color:C.muted}}>
                      {item.date || ""}
                    </div>

                    <div>
                      {norm(item.themes).slice(0, 2).map(t => (
                        <span key={t} style={tagStyle}>{t}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
  function ProduireView(){
    const allThemesList = Array.from(new Set([
      "tous",
      ...items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).flatMap(i=>norm(i.themes)).filter(Boolean)
    ]));

    const fmtResult = (text) => text.split("\n").filter(Boolean).map((line,i)=>{
      if(/^FORMAT\s+\d+\s*[-:]/i.test(line)||/^#{1,3}\s/.test(line)){
        return <div key={i} style={{fontFamily:serif,fontSize:15,fontWeight:700,color:C.ink,marginTop:16,marginBottom:4}}>{line.replace(/^#+\s*/,"").replace(/^FORMAT\s+\d+\s*[-:]\s*/i,"")}</div>;
      }
      return <p key={i} style={{fontSize:13,lineHeight:1.8,color:"#3a3020",fontFamily:serif,fontStyle:"italic",marginBottom:8}}>{line}</p>;
    });

    return(
      <div style={{flex:1,padding:"24px 28px",overflowY:"auto",display:"flex",flexDirection:"column",gap:20}}>

        <div style={{background:"#f0faf4",border:"1px solid #9FE1CB",padding:"12px 18px",display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:14,color:C.green,flexShrink:0}}>✓</span>
          <div>
            <div style={{fontSize:12,color:"#085041",fontFamily:sans}}>génération propulsée par Claude · via Apps Script · aucune configuration requise</div>
            <div style={{fontSize:11,color:"#085041",fontFamily:sans,marginTop:4,opacity:.8}}>en cas d'erreur réseau, faire <strong>Ctrl+Shift+R</strong> (ou Ctrl+F5) pour forcer le rechargement sans cache.</div>
          </div>
        </div>

        {(()=>{
          const td=today();
          const next=CALENDRIER_2026.filter(e=>e.date&&e.date>=td).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
          return next.length>0?(
            <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid #3730a3`,padding:"14px 18px"}}>
              <div style={{...sc(),marginBottom:10,color:"#3730a3"}}>prochaines fenêtres d'opportunité · automatiquement transmises à Claude</div>
              {next.map(ev=>{const ts=CAL_TYPE_S[ev.type]||CAL_TYPE_S["institutionnel"];return(
                <div key={ev.id} style={{display:"flex",gap:10,alignItems:"baseline",marginBottom:6}}>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:2,fontFamily:sans,...ts,flexShrink:0}}>{ev.type}</span>
                  <span style={{fontFamily:serif,fontSize:13,color:C.ink}}>{ev.title}</span>
                  <span style={{...sc(),fontSize:9,marginLeft:"auto",flexShrink:0,color:ts.color}}>{fsFR(ev.date)}</span>
                </div>
              );})}
            </div>
          ):null;
        })()}

        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{...sc()}}>sélection des articles</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.muted,fontFamily:sans}}>{prodSelItems.size>0?`${prodSelItems.size} sélectionné${prodSelItems.size>1?"s":""}`:`tous (${prodItems.length})`}</span>
              <button onClick={selectAllProd} style={{...pill(false),fontSize:10,padding:"2px 8px"}}>tout sélectionner</button>
              {prodSelItems.size>0&&<button onClick={clearProdSel} style={{...pill(false),fontSize:10,padding:"2px 8px"}}>effacer</button>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {allThemesList.slice(0,8).map(t=>(
              <button key={t} onClick={()=>{setProdTheme(t);clearProdSel();}} style={pill(prodTheme===t)}>{t}</button>
            ))}
          </div>
          <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
            {prodItems.length===0
              ?<div style={{...sc(),padding:"20px 0",textAlign:"center"}}>aucun article disponible</div>
              :prodItems.map(item=>{
                const sel=prodSelItems.has(item.id);
                return(
                  <div key={item.id} onClick={()=>toggleProdItem(item.id)} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",cursor:"pointer",borderRadius:2,background:sel?"#f0faf4":C.panelSoft,border:`1px solid ${sel?"#9FE1CB":C.border}`,transition:"all .15s"}}>
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

        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>synthèse thématique hebdomadaire</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Claude analyse les articles sélectionnés et produit une synthèse structurée par thème.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#e1f5ee",color:"#0f6e56",fontFamily:sans,flexShrink:0,marginLeft:12}}>{prodSelected.length} article{prodSelected.length!==1?"s":""}</span>
          </div>
          <button onClick={()=>generateProd("synthèse")} disabled={prodLoading} style={genBtn(prodLoading,false)}
            onMouseEnter={e=>{if(!prodLoading)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading)e.currentTarget.style.background=C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="synthèse"?"génération en cours…":"générer la synthèse"}
          </button>
          {prodResult?.format==="synthèse"&&(
            <div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
              <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>synthèse générée à {prodResult.timestamp}</div>
              <div>{fmtResult(prodResult.text)}</div>
            </div>
          )}
        </div>

        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>revue de presse narrative</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Claude raconte la semaine comme un éditorialiste — faits marquants mis en perspective.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#eeedfe",color:"#534ab7",fontFamily:sans,flexShrink:0,marginLeft:12}}>ton éditorial</span>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["top 5","top 10","top 15"].map(v=><button key={v} onClick={()=>setProdNarCount(v)} style={pill(prodNarCount===v)}>{v}</button>)}
          </div>
          <button onClick={()=>{setProdFormat("narrative");generateProd("narrative");}} disabled={prodLoading} style={genBtn(prodLoading,false)}
            onMouseEnter={e=>{if(!prodLoading)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading)e.currentTarget.style.background=C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="narrative"?"génération en cours…":"générer la revue"}
          </button>
          {prodResult?.format==="narrative"&&(
            <div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
              <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>revue générée à {prodResult.timestamp}</div>
              <div>{fmtResult(prodResult.text)}</div>
            </div>
          )}
        </div>

        <div style={{background:C.white,border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:serif,fontSize:17,fontWeight:700,color:C.ink,marginBottom:4}}>fiche angle de communication</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:sans,lineHeight:1.6}}>Pour un article donné, Claude propose des formats de production concrets.</div>
            </div>
            <span style={{fontSize:10,padding:"2px 9px",borderRadius:2,background:"#faeeda",color:"#854f0b",fontFamily:sans,flexShrink:0,marginLeft:12}}>par article</span>
          </div>
          <div style={{...sc(),marginBottom:8}}>sélectionner un article</div>
          <div style={{maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,marginBottom:14}}>
            {prodItems.slice(0,15).map(item=>{
              const sel=prodCommItem?.id===item.id;
              return(
                <div key={item.id} onClick={()=>setProdCommItem(item)} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",cursor:"pointer",borderRadius:2,background:sel?"#fdf3e7":C.panelSoft,border:`1px solid ${sel?"#c8401a":C.border}`,transition:"all .15s"}}>
                  <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${sel?C.accent:C.border}`,background:sel?C.accent:"transparent",flexShrink:0,marginTop:2}}/>
                  <div style={{fontFamily:serif,fontSize:12,color:C.ink,lineHeight:1.3,flex:1}}>{item.title}</div>
                </div>
              );
            })}
          </div>
          {prodCommItem&&(
            <div style={{background:C.panelSoft,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontFamily:serif,fontSize:13,color:C.ink,marginBottom:3}}>{prodCommItem.title}</div>
              <div style={{...sc(),fontSize:9,color:C.accent}}>{prodCommItem.source||""}</div>
            </div>
          )}
          <button onClick={()=>{if(!prodCommItem){setProdError("sélectionnez un article");return;}setProdFormat("comm");generateProd("comm");}} disabled={prodLoading||!prodCommItem} style={genBtn(prodLoading,!prodCommItem)}
            onMouseEnter={e=>{if(!prodLoading&&prodCommItem)e.currentTarget.style.background=C.accent;}} onMouseLeave={e=>{if(!prodLoading&&prodCommItem)e.currentTarget.style.background=C.ink;}}>
            <span style={{fontSize:15}}>✦</span>{prodLoading&&prodFormat==="comm"?"génération en cours…":"générer la fiche"}
          </button>
          {prodResult?.format==="comm"&&(
            <div style={{marginTop:16,paddingTop:16,borderTop:`2px solid ${C.ink}`}}>
              <div style={{...sc(),marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block"}}/>fiche générée à {prodResult.timestamp}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {prodResult.text.split(/\n\n+/).filter(b=>b.trim()).map((block,i)=>{
                  const lines=block.split("\n").filter(Boolean);
                  const title=lines[0].replace(/^FORMAT\s+\d+\s*[-:]\s*/i,"").replace(/^#+\s*/,"");
                  const body=lines.slice(1).join(" ");
                  return(
                    <div key={i} style={{background:C.panelSoft,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                      <div style={{...sc(),fontSize:9,color:C.accent,marginBottom:6}}>{title}</div>
                      <div style={{fontFamily:serif,fontStyle:"italic",fontSize:13,color:C.ink,lineHeight:1.55}}>{body}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {prodError&&<div style={{background:"#fce4de",border:"1px solid #e8b0a0",padding:"10px 16px",fontSize:12,color:"#8a2010",fontFamily:sans}}>{prodError}</div>}
      </div>
    );
  }

  // ── VUE POINT VEILLE ─────────────────────────────────────
  function PointVeilleView(){
    const PV={header:C.page,band:C.panel,accent:C.accent,accentLight:"#f2e8df",accentText:C.accent,headerText:C.ink,bandText:C.muted,border:C.border,ink:C.ink,paper:C.white,soft:C.panelSoft,muted:C.muted};
    const scPV={fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:PV.muted,fontFamily:sans};

    const [pvTitre,      setPvTitre]      = useState("Point Veille Hebdomadaire");
    const [pvSemaine,    setPvSemaine]    = useState(todayLong);
    const [pvNumero,     setPvNumero]     = useState("N° 1");
    const [pvSections,   setPvSections]   = useState([
      {id:"s1",label:"Actionnable"},
      {id:"s2",label:"Possiblement à préparer"},
      {id:"s3",label:"Nouveautés du Centre de documentation"},
      {id:"s4",label:"Actualité de l'ATE"},
    ]);
    const pvAssigned    = pvAssignedTop;
    const setPvAssigned = setPvAssignedTop;
    const [pvArticleData, setPvArticleData] = useState({});
    const pvExternals    = pvExternalsTop;
    const setPvExternals = setPvExternalsTop;
    const [pvDragging,    setPvDragging]    = useState(null);
    const [pvDragOver,    setPvDragOver]    = useState(null);
    const [pvShowRadar,   setPvShowRadar]   = useState(true);
    const [pvShowRaccord, setPvShowRaccord] = useState(true);
    const [pvRaccordText, setPvRaccordText] = useState("");
    const [pvGenerating,  setPvGenerating]  = useState(new Set());

    const allAssignedIds = Object.values(pvAssigned).flat();
    const pvPool = items.filter(i=>pvSelectedForPV.has(i.id)&&!isEv(i)&&i.title&&i.summary&&!allAssignedIds.includes(i.id));

    // pvAssigned et pvExternals sont maintenant au niveau principal — assignation directe depuis Card

    // Générer les analyses dès qu'un article arrive dans une section
    useEffect(()=>{
      const allIds=Object.values(pvAssigned).flat();
      allIds.forEach(id=>{
        if(!pvArticleData[id]?.analyse) pvGenerateAnalyse(id);
      });
    },[pvAssigned]);

    // Mise à jour automatique du bloc raccords dès que pvArticleData change
    useEffect(()=>{
      const allRaccords=Object.entries(pvArticleData)
        .filter(([,d])=>d.raccord&&d.raccord!=="pas de raccord possible")
        .map(([artId,d])=>{
          const art=items.find(i=>i.id===artId);
          return art?`• ${art.title.slice(0,55)}… → ${d.raccord}`:null;
        })
        .filter(Boolean);
      if(allRaccords.length>0) setPvRaccordText(allRaccords.join("\n"));
    },[pvArticleData]);

    async function pvGenerateAnalyse(id){
      const item=items.find(i=>i.id===id);
      if(!item) return;
      if(pvArticleData[id]?.analyse) return;
      setPvGenerating(p=>new Set([...p,id]));
      try{
        const td=today();
        const prochains=CALENDRIER_2026.filter(e=>e.date&&e.date>=td).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10).map(e=>`- ${fsFR(e.date)} : ${e.title} (${e.type})`).join("\n");
        const prompt=`Tu es analyste pour le département de l'influence du ministère de l'Intérieur français.\n\nPour cet article de veille, produis deux choses :\n\n1. ANALYSE : 3 à 5 points clés sur les enjeux pour le ministère. Format strict : une liste de points courts commençant par "• ".\n\n2. RACCORD AGENDA : examine si cet article peut être mis en lien avec une des prochaines échéances ci-dessous. Si oui, cite l'échéance et explique le lien en une phrase. Si non, réponds exactement "pas de raccord possible".\n\nTitre : ${item.title}\nRésumé : ${String(item.summary||"").slice(0,400)}\nThèmes : ${norm(item.themes).join(", ")}\nAngle d'exploitation : ${item.exploitationAngle||""}\n\nProchaines échéances :\n${prochains}\n\nFormat de réponse :\nANALYSE\n• point 1\n• point 2\n...\nRACCORD\n[raccord ou "pas de raccord possible"]`;
        // Appel via Apps Script (gère la clé côté serveur, évite les blocages CORS)
        const resultText=await callClaude(prompt);
        const analyseMatch=resultText.match(/ANALYSE\s*([\s\S]*?)(?:RACCORD|$)/i);
        const raccordMatch=resultText.match(/RACCORD\s*([\s\S]*?)$/i);
        const analyse=analyseMatch?analyseMatch[1].trim():"";
        const raccord=raccordMatch?raccordMatch[1].trim():"pas de raccord possible";
        setPvArticleData(p=>({...p,[id]:{...(p[id]||{}),analyse,raccord}}));
      }catch(e){
        console.error("pvGenerateAnalyse error:",e);
        showToast("Erreur génération : "+e.message);
      }
      setPvGenerating(p=>{const n=new Set(p);n.delete(id);return n;});
    }

    function pvDrop(sectionId){
      if(!pvDragging) return;
      const id=pvDragging;
      setPvAssigned(prev=>{
        const next={...prev};
        Object.keys(next).forEach(k=>{next[k]=next[k].filter(x=>x!==id);});
        next[sectionId]=[...next[sectionId],id];
        return next;
      });
      setPvDragging(null);setPvDragOver(null);
      pvGenerateAnalyse(id);
    }

    function pvRemove(id){
      setPvAssigned(prev=>{const next={...prev};Object.keys(next).forEach(k=>{next[k]=next[k].filter(x=>x!==id);});return next;});
      setPvSelectedForPV(prev=>{const n=new Set(prev);n.delete(id);return n;});
      setPvDirectAssign(prev=>{const n={...prev};delete n[id];return n;});
    }
    function pvUpdateData(id,field,val){ setPvArticleData(p=>({...p,[id]:{...p[id],[field]:val}})); }
    function pvUpdateSection(id,val){ setPvSections(p=>p.map(s=>s.id===id?{...s,label:val}:s)); }
    function pvAddExternal(sectionId){ const id=`ext_${Date.now()}`;setPvExternals(p=>({...p,[sectionId]:[...p[sectionId],{id,title:"",source:"",date:"",summary:"",url:""}]}));setPvArticleData(p=>({...p,[id]:{analyse:"",actionnable:"",raccord:""}})); }
    function pvUpdateExternal(sectionId,id,field,val){ setPvExternals(p=>({...p,[sectionId]:p[sectionId].map(e=>e.id===id?{...e,[field]:val}:e)})); }
    function pvRemoveExternal(sectionId,id){ setPvExternals(p=>({...p,[sectionId]:p[sectionId].filter(e=>e.id!==id)})); }

    function pvMoveItem(itemId,secId,dir,type){
      setPvAssigned(prev=>{
        const next={...prev};
        const arr=next[secId];
        if(!arr) return prev;
        const idx=arr.indexOf(itemId);
        if(idx<0) return prev;
        if(dir==="up"&&idx>0){[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];}
        else if(dir==="down"&&idx<arr.length-1){[arr[idx],arr[idx+1]]=[arr[idx+1],arr[idx]];}
        return {...next,[secId]:[...arr]};
      });
    }

    function pvMoveExtItem(itemId,fromSecId,dir){
      setPvExternals(prev=>{
        const next={...prev};
        const arr=[...next[fromSecId]];
        const idx=arr.findIndex(e=>e.id===itemId);
        if(idx<0) return prev;
        if(dir==="up"&&idx>0){[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];}
        else if(dir==="down"&&idx<arr.length-1){[arr[idx],arr[idx+1]]=[arr[idx+1],arr[idx]];}
        return {...next,[fromSecId]:arr};
      });
    }

    function pvMoveToSection(itemId,fromSecId,toSecId,type){
      if(type==="app"){
        setPvAssigned(prev=>{
          const next={...prev};
          next[fromSecId]=next[fromSecId].filter(id=>id!==itemId);
          next[toSecId]=[...next[toSecId],itemId];
          return next;
        });
      } else {
        setPvExternals(prev=>{
          const next={...prev};
          const ext=next[fromSecId].find(e=>e.id===itemId);
          next[fromSecId]=next[fromSecId].filter(e=>e.id!==itemId);
          if(ext) next[toSecId]=[...next[toSecId],ext];
          return next;
        });
      }
    }

    function pvAddExternalAt(sectionId,pos){
      const id=`ext_${Date.now()}`;
      setPvExternals(p=>{
        const ext={id,title:"",source:"",date:"",summary:"",url:""};
        return {...p,[sectionId]:pos==="top"?[ext,...p[sectionId]]:[...p[sectionId],ext]};
      });
      setPvArticleData(p=>({...p,[id]:{analyse:"",actionnable:"",raccord:"",resume:"",title:""}}));
    }

    function pvExport(){
      const wc=pvWordColor;
      const BLUE="#1a3a6b";
      const md=t=>(t||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
      let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@page{margin:2.2cm 2.8cm}
body{font-family:Georgia,serif;color:#1a1a1a;background:white;font-size:11pt;line-height:1.8}
/* HEADER BLEU */
.hdr{background:${BLUE};padding:30px 36px;display:flex;justify-content:space-between;align-items:center}
.hdr-title{font-size:26pt;font-weight:900;color:white;margin:0;letter-spacing:-1px;line-height:1;font-family:Georgia,serif}
.hdr-sub{font-size:11pt;color:rgba(255,255,255,.72);margin:5px 0 0;font-style:italic;font-family:Georgia,serif}
.hdr-right{text-align:right}
.hdr-num{font-size:17pt;font-weight:700;color:white;margin:0;font-family:Georgia,serif}
.hdr-date{font-size:8pt;color:rgba(255,255,255,.65);letter-spacing:.1em;text-transform:uppercase;margin:5px 0 0;font-family:Arial,sans-serif}
/* BANDE */
.band{background:#eef2f8;padding:9px 36px;border-bottom:1px solid #d0d8e8;font-size:8pt;color:#4a5a7a;letter-spacing:.08em;text-transform:uppercase;font-family:Arial,sans-serif}
/* BODY */
.body{padding:28px 36px 36px}
/* RACCORDS */
.raccord-global{background:#fffbf0;border-left:4px solid #d97706;border:1px solid #fde68a;border-left:4px solid #d97706;padding:16px 20px;margin-bottom:30px}
.raccord-lbl{font-size:7pt;text-transform:uppercase;letter-spacing:.18em;color:#92400e;margin:0 0 9px;font-family:Arial,sans-serif}
.raccord-body{font-size:11pt;line-height:1.85;margin:0;color:#4a2a08;font-style:italic}
/* SECTION */
.sec-hdr{display:flex;align-items:baseline;gap:14px;margin:32px 0 18px;padding-bottom:10px;border-bottom:2px solid ${BLUE}}
.sec-num{font-size:22pt;font-weight:900;color:${BLUE};opacity:.2;font-family:Georgia,serif;line-height:1}
.sec-title{font-size:13pt;font-weight:700;color:${BLUE};font-family:Georgia,serif;margin:0}
/* ARTICLE */
.art{margin-bottom:24px;page-break-inside:avoid}
.art-hdr{background:${BLUE}12;border:1px solid ${BLUE}22;border-bottom:none;padding:14px 20px 12px}
.art-title{font-size:12pt;font-weight:700;color:${BLUE};font-family:Georgia,serif;line-height:1.35;margin:0 0 6px;text-decoration:underline}
.art-title a{color:${BLUE};text-decoration:underline}
.art-source{font-size:7.5pt;text-transform:uppercase;letter-spacing:.1em;color:#888;margin:0;font-family:Arial,sans-serif}
.art-body{border:1px solid ${BLUE}22;border-top:none;padding:18px 20px 20px;background:white}
.divider{height:1px;background:#e8e0d5;margin:16px 0}
.lbl{font-size:7pt;text-transform:uppercase;letter-spacing:.18em;color:#aaa;margin:0 0 8px;font-family:Arial,sans-serif}
.resume{font-size:11pt;line-height:1.85;color:#2a2a2a;margin:0;font-weight:500}
.bloc-analyse{background:${BLUE}09;border-left:3px solid ${BLUE};padding:13px 17px;margin-bottom:14px}
.bloc-analyse ul{margin:4px 0;padding-left:18px}
.bloc-analyse li{font-size:11pt;line-height:1.8;margin-bottom:7px;color:#2a2a2a}
.bloc-raccord{background:#fffbf0;border-left:3px solid #d97706;padding:13px 17px;margin-bottom:14px}
.bloc-raccord p{font-size:11pt;line-height:1.8;margin:0;color:#5a3a10;font-weight:500}
.bloc-raccord p.none{color:#aaa;font-weight:400;font-style:italic}
.bloc-action{background:#f0f8f0;border-left:3px solid #2d7d46;padding:13px 17px;margin-bottom:0}
.bloc-action p{font-size:11pt;line-height:1.8;margin:0;color:#1a4d2a;font-style:italic}
.ext-badge{font-size:7pt;background:#fef3c7;color:#92400e;padding:1px 7px;border:1px solid #fde68a;font-family:Arial,sans-serif;vertical-align:middle;margin-left:6px}
/* FOOTER */
.footer{margin-top:32px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#bbb;letter-spacing:.06em;text-transform:uppercase;font-family:Arial,sans-serif}
</style></head><body>`;

      html+=`<div class="hdr"><div><p class="hdr-title">${pvTitre}</p><p class="hdr-sub">Bulletin de veille éditorialisée</p></div><div class="hdr-right"><p class="hdr-num">${pvNumero}</p><p class="hdr-date">${pvSemaine}</p></div></div>`;
      html+=`<div class="band">Département de l'influence &nbsp;·&nbsp; Ministère de l'Intérieur &nbsp;·&nbsp; Usage interne</div>`;
      html+=`<div class="body">`;

      if(pvShowRaccord&&pvRaccordText){
        const raccordHtml=pvRaccordText.split("\n").filter(Boolean).map(l=>md(l)).join("<br><br>");
        html+=`<div class="raccord-global"><p class="raccord-lbl">↔ Raccords agenda détectés</p><p class="raccord-body">${raccordHtml}</p></div>`;
      }

      pvSections.forEach((sec,si)=>{
        const arts=pvAssigned[sec.id].map(id=>items.find(i=>i.id===id)).filter(Boolean);
        const exts=pvExternals[sec.id]||[];
        if(arts.length===0&&exts.length===0) return;
        html+=`<div class="sec-hdr"><span class="sec-num">0${si+1}</span><h2 class="sec-title" style="margin:0">${sec.label}</h2></div>`;

        arts.forEach(a=>{
          const d=pvArticleData[a.id]||{};
          const resumeText=md(d.resume||String(a.summary||""));
          const titleUsed=d.title||a.title;
          const titleHtml=a.url
            ?`<p class="art-title"><a href="${a.url}">${titleUsed}</a></p>`
            :`<p class="art-title">${titleUsed}</p>`;
          const bullets=(d.analyse||"").split("\n").filter(l=>l.trim().startsWith("•")).map(l=>l.trim().replace(/^•\s*/,""));
          const analyseHtml=bullets.length>0
            ?`<ul>${bullets.map(b=>`<li>${md(b)}</li>`).join("")}</ul>`
            :`<p style="margin:0;font-style:italic;font-size:11pt">${md(d.analyse||"")}</p>`;
          const raccord=d.raccord||"pas de raccord possible";
          const isRacc=raccord!=="pas de raccord possible";
          const imgHtml=d.imageData?`<p style="margin:14px 0 0"><img src="${d.imageData}" style="max-width:100%;max-height:200px;display:block"></p>`:"";

          html+=`<div class="art">
            <div class="art-hdr">${titleHtml}<p class="art-source">${a.source||""}&nbsp;·&nbsp;${a.date||""}</p></div>
            <div class="art-body">
              <p class="lbl">Résumé</p>
              <p class="resume">${resumeText}</p>
              ${d.analyse?`<div class="divider"></div><p class="lbl">Analyse &amp; enjeux pour le ministère</p><div class="bloc-analyse">${analyseHtml}</div>`:""}
              <div class="bloc-raccord"><p class="lbl" style="color:#92400e">↔ Raccord agenda</p><p class="${isRacc?"":"none"}">${md(raccord)}</p></div>
              ${d.actionnable?`<div class="bloc-action"><p class="lbl" style="color:#285c3a">Pourquoi actionnable ?</p><p>${md(d.actionnable)}</p></div>`:""}
              ${imgHtml}
            </div>
          </div>`;
        });

        exts.forEach(e=>{
          const d=pvArticleData[e.id]||{};
          const titleUsed=d.title||e.title||"Article externe";
          const titleHtml=e.url
            ?`<p class="art-title"><a href="${e.url}">${titleUsed}</a> <span class="ext-badge">externe</span></p>`
            :`<p class="art-title">${titleUsed} <span class="ext-badge">externe</span></p>`;
          const bullets=(d.analyse||"").split("\n").filter(l=>l.trim().startsWith("•")).map(l=>l.trim().replace(/^•\s*/,""));
          const analyseHtml=bullets.length>0
            ?`<ul>${bullets.map(b=>`<li>${md(b)}</li>`).join("")}</ul>`
            :`<p style="margin:0;font-style:italic;font-size:11pt">${md(d.analyse||"")}</p>`;
          const raccord=d.raccord||"pas de raccord possible";
          const isRacc=raccord!=="pas de raccord possible";
          const resumeText=md(d.resume||e.summary||"");
          const imgHtml=d.imageData?`<p style="margin:14px 0 0"><img src="${d.imageData}" style="max-width:100%;max-height:200px;display:block"></p>`:"";

          html+=`<div class="art">
            <div class="art-hdr">${titleHtml}<p class="art-source">${e.source||""}&nbsp;·&nbsp;${e.date||""}</p></div>
            <div class="art-body">
              ${resumeText?`<p class="lbl">Résumé</p><p class="resume">${resumeText}</p>`:""}
              ${d.analyse?`<div class="divider"></div><p class="lbl">Analyse &amp; enjeux pour le ministère</p><div class="bloc-analyse">${analyseHtml}</div>`:""}
              <div class="bloc-raccord"><p class="lbl" style="color:#92400e">↔ Raccord agenda</p><p class="${isRacc?"":"none"}">${md(raccord)}</p></div>
              ${d.actionnable?`<div class="bloc-action"><p class="lbl" style="color:#285c3a">Pourquoi actionnable ?</p><p>${md(d.actionnable)}</p></div>`:""}
              ${imgHtml}
            </div>
          </div>`;
        });
      });

      html+=`</div><div class="footer"><span>${pvTitre} &nbsp;·&nbsp; Usage interne</span><span>${pvNumero} &nbsp;·&nbsp; ${pvSemaine}</span></div></body></html>`;
      const blob=new Blob(['\ufeff',html],{type:'application/msword'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=`point-veille-${pvNumero.replace(/[^\w]/g,'-')}.doc`;
      a.click();URL.revokeObjectURL(url);
    }

    const inpS=(extra={})=>({border:"none",outline:"none",background:"transparent",fontFamily:"inherit",color:"inherit",...extra});
    const taS=(extra={})=>({width:"100%",border:`1px solid ${PV.border}`,outline:"none",background:PV.paper,fontFamily:serif,fontSize:11,fontStyle:"italic",color:PV.ink,lineHeight:1.7,padding:"6px 8px",resize:"vertical",...extra});

    return(
      <div style={{flex:1,display:"grid",gridTemplateColumns:"248px 1fr",minHeight:0,overflow:"hidden"}}>
        <div style={{borderRight:`1px solid ${PV.border}`,background:PV.soft,display:"flex",flexDirection:"column",overflowY:"auto",padding:14,gap:10}}>
          <div style={{background:PV.paper,border:`1px solid ${PV.border}`,padding:12}}>
            <div style={{...scPV,marginBottom:8}}>options</div>
            {[[pvShowRadar,setPvShowRadar,"cible radar"],[pvShowRaccord,setPvShowRaccord,"bloc raccords"]].map(([v,s,l])=>(
              <label key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,cursor:"pointer",fontSize:11}}>
                <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{accentColor:PV.accent}}/>{l}
              </label>
            ))}
          </div>

          <button
            onClick={async()=>{
              const allIds=Object.values(pvAssigned).flat();
              if(allIds.length===0){showToast("Aucun article dans le bulletin");return;}
              showToast("Génération en cours…");
              for(const id of allIds){
                await pvGenerateAnalyse(id);
              }
              showToast("Analyses & raccords générés ✓");
            }}
            style={{width:"100%",fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:12,padding:"9px",background:C.accent,color:C.white,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
            onMouseEnter={e=>e.currentTarget.style.background=C.ink}
            onMouseLeave={e=>e.currentTarget.style.background=C.accent}>
            <span style={{fontSize:14}}>✦</span> générer analyses & raccords
          </button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{...scPV}}>articles sélectionnés · glisser</div>
            <button onClick={()=>setTab("productions")} style={{fontSize:9,letterSpacing:".06em",textTransform:"uppercase",background:"none",border:"none",color:PV.accent,cursor:"pointer",textDecoration:"underline",fontFamily:sans}}>+ sélectionner</button>
          </div>
          {pvPool.length===0
            ?<div style={{background:PV.paper,border:`1px solid ${PV.border}`,padding:12,fontSize:11,color:PV.muted,fontStyle:"italic",textAlign:"center"}}>
              {pvSelectedForPV.size===0?"Aller dans Productions pour cocher des articles":"tous les articles sélectionnés sont placés"}
            </div>
            :pvPool.map(a=>(
              <div key={a.id} draggable onDragStart={()=>setPvDragging(a.id)} onDragEnd={()=>{setPvDragging(null);setPvDragOver(null);}}
                style={{background:PV.paper,border:`1px solid ${PV.border}`,borderLeft:`3px solid ${PV.accent}`,padding:"9px 11px",cursor:"grab",opacity:pvDragging===a.id?.4:1,transition:"opacity .15s",userSelect:"none"}}>
                <div style={{fontFamily:serif,fontSize:12,color:PV.ink,lineHeight:1.3,marginBottom:3}}>{a.title}</div>
                <div style={{...scPV,fontSize:8}}>{a.source||""}</div>
                <div style={{...scPV,fontSize:8,color:PV.accent,marginTop:2}}>⠿ glisser</div>
              </div>
            ))
          }
        </div>

        <div style={{overflowY:"auto",background:C.page,padding:20}}>
          <div style={{background:PV.paper,maxWidth:800,margin:"0 auto",boxShadow:"0 4px 24px rgba(0,0,0,.1)"}}>
            <div style={{background:PV.header,padding:"22px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`4px double ${C.ink}`}}>
              <div style={{flex:1}}>
                <input value={pvTitre} onChange={e=>setPvTitre(e.target.value)} style={inpS({fontSize:30,fontWeight:900,fontFamily:serif,color:PV.headerText,letterSpacing:"-1px",lineHeight:.9,display:"block",marginBottom:4,width:"100%"})} placeholder="Titre"/>
              </div>
              <div style={{textAlign:"right",marginLeft:16,flexShrink:0}}>
                <input value={pvSemaine} onChange={e=>setPvSemaine(e.target.value)} style={inpS({fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:PV.bandText,display:"block",marginBottom:3,width:"100%",textAlign:"right"})} placeholder="Semaine"/>
                <input value={pvNumero} onChange={e=>setPvNumero(e.target.value)} style={inpS({fontFamily:serif,fontSize:18,fontWeight:700,color:PV.headerText,display:"block",marginBottom:pvShowRadar?6:0,width:"100%",textAlign:"right"})} placeholder="N°"/>
                {pvShowRadar&&(
                  <svg width="90" height="90" viewBox="0 0 90 90" style={{display:"block",marginLeft:"auto"}}>
                    {/* Cercles concentriques */}
                    {[38,28,18,9].map((r,i)=><circle key={r} cx="45" cy="45" r={r} fill="none" stroke={C.accent} strokeWidth={i===0?1:1.2} opacity={0.2+i*0.15}/>)}
                    {/* Secteur balayage */}
                    <path d="M45,45 L45,7 A38,38 0 0,1 78,60 Z" fill={C.accent} opacity=".18"/>
                    <path d="M45,45 L45,7 A38,38 0 0,1 63,74 Z" fill={C.accent} opacity=".10"/>
                    {/* Lignes de grille */}
                    {[0,45,90,135].map((a,i)=>{const r=Math.PI*a/180;return<line key={i} x1={45+38*Math.cos(r-Math.PI/2)} y1={45+38*Math.sin(r-Math.PI/2)} x2={45-38*Math.cos(r-Math.PI/2)} y2={45-38*Math.sin(r-Math.PI/2)} stroke={C.accent} strokeWidth=".7" opacity=".3"/>;})}
                    {/* Points détectés */}
                    <circle cx="58" cy="24" r="3.5" fill={C.accent} opacity=".9"/>
                    <circle cx="58" cy="24" r="7" fill="none" stroke={C.accent} strokeWidth="1" opacity=".5"/>
                    <circle cx="34" cy="52" r="2.5" fill={C.accent} opacity=".7"/>
                    <circle cx="62" cy="48" r="2" fill={C.accent} opacity=".6"/>
                    {/* Centre */}
                    <circle cx="45" cy="45" r="3.5" fill={C.ink}/>
                    <circle cx="45" cy="45" r="1.5" fill={C.accent}/>
                    {/* Ligne balayage */}
                    <line x1="45" y1="45" x2="45" y2="7" stroke={C.accent} strokeWidth="1.5" opacity=".8"/>
                  </svg>
                )}
              </div>
            </div>

            {pvShowRaccord&&(
              <div style={{margin:"14px 24px 0",padding:"10px 14px",background:PV.accentLight,borderLeft:`3px solid ${PV.accent}`}}>
                <div style={{...scPV,color:PV.accentText,marginBottom:5}}>↔ raccords agenda</div>
                <textarea value={pvRaccordText} onChange={e=>setPvRaccordText(e.target.value)} rows={2}
                  placeholder="Saisir les raccords détectés avec l'agenda…"
                  style={taS({background:PV.accentLight,border:"none",fontStyle:"italic",fontSize:12,color:PV.ink})}/>
              </div>
            )}

            <div style={{margin:"12px 24px 0",padding:"8px 12px",background:C.panelSoft,border:`1px solid ${C.border}`,fontSize:11,color:C.muted,fontStyle:"italic",lineHeight:1.6}}>
              Les titres des articles sont cliquables et renvoient vers la source originale.
            </div>

            <div style={{padding:"16px 24px"}}>
              {pvSections.map((sec,si)=>{
                const arts=pvAssigned[sec.id].map(id=>items.find(i=>i.id===id)).filter(Boolean);
                const exts=pvExternals[sec.id]||[];
                const isOver=pvDragOver===sec.id;
                return(
                  <div key={sec.id} style={{marginBottom:26}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:7,borderBottom:`2px solid ${C.ink}`}}>
                      <span style={{fontFamily:serif,fontSize:20,fontWeight:900,color:C.border}}>0{si+1}</span>
                      <input value={sec.label} onChange={e=>pvUpdateSection(sec.id,e.target.value)} style={inpS({fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink,flex:1})} placeholder="Nom de la rubrique"/>
                      <button onClick={()=>pvAddExternalAt(sec.id,"top")} style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 9px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",flexShrink:0,borderRadius:2,fontFamily:sans}}>+ art. externe ↑</button>
                    </div>
                    <div onDragOver={e=>{e.preventDefault();setPvDragOver(sec.id);}} onDragLeave={()=>setPvDragOver(null)} onDrop={()=>pvDrop(sec.id)}
                      style={{minHeight:arts.length===0&&exts.length===0?56:undefined,border:isOver?`2px dashed ${PV.accent}`:`1px dashed ${PV.border}`,borderRadius:3,padding:isOver?"8px":"4px",background:isOver?PV.accentLight:"transparent",transition:"all .15s"}}>
                      {arts.length===0&&exts.length===0?(
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:44,fontSize:11,color:PV.muted,fontStyle:"italic"}}>
                          {pvDragging?"⬇ déposer ici":"aucun article — glisser ou + article externe"}
                        </div>
                      ):(
                        <>
                          {arts.map((a,ai)=>{
                            const d=pvArticleData[a.id]||{};
                            const isGen=pvGenerating.has(a.id);
                            const bullets=(d.analyse||"").split("\n").filter(l=>l.trim().startsWith("•")).map(l=>l.trim());
                            const totalBlocs=arts.length+(pvExternals[sec.id]||[]).length;
                            const isFirst=ai===0;
                            const isLast=ai===arts.length-1&&(pvExternals[sec.id]||[]).length===0;
                            return(
                              <div key={a.id} style={{background:C.panelSoft,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"12px 14px",marginBottom:8}}>
                                <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:8}}>
                                  <button onClick={()=>pvMoveItem(a.id,sec.id,"up","app")} disabled={isFirst} style={{fontSize:11,background:"none",border:`1px solid ${isFirst?C.border:C.muted}`,color:isFirst?C.border:C.muted,padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700,cursor:isFirst?"default":"pointer"}} title="Monter">↑</button>
                                  <button onClick={()=>pvMoveItem(a.id,sec.id,"down","app")} disabled={isLast} style={{fontSize:11,background:"none",border:`1px solid ${isLast?C.border:C.muted}`,color:isLast?C.border:C.muted,padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700,cursor:isLast?"default":"pointer"}} title="Descendre">↓</button>
                                  <select onChange={e=>{if(e.target.value){pvMoveToSection(a.id,sec.id,e.target.value,"app");e.target.value="";}}} defaultValue=""
                                    style={{fontSize:9,border:`1px solid ${C.border}`,background:C.white,color:C.muted,padding:"2px 4px",outline:"none",letterSpacing:".04em",textTransform:"uppercase",borderRadius:2,fontFamily:sans}}>
                                    <option value="">→ déplacer vers…</option>
                                    {pvSections.filter(s=>s.id!==sec.id).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                                  </select>
                                  <button onClick={()=>pvRemove(a.id)} style={{marginLeft:"auto",fontSize:14,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,opacity:.35,lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.35}>×</button>
                                </div>
                                <div style={{marginBottom:8}}>
                                  <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
                                    <input value={d.title||a.title||""} onChange={e=>pvUpdateData(a.id,"title",e.target.value)}
                                      style={{fontFamily:serif,fontSize:15,fontWeight:700,color:C.accent,flex:1,border:"none",borderBottom:`1px dashed ${C.border}`,outline:"none",background:"transparent",paddingBottom:2,cursor:"text"}}/>
                                    {a.url&&<a href={a.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} title="Ouvrir la source"
                                      style={{fontSize:13,color:C.accent,textDecoration:"none",flexShrink:0,marginTop:2,opacity:.7}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.7}>↗</a>}
                                  </div>
                                  <div style={{...scPV,fontSize:8}}>{a.source||""} · {a.date||""}</div>
                                </div>
                                <div style={{height:1,background:C.border,marginBottom:10}}/>
                                <div style={{...scPV,marginBottom:5}}>résumé <span style={{color:C.accent,fontSize:8}}>· éditable</span></div>
                                <textarea value={d.resume||String(a.summary||"")} onChange={e=>pvUpdateData(a.id,"resume",e.target.value)} rows={6}
                                  style={taS({marginBottom:10,background:C.white,border:`1px solid ${C.border}`,fontStyle:"normal",fontSize:12,color:C.ink,lineHeight:1.75,padding:"8px 10px"})}/>
                                <div style={{background:d.analyse?C.white:"#fef8f5",border:`1px solid ${d.analyse?C.border:"#f0c8b0"}`,borderLeft:`3px solid ${d.analyse?C.accent:"#e0a080"}`,padding:"12px 14px",marginBottom:8}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                                    <div style={{...scPV,color:C.accent}}>analyse & enjeux pour le ministère</div>
                                    <span style={{...scPV,color:C.accent,fontSize:8}}>· éditable</span>
                                    {isGen
                                      ?<span style={{fontSize:10,color:C.accent,fontStyle:"italic",marginLeft:"auto"}}>⟳ génération en cours…</span>
                                      :!d.analyse&&<span style={{fontSize:9,color:"#c07050",marginLeft:"auto",fontFamily:sans}}>non généré</span>
                                    }
                                  </div>
                                  {!d.analyse&&!isGen
                                    ?<div style={{fontSize:11,color:"#c07050",fontStyle:"italic",padding:"4px 0"}}>Cliquer sur ✦ générer dans la barre de gauche</div>
                                    :<textarea value={d.analyse||""} onChange={e=>pvUpdateData(a.id,"analyse",e.target.value)} rows={5}
                                      placeholder=""
                                      style={taS({background:"transparent",border:"none",fontStyle:"italic",fontSize:12,lineHeight:1.75,padding:0})}/>
                                  }
                                </div>
                                <div style={{background:d.raccord&&d.raccord!=="pas de raccord possible"?"#fef9c3":d.raccord==="pas de raccord possible"?"#f8f8f5":C.panelSoft,border:`1px solid ${d.raccord&&d.raccord!=="pas de raccord possible"?"#fde68a":C.border}`,borderLeft:`3px solid ${d.raccord&&d.raccord!=="pas de raccord possible"?"#d97706":d.raccord==="pas de raccord possible"?"#bbb":C.border}`,padding:"9px 12px",marginBottom:8}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                                    <div style={{...scPV,color:d.raccord&&d.raccord!=="pas de raccord possible"?"#92400e":C.muted}}>↔ raccord agenda <span style={{fontSize:8}}>· éditable</span></div>
                                    {!d.raccord&&!isGen&&<span style={{fontSize:9,color:"#c07050",marginLeft:"auto",fontFamily:sans}}>non généré</span>}
                                    {d.raccord==="pas de raccord possible"&&<span style={{fontSize:9,color:"#bbb",marginLeft:"auto",fontFamily:sans}}>aucun raccord</span>}
                                  </div>
                                  {!d.raccord&&!isGen
                                    ?<div style={{fontSize:11,color:"#c07050",fontStyle:"italic"}}>Cliquer sur ✦ générer</div>
                                    :<textarea value={d.raccord||""} onChange={e=>pvUpdateData(a.id,"raccord",e.target.value)} rows={2}
                                      placeholder="" style={taS({background:"transparent",border:"none",fontSize:12,fontStyle:"normal",color:d.raccord&&d.raccord!=="pas de raccord possible"?"#451a03":"#888",lineHeight:1.6,padding:0})}/>
                                  }
                                </div>
                                <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.ink}`,padding:"12px 14px"}}>
                                  <div style={{...scPV,marginBottom:8}}>pourquoi actionnable ? <span style={{color:C.accent,fontSize:8}}>· éditable</span></div>
                                  <textarea value={d.actionnable||""} onChange={e=>pvUpdateData(a.id,"actionnable",e.target.value)} rows={3}
                                    placeholder="Saisir…" style={taS({background:"transparent",border:"none",fontStyle:"normal",fontSize:12,lineHeight:1.75,padding:0})}/>
                                </div>
                              </div>
                            );
                          })}
                          {exts.map((e,ei)=>{
                            const d=pvArticleData[e.id]||{};
                            const extIsFirst=arts.length===0&&ei===0;
                            const extIsLast=ei===exts.length-1;
                            return(
                              <div key={e.id} style={{background:"#fffef5",border:`1px solid #e5dfc8`,borderLeft:`3px solid #d97706`,padding:"12px 14px",marginBottom:8}}>
                                <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:8}}>
                                  <span style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:"#92400e",fontFamily:sans}}>externe</span>
                                  <button onClick={()=>pvMoveExtItem(e.id,sec.id,"up")} disabled={extIsFirst} style={{fontSize:11,background:"none",border:`1px solid ${extIsFirst?"#e5dfc8":C.muted}`,color:extIsFirst?"#e5dfc8":C.muted,padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700,cursor:extIsFirst?"default":"pointer"}} title="Monter">↑</button>
                                  <button onClick={()=>pvMoveExtItem(e.id,sec.id,"down")} disabled={extIsLast} style={{fontSize:11,background:"none",border:`1px solid ${extIsLast?"#e5dfc8":C.muted}`,color:extIsLast?"#e5dfc8":C.muted,padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700,cursor:extIsLast?"default":"pointer"}} title="Descendre">↓</button>
                                  <select onChange={el=>{if(el.target.value){pvMoveToSection(e.id,sec.id,el.target.value,"ext");el.target.value="";}}} defaultValue=""
                                    style={{fontSize:9,border:`1px solid #e5dfc8`,background:C.white,color:C.muted,padding:"2px 4px",outline:"none",letterSpacing:".04em",textTransform:"uppercase",borderRadius:2,fontFamily:sans}}>
                                    <option value="">→ déplacer vers…</option>
                                    {pvSections.filter(s=>s.id!==sec.id).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                                  </select>
                                  <button onClick={()=>pvRemoveExternal(sec.id,e.id)} style={{marginLeft:"auto",fontSize:14,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,opacity:.35,lineHeight:1}} onMouseEnter={el=>el.currentTarget.style.opacity=1} onMouseLeave={el=>el.currentTarget.style.opacity=.35}>×</button>
                                </div>
                                <input value={d.title||e.title||""} onChange={el=>pvUpdateData(e.id,"title",el.target.value)} placeholder="Titre…"
                                  style={inpS({fontFamily:serif,fontSize:14,fontWeight:700,color:C.accent,width:"100%",borderBottom:`1px dashed #e5dfc8`,marginBottom:4,paddingBottom:2})}/>
                                <input value={e.url||""} onChange={el=>pvUpdateExternal(sec.id,e.id,"url",el.target.value)} placeholder="URL (optionnel)"
                                  style={inpS({fontSize:10,color:C.accent,width:"100%",borderBottom:`1px dashed #e5dfc8`,marginBottom:6})}/>
                                <div style={{display:"flex",gap:8,marginBottom:8}}>
                                  <input value={e.source} onChange={el=>pvUpdateExternal(sec.id,e.id,"source",el.target.value)} placeholder="Source"
                                    style={inpS({flex:1,fontSize:10,color:C.muted,borderBottom:`1px dashed #e5dfc8`})}/>
                                  <input value={e.date} onChange={el=>pvUpdateExternal(sec.id,e.id,"date",el.target.value)} placeholder="Date"
                                    style={inpS({width:90,fontSize:10,color:C.muted,borderBottom:`1px dashed #e5dfc8`})}/>
                                </div>
                                <div style={{height:1,background:"#e5dfc8",marginBottom:8}}/>
                                <div style={{...scPV,marginBottom:4}}>résumé / contenu</div>
                                <textarea value={d.resume||e.summary||""} onChange={el=>pvUpdateData(e.id,"resume",el.target.value)} rows={3}
                                  placeholder="Coller ou saisir le contenu…" style={taS({marginBottom:6,background:"white",fontStyle:"normal",fontSize:11,border:`1px dashed #e5dfc8`})}/>
                                <div style={{background:C.white,border:`1px solid #e5dfc8`,borderLeft:`3px solid ${C.accent}`,padding:"9px 12px",marginBottom:6}}>
                                  <div style={{...scPV,color:C.accent,marginBottom:5}}>analyse & enjeux pour le ministère</div>
                                  <textarea value={d.analyse||""} onChange={el=>pvUpdateData(e.id,"analyse",el.target.value)} rows={3}
                                    placeholder="Saisir l'analyse…" style={taS({background:"transparent",border:"none",fontStyle:"italic"})}/>
                                </div>
                                <div style={{background:C.white,border:`1px solid #e5dfc8`,borderLeft:`3px solid ${C.ink}`,padding:"9px 12px",marginBottom:6}}>
                                  <div style={{...scPV,marginBottom:5}}>pourquoi actionnable ?</div>
                                  <textarea value={d.actionnable||""} onChange={el=>pvUpdateData(e.id,"actionnable",el.target.value)} rows={2}
                                    placeholder="Saisir…" style={taS({background:"transparent",border:"none",fontStyle:"normal"})}/>
                                </div>
                                <div style={{background:"#fffef5",border:`1px dashed #e5dfc8`,padding:"7px 10px"}}>
                                  <div style={{...scPV,fontSize:9,marginBottom:3}}>image pour le Word (optionnel)</div>
                                  {d.imageData
                                    ?<div style={{position:"relative"}}>
                                        <img src={d.imageData} alt="" style={{maxWidth:"100%",maxHeight:80,display:"block",objectFit:"contain"}}/>
                                        <button onClick={()=>pvUpdateData(e.id,"imageData",null)} style={{position:"absolute",top:2,right:2,fontSize:10,background:C.ink,color:C.white,border:"none",cursor:"pointer",padding:"1px 5px",borderRadius:2}}>× suppr.</button>
                                      </div>
                                    :<label style={{cursor:"pointer",fontSize:11,color:C.muted,fontStyle:"italic",display:"block",textAlign:"center",padding:"4px 0"}}>
                                        glisser une image · ou <span style={{color:C.accent,textDecoration:"underline"}}>parcourir</span>
                                        <input type="file" accept="image/*" style={{display:"none"}} onChange={ev=>{const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev2=>pvUpdateData(e.id,"imageData",ev2.target.result);r.readAsDataURL(f);}}/>
                                      </label>
                                  }
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                    <button onClick={()=>pvAddExternalAt(sec.id,"bottom")} style={{width:"100%",marginTop:5,padding:"5px",border:`1px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:9,letterSpacing:".08em",textTransform:"uppercase",fontFamily:sans,borderRadius:2}}>
                      + article externe ↓
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{borderTop:`3px double ${C.ink}`,padding:"10px 24px",display:"flex",justifyContent:"space-between",background:C.panelSoft}}>
              <div style={{...scPV}}>{pvTitre} · usage interne</div>
              <div style={{...scPV}}>{pvNumero} · {pvSemaine}</div>
            </div>
          </div>
          <div style={{maxWidth:800,margin:"14px auto 0",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:C.white,border:`1px solid ${C.border}`,padding:"6px 12px",fontSize:11,color:C.muted,fontFamily:sans}}>
              <span>couleur du Word</span>
              <input type="color" value={pvWordColor} onChange={e=>setPvWordColor(e.target.value)}
                style={{width:28,height:22,border:`1px solid ${C.border}`,cursor:"pointer",padding:1,borderRadius:2}}/>
              <span style={{fontSize:10,fontFamily:"monospace",color:C.muted}}>{pvWordColor}</span>
            </div>
            <button onClick={pvExport}
              style={{fontFamily:serif,fontStyle:"italic",fontWeight:700,fontSize:13,padding:"10px 24px",background:C.ink,color:C.white,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
              onMouseEnter={e=>e.currentTarget.style.background=C.accent} onMouseLeave={e=>e.currentTarget.style.background=C.ink}>
              ↓ exporter en Word (.doc)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:C.page,fontFamily:sans,color:C.text}}>
      {toast&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.ink,color:C.white,padding:"9px 20px",fontSize:12,letterSpacing:".04em",fontFamily:sans,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0,display:"inline-block"}}/>
          {toast}
        </div>
      )}

      {selectedItem&&(
        <div onClick={()=>setSelectedId(null)} style={{position:"fixed",inset:0,background:"rgba(24,16,8,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.white,border:`1px solid ${C.border}`,maxWidth:700,width:"100%",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative"}}>
            <button onClick={()=>setSelectedId(null)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:24,lineHeight:1}}>×</button>
            {selectedItem.date&&<div style={{...sc(),fontSize:10,marginBottom:8}}>{selectedItem.date}{selectedItem.documentType?` · ${selectedItem.documentType}`:""}</div>}
            <span style={{display:"inline-block",borderRadius:2,padding:"3px 9px",fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:14,...sp(selectedItem.relevanceScore)}}>pertinence {Math.round((selectedItem.relevanceScore||0)/20)||0}/5</span>
            <div style={{fontFamily:serif,fontSize:30,lineHeight:1.15,fontWeight:700,color:C.ink,marginBottom:6}}>{selectedItem.title}</div>
            <div style={{height:2,background:C.ink,marginBottom:14}}/>
            <div style={{...sc(),marginBottom:16}}>{selectedItem.source}{selectedItem.institution?` · ${selectedItem.institution}`:""}</div>
            {(selectedItem.keywords||[]).length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{...sc(),marginBottom:8}}>concepts clés</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selectedItem.keywords||[]).map(k=><span key={k} style={{background:C.chip,color:C.chipText,borderRadius:2,padding:"5px 10px",fontSize:12,fontFamily:sans}}>{k}</span>)}</div>
              </div>
            )}
            {String(selectedItem.summary||"").split(/\n+/).filter(Boolean).map((p,i)=><p key={i} style={{fontSize:15,lineHeight:1.85,color:C.text,marginBottom:12,fontFamily:sans}}>{p}</p>)}
            {(selectedItem.innovations||[]).length>0&&(
              <div style={{marginTop:14,marginBottom:14}}>
                <div style={{...sc(),marginBottom:8}}>innovations</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selectedItem.innovations||[]).map(k=><span key={k} style={{background:C.noteBg,color:C.noteText,borderRadius:2,padding:"5px 10px",fontSize:12,fontFamily:sans}}>{k}</span>)}</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:18}}>
              {[["signal faible",selectedItem.weakSignal],["impact stratégique",selectedItem.strategicImpact]].map(([l,v])=>(
                <div key={l} style={{padding:14,background:C.panelSoft,border:`1px solid ${C.border}`}}>
                  <div style={sc()}>{l}</div>
                  <div style={{marginTop:8,lineHeight:1.7,fontSize:14,fontFamily:sans}}>{v||"non renseigné"}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:14,background:C.panelSoft,border:`1px solid ${C.border}`}}>
              <div style={sc()}>angle d'exploitation</div>
              <div style={{marginTop:8,lineHeight:1.8,fontSize:14,fontFamily:sans}}>{selectedItem.exploitationAngle||"aucun angle disponible."}</div>
            </div>
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

     <div style={{
  maxWidth: tab === "graphe" ? 1680 : 1400,
  margin: "0 auto",
  padding: tab === "graphe" ? 18 : 26,
}}>
  <div style={{
    display: "grid",
    gridTemplateColumns: tab === "graphe" ? "1fr" : "270px 1fr",
    border: `1px solid ${C.border}`,
    minHeight: 820,
  }}>

<aside style={{
  borderRight: `2px solid ${C.ink}`,
  background: C.panelSoft,
  display: tab === "graphe" ? "none" : "flex",
  flexDirection: "column",
}}>
<div style={{
  padding: "22px 20px 18px",
  borderBottom: `4px double ${C.ink}`,
  background: C.page,
  textAlign: "center"
}}>
<img
  src={`${import.meta.env.BASE_URL}veilleur-studio-logo.png`}
  alt="Veilleur Studio"
  style={{
    width: "100%",
    maxWidth: 310,
    display: "block",
    margin: "0 auto 10px",
    objectFit: "contain"
  }}
/>

  <div style={{
    height: 1,
    background: C.border,
    margin: "12px 0 10px"
  }} />

  <div style={{
    fontFamily: sans,
    fontSize: 9,
    letterSpacing: ".15em",
    textTransform: "uppercase",
    color: C.muted
  }}>
    Stratégie · veille · innovation
  </div>
</div>
            <div style={{background:C.ink,padding:"10px 22px"}}>
              <div style={{...sc(),fontSize:9,color:"#9a8f7a"}}>édition du jour</div>
              <div style={{fontFamily:serif,fontSize:14,color:C.white,marginTop:2}}>{todayLong}</div>
              <div style={{fontSize:10,color:"#7a7060",marginTop:2,letterSpacing:".06em"}}>{pubCount} production{pubCount!==1?"s":""} · {evtCount} événement{evtCount!==1?"s":""} · {rss.length} source{rss.length!==1?"s":""}</div>
            </div>
            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>thèmes</div>
              {allThemes.map(t=>(
                <button key={t} onClick={()=>setSelTheme(t)} style={btn(selTheme===t)}>
                  <span>{t}</span>
                  <span style={{fontSize:10,opacity:.55}}>{t==="toutes"?items.filter(i=>!dismissed.has(i.id)&&!isEv(i)).length:items.filter(i=>!dismissed.has(i.id)&&(i.themes||[]).includes(t)).length}</span>
                </button>
              ))}
            </div>
            {upcoming.length>0&&(
              <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{...sc(),marginBottom:10}}>prochains événements</div>
                {upcoming.map(ev=>{
                  const ts=AGENDA_TAG_S[ev.tag]||AGENDA_TAG_S["veille"];
                  return(
                    <div key={ev.id} onClick={()=>{setTab("agenda");setSelDay(ev.date);const d=new Date(ev.date+"T00:00:00");setCalY(d.getFullYear());setCalM(d.getMonth());}} style={{marginBottom:9,cursor:"pointer",paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:C.accent,marginBottom:2,fontFamily:sans}}>{fsFR(ev.date)}</div>
                      <div style={{fontFamily:serif,fontSize:13,lineHeight:1.3,color:C.ink,marginBottom:3}}>{ev.title}</div>
                      <span style={{display:"inline-block",fontSize:9,padding:"1px 6px",borderRadius:2,fontFamily:sans,...ts}}>{ev.tag}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {sbSignals.length>0&&(
              <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{...sc(),marginBottom:10}}>signaux faibles</div>
                {sbSignals.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
                    <span style={{width:16,height:1,background:C.accent,flexShrink:0,marginTop:8}}/>
                    <span style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.5,color:C.text}}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {topQuote&&(
              <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`}}>
                <div style={{fontFamily:serif,fontStyle:"italic",fontSize:12,lineHeight:1.6,color:C.ink}}>« {topQuote.text} »</div>
                {topQuote.attr&&<div style={{...sc(),fontSize:9,marginTop:6}}>angle · {topQuote.attr}</div>}
              </div>
            )}
            <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{...sc(),marginBottom:10}}>trier par</div>
              {[["relevance","pertinence"],["date","date"],["title","titre"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={btn(sortBy===v,{justifyContent:"flex-start"})}>{l}</button>
              ))}
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
  {[
  ["productions", pubCount],
  ["événements", evtCount],
  ["agenda", events.length],
  ["signaux faibles", signals.filter(s => s.status !== "confirmé").length],
  ["experts", experts.length],
  ["produire", ""],
  ["point veille", ""],
  ["graphe", graphSelectedIds.size],
  ["dossiers", folders.length],
]
  ].map(([key, count]) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        padding: "10px 11px",
        background: "none",
        border: "none",
        borderBottom: tab === key ? `2px solid ${C.ink}` : "2px solid transparent",
        marginBottom: -1,
        color: tab === key ? C.ink : C.muted,
        cursor: "pointer",
        fontSize: 12,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        fontFamily: sans,
        fontWeight: tab === key ? 500 : 400,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {key}
      {count !== "" && (
        <span
          style={{
            background: C.chip,
            color: C.chipText,
            borderRadius: 2,
            padding: "1px 6px",
            fontSize: 10,
            textTransform: "none",
            letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      )}
    </button>
  ))}

  {!["agenda", "signaux faibles", "experts", "produire", "point veille", "graphe"].includes(tab) && (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="rechercher dans le digest…"
      style={{
        marginLeft: "auto",
        border: "none",
        background: "transparent",
        outline: "none",
        color: C.accent,
        fontSize: 12,
        fontFamily: serif,
        fontStyle: "italic",
        padding: "10px 0",
        width: 190,
      }}
    />
  )}
</div>

            {tab==="agenda"        ? <AgendaView/>
:tab==="signaux faibles"? <SignauxView/>
:tab==="experts"       ? <ExpertsView/>
:tab==="produire"      ? <ProduireView/>
:tab==="point veille"  ? <PointVeilleView/>
:tab==="graphe"       ? <GrapheView/>
:(
            
              <>
                {tab==="productions"&&(
  <div style={{padding:"8px 22px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`,background:C.panelSoft,flexWrap:"wrap"}}>
    <span style={{fontFamily:serif,fontStyle:"italic",fontSize:12,color:pvSelectedForPV.size>0?C.accent:C.muted}}>
      {pvSelectedForPV.size>0?`${pvSelectedForPV.size} article${pvSelectedForPV.size>1?"s":""} sélectionné${pvSelectedForPV.size>1?"s":""} pour le Point Veille`:"Cocher les articles à inclure dans le Point Veille"}
    </span>

    <span style={{fontFamily:serif,fontStyle:"italic",fontSize:12,color:graphSelectedIds.size>0?C.green:C.muted,borderLeft:`1px solid ${C.border}`,paddingLeft:10}}>
      {graphSelectedIds.size>0?`${graphSelectedIds.size} article${graphSelectedIds.size>1?"s":""} sélectionné${graphSelectedIds.size>1?"s":""} pour le Graphe`:"Cocher “Graphe” pour préparer un graphe"}
    </span>

    <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
      <button
        onClick={()=>setPvSelectedForPV(new Set(visibleItems.map(i=>i.id)))}
        style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans}}
      >
        tout cocher PV
      </button>

      {pvSelectedForPV.size>0&&(
        <button
          onClick={()=>setPvSelectedForPV(new Set())}
          style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans}}
        >
          décocher PV
        </button>
      )}

      <button
        onClick={()=>setGraphSelectedIds(new Set(visibleItems.filter(i=>!isEv(i)).map(i=>i.id)))}
        style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans}}
      >
        tout cocher Graphe
      </button>

      {graphSelectedIds.size>0&&(
        <button
          onClick={()=>setGraphSelectedIds(new Set())}
          style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 10px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans}}
        >
          décocher Graphe
        </button>
      )}

      {pvSelectedForPV.size>0&&(
        <button
          onClick={()=>setTab("point veille")}
          style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 14px",border:"none",background:C.accent,color:C.white,cursor:"pointer",borderRadius:2,fontFamily:sans,fontWeight:500}}
        >
          → Point Veille ({pvSelectedForPV.size})
        </button>
      )}

      {graphSelectedIds.size>0&&(
        <button
          onClick={()=>setTab("graphe")}
          style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",padding:"3px 14px",border:"none",background:C.green,color:C.white,cursor:"pointer",borderRadius:2,fontFamily:sans,fontWeight:500}}
        >
         → Graphe ({graphSelectedIds.size})
        </button>
      )}
    </div>
  </div>
)}

<div style={{flex:1,padding:"20px 22px",overflowY:"auto"}}>
  {items.length===0
    ? <div style={{textAlign:"center",padding:60,...sc()}}>chargement en cours…</div>
    : visibleItems.length===0
      ? <div style={{textAlign:"center",padding:60,...sc()}}>aucune production correspondante</div>
      : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:0}}>
          {visibleItems.map(item=><Card key={item.id} item={item}/>)}
        </div>
  }
</div>

<div style={{borderTop:`3px double ${C.ink}`,display:"grid",gridTemplateColumns:"repeat(4, 1fr)",textAlign:"center",padding:"12px 10px",background:C.panel}}>
  {[
    [items.filter(i=>!dismissed.has(i.id)).length,"productions"],
    [favoriteIds.size,"favoris"],
    [rss.length,"sources"],
    [noteIds.size,"en note"]
  ].map(([n,l])=>(
    <div key={l}>
      <div style={{fontFamily:serif,fontSize:22,color:C.ink}}>{n}</div>
      <div style={{...sc(),fontSize:9}}>{l}</div>
    </div>
  ))}
</div>
</>
)}
          </main>
        </div>
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
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbbfa8;border-radius:2px;}
        button:focus{outline:none;}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer;}
        textarea{resize:vertical;font-family:inherit;}
      `}</style>
    </div>
  );
}
