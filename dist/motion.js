/* Scroll choreography. Native scrolling remains the source of truth. */
(()=>{'use strict';
const one=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const hero=one('.hero'),features=one('.featured'),cards=all('.feature-card');
const wrap=document.createElement('div');wrap.className='hero-runway';hero.before(wrap);wrap.append(hero);
const departure=document.createElement('div');departure.className='departure';departure.innerHTML='<span class="eyebrow">BEYOND THE SIGNAL</span><p>Leave Earth<br>behind.</p><span class="eyebrow">THE STORIES ARE STILL HERE ↓</span>';hero.append(departure);
const track=document.createElement('div');track.className='feature-track';cards[0].before(track);cards.forEach(c=>track.append(c));
const pin=document.createElement('div');pin.className='feature-pin';features.prepend(pin);Array.from(features.children).filter(e=>e!==pin).forEach(e=>pin.append(e));
const band=document.createElement('div');band.className='transmission-band';band.setAttribute('aria-hidden','true');band.innerHTML='<div>FAR FROM HOME <b>✳</b> CLOSE TO US <b>✳</b> FAR FROM HOME <b>✳</b> CLOSE TO US <b>✳</b></div>';one('#intro').after(band);
const dust=document.createElement('canvas');dust.className='star-flight';dust.setAttribute('aria-hidden','true');hero.prepend(dust);const ctx=dust.getContext('2d');
const words=one('.intro h2');const original=words.innerHTML;
words.innerHTML=original.replace(/([^<>]+)(?=<|$)/g,(text)=>text.trim()?text.split(/(\s+)/).map(w=>w.trim()?`<span class="lit-word">${w}</span>`:w).join(''):text);
const introWords=all('.lit-word');let frame=0,last=0,clock=0,previousScroll=scrollY,velocity=0,pointer={x:0,y:0},chapter=-1;
const stars=Array.from({length:85},(_,i)=>({x:Math.sin(i*127.1)*.5,y:Math.cos(i*311.7)*.5,z:(i%17)/17+.15}));
let enabled=false;let wide=innerWidth>800;let heroW=0,heroH=0;
const heroTitle=one('.hero-title'),heroCopy=one('.hero-copy'),orbitLine=one('.orbital-line'),introEl=one('#intro'),asterisk=one('.intro .asterisk'),journeyEl=one('#journey'),journeyArt=one('.journey-art'),chapterYearEl=one('#chapter-year'),journeyText=one('.journey-text'),legacyEl=one('.legacy'),legacyH2=one('.legacy h2'),legacyNoise=one('.legacy-noise'),cardImgs=cards.map(c=>c.querySelector('img'));
function resize(){wide=innerWidth>800;heroW=hero.clientWidth;heroH=hero.clientHeight;dust.width=heroW;dust.height=heroH;ctx?.setTransform(1,0,0,1,0,0);wake()}
function state(){enabled=!reduce.matches&&!window.explorerMotion?.paused;document.documentElement.classList.toggle('cinematic-motion',enabled);if(!enabled){for(const e of [hero,one('.hero-title'),one('.hero-copy'),track,band.firstElementChild,one('.legacy h2'),...cards.map(c=>c.querySelector('img'))])e.style.transform='';one('.hero-title').style.opacity='';one('.hero-copy').style.opacity='';introWords.forEach(w=>w.style.opacity='1');ctx?.clearRect(0,0,dust.width,dust.height);window.explorerCamera=0;}resize();wake()}
function progress(e){const r=e.getBoundingClientRect();return clamp(-r.top/Math.max(1,e.offsetHeight-innerHeight))}
function enter(e){const r=e.getBoundingClientRect();return clamp((innerHeight-r.top)/(innerHeight+r.height))}
function update(now){frame=0;if(document.hidden)return;const dt=Math.min((now-last)/1000,.04)||0;last=now;if(!enabled)return;
clock+=dt;velocity+=(scrollY-previousScroll-velocity)*.12;previousScroll=scrollY;
// READ PHASE: all layout measurements first, then all writes. Interleaving them forces a layout per read.
const rWrap=wrap.getBoundingClientRect(),rHero=hero.getBoundingClientRect(),rIntro=introEl.getBoundingClientRect(),rBand=band.getBoundingClientRect(),rFeat=features.getBoundingClientRect(),rJourney=journeyEl.getBoundingClientRect(),rLegacy=legacyEl.getBoundingClientRect(),rCards=wide?null:cards.map(c=>c.getBoundingClientRect());
const offWrap=wrap.offsetHeight,offFeat=features.offsetHeight,offJourney=journeyEl.offsetHeight;
const trackW=wide?track.scrollWidth:0,pinW=wide?pin.clientWidth:0;
const chapterText=chapterYearEl.textContent;
const prog=(r,h)=>clamp(-r.top/Math.max(1,h-innerHeight));
const ent=r=>clamp((innerHeight-r.top)/(innerHeight+r.height));
// WRITE PHASE
const hp=prog(rWrap,offWrap);window.explorerCamera=hp;
departure.style.opacity=clamp((hp-.48)*2.5);departure.style.transform=`translateY(${(1-hp)*80}px)`;
heroTitle.style.transform=`translate3d(${-hp*innerWidth*.16}px,${-hp*innerHeight*.23}px,0) scale(${1+hp*.32})`;
heroTitle.style.opacity=1-clamp((hp-.35)/.6);
heroCopy.style.transform=`translateY(${-hp*130}px)`;heroCopy.style.opacity=1-hp;
orbitLine.style.transform=`rotate(${-23+hp*110+clock*1.5}deg) scale(${1+hp*1.7})`;
const ip=clamp((innerHeight*.8-rIntro.top)/(innerHeight*.7));
introWords.forEach((w,i)=>w.style.opacity=.18+.82*clamp(ip*1.6-i/introWords.length));
band.firstElementChild.style.transform=`translateX(${-ent(rBand)*30}%)`;
if(wide){const fp=prog(rFeat,offFeat),distance=Math.max(0,trackW-pinW+innerWidth*.1);track.style.transform=`translate3d(${-fp*distance}px,0,0)`;cards.forEach((c,i)=>{const local=clamp(fp*2-i*.8);cardImgs[i].style.transform=`scale(1.15) translateX(${(local-.5)*7}%) rotate(${(local-.5)*1.5}deg)`})}
else{track.style.transform='';cards.forEach((c,i)=>cardImgs[i].style.transform=`scale(1.16) translateY(${(ent(rCards[i])-.5)*14}%)`)}
const jp=prog(rJourney,offJourney);journeyArt.style.transform=`rotate(${jp*160}deg) scale(${.65+jp*.7})`;
if(chapter!==chapterText){chapter=chapterText;[chapterYearEl,journeyText].forEach((el,i)=>{el.getAnimations?.().forEach(a=>a.cancel());el.animate?.([{opacity:0,transform:`translateY(${30+i*20}px)`},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:i*80,easing:'cubic-bezier(.22,1,.36,1)'})})}
const le=ent(rLegacy);legacyH2.style.transform=`translateX(${(1-le)*-65}px)`;legacyNoise.style.transform=`scale(1.2) rotate(${le*18}deg)`;
if(ctx&&rHero.bottom>0&&rHero.top<innerHeight){const w=heroW,h=heroH;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#e9efdd';ctx.fillStyle='#e9efdd';for(const s of stars){const z=((s.z-clock*.025+100)%1.2)+.15,k=(1+hp*1.8)/z;const x=w*.57+(s.x*w+pointer.x*12)*k,y=h*.44+(s.y*h+pointer.y*12)*k;ctx.globalAlpha=clamp(.55-z*.25);const stretch=1+hp*.07+Math.min(Math.abs(velocity),50)*.001;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(w*.57+(x-w*.57)*stretch,h*.44+(y-h*.44)*stretch);ctx.lineWidth=hp>.2?1:.7;ctx.stroke();ctx.fillRect(x,y,1,1)}ctx.globalAlpha=1}
if(scrollY<offWrap||Math.abs(velocity)>.1)frame=requestAnimationFrame(update);
}
function wake(){if(!frame&&enabled&&!document.hidden)frame=requestAnimationFrame(update)}
addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);addEventListener('motionchange',state);reduce.addEventListener('change',state);document.addEventListener('visibilitychange',wake);
hero.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5});
for(const card of cards){card.addEventListener('pointermove',e=>{if(!enabled||e.pointerType==='touch')return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.querySelector('.feature-visual').style.transform=`perspective(1000px) rotateX(${-y*5}deg) rotateY(${x*5}deg)`});card.addEventListener('pointerleave',()=>card.querySelector('.feature-visual').style.transform='')}
if('IntersectionObserver' in window){const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('motion-in');ob.unobserve(e.target)}}),{threshold:.1});all('.intro-stats>div,.archive-row,.footer-top,.legacy-bottom').forEach((e,i)=>{e.style.setProperty('--stagger',`${i%6*65}ms`);e.classList.add('motion-reveal');ob.observe(e)})}
// When tabbing through a horizontal story, bring its scene into view.
cards.forEach((c,i)=>c.addEventListener('focus',()=>{if(enabled&&wide){const travel=features.offsetHeight-innerHeight;window.scrollTo({top:features.offsetTop+travel*i,behavior:'auto'})}}));
state();
})();
