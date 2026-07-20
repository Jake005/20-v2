'use strict';

const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const sectionProgress=id=>{const el=document.getElementById(id);if(!el)return 0;const r=el.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight));};
const nearSection=(id,pad=.35)=>{const el=document.getElementById(id);if(!el)return false;const r=el.getBoundingClientRect();return r.bottom>-innerHeight*pad&&r.top<innerHeight*(1+pad);};

// Background stars
const starCanvas=document.getElementById('stars');
const sctx=starCanvas.getContext('2d');
let bgStars=[];
function resizeStars(){starCanvas.width=innerWidth*Math.min(devicePixelRatio,1.5);starCanvas.height=innerHeight*Math.min(devicePixelRatio,1.5);sctx.setTransform(Math.min(devicePixelRatio,1.5),0,0,Math.min(devicePixelRatio,1.5),0,0);bgStars=Array.from({length:Math.max(140,Math.floor(innerWidth/4.5))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.5+.2,a:Math.random()*.75+.2,v:Math.random()*.008+.002}));}
function drawStars(t=0){sctx.clearRect(0,0,innerWidth,innerHeight);for(const s of bgStars){const a=s.a*(.65+.35*Math.sin(t*s.v+s.x));sctx.fillStyle=`rgba(255,255,255,${a})`;sctx.beginPath();sctx.arc(s.x,s.y,s.r,0,Math.PI*2);sctx.fill();}requestAnimationFrame(drawStars);}
resizeStars();drawStars();addEventListener('resize',resizeStars);

// Warp transitions for anchor navigation
const warp=document.getElementById('warpTransition');
let warpBusy=false;
function triggerWarp(callback){if(warpBusy){callback?.();return;}warpBusy=true;warp.classList.add('active');setTimeout(()=>{callback?.();setTimeout(()=>{warp.classList.remove('active');warpBusy=false;},260);},240);}
document.querySelectorAll('.warp-link').forEach(link=>link.addEventListener('click',e=>{const selector=link.getAttribute('href');const target=selector?.startsWith('#')?document.querySelector(selector):null;if(!target)return;e.preventDefault();triggerWarp(()=>target.scrollIntoView({behavior:'auto',block:'start'}));}));

// Universe interactions
const universeStage=document.getElementById('universeStage');
const orbitMessage=document.getElementById('orbitMessage');
document.querySelectorAll('.orbit-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.orbit-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');universeStage.classList.add('focused');orbitMessage.querySelector('small').textContent='Universul ei';orbitMessage.querySelector('h3').textContent=btn.dataset.title;orbitMessage.querySelector('p').textContent=btn.dataset.message;orbitMessage.classList.add('show');clearTimeout(window.__orbitTimer);window.__orbitTimer=setTimeout(()=>{btn.classList.remove('active');orbitMessage.classList.remove('show');universeStage.classList.remove('focused');},5200);}));

// Cosmic tree — responsive scroll-driven canvas
const treeCanvas=document.getElementById('cosmicTreeCanvas');
const treeCtx=treeCanvas.getContext('2d');
const treeMessage=document.getElementById('cosmicTreeMessage');
const treeCaption=document.getElementById('cosmicTreeCaption');
let treeStars=[],treeLeaves=[],treeDpr=1;

function resizeCosmicTree(){
  treeDpr=Math.min(devicePixelRatio||1,1.5);
  const w=treeCanvas.clientWidth||innerWidth;
  const h=treeCanvas.clientHeight||innerHeight;
  treeCanvas.width=Math.round(w*treeDpr);
  treeCanvas.height=Math.round(h*treeDpr);
  treeCtx.setTransform(treeDpr,0,0,treeDpr,0,0);
  treeStars=Array.from({length:w<600?90:170},()=>({x:Math.random()*w,y:Math.random()*h,r:.3+Math.random()*1.25,a:.2+Math.random()*.65,p:Math.random()*6.28}));
  treeLeaves=Array.from({length:w<600?150:270},(_,i)=>({branch:i%34,side:i%2?-1:1,t:.18+Math.random()*.82,j:(Math.random()-.5),size:1.1+Math.random()*2.8,p:Math.random()*6.28}));
}

