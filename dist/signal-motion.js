/* Signal-page choreography: scanner motion, a short reading hold, then a soft handoff. */
(()=>{'use strict';
const intro=document.querySelector('.signal-intro'),runway=intro.closest('.intro-runway');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const beam=document.createElement('div');beam.className='signal-scan';beam.setAttribute('aria-hidden','true');intro.querySelector('.signal-scene').append(beam);
const wave=intro.querySelector('.signal-wave');wave.replaceChildren(...Array.from({length:28},(_,i)=>{const bar=document.createElement('i');bar.style.setProperty('--n',i);bar.style.setProperty('--amplitude',String(.25+(Math.sin(i*2.7)+1)*.375));return bar}));
const bridge=document.createElement('div');bridge.className='archive-transition';bridge.setAttribute('aria-hidden','true');bridge.innerHTML='<div class="transition-orbit"></div><div class="transition-trace"></div>';document.querySelector('#archive').before(bridge);
let frame=0;
function layout(){
 const paused=reduce.matches||window.explorerMotion?.paused;
 // Pin only when every part of the intro fits on screen. Tall/mobile content stays scrollable.
 runway.classList.remove('signal-pinned');runway.style.height='';
 if(!paused&&innerWidth>800&&intro.offsetHeight<=innerHeight){runway.classList.add('signal-pinned');runway.style.height=(intro.offsetHeight+innerHeight*1.4)+'px'}
 wake();
}
function update(){frame=0;const r=runway.getBoundingClientRect();const p=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));intro.style.setProperty('--signal-progress',p.toFixed(4));}
function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(update)}
new IntersectionObserver(es=>es.forEach(e=>intro.classList.toggle('signal-in-view',e.isIntersecting)),{threshold:0}).observe(intro);
addEventListener('scroll',wake,{passive:true});addEventListener('resize',layout);addEventListener('motionchange',layout);reduce.addEventListener('change',layout);document.addEventListener('visibilitychange',()=>{intro.classList.toggle('signal-tab-hidden',document.hidden);wake()});
layout();
})();
