/* Research-only calculations from historic AL Fish Tissue Monitoring Program data.
   The observations are total mercury, not species-specific validated methylmercury fractions.
   Calculated meals are NOT official safety recommendations. */
(function(root){
'use strict';
const Core=root.FishAdvisorCore, Data=root.MercuryData;
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

let db=null, stations=new Map(), bySiteSpecies=new Map(), waterbodies=new Map(), siteToWater=new Map();
let dataReady=false;
const fish=name=>FISH.find(x=>x.name===name)||{name,body:'#a6b7b2',top:'#527b80',fin:'#73999a'};
const locate=id=>stations.get(id);
function fishArt(f){
 const x=f.round?'M50 46C64 13 106 10 134 40C146 52 145 73 130 86C100 113 62 97 50 67Z':'M24 59C46 28 98 27 133 50L167 29L163 58L170 87L132 68C100 94 52 86 24 59Z';
 const marks=f.spots?'<g fill="#314c42" opacity=".74"><circle cx="74" cy="42" r="4"/><circle cx="95" cy="54" r="5"/><circle cx="110" cy="44" r="4"/><circle cx="91" cy="72" r="3"/><circle cx="58" cy="60" r="3"/></g>':f.stripes?'<path d="M68 43Q103 54 129 52M68 55Q102 67 128 63M70 65Q101 79 128 71" stroke="#375b65" stroke-width="3" fill="none" opacity=".75"/>':'<path d="M64 54Q95 44 129 56" fill="none" stroke="#305f40" stroke-width="4" opacity=".75"/>';
 return `<svg viewBox="0 0 180 115" role="presentation" xmlns="http://www.w3.org/2000/svg"><path d="M70 42L86 19L106 37M84 80L106 103L123 77" fill="${f.fin}"/><path d="${x}" fill="${f.body}" stroke="${f.top}" stroke-width="3"/><path d="M42 50Q53 45 67 60Q56 74 42 67" fill="#e8e9d3" opacity=".72"/><path d="M70 80L89 98L97 81" fill="${f.fin}" stroke="${f.top}" stroke-width="2"/>${marks}<circle cx="46" cy="53" r="5.2" fill="#203a39"/><circle cx="44.5" cy="51" r="1.8" fill="white"/><path d="M27 67Q35 69 45 67" stroke="${f.top}" stroke-width="2" fill="none"/>${f.whiskers?'<path d="M39 64Q2 56 9 78M39 70Q5 85 17 100M40 59Q14 43 7 35" stroke="#526676" stroke-width="2" fill="none"/>':''}</svg>`;
}

const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2};
// Group only identical source labels, and separate identical names in different basins.
// Expand abbreviations for display without silently merging tributaries or unrelated sites.
function friendlyWaterbody(label){
 const aliases={'Martin Res':'Lake Martin','Guntersville Res':'Guntersville Lake','WF George Res':'Walter F. George Reservoir (Lake Eufaula)','Smith Res':'Smith Reservoir'};
 return aliases[label]||label.replace(/\bRes\b/g,'Reservoir').replace(/\bCk\b/g,'Creek').replace(/\bR\b/g,'River').replace(/\bCo\b/g,'County').replace(/\bFk\b/g,'Fork').replace(/\bBr\b/g,'Branch').replace(/\bL\b/g,'Lake').replace(/\s+/g,' ').trim();
}
function buildWaterbodies(){
 const names=new Map(); waterbodies=new Map();siteToWater=new Map();
 for(const s of stations.values()){
  if(!names.has(s.waterbody))names.set(s.waterbody,new Set());names.get(s.waterbody).add(s.basin||'');
 }
 for(const s of stations.values()){
  const split=names.get(s.waterbody).size>1;
  const id=JSON.stringify([s.waterbody,split?s.basin||'':'']);
  if(!waterbodies.has(id))waterbodies.set(id,{id,source:s.waterbody,label:friendlyWaterbody(s.waterbody)+(split?' — '+(s.basin||'basin not listed'):''),sites:[]});
  waterbodies.get(id).sites.push(s);siteToWater.set(s.id,id);
 }
}
function rowsFor(waterId,siteId,speciesName,period='all',sampling='preferred'){
 const group=waterbodies.get(waterId),sp=db?.species.indexOf(speciesName)??-1;
 if(!group||sp<0)return [];
 const sites=siteId?group.sites.filter(s=>s.id===siteId):group.sites;
 return Data.filterSampling(sites.flatMap(station=>bySiteSpecies.get(station._index+'|'+sp)||[]).filter(r=>Data.fitsYear(r[1],period)),sampling);
}
function availability(rows){return rows.some(r=>Number.isFinite(r[4]))?0:rows.length?1:2}
function note(rows){const n=rows.filter(r=>Number.isFinite(r[4])).length;return n?`${rows.length} records`:rows.length?`${rows.length} below detection`:'no matching data'}
function refreshChoices(){
 if(!db)return;
 const species=$('species').value,water=$('location').value,site=$('specificStation').value,period=$('period').value,sampling=$('sampling').value;
 const places=[...waterbodies.values()].map(g=>({g,rows:species?rowsFor(g.id,'',species,period,sampling):[]}));
 places.sort((a,b)=>(species?availability(a.rows)-availability(b.rows):0)||a.g.label.localeCompare(b.g.label));
 optionsFor($('location'),places.map(({g,rows})=>[g.id,g.label+(species?' · '+note(rows):'')]),'Choose a lake, river or other waterbody');
 $('location').value=waterbodies.has(water)?water:'';
 const group=waterbodies.get($('location').value);
 const validSite=group?.sites.some(s=>s.id===site)?site:'';
 const names=db.species.map(name=>({name,rows:group?rowsFor(group.id,validSite,name,period,sampling):[]}));
 names.sort((a,b)=>(group?availability(a.rows)-availability(b.rows):0)||a.name.localeCompare(b.name));
 optionsFor($('species'),names.map(({name,rows})=>[name,name+(group?' · '+note(rows):'')]),'Choose a fish species');
 $('species').value=db.species.includes(species)?species:'';
 const opts=group?group.sites.map(s=>({s,rows:rowsFor(group.id,s.id,species,period,sampling)})).sort((a,b)=>availability(a.rows)-availability(b.rows)||a.s.id.localeCompare(b.s.id)):[];
 optionsFor($('specificStation'),opts.map(({s,rows})=>[s.id,`${s.id} — ${s.county||'county not listed'} · ${note(rows)}`]),'All stations in selected waterbody');
 $('specificStation').disabled=!group;$('specificStation').value=validSite;
 if(!group||!species){$('locationCoverage').textContent='Choose a fish and waterbody to see measurement availability.';return}
 const rows=rowsFor(group.id,validSite,species,period,sampling),n=new Set(rows.map(r=>r[0])).size,num=rows.filter(r=>Number.isFinite(r[4])).length;
 const scope=validSite?1:group.sites.length;
 $('locationCoverage').textContent=`${group.label}: ${n} of ${scope} ${scope===1?'station':'stations'} in the selected scope with matching records · ${num} numeric / ${rows.length-num} below detection.${!rows.length?' No historical measurements match this selection.':!num?' No numeric measurements available.':' Historical observations only; not a waterbody-wide safety assessment.'}`;
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
  const d=await Data.load();
  Data.fillPeriods($('period'),d);
  document.querySelectorAll('[data-period-label]').forEach(el=>el.textContent=Data.periodLabel(d));
  db=d;stations=new Map(d.stations.map((s,i)=>[s.id,{...s,_index:i}]));
  bySiteSpecies=new Map();
  for(const r of d.records){const key=r[0]+'|'+r[2];if(!bySiteSpecies.has(key))bySiteSpecies.set(key,[]);bySiteSpecies.get(key).push(r)}
  buildWaterbodies();
  optionsFor($('species'),[...d.species].sort((a,b)=>a.localeCompare(b)).map(x=>[x,x]),'Choose a fish species');
  $('species').value=db.species.includes('Largemouth Bass')?'Largemouth Bass':(db.species[0]||'');
  refreshChoices();
  $('dataLoadStatus').textContent=`Real data loaded: ${d.records.length.toLocaleString()} mercury measurements at ${new Set(d.records.map(r=>r[0])).size.toLocaleString()} matched stations; ${d.stations.length} station locations, ${waterbodies.size} waterbody groups, and ${d.species.length} species labels.`;
  $('runCheck').disabled=false;dataReady=true;
 }catch(err){
  $('dataLoadStatus').textContent='Could not load the measurement file. This page needs to run through GitHub Pages or a local web server. '+err.message;
  document.querySelectorAll('[data-period-label]').forEach(el=>el.textContent='Unavailable');
  $('dataLoadStatus').classList.add('error');$('runCheck').disabled=true;
 }
}
function personInput(){
 if(!dataReady)throw new Error('Measurement data have not loaded yet.');
 const name=$('species').value,waterId=$('location').value,siteId=$('specificStation').value;
 if(!db.species.includes(name))throw new Error('Choose a fish species.');
 if(!waterbodies.has(waterId))throw new Error('Choose a lake, river or other waterbody, or select a location on the map.');
 if(siteId&&!waterbodies.get(waterId).sites.some(s=>s.id===siteId))throw new Error('The selected station is not part of this waterbody.');
 const age=Number($('age').value),wt=Number($('weight').value),unit=$('weightUnit').value;
 if(!$('age').value.trim()||!Number.isInteger(age)||age<1||age>120)throw new Error('Enter an age between 1 and 120 years.');
 if(!$('weight').value.trim()||!Number.isFinite(wt)||wt<=0||(unit==='lb'?wt>650:wt>295))throw new Error('Enter a valid body weight.');
 const kg=Core.kgFrom(wt,unit);if(kg<4||kg>295)throw new Error('The weight is outside the supported example range.');
 const oz=$('mealSize').value==='auto'?Core.illustrativePortionOz(age):Number($('mealSize').value);
 const period=$('period').value,sampling=$('sampling').value;
 return {waterId,siteId,name,age,weight:wt,unit,kg,oz,period,sampling,stage:$('lifeStage').value};
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
 svg.innerHTML=`${ticks}<path d="${line}" fill="none" stroke="#31cbea" stroke-width="3"/>${dots}${points.length===1?`<text x="${x(points[0].year)}" y="${h-7}" text-anchor="middle" font-size="11" fill="#bed9e9">${points[0].year}</text>`:`<text x="${l}" y="${h-7}" font-size="11" fill="#bed9e9">${points[0].year}</text><text x="${w-r}" y="${h-7}" font-size="11" fill="#bed9e9" text-anchor="end">${points[points.length-1].year}</text>`}`;
}
function renderResult(p){
 const group=waterbodies.get(p.waterId),site=p.siteId?locate(p.siteId):null,rows=rowsFor(p.waterId,p.siteId,p.name,p.period,p.sampling),st=summary(rows);
 const scope=site?[site]:group.sites;
 const stationStats=scope.map(s=>({s,st:summary(rows.filter(r=>r[0]===s._index))}));
 const contributors=stationStats.filter(x=>x.st.rows),numeric=contributors.filter(x=>x.st.detected),medians=numeric.map(x=>x.st.median);
 const usable=st.median!==null&&st.median>0;
 $('emptyResult').hidden=true;$('filledResult').hidden=false;
 $('resultStatus').textContent=usable?'ESTIMATE · NOT ADVICE':st.rows?'NO USABLE CONCENTRATION':'NO MATCHING DATA';$('resultStatus').classList.toggle('active',usable);
 $('resultFishArt').innerHTML=fishArt(fish(p.name));
 $('resultFishName').textContent=p.name;
 $('resultPlace').textContent=site?`⌖ ${group.label} · station ${site.id} · ${site.county||'Unknown'} County, Alabama`:`⌖ ${group.label} · all ${group.sites.length} monitoring ${group.sites.length===1?'station':'stations'} in this group, Alabama`;
 $('resultStationCount').textContent=`${contributors.length} / ${scope.length}`;
 $('resultDetectedStations').textContent=String(numeric.length);
 $('resultStationRange').textContent=medians.length?`${fmt(Math.min(...medians),3)}–${fmt(Math.max(...medians),3)} µg/g`:'Unavailable';
 $('resultStationDetail').textContent=contributors.length?'Contributing stations: '+contributors.map(x=>`${x.s.id} (${x.st.detected} numeric / ${x.st.nd} nondetect)`).join('; ')+'.':'No station contributed matching records.';
 $('calculationStatus').classList.toggle('estimate-available',usable);
 $('calculationIcon').textContent=usable?'✓':'!';
 $('calculationTitle').textContent=usable?'Research estimate available':st.rows?'No usable numeric concentration':'Insufficient measurement data';
 $('calculationNote').textContent=usable?'Calculated from historical measurements. Official advisory not yet checked. Not eating advice.':'No consumption estimate calculated. Official advisory not yet checked.';
 $('resultConcentration').textContent=st.median===null?'Unavailable':`${fmt(st.median,3)} µg/g`;
 $('resultBand').textContent=st.min===null?'Unavailable':`${fmt(st.min,3)}–${fmt(st.max,3)} µg/g`;
 $('resultCount').textContent=`${st.detected} detected / ${st.nd} nondetect`;
 $('resultYears').textContent=st.years.length?`${st.years.length} years / ${st.years.at(-1)}`:'No records';
 $('resultSampleKinds').textContent=`${st.individuals} individual / ${st.composites} composite`;
 $('resultFlagged').textContent=String(st.flagged);
 yearChart(rows);
 if(!usable){
   $('mealCount').textContent='—';
   $('resultMealInfo').textContent=st.median===0?'The detected median is zero. A positive concentration is required for this screening calculation.':st.rows?`All ${st.nd} matching measurements were below detection limits. There is no numeric concentration to use for this calculation. A nondetect is not zero.`:`No mercury results for this ${site?'station':'waterbody'}, species, period and sample type. Missing data never establishes safety.`;
 }else{
   // Screening calculation ONLY: uses observed *total* mercury as a conservative proxy for methylmercury.
   const monthly=Core.exampleMealsMonth(p.kg,st.median,p.oz);
   $('mealCount').textContent=monthly<.05?'<0.1':fmt(monthly,1);
   const flags=[];
   if(!site)flags.push(`pooled records from ${contributors.length} of ${scope.length} stations; not necessarily representative of the entire waterbody`);
   if(st.nd)flags.push(`${st.nd} nondetect result${st.nd===1?'':'s'} omitted from the detected-only median`);
   if(st.years.at(-1)<2020)flags.push(`latest measurement ${st.years.at(-1)}`);
   if(st.detected<5)flags.push('very small detected sample');
   if(st.flagged)flags.push(`${st.flagged} flagged/estimated record${st.flagged===1?'':'s'}`);
   if(p.stage!=='general'||p.age<18)flags.push('group-specific health guidance is not implemented');
   $('resultMealInfo').textContent=`Mathematical screening estimate using ${fmt(p.oz,0)} oz raw portions, the ${fmt(st.median,3)} µg/g median of ${st.detected} numeric total-mercury result${st.detected===1?'':'s'} (${st.years[0]}–${st.years.at(-1)}), and EPA's methylmercury RfD. Not an approved meal frequency.${flags.length?' Cautions: '+flags.join('; ')+'.':''}`;
 }
 $('resultDisclaimerExtra').textContent=st.rows?'Measured concentrations are historical and specific to the selected species and sampling scope. Pooled waterbody records do not establish exposure at every catch location. Other contaminants and official advisory restrictions are NOT assessed.':'There are no usable numeric observations for this selection. Missing data never establishes safety.';
 document.getElementById('results').scrollIntoView({behavior:'smooth',block:'nearest'});
}
const MODALS={
 method:{title:'EPA-based screening calculation: methodology',body:`<p>This prototype now uses <b>actual total-mercury observations</b> for the chosen waterbody or station, species, and period. The concentration is the <b>median of numeric detected results</b> pooled across included records (not an equal-station average). Waterbody groups match original labels, with same-name groups separated by basin; tributaries are not automatically merged. Values below laboratory reporting limits are retained as nondetects and excluded from this preliminary median. This may bias the estimate upward when nondetects are numerous.</p><div class="math-panel">Allowable intake (g/day) = 0.1 µg/kg/day × body weight (kg) ÷ concentration (µg/g)<br>Calculated portions/month = intake (g/day) × 30.4375 ÷ portion weight (g)</div><p><b>Total mercury is used as a screening proxy for methylmercury.</b> This assumption must be reviewed. These calculations do not incorporate official Alabama advisories, other contaminants, multiple fish species in the diet, or specific guidance for pregnancy and children. Never use this number as an eating recommendation.</p><h3>Composites and individual samples</h3><p>The default matches the map: individual measurements take precedence where individual and composite records occur on the same station, collection date, and species. This is a pragmatic display rule, not proof that the underlying fish are duplicates. You can change it using the sampling selector.</p><p><a href="https://www.epa.gov/choose-fish-and-shellfish-wisely/support-fish-and-shellfish-advisory-programs" target="_blank" rel="noopener noreferrer">EPA advisory methodology ↗</a></p>`},
 uncertainty:{title:'What the measurements do and do not show',body:`<p>All observations come from the Alabama Fish Tissue Monitoring Program, with collection dates in the currently loaded dataset. Different stations within the same reservoir are <b>separate sampling locations</b>. A waterbody-level selection pools observed records across matching stations. This is not a modeled waterbody-wide average, and sites with more records have more influence.</p><p>The minimum and maximum shown are observed extremes, <b>not a confidence interval</b>. The annual chart shows only numeric detected results; nondetects are counted separately. The latest sample year is displayed to avoid mistaking old data for current conditions.</p><p>When a selected fish has no numeric result, the tool does not estimate a concentration or a consumption limit. No data never means safe.</p>`},
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
 for(const id of ['species','location','period','sampling','specificStation'])$(id).addEventListener('change',()=>{if(id==='location')$('specificStation').value='';refreshChoices();$('filledResult').hidden=true;$('emptyResult').hidden=false;$('resultStatus').textContent='NOT ASSESSED';$('resultStatus').classList.remove('active');$('mapSelectionBanner').hidden=true;});
 $('clearForm').addEventListener('click',()=>{ $('checkerForm').reset();$('location').value='';$('specificStation').value='';$('period').value='all';$('sampling').value='preferred';$('species').value=db?.species.includes('Largemouth Bass')?'Largemouth Bass':(db?.species[0]||'');$('filledResult').hidden=true;$('emptyResult').hidden=false;$('resultStatus').textContent='NOT ASSESSED';$('resultStatus').classList.remove('active');$('validationMessage').hidden=true;$('mapSelectionBanner').hidden=true; refreshChoices(); });
 // Only trust messages from the monitoring explorer iframe on this origin.
 root.addEventListener('message',event=>{
   const frame=$('mercuryExplorer');
   if(!dataReady||!frame||event.source!==frame.contentWindow||event.origin!==root.location.origin)return;
   const d=event.data;
   if(!d||d.source!=='alabama-mercury-explorer'||d.type!=='station-selection'||!stations.has(d.stationId))return;
   const waterId=siteToWater.get(d.stationId);
   $('location').value=waterId;$('specificStation').value='';
   if(d.speciesName&&db.species.includes(d.speciesName))$('species').value=d.speciesName;
   if([...$('period').options].some(o=>o.value===d.period))$('period').value=d.period;
   if(['all','preferred','individual','composite'].includes(d.sampling))$('sampling').value=d.sampling;
   const s=locate(d.stationId);
   refreshChoices();
   $('filledResult').hidden=true;$('emptyResult').hidden=false;$('resultStatus').textContent='NOT ASSESSED';$('resultStatus').classList.remove('active');
   $('mapSelectionText').textContent=`Selected catch area: ${waterbodies.get(waterId).label}${d.speciesName?' · '+d.speciesName:''}. Map station ${s.id}; the checker uses all stations in this waterbody by default. Choose a station in More options if needed.`;
   $('mapSelectionBanner').hidden=false;
 });
 loadObservations();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})(window);
