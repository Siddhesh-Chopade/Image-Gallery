const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let data=[], filtered=[], page=1, perPage=24, activeView="all", activeCat="all", query="", sortMode="featured";
let favorites=new Set(JSON.parse(localStorage.getItem("gp-favorites")||"[]"));
let recent=JSON.parse(localStorage.getItem("gp-recent")||"[]"), selected=new Set(), selecting=false, currentIndex=0;
let editState={filter:"none",brightness:100,contrast:100,saturation:100,blur:0,rotate:0,flip:1,frame:"none",bg:"transparent",ratio:"free"};
let collageLayout="grid";
let studio3d={depth:35,rx:-8,ry:-20,rz:0,glow:30,bg:"#101329",color:"#8b5cf6"};

fetch("assets/manifest.json").then(r=>r.json()).then(m=>{data=m.images; render()}).catch(()=>toast("Could not load the image library."));

function saveFav(){localStorage.setItem("gp-favorites",JSON.stringify([...favorites]));$("#favCount").textContent=favorites.size}
function saveRecent(){localStorage.setItem("gp-recent",JSON.stringify(recent.slice(0,30)))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove("show"),2200)}
function getFiltered(){
 let arr=[...data];
 if(activeView==="favorites") arr=arr.filter(x=>favorites.has(x.id));
 if(activeView==="recent") arr=arr.filter(x=>recent.includes(x.id)).sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
 if(activeView==="horror") arr=arr.filter(x=>x.category==="Horror");
 if(activeCat!=="all") arr=arr.filter(x=>x.category===activeCat);
 if(activeCat==="ghost") arr=arr.filter(x=>x.kind==="ghost");
 if(query){const q=query.toLowerCase();arr=arr.filter(x=>(x.title+" "+x.category+" "+x.kind).toLowerCase().includes(q))}
 if(sortMode==="newest") arr.reverse();
 if(sortMode==="az") arr.sort((a,b)=>a.title.localeCompare(b.title));
 if(sortMode==="random") arr.sort(()=>Math.random()-.5);
 return arr;
}
function render(){
 filtered=getFiltered(); const pages=Math.max(1,Math.ceil(filtered.length/perPage)); if(page>pages)page=pages;
 const slice=filtered.slice((page-1)*perPage,page*perPage);
 $("#gallery").innerHTML=slice.map(x=>`<article class="card ${selected.has(x.id)?"selected":""}" data-id="${x.id}">
 <img src="${x.src}" alt="${x.title}" loading="lazy"><span class="badge">${x.premium?"✦ PREMIUM":"FREE"}</span>
 <button class="select-check" data-select="${x.id}">✓</button>
 <div class="card-info"><div><div class="card-title">${x.title}</div><div class="card-cat">${x.category} · ${x.kind}</div></div><button class="heart ${favorites.has(x.id)?"active":""}" data-fav="${x.id}">${favorites.has(x.id)?"♥":"♡"}</button></div>
 </article>`).join("");
 $("#resultCount").textContent=`${filtered.length.toLocaleString()} images`;
 $("#allCount").textContent=data.length.toLocaleString(); saveFav(); renderPages(pages);
}
function renderPages(pages){
 let nums=[]; const start=Math.max(1,page-2), end=Math.min(pages,start+4);
 for(let i=start;i<=end;i++) nums.push(`<button class="page-btn ${i===page?"active":""}" data-page="${i}">${i}</button>`);
 $("#pagination").innerHTML=`<button class="page-btn" data-page="${Math.max(1,page-1)}">‹</button>${nums.join("")}<button class="page-btn" data-page="${Math.min(pages,page+1)}">›</button>`;
}
function openViewer(id){
 const idx=filtered.findIndex(x=>x.id===id); if(idx<0)return; currentIndex=idx; showViewer(filtered[idx]);
}
function showViewer(x){
 $("#viewerImg").src=x.src; $("#viewerTitle").textContent=x.title; $("#viewerMeta").textContent=`${x.category} · ${x.kind} · Local asset #${x.id}`; $("#viewerTag").textContent=x.premium?"Premium collection":"Gallery collection";
 $("#favViewer").textContent=favorites.has(x.id)?"♥":"♡"; $("#favViewer").classList.toggle("active",favorites.has(x.id));
 $("#viewer").classList.add("open"); recent=[x.id,...recent.filter(i=>i!==x.id)].slice(0,30); saveRecent();
}
function currentImage(){return filtered[currentIndex]||data[0]}
function openEditor(x){
 editState={filter:"none",brightness:100,contrast:100,saturation:100,blur:0,rotate:0,flip:1,frame:"none",bg:"transparent",ratio:"free"};
 $("#editImg").src=x.src; $("#editor").classList.add("open"); updateEditor(); switchTool("adjust");
}
function updateEditor(){
 const s=editState, img=$("#editImg"), wrap=$("#canvasBg");
 img.style.filter=`${s.filter==="none"?"":s.filter+" "}brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturation}%) blur(${s.blur}px)`;
 img.style.transform=`rotate(${s.rotate}deg) scaleX(${s.flip})`;
 wrap.className="canvas-bg "+(s.frame==="solid"?"frame-solid":s.frame==="double"?"frame-double":s.frame==="neon"?"frame-neon":s.frame==="film"?"frame-film":s.frame==="polaroid"?"frame-polaroid":"");
 wrap.style.background=s.bg==="transparent"?"#2b2b32":s.bg;
 ["brightness","contrast","saturation","blur"].forEach(k=>{if($("#"+k)){ $("#"+k).value=s[k]; $("#"+k+"Out").textContent=k==="blur"?s[k]+"px":s[k]+"%"}});
 $("#cropOverlay").style.display=document.querySelector("#crop.active")?"block":"none";
 if(s.ratio!=="free"){$("#cropOverlay").style.aspectRatio=s.ratio;$("#cropOverlay").style.height="70%";$("#cropOverlay").style.width="70%"}
}
function switchTool(name){
 $$(".tool-tab").forEach(b=>b.classList.toggle("active",b.dataset.tool===name));
 $$(".tool-panel").forEach(p=>p.classList.toggle("active",p.id===name));
 updateEditor();
}
function exportEdited(){
 const img=$("#editImg"), w=img.naturalWidth||1000,h=img.naturalHeight||750, scale=Math.min(1,1400/Math.max(w,h));
 let cropW=w,cropH=h;
 if(editState.ratio!=="free"){
   const [rw,rh]=editState.ratio.split("/").map(Number), target=rw/rh;
   if(w/h>target) cropW=Math.round(h*target); else cropH=Math.round(w/target);
 }
 const sx=Math.round((w-cropW)/2),sy=Math.round((h-cropH)/2);
 const cw=Math.round(cropW*scale),ch=Math.round(cropH*scale), canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
 const rot=((editState.rotate%360)+360)%360; canvas.width=rot%180?ch:cw;canvas.height=rot%180?cw:ch;
 ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rot*Math.PI/180);ctx.scale(editState.flip,1);
 ctx.filter=`${editState.filter==="none"?"":editState.filter+" "}brightness(${editState.brightness}%) contrast(${editState.contrast}%) saturate(${editState.saturation}%) blur(${editState.blur}px)`;
 ctx.drawImage(img,sx,sy,cropW,cropH,-cw/2,-ch/2,cw,ch);ctx.restore();
 const a=document.createElement("a");a.download="gallery-pro-edit.png";a.href=canvas.toDataURL("image/png");a.click();toast("Edited image exported.");
}
function buildCollage(){
 const imgs=[...selected].slice(0,6).map(id=>data.find(x=>x.id===id)).filter(Boolean);
 const box=$("#collagePreview");box.className="collage-preview "+collageLayout;box.innerHTML=imgs.length?imgs.map(x=>`<img src="${x.src}" alt="${x.title}">`).join(""):"<span>Select images in the gallery, then open Collage Maker.</span>";
}
function exportCollage(){
 const imgs=[...selected].slice(0,6).map(id=>data.find(x=>x.id===id)).filter(Boolean);if(!imgs.length){toast("Select at least one image first.");return}
 const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");canvas.width=1200;canvas.height=900;ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,900);
 let cols=collageLayout==="strip"?imgs.length:2, rows=collageLayout==="strip"?1:Math.ceil(imgs.length/cols),cw=1200/cols,ch=900/rows;
 let loaded=0;imgs.forEach((x,i)=>{const im=new Image();im.onload=()=>{const col=i%cols,row=Math.floor(i/cols);const r=Math.min(cw/im.width,ch/im.height);const ww=im.width*r,hh=im.height*r;ctx.drawImage(im,col*cw+(cw-ww)/2,row*ch+(ch-hh)/2,ww,hh);if(++loaded===imgs.length){const a=document.createElement("a");a.download="gallery-pro-collage.png";a.href=canvas.toDataURL("image/png");a.click();toast("Collage exported.")}};im.src=x.src})
}
function setView(title,sub){$("#viewTitle").textContent=title;$("#viewSub").textContent=sub}
$("#gallery").addEventListener("click",e=>{
 const fav=e.target.closest("[data-fav]"), sel=e.target.closest("[data-select]"), card=e.target.closest(".card"); if(fav){const id=+fav.dataset.fav;favorites.has(id)?favorites.delete(id):favorites.add(id);render();return}
 if(sel){const id=+sel.dataset.select;selected.has(id)?selected.delete(id):selected.add(id);render();return}
 if(card)openViewer(+card.dataset.id);
});
$("#pagination").addEventListener("click",e=>{if(e.target.dataset.page){page=+e.target.dataset.page;render();window.scrollTo({top:180,behavior:"smooth"})}});
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>{activeView=b.dataset.view||"all";activeCat=b.dataset.cat||"all";page=1;$$(".nav-item").forEach(n=>n.classList.remove("active"));b.classList.add("active");if(activeView==="horror")setView("Horror & Ghosts","Dark collection • ghosts, haunted scenes & nightmares");else if(activeView==="favorites")setView("Favorites","Your saved images");else if(activeView==="collage"){$("#collageModal").classList.add("open");buildCollage();return}else if(activeView==="3dstudio"){$("#studio3d").classList.add("open");update3D();return}else setView(activeCat!=="all"?activeCat:"My Gallery",activeCat!=="all"?`${activeCat} collection`:`${data.length.toLocaleString()} curated visuals • themed collections • local & private`);render()}));
$$(".chip").forEach(b=>b.addEventListener("click",()=>{$$(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeCat=b.dataset.filter;page=1;render()}));
$("#search").addEventListener("input",e=>{query=e.target.value;page=1;render()});document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus()}});
$("#sortBtn").addEventListener("click",()=>{sortMode=sortMode==="featured"?"newest":sortMode==="newest"?"az":"featured";$("#sortBtn").textContent="↕ Sort: "+sortMode[0].toUpperCase()+sortMode.slice(1);page=1;render()});
$("#shuffleBtn").addEventListener("click",()=>{sortMode="random";page=1;render();toast("Surprise mode activated ✦")});
$("#selectBtn").addEventListener("click",()=>{selecting=!selecting;$("#gallery").classList.toggle("selecting",selecting);$("#selectBtn").textContent=selecting?"✓ Done":"✓ Select";if(selecting)toast("Click images to select them for a collage.")});
$("#viewer").addEventListener("click",e=>{if(e.target.dataset.close==="viewer")$("#viewer").classList.remove("open")});
$("#editor").addEventListener("click",e=>{if(e.target.dataset.close==="editor")$("#editor").classList.remove("open")});
$("#collageModal").addEventListener("click",e=>{if(e.target.dataset.close==="collageModal")$("#collageModal").classList.remove("open")});
$("#prevImg").onclick=()=>{currentIndex=(currentIndex-1+filtered.length)%filtered.length;showViewer(currentImage())};
$("#nextImg").onclick=()=>{currentIndex=(currentIndex+1)%filtered.length;showViewer(currentImage())};
$("#favViewer").onclick=()=>{const id=currentImage().id;favorites.has(id)?favorites.delete(id):favorites.add(id);showViewer(currentImage());saveFav();render()};
$("#downloadBtn").onclick=()=>{const a=document.createElement("a");a.href=$("#viewerImg").src;a.download=(currentImage().title||"image")+".svg";a.click();toast("Image downloaded.")};
$("#editBtn").onclick=()=>{const x=currentImage();$("#viewer").classList.remove("open");openEditor(x)};
$$(".tool-tab").forEach(b=>b.onclick=()=>switchTool(b.dataset.tool));
["brightness","contrast","saturation","blur"].forEach(k=>$("#"+k).oninput=e=>{editState[k]=+e.target.value;updateEditor()});
$$("[data-filter-edit]").forEach(b=>b.onclick=()=>{editState.filter=b.dataset.filterEdit;updateEditor()});
$$("[data-frame]").forEach(b=>b.onclick=()=>{editState.frame=b.dataset.frame;updateEditor()});
$$("[data-bg]").forEach(b=>b.onclick=()=>{editState.bg=b.dataset.bg;updateEditor()});
$$("[data-ratio]").forEach(b=>b.onclick=()=>{editState.ratio=b.dataset.ratio;updateEditor()});
$("#rotateLeft").onclick=()=>{editState.rotate-=90;updateEditor()};$("#rotateRight").onclick=()=>{editState.rotate+=90;updateEditor()};$("#flip").onclick=()=>{editState.flip*=-1;updateEditor()};
$("#applyCrop").onclick=()=>{toast(editState.ratio==="free"?"Full image crop selected.":"Crop ratio will be applied to the exported image.");switchTool("adjust")};
$("#resetEdit").onclick=()=>{editState={filter:"none",brightness:100,contrast:100,saturation:100,blur:0,rotate:0,flip:1,frame:"none",bg:"transparent",ratio:"free"};updateEditor();toast("Editor reset.")};
$("#saveEdit").onclick=exportEdited;
$("#premiumBtn").onclick=()=>toast("Premium Studio is enabled in this demo — all editing tools are unlocked.");
$("#themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#uploadBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{const files=[...e.target.files];files.forEach((f,i)=>{const url=URL.createObjectURL(f);data.unshift({id:100000+i,src:url,title:f.name.replace(/\.[^.]+$/,""),category:"My Uploads",kind:"upload",premium:false})});page=1;render();toast(`${files.length} image${files.length>1?"s":""} added.`)};
$$("[data-layout]").forEach(b=>b.onclick=()=>{$$("[data-layout]").forEach(x=>x.classList.remove("active"));b.classList.add("active");collageLayout=b.dataset.layout;buildCollage()});
$("#downloadCollage").onclick=exportCollage;


function update3D(){
 const o=$("#threeDObject"), stage=$("#studio3dStage"); if(!o||!stage)return;
 o.style.transform=`rotateX(${studio3d.rx}deg) rotateY(${studio3d.ry}deg) rotateZ(${studio3d.rz}deg)`;
 o.style.background=`linear-gradient(135deg,${studio3d.color},#111827)`;
 o.style.boxShadow=`0 35px 70px #0009,0 0 ${studio3d.glow}px ${studio3d.color}88`;
 o.style.setProperty('--depth',studio3d.depth+'px');
 stage.style.background=`radial-gradient(circle at 25% 20%, ${studio3d.bg}, #05060b 72%)`;
 $("#threeDText").textContent=$("#threeDTextInput").value||"GALLERY 3D";
 o.style.setProperty('--depth',studio3d.depth+'px');
 $("#depthOut").textContent=studio3d.depth;$("#rxOut").textContent=studio3d.rx+'°';$("#ryOut").textContent=studio3d.ry+'°';$("#rzOut").textContent=studio3d.rz+'°';$("#glowOut").textContent=studio3d.glow;
 o.style.setProperty('filter',`drop-shadow(0 0 ${studio3d.glow/2}px ${studio3d.color})`);
}
["depth","rx","ry","rz","glow"].forEach(k=>{const el=$("#"+k);if(el)el.oninput=e=>{studio3d[k]=+e.target.value;update3D()}});
$("#threeDTextInput").oninput=update3D;
$$('[data-3d-bg]').forEach(b=>b.onclick=()=>{studio3d.bg=b.dataset['3dBg'];update3D()});
$$('[data-3d-color]').forEach(b=>b.onclick=()=>{studio3d.color=b.dataset['3dColor'];update3D()});
$("#studio3d").addEventListener("click",e=>{if(e.target.dataset.close==="studio3d")$("#studio3d").classList.remove("open")});
$("#export3d").onclick=()=>{
 const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=1400;c.height=1000;
 const g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,studio3d.bg);g.addColorStop(1,'#05060b');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
 const cx=700,cy=500,size=410,depth=studio3d.depth;ctx.save();ctx.translate(cx,cy);ctx.rotate(studio3d.rz*Math.PI/180);
 for(let z=depth;z>=0;z-=2){ctx.fillStyle=z%8===0? '#0b1025':studio3d.color;ctx.globalAlpha=.22;ctx.fillRect(-size/2+studio3d.ry*z*.04,-size/2+studio3d.rx*z*.03,size,size)}
 const grad=ctx.createLinearGradient(-size/2,-size/2,size/2,size/2);grad.addColorStop(0,studio3d.color);grad.addColorStop(1,'#111827');ctx.globalAlpha=1;ctx.fillStyle=grad;ctx.shadowColor=studio3d.color;ctx.shadowBlur=studio3d.glow;ctx.roundRect(-size/2,-size/2,size,size,38);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='800 76px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText($("#threeDTextInput").value||'GALLERY 3D',0,0);ctx.restore();
 const a=document.createElement('a');a.download='gallery-pro-3d.png';a.href=c.toDataURL('image/png');a.click();toast('3D image exported.');
};
update3D();

