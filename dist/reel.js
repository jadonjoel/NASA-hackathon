/* Story presentation. buildMission() makes the six slides for one mission and is shared by the
   full-screen viewer and the scroll presentation on the wheel. */
(()=>{'use strict';
const M=window.MISSIONS||[];
const still=matchMedia('(prefers-reduced-motion: reduce)');
const PER=5;
// Monochrome orbit lines and a drifting star grid. Shared by the presentation and the wheel.
const monoHTML='<svg viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><ellipse cx="0" cy="0" rx="160" ry="70" transform="rotate(-23)"/><ellipse cx="0" cy="0" rx="240" ry="110" transform="rotate(-23)"/><ellipse cx="0" cy="0" rx="330" ry="150" transform="rotate(-23)"/><ellipse cx="0" cy="0" rx="420" ry="190" transform="rotate(-23)"/><ellipse cx="0" cy="0" rx="500" ry="230" transform="rotate(-23)"/></svg>';
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function visual(m){const v=el('div','reel-visual');const img=new Image();img.src='assets/'+m.image;img.alt='';v.append(img);return v}

// ctx: next() moves forward, open(i) opens mission i, close() (optional) shows a back button.
function buildMission(m,i,ctx){
  const out=[];
  const add=(cls)=>{const s=el('section','reel-slide '+cls);s.dataset.mission=i;out.push(s);return s};
  // 1. Kinetic headline.
  const hero=add('reel-hero');
  const h=el('h2','reel-kinetic');
  (m.headline||m.name).split(' ').forEach((w,k)=>{const sp=el('span','reel-word',w);sp.style.setProperty('--d',(k*80)+'ms');h.append(sp,' ')});
  hero.append(el('p','eyebrow',`${m.number} / ${m.world.toUpperCase()} / ${m.years}`),h,el('p','reel-sub',m.name));
  // 2. Info.
  const info=add('reel-info');
  const text=el('div','reel-info-text');
  const dl=el('dl','reel-facts');
  m.facts.forEach(([k,v])=>{dl.append(el('dt','',k),el('dd','',v))});
  const cta=el('button','reel-cta','Continue →');cta.type='button';cta.addEventListener('click',()=>ctx.next());
  text.append(el('p','eyebrow',m.kind),el('h2','reel-title',m.name),el('p','reel-lede',m.story),dl,cta);
  if(!ctx.close){const read=el('button','reel-ghost','Read in full screen');read.type='button';read.addEventListener('click',()=>open(i));text.append(read)}
  const figure=el('figure','reel-info-figure');
  const artwork=visual(m);artwork.querySelector('img').alt='Illustration of '+m.name;
  figure.append(artwork,el('figcaption','reel-caption',`${m.place} · ${m.status}`));
  info.append(text,figure);
  // 4. What remains.
  const rem=add('reel-remains');
  rem.append(el('p','eyebrow','02 / WHAT REMAINS'),el('h2','reel-title','What remains.'),el('p','reel-lede',m.legacy));
  // 5. Timeline.
  const tl=add('reel-timeline-slide');
  const ol=el('ol','reel-timeline');
  m.timeline.forEach(([d,e],k)=>{const li=el('li','');li.style.setProperty('--d',(k*120)+'ms');li.append(el('span','',d),el('span','',e));ol.append(li)});
  tl.append(el('p','eyebrow','03 / THE TIMELINE'),el('h2','reel-title','Timeline.'),ol);
  // 6. End card.
  const end=add('reel-end');
  const next=M[(i+1)%M.length];
  const nb=el('button','reel-cta',`Next story: ${next.name} →`);nb.type='button';nb.addEventListener('click',()=>ctx.open((i+1)%M.length));
  const actions=el('div','reel-actions');actions.append(nb);
  if(ctx.close){const back=el('button','reel-ghost','Back to all six stories');back.type='button';back.addEventListener('click',()=>ctx.close());actions.append(back)}
  const src=el('a','reel-source',m.sourceLabel);src.href=m.source;src.target='_blank';src.rel='noopener';
  end.append(el('p','eyebrow','THE RECORD'),el('h2','reel-title',m.name+'.'),src,actions);
  return out;
}

// Full-screen viewer.
const dlg=document.createElement('dialog');
dlg.id='story-reel';dlg.className='story-reel dialog-close-host';dlg.setAttribute('aria-label','Mission story');
dlg.innerHTML='<div class="mono-bg" aria-hidden="true">'+monoHTML+'</div><div class="reel-slides"></div>'+
 '<button class="reel-close dialog-close" type="button" aria-label="Close story">✕</button>'+
 '<nav class="reel-bar"><button class="reel-prev" type="button" aria-label="Previous slide">←</button>'+
 '<span class="reel-count"></span><div class="reel-progress"><i></i></div>'+
 '<button class="reel-next" type="button" aria-label="Next slide">→</button></nav>';
document.body.append(dlg);
const slidesEl=dlg.querySelector('.reel-slides'),countEl=dlg.querySelector('.reel-count'),barEl=dlg.querySelector('.reel-progress i'),prevBtn=dlg.querySelector('.reel-prev'),nextBtn=dlg.querySelector('.reel-next');
let index=0,slide=0,slides=[];

function show(n){
  if(!slides.length)return;
  slide=Math.max(0,Math.min(slides.length-1,n));
  slides.forEach((s,k)=>{s.classList.toggle('is-active',k===slide);s.classList.toggle('is-before',k<slide);s.classList.toggle('is-after',k>slide);s.setAttribute('aria-hidden',String(k!==slide));s.inert=k!==slide});
  countEl.textContent=`0${index+1} / 06 · ${String(slide+1).padStart(2,'0')} / 0${slides.length}`;
  barEl.style.transform=`scaleX(${slide/(slides.length-1)})`;
  prevBtn.disabled=slide===0;
  nextBtn.setAttribute('aria-label',slide===slides.length-1?'Next story':'Next slide');
}
function advance(d){
  if(d>0&&slide===slides.length-1)return open((index+1)%M.length);
  show(slide+d);
}
function open(i){
  if(typeof i==='string'){const k=M.findIndex(m=>m.name===i);i=k<0?0:k}
  index=(i+M.length)%M.length;
  slidesEl.replaceChildren(...buildMission(M[index],index,{next:()=>advance(1),open,close:()=>dlg.close()}));
  slides=[...slidesEl.children];
  if(!dlg.open)dlg.showModal();
  document.body.classList.add('locked');
  dlg.classList.toggle('reel-still',still.matches||!!window.explorerMotion?.paused);
  slide=0;
  requestAnimationFrame(()=>requestAnimationFrame(()=>show(0)));
}
nextBtn.addEventListener('click',()=>advance(1));
prevBtn.addEventListener('click',()=>advance(-1));
dlg.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();advance(1)}else if(e.key==='ArrowLeft'){e.preventDefault();advance(-1)}});
let sx=0,sy=0;
dlg.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){sx=e.clientX;sy=e.clientY}});
dlg.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)advance(dx<0?1:-1)});

addEventListener('motionchange',()=>dlg.classList.toggle('reel-still',still.matches||!!window.explorerMotion?.paused));
window.openStoryReel=open;
window.ReelKit={buildMission,PER,monoHTML};
})();
