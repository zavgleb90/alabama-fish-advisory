/* Shared data access and selection rules for the catch checker and monitoring map. */
(function(root){
'use strict';
const url=new URL('data/mercury_observations.json',document.currentScript.src);
let pending;
function validate(d){
 if(!d||!Array.isArray(d.stations)||!Array.isArray(d.species)||!Array.isArray(d.records))throw new Error('Invalid mercury dataset structure');
 const ids=new Set();
 for(const s of d.stations){if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||typeof s.waterbody!=='string'||!Number.isFinite(s.lat)||!Number.isFinite(s.lon)||Math.abs(s.lat)>90||Math.abs(s.lon)>180)throw new Error('Invalid or duplicate monitoring station');ids.add(s.id)}
 if(d.species.some(s=>typeof s!=='string'||!s)||new Set(d.species).size!==d.species.length)throw new Error('Invalid species list');
 if(d.records.some(r=>!Array.isArray(r)||r.length!==8||!Number.isInteger(r[0])||r[0]<0||r[0]>=d.stations.length||!Number.isInteger(r[1])||!Number.isInteger(r[2])||r[2]<0||r[2]>=d.species.length||![0,1].includes(r[3])||(r[4]!==null&&(!Number.isFinite(r[4])||r[4]<0))||(r[4]===null&&(!Number.isFinite(r[5])||r[5]<=0))||!Number.isFinite(r[6])))throw new Error('Invalid mercury measurement record');
 return d;
}
async function load(){
 if(!pending)pending=(async()=>{const resp=await fetch(url,{cache:'no-store'});if(!resp.ok)throw new Error('Mercury data HTTP '+resp.status);return validate(await resp.json())})();
 try{return await pending}catch(err){pending=null;throw err}
}
function years(d){return [...new Set(d.records.map(r=>r[1]))].sort((a,b)=>a-b)}
function range(a,b){return a===b?String(a):`${a}–${b}`}
function periodLabel(d){const y=years(d);return y.length?range(y[0],y[y.length-1]):'No measurements'}
function periods(d){
 const y=years(d),out=[['all',y.length?periodLabel(d)+' (all available)':'All available']];
 if(!y.length)return out;
 const lo=y[0],hi=y[y.length-1];
 const decades=[...new Set(y.map(n=>Math.floor(n/10)*10))].reverse();
 for(const dec of decades){const a=Math.max(lo,dec),b=Math.min(hi,dec+9);out.push([`decade:${dec}`,range(a,b)])}
 for(const yr of [...y].reverse())out.push([`year:${yr}`,`${yr} only`]);
 return out;
}
function fillPeriods(select,d){select.replaceChildren();for(const [value,label] of periods(d)){const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt)}select.value='all'}
function fitsYear(y,period){if(period==='all')return true;const [kind,n]=String(period).split(':'),num=Number(n);return kind==='year'?y===num:kind==='decade'?y>=num&&y<=num+9:false}
function filterSampling(rows,mode){
 if(mode==='individual')return rows.filter(r=>r[3]===0);
 if(mode==='composite')return rows.filter(r=>r[3]===1);
 if(mode==='all')return rows;
 const key=r=>`${r[0]}|${r[6]}|${r[2]}`;
 const individualEvents=new Set(rows.filter(r=>r[3]===0).map(key));
 return rows.filter(r=>r[3]!==1||!individualEvents.has(key(r)));
}
root.MercuryData=Object.freeze({load,validate,years,periodLabel,periods,fillPeriods,fitsYear,filterSampling});
})(window);
