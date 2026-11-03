# Alabama Fish Advisory Decision Support — Version 2

A **static, responsive research-prototype website** for exploring Alabama fishing locations and demonstrating the structure of a future personalized fish-consumption advisory tool. Designed to be published free on GitHub Pages.

**Important safety notice:** V2 does **not** contain real mercury measurements, trained prediction models, or imported Alabama official fish-advisory rules. No displayed number, colored region, or map marker may be used to decide whether to eat a fish. The example output is not an advisory. Users must consult current official Alabama guidance.

## Changes from V1

- Replaced the multi-step landing page with a scientific dark dashboard inspired by the selected V2 design reference.
- Large Alabama map on the homepage and responsive catch checker beside it.
- The catch-checking process remains visible as numbered species → location → personal profile → example result steps.
- Clicking example markers (or selecting a location in the form) selects a place for the checker.
- Map layer options: **Locations**, **Mercury preview** (imaginary concentrations and illustrative zones), **Monitoring preview** (imaginary future sampling zones). A clear status notice appears with each layer.
- Map uses Leaflet and OpenStreetMap standard map tiles when the browser can reach them; otherwise, an included, interactive **stylized SVG Alabama backup map** allows location selection and layer preview without a basemap service. The backup drawing is not a regulatory boundary map.
- Example result includes fish illustration, an EPA-based mathematical consumption calculation, and an entirely fictional illustrative scenario band. It does not claim measured confidence or show a recommendation to eat fish.
- Dark is the default theme; a light mode is also available and can be removed later without changing the calculations.
- A section reserved for future AI modeling of unmonitored waterbodies and monitoring priorities.

## Files

```text
index.html           Website structure
styles.css           Responsive dashboard/theme styling
app.js               User interface, fish choices, sample locations, map layers
core.js              Independent, testable EPA mathematical demonstration functions
assets/favicon.svg   Project icon
.nojekyll            Prevents GitHub Pages Jekyll processing
data/example-schema.json  Documentation of future scientific-data structure; NOT loaded
  tests/core.test.js Unit tests for the mathematical demonstration
```

## Run locally

The site contains only static HTML, CSS and JavaScript. Double-click `index.html`, or in PowerShell, from the project folder run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

An internet connection enables Leaflet and the OpenStreetMap basemap, but the fallback location map and calculator can still function without them.

## Publish to GitHub Pages

Copy the files into the **root** of your `zavgleb90/alabama-fish-advisory` repository. From `D:\repos\alabama-fish-advisory`:

```powershell
git add .
git commit -m "V2 scientific dashboard and map layers"
git push origin main
```

If Pages is already configured to deploy from `main` and `/(root)`, the site updates after the push. Otherwise go to repository **Settings → Pages → Build and deployment → Deploy from a branch**, choose `main` and `/(root)`.

Public URL (once Pages is enabled): `https://zavgleb90.github.io/alabama-fish-advisory/`

## Test

```powershell
node --test tests/core.test.js
```

We tested the forms, the offline SVG map with example colored layers, keyboard/mouse selection, demonstration calculation, theme switch, reset, and responsive viewport. We could not verify online basemap tile loading in this restricted test environment; verify the map on your published GitHub Pages website.

## Scientific precautions

1. **Official state restrictions must take precedence.** Their true spatial coverage, species lists, timing, and population groups must be checked, not inferred from map markers.
2. Do not equate **no advisory found**, **no sample**, or **low modeled concentration** with proven safety.
3. Do not mix different portion standards. Alabama's advisory reference meal is eight ounces raw fish for adults; the FDA/EPA national fish chart uses a different four-ounce adult reference serving for certain groups. Child portions and special-population safeguards require expert review.
4. The methylmercury RfD in the mathematical example is 0.1 µg/kg/day. The core conversion is `RfD × body weight ÷ concentration` (g/day), then converted into theoretical raw-fish portions/month. The 40% imaginary example band is **not** a 95% prediction interval or an uncertainty method endorsed by EPA.
5. Other contaminants, multi-species diets, fish preparation, cancer endpoints, and individual exposure conditions require separate scientific treatment.
6. A future model requires validation before any prediction can contribute to advice. Distinguish measured vs. predicted vs. unknown values. For priority mapping, disclose that a high-uncertainty region can be a sampling priority without necessarily being a high-risk location.
7. Do not store a visitor's weight, age, or pregnancy information unless a privacy review determines it is necessary. V2 processes inputs only in browser memory.

### References to verify before launch

- U.S. EPA, *Guidance for Assessing Chemical Contaminant Data for Use in Fish Advisories*, Volume 2: Risk Assessment and Fish Consumption Limits, Third Edition (2000).
- FDA/EPA, *Technical Information on Development of FDA/EPA Advice about Eating Fish* (online technical basis; referenced user PDF dated June 2024).
- Alabama Department of Public Health, current fish advisories: https://www.alabamapublichealth.gov/tox/fish-advisories.html

## Proposed steps for real data

Data ingestion → waterbody/species matching → measured values and uncertainty → harmonized state advisories → validated predictions with calibration → monitoring priority model → independent environmental-health review → public release. `data/example-schema.json` is only a starting documentation sketch, not a ready-to-run importer.


### Basemap reliability (V2 map patch)
The map now uses the OpenStreetMap Standard raster tile URL (no CARTO API key).
The dark appearance is applied in CSS to the raster tiles only, not to
marker or overlay colors. If no tiles load, the existing clickable SVG Alabama
map appears automatically; this is an approximate illustration, not official
geography or a fish advisory. Use of the public OSM tile service must follow its
Tile Usage Policy; for significant public traffic, plan for a hosted or
self-hosted tile provider with appropriate service terms and reliability.
