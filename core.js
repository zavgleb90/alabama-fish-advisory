/* EPA methylmercury calculation engine — demonstration only; not a public advisory. */
(function(root){
'use strict';
const Core = Object.freeze({
  RFD_METHYLMERCURY_UG_KG_DAY:0.1,
  GRAMS_PER_OUNCE:28.349523125,
  DAYS_PER_MONTH:365.25/12,
  demoOnly:true,
  availableMeasurements:0,
  availableVerifiedAdvisories:0,
  consumedGramsDay(weightKg,concentrationUgG,rfd=0.1){
    if(![weightKg,concentrationUgG,rfd].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Inputs must be finite positive numbers');
    return rfd*weightKg/concentrationUgG;
  },
  exampleMealsMonth(weightKg,concentrationUgG,portionOz,rfd=0.1){
    if(!Number.isFinite(portionOz)||portionOz<=0)throw new RangeError('Invalid portion');
    return Core.consumedGramsDay(weightKg,concentrationUgG,rfd)*Core.DAYS_PER_MONTH/(portionOz*Core.GRAMS_PER_OUNCE);
  },
  kgFrom(value,unit){
    if(!Number.isFinite(value)||value<=0||!['kg','lb'].includes(unit))throw new RangeError('Invalid weight');
    return unit==='kg'?value:value/2.2046226218;
  },
  illustrativePortionOz(age){
    if(!Number.isInteger(age)||age<1||age>120)throw new RangeError('Invalid age');
    // Illustrative child reference portions, not reviewed Alabama pediatric guidance.
    return age<=3?1:age<=7?2:age<=10?3:age<=13?4:8;
  },
  imaginaryScenario(center){
    if(!Number.isFinite(center)||center<=0)throw new RangeError('Invalid concentration');
    return {low:center*.6,center,high:center*1.4};
  }
});
if(typeof module!=='undefined'&&module.exports) module.exports=Core;
root.FishAdvisorCore=Core;
})(typeof window!=='undefined'?window:globalThis);
