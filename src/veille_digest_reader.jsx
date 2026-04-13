import React, { useState, useRef } from "react";

const C = {
  page:"#f2efe8", panel:"#e7e0d0", panelSoft:"#ede7d8",
  border:"#cbbfa8", muted:"#7a6f5c", accent:"#8a4b22",
  ink:"#18180f", white:"#fffdf8",
};
const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', sans-serif";

const FAKE_ARTICLES = [
  { id:"a1", title:"Trafic de stupéfiants : volumes saisis dans les aéroports parisiens ont plus que doublé", source:"Tribunal de Paris", date:"1 avr 2026", url:"https://example.com", summary:"Les saisies dans les aéroports parisiens ont plus que doublé par rapport à 2024. Le tribunal judiciaire souligne les défis structurels pour la PAF, les douanes et les services judiciaires dans les points de transit aéroportuaire." },
  { id:"a2", title:"Droit d'auteur et IA générative : le Parlement européen adopte le rapport Voss", source:"Parlement européen", date:"31 mars 2026", url:"https://example.com", summary:"Le rapport Voss propose un cadre réglementaire équilibrant droits des créateurs et impératifs d'innovation." },
  { id:"a3", title:"Terrorisme djihadiste : mineurs français attirés par une propagande adaptée à leur génération", source:"DGSI", date:"1 avr 2026", url:"https://example.com", summary:"La DGSI alerte sur la recrudescence d'une propagande djihadiste adaptée aux codes numériques de la jeunesse française." },
  { id:"a4", title:"Bilan d'activité de la Chaire HiGeSeT — Année 2025", source:"Gendarmerie nationale", date:"31 mars 2026", url:"https://example.com", summary:"Le bilan 2025 de la Chaire HiGeSeT couvre les travaux de recherche sur la haute gouvernance et sécurité territoriale." },
  { id:"a5", title:"L'interprète de l'Ofpra travaillait pour le renseignement rwandais", source:"Intelligence Online", date:"1 avr 2026", url:"https://example.com", summary:"Une note blanche de la DGSI révèle qu'un interprète de l'Ofpra était lié aux services de renseignement rwandais." },
];

const scS = (x={}) => ({fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:C.muted,fontFamily:sans,...x});
const inpS = (x={}) => ({border:"none",outline:"none",background:"transparent",fontFamily:"inherit",color:"inherit",...x});
const taS  = (x={}) => ({width:"100%",border:`1px dashed ${C.border}`,outline:"none",background:"transparent",fontFamily:sans,fontSize:11,color:C.ink,lineHeight:1.7,padding:"5px 7px",resize:"vertical",...x});

