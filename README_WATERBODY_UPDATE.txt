ALABAMA FISH ADVISORY TOOL — WATERBODY SELECTION UPDATE

Extract this archive directly into your existing Git repository. It intentionally
contains no mercury_observations.json: both the map and calculator continue to
fetch the same data/mercury_observations.json. Keep your existing data, core.js,
assets and .git directory. Use GitHub Pages or an HTTP server, not file://.

Changes:
- Default location selection is lake, river or another waterbody. An optional
  station dropdown is under More options.
- Fish and waterbody choices show matching record availability for the selected
  period and sample type. No-data choices remain available. Locations with
  numeric data are listed first, then nondetect-only, then no matching records.
- Grouping preserves exact workbook waterbody labels, separates identical labels
  in different basins, and expands common abbreviations for display. Tributaries
  are not automatically merged with reservoirs. No separate crosswalk or JSON
  file is required. Geographic grouping is not an advisory boundary definition.
- Clicking a map station selects its waterbody in the catch checker by default;
  the exact station remains available under More options.
- The calculation preserves the existing EPA screening formula, using the pooled
  detected-only median (records, not equal-weight station averages) for the
  selected fish, period, sample type and geographic scope. The results identify
  contributing stations and the range of their detected-only medians.
- A successful calculation is now labelled Research estimate available; official
  advisories are not checked. No matching records or no usable positive median
  produce no calculated portion count. Nondetects are not zero. Historical pooled
  observations are not evidence of present safety throughout a waterbody.
- Map clustering, concentration colors, mouse-wheel zoom, and shared JSON loader
  are preserved. No predictive modeling or official advisory integration added.

One-time deployment (PowerShell from your repository):
  git add index.html app.js styles.css mercury-data.js monitoring/station-map.html README_WATERBODY_UPDATE.txt
  git commit -m "Add waterbody-based catch selection and clarify estimate status"
  git push origin main

For future measurement updates, run the existing Excel-to-JSON notebook and push
only data/mercury_observations.json. The new grouping and dropdowns are computed
at runtime from that file.
