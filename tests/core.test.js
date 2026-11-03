const assert = require('node:assert/strict');
const test = require('node:test');
const c = require('../core.js');
test('requires valid positive inputs', () => {
 assert.throws(()=>c.consumedGramsDay(70,0));
 assert.throws(()=>c.consumedGramsDay(-70,0.2));
 assert.throws(()=>c.exampleMealsMonth(70,0.2,0));
});
test('matches EPA equation with known positive inputs', () => {
 assert.equal(c.consumedGramsDay(70,0.35),20);
 assert.ok(Math.abs(c.exampleMealsMonth(70,0.35,8)-2.683) < .01);
});
test('bodyweight conversion and portions', () => {
 assert.ok(Math.abs(c.kgFrom(154.323583526, 'lb')-70)<.001);
 assert.equal(c.illustrativePortionOz(40),8);
 assert.equal(c.illustrativePortionOz(4),2);
});
test('hypothetical scenarios are clearly separate', () => {
 assert.deepEqual(c.imaginaryScenario(.5),{low:.3,center:.5,high:.7});
 assert.equal(c.availableMeasurements,0);
 assert.equal(c.availableVerifiedAdvisories,0);
 assert.equal(c.demoOnly,true);
});
