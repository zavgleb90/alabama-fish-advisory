/* Alabama Fish Advisor — research demonstration.
 * No real contaminant observations, predictive model outputs, or verified local
 * advisory rules are bundled with this application. Never treat scenario
 * calculations as fish consumption advice.
 */
(function (root) {
  'use strict';

  const Core = Object.freeze({
    METHYLMERCURY_RFD_UG_KG_DAY: 0.1,
    GRAMS_PER_OUNCE: 28.349523125,
    DAYS_PER_MONTH: 365.25 / 12,
    demoOnly: true,
    availableAdvisoryRecords: 0,
    availableMeasurementRecords: 0,
    /** EPA noncancer framework: RfD (µg/kg/day) * body weight (kg) / concentration (µg/g).
     * Returns hypothetical grams of raw fish per day. */
    consumptionLimitGramsDay: function (weightKg, contaminantUgG, rfd = 0.1) {
      if (![weightKg, contaminantUgG, rfd].every(Number.isFinite) || weightKg <= 0 || contaminantUgG <= 0 || rfd <= 0) {
        throw new RangeError('Weight, concentration, and RfD must be positive finite values');
      }
      return (rfd * weightKg) / contaminantUgG;
    },
    /** Returns a theoretical number of fish portions/month, NOT a safety recommendation. */
    hypotheticalMealsMonth: function (weightKg, contaminantUgG, portionOz, rfd = 0.1) {
      if (!Number.isFinite(portionOz) || portionOz <= 0) throw new RangeError('Portion must be positive');
      return Core.consumptionLimitGramsDay(weightKg, contaminantUgG, rfd) * Core.DAYS_PER_MONTH / (portionOz * Core.GRAMS_PER_OUNCE);
    },
    referencePortionOz: function (age) {
      if (!Number.isInteger(age) || age < 1 || age > 120) throw new RangeError('Age must be 1–120 years');
      // These are illustrative age-specific raw-fish portions. They are NOT
      // Alabama's official child serving standard; real advice must be reviewed.
      if (age <= 3) return 1;
      if (age <= 7) return 2;
      if (age <= 10) return 3;
      if (age <= 13) return 4;
      return 8; // Alabama's adult reference advisory meal (raw weight).
    },
    kgFrom: function (weight, unit) {
      if (!Number.isFinite(weight) || weight <= 0 || (unit !== 'lb' && unit !== 'kg')) throw new RangeError('Invalid weight or unit');
      return unit === 'kg' ? weight : weight / 2.2046226218;
    },
    exampleRange: function (center) {
      if (!Number.isFinite(center) || center <= 0) throw new RangeError('Invalid example concentration');
      return { low: center * 0.6, center: center, high: center * 1.4 };
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  root.FishAdvisorCore = Core;
  if (typeof document === 'undefined') return;

  const FISH = [
    { id: 'bass', name: 'Largemouth Bass', alt: 'Stylized green largemouth bass', body: '#779a4b', top: '#516e42', fin: '#4c7147' },
    { id: 'catfish', name: 'Channel Catfish', alt: 'Stylized blue-gray channel catfish', body: '#7893a6', top: '#436779', fin: '#52718a', whiskers: true },
    { id: 'crappie', name: 'Crappie', alt: 'Stylized speckled crappie', body: '#a6b5a4', top: '#667c6c', fin: '#718e77', spots: true },
    { id: 'bluegill', name: 'Bluegill', alt: 'Stylized bluegill sunfish', body: '#d2ab63', top: '#4c8390', fin: '#a87a3f', round: true },
    { id: 'striped-bass', name: 'Striped Bass', alt: 'Stylized striped bass', body: '#a7afb2', top: '#536b78', fin: '#687f88', stripes: true },
    { id: 'flathead', name: 'Flathead Catfish', alt: 'Stylized flathead catfish', body: '#96965f', top: '#697348', fin: '#64713e', whiskers: true },
    { id: 'redbreast', name: 'Redbreast Sunfish', alt: 'Stylized redbreast sunfish', body: '#bb8450', top: '#4e8571', fin: '#a56048', round: true },
    { id: 'white-bass', name: 'White Bass', alt: 'Stylized pale silver bass', body: '#b1c6bf', top: '#6e999b', fin: '#78958c', stripes: true }
  ];
  // These are approximate map centers used to demonstrate navigation, not
  // monitoring points or regulatory advisory boundaries.
  const LOCATIONS = [
    { id: 'martin', name: 'Lake Martin', type: 'Lake / reservoir', lat: 32.75, lon: -85.91 },
    { id: 'guntersville', name: 'Guntersville Lake', type: 'Lake / Tennessee River', lat: 34.41, lon: -86.27 },
    { id: 'logan-martin', name: 'Logan Martin Lake', type: 'Lake / Coosa River', lat: 33.47, lon: -86.31 },
    { id: 'smith', name: 'Lewis Smith Lake', type: 'Lake / reservoir', lat: 34.06, lon: -87.05 },
    { id: 'weiss', name: 'Weiss Lake', type: 'Lake / Coosa River', lat: 34.13, lon: -85.64 },
    { id: 'lay', name: 'Lay Lake', type: 'Lake / Coosa River', lat: 33.05, lon: -86.50 },
    { id: 'pickwick', name: 'Pickwick Lake', type: 'Lake / Tennessee River', lat: 34.91, lon: -88.04 },
    { id: 'eufaula', name: 'Lake Eufaula', type: 'Lake / Chattahoochee River', lat: 31.91, lon: -85.15 },
    { id: 'black-warrior', name: 'Black Warrior River (Tuscaloosa)', type: 'River / approximate point', lat: 33.19, lon: -87.57 },
    { id: 'mobile-tensaw', name: 'Mobile–Tensaw Delta', type: 'River delta / approximate point', lat: 30.84, lon: -87.91 },
    { id: 'tallapoosa', name: 'Tallapoosa River (near Tallassee)', type: 'River / approximate point', lat: 32.54, lon: -85.89 },
    { id: 'coosa', name: 'Coosa River (near Wetumpka)', type: 'River / approximate point', lat: 32.54, lon: -86.21 }
  ];
  const $ = (id) => document.getElementById(id);
  const state = { fish: null, location: null, person: null, step: 1, maxStep: 1, demoConcentration: 0.25, map: null, markers: new Map() };
  const officialUrl = 'https://www.alabamapublichealth.gov/tox/fish-advisories.html';
  const safeNum = (n, digits = 1) => Number(n).toFixed(digits).replace(/\.0$/, '');

  function fishArt(fish) {
    const x = fish.round ? 'M50 46C64 13 106 10 134 40C146 52 145 73 130 86C100 113 62 97 50 67Z' : 'M24 59C46 28 98 27 133 50L167 29L163 58L170 87L132 68C100 94 52 86 24 59Z';
    const markings = fish.spots ? '<g fill="#344d40" opacity=".7"><circle cx="77" cy="42" r="4"/><circle cx="95" cy="58" r="5"/><circle cx="112" cy="44" r="3"/><circle cx="88" cy="72" r="3"/><circle cx="61" cy="63" r="3"/><circle cx="109" cy="70" r="4"/></g>' : (fish.stripes ? '<path d="M65 45C89 54 109 54 128 53M65 54C91 65 107 64 128 62M65 62C87 76 109 75 124 69" fill="none" stroke="#45626a" stroke-width="3" opacity=".75"/>' : '<path d="M63 56Q98 47 128 58" fill="none" stroke="#3c624c" stroke-width="4" opacity=".7"/>');
    const whiskers = fish.whiskers ? '<path d="M40 66Q5 59 5 75M41 70Q7 84 14 97M40 62Q8 44 3 38" fill="none" stroke="#536776" stroke-width="2"/>' : '';
    return `<svg viewBox="0 0 180 115" role="img" aria-label="${fish.alt}" xmlns="http://www.w3.org/2000/svg"><path d="M68 44L84 20L105 37M87 77L108 102L120 77" fill="${fish.fin}" opacity=".92"/><path d="${x}" fill="${fish.body}" stroke="${fish.top}" stroke-width="3" stroke-linejoin="round"/><path d="M41 52Q54 49 64 60Q54 71 41 65" fill="#f2edce" opacity=".8"/><path d="M72 80L91 98L97 79" fill="${fish.fin}" stroke="${fish.top}" stroke-width="2"/><path d="M44 53Q34 53 27 48M43 65Q34 68 26 68" fill="none" stroke="${fish.top}" stroke-width="2"/>${markings}${whiskers}<circle cx="45" cy="52" r="5" fill="#263c3b"/><circle cx="44" cy="50" r="1.7" fill="#fff"/><path d="M27 66Q39 67 46 67" fill="none" stroke="${fish.top}" stroke-width="2"/><path d="M59 80Q75 92 90 83" fill="none" stroke="${fish.top}" stroke-width="2" opacity=".65"/></svg>`;
  }

  function renderFishes() {
    const query = $('fishSearch').value.trim().toLowerCase();
    const matches = FISH.filter(f => f.name.toLowerCase().includes(query));
    const grid = $('fishGrid');
    grid.replaceChildren();
    for (const f of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fish-choice' + (state.fish?.id === f.id ? ' selected' : '');
      button.setAttribute('aria-pressed', state.fish?.id === f.id ? 'true' : 'false');
      button.innerHTML = `<span class="fish-choice-art">${fishArt(f)}</span><span class="fish-choice-label"><span>${f.name}</span><span aria-hidden="true">${state.fish?.id === f.id ? '✓' : '›'}</span></span>`;
      button.addEventListener('click', () => {
        state.fish = f;
        $('fishSelected').textContent = f.name;
        $('to2').disabled = false;
        state.maxStep = Math.max(state.maxStep, 2);
        renderFishes();
        updateStepper();
      });
      grid.append(button);
    }
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state';
      empty.textContent = 'No fish match. Try a different name.';
      grid.append(empty);
    }
  }
  function renderLocations() {
    const query = $('locationSearch').value.trim().toLowerCase();
    const list = $('locationList');
    list.replaceChildren();
    for (const loc of LOCATIONS.filter(l => (l.name + ' ' + l.type).toLowerCase().includes(query))) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'location-choice' + (state.location?.id === loc.id ? ' selected' : '');
      button.setAttribute('aria-pressed', state.location?.id === loc.id ? 'true' : 'false');
      button.innerHTML = `<span class="pin" aria-hidden="true">⌖</span><span><span class="location-name">${loc.name}</span><span class="location-type">${loc.type}</span></span><span class="location-tick" aria-hidden="true">${state.location?.id === loc.id ? '✓' : '›'}</span>`;
      button.addEventListener('click', () => selectLocation(loc));
      list.append(button);
    }
    if (!list.childElementCount) {
      const empty = document.createElement('p'); empty.className = 'empty-state';
      empty.textContent = 'No matches. Pick a different place.';
      list.append(empty);
    }
  }
  function selectLocation(loc, pan = true) {
    state.location = loc;
    $('locationSelected').textContent = loc.name;
    $('to3').disabled = false;
    state.maxStep = Math.max(state.maxStep, 3);
    renderLocations();
    updateStepper();
    if (pan && state.map) {
      state.map.flyTo([loc.lat, loc.lon], Math.max(8, state.map.getZoom()), { duration: 0.6 });
      state.markers.get(loc.id)?.openPopup();
    }
  }
  function initMap() {
    if (state.map) { setTimeout(() => state.map.invalidateSize(), 50); return; }
    if (typeof root.L === 'undefined') { $('alabamaMap').hidden = true; $('mapFallback').hidden = false; return; }
    try {
      const map = root.L.map('alabamaMap', { zoomControl: true, scrollWheelZoom: false, minZoom: 6, maxZoom: 15 });
      map.setView([32.75, -86.72], 7);
      root.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map);
      for (const loc of LOCATIONS) {
        const marker = root.L.circleMarker([loc.lat, loc.lon], { radius: 7, color: '#083b5e', weight: 2, fillColor: '#38d2d9', fillOpacity: .95 }).addTo(map);
        marker.bindPopup(`<strong>${loc.name}</strong><br><small>Example location · Not an advisory boundary</small>`);
        marker.on('click', () => selectLocation(loc, false));
        state.markers.set(loc.id, marker);
      }
      map.on('tileerror', () => { /* Map remains usable via its location list if tiles fail. */ });
      state.map = map;
      setTimeout(() => map.invalidateSize(), 80);
    } catch (_err) { $('alabamaMap').hidden = true; $('mapFallback').hidden = false; }
  }
  function updateStepper() {
    document.querySelectorAll('.step-button').forEach(b => {
      const n = Number(b.dataset.step);
      b.classList.toggle('active', n === state.step);
      b.classList.toggle('complete', n < state.step);
      b.disabled = n > state.maxStep;
      b.setAttribute('aria-current', n === state.step ? 'step' : 'false');
    });
  }
  function showStep(n) {
    if (n > state.maxStep || n < 1 || n > 4) return;
    state.step = n;
    for (let i = 1; i <= 4; i++) $('step' + i).hidden = n !== i;
    updateStepper();
    if (n === 2) initMap();
    document.querySelector('.workspace-head').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function readPerson() {
    const age = Number($('age').value);
    const weight = Number($('weight').value);
    const unit = $('weightUnit').value;
    if (!Number.isInteger(age) || age < 1 || age > 120 || $('age').value.trim() === '') throw new Error('Please enter an age between 1 and 120.');
    if ($('weight').value.trim() === '' || !Number.isFinite(weight) || weight <= 0 || (unit === 'lb' ? weight > 650 : weight > 295)) throw new Error('Please enter a valid body weight.');
    const weightKg = Core.kgFrom(weight, unit);
    if (weightKg < 4 || weightKg > 295) throw new Error('Weight is outside the range supported by this demonstration.');
    const mealValue = $('mealSize').value;
    const portionOz = mealValue === 'auto' ? Core.referencePortionOz(age) : Number(mealValue);
    return { age, weight, unit, weightKg, sex: $('profileSex').value, lifeStage: $('lifeStage').value, portionOz };
  }
  function renderResult() {
    const p = state.person;
    if (!p || !state.fish || !state.location) return;
    const band = Core.exampleRange(state.demoConcentration);
    // Using the high (hypothetical) scenario is a display choice, not a
    // validated way to incorporate uncertainty in a real public advisory.
    const theoretical = Core.hypotheticalMealsMonth(p.weightKg, band.high, p.portionOz);
    $('resultFish').textContent = state.fish.name;
    $('resultLocation').textContent = state.location.name + ' · Alabama (illustrative place)';
    const stageName = { general:'general population', pregnant:'pregnant', planning:'planning pregnancy', breastfeeding:'breastfeeding' }[p.lifeStage];
    $('resultPerson').textContent = `Age ${p.age} · ${safeNum(p.weight)} ${p.unit} · ${stageName}`;
    $('resultNumber').textContent = theoretical.toFixed(1);
    $('resultUnit').textContent = 'theoretical meals / month';
    $('resultServing').textContent = `${safeNum(p.portionOz)} oz of raw fish per example meal`;
    $('lowC').textContent = safeNum(band.low,2) + ' µg/g';
    $('centerC').textContent = safeNum(band.center,2) + ' µg/g';
    $('highC').textContent = safeNum(band.high,2) + ' µg/g';
    $('demoConcentrationValue').textContent = safeNum(band.center,2) + ' µg/g';
    $('calcDetails').textContent = `Example only: (0.1 µg/kg/day × ${safeNum(p.weightKg,1)} kg) ÷ ${safeNum(band.high,2)} µg/g = ${safeNum(Core.consumptionLimitGramsDay(p.weightKg,band.high),1)} grams/day. Multiply by ${safeNum(Core.DAYS_PER_MONTH,2)} days/month, then divide by ${safeNum(p.portionOz * Core.GRAMS_PER_OUNCE,1)} grams per hypothetical meal. This is not a measured concentration or a safe meal limit.`;
  }
  const dialogs = {
    science: {
      title:'How the science works',
      body:`<p><strong>This version contains no actual local measurements or verified advisory rules.</strong> It demonstrates the structure of EPA's chronic noncancer consumption-limit calculation using an imaginary concentration.</p>
      <h3>The calculation</h3><div class="math-display">Fish amount (g/day) = Reference dose (µg/kg/day) × body weight (kg) ÷ fish concentration (µg/g)</div>
      <p>For the methylmercury worked example, we use an RfD of 0.1 µg/kg body weight/day. The selected example concentration is invented, and the 40% range around it is invented too. The resulting meal count is <strong>not</strong> a fish advisory.</p>
      <h3>Why the serving sizes differ</h3><p>Alabama's public fish-advisory materials describe an adult advisory meal as 8 ounces of raw fish (about 6 ounces cooked). The FDA/EPA national advice for pregnant or breastfeeding people and children uses a different 4-ounce adult reference serving. These are different frameworks. This prototype uses the Alabama adult meal for demonstration, and illustrative smaller child portions that require review before any real use.</p>
      <h3>When verified data arrive</h3><ol><li>Import measured contaminants, species, sampling dates, and waterbody information.</li><li>Import current official Alabama advisories, matching waterbody boundaries and covered species.</li><li>Validate a geographic prediction model and its uncertainty intervals.</li><li>Apply the applicable official advisory rules and calculate the most restrictive appropriate limit. Never infer "safe" from missing data.</li><li>Have qualified environmental-health experts review the model and all public wording before publication.</li></ol>
      <p><a href="${officialUrl}" target="_blank" rel="noopener noreferrer">Current Alabama fish advisories ↗</a><br><a href="https://www.epa.gov/choose-fish-and-shellfish-wisely/support-fish-and-shellfish-advisory-programs" target="_blank" rel="noopener noreferrer">EPA fish advisory guidance ↗</a></p>`
    },
    help: {
      title:'Common questions',
      body:`<h3>Can I use this to decide whether to eat a fish?</h3><p>No. This version is a <strong>research demonstration</strong>. It does not contain actual local contaminant measurements or official advisory restrictions. Check Alabama's published advisories before making food decisions.</p><h3>Why ask for age and weight?</h3><p>Age helps identify groups needing extra protection; body weight is one factor in the EPA exposure calculation. The inputs stay inside your browser and are not transmitted to the prototype operator.</p><h3>Why show a range?</h3><p>Future estimates may have uncertainty because fish sampled at different times and locations can contain different concentrations. The current range is invented for illustration. It is <em>not</em> an estimated confidence interval.</p><h3>Does "no advisory" mean safe?</h3><p>No. Missing data or no listed advisory does not prove safety. The real tool must distinguish those situations.</p><p><a href="${officialUrl}" target="_blank" rel="noopener noreferrer">See official Alabama advisories ↗</a></p>`
    },
    places: {
      title:'About the example locations',
      body:`<p>The map includes a short list of well-known Alabama lakes and rivers with <strong>approximate map coordinates</strong> for user-interface testing. These are not contaminant sampling locations, legal boundaries, or advisory polygons.</p><p>After you choose a fish, use <strong>Catch location</strong> to select a place on the map or search the location list.</p><p>Before a public release, we'll match real location boundaries and species to verified state advisory information, including separate advice for at-risk groups.</p><p><a href="${officialUrl}" target="_blank" rel="noopener noreferrer">Alabama's official advisory website ↗</a></p>`
    }
  };
  function openInfo(kind) {
    const item = dialogs[kind];
    if (!item) return;
    $('dialogTitle').textContent = item.title;
    $('dialogBody').innerHTML = item.body; // static developer-maintained text only
    if (typeof $('infoDialog').showModal === 'function') $('infoDialog').showModal();
    else $('infoDialog').setAttribute('open','');
  }
  function setTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
    $('lightTheme').classList.toggle('selected', t === 'light');
    $('darkTheme').classList.toggle('selected', t === 'dark');
    $('lightTheme').setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    $('darkTheme').setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    try { root.localStorage.setItem('fishAdvisorTheme',t); } catch (_err) { /* storage may be disabled */ }
    if (state.map) setTimeout(() => state.map.invalidateSize(), 20);
  }
  function reset() {
    state.fish = null; state.location = null; state.person = null; state.maxStep = 1;
    state.demoConcentration = .25;
    $('fishSearch').value = '';
    $('locationSearch').value = '';
    $('age').value = '';
    $('weight').value = '';
    $('weightUnit').value = 'lb';
    $('mealSize').value = 'auto';
    $('profileSex').value = 'unspecified';
    $('lifeStage').value = 'general';
    $('demoConcentration').value = '.25';
    $('fishSelected').textContent = 'None yet';
    $('locationSelected').textContent = 'None yet';
    $('to2').disabled = true; $('to3').disabled = true;
    renderFishes(); renderLocations(); showStep(1);
  }
  function setup() {
    renderFishes(); renderLocations(); updateStepper();
    $('fishSearch').addEventListener('input',renderFishes);
    $('locationSearch').addEventListener('input',renderLocations);
    $('to2').addEventListener('click', () => showStep(2));
    $('back2').addEventListener('click', () => showStep(1));
    $('to3').addEventListener('click', () => showStep(3));
    $('back3').addEventListener('click', () => showStep(2));
    $('back4').addEventListener('click', () => showStep(3));
    $('startOver').addEventListener('click',reset);
    $('demoConcentration').addEventListener('input', event => { state.demoConcentration = Number(event.target.value); renderResult(); });
    $('personForm').addEventListener('submit', event => {
      event.preventDefault();
      try {
        state.person = readPerson();
        $('formError').hidden = true;
        state.maxStep = 4;
        renderResult(); showStep(4);
      } catch (err) { $('formError').textContent = err.message; $('formError').hidden = false; }
    });
    $('lightTheme').addEventListener('click', () => setTheme('light'));
    $('darkTheme').addEventListener('click', () => setTheme('dark'));
    $('closeDialog').addEventListener('click', () => $('infoDialog').close());
    $('infoDialog').addEventListener('click', e => { if (e.target === $('infoDialog')) $('infoDialog').close(); });
    document.querySelectorAll('.step-button').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.step))));
    document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click',() => {
      const route = btn.dataset.nav;
      if (route === 'home') showStep(1);
      else if (route === 'places') { if (state.fish) showStep(2); else openInfo('places'); }
      else openInfo(route);
      document.querySelectorAll('.top-nav .nav-link').forEach(n => n.classList.toggle('current',n.dataset.nav === route));
    }));
    try { setTheme(root.localStorage.getItem('fishAdvisorTheme') || 'light'); } catch (_err) { setTheme('light'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setup);
  else setup();
}(typeof window !== 'undefined' ? window : globalThis));
