/* One frame-rate-independent animation clock. Reading never auto-advances. */
(()=>{'use strict';
const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
const runway=$('.cosmic-runway'),stage=$('.cosmic-stage'),canvas=$('#cosmos'),ctx=canvas.getContext('2d',{alpha:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scrollBar=$('.scroll-progress');let scrollFrac=0;let width=0,height=0,clock=0,last=0,progress=0,target=0,raf=0,paused=window.explorerMotion.paused,needs=true;
const pointer={x:0,y:0,tx:0,ty:0};
const chapters=all('.scroll-story').map(el=>({el,art:el.querySelector('.story-landscape'),craft:el.querySelector('.story-craft'),giant:el.querySelector('.story-giant'),line:el.querySelector('.story-line i'),steps:Array.from(el.querySelectorAll('.story-step')),p:0}));
const flightProgress=$('.flight-progress i'),stopButtons=all('[data-stop]');
const backdrop=document.createElement('canvas'),sunSprite=document.createElement('canvas');
let backgroundDirty=true,lastStop=-1;
const headings=all('.cosmic-heading');const stars=Array.from({length:160},(_,i)=>({x:fract(Math.sin(i*12.98)*43758),y:fract(Math.sin(i*78.23)*15731),r:i%17===0?1.55:i%7===0?1:.55,color:['#c8d8ef','#fff1d6','#d9e5ed'][i%3]}));
function fract(x){return x-Math.floor(x)}
const planets=[{name:'Mercury',r:2.1,size:.12,color:[151,141,121],a:2.5,speed:.18},{name:'Venus',r:3.2,size:.24,color:[204,167,102],a:5.1,speed:.12},{name:'Earth',r:4.7,size:.32,color:[48,103,147],a:.6,speed:.07},{name:'Mars',r:6.3,size:.25,color:[192,100,59],a:3.5,speed:.055},{name:'Jupiter',r:8.5,size:.65,color:[203,167,128],a:4.6,speed:.033},{name:'Saturn',r:10.5,size:.51,color:[196,178,132],a:1.3,speed:.024},{name:'Uranus',r:12.3,size:.34,color:[121,175,181],a:2.9,speed:.018},{name:'Neptune',r:14,size:.32,color:[68,99,165],a:5.7,speed:.014}];
// Prebaked surfaces retain fine detail without blocking the animation thread.
function texture(name){const load=suffix=>{const image=new Image();image.decoding='async';image.onload=()=>{needs=true;wake()};image.src='assets/solar/'+name+suffix+'.webp';return image};const img=load('');img.levels=[load('-128'),load('-1024')];return img}
planets.forEach(p=>p.texture=texture(p.name.toLowerCase()));
const moonTexture=texture('moon'),sunTexture=texture('sun');
function ready(img){return img.complete&&img.naturalWidth>0}
function detail(img,diameter){const pixels=diameter*(canvas.width/Math.max(1,width));return img.levels?.find(level=>ready(level)&&level.naturalWidth>=pixels)||(ready(img)?img:img.levels?.find(ready))||img}

function point(p){const a=p.a+clock*p.speed;return {x:Math.cos(a)*p.r,y:Math.sin(a)*p.r*.46}}
function camera(p,moon,mars){let keys=[{p:0,x:0,y:0,z:1},{p:.11,x:0,y:0,z:1},{p:.37,x:moon.x,y:moon.y,z:68},{p:.47,x:moon.x,y:moon.y,z:68},{p:.65,x:(moon.x+mars.x)*.22,y:0,z:1.4},{p:.9,x:mars.x,y:mars.y,z:38},{p:1,x:mars.x,y:mars.y,z:38}];let i=0;while(i<keys.length-2&&p>keys[i+1].p)i++;const a=keys[i],b=keys[i+1],t=ease((p-a.p)/(b.p-a.p));return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:Math.exp(mix(Math.log(a.z),Math.log(b.z),t))}}
function cacheArtwork(){
const g=backdrop.getContext('2d',{alpha:false});backdrop.width=Math.max(1,Math.round(width));backdrop.height=Math.max(1,Math.round(height));
g.fillStyle='#080d12';g.fillRect(0,0,width,height);const bg=g.createRadialGradient(width*.68,height*.43,0,width*.68,height*.43,width*.7);bg.addColorStop(0,'#1a2c342f');bg.addColorStop(1,'#080d1200');g.fillStyle=bg;g.fillRect(0,0,width,height);
if(!sunSprite.dataset.ready){sunSprite.width=sunSprite.height=768;const g=sunSprite.getContext('2d'),c=384,r=c/5;const glow=g.createRadialGradient(c,c,r*.3,c,c,r*5);glow.addColorStop(0,'#ffe6a8');glow.addColorStop(.16,'#f9c574');glow.addColorStop(.24,'#c982303b');glow.addColorStop(1,'#ad602000');g.fillStyle=glow;g.fillRect(0,0,768,768);const hot=g.createRadialGradient(c-r*.3,c-r*.3,0,c,c,r);hot.addColorStop(0,'#fff8dc');hot.addColorStop(.65,'#f8d494');hot.addColorStop(1,'#cf853b');g.fillStyle=hot;g.beginPath();g.arc(c,c,r,0,Math.PI*2);g.fill();sunSprite.dataset.ready='true'}
backgroundDirty=false;
}
function draw(){if(!ctx)return;const w=width,h=height;if(backgroundDirty)cacheArtwork();ctx.drawImage(backdrop,0,0,w,h);
for(const s of stars){ctx.globalAlpha=.3+.35*s.r;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc((s.x*w+pointer.x*8+w)%w,(s.y*h+pointer.y*8+h)%h,s.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
const points=planets.map(point),earth=points[2],moon={x:earth.x+Math.cos(clock*.14+.5)*1.15,y:earth.y+Math.sin(clock*.14+.5)*.62},mars=points[3],cam=camera(progress,moon,mars);const base=Math.min(w*(w<800?.95:.68),h*1.45)/29,scale=base*cam.z,focus=ease(clamp((cam.z-1)/12)),ox=mix(w*(w<800?.5:.64),w<800?w*.68:w*.72,focus),oy=mix(h*(w<800?.59:.48),h*.46,focus);const project=(x,y)=>({x:ox+(x-cam.x)*scale+pointer.x*9,y:oy+(y-cam.y)*scale+pointer.y*6});
ctx.strokeStyle='#a2b6bc';ctx.lineWidth=.7;ctx.globalAlpha=.17*(1-focus);if(focus<.999)for(const p of planets){const o=project(0,0);ctx.beginPath();ctx.ellipse(o.x,o.y,p.r*scale,p.r*scale*.46,0,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
const sun=project(0,0),sr=.78*scale;if(sun.x+sr*5>0&&sun.x-sr*5<w&&sun.y+sr*5>0&&sun.y-sr*5<h){ctx.drawImage(sunSprite,sun.x-sr*5,sun.y-sr*5,sr*10,sr*10);if(ready(sunTexture))ctx.drawImage(sunTexture,sun.x-sr,sun.y-sr,sr*2,sr*2)}
function saturnRing(x,y,r,front){ctx.save();ctx.translate(x,y);ctx.rotate(-.3);for(let i=0;i<24;i++){const f=i/23,rad=r*(1.25+f*.88);if(f>.53&&f<.62)continue;ctx.strokeStyle=`rgba(${Math.round(202+f*27)},${Math.round(185+f*24)},${Math.round(143+f*34)},${.28+Math.sin(f*26)**2*.35})`;ctx.lineWidth=Math.max(.45,r*.034);ctx.beginPath();ctx.ellipse(0,0,rad,rad*.29,0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke()}ctx.restore()}

function body(texture,pt,r,name,ring=false){let s=project(pt.x,pt.y),pr=r*scale;if(s.x+pr*2<0||s.x-pr*2>w||s.y+pr*2<0||s.y-pr*2>h)return;if(ring)saturnRing(s.x,s.y,pr,false);const image=detail(texture,pr*2);if(ready(image))ctx.drawImage(image,s.x-pr,s.y-pr,pr*2,pr*2);if(ring)saturnRing(s.x,s.y,pr,true);if(cam.z<3){ctx.font='9px Arial';ctx.fillStyle='#a8bab8';ctx.globalAlpha=.65;ctx.fillText(name.toUpperCase(),s.x+pr+7,s.y+3);ctx.globalAlpha=1}}
planets.forEach((p,i)=>body(p.texture,points[i],p.size,p.name,p.name==='Saturn'));body(moonTexture,moon,.15,'Moon');
// A quiet targeting ring ties the overview to each close approach.
if(cam.z>10){let center=project(progress<.6?moon.x:mars.x,progress<.6?moon.y:mars.y);ctx.strokeStyle='#bdcdae33';ctx.lineWidth=.6;ctx.beginPath();ctx.arc(center.x,center.y,Math.min(w,h)*.31,0,Math.PI*2);ctx.stroke()}
}
function rectProgress(el){const r=el.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-height))}
function flightUI(){const weights=[1-ease((progress-.13)/.14),ease((progress-.21)/.13)*(1-ease((progress-.48)/.12)),ease((progress-.71)/.16)];headings.forEach((e,i)=>{const a=weights[i];e.style.opacity=a;e.style.transform=`translate3d(0,${(1-a)*28}px,0)`;e.setAttribute('aria-hidden',a<.05)});flightProgress.style.transform=`scaleX(${progress})`;const stop=progress<.2?0:progress<.66?1:2;if(stop!==lastStop){lastStop=stop;stopButtons.forEach((e,i)=>e.setAttribute('aria-pressed',String(i===stop)))}}
function stories(dt){const rects=chapters.map(c=>c.el.getBoundingClientRect());const stepRects=chapters.map((c,ci)=>rects[ci].bottom<0||rects[ci].top>height?null:c.steps.map(st=>st.getBoundingClientRect()));let visible=false;chapters.forEach((c,ci)=>{const r=rects[ci];if(r.bottom<0||r.top>height)return;visible=true;const to=clamp((height*.4-r.top)/(r.height-height*.3));c.p+=(to-c.p)*(paused?1:1-Math.exp(-dt*5));const p=c.p;if(!paused){c.art.style.transform=`scale(${1.03+p*.1}) translate3d(${-p*3}%,${-p*2}%,0)`;c.craft.style.transform=`translate3d(${mix(-7,4,p)}%,${mix(4,-3,p)}%,0) scale(${mix(.94,1.12,p)})`;c.giant.style.transform=`translate3d(${-p*90}px,${p*70}px,0)`}c.line.style.transform=`scaleY(${clamp(-r.top/(r.height-height))})`;c.steps.forEach((step,si)=>{const sr=stepRects[ci][si];const reveal=clamp((height*.92-sr.top)/(height*.34));for(const child of step.children){child.style.opacity=paused?1:mix(.3,1,ease(reveal));child.style.transform=paused?'none':`translate3d(0,${(1-ease(reveal))*24}px,0)`}})});return visible}function frame(now){raf=0;if(document.hidden)return;const dt=Math.min((now-last)/1000,.04)||.016;last=now;const rr=runway.getBoundingClientRect();const on=rr.bottom>0&&rr.top<innerHeight;const wheelState=window.explorerWheel?.measure();
const rectP=clamp(-rr.top/Math.max(1,rr.height-height));if(needs)scrollFrac=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
if(!paused){clock+=dt*(progress<.12?1:.04);pointer.x+=(pointer.tx-pointer.x)*(1-Math.exp(-dt*3));pointer.y+=(pointer.ty-pointer.y)*(1-Math.exp(-dt*3));target=rectP;progress+=(target-progress)*(1-Math.exp(-dt*6));}else progress=target;
if(on){draw();flightUI()}
const anyVisible=stories(dt);const wheelMoving=window.explorerWheel?.tick(dt,wheelState);scrollBar.style.transform=`scaleX(${scrollFrac})`;needs=false;
if((wheelMoving&&!paused)||(on&&!paused)||Math.abs(target-progress)>.0005||(anyVisible&&!paused))raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame)}}
function resize(){width=stage.clientWidth;height=stage.clientHeight;scrollFrac=scrollY/Math.max(1,document.documentElement.scrollHeight-height);const d=Math.min(devicePixelRatio||1,2,Math.sqrt(8300000/Math.max(1,width*height)));canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx?.setTransform(d,0,0,d,0,0);if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high'}backgroundDirty=true;needs=true;wake()}
function cancelFlight(){wake()}
all('[data-stop]').forEach(b=>b.addEventListener('click',()=>{cancelFlight();target=+b.dataset.stop;if(paused){progress=target;needs=true}else{const y=runway.getBoundingClientRect().top+scrollY;window.scrollTo({top:y+target*(runway.offsetHeight-height),behavior:'smooth'})}wake()}));
addEventListener('scroll',()=>{needs=true;wake()},{passive:true});addEventListener('wheel',cancelFlight,{passive:true});addEventListener('touchstart',cancelFlight,{passive:true});addEventListener('keydown',e=>{if(['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(e.key))cancelFlight()});
addEventListener('resize',resize);addEventListener('motionchange',()=>{paused=window.explorerMotion.paused;cancelFlight();if(paused){chapters.forEach(c=>{c.art.style.transform='';c.craft.style.transform='';c.giant.style.transform=''})}needs=true;resize()});document.addEventListener('visibilitychange',()=>{last=performance.now();wake()});stage.addEventListener('pointermove',e=>{pointer.tx=e.clientX/width-.5;pointer.ty=e.clientY/height-.5});
all('a[href^="#"]').forEach(a=>a.addEventListener('click',cancelFlight));
resize();
})();
