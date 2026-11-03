/* V2 scientific-dashboard UI. No real mercury samples, advisories, or model predictions are bundled. */
(function(root){
'use strict';
const Core=root.FishAdvisorCore;
const $=id=>document.getElementById(id);
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
const LOCATIONS=[
{id:'martin',name:'Lake Martin',type:'Lake · Tallapoosa River Basin',lat:32.75,lon:-85.91,demo:0.32},
{id:'guntersville',name:'Guntersville Lake',type:'Lake · Tennessee River',lat:34.41,lon:-86.27,demo:0.12},
{id:'logan-martin',name:'Logan Martin Lake',type:'Lake · Coosa River',lat:33.47,lon:-86.31,demo:0.21},
{id:'smith',name:'Lewis Smith Lake',type:'Lake · North Alabama',lat:34.06,lon:-87.05,demo:0.44},
{id:'weiss',name:'Weiss Lake',type:'Lake · Coosa River',lat:34.13,lon:-85.64,demo:0.17},
{id:'lay',name:'Lay Lake',type:'Lake · Coosa River',lat:33.05,lon:-86.50,demo:0.27},
{id:'pickwick',name:'Pickwick Lake',type:'Lake · Tennessee River',lat:34.91,lon:-88.04,demo:0.09},
{id:'eufaula',name:'Lake Eufaula',type:'Lake · Chattahoochee River',lat:31.91,lon:-85.15,demo:0.49},
{id:'black-warrior',name:'Black Warrior River (Tuscaloosa)',type:'River · example point',lat:33.19,lon:-87.57,demo:0.38},
{id:'mobile-tensaw',name:'Mobile–Tensaw Delta',type:'River delta · example point',lat:30.84,lon:-87.91,demo:0.18},
{id:'tallapoosa',name:'Tallapoosa River (Tallassee)',type:'River · example point',lat:32.54,lon:-85.89,demo:0.31},
{id:'coosa',name:'Coosa River (Wetumpka)',type:'River · example point',lat:32.54,lon:-86.21,demo:0.22}
];
// Fictitious geographic shapes represent neither hydrologic catchments nor legal advisory regions.
const DEMO_REGIONS=[
{name:'Northwest demo zone',value:0.09,coords:[[35,-88.47],[35,-87.08],[34.04,-87.08],[33.94,-88.47]]},
{name:'Northeast demo zone',value:0.17,coords:[[35,-87.08],[35,-85.62],[34.42,-85.62],[34.1,-86.01],[34.04,-87.08]]},
{name:'Central-west demo zone',value:0.38,coords:[[34.04,-88.47],[34.04,-87.08],[33.15,-87.08],[32.77,-88.47]]},
{name:'Central-east demo zone',value:0.32,coords:[[34.04,-87.08],[34.1,-86.01],[34.42,-85.62],[33.38,-85.0],[32.6,-85.15],[32.77,-87.08]]},
{name:'Southern-west demo zone',value:0.18,coords:[[32.77,-88.47],[33.15,-87.08],[32.77,-87.08],[32.0,-86.9],[31.0,-87.3],[30.4,-87.9],[30.35,-88.03],[31.0,-88.47]]},
{name:'Southern-east demo zone',value:0.49,coords:[[32.77,-87.08],[32.6,-85.15],[31.0,-85.0],[31,-87.3],[32,-86.9]]}
];
const state={map:null,markers:new Map(),regionGroup:null,priorityGroup:null,layer:'coverage',locationId:'',fishId:'',person:null,theme:'dark'};
const locate=id=>LOCATIONS.find(x=>x.id===id);
const fish=id=>FISH.find(x=>x.id===id);
const fmt=(v,d=2)=>Number(v).toFixed(d).replace(/\.00$/,'');
function fishArt(f){
 const x=f.round?'M50 46C64 13 106 10 134 40C146 52 145 73 130 86C100 113 62 97 50 67Z':'M24 59C46 28 98 27 133 50L167 29L163 58L170 87L132 68C100 94 52 86 24 59Z';
 const marks=f.spots?'<g fill="#314c42" opacity=".74"><circle cx="74" cy="42" r="4"/><circle cx="95" cy="54" r="5"/><circle cx="110" cy="44" r="4"/><circle cx="91" cy="72" r="3"/><circle cx="58" cy="60" r="3"/></g>':f.stripes?'<path d="M68 43Q103 54 129 52M68 55Q102 67 128 63M70 65Q101 79 128 71" stroke="#375b65" stroke-width="3" fill="none" opacity=".75"/>':'<path d="M64 54Q95 44 129 56" fill="none" stroke="#305f40" stroke-width="4" opacity=".75"/>';
 return `<svg viewBox="0 0 180 115" role="presentation" xmlns="http://www.w3.org/2000/svg"><path d="M70 42L86 19L106 37M84 80L106 103L123 77" fill="${f.fin}"/><path d="${x}" fill="${f.body}" stroke="${f.top}" stroke-width="3"/><path d="M42 50Q53 45 67 60Q56 74 42 67" fill="#e8e9d3" opacity=".72"/><path d="M70 80L89 98L97 81" fill="${f.fin}" stroke="${f.top}" stroke-width="2"/>${marks}<circle cx="46" cy="53" r="5.2" fill="#203a39"/><circle cx="44.5" cy="51" r="1.8" fill="white"/><path d="M27 67Q35 69 45 67" stroke="${f.top}" stroke-width="2" fill="none"/>${f.whiskers?'<path d="M39 64Q2 56 9 78M39 70Q5 85 17 100M40 59Q14 43 7 35" stroke="#526676" stroke-width="2" fill="none"/>':''}</svg>`;
}
function seedForm(){
 for(const f of FISH){const o=document.createElement('option');o.value=f.id;o.textContent=f.name;$('species').append(o)}
 for(const l of LOCATIONS){const o=document.createElement('option');o.value=l.id;o.textContent=l.name;$('location').append(o)}
 $('mapLocationCount').textContent=LOCATIONS.length;
}
function setLocation(id,fromMap=false){
 if(!locate(id))return;
 state.locationId=id;
 $('location').value=id;
 $('selectedMapText').textContent=locate(id).name;
 for(const [mid,m] of state.markers)m.setStyle({radius:mid===id?11:6,weight:mid===id?3:1.8,color:mid===id?'#ffffff':'#073342'});
 if(state.map && !fromMap){const loc=locate(id);state.map.flyTo([loc.lat,loc.lon],Math.max(8,state.map.getZoom()),{duration:.4})}
 if(!state.map)drawFallbackMap();
}
function demoColor(n){return n<.15?'#31a87b':n<.25?'#e0c34e':n<.4?'#f5a136':'#f37565'}
function setLegend(layer){
 const body=$('legendBody'),note=$('legendNote');
 if(layer==='coverage'){
 $('legendTitle').textContent='Map key';body.innerHTML='<div><i class="legend-mark cyan"></i> Example fishing location</div><div><i class="legend-mark hollow"></i> No verified advisory data</div>';
 note.textContent='Markers are approximate, not sampling sites or advisory boundaries.';
 $('mapStatus').textContent='NO VERIFIED DATA LOADED';
 }else if(layer==='demo-mercury'){
 $('legendTitle').textContent='Fictional mercury values';body.innerHTML='<div><i class="legend-mark low"></i> Imaginary value < 0.15 µg/g</div><div><i class="legend-mark med"></i> 0.15–0.24 µg/g</div><div><i class="legend-mark high"></i> 0.25–0.39 µg/g</div><div><i class="legend-mark max"></i> ≥ 0.40 µg/g</div>';
 note.innerHTML='<span class="preview-label">SIMULATED ONLY.</span> Numbers, regions and categories are arbitrary; colors are NOT safety classes.';
 $('mapStatus').textContent='SIMULATED VALUES · NOT OBSERVED';
 }else{
 $('legendTitle').textContent='Fictional monitoring priorities';body.innerHTML='<div><i class="legend-mark purple"></i> Illustrative future sampling target</div><div><i class="legend-mark cyan"></i> Example fishing location</div>';
 note.innerHTML='<span class="preview-label">ILLUSTRATION ONLY.</span> No monitoring priority model has been trained.';
 $('mapStatus').textContent='MONITORING PREVIEW · NOT MODELED';
 }
}
function setMapLayer(layer){
 if(!['coverage','demo-mercury','priority'].includes(layer))return;
 state.layer=layer;
 document.querySelectorAll('[data-layer]').forEach(b=>{const on=b.dataset.layer===layer;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
 setLegend(layer);
 if(!state.map||!root.L){drawFallbackMap();return;}
 if(state.regionGroup)state.map.removeLayer(state.regionGroup);
 if(state.priorityGroup)state.map.removeLayer(state.priorityGroup);
 if(layer==='demo-mercury'){
  state.regionGroup=root.L.layerGroup(DEMO_REGIONS.map(r=>root.L.polygon(r.coords,{color:demoColor(r.value),fillColor:demoColor(r.value),fillOpacity:.29,weight:2,opacity:.65,interactive:false}))).addTo(state.map);
 }
 if(layer==='priority'){
  state.priorityGroup=root.L.layerGroup([
   [33.6,-87.22],[32.1,-86.7],[31.8,-87.25],[34.75,-86.8],[32.3,-85.7]
  ].map(pos=>root.L.circle(pos,{radius:22000,color:'#aa9bff',weight:2,fillColor:'#7364c7',fillOpacity:.22,interactive:false}))).addTo(state.map);
 }
 for(const loc of LOCATIONS){const m=state.markers.get(loc.id);if(!m)continue;m.setStyle({fillColor:layer==='demo-mercury'?demoColor(loc.demo):'#30c9e9',fillOpacity:.95})}
}
function drawFallbackMap(){
  // SVG map retains functional location selection when external basemap/Leaflet scripts are unavailable.
  // Its state outline and waterways are stylized (NOT geospatial regulatory boundaries).
  const el=$('mapFallback');el.hidden=false;el.classList.add('svg-map-fallback');
  const px=lon=>Math.round(70+(lon+88.55)/3.7*510);
  const py=lat=>Math.round(34+(35.15-lat)/5.1*640);
  const bounds=[[-88.45,35],[-85.62,35],[-85.5,34.55],[-85.17,34.14],[-85.1,33.6],[-85.05,32.6],[-85.0,31.0],[-87.6,31.0],[-87.6,30.43],[-87.88,30.33],[-88.08,30.22],[-88.39,30.28],[-88.47,31.0]];
  const boundPath=bounds.map((p,i)=>`${i?'L':'M'}${px(p[0])},${py(p[1])}`).join(' ')+'Z';
  const rivers=[
    [[-88.4,34.72],[-87.8,34.62],[-87.2,34.64],[-86.7,34.53],[-86.1,34.44],[-85.6,34.5]],
    [[-85.8,34.76],[-85.9,34.22],[-86.3,33.77],[-86.4,33.36],[-86.5,32.9],[-86.25,32.48],[-86.5,32.14],[-86.9,31.7],[-87.5,31.25],[-87.85,30.67]],
    [[-85.18,33.75],[-85.53,33.37],[-85.86,32.94],[-85.83,32.56],[-86.3,32.34],[-86.7,32.15]],
    [[-87.43,34.15],[-87.7,33.76],[-87.62,33.37],[-87.85,33.0],[-87.8,32.43],[-87.9,31.84],[-87.95,31.2],[-87.87,30.66]],
    [[-87.8,32.45],[-87.28,32.4],[-86.86,32.22],[-86.68,31.9]]
  ];
  const riverSvg=rivers.map(r=>`<path d="${r.map((p,i)=>`${i?'L':'M'}${px(p[0])} ${py(p[1])}`).join(' ')}"/>`).join('');
  const regionSvg=state.layer==='demo-mercury'?DEMO_REGIONS.map(r=>{
    const pts=r.coords.map(x=>`${px(x[1])},${py(x[0])}`).join(' ');
    return `<polygon points="${pts}" fill="${demoColor(r.value)}" fill-opacity=".32" stroke="${demoColor(r.value)}" stroke-width="2"/>`;
  }).join(''):'';
  const prioritySvg=state.layer==='priority'?[[33.6,-87.22],[32.1,-86.7],[31.8,-87.25],[34.75,-86.8],[32.3,-85.7]].map(v=>`<circle cx="${px(v[1])}" cy="${py(v[0])}" r="36" fill="#8376eb" fill-opacity=".25" stroke="#b1a6ff" stroke-width="2" stroke-dasharray="5 5"/>`).join(''):'';
  const towns=[['Huntsville',34.73,-86.59],['Birmingham',33.52,-86.8],['Tuscaloosa',33.21,-87.57],['Montgomery',32.38,-86.30],['Mobile',30.70,-88.04]];
  const townSvg=towns.map(t=>`<g class="city"><circle cx="${px(t[2])}" cy="${py(t[1])}" r="3" fill="#e6f1f9"/><text x="${px(t[2])+7}" y="${py(t[1])-7}">${t[0]}</text></g>`).join('');
  const locationsSvg=LOCATIONS.map(l=>{
    const x=px(l.lon),y=py(l.lat),color=state.layer==='demo-mercury'?demoColor(l.demo):'#3bdeee';
    const selected=state.locationId===l.id;
    return `<g class="fallback-point" data-place="${l.id}" tabindex="0" role="button" aria-label="Select ${l.name}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${selected?14:10}" fill="#061b2b" stroke="${selected?'white':'#c0faff'}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${selected?10:6}" fill="${color}"/><title>${l.name} — example location, not monitoring data</title></g>`;
  }).join('');
  el.innerHTML=`<svg viewBox="0 0 680 735" role="img" aria-label="Stylized Alabama map with clickable illustrative fishing locations"><defs><linearGradient id="fbBG" x2="1" y2="1"><stop stop-color="#081b30"/><stop offset="1" stop-color="#0a314b"/></linearGradient><clipPath id="alabamaClip"><path d="${boundPath}"/></clipPath><pattern id="gridlines" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M 45 0 L 0 0 0 45" stroke="#8cd7f7" stroke-opacity=".07" stroke-width="1" fill="none"/></pattern></defs><rect width="680" height="735" fill="url(#fbBG)"/><rect width="680" height="735" fill="url(#gridlines)"/><path d="${boundPath}" fill="#0e3a52" stroke="#77d9ef" stroke-width="3"/><g clip-path="url(#alabamaClip)"><path d="${boundPath}" fill="#0f2c42"/><g class="fallback-rivers" fill="none" stroke="#36b5ec" stroke-opacity=".58" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${riverSvg}</g><g>${regionSvg}${prioritySvg}</g></g><path d="${boundPath}" fill="none" stroke="#8feaff" stroke-width="3"/><g>${townSvg}</g><g fill="#80b1ca" opacity=".26" text-anchor="middle"><text x="334" y="382" font-family="Inter,Arial" font-size="47" font-weight="800" letter-spacing="10">ALABAMA</text></g>${locationsSvg}<g fill="#bfdbea" opacity=".7" font-family="Inter,Arial" font-size="11"><text x="30" y="712">APPROXIMATE ILLUSTRATION • NOT ADVISORY BOUNDARIES</text></g></svg>`;
  el.querySelectorAll('.fallback-point').forEach(g=>{
    const handler=()=>{setLocation(g.dataset.place,true);drawFallbackMap()};
    g.addEventListener('click',handler);
    g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();handler()}});
  });
}

function initMap(){
 setLegend('coverage');
 if(!root.L){drawFallbackMap();return}
 try{
  const map=root.L.map('map',{zoomControl:true,scrollWheelZoom:false,minZoom:5,maxZoom:14,preferCanvas:true});
  state.map=map;map.setView([32.7,-86.8],7);
  const base=state.theme==='dark'?'dark_all':'light_all';
  root.L.tileLayer(`https://{s}.basemaps.cartocdn.com/${base}/{z}/{x}/{y}{r}.png`,{subdomains:'abcd',maxZoom:19,attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}).addTo(map);
  for(const loc of LOCATIONS){
   const m=root.L.circleMarker([loc.lat,loc.lon],{radius:6,color:'#073342',weight:1.8,fillColor:'#30c9e9',fillOpacity:.95}).addTo(map);
   m.bindTooltip(loc.name,{direction:'top'});
   m.on('click',()=>{setLocation(loc.id,true);$('location').focus({preventScroll:true})});
   state.markers.set(loc.id,m);
  }
  setTimeout(()=>map.invalidateSize(),250);
 }catch(e){drawFallbackMap()}
}
function setTheme(theme){
 state.theme=theme==='light'?'light':'dark';document.documentElement.dataset.theme=state.theme;
 $('themeToggle').innerHTML=state.theme==='dark'?'☼ <span>Light mode</span>':'◐ <span>Dark mode</span>';
 $('themeToggle').setAttribute('aria-pressed',String(state.theme==='light'));
 try{localStorage.setItem('alabamaFishV2Theme',state.theme)}catch(_e){}
 if(state.map){
  state.map.eachLayer(layer=>{if(layer instanceof root.L.TileLayer){state.map.removeLayer(layer)}});
  root.L.tileLayer(`https://{s}.basemaps.cartocdn.com/${state.theme==='dark'?'dark_all':'light_all'}/{z}/{x}/{y}{r}.png`,{subdomains:'abcd',maxZoom:19,attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}).addTo(state.map);
  setTimeout(()=>state.map.invalidateSize(),150);
 }
}
function personInput(){
 const age=Number($('age').value),weight=Number($('weight').value),unit=$('weightUnit').value;
 if(!$('species').value||!fish($('species').value))throw new Error('First, choose a fish species.');
 if(!$('location').value||!locate($('location').value))throw new Error('Choose a lake or river, or select a marker on the map.');
 if(!$('age').value.trim()||!Number.isInteger(age)||age<1||age>120)throw new Error('Enter an age between 1 and 120 years.');
 if(!$('weight').value.trim()||!Number.isFinite(weight)||weight<=0||(unit==='lb'?weight>650:weight>295))throw new Error('Enter a valid body weight.');
 const kg=Core.kgFrom(weight,unit);
 if(kg<4||kg>295)throw new Error('The weight is outside the supported demonstration range.');
 const mealSize=$('mealSize').value==='auto'?Core.illustrativePortionOz(age):Number($('mealSize').value);
 const conc=Number($('demoConcentration').value);
 return{age,weight,unit,kg,mealSize,conc,stage:$('lifeStage').value};
}
function renderResult(p){
 const f=fish($('species').value),l=locate($('location').value),band=Core.imaginaryScenario(p.conc),moreCautious=band.high;
 const meals=Core.exampleMealsMonth(p.kg,moreCautious,p.mealSize);
 $('emptyResult').hidden=true;$('filledResult').hidden=false;$('resultStatus').textContent='DEMO · NO ADVICE';$('resultStatus').classList.add('active');
 $('resultFishArt').innerHTML=fishArt(f);
 $('resultFishName').textContent=f.name;
 $('resultPlace').textContent=`⌖ ${l.name} · Alabama · example selection`;
 $('mealCount').textContent=fmt(meals,1);
 $('resultMealInfo').textContent=`For a ${fmt(p.mealSize,0)} oz raw-fish demonstration portion · age ${p.age} · ${fmt(p.weight,1)} ${p.unit}. This is not an approved meal limit.`;
 $('resultConcentration').textContent=`${fmt(p.conc)} µg/g (invented)`;
 $('resultBand').textContent=`${fmt(band.low)}–${fmt(band.high)} µg/g (invented)`;
 state.person=p;
 document.getElementById('results').scrollIntoView({behavior:'smooth',block:'nearest'});
}
const MODALS={
 method:{title:'EPA calculation and assumptions',body:`<p><b>No site-specific mercury measurements or official advisory rules are included.</b> This is a worked example of EPA's noncancer consumption-rate equation, not a public safety tool.</p><div class="math-panel">Allowable illustrative fish intake (g/day) = RfD (µg/kg/day) × body weight (kg) ÷ contaminant concentration (µg/g)</div><p>Our methylmercury example uses the EPA reference dose <b>0.1 µg/kg/day</b>. We divide the illustrative daily amount by a chosen raw-fish portion and express it as a theoretical number of portions per month. The example uses the <b>high</b> end of a fabricated ±40% scenario interval. This does not constitute a validated uncertainty analysis.</p><h3>Portions matter</h3><p>Alabama's state advisory materials use an 8-ounce raw-fish reference meal for adults. The FDA/EPA national guidance uses a 4-ounce adult reference serving for certain groups. The smaller child portions in this demo are illustrative and require expert review before public use.</p><h3>Before making real recommendations</h3><p>We need verified monitoring results, dates, species, sampling locations, exposure assumptions, matched state advisory boundaries, multiple-contaminant handling, calibrated prediction intervals, and environmental-health review. <b>Official restrictions must always be honored. Missing monitoring data never establishes safety.</b></p><p><a href="https://www.epa.gov/choose-fish-and-shellfish-wisely/support-fish-and-shellfish-advisory-programs" target="_blank" rel="noopener noreferrer">EPA fish advisory resources ↗</a></p>`},
 uncertainty:{title:'Uncertainty and monitoring gaps',body:`<p>The map's multicolor layer is a demonstration of how we might present <b>measured concentrations</b> in the future. Every concentration and region in that preview is made up. The current example range is also invented, not a confidence interval.</p><h3>Future uncertainty reporting</h3><p>For measured data, show the number and dates of samples, sampling location, and observed variation. For validated predictions, distinguish modeled estimates from measurements, report prediction intervals, and identify out-of-sample validation coverage. Where evidence is insufficient, say <b>“Not enough information”</b>, not “safe.”</p><h3>Monitoring priorities</h3><p>A future model could rank locations for additional sampling using predictive uncertainty, potential exposure, and geographic coverage. No such ranking exists in V2.</p>`},
 alternatives:{title:'Safer fish alternatives',body:`<p>V2 does not know which fish are safer at any selected Alabama waterbody, because we have not loaded real measurements or current official restrictions. It would be misleading to recommend specific alternatives.</p><p>In the future, this section can show verified lower-exposure options within the same area, with clear species, location, portion, and group-specific restrictions.</p><p><a href="https://www.alabamapublichealth.gov/tox/fish-advisories.html" target="_blank" rel="noopener noreferrer">Read current Alabama fish advisories ↗</a></p>`}
};
function openModal(kind){const m=MODALS[kind];if(!m)return;$('dialogHeading').textContent=m.title;$('dialogContent').innerHTML=m.body;if($('infoDialog').showModal)$('infoDialog').showModal();else $('infoDialog').setAttribute('open','')}
function run(){
 seedForm();
 document.querySelectorAll('[data-layer]').forEach(btn=>btn.addEventListener('click',()=>setMapLayer(btn.dataset.layer)));
 document.querySelectorAll('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.dialog)));
 $('showMath').addEventListener('click',()=>openModal('method'));
 $('dialogClose').addEventListener('click',()=>$('infoDialog').close());
 $('infoDialog').addEventListener('click',e=>{if(e.target===$('infoDialog'))$('infoDialog').close()});
 $('themeToggle').addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));
 $('resetMap').addEventListener('click',()=>{if(state.map)state.map.flyTo([32.7,-86.8],7)});
 $('location').addEventListener('change',()=>{if($('location').value)setLocation($('location').value)});
 $('species').addEventListener('change',()=>{state.fishId=$('species').value});
 $('checkerForm').addEventListener('submit',e=>{
  e.preventDefault();$('validationMessage').hidden=true;
  try{renderResult(personInput())}catch(err){$('validationMessage').textContent=err.message;$('validationMessage').hidden=false}
 });
 $('clearForm').addEventListener('click',()=>{
  $('checkerForm').reset();state.person=null;state.locationId='';state.fishId='';$('selectedMapText').textContent='Select a lake or river';
  $('filledResult').hidden=true;$('emptyResult').hidden=false;$('resultStatus').textContent='NOT ASSESSED';$('resultStatus').classList.remove('active');$('validationMessage').hidden=true;
  for(const m of state.markers.values())m.setStyle({radius:6,weight:1.8,color:'#073342'});
  if(state.map)state.map.flyTo([32.7,-86.8],7);else drawFallbackMap();
 });
 const links=document.querySelectorAll('.nav-item');
 links.forEach(l=>l.addEventListener('click',()=>{links.forEach(x=>x.classList.toggle('active',x===l));if(l.dataset.nav==='map-section'&&state.map)setTimeout(()=>state.map.invalidateSize(),100)}));
 try{state.theme=localStorage.getItem('alabamaFishV2Theme')==='light'?'light':'dark'}catch(_e){}
 document.documentElement.dataset.theme=state.theme;$('themeToggle').innerHTML=state.theme==='dark'?'☼ <span>Light mode</span>':'◐ <span>Dark mode</span>';
 initMap();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})(window);