function branchPoint(baseX,baseY,length,angle,t,bend){
  const curve=Math.sin(t*Math.PI)*bend;
  return {x:baseX+Math.sin(angle)*length*t+Math.cos(angle)*curve,y:baseY-Math.cos(angle)*length*t+Math.sin(angle)*curve};
}

function drawBranch(x,y,length,angle,width,depth,grow,time){
  if(depth<0||grow<=0)return;
  const local=clamp(grow*1.35-depth*.035);
  if(local<=0)return;
  const endT=Math.min(1,local);
  const bend=Math.sin(depth*1.9+angle)*length*.09;
  const steps=12;
  treeCtx.beginPath();
  for(let i=0;i<=steps;i++){
    const t=endT*i/steps;
    const pt=branchPoint(x,y,length,angle,t,bend);
    if(i===0)treeCtx.moveTo(pt.x,pt.y);else treeCtx.lineTo(pt.x,pt.y);
  }
  const glow=.55+.45*Math.sin(time*.0018+depth+angle);
  treeCtx.strokeStyle=`rgba(${185+Math.floor(35*glow)},${125+Math.floor(55*glow)},${225+Math.floor(25*glow)},${.34+.48*local})`;
  treeCtx.lineWidth=Math.max(.7,width*endT);
  treeCtx.lineCap='round';
  treeCtx.shadowColor='rgba(242,139,180,.5)';
  treeCtx.shadowBlur=5+width*1.6;
  treeCtx.stroke();
  treeCtx.shadowBlur=0;
  if(endT>.86&&depth>0){
    const e=branchPoint(x,y,length,angle,1,bend);
    const spread=.36+depth*.018;
    drawBranch(e.x,e.y,length*.72,angle-spread,width*.69,depth-1,(local-.72)*3.6,time);
    drawBranch(e.x,e.y,length*.68,angle+spread,width*.66,depth-1,(local-.76)*3.9,time);
    if(depth>3)drawBranch(e.x,e.y,length*.56,angle+(depth%2?-.09:.09),width*.55,depth-2,(local-.8)*4.2,time);
  }
}

function drawRoots(cx,ground,p){
  const rootP=clamp((p-.03)/.24);
  for(let i=0;i<13;i++){
    const side=i%2?-1:1;
    const lane=Math.ceil((i+1)/2);
    const len=(45+lane*22)*Math.min(innerWidth/430,1.35);
    const t=rootP;
    treeCtx.strokeStyle=`rgba(178,114,224,${.18+.43*t})`;
    treeCtx.lineWidth=Math.max(.7,5-lane*.27);
    treeCtx.shadowColor='rgba(140,99,255,.45)';treeCtx.shadowBlur=8;
    treeCtx.beginPath();treeCtx.moveTo(cx,ground);
    treeCtx.bezierCurveTo(cx+side*len*.18,ground+len*.1,cx+side*len*.7,ground+len*.12,cx+side*len*t,ground+len*.23*t);
    treeCtx.stroke();
  }
  treeCtx.shadowBlur=0;
}

