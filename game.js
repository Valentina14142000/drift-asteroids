const cv=document.getElementById('c'),g=cv.getContext('2d'),W=900,H=640;cv.width=W;cv.height=H;
const K={},TAU=Math.PI*2,FONT='Sora, system-ui, sans-serif';
let state='title',auto=false,ship,ast,bul,par,hunter,score,lives,level,hi=0,hunterT,waveT,last=0;
try{hi=+localStorage.getItem('drift-hi')||0}catch(e){}
addEventListener('keydown',e=>{K[e.code]=1;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='KeyA'&&!e.repeat)auto=!auto;
 if((e.code==='Space'||e.code==='Enter')&&state!=='play')start();});
addEventListener('keyup',e=>K[e.code]=0);
addEventListener('blur',()=>{for(const k in K)K[k]=0});
cv.addEventListener('pointerdown',()=>cv.focus());
window.focus();
document.querySelectorAll('[data-k]').forEach(b=>{
 b.addEventListener('pointerdown',e=>{K[b.dataset.k]=1;if(state!=='play'&&b.dataset.k==='Space')start()});
 ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>K[b.dataset.k]=0));});
document.getElementById('autoBtn').addEventListener('click',()=>{auto=!auto});

const wd=(a,b,m)=>{let d=b-a;return d-Math.round(d/m)*m},wr=(v,m)=>(v%m+m)%m;
const angd=(a,b)=>{let d=b-a;return d-Math.round(d/TAU)*TAU};

function start(){score=0;lives=3;level=1;ast=[];bul=[];par=[];hunter=null;hunterT=22;waveT=0;resetShip();wave();state='play'}
function resetShip(){ship={x:W/2,y:H/2,vx:0,vy:0,a:-Math.PI/2,inv:2.5,cool:0,th:0}}
function wave(){for(let i=0;i<2+level;i++){let x,y;do{x=Math.random()*W;y=Math.random()*H}
 while(Math.hypot(wd(ship.x,x,W),wd(ship.y,y,H))<220);ast.push(mk(x,y,44))}}
function mk(x,y,r){const a=Math.random()*TAU,sp=(30+Math.random()*40+level*6)*Math.sqrt(44/r),p=[];
 for(let i=0;i<11;i++)p.push(r*(.75+Math.random()*.35));
 return{x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r,p,rot:Math.random()*6,vr:(Math.random()-.5)*1.2}}
function boom(x,y,n,c){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=40+Math.random()*160;
 par.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.6,max:1.1,c})}}

// Lead-aiming: where to point so a bullet of speed bs meets a moving target
function lead(sx,sy,svx,svy,t,bs){
 const dx=wd(sx,t.x,W),dy=wd(sy,t.y,H),vx=t.vx-svx,vy=t.vy-svy;
 const A=vx*vx+vy*vy-bs*bs,B=2*(dx*vx+dy*vy),C=dx*dx+dy*dy;let T;
 if(Math.abs(A)<1e-6)T=-C/B;else{const D=B*B-4*A*C;if(D<0)return Math.atan2(dy,dx);
  const q=Math.sqrt(D);T=Math.min(...[(-B-q)/(2*A),(-B+q)/(2*A)].filter(v=>v>0))}
 if(!isFinite(T)||T<0)return Math.atan2(dy,dx);
 return Math.atan2(dy+vy*T,dx+vx*T)}

// Autopilot: predict closest approach for every rock, flee the worst threat, shoot the nearest rock with lead
function think(){
 const s=ship,o={l:0,r:0,t:0,f:0};let threat=null,tb=9;
 for(const a of ast){
  const dx=wd(s.x,a.x,W),dy=wd(s.y,a.y,H),vx=a.vx-s.vx,vy=a.vy-s.vy,v2=vx*vx+vy*vy||1e-6;
  const t=Math.max(0,Math.min(3,-(dx*vx+dy*vy)/v2)),md=Math.hypot(dx+vx*t,dy+vy*t)-a.r-14;
  if(md<35&&t<tb){tb=t;threat={dx,dy}}}
 let tgt=null,td=1e9;
 for(const a of ast.concat(hunter?[hunter]:[])){const d=Math.hypot(wd(s.x,a.x,W),wd(s.y,a.y,H));if(d<td){td=d;tgt=a}}
 const aim=tgt?lead(s.x,s.y,s.vx,s.vy,tgt,520):s.a;
 let want=aim;
 if(threat&&tb<1.6){want=Math.atan2(-threat.dy,-threat.dx);if(Math.abs(angd(s.a,want))<.7)o.t=1}
 const e=angd(s.a,want);if(e>.05)o.r=1;else if(e<-.05)o.l=1;
 if(tgt&&td<480&&Math.abs(angd(s.a,aim))<.07)o.f=1;
 return o}

