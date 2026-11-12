/* Limit input speed only inside the opening journey; links and scrollbar remain native. */
(()=>{'use strict';
for(const config of [{selector:'.cosmic-runway',stage:'.cosmic-stage',intro:false},{selector:'.intro-runway',stage:'.signal-intro',intro:true},{selector:'.orbital-stories',stage:'.wheel-stage',orbit:true}]){
const runway=document.querySelector(config.selector);if(!runway)continue;const stage=runway.querySelector(config.stage);
let goal=null,frame=0,last=0,touchY=null,arriving=false,arrivalArmed=true,holdUntil=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function bounds(){const r=runway.getBoundingClientRect(),start=r.top+scrollY;return {start,end:start+Math.max(0,r.height-(config.intro?Math.min(stage.clientHeight,innerHeight):stage.clientHeight))}}
function clear(){goal=null;cancelAnimationFrame(frame);frame=0;last=0;arriving=false;holdUntil=0}
function blocked(e){return window.explorerMotion?.paused||document.hidden||document.body.classList.contains('locked')||e.ctrlKey||e.metaKey||e.target?.closest('input,textarea,select,[contenteditable],dialog,[role="slider"]')}
function tick(now){frame=0;if(goal===null)return;const dt=Math.min((now-last)/1000,.05);last=now;const b=bounds(),travel=b.end-b.start;
 if(window.explorerMotion?.paused||(!arriving&&scrollY<b.start-2)||scrollY>b.end+2||travel<=0){clear();return}
 const gap=goal-scrollY,limit=(arriving?1400:config.orbit?travel*.88/30*1.25:config.intro?650:Math.min(1400,travel*.22))*dt;
 if(Math.abs(gap)<.8){const landed=arriving;window.scrollTo({top:goal,behavior:'instant'});clear();if(landed)holdUntil=now+1100;return}
 const eased=clamp(gap*(1-Math.exp(-dt*20)),-limit,limit);
 const step=Math.sign(gap)*Math.min(Math.abs(gap),Math.max(1,Math.abs(eased)));
 window.scrollTo({top:clamp(scrollY+step,arriving?Math.min(scrollY,b.start):b.start,b.end),behavior:'instant'});frame=requestAnimationFrame(tick);
}
function consume(delta,e){if(e.defaultPrevented||!e.cancelable||blocked(e)||!delta)return false;const b=bounds(),travel=b.end-b.start;
 if(config.intro){
  if(delta<0&&(arriving||holdUntil)){clear();arrivalArmed=false}
  if(delta>0&&(arriving||performance.now()<holdUntil)){e.preventDefault();return true}
  // Catch the incoming gesture before it can leap over the second page.
  if(delta>0&&arrivalArmed&&scrollY<=b.start+1&&scrollY>=b.start-innerHeight*1.15&&scrollY+delta>=b.start){
   e.preventDefault();arrivalArmed=false;arriving=true;goal=b.start;last=performance.now();if(!frame)frame=requestAnimationFrame(tick);return true;
  }
 }
 if(travel<=0||scrollY<b.start-1||scrollY>b.end+1||(delta<0&&scrollY<=b.start+1)||(delta>0&&scrollY>=b.end-1)){clear();return false}
 e.preventDefault();const reverse=goal!==null&&Math.sign(goal-scrollY)!==Math.sign(delta);
 const base=goal===null||reverse?scrollY:goal;
 const slice=travel*.88/30;const perInput=config.orbit?slice*.28:config.intro?220:travel*.075,queue=config.orbit?slice*.45:config.intro?300:travel*.1;
 goal=clamp(base+clamp(delta,-perInput,perInput),Math.max(b.start,scrollY-queue),Math.min(b.end,scrollY+queue));
 if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}return true;
}
addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;consume(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),e)},{passive:false});
addEventListener('touchstart',e=>{touchY=e.touches.length===1?e.touches[0].clientY:null;if(!arriving&&performance.now()>=holdUntil)clear()},{passive:true});
addEventListener('touchmove',e=>{if(touchY===null||e.touches.length!==1){touchY=null;return}const y=e.touches[0].clientY;consume(touchY-y,e);touchY=y},{passive:false});
addEventListener('touchend',()=>{touchY=null},{passive:true});
addEventListener('touchcancel',()=>{touchY=null;clear()},{passive:true});
if(config.intro)addEventListener('scroll',()=>{if(!arriving&&scrollY<bounds().start-innerHeight*1.2)arrivalArmed=true},{passive:true});
addEventListener('keydown',e=>{if(e.target?.closest('button,a,input,textarea,select,[contenteditable]'))return;const delta={ArrowDown:100,ArrowUp:-100,PageDown:innerHeight,PageUp:-innerHeight,' ':innerHeight*(e.shiftKey?-1:1)}[e.key];if(delta)consume(delta,e);else if(e.key==='Home'||e.key==='End'||e.key==='Escape')clear()});
document.addEventListener('click',e=>{if(e.target.closest('a,button'))clear()});
document.addEventListener('storynavigate',clear);
addEventListener('pointerdown',clear,{passive:true});addEventListener('resize',clear);addEventListener('motionchange',clear);document.addEventListener('visibilitychange',clear);
}
})();