/* Advanced commercial toolkit */
const adv=$('#advancedLab');
function openAdvanced(){adv.classList.add('open');}
$('#advancedBtn')?.addEventListener('click',openAdvanced);
adv?.addEventListener('click',e=>{if(e.target.dataset.close==='advancedLab')adv.classList.remove('open')});
$$('.adv-tab').forEach(b=>b.addEventListener('click',()=>{$$('.adv-tab').forEach(x=>x.classList.remove('active'));$$('.adv-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#adv-'+b.dataset.adv).classList.add('active')}));

function loadImg(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function canvasFromImage(im){const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);return c}
function downloadData(data,name){const a=document.createElement('a');a.href=data;a.download=name;a.click()}

// AI background removal using the official browser package loaded only when requested.
$('#aiFile')?.addEventListener('change',e=>{const f=e.target.files[0];if(f)$('#aiPreview').src=URL.createObjectURL(f)});
$('#removeBgBtn')?.addEventListener('click',async()=>{const f=$('#aiFile').files[0];if(!f){toast('Choose an image first.');return}const b=$('#removeBgBtn');b.disabled=true;b.textContent='Removing background…';try{const mod=await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm');const result=await mod.removeBackground(f);const url=URL.createObjectURL(result);$('#aiPreview').src=url;window.aiRemovedBlob=result;toast('AI background removed locally.')}catch(err){console.error(err);toast('AI model could not load. Check your internet connection.')}finally{b.disabled=false;b.textContent='✦ Remove Background'}});
$('#replaceBgBtn')?.addEventListener('click',async()=>{if(!window.aiRemovedBlob){toast('Remove the background first.');return}const im=await loadImg(URL.createObjectURL(window.aiRemovedBlob));const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d');ctx.fillStyle=$('#aiBgColor').value;ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0);downloadData(c.toDataURL('image/png'),'gallery-pro-background-replaced.png')});

// Drawing / redaction canvas.
let markupMode='brush',markupCtx,markupDrawing=false,markupImg;
async function prepareMarkup(file){markupImg=await loadImg(URL.createObjectURL(file));const c=$('#markupCanvas'),wrap=c.parentElement;c.width=markupImg.naturalWidth;c.height=markupImg.naturalHeight;c.style.aspectRatio=`${c.width}/${c.height}`;$('#markupImage').src=markupImg.src;markupCtx=c.getContext('2d');markupCtx.lineCap='round';markupCtx.lineJoin='round'}
$('#markupFile')?.addEventListener('change',e=>e.target.files[0]&&prepareMarkup(e.target.files[0]));
$('#drawMode')?.addEventListener('click',()=>{markupMode='brush';toast('Brush mode')});$('#redactMode')?.addEventListener('click',()=>{markupMode='pixel';toast('Pixelate/redaction mode')});
$('#clearDrawing')?.addEventListener('click',()=>{if(markupCtx)markupCtx.clearRect(0,0,markupCtx.canvas.width,markupCtx.canvas.height)});
function drawAt(e){if(!markupCtx)return;const r=markupCtx.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*markupCtx.canvas.width/r.width,y=(e.clientY-r.top)*markupCtx.canvas.height/r.height,s=+$('#drawSize').value;if(markupMode==='pixel'){markupCtx.fillStyle='#111';markupCtx.fillRect(x-s*2,y-s*2,s*4,s*4)}else{markupCtx.strokeStyle=$('#drawColor').value;markupCtx.lineWidth=s;markupCtx.lineTo(x,y);markupCtx.stroke()}}
$('#markupCanvas')?.addEventListener('pointerdown',e=>{markupDrawing=true;const r=e.currentTarget.getBoundingClientRect();markupCtx.beginPath();markupCtx.moveTo((e.clientX-r.left)*markupCtx.canvas.width/r.width,(e.clientY-r.top)*markupCtx.canvas.height/r.height);drawAt(e)});
$('#markupCanvas')?.addEventListener('pointermove',e=>{if(markupDrawing)drawAt(e)});window.addEventListener('pointerup',()=>markupDrawing=false);
$('#exportMarkup')?.addEventListener('click',()=>{if(!markupImg){toast('Choose an image first.');return}const c=document.createElement('canvas');c.width=markupImg.naturalWidth;c.height=markupImg.naturalHeight;const x=c.getContext('2d');x.drawImage(markupImg,0,0);x.drawImage($('#markupCanvas'),0,0);downloadData(c.toDataURL('image/png'),'gallery-pro-annotated.png')});

// Smart watermarking.
$('#watermarkExport')?.addEventListener('click',async()=>{const f=$('#wmImage').files[0]||$('#markupFile').files[0]||$('#aiFile').files[0];if(!f){toast('Choose an image in any tool first.');return}const im=await loadImg(URL.createObjectURL(f)),c=canvasFromImage(im),ctx=c.getContext('2d');const opacity=+$('#wmOpacity').value/100,size=+$('#wmSize').value,text=$('#wmText').value||'Gallery Pro';ctx.globalAlpha=opacity;ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=Math.max(2,size/12);ctx.font=`700 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';const pos=$('#wmPosition').value;if(pos==='tile'){ctx.rotate(-Math.PI/7);for(let y=-c.height;y<c.height*2;y+=size*3)for(let x=-c.width;x<c.width*2;x+=size*6){ctx.strokeText(text,x,y);ctx.fillText(text,x,y)}}else{let x=c.width*.9,y=c.height*.92;if(pos==='bottom-left')x=c.width*.1;if(pos==='center'){x=c.width/2;y=c.height/2}if(pos==='top-right')y=c.height*.1;ctx.strokeText(text,x,y);ctx.fillText(text,x,y)}const wf=$('#wmImage').files[0];if(wf){const wi=await loadImg(URL.createObjectURL(wf));const w=Math.min(c.width*.22,wi.naturalWidth),h=w*wi.naturalHeight/wi.naturalWidth;ctx.globalAlpha=opacity;ctx.drawImage(wi,c.width-w-24,c.height-h-24,w,h)}downloadData(c.toDataURL('image/png'),'gallery-pro-watermarked.png');toast('Watermark exported.')});

// Advanced effects + stickers.
let fxFile=null,fxSticker=[];
$('#fxFile')?.addEventListener('change',e=>{fxFile=e.target.files[0];if(fxFile)$('#fxPreview').src=URL.createObjectURL(fxFile)});
function applyFxPreview(){const im=$('#fxPreview');if(!im)return;const h=$('#fxHue').value,s=$('#fxSat').value,l=$('#fxLight').value,g=$('#fxGamma').value;im.style.filter=`hue-rotate(${h}deg) saturate(${s}%) brightness(${l}%) contrast(${g}%)`}
['fxHue','fxSat','fxLight','fxGamma'].forEach(id=>$('#'+id)?.addEventListener('input',applyFxPreview));
$$('[data-sticker]').forEach(b=>b.addEventListener('click',()=>{fxSticker.push(b.dataset.sticker);toast(`${b.dataset.sticker} sticker added`)}));
$('#fxExport')?.addEventListener('click',async()=>{if(!fxFile){toast('Choose an image first.');return}const im=await loadImg(URL.createObjectURL(fxFile)),c=canvasFromImage(im),ctx=c.getContext('2d');ctx.filter=`hue-rotate(${$('#fxHue').value}deg) saturate(${$('#fxSat').value}%) brightness(${$('#fxLight').value}%) contrast(${$('#fxGamma').value}%)`;ctx.drawImage(im,0,0);ctx.filter='none';const v=+$('#fxVignette').value/100;if(v){const g=ctx.createRadialGradient(c.width/2,c.height/2,Math.min(c.width,c.height)*.2,c.width/2,c.height/2,Math.max(c.width,c.height)*.7);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(0,0,0,${v})`);ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height)}ctx.font=`${Math.max(40,c.width/10)}px sans-serif`;ctx.textAlign='center';fxSticker.slice(-8).forEach((s,i)=>ctx.fillText(s,c.width*(.15+i*.1),c.height*.15));downloadData(c.toDataURL('image/png'),'gallery-pro-advanced.png')});

// Batch conversion to a ZIP.
$('#batchExport')?.addEventListener('click',async()=>{const files=[...$('#batchFiles').files];if(!files.length){toast('Choose multiple images.');return}if(!window.JSZip){toast('ZIP library unavailable.');return}const zip=new JSZip(),mime=$('#batchFormat').value,quality=+$('#batchQuality').value/100,ratio=$('#batchRatio').value,wm=$('#batchWatermark').value;$('#batchStatus').textContent=`Processing ${files.length} images…`;for(let i=0;i<files.length;i++){const im=await loadImg(URL.createObjectURL(files[i]));let w=im.naturalWidth,h=im.naturalHeight;if(ratio!=='none'){const r=+ratio;if(w/h>r)w=Math.round(h*r);else h=Math.round(w/r)}const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);if(wm){ctx.fillStyle='rgba(255,255,255,.6)';ctx.font=`700 ${Math.max(18,w/35)}px Arial`;ctx.textAlign='right';ctx.fillText(wm,w-20,h-20)}const blob=await new Promise(r=>c.toBlob(r,mime,quality));zip.file(`${String(i+1).padStart(3,'0')}-${files[i].name.replace(/\.[^.]+$/,'')}.${mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'}`,blob)}const out=await zip.generateAsync({type:'blob'});downloadData(URL.createObjectURL(out),'gallery-pro-batch.zip');$('#batchStatus').textContent='ZIP ready.';toast('Batch ZIP downloaded.')});
$('#pdfExport')?.addEventListener('click',async()=>{const files=[...$('#batchFiles').files];if(!files.length){toast('Choose images first.');return}if(!window.jspdf){toast('PDF library unavailable.');return}const {jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'landscape',unit:'px',format:[1200,900]});for(let i=0;i<files.length;i++){if(i)doc.addPage([1200,900],'landscape');const im=await loadImg(URL.createObjectURL(files[i]));const r=Math.min(1200/im.naturalWidth,900/im.naturalHeight);const w=im.naturalWidth*r,h=im.naturalHeight*r;doc.addImage(im,'JPEG',(1200-w)/2,(900-h)/2,w,h)}doc.save('gallery-pro-images.pdf');toast('PDF exported.')});

// Animated WebM and GIF.
function mediaFiles(){return [...$('#mediaFiles').files]}
async function framesForMedia(){const fs=mediaFiles();const out=[];for(const f of fs)out.push(await loadImg(URL.createObjectURL(f)));return out}
$('#videoExport')?.addEventListener('click',async()=>{const imgs=await framesForMedia();if(!imgs.length){toast('Choose images first.');return}const c=document.createElement('canvas');c.width=1000;c.height=700;const ctx=c.getContext('2d'),stream=c.captureStream(30),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=()=>downloadData(URL.createObjectURL(new Blob(chunks,{type:'video/webm'})),'gallery-pro-slideshow.webm');rec.start();const delay=+$('#mediaDelay').value;for(const im of imgs){ctx.fillStyle='#111';ctx.fillRect(0,0,c.width,c.height);const r=Math.min(c.width/im.naturalWidth,c.height/im.naturalHeight),w=im.naturalWidth*r,h=im.naturalHeight*r;ctx.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);await new Promise(r=>setTimeout(r,delay))}rec.stop();toast('WebM export complete.')});
$('#gifExport')?.addEventListener('click',async()=>{const imgs=await framesForMedia();if(!imgs.length){toast('Choose images first.');return}if(!window.GIF){toast('GIF encoder unavailable.');return}const c=document.createElement('canvas');c.width=800;c.height=600;const ctx=c.getContext('2d');const gif=new GIF({workers:2,quality:10,width:800,height:600});for(const im of imgs){ctx.fillStyle='#111';ctx.fillRect(0,0,800,600);const r=Math.min(800/im.naturalWidth,600/im.naturalHeight),w=im.naturalWidth*r,h=im.naturalHeight*r;ctx.drawImage(im,(800-w)/2,(600-h)/2,w,h);gif.addFrame(c,{copy:true,delay:+$('#mediaDelay').value})}gif.on('finished',blob=>downloadData(URL.createObjectURL(blob),'gallery-pro-slideshow.gif'));gif.render();toast('GIF rendering started.')});

