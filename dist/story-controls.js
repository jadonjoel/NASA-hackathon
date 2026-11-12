/* Navigation guidance retained with the original presentation layout. */
(()=>{'use strict';
const stage=document.querySelector('.wheel-stage'),next=document.querySelector('#wheel-next');
const hint=document.createElement('p');hint.className='story-navigation-hint';hint.textContent='Scroll to explore, click the arrows, or use the ← / → keys.';stage.append(hint);
const style=document.createElement('style');style.textContent=`.story-navigation-hint{position:absolute;top:60px;left:7%;right:7%;text-align:center;font-size:11px;color:#b7c6b5;z-index:8;pointer-events:none}.story-nav-nudge{outline:2px solid #d5ec84;outline-offset:5px;animation:story-nav-glow 1.8s ease-in-out infinite}@keyframes story-nav-glow{50%{box-shadow:0 0 0 10px #cce9781a}}.is-paused .story-nav-nudge{animation:none}@media(prefers-reduced-motion:reduce){.story-nav-nudge{animation:none}}`;
document.head.append(style);
let timer=0,visible=false;
function reset(){clearTimeout(timer);next.classList.remove('story-nav-nudge');if(visible&&!document.hidden)timer=setTimeout(()=>next.classList.add('story-nav-nudge'),5000)}
new IntersectionObserver(es=>{visible=es[0].isIntersecting;reset()},{threshold:.65}).observe(stage);
addEventListener('scroll',reset,{passive:true});stage.addEventListener('pointerdown',reset);document.addEventListener('storynavigate',reset);document.addEventListener('visibilitychange',reset);
})();
