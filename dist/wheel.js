/* Mission wheel. The six cards gather into the first rover, then the mission presentation plays on scroll.
   Scroll is the only driver; every frame writes transform and opacity only. */
(()=>{'use strict';
const section=document.querySelector('.orbital-stories');if(!section||!window.ReelKit)return;
const stage=section.querySelector('.wheel-stage');
const M=window.MISSIONS||[],{buildMission,PER}=window.ReelKit;
const cards=[...section.querySelectorAll('.orbit-card')],rings=[...section.querySelectorAll('.orbit-ring')];
// The centre text and the old reader panels are no longer used.
section.querySelectorAll('.orbit-hub,.wheel-reader').forEach(e=>e.remove());
const posEl=section.querySelector('#wheel-position'),barEl=section.querySelector('.wheel-progress i');
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const BOX=200,RING=1000,DISC=400,ORBIT_END=.12,TOTAL=M.length*PER;
document.documentElement.classList.add('wheel-ready');
let p=0,first=true,cur=-1,label='',cardsOn=true;

// Presentation: every mission's slides in one stack.
const mono=document.createElement('div');mono.className='mono-bg';mono.setAttribute('aria-hidden','true');mono.innerHTML=window.ReelKit.monoHTML;stage.prepend(mono);
const pres=document.createElement('div');pres.className='wheel-present';
stage.append(pres);
const slides=[];
M.forEach((m,i)=>buildMission(m,i,{next:()=>goSlide(cur+1),open:j=>goMission(j)}).forEach(s=>{slides.push(s);pres.append(s)}));
slides.forEach(s=>{s.inert=true;s.setAttribute('aria-hidden','true')});

// The disc the cards gather into: the first rover.
const disc=document.createElement('div');disc.className='morph-disc';
const dimg=new Image();dimg.src='assets/'+M[0].image;dimg.alt='';disc.append(dimg);stage.append(disc);

function active(){const r=section.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}

function measure(){return {r:section.getBoundingClientRect(),w:stage.clientWidth,h:stage.clientHeight}}
function tick(dt,state=measure()){
  const {r,w,h}=state;
  if(r.top>=innerHeight||r.bottom<=0)return false;
  const paused=!!window.explorerMotion?.paused;
  const target=clamp(-r.top/Math.max(1,r.height-h));
  p=first||paused?target:mix(p,target,1-Math.exp(-dt*9));
  if(Math.abs(target-p)<.000001)p=target;
  first=false;
  const busy=Math.abs(target-p)>.000001;
  const cx=w/2,cy=h/2;

  // Phase 1: the cards gather toward the centre.
  const mm=smooth(p/ORBIT_END);
  const R0=Math.min(w*.34,h*.35),S0=Math.min(w*.19,h*.25);
  const rad=R0*(1-mm),size=S0*(1-.8*mm),fade=1-smooth((mm-.55)/.45);
  cards.forEach((c,i)=>{const a=i*Math.PI/3,x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
    c.style.transform=`translate3d(${x-BOX/2}px,${y-BOX/2}px,0) scale(${size/BOX})`;
    c.style.opacity=fade;});
  const showCards=fade>=.02;
  if(showCards!==cardsOn){cards.forEach(c=>{c.style.pointerEvents=showCards?'':'none';c.inert=!showCards});cardsOn=showCards}
  rings.forEach((ring,k)=>{const rr=Math.max(rad*(k?1.08:1),.01);ring.style.transform=`translate3d(${cx-RING/2}px,${cy-RING/2}px,0) rotate(${-mm*60}deg) scale(${rr/(RING/2)})`;ring.style.opacity=1-mm});

  // The disc grows from the gathered cards, then dissolves into the presentation.
  const dIn=smooth(mm),dOut=smooth((p-ORBIT_END)/.04);
  const ds=DISC?Math.min(w*.36,h*.56)/DISC*mix(.5,1,dIn):0;
  disc.style.transform=`translate3d(${cx-DISC/2}px,${cy-DISC/2}px,0) scale(${ds})`;
  disc.style.opacity=dIn*(1-dOut);

  // Phase 2: the presentation, one slide per slice of scroll.
  const s=clamp((p-ORBIT_END)/(1-ORBIT_END))*TOTAL;
  const idx=Math.min(TOTAL-1,Math.floor(s));
  pres.style.opacity=smooth((p-ORBIT_END)/.04);
  pres.style.visibility=p>ORBIT_END*.9?'visible':'hidden';
  pres.inert=p<=ORBIT_END;pres.classList.toggle('reel-still',paused);
  if(idx!==cur){
    slides.forEach((sl,k)=>{sl.classList.toggle('is-active',k===idx);sl.classList.toggle('is-before',k<idx);sl.classList.toggle('is-after',k>idx);sl.inert=k!==idx;sl.setAttribute('aria-hidden',String(k!==idx))});
    cur=idx;
  }
  const mission=Math.floor(Math.max(cur,0)/PER);
  const text=p<ORBIT_END?'SCROLL TO EXPAND ↓':`0${mission+1} / 06 — ${M[mission].name.toUpperCase()}`;
  if(text!==label){label=text;if(posEl)posEl.textContent=text}
  if(barEl)barEl.style.transform=`scaleX(${p})`;
  return busy;
}

// Scroll to a slide (k = -1 is the top of the wheel).
function goSlide(k){
  const r=section.getBoundingClientRect();
  const kk=Math.max(-1,Math.min(TOTAL-1,k));
  const t=kk<0?0:ORBIT_END+(kk+.5)/TOTAL*(1-ORBIT_END);
  window.scrollTo({top:r.top+scrollY+t*(section.offsetHeight-stage.clientHeight),behavior:window.explorerMotion?.paused?'instant':'smooth'});
}
function goMission(i){goSlide(i*PER)}

cards.forEach(c=>c.addEventListener('click',()=>{const name=c.querySelector('strong').textContent.trim();const i=M.findIndex(m=>m.name===name);goMission(i<0?0:i)}));
section.querySelector('#wheel-prev')?.addEventListener('click',()=>goSlide(cur-1));
section.querySelector('#wheel-next')?.addEventListener('click',()=>cur>=TOTAL-1?document.querySelector('#archive')?.scrollIntoView({behavior:'smooth'}):goSlide(cur+1));
section.querySelector('#wheel-overview')?.addEventListener('click',()=>goSlide(-1));

// Archive rows and "#story-" links open the presentation at that mission.
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#story-"]');if(!a)return;const id=a.getAttribute('href').slice(1);const i=M.findIndex(m=>'story-'+m.id===id);if(i>=0){e.preventDefault();history.replaceState(null,'','#'+id);goMission(i)}});
function hash(){const i=M.findIndex(m=>'#story-'+m.id===location.hash);if(i>=0)goMission(i)}
addEventListener('hashchange',hash);addEventListener('load',hash);
addEventListener('resize',()=>{first=true});

// Arrow keys share the same navigation as the visible controls.
document.addEventListener('keydown',e=>{
 const r=section.getBoundingClientRect();
 if(r.top>innerHeight*.2||r.bottom<innerHeight*.8||document.querySelector('dialog[open]')||document.body.classList.contains('locked')||e.target.closest('input,textarea,select,[contenteditable]'))return;
 if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
 e.preventDefault();if(e.repeat)return;
 document.dispatchEvent(new Event('storynavigate'));
 if(e.key==='ArrowLeft')goSlide(p<ORBIT_END?-1:cur-1);
 else if(p<ORBIT_END)goSlide(0);
 else if(cur>=TOTAL-1)document.querySelector('#archive')?.scrollIntoView({behavior:'smooth'});
 else goSlide(cur+1);
});
window.explorerWheel={tick,active,measure};
})();