function update(dt){
 const s=ship;
 const i=auto?think():{l:K.ArrowLeft||K.KeyL||K.KeyQ,r:K.ArrowRight||K.KeyD,t:K.ArrowUp||K.KeyW,f:K.Space};
 const L=auto?i.l:(K.ArrowLeft||K.KeyQ),R=auto?i.r:(K.ArrowRight||K.KeyD);
 if(L)s.a-=4*dt;if(R)s.a+=4*dt;
 s.th=i.t?1:0;
 if(i.t){s.vx+=Math.cos(s.a)*260*dt;s.vy+=Math.sin(s.a)*260*dt}
 const dr=Math.exp(-.5*dt);s.vx*=dr;s.vy*=dr;
 const sp=Math.hypot(s.vx,s.vy);if(sp>420){s.vx*=420/sp;s.vy*=420/sp}
 s.x=wr(s.x+s.vx*dt,W);s.y=wr(s.y+s.vy*dt,H);s.inv-=dt;s.cool-=dt;
 if(i.f&&s.cool<=0&&bul.filter(b=>!b.e).length<4){s.cool=.22;
  bul.push({x:s.x+Math.cos(s.a)*14,y:s.y+Math.sin(s.a)*14,vx:s.vx+Math.cos(s.a)*520,vy:s.vy+Math.sin(s.a)*520,life:1,e:0})}
 for(const a of ast){a.x=wr(a.x+a.vx*dt,W);a.y=wr(a.y+a.vy*dt,H);a.rot+=a.vr*dt}
 for(const b of bul){b.x=wr(b.x+b.vx*dt,W);b.y=wr(b.y+b.vy*dt,H);b.life-=dt}
 bul=bul.filter(b=>b.life>0);
 for(const p of par){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}par=par.filter(p=>p.life>0);

 // Hunter drone: predicts where you will be, and its aim sharpens each level
 hunterT-=dt;
 if(!hunter&&hunterT<=0){hunter={x:Math.random()<.5?0:W,y:Math.random()*H,vx:0,vy:0,hp:2,cool:1.5,r:16};hunterT=25}
 if(hunter){const h=hunter,dx=wd(h.x,s.x+s.vx*.6,W),dy=wd(h.y,s.y+s.vy*.6,H),d=Math.hypot(dx,dy)||1,k=d>240?1:-.6;
  h.vx+=dx/d*k*120*dt;h.vy+=dy/d*k*120*dt;const hs=Math.hypot(h.vx,h.vy);if(hs>130){h.vx*=130/hs;h.vy*=130/hs}
  h.x=wr(h.x+h.vx*dt,W);h.y=wr(h.y+h.vy*dt,H);h.cool-=dt;
  if(h.cool<=0&&state==='play'){h.cool=Math.max(.9,2.4-level*.18);
   const a=lead(h.x,h.y,0,0,{x:s.x,y:s.y,vx:s.vx,vy:s.vy},300)+(Math.random()-.5)*.5/(1+level*.5);
   bul.push({x:h.x,y:h.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,life:1.8,e:1})}}

 // collisions
 for(const b of bul){if(b.e)continue;
  for(const a of ast){if(a.dead)continue;if(Math.hypot(wd(b.x,a.x,W),wd(b.y,a.y,H))<a.r){a.dead=1;b.life=0;
   score+=a.r>40?20:a.r>20?50:100;boom(a.x,a.y,8+a.r/4,'#b9b3ee');
   if(a.r>16){const n=a.r>40?26:14;for(let j=0;j<2;j++){const c=mk(a.x,a.y,n);c.vx+=a.vx*.5;c.vy+=a.vy*.5;ast.push(c)}}break}}
  if(hunter&&b.life>0&&Math.hypot(wd(b.x,hunter.x,W),wd(b.y,hunter.y,H))<hunter.r+4){b.life=0;hunter.hp--;boom(b.x,b.y,6,'#ff4fa3');
   if(hunter.hp<=0){score+=300;boom(hunter.x,hunter.y,30,'#ff4fa3');hunter=null}}}
 ast=ast.filter(a=>!a.dead);
 if(s.inv<=0){
  let hit=ast.some(a=>Math.hypot(wd(s.x,a.x,W),wd(s.y,a.y,H))<a.r+9)
   ||bul.some(b=>b.e&&Math.hypot(wd(s.x,b.x,W),wd(s.y,b.y,H))<10)
   ||(hunter&&Math.hypot(wd(s.x,hunter.x,W),wd(s.y,hunter.y,H))<hunter.r+9);
  if(hit){boom(s.x,s.y,40,'#5ef2d0');shake=16;lives--;bul=bul.filter(b=>!b.e);
   if(lives<=0){state='over';try{if(score>hi){hi=score;localStorage.setItem('drift-hi',hi)}}catch(e){}if(score>hi)hi=score}
   else resetShip()}}
 if(!ast.length){waveT+=dt;if(waveT>1.5){waveT=0;level++;wave()}}
}