function drawCosmicTree(time=0){
  if(!nearSection('vis',1.1)){requestAnimationFrame(drawCosmicTree);return;}
  const w=treeCanvas.clientWidth||innerWidth,h=treeCanvas.clientHeight||innerHeight;
  const p=sectionProgress('vis');
  const seed=clamp(p/.14),root=clamp((p-.06)/.23),trunk=clamp((p-.15)/.34),crown=clamp((p-.34)/.42),galaxy=clamp((p-.58)/.26),reveal=clamp((p-.73)/.2);
  treeCtx.clearRect(0,0,w,h);
  const cx=w*(w<900?.5:.68),ground=h*(w<600?.84:.82);
  const scale=Math.min(w/900,h/820);

  for(const s of treeStars){
    const tw=s.a*(.62+.38*Math.sin(time*.0015+s.p));
    treeCtx.fillStyle=`rgba(255,240,248,${tw*(.35+.65*galaxy)})`;
    treeCtx.beginPath();treeCtx.arc(s.x,s.y,s.r*(.7+.5*galaxy),0,Math.PI*2);treeCtx.fill();
  }

  const halo=treeCtx.createRadialGradient(cx,ground-h*.35,0,cx,ground-h*.35,Math.max(130,w*.28));
  halo.addColorStop(0,`rgba(255,194,216,${.16*crown})`);halo.addColorStop(.48,`rgba(140,99,255,${.1*crown})`);halo.addColorStop(1,'rgba(0,0,0,0)');
  treeCtx.fillStyle=halo;treeCtx.fillRect(0,0,w,h);

  if(seed>0){
    treeCtx.shadowColor='#ffc2d8';treeCtx.shadowBlur=24*seed;treeCtx.fillStyle=`rgba(255,225,238,${seed})`;
    treeCtx.beginPath();treeCtx.ellipse(cx,ground,5+8*seed,3+5*seed,0,0,Math.PI*2);treeCtx.fill();treeCtx.shadowBlur=0;
  }
  if(root>0)drawRoots(cx,ground,root);

  const treeH=Math.min(h*.59,w<600?w*.92:h*.62);
  const trunkY=ground-treeH*trunk;
  if(trunk>0){
    const grad=treeCtx.createLinearGradient(cx,ground,cx,trunkY);
    grad.addColorStop(0,'rgba(94,48,115,.9)');grad.addColorStop(.55,'rgba(189,116,190,.9)');grad.addColorStop(1,'rgba(255,194,216,.82)');
    treeCtx.strokeStyle=grad;treeCtx.lineWidth=(w<600?12:18)*scale+5;treeCtx.lineCap='round';treeCtx.shadowColor='rgba(242,139,180,.45)';treeCtx.shadowBlur=14;
    treeCtx.beginPath();treeCtx.moveTo(cx,ground);treeCtx.bezierCurveTo(cx-w*.025,ground-treeH*.3*trunk,cx+w*.018,ground-treeH*.7*trunk,cx,trunkY);treeCtx.stroke();treeCtx.shadowBlur=0;
  }
  if(crown>0){
    const baseLen=treeH*(w<600?.20:.22);
    drawBranch(cx,ground-treeH*.34,baseLen,-.78,(w<600?7:10)*scale,6,crown,time);
    drawBranch(cx,ground-treeH*.39,baseLen*.96,.72,(w<600?7:10)*scale,6,crown,time);
    drawBranch(cx,ground-treeH*.53,baseLen*.9,-.6,(w<600?6:9)*scale,5,crown,time);
    drawBranch(cx,ground-treeH*.57,baseLen*.9,.58,(w<600?6:9)*scale,5,crown,time);
    drawBranch(cx,ground-treeH*.7,baseLen*.76,-.42,(w<600?5:8)*scale,5,crown,time);
    drawBranch(cx,ground-treeH*.72,baseLen*.76,.42,(w<600?5:8)*scale,5,crown,time);
    drawBranch(cx,ground-treeH*.82,baseLen*.62,-.25,(w<600?4:7)*scale,4,crown,time);
    drawBranch(cx,ground-treeH*.84,baseLen*.62,.25,(w<600?4:7)*scale,4,crown,time);
  }

  if(crown>.35){
    const leafA=clamp((crown-.35)/.65);
    for(const l of treeLeaves){
      const ang=(l.branch/34)*Math.PI*2;
      const rx=(w<600?w*.28:w*.25)*(0.32+l.t*.68), ry=treeH*.39*(.3+l.t*.7);
      const x=cx+Math.cos(ang)*rx+Math.sin(l.p+time*.0005)*5;
      const y=ground-treeH*.68+Math.sin(ang)*ry*.62+l.j*28;
      const tw=.55+.45*Math.sin(time*.002+l.p);
      treeCtx.fillStyle=`rgba(${220+Math.floor(35*tw)},${150+Math.floor(70*tw)},${220+Math.floor(30*tw)},${(.22+.7*tw)*leafA})`;
      treeCtx.shadowColor='rgba(242,139,180,.7)';treeCtx.shadowBlur=6*leafA;
      treeCtx.beginPath();treeCtx.arc(x,y,l.size*(.65+.55*galaxy),0,Math.PI*2);treeCtx.fill();
    }
    treeCtx.shadowBlur=0;
  }

  treeMessage.style.opacity=String(reveal);
  treeMessage.style.transform=w<600?`translate(-50%,0) scale(${.78+.22*reveal})`:`translate(-50%,-50%) scale(${.78+.22*reveal})`;
  treeCaption.textContent=p<.14?'Sămânța':p<.32?'Rădăcini de lumină':p<.55?'Creștere':p<.74?'Frunzele devin galaxii':'Un univers întreg';
  requestAnimationFrame(drawCosmicTree);
}
resizeCosmicTree();addEventListener('resize',resizeCosmicTree,{passive:true});drawCosmicTree();