// Meme / poster generator.
$('#posterExport')?.addEventListener('click',async()=>{const f=$('#posterFile').files[0];if(!f){toast('Choose a poster image.');return}const im=await loadImg(URL.createObjectURL(f));const t=$('#posterTemplate').value,sizes={meme:[1200,900],story:[1080,1920],youtube:[1280,720],linkedin:[1584,396],quote:[1200,1200]};const [w,h]=sizes[t],c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,w,h);const r=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*r,ih=im.naturalHeight*r;ctx.drawImage(im,(w-iw)/2,(h-ih)/2,iw,ih);ctx.textAlign='center';ctx.font=`900 ${Math.max(36,w/14)}px Impact,Arial`;ctx.lineWidth=Math.max(5,w/180);ctx.strokeStyle='#000';ctx.fillStyle='#fff';const top=$('#posterTop').value,bottom=$('#posterBottom').value,quote=$('#posterQuote').value;function txt(x,y,s){if(!s)return;ctx.strokeText(s,x,y);ctx.fillText(s,x,y)}txt(w/2,Math.max(60,h*.12),top);txt(w/2,h-Math.max(40,h*.08),bottom);if(quote){ctx.font=`700 ${Math.max(30,w/20)}px Arial`;ctx.fillStyle='#fff';ctx.fillText(quote,w/2,h*.82)}downloadData(c.toDataURL('image/png'),'gallery-pro-poster.png')});

