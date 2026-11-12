/* Years on the surface: positions the bars from their dates and runs the live counters. */
(()=>{'use strict';
const DAY=864e5,START=Date.parse('1965-01-01T00:00:00Z'),NOW=Date.now();
const END=Math.max(NOW,Date.parse('2026-11-12T00:00:00Z'));
const pct=t=>(t-START)/(END-START)*100;
const fmt=n=>n.toLocaleString('en-US');
const rows=[...document.querySelectorAll('.chronicle-row')];
document.querySelectorAll('.chronicle-axis span').forEach(s=>s.style.left=pct(Date.parse(s.dataset.year+'-01-01T00:00:00Z'))+'%');
rows.forEach(row=>{
  const s=Date.parse(row.dataset.start+'T00:00:00Z');
  const e=row.dataset.end?Date.parse(row.dataset.end+'T00:00:00Z'):NOW;
  const bar=row.querySelector('.chronicle-track i');
  const left=pct(s),width=Math.max(pct(e)-left,.8);
  bar.parentElement.style.position='relative';
  bar.style.left=left+'%';bar.style.width=width+'%';
  const days=Math.round((e-s)/DAY);
  const dur=days<365?`${fmt(days)} days on the surface`:`${(days/365.25).toFixed(1)} years on the surface`;
  const silent=Math.floor((NOW-Date.parse(row.dataset.silent+'T00:00:00Z'))/DAY);
  row.querySelector('.cm-dur').textContent=row.hasAttribute('data-ongoing')?`${(days/365.25).toFixed(1)} years and counting`:dur;
  row.querySelector('.cm-sil').textContent=`${row.dataset.verb} ${fmt(silent)} days`;
});
// Grow the bars as each row scrolls into view.
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.35});
rows.forEach(r=>io.observe(r));
const head=document.getElementById('chronicle-title');
if(head){const ho=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){head.classList.add('visible');ho.disconnect()}}),{threshold:.3});ho.observe(head)}
})();