const stars=Array.from({length:130},()=>({x:Math.random()*W,y:Math.random()*H,z:.2+Math.random()*.8}));
let shake=0,bg=null,lastLives=-1;
const $=id=>document.getElementById(id);
function wrapDraw(x,y,r,fn){for(const ox of[-W,0,W])for(const oy of[-H,0,H]){const px=x+ox,py=y+oy;if(px>-r&&px<W+r&&py>-r&&py<H+r)fn(px,py)}}
function glow(c,b){g.strokeStyle=c;g.fillStyle=c;g.shadowColor=c;g.shadowBlur=b}
function draw(){
 if(!bg){bg=g.createRadialGradient(W*.7,H*.25,40,W/2,H/2,W*.8);bg.addColorStop(0,'#1d1342');bg.addColorStop(.55,'#0c0a24');bg.addColorStop(1,'#06050f')}
 g.save();g.shadowBlur=0;g.fillStyle=bg;g.fillRect(0,0,W,H);
 if(shake>0){g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-.8)}
 const mv=ship&&state==='play';
 for(const s of stars){if(mv){s.x=wr(s.x-ship.vx*s.z*.005,W);s.y=wr(s.y-ship.vy*s.z*.005,H)}
  g.globalAlpha=.25+s.z*.6;g.fillStyle='#e8e4ff';g.fillRect(s.x,s.y,s.z*2,s.z*2)}
 g.globalAlpha=1;g.lineWidth=2;g.lineJoin='round';
 if(ast)for(const a of ast)wrapDraw(a.x,a.y,a.r,(x,y)=>{g.beginPath();
  a.p.forEach((r,i)=>{const t=a.rot+i/a.p.length*TAU;g[i?'lineTo':'moveTo'](x+Math.cos(t)*r,y+Math.sin(t)*r)});g.closePath();
  g.fillStyle='rgba(169,163,217,.09)';g.fill();glow('#b9b3ee',10);g.stroke()});
 if(bul)for(const b of bul){glow(b.e?'#ff4fa3':'#ffd166',12);g.beginPath();g.arc(b.x,b.y,b.e?4:2.8,0,TAU);g.fill()}
 g.shadowBlur=0;
 if(par)for(const p of par){g.globalAlpha=Math.max(0,p.life/p.max);g.fillStyle=p.c;g.fillRect(p.x,p.y,2.5,2.5)}g.globalAlpha=1;
 if(hunter){const h=hunter;glow('#ff4fa3',16);g.beginPath();g.moveTo(h.x-17,h.y);g.lineTo(h.x-7,h.y-10);g.lineTo(h.x+7,h.y-10);g.lineTo(h.x+17,h.y);g.lineTo(h.x+7,h.y+9);g.lineTo(h.x-7,h.y+9);g.closePath();g.stroke();
  g.beginPath();g.arc(h.x,h.y,h.hp===2?5:2.5,0,TAU);g.fill()}
 if(state==='play'&&ship&&(ship.inv<=0||Math.floor(ship.inv*8)%2)){const s=ship,c=auto?'#ffd166':'#5ef2d0';
  wrapDraw(s.x,s.y,18,(x,y)=>{g.save();g.translate(x,y);g.rotate(s.a);glow(c,16);
   g.beginPath();g.moveTo(16,0);g.lineTo(-11,-10);g.lineTo(-6,0);g.lineTo(-11,10);g.closePath();g.stroke();
   if(s.th){glow('#ff4fa3',14);g.beginPath();g.moveTo(-8,-4);g.lineTo(-20-Math.random()*8,0);g.lineTo(-8,4);g.stroke()}g.restore()})}
 g.restore()}
function ui(){
 const b=document.body;b.dataset.state=state;b.dataset.auto=auto?1:0;
 $('autoBtn').setAttribute('aria-pressed',auto);
 if(state!=='title'){$('score').textContent=score;$('wave').textContent=level}
 $('best').textContent=hi;$('final').textContent=score;$('newbest').hidden=!(state==='over'&&score>0&&score>=hi);
 const n=state==='title'?0:Math.max(0,lives);
 if(n!==lastLives){lastLives=n;$('lives').innerHTML='<i></i>'.repeat(n)}}
document.querySelectorAll('.go').forEach(b=>b.addEventListener('click',()=>{start();cv.focus()}));
$('demo').addEventListener('click',()=>{auto=true;start();cv.focus()});
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;
 if(state==='play'||state==='over'){if(state==='play')update(dt);else{ // keep the debris drifting
  for(const a of ast){a.x=wr(a.x+a.vx*dt,W);a.y=wr(a.y+a.vy*dt,H);a.rot+=a.vr*dt}
  for(const p of par){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}par=par.filter(p=>p.life>0)}}
 draw();ui();requestAnimationFrame(loop)}
requestAnimationFrame(loop);