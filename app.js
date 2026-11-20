/* Research-only calculations from historic AL Fish Tissue Monitoring Program data.
   The observations are total mercury, not species-specific validated methylmercury fractions.
   Calculated meals are NOT official safety recommendations. */
(function(root){
'use strict';
const Core=root.FishAdvisorCore;
const $=id=>document.getElementById(id);
const fmt=(v,d=2)=>Number(v).toFixed(d).replace(/\.00$/,'');
const FISH=[
{id:'bass',name:'Largemouth Bass',body:'#79994a',top:'#49693f',fin:'#597b42'},
{id:'catfish',name:'Channel Catfish',body:'#8ca3ad',top:'#516c7c',fin:'#557185',whiskers:true},
{id:'crappie',name:'Crappie',body:'#acb8a5',top:'#607466',fin:'#7b9888',spots:true},
{id:'bluegill',name:'Bluegill',body:'#cba661',top:'#47798c',fin:'#ae733f',round:true},
{id:'striped',name:'Striped Bass',body:'#afc3c0',top:'#496e7b',fin:'#628491',stripes:true},
{id:'flathead',name:'Flathead Catfish',body:'#a0a06b',top:'#6d7951',fin:'#657a48',whiskers:true},
{id:'redbreast',name:'Redbreast Sunfish',body:'#c98256',top:'#55896f',fin:'#b5664c',round:true},
{id:'white',name:'White Bass',body:'#b4c4c2',top:'#66969a',fin:'#73938c',stripes:true}
];

let db=null, stations=new Map(), bySiteSpecies=new Map();
let dataReady=false;
const fish=name=>FISH.find(x=>x.name===name)||{name,body:'#a6b7b2',top:'#527b80',fin:'#73999a'};
const locate=id=>stations.get(id);
function fishArt(f){
 const x=f.round?'M50 46C64 13 106 10 134 40C146 52 145 73 130 86C100 113 62 97 50 67Z':'M24 59C46 28 98 27 133 50L167 29L163 58L170 87L132 68C100 94 52 86 24 59Z';
 const marks=f.spots?'<g fill="#314c42" opacity=".74"><circle cx="74" cy="42" r="4"/><circle cx="95" cy="54" r="5"/><circle cx="110" cy="44" r="4"/><circle cx="91" cy="72" r="3"/><circle cx="58" cy="60" r="3"/></g>':f.stripes?'<path d="M68 43Q103 54 129 52M68 55Q102 67 128 63M70 65Q101 79 128 71" stroke="#375b65" stroke-width="3" fill="none" opacity=".75"/>':'<path d="M64 54Q95 44 129 56" fill="none" stroke="#305f40" stroke-width="4" opacity=".75"/>';
 return `<svg viewBox="0 0 180 115" role="presentation" xmlns="http://www.w3.org/2000/svg"><path d="M70 42L86 19L106 37M84 80L106 103L123 77" fill="${f.fin}"/><path d="${x}" fill="${f.body}" stroke="${f.top}" stroke-width="3"/><path d="M42 50Q53 45 67 60Q56 74 42 67" fill="#e8e9d3" opacity=".72"/><path d="M70 80L89 98L97 81" fill="${f.fin}" stroke="${f.top}" stroke-width="2"/>${marks}<circle cx="46" cy="53" r="5.2" fill="#203a39"/><circle cx="44.5" cy="51" r="1.8" fill="white"/><path d="M27 67Q35 69 45 67" stroke="${f.top}" stroke-width="2" fill="none"/>${f.whiskers?'<path d="M39 64Q2 56 9 78M39 70Q5 85 17 100M40 59Q14 43 7 35" stroke="#526676" stroke-width="2" fill="none"/>':''}</svg>`;
}

const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2};
function fitsYear(y,period){switch(period){case '70s':return y>=2000&&y<=2009;case '10s':return y>=2010&&y<=2019;case '20s':return y>=2020&&y<=2024;case '2024':return y===2024;default:return y>=2000&&y<=2024;}}
function rowsFor(siteId,speciesName,period='all',sampling='preferred'){
 if(!db)return [];
 const station=stations.get(siteId),sp=db.species.indexOf(speciesName);
 if(!station||sp<0)return [];
 const rows=(bySiteSpecies.get(station._index+'|'+sp)||[]).filter(r=>fitsYear(r[1],period));
 if(sampling==='individual')return rows.filter(r=>r[3]===0);
 if(sampling==='composite')return rows.filter(r=>r[3]===1);
 if(sampling==='all')return rows;
 // Same filter as the map: prefer individual results at a station/day/species,
 // retaining composite results for other sampling events. These are not provably duplicates.
 const individualDays=new Set(rows.filter(r=>r[3]===0).map(r=>r[6]));
 return rows.filter(r=>r[3]!==1||!individualDays.has(r[6]));
}
function summary(rows){
 const detected=rows.filter(r=>r[4]!==null&&Number.isFinite(r[4]));
 const vals=detected.map(r=>r[4]);
 const nd=rows.length-detected.length;
 const years=[...new Set(rows.map(r=>r[1]))].sort((a,b)=>a-b);
 return {rows:rows.length,detected:vals.length,nd,median:median(vals),min:vals.length?Math.min(...vals):null,max:vals.length?Math.max(...vals):null,years,
  individuals:rows.filter(r=>r[3]===0).length,composites:rows.filter(r=>r[3]===1).length,flagged:rows.filter(r=>r[7]===1).length};
}
function optionsFor(select,arr,placeholder){
 select.innerHTML='';const initial=document.createElement('option');initial.value='';initial.textContent=placeholder;select.append(initial);
 for(const [value,label] of arr){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
}
async function loadObservations(){
 try{
  const resp=await fetch('data/mercury_observations.json',{cache:'no-store'});
  if(!resp.ok)throw new Error('Data file HTTP '+resp.status);
  const d=await resp.json();
  if(!Array.isArray(d.stations)||!Array.isArray(d.species)||!Array.isArray(d.records))throw new Error('Invalid measurement dataset');
  db=d;stations=new Map(d.stations.map((s,i)=>[s.id,{...s,_index:i}]));
  bySiteSpecies=new Map();
  for(const r of d.records){const key=r[0]+'|'+r[2];if(!bySiteSpecies.has(key))bySiteSpecies.set(key,[]);bySiteSpecies.get(key).push(r)}
  const sNames=[...d.species].sort((a,b)=>a.localeCompare(b));
  optionsFor($('species'),sNames.map(x=>[x,x]),'Choose a fish species');
  const places=[...stations.values()].sort((a,b)=>a.waterbody.localeCompare(b.waterbody)||a.id.localeCompare(b.id));
  optionsFor($('location'),places.map(s=>[s.id,`${s.waterbody} — ${s.id} (${s.county||'county not listed'})`]),'Choose a monitoring station');
  $('species').value='Largemouth Bass';
  $('dataLoadStatus').textContent=`Real data loaded: ${d.records.length.toLocaleString()} mercury measurements at 259 matched stations; ${d.stations.length} station locations and ${d.species.length} species labels. Select a station on the map or here.`;
  $('runCheck').disabled=false;dataReady=true;
 }catch(err){
  $('dataLoadStatus').textContent='Could not load the measurement file. This page needs to run through GitHub Pages or a local web server. '+err.message;
  $('dataLoadStatus').classList.add('error');$('runCheck').disabled=true;
 }
}
function personInput(){
 if(!dataReady)throw new Error('Measurement data have not loaded yet.');
 const name=$('species').value,siteId=$('location').value;
 if(!db.species.includes(name))throw new Error('Choose a fish species.');
 if(!locate(siteId))throw new Error('Choose a monitoring station or select one on the map.');
 const age=Number($('age').value),wt=Number($('weight').value),unit=$('weightUnit').value;
 if(!$('age').value.trim()||!Number.isInteger(age)||age<1||age>120)throw new Error('Enter an age between 1 and 120 years.');
 if(!$('weight').value.trim()||!Number.isFinite(wt)||wt<=0||(unit==='lb'?wt>650:wt>295))throw new Error('Enter a valid body weight.');
 const kg=Core.kgFrom(wt,unit);if(kg<4||kg>295)throw new Error('The weight is outside the supported example range.');
 const oz=$('mealSize').value==='auto'?Core.illustrativePortionOz(age):Number($('mealSize').value);
 const period=$('period').value,sampling=$('sampling').value;
 return {siteId,name,age,weight:wt,unit,kg,oz,period,sampling,stage:$('lifeStage').value};
}
function yearChart(rows){
 const svg=$('measurementChart');
 const y=[...new Set(rows.map(r=>r[1]))].sort((a,b)=>a-b);
 const points=y.map(yr=>({year:yr,value:median(rows.filter(r=>r[1]===yr).map(r=>r[4]).filter(Number.isFinite))})).filter(p=>p.value!==null);
 if(!points.length){svg.innerHTML='<text x="20" y="76" fill="#a9c3d4" font-size="14">No numeric mercury results to chart.</text>';return;}
 const w=490,h=155,l=45,r=22,t=14,b=30,ymax=Math.max(.02,...points.map(p=>p.value))*1.18;
 const x=yr=>points.length===1?(l+w-r)/2:l+(yr-points[0].year)/(points[points.length-1].year-points[0].year)*(w-l-r);
 const yy=v=>h-b-(v/ymax)*(h-b-t);
 const ticks=[0,.5,1].map(fr=>`<g><line x1="${l}" x2="${w-r}" y1="${yy(ymax*fr)}" y2="${yy(ymax*fr)}" stroke="#395569" stroke-dasharray="3 5"/><text x="${l-5}" y="${yy(ymax*fr)+4}" text-anchor="end" font-size="10" fill="#a7c5d5">${fmt(ymax*fr,2)}</text></g>`).join('');
 const line=points.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${yy(p.value).toFixed(2)}`).join(' ');
 const dots=points.map(p=>`<circle cx="${x(p.year)}" cy="${yy(p.value)}" r="4.3" fill="#31cbea" stroke="#092536" stroke-width="1"><title>${p.year}: ${fmt(p.value,3)} µg/g median detected total mercury</title></circle>`).join('');
 svg.innerHTML=`${ticks}<path d="${line}" fill="none" stroke="#31cbea" stroke-width="3"/>${dots}<text x="${l}" y="${h-7}" font-size="11" fill="#bed9e9">${points[0].year}</text><text x="${w-r}" y="${h-7}" font-size="11" fill="#bed9e9" text-anchor="end">${points[points.length-1].year}</text>`;
}
function renderResult(p){
 const site=locate(p.siteId),rows=rowsFor(p.siteId,p.name,p.period,p.sampling),st=summary(rows);
 $('emptyResult').hidden=true;$('filledResult').hidden=false;
 $('resultStatus').textContent='MEASURED · NOT ADVICE';$('resultStatus').classList.add('active');
 $('resultFishArt').innerHTML=fishArt(fish(p.name));
 $('resultFishName').textContent=p.name;
 $('resultPlace').textContent=`⌖ ${site.waterbody} · station ${site.id} · ${site.county||'Unknown'} County, Alabama`;
 $('resultConcentration').textContent=st.median===null?'Unavailable':`${fmt(st.median,3)} µg/g`;
 $('resultBand').textContent=st.min===null?'Unavailable':`${fmt(st.min,3)}–${fmt(st.max,3)} µg/g`;
 $('resultCount').textContent=`${st.detected} detected / ${st.nd} nondetect`;
 $('resultYears').textContent=st.years.length?`${st.years.length} years / ${st.years.at(-1)}`:'No records';
 $('resultSampleKinds').textContent=`${st.individuals} individual / ${st.composites} composite`;
 $('resultFlagged').textContent=String(st.flagged);
 yearChart(rows);
 if(st.median===null){
   $('mealCount').textContent='—';
   $('resultMealInfo').textContent=st.rows?`All ${st.nd} matching measurements were below detection limits. There is no numeric concentration to use for this calculation. A nondetect is not zero.`:'No mercury results for this station, species, and period. Another nearby station does not establish exposure at this location.';
 }else{
   // Screening calculation ONLY: uses observed *total* mercury as a conservative proxy for methylmercury.
   const monthly=Core.exampleMealsMonth(p.kg,st.median,p.oz);
   $('mealCount').textContent=monthly<.05?'<0.1':fmt(monthly,1);
   const flags=[];
   if(st.nd)flags.push(`${st.nd} nondetect result${st.nd===1?'':'s'} omitted from the detected-only median`);
   if(st.years.at(-1)<2020)flags.push(`latest measurement ${st.years.at(-1)}`);
   if(st.detected<5)flags.push('very small detected sample');
   if(st.flagged)flags.push(`${st.flagged} flagged/estimated record${st.flagged===1?'':'s'}`);
   if(p.stage!=='general'||p.age<18)flags.push('group-specific health guidance is not implemented');
   $('resultMealInfo').textContent=`Mathematical screening estimate using ${fmt(p.oz,0)} oz raw portions, the ${fmt(st.median,3)} µg/g median of ${st.detected} numeric total-mercury result${st.detected===1?'':'s'} (${st.years[0]}–${st.years.at(-1)}), and EPA's methylmercury RfD. Not an approved meal frequency.${flags.length?' Cautions: '+flags.join('; ')+'.':''}`;
 }
 $('resultDisclaimerExtra').textContent=st.rows?'Measured concentrations are historical, species- and station-specific. Other contaminants and official advisory restrictions are NOT assessed.':'There are no usable numeric observations for this selection. Missing data never establishes safety.';
 document.getElementById('results').scrollIntoView({behavior:'smooth',block:'nearest'});
}
const MODALS={
 method:{title:'EPA-based screening calculation: methodology',body:`<p>This prototype now uses <b>actual total-mercury observations</b> for the chosen station, species, and period. The concentration is the <b>median of numeric detected results</b>. Values below laboratory reporting limits are retained as nondetects and excluded from this preliminary median. This may bias the estimate upward when nondetects are numerous.</p><div class="math-panel">Allowable intake (g/day) = 0.1 µg/kg/day × body weight (kg) ÷ concentration (µg/g)<br>Calculated portions/month = intake (g/day) × 30.4375 ÷ portion weight (g)</div><p><b>Total mercury is used as a screening proxy for methylmercury.</b> This assumption must be reviewed. These calculations do not incorporate official Alabama advisories, other contaminants, multiple fish species in the diet, or specific guidance for pregnancy and children. Never use this number as an eating recommendation.</p><h3>Composites and individual samples</h3><p>The default matches the map: individual measurements take precedence where individual and composite records occur on the same station, collection date, and species. This is a pragmatic display rule, not proof that the underlying fish are duplicates. You can change it using the sampling selector.</p><p><a href="https://www.epa.gov/choose-fish-and-shellfish-wisely/support-fish-and-shellfish-advisory-programs" target="_blank" rel="noopener noreferrer">EPA advisory methodology ↗</a></p>`},
 uncertainty:{title:'What the measurements do and do not show',body:`<p>All observations come from the Alabama Fish Tissue Monitoring Program, with collection dates from 2000–2024. Different stations within the same reservoir are <b>separate sampling locations</b>. You are not viewing a modeled waterbody-wide average.</p><p>The minimum and maximum shown are observed extremes, <b>not a confidence interval</b>. The annual chart shows only numeric detected results; nondetects are counted separately. The latest sample year is displayed to avoid mistaking old data for current conditions.</p><p>When a selected fish has no numeric result, the tool does not estimate a concentration or a consumption limit. No data never means safe.</p>`},
 alternatives:{title:'Safer fish alternatives',body:`<p>There is no reliable alternative-species recommendation in this prototype. Species-specific historical mercury values alone cannot establish that a fish is safe for a particular person to eat.</p><p><a href="https://www.alabamapublichealth.gov/tox/fish-advisories.html" target="_blank" rel="noopener noreferrer">Check current official Alabama advisories ↗</a></p>`}
};
function openModal(kind){const m=MODALS[kind];if(!m)return;$('dialogHeading').textContent=m.title;$('dialogContent').innerHTML=m.body;if($('infoDialog').showModal)$('infoDialog').showModal();else $('infoDialog').setAttribute('open','')}
function theme(theme){document.documentElement.dataset.theme=theme;$('themeToggle').innerHTML=theme==='dark'?'☼ <span>Light mode</span>':'◐ <span>Dark mode</span>';try{localStorage.setItem('alabamaFishV2Theme',theme)}catch(_){} }
function run(){
 document.querySelectorAll('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.dialog)));
 $('showMath').addEventListener('click',()=>openModal('method'));
 $('dialogClose').addEventListener('click',()=>$('infoDialog').close());
 $('infoDialog').addEventListener('click',e=>{if(e.target===$('infoDialog'))$('infoDialog').close()});
 $('themeToggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
 try{theme(localStorage.getItem('alabamaFishV2Theme')==='light'?'light':'dark')}catch(_){theme('dark')}
 $('checkerForm').addEventListener('submit',e=>{e.preventDefault();$('validationMessage').hidden=true;try{renderResult(personInput())}catch(err){$('validationMessage').textContent=err.message;$('validationMessage').hidden=false}});
 $('clearForm').addEventListener('click',()=>{ $('checkerForm').reset();$('species').value='Largemouth Bass';$('filledResult').hidden=true;$('emptyResult').hidden=false;$('resultStatus').textContent='NOT ASSESSED';$('resultStatus').classList.remove('active');$('validationMessage').hidden=true;$('mapSelectionBanner').hidden=true; });
 // Only trust messages from the monitoring explorer iframe on this origin.
 root.addEventListener('message',event=>{
   const frame=$('mercuryExplorer');
   if(!dataReady||!frame||event.source!==frame.contentWindow||event.origin!==root.location.origin)return;
   const d=event.data;
   if(!d||d.source!=='alabama-mercury-explorer'||d.type!=='station-selection'||!stations.has(d.stationId))return;
   $('location').value=d.stationId;
   if(d.speciesName&&db.species.includes(d.speciesName))$('species').value=d.speciesName;
   if(['all','70s','10s','20s','2024'].includes(d.period))$('period').value=d.period;
   if(['all','preferred','individual','composite'].includes(d.sampling))$('sampling').value=d.sampling;
   const s=locate(d.stationId);
   $('mapSelectionText').textContent=`Selected on map: ${s.waterbody} · ${s.id}${d.speciesName?' · '+d.speciesName:''}. Enter your details below.`;
   $('mapSelectionBanner').hidden=false;
 });
 loadObservations();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})(window);