// Local albums, tags, descriptions, sharing and embed code.
let albums=JSON.parse(localStorage.getItem('gp-albums')||'{}');let metadata=JSON.parse(localStorage.getItem('gp-metadata')||'{}');
function saveOrg(){localStorage.setItem('gp-albums',JSON.stringify(albums));localStorage.setItem('gp-metadata',JSON.stringify(metadata))}
function renderAlbums(){const sel=$('#albumSelect'),list=$('#albumList');if(!sel||!list)return;sel.innerHTML='<option value="">Select album</option>'+Object.keys(albums).map(a=>`<option>${a}</option>`).join('');list.innerHTML=Object.entries(albums).map(([n,ids])=>`<span class="album-pill">${n} · ${ids.length}</span>`).join('')||'<span class="hint">No albums yet.</span>'}
$('#createAlbum')?.addEventListener('click',()=>{const n=$('#albumName').value.trim();if(!n){toast('Enter an album name.');return}albums[n]=albums[n]||[];saveOrg();renderAlbums();$('#albumName').value='';toast('Album created.')});
$('#saveMetadata')?.addEventListener('click',()=>{const id=currentImage()?.id;if(!id){toast('Open an image first.');return}metadata[id]={tag:$('#imageTag').value,description:$('#imageDescription').value,album:$('#albumSelect').value};if(metadata[id].album){albums[metadata[id].album]=albums[metadata[id].album]||[];if(!albums[metadata[id].album].includes(id))albums[metadata[id].album].push(id)}saveOrg();renderAlbums();toast('Image metadata saved.')});
$('#shareGallery')?.addEventListener('click',()=>{$('#shareOutput').value=JSON.stringify({title:'Gallery Pro shared collection',ids:[...selected],created:new Date().toISOString()},null,2);navigator.clipboard?.writeText($('#shareOutput').value);toast('Share data copied.')});
$('#embedGallery')?.addEventListener('click',()=>{const code=`<iframe src="YOUR_GALLERY_URL?collection=${encodeURIComponent([...selected].join(','))}" width="100%" height="620" loading="lazy" style="border:0;border-radius:16px"></iframe>`;$('#shareOutput').value=code;navigator.clipboard?.writeText(code);toast('Embed code copied.')});
renderAlbums();