function ArticleBloc({item, data, onUpdate, onMove, onRemove, sections, sectionId, isFirst, isLast}){
  const fileRef = useRef();
  return(
    <div style={{background:item.id.startsWith("ext_")?"#fffef5":C.panelSoft,border:`1px solid ${item.id.startsWith("ext_")?"#e5dfc8":C.border}`,borderLeft:`3px solid ${item.id.startsWith("ext_")?"#d97706":C.accent}`,padding:"12px 14px",marginBottom:8}}>

      {/* CONTRÔLES */}
      <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:8}}>
        {item.id.startsWith("ext_")&&<span style={scS({color:"#92400e"})}>externe</span>}
        <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
          <button onClick={()=>onMove("up")} disabled={isFirst} title="Monter"
            style={{fontSize:11,background:"none",border:`1px solid ${isFirst?C.border:C.muted}`,color:isFirst?C.border:C.muted,cursor:isFirst?"default":"pointer",padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700}}>↑</button>
          <button onClick={()=>onMove("down")} disabled={isLast} title="Descendre"
            style={{fontSize:11,background:"none",border:`1px solid ${isLast?C.border:C.muted}`,color:isLast?C.border:C.muted,cursor:isLast?"default":"pointer",padding:"1px 7px",lineHeight:1.4,borderRadius:2,fontWeight:700}}>↓</button>
          <select onChange={e=>{if(e.target.value)onMove("to",e.target.value);}} value=""
            style={{fontSize:9,border:`1px solid ${C.border}`,background:C.white,color:C.muted,padding:"2px 4px",cursor:"pointer",outline:"none",letterSpacing:".04em",textTransform:"uppercase",borderRadius:2}}>
            <option value="">→ déplacer vers…</option>
            {sections.filter(s=>s.id!==sectionId).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={onRemove} style={{fontSize:14,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,opacity:.4,lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.4}>×</button>
        </div>
      </div>

      {/* TITRE ÉDITABLE */}
      <input value={data.title||(item.id.startsWith("ext_")?"":item.title)||""} onChange={e=>onUpdate("title",e.target.value)}
        style={inpS({fontFamily:serif,fontSize:14,fontWeight:700,color:C.accent,width:"100%",borderBottom:`1px dashed ${C.border}`,marginBottom:3,paddingBottom:2})}
        placeholder={item.id.startsWith("ext_")?"Titre de l'article…":item.title}/>
      <div style={scS({marginBottom:8})}>{item.source||""} · {item.date||""}</div>
      <div style={{height:1,background:C.border,marginBottom:8}}/>

      {/* RÉSUMÉ */}
      <div style={scS({marginBottom:4})}>résumé</div>
      <textarea value={data.resume||(item.id.startsWith("ext_")?"":item.summary)||""} onChange={e=>onUpdate("resume",e.target.value)} rows={3}
        style={taS({marginBottom:8})} placeholder={item.id.startsWith("ext_")?"Coller ou saisir le résumé…":""}/>

      {/* ANALYSE */}
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"9px 12px",marginBottom:6}}>
        <div style={scS({color:C.accent,marginBottom:4})}>analyse & enjeux pour le ministère</div>
        <textarea value={data.analyse||""} onChange={e=>onUpdate("analyse",e.target.value)} rows={3}
          placeholder={item.id.startsWith("ext_")?"Saisir l'analyse…":"Généré par Claude au dépôt — modifiable…"}
          style={taS({background:"transparent",border:"none",fontStyle:"italic"})}/>
      </div>

      {/* RACCORD */}
      <div style={{background:"#faeeda",border:`1px solid ${C.border}`,borderLeft:"3px solid #854f0b",padding:"7px 10px",marginBottom:6}}>
        <div style={scS({color:"#854f0b",marginBottom:3})}>↔ raccord agenda</div>
        <textarea value={data.raccord||""} onChange={e=>onUpdate("raccord",e.target.value)} rows={1}
          placeholder="Généré par Claude — modifiable…"
          style={taS({background:"transparent",border:"none",fontSize:11})}/>
      </div>

      {/* POURQUOI ACTIONNABLE */}
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.ink}`,padding:"9px 12px",marginBottom:6}}>
        <div style={scS({marginBottom:4})}>pourquoi actionnable ?</div>
        <textarea value={data.actionnable||""} onChange={e=>onUpdate("actionnable",e.target.value)} rows={2}
          placeholder="Saisir…" style={taS({background:"transparent",border:"none"})}/>
      </div>

      {/* IMAGE POUR WORD */}
      <div style={{border:`1px dashed ${C.border}`,padding:"8px 10px",background:C.page,borderRadius:2}}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{
          e.preventDefault();
          const file=e.dataTransfer.files[0];
          if(!file||!file.type.startsWith("image/")) return;
          const r=new FileReader();
          r.onload=ev=>{onUpdate("imageData",ev.target.result);onUpdate("imageName",file.name);};
          r.readAsDataURL(file);
        }}>
        <div style={scS({marginBottom:4})}>image pour le word (optionnel)</div>
        {data.imageData
          ?<div style={{position:"relative"}}>
            <img src={data.imageData} alt="aperçu" style={{maxWidth:"100%",maxHeight:100,display:"block",objectFit:"contain"}}/>
            <button onClick={()=>{onUpdate("imageData",null);onUpdate("imageName","");}}
              style={{position:"absolute",top:2,right:2,fontSize:10,background:C.ink,color:C.white,border:"none",cursor:"pointer",padding:"1px 6px",borderRadius:2}}>× suppr.</button>
            <div style={scS({marginTop:3,fontSize:8})}>{data.imageName}</div>
          </div>
          :<div onClick={()=>fileRef.current.click()} style={{cursor:"pointer",textAlign:"center",padding:"6px 0",fontSize:11,color:C.muted,fontStyle:"italic"}}>
            glisser une image ici · ou <span style={{color:C.accent,textDecoration:"underline"}}>parcourir</span>
          </div>
        }
        <input ref={fileRef} type="file" accept="image/*" onChange={e=>{
          const file=e.target.files[0];if(!file)return;
          const r=new FileReader();r.onload=ev=>{onUpdate("imageData",ev.target.result);onUpdate("imageName",file.name);};r.readAsDataURL(file);
        }} style={{display:"none"}}/>
      </div>
    </div>
  );
}

export default function PointVeilleV2(){
  const [sections, setSections] = useState([
    {id:"s1",label:"Actionnable",        items:[],externals:[]},
    {id:"s2",label:"Possiblement à préparer",  items:[],externals:[]},
    {id:"s3",label:"Nouveautés Centre de documentation",items:[],externals:[]},
    {id:"s4",label:"Actualité de l'ATE", items:[],externals:[]},
  ]);
  const [artData, setArtData] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const allPlaced = sections.flatMap(s=>[...s.items,...s.externals.map(e=>e.id)]);
  const pool = FAKE_ARTICLES.filter(a=>!allPlaced.includes(a.id));

  function updateArt(id, field, val){ setArtData(p=>({...p,[id]:{...p[id],[field]:val}})); }
  function updateSection(id, val){ setSections(p=>p.map(s=>s.id===id?{...s,label:val}:s)); }

  function drop(secId){
    if(!dragging) return;
    setSections(p=>p.map(s=>({...s,items:s.id===secId?[...s.items.filter(id=>id!==dragging),dragging]:s.items.filter(id=>id!==dragging)})));
    setDragging(null);setDragOver(null);
  }

  function moveItem(itemId, fromSecId, dir, idx, toSecId, type){
    setSections(prev=>{
      const next=prev.map(s=>({...s,items:[...s.items],externals:[...s.externals]}));
      const from=next.find(s=>s.id===fromSecId);
      if(!from) return prev;
      if(dir==="to"&&toSecId){
        const to=next.find(s=>s.id===toSecId);
        if(!to) return prev;
        if(type==="app"){ from.items=from.items.filter(id=>id!==itemId); to.items=[...to.items,itemId]; }
        else { const ext=from.externals.find(e=>e.id===itemId); from.externals=from.externals.filter(e=>e.id!==itemId); if(ext) to.externals=[...to.externals,ext]; }
      } else {
        const arr=type==="app"?from.items:from.externals;
        const i=type==="app"?arr.indexOf(itemId):arr.findIndex(e=>e.id===itemId);
        if(i<0) return prev;
        if(dir==="up"&&i>0){ [arr[i-1],arr[i]]=[arr[i],arr[i-1]]; }
        else if(dir==="down"&&i<arr.length-1){ [arr[i],arr[i+1]]=[arr[i+1],arr[i]]; }
      }
      return next;
    });
  }

  function removeItem(itemId, secId, type){
    setSections(p=>p.map(s=>{
      if(s.id!==secId) return s;
      return type==="app"?{...s,items:s.items.filter(id=>id!==itemId)}:{...s,externals:s.externals.filter(e=>e.id!==itemId)};
    }));
  }

  function addExternal(secId, pos){
    const id=`ext_${Date.now()}`;
    setArtData(p=>({...p,[id]:{title:"",resume:"",analyse:"",raccord:"",actionnable:"",imageData:null,imageName:""}}));
    setSections(p=>p.map(s=>{
      if(s.id!==secId) return s;
      const ext={id,source:"",date:"",url:""};
      return {...s,externals:pos==="top"?[ext,...s.externals]:[...s.externals,ext]};
    }));
  }

  return(
    <div style={{minHeight:"100vh",background:C.page,fontFamily:sans}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box}textarea,input{font-family:inherit}`}</style>

      <div style={{background:C.ink,padding:"8px 20px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"#9a8f7a"}}>prototype v2 · point veille hebdomadaire</span>
        <span style={{marginLeft:"auto",fontSize:10,color:"#7a7060"}}>↑↓ réordonner · → déplacer vers une autre rubrique · glisser depuis la liste</span>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:20,display:"grid",gridTemplateColumns:"260px 1fr",gap:20}}>

        {/* SIDEBAR */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={scS({paddingBottom:6,borderBottom:`1px solid ${C.border}`,marginBottom:4})}>articles disponibles · glisser</div>
          {pool.length===0
            ?<div style={{background:C.white,border:`1px solid ${C.border}`,padding:12,fontSize:11,color:C.muted,fontStyle:"italic",textAlign:"center"}}>tous les articles sont placés</div>
            :pool.map(a=>(
              <div key={a.id} draggable onDragStart={()=>setDragging(a.id)} onDragEnd={()=>{setDragging(null);setDragOver(null);}}
                style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:"9px 11px",cursor:"grab",opacity:dragging===a.id?.4:1,userSelect:"none",transition:"opacity .12s"}}>
                <div style={{fontFamily:serif,fontSize:12,color:C.ink,lineHeight:1.3,marginBottom:3}}>{a.title}</div>
                <div style={scS({fontSize:8})}>{a.source} · {a.date}</div>
                <div style={scS({fontSize:8,color:C.accent,marginTop:2})}>⠿ glisser</div>
              </div>
            ))
          }
        </div>

        {/* DOCUMENT */}
        <div style={{background:C.white,border:`1px solid ${C.border}`,boxShadow:"0 4px 20px rgba(0,0,0,.08)"}}>
          <div style={{background:C.page,padding:"22px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`4px double ${C.ink}`}}>
            <div>
              <div style={{fontFamily:serif,fontSize:30,fontWeight:900,color:C.ink,letterSpacing:-1,lineHeight:.9}}>Point Veille</div>
              <div style={{fontFamily:serif,fontSize:30,fontWeight:900,color:C.ink,letterSpacing:-1,marginBottom:4}}>Hebdomadaire</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={scS({marginBottom:3})}>Vendredi 10 avril 2026</div>
              <div style={{fontFamily:serif,fontSize:18,fontWeight:700,color:C.ink,marginBottom:6}}>N° 1</div>
              <svg width="80" height="80" viewBox="0 0 90 90">
                {[38,28,18,9].map((r,i)=><circle key={r} cx="45" cy="45" r={r} fill="none" stroke={C.accent} strokeWidth={i===0?1:1.2} opacity={0.2+i*0.18}/>)}
                <path d="M45,45 L45,7 A38,38 0 0,1 78,60 Z" fill={C.accent} opacity=".18"/>
                <path d="M45,45 L45,7 A38,38 0 0,1 63,74 Z" fill={C.accent} opacity=".10"/>
                {[0,45,90,135].map((a,i)=>{const r=Math.PI*a/180;return<line key={i} x1={45+38*Math.cos(r-Math.PI/2)} y1={45+38*Math.sin(r-Math.PI/2)} x2={45-38*Math.cos(r-Math.PI/2)} y2={45-38*Math.sin(r-Math.PI/2)} stroke={C.accent} strokeWidth=".7" opacity=".3"/>;})}
                <circle cx="58" cy="24" r="3.5" fill={C.accent} opacity=".9"/>
                <circle cx="58" cy="24" r="7" fill="none" stroke={C.accent} strokeWidth="1" opacity=".5"/>
                <circle cx="34" cy="52" r="2.5" fill={C.accent} opacity=".7"/>
                <circle cx="62" cy="48" r="2" fill={C.accent} opacity=".6"/>
                <circle cx="45" cy="45" r="3.5" fill={C.ink}/>
                <circle cx="45" cy="45" r="1.5" fill={C.accent}/>
                <line x1="45" y1="45" x2="45" y2="7" stroke={C.accent} strokeWidth="1.5" opacity=".8"/>
              </svg>
            </div>
          </div>

          <div style={{margin:"12px 24px 0",padding:"7px 12px",background:C.panelSoft,border:`1px solid ${C.border}`,fontSize:11,color:C.muted,fontStyle:"italic"}}>
            Les titres des articles sont cliquables et renvoient vers la source originale.
          </div>

          <div style={{padding:"16px 24px"}}>
            {sections.map((sec,si)=>{
              const arts=sec.items.map(id=>FAKE_ARTICLES.find(a=>a.id===id)).filter(Boolean);
              const allBlocs=[...sec.items.map(id=>({type:"app",id})),...sec.externals.map(e=>({type:"ext",id:e.id}))];
              const isOver=dragOver===sec.id;
              return(
                <div key={sec.id} style={{marginBottom:26}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,paddingBottom:7,borderBottom:`2px solid ${C.ink}`}}>
                    <span style={{fontFamily:serif,fontSize:20,fontWeight:900,color:C.border}}>0{si+1}</span>
                    <input value={sec.label} onChange={e=>updateSection(sec.id,e.target.value)}
                      style={inpS({fontFamily:serif,fontSize:16,fontWeight:700,color:C.ink,flex:1})} placeholder="Nom de la rubrique"/>
                    <button onClick={()=>addExternal(sec.id,"top")}
                      style={{fontSize:9,letterSpacing:".07em",textTransform:"uppercase",padding:"3px 9px",border:`1px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",borderRadius:2,fontFamily:sans}}>+ art. externe ↑</button>
                  </div>

                  <div onDragOver={e=>{e.preventDefault();setDragOver(sec.id);}} onDragLeave={()=>setDragOver(null)} onDrop={()=>drop(sec.id)}
                    style={{minHeight:50,border:isOver?`2px dashed ${C.accent}`:`1px dashed ${C.border}`,borderRadius:3,padding:isOver?"6px":"3px",background:isOver?"#f9ede5":"transparent",transition:"all .15s"}}>
                    {allBlocs.length===0
                      ?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:44,fontSize:11,color:C.muted,fontStyle:"italic"}}>
                          {dragging?"⬇ déposer ici":"aucun article — glisser ou + article externe"}
                        </div>
                      :allBlocs.map((bl,bi)=>{
                        const isApp=bl.type==="app";
                        const item=isApp?FAKE_ARTICLES.find(a=>a.id===bl.id):sec.externals.find(e=>e.id===bl.id);
                        if(!item) return null;
                        const d=artData[bl.id]||{};
                        return(
                          <ArticleBloc key={bl.id}
                            item={{...item,id:bl.id}} data={d}
                            onUpdate={(f,v)=>updateArt(bl.id,f,v)}
                            onMove={(dir,to)=>moveItem(bl.id,sec.id,dir,bi,to,bl.type)}
                            onRemove={()=>removeItem(bl.id,sec.id,bl.type)}
                            sections={sections} sectionId={sec.id}
                            isFirst={bi===0} isLast={bi===allBlocs.length-1}
                          />
                        );
                      })
                    }
                  </div>

                  <button onClick={()=>addExternal(sec.id,"bottom")}
                    style={{width:"100%",marginTop:6,padding:"5px",border:`1px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:9,letterSpacing:".08em",textTransform:"uppercase",fontFamily:sans,borderRadius:2}}>
                    + article externe ↓
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{borderTop:`3px double ${C.ink}`,padding:"10px 24px",display:"flex",justifyContent:"space-between",background:C.panelSoft}}>
            <div style={scS()}>Point Veille Hebdomadaire · usage interne</div>
            <div style={scS()}>N° 1 · Vendredi 10 avril 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

