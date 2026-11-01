# Alabama Fish Advisor — first working prototype

**Status: demonstration only. This website is NOT a fish consumption advisory.**

A mobile-friendly, four-step prototype that illustrates how anglers could select a fish species, select an Alabama catch location, enter personal information, and understand how a fish-consumption calculation works. The interface has light and dark themes; neither theme changes the scientific logic.

## What works now

1. **Choose a fish:** eight illustrative fish types with SVG drawings and name search.
2. **Choose where it was caught:** searchable list of twelve example Alabama waterbodies and an interactive Leaflet/OpenStreetMap map. Coordinates are approximate example centers, **not monitoring sites or advisory boundaries**. A fallback location list remains available if the map library cannot load.
3. **Enter personal details:** age, body weight (lb or kg), optional sex, pregnancy / planning / breastfeeding status, and an illustrative raw-fish portion size.
4. **See the example:** a hypothetical mercury-only calculation using an EPA noncancer framework, with a **made-up** contaminant concentration and a **made-up ±40% scenario range**. Neither a safe meal frequency nor an official risk category is inferred. The page directs users to the current official Alabama fish advisories.

The light/dark switch is in the header. Theme selection is saved locally in the visitor's browser; the personal inputs are **not saved or transmitted by this prototype**. There is no account, tracking script, backend, or database.

## Preview locally

Download/unzip the repository, then open `index.html` in a browser. The website's styles, fish drawings, inputs, and calculation are local. The interactive map requires internet access to Leaflet and OpenStreetMap tiles. If it cannot load, the location list and a simplified fallback map remain usable.

For a local web server, from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Publish free with GitHub Pages

1. In GitHub, create a **new public repository** named `alabama-fish-advisory` under the `zavgleb90` account. This repository must be created before files can be uploaded; the current ChatGPT GitHub connector cannot create repositories.
2. Upload `index.html`, `styles.css`, `app.js`, `.nojekyll`, `assets/`, `tests/`, and `README.md` directly to the repository's **main** branch, keeping folder names unchanged. You can use **Add file → Upload files** in GitHub.
3. Go to **Settings → Pages → Build and deployment**. Under **Source**, choose **Deploy from a branch**. Choose **main** and **/(root)**, then save.
4. Once GitHub finishes publishing, the expected address is `https://zavgleb90.github.io/alabama-fish-advisory/`.

GitHub Pages on GitHub Free is sufficient for this static prototype. It does not run a Python backend or train predictive models when visitors load the site.

## Repository files

```text
alabama-fish-advisory/
├── index.html              # Pages, content, form, status labels
├── styles.css              # V1 dark / V2 light + responsive layout
├── app.js                  # UX, example locations, demo calculation
├── assets/
│   └── favicon.svg
├── tests/
│   └── core.test.js        # Fast arithmetic/validation checks with Node.js
├── .nojekyll               # GitHub Pages compatibility
└── README.md
```

Run calculator checks with `node tests/core.test.js`.

## Scientific boundaries: read before releasing publicly

- **Never** label a fish safe because its waterbody or species is missing from an advisory table. Alabama's 2026 guide explains that missing entries may reflect no sampling, insufficient data, or other gaps.
- **Official advisories must take precedence** over statistical predictions. Any model-based meal count must not weaken a current official restriction.
- Use accurate **species + site/segment matching**. A river name alone is not enough because advisory boundaries can differ along river reaches.
- Check **other contaminants**, including PCBs and PFOS, not just mercury. Some contaminants require different risk models and assumptions.
- Respect **sensitive population guidance** (children under 14, pregnant or nursing people, people planning pregnancy) in the current Alabama advisory.
- The EPA equation shown here is the chronic **noncarcinogenic** consumption-rate framework only. It is *not* sufficient as a complete safety determination.
- The example ±40% band is **not** a 95% confidence interval, validated model prediction, or real uncertainty estimate.
- Alabama advisory meals are typically **8 oz raw fish**. The FDA/EPA national fish choice categories use a different **4 oz** adult reference serving. They should never be mixed without an explicit scientific decision.
- Example child portions in `referencePortionOz` are instructional placeholders. A public release requires review by an environmental-health specialist to align meal sizes and restrictions with the applicable guidance.
- We will need a documented protocol for updating official advisories and retiring stale predictions, plus external validation and user testing (especially with low-literacy users).

### Future data design (not implemented)

Keep *observations*, *official advisories*, and *model estimates* distinct:

- `data/measurements.csv`: sample ID, species, date, spatial location, waterbody segment, analyte, wet-weight concentration, units, detection limit, QA/QC source.
- `data/official_advisories.json`: source URL/document, effective date, waterbody boundary/river reach, species, contaminant, population, meal restriction, update history.
- `data/predictions.json`: model version, estimated level, validated uncertainty interval, spatial coverage, applicability limitations, quality metrics.
- `risk-engine/`: separately validated EPA calculations, regulatory priority rules, and reproducible tests.

Do not add actual consumption advice to this prototype until these checks are passed and the recommendation wording has been professionally reviewed.

## Sources

- [Alabama Department of Public Health: official fish advisories](https://www.alabamapublichealth.gov/tox/fish-advisories.html)
- [Alabama Fish Consumption Advisories 2026 (PDF)](https://www.alabamapublichealth.gov/tox/assets/2026_fishadvisory.pdf)
- [EPA fish advisory technical guidance](https://www.epa.gov/choose-fish-and-shellfish-wisely/support-fish-and-shellfish-advisory-programs)
- [FDA/EPA technical information on fish advice](https://www.fda.gov/food/environmental-contaminants-food/technical-information-development-fdaepa-advice-about-eating-fish-those-who-might-become-or-are)
- [Leaflet maps](https://leafletjs.com/) and [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)

Independent research prototype. Not affiliated with or endorsed by the Alabama Department of Public Health or the EPA.