// Particle morph section: heart -> flower -> moon -> star -> butterfly -> rose -> C & D -> Happy Birthday
const heartCanvas=document.getElementById('heartUniverseCanvas');const hctx=heartCanvas.getContext('2d');const heartLabel=document.getElementById('heartStageLabel');
const morphNames=['INIMĂ','FLOARE','LUNĂ','STEA','FLUTURE','TRANDAFIR','C & D','HAPPY BIRTHDAY'];
let morphTargets=[],morphParticles=[];
function sampleCanvas(draw,count=1700){const c=document.createElement('canvas');c.width=1000;c.height=650;const x=c.getContext('2d');x.fillStyle='#fff';draw(x,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height).data,pts=[];for(let yy=0;yy<c.height;yy+=5)for(let xx=0;xx<c.width;xx+=5)if(d[(yy*c.width+xx)*4+3]>90)pts.push({x:xx/c.width,y:yy/c.height});const out=[];const step=pts.length/Math.min(count,pts.length);for(let i=0;i<Math.min(count,pts.length);i++)out.push(pts[Math.floor(i*step)]);return out;}
function buildMorphTargets(){
  const heart=sampleCanvas((x,w,h)=>{x.beginPath();x.moveTo(w*.5,h*.78);x.bezierCurveTo(w*.12,h*.5,w*.25,h*.16,w*.5,h*.36);x.bezierCurveTo(w*.75,h*.16,w*.88,h*.5,w*.5,h*.78);x.fill();});
  const flower=sampleCanvas((x,w,h)=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2;x.beginPath();x.ellipse(w*.5+Math.cos(a)*135,h*.5+Math.sin(a)*135,95,48,a,0,Math.PI*2);x.fill();}x.beginPath();x.arc(w*.5,h*.5,85,0,Math.PI*2);x.fill();});
  const moon=sampleCanvas((x,w,h)=>{x.beginPath();x.arc(w*.5,h*.5,220,0,Math.PI*2);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(w*.62,h*.43,220,0,Math.PI*2);x.fill();x.globalCompositeOperation='source-over';});
  const star=sampleCanvas((x,w,h)=>{const spikes=5,outer=290,inner=118;x.beginPath();for(let i=0;i<spikes*2;i++){const r=i%2?inner:outer,a=-Math.PI/2+i*Math.PI/spikes;x.lineTo(w*.5+Math.cos(a)*r,h*.5+Math.sin(a)*r);}x.closePath();x.fill();});
  const butterfly=sampleCanvas((x,w,h)=>{x.beginPath();x.ellipse(w*.36,h*.42,145,100,-.5,0,Math.PI*2);x.ellipse(w*.64,h*.42,145,100,.5,0,Math.PI*2);x.ellipse(w*.4,h*.65,105,65,.45,0,Math.PI*2);x.ellipse(w*.6,h*.65,105,65,-.45,0,Math.PI*2);x.fill();x.fillRect(w*.485,h*.28,30,270);});
  const rose=sampleCanvas((x,w,h)=>{x.lineWidth=28;x.strokeStyle='#fff';for(let r=40;r<230;r+=35){x.beginPath();x.arc(w*.5,h*.45,r,r*.01,Math.PI*1.65);x.stroke();}x.fillStyle='#fff';x.fillRect(w*.49,h*.62,18,170);x.beginPath();x.ellipse(w*.43,h*.72,75,30,-.4,0,Math.PI*2);x.ellipse(w*.57,h*.78,75,30,.4,0,Math.PI*2);x.fill();});
  const cd=sampleCanvas((x,w,h)=>{x.textAlign='center';x.textBaseline='middle';x.font='700 220px DM Sans';x.fillText('C & D',w/2,h/2);},2200);
  const hb=sampleCanvas((x,w,h)=>{x.textAlign='center';x.textBaseline='middle';x.font='700 120px DM Sans';x.fillText('HAPPY',w/2,h*.43);x.fillText('BIRTHDAY',w/2,h*.64);},2400);
  morphTargets=[heart,flower,moon,star,butterfly,rose,cd,hb];
  const max=Math.max(...morphTargets.map(t=>t.length));morphTargets=morphTargets.map(t=>Array.from({length:max},(_,i)=>t[i%t.length]));morphParticles=Array.from({length:max},(_,i)=>({x:Math.random(),y:Math.random(),phase:Math.random()*Math.PI*2,size:Math.random()*1.4+.7,index:i}));
}
function resizeHeart(){heartCanvas.width=innerWidth*Math.min(devicePixelRatio,1.5);heartCanvas.height=innerHeight*Math.min(devicePixelRatio,1.5);hctx.setTransform(Math.min(devicePixelRatio,1.5),0,0,Math.min(devicePixelRatio,1.5),0,0);}
function drawMorph(time=0){const p=sectionProgress('inima');const scaled=p*(morphTargets.length-1);const from=Math.min(morphTargets.length-1,Math.floor(scaled));const to=Math.min(morphTargets.length-1,from+1);const local=scaled-from;const ease=local<.5?4*local*local*local:1-Math.pow(-2*local+2,3)/2;heartLabel.textContent=morphNames[Math.round(scaled)];hctx.clearRect(0,0,innerWidth,innerHeight);const scale=Math.min(innerWidth/1000,innerHeight/650)*.92;const ox=(innerWidth-1000*scale)/2,oy=(innerHeight-650*scale)/2;for(const pt of morphParticles){const a=morphTargets[from][pt.index],b=morphTargets[to][pt.index];const nx=a.x+(b.x-a.x)*ease,ny=a.y+(b.y-a.y)*ease;pt.x+=(nx-pt.x)*.09;pt.y+=(ny-pt.y)*.09;const tw=.55+.45*Math.sin(time*.003+pt.phase);hctx.fillStyle=`rgba(255,${190+Math.floor(45*tw)},${215+Math.floor(35*tw)},${.55+.4*tw})`;hctx.beginPath();hctx.arc(ox+pt.x*1000*scale,oy+pt.y*650*scale,pt.size*(from>=6?1.25:1),0,Math.PI*2);hctx.fill();}requestAnimationFrame(drawMorph);}
buildMorphTargets();resizeHeart();addEventListener('resize',resizeHeart);drawMorph();