// Three.js 3D viewer, AR capability detection, and parallax.
let threeScene,threeCamera,threeRenderer,threeMesh,threeAnim;
async function startThree(){const mount=$('#threeMount');mount.innerHTML='';if(!window.THREE){toast('Three.js could not load.');return}const w=mount.clientWidth||900,h=420;threeScene=new THREE.Scene();threeCamera=new THREE.PerspectiveCamera(45,w/h,.1,100);threeCamera.position.set(0,0,3.4);threeRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});threeRenderer.setSize(w,h);mount.appendChild(threeRenderer.domElement);const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(2,3,4);threeScene.add(light,new THREE.AmbientLight(0xffffff,.7));const f=$('#threeFile').files[0];let tex;if(f){tex=new THREE.TextureLoader().load(URL.createObjectURL(f))}else{const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.fillStyle='#6d4aff';x.fillRect(0,0,512,512);x.fillStyle='#fff';x.font='700 60px Arial';x.textAlign='center';x.fillText('GALLERY 3D',256,270);tex=new THREE.CanvasTexture(c)}const geo=new THREE.BoxGeometry(1.9,1.35,.16);const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.45,metalness:.15});threeMesh=new THREE.Mesh(geo,mat);threeScene.add(threeMesh);cancelAnimationFrame(threeAnim);const loop=()=>{threeMesh.rotation.y+=.006;threeMesh.rotation.x=Math.sin(performance.now()*.0005)*.08;threeRenderer.render(threeScene,threeCamera);threeAnim=requestAnimationFrame(loop)};loop();}
$('#threeStart')?.addEventListener('click',startThree);
$('#arBtn')?.addEventListener('click',async()=>{if(navigator.xr){try{const ok=await navigator.xr.isSessionSupported('immersive-ar');$('#arStatus').textContent=ok?'AR is supported on this device/browser; connect a WebXR-compatible camera session to place the artwork.':'WebXR AR is not supported here.'}catch(e){$('#arStatus').textContent='WebXR is unavailable in this browser.'}}else $('#arStatus').textContent='WebXR AR is unavailable in this browser.'});
$('#parallaxBtn')?.addEventListener('click',()=>{const cards=$$('.card');cards.forEach(c=>{c.classList.add('parallax-card');c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(600px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(8px)`};c.onmouseleave=()=>c.style.transform='' });toast('Parallax enabled on the visible gallery cards.')});

// Cloud-sync connection-ready settings: no fake credentials or fake backend state.
window.GalleryProCloud={configure:(provider,config)=>{localStorage.setItem('gp-cloud-config',JSON.stringify({provider,config}));toast(`${provider} configuration saved locally.`)}};
$('#saveCloud')?.addEventListener('click',()=>{const cfg={provider:$('#cloudProvider').value,url:$('#cloudUrl').value.trim(),key:$('#cloudKey').value.trim()};localStorage.setItem('gp-cloud-config',JSON.stringify(cfg));$('#cloudStatus').textContent=`${cfg.provider} settings saved locally. Add your own backend SDK/auth flow to enable real cross-device sync.`;toast('Cloud connection settings saved.')});