// Leaflet map
// Leaflet map
(function initMap(){
  if(typeof L === 'undefined') return;

  const mapContainer = document.getElementById('map');
  if(!mapContainer) return;

  // Centrare inițială a hărții pe Timișoara
  const map = L.map('map', { 
    zoomControl: true, 
    scrollWheelZoom: true 
  }).setView([45.7500, 21.2250], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const icon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#f28bb4;border:3px solid white;box-shadow:0 0 18px #f28bb4"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  // Cele 4 locații actualizate
  const locations = [
    [45.741007, 21.238985, 'FITT Timișoara', 'Strada Arieș 19'],
    [45.758410, 21.256240, 'Parcul Uzinei', 'Strada Gheorghe Longinescu 3'],
    [45.751680, 21.230710, 'Colegiul Național Pedagogic "Carmen Sylva"', 'Bulevardul C. D. Loga 45'],
    [45.742350, 21.200150, 'Bazinul de întoarcere a șlepurilor', 'Splaiul Sofocle']
  ];

  locations.forEach(p => {
    L.marker([p[0], p[1]], { icon })
      .addTo(map)
      .bindPopup(`<strong>${p[2]}</strong><br>${p[3]}`);
  });

  // Funcționalitate pentru butoane
  document.querySelectorAll('.places button').forEach(btn => {
    btn.addEventListener('click', () => {
      map.flyTo([+btn.dataset.lat, +btn.dataset.lng], +btn.dataset.zoom, { duration: 1.3 });
    });
  });

  // REPARARE: Recalculare dimensiuni pentru cazurile în care harta este în secțiuni de scroll
  setTimeout(() => {
    map.invalidateSize();
  }, 300);

  window.addEventListener('resize', () => map.invalidateSize());
})();
// C & D constellation plus comet
const cCanvas=document.getElementById('constellationCanvas');const ctx=cCanvas.getContext('2d');let particles=[],targetPoints=[];
function letterPoints(){const off=document.createElement('canvas');off.width=1500;off.height=760;const o=off.getContext('2d');o.fillStyle='#fff';o.textAlign='center';o.textBaseline='middle';o.font='700 245px DM Sans';o.fillText('C & D',750,390);const data=o.getImageData(0,0,1500,760).data,pts=[];for(let y=0;y<760;y+=6)for(let x=0;x<1500;x+=6)if(data[(y*1500+x)*4+3]>90)pts.push({x:x/1500,y:y/760});return pts;}
function evenSample(arr,count){if(arr.length<=count)return arr;const out=[],step=arr.length/count;for(let i=0;i<count;i++)out.push(arr[Math.floor(i*step)]);return out;}
targetPoints=letterPoints();
function resizeConstellation(){
  const dpr=Math.min(devicePixelRatio,1.5);
  const w=cCanvas.clientWidth||innerWidth,h=cCanvas.clientHeight||innerHeight;
  cCanvas.width=w*dpr;cCanvas.height=h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const sampled=evenSample(targetPoints,Math.min(w<600?1800:4200,targetPoints.length));
  const minX=Math.min(...sampled.map(t=>t.x)),maxX=Math.max(...sampled.map(t=>t.x));
  const minY=Math.min(...sampled.map(t=>t.y)),maxY=Math.max(...sampled.map(t=>t.y));
  const sourceW=Math.max(.001,maxX-minX),sourceH=Math.max(.001,maxY-minY);
  const mobile=w<600;

  const targetW=w*(mobile?.68:.60);
  const targetH=h*(mobile?.22:.30);
  const fit=Math.min(targetW/sourceW,targetH/sourceH);
  const renderedW=sourceW*fit,renderedH=sourceH*fit;
  const centerX=w*.5;
  const centerY=h*(mobile?.52:.55);
  const startX=centerX-renderedW/2;
  const startY=centerY-renderedH/2;

  particles=sampled.map(t=>({
    sx:Math.random()*w,
    sy:Math.random()*h,
    tx:startX+(t.x-minX)*fit,
    ty:startY+(t.y-minY)*fit,
    phase:Math.random()*Math.PI*2
  }));
}
function drawConstellation(time=0){if(!nearSection('constelatie',.7)){requestAnimationFrame(drawConstellation);return;}const p=sectionProgress('constelatie'),ease=1-Math.pow(1-p,3),cw=cCanvas.clientWidth||innerWidth,ch=cCanvas.clientHeight||innerHeight;ctx.clearRect(0,0,cw,ch);const pos=particles.map(pt=>({x:pt.sx+(pt.tx-pt.sx)*ease,y:pt.sy+(pt.ty-pt.sy)*ease}));if(p>.48){ctx.strokeStyle=`rgba(242,139,180,${Math.min(.45,(p-.48)*1.2)})`;ctx.lineWidth=.55;for(let i=0;i<pos.length-1;i+=2){const a=pos[i],b=pos[i+1],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<18){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}for(let i=0;i<pos.length;i++){const tw=.6+.4*Math.sin(time*.003+particles[i].phase);ctx.fillStyle=`rgba(255,235,245,${tw})`;ctx.beginPath();ctx.arc(pos[i].x,pos[i].y,p>.75?1.7:1.05,0,Math.PI*2);ctx.fill();}if(p>.78){const cp=(p-.78)/.22;const x=-140+cp*(cw+280),y=ch*.18+Math.sin(cp*Math.PI)*ch*.28;const g=ctx.createLinearGradient(x-180,y+45,x,y);g.addColorStop(0,'rgba(140,99,255,0)');g.addColorStop(1,'rgba(255,255,255,.95)');ctx.strokeStyle=g;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-180,y+45);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}requestAnimationFrame(drawConstellation);}
resizeConstellation();addEventListener('resize',resizeConstellation);drawConstellation();

// 3D book scroll animation
const pages=[document.querySelector('.book-front'),document.querySelector('.page-1'),document.querySelector('.page-2')];const book=document.getElementById('storyBook');const bookFill=document.getElementById('bookProgressFill');
function animateBook(){if(!nearSection('carte',.7)){requestAnimationFrame(animateBook);return;}const p=sectionProgress('carte');bookFill.style.width=`${p*100}%`;const phases=[clamp(p/.27),clamp((p-.28)/.27),clamp((p-.57)/.27)];pages.forEach((page,i)=>{const e=phases[i]<.5?2*phases[i]*phases[i]:1-Math.pow(-2*phases[i]+2,2)/2;page.style.transform=`translateZ(${8-i*2}px) rotateY(${-178*e}deg)`;page.style.zIndex=String(10-i);});book.style.transform=`rotateX(${8-4*p}deg) rotateY(${-8+16*p}deg) translateY(${Math.sin(p*Math.PI)*-16}px)`;requestAnimationFrame(animateBook);}animateBook();

// Cosmic flower
const flower=document.getElementById('cosmicFlower'),petals=[...document.querySelectorAll('.cosmic-flower .petal')],flowerCore=document.querySelector('.flower-core'),bloomAura=document.querySelector('.bloom-aura'),bloomLine=document.querySelector('.bloom-line');
function animateBloom(){if(!nearSection('floare',.7)){requestAnimationFrame(animateBloom);return;}const p=sectionProgress('floare'),open=clamp((p-.08)/.7),reveal=clamp((p-.58)/.28);flower.style.transform=`scale(${.35+.65*open}) rotate(${-18+18*open}deg)`;bloomAura.style.opacity=String(open);bloomAura.style.transform=`scale(${.4+.75*open})`;petals.forEach((petal,i)=>{const local=clamp(open*1.35-i*.035);petal.style.opacity=String(.08+.92*local);petal.style.transform=`translate(-50%,-100%) rotate(${i*45}deg) scaleY(${.1+.9*local})`;});flowerCore.style.opacity=String(reveal);flowerCore.style.transform=`translate(-50%,-50%) scale(${.2+.8*reveal})`;bloomLine.style.opacity=String(reveal);bloomLine.style.transform=`translateY(${15*(1-reveal)}px)`;requestAnimationFrame(animateBloom);}animateBloom();

// Portal before final — optimized and seamless
const portalCanvas=document.getElementById('portalCanvas'),portalCtx=portalCanvas.getContext('2d'),cosmicPortal=document.getElementById('cosmicPortal'),portalCaption=document.getElementById('portalCaption'),portalSticky=document.getElementById('portalSticky'),portalFlash=document.getElementById('portalFlash'),portalPreview=document.getElementById('portalPreview'),portalExit=document.getElementById('portalExit');let portalDust=[];
function resizePortal(){const dpr=Math.min(devicePixelRatio,1.35);portalCanvas.width=innerWidth*dpr;portalCanvas.height=innerHeight*dpr;portalCtx.setTransform(dpr,0,0,dpr,0,0);portalDust=Array.from({length:innerWidth<700?150:250},()=>({a:Math.random()*Math.PI*2,r:35+Math.random()*Math.max(innerWidth,innerHeight)*.58,s:.3+Math.random()*1.5,z:Math.random()}));}
function drawPortal(time=0){if(!nearSection('portal',.7)){requestAnimationFrame(drawPortal);return;}const p=sectionProgress('portal'),align=clamp((p-.04)/.38),enter=clamp((p-.43)/.39),handoff=clamp((p-.78)/.18),flash=Math.max(0,1-Math.abs(p-.785)/.025),cx=innerWidth/2,cy=innerHeight/2;portalCtx.clearRect(0,0,innerWidth,innerHeight);if(handoff<.97){for(const d of portalDust){const rr=d.r*(1-align*.48)*(1-enter*.88),a=d.a+time*.00015*d.s+align*4.2*d.z,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.62,alpha=(.1+.68*d.z)*(1-handoff);portalCtx.strokeStyle=d.z>.55?`rgba(255,205,226,${alpha})`:`rgba(170,135,255,${alpha})`;portalCtx.lineWidth=.55+d.z*1.35;portalCtx.beginPath();portalCtx.moveTo(x,y);portalCtx.lineTo(x+(cx-x)*enter*.62,y+(cy-y)*enter*.62);portalCtx.stroke();}}
const scale=.46+.66*align+3.25*Math.pow(enter,2.1);cosmicPortal.style.transform=`scale(${scale}) rotateX(${62*(1-align)}deg) rotateZ(${align*42+enter*18}deg)`;cosmicPortal.style.opacity=String(1-handoff);document.querySelector('.po-1').style.transform=`rotate(${time*.018+enter*130}deg)`;document.querySelector('.po-2').style.transform=`rotate(${-time*.014-enter*170}deg)`;document.querySelector('.po-3').style.transform=`rotate(${time*.01+enter*210}deg)`;portalPreview.style.opacity=String(clamp((enter-.34)/.42)*(1-handoff));portalPreview.style.transform=`scale(${.18+.82*clamp((enter-.3)/.52)})`;document.querySelector('.portal-vignette').style.opacity=String(clamp((enter-.1)/.5)*(1-handoff));portalFlash.style.opacity=String(flash*.72);portalExit.style.opacity=String(handoff);const exitContent=portalExit.querySelector('.portal-exit-content');exitContent.style.opacity=String(clamp((handoff-.15)/.6));exitContent.style.transform=`scale(${.88+.12*handoff})`;portalCaption.style.opacity=String(1-clamp((enter-.08)/.24));portalCaption.textContent=p<.22?'Portal închis':p<.43?'Aliniere cosmică':p<.76?'Camera intră în portal':'Ultimul capitol';requestAnimationFrame(drawPortal);}
resizePortal();addEventListener('resize',resizePortal);drawPortal();

// Finale
const finale=document.getElementById('revealFinale'),openBtn=document.getElementById('notAllButton'),closeBtn=document.getElementById('closeFinale');let finaleStarted=false;
openBtn.addEventListener('click',()=>triggerWarp(()=>{document.body.style.overflow='hidden';finale.classList.add('active');finale.setAttribute('aria-hidden','false');if(!finaleStarted){startFinale();finaleStarted=true;}}));
closeBtn.addEventListener('click',()=>{finale.classList.remove('active');finale.setAttribute('aria-hidden','true');document.body.style.overflow='';});
function startFinale(){const canvas=document.getElementById('finaleCanvas'),fctx=canvas.getContext('2d');function size(){canvas.width=innerWidth*Math.min(devicePixelRatio,1.5);canvas.height=innerHeight*Math.min(devicePixelRatio,1.5);fctx.setTransform(Math.min(devicePixelRatio,1.5),0,0,Math.min(devicePixelRatio,1.5),0,0);}size();addEventListener('resize',size);const items=Array.from({length:260},()=>({x:innerWidth/2,y:innerHeight/2,vx:(Math.random()-.5)*11,vy:(Math.random()-.5)*11,r:Math.random()*3+1,hue:Math.random()>.5?'255,194,216':'140,99,255',life:0,max:150+Math.random()*190}));function frame(){if(!finale.classList.contains('active')){requestAnimationFrame(frame);return;}fctx.fillStyle='rgba(3,1,6,.11)';fctx.fillRect(0,0,innerWidth,innerHeight);for(const p of items){p.x+=p.vx;p.y+=p.vy;p.vx*=.994;p.vy*=.994;p.life++;const a=Math.max(0,1-p.life/p.max);fctx.fillStyle=`rgba(${p.hue},${a})`;fctx.beginPath();fctx.arc(p.x,p.y,p.r,0,Math.PI*2);fctx.fill();if(p.life>p.max){p.x=innerWidth/2;p.y=innerHeight/2;p.life=0;p.vx=(Math.random()-.5)*11;p.vy=(Math.random()-.5)*11;}}requestAnimationFrame(frame);}frame();}

// Responsive mobile navigation
(() => {
  const header = document.querySelector('.header');
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  const backdrop = document.getElementById('menuBackdrop');
  if (!header || !toggle || !nav || !backdrop) return;

  const setMenu = (open) => {
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    backdrop.setAttribute('aria-hidden', String(!open));
  };

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  backdrop.addEventListener('click', () => setMenu(false));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
  }, { passive: true });
})();
