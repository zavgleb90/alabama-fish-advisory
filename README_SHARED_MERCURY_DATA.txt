Alabama Fish Advisory Tool — shared mercury dataset update

ONE-TIME INSTALLATION (existing GitHub repository)
Extract this ZIP directly into D:\repos\alabama-fish-advisory.
Replace index.html, app.js and monitoring\station-map.html.
The new mercury-data.js belongs beside index.html.
Keep the existing .git directory, styles.css, core.js, assets and data directory.
Your existing data\mercury_observations.json is intentionally NOT in this ZIP.

PowerShell:
cd "D:\repos\alabama-fish-advisory"
git add index.html app.js mercury-data.js monitoring/station-map.html README_SHARED_MERCURY_DATA.txt
git commit -m "Use one shared mercury dataset for map and catch checker"
git push origin main

After GitHub Pages publishes, refresh the homepage and standalone map.
If necessary, use Ctrl+Shift+R once to replace cached older HTML/JS.
The map still supports mouse-wheel zoom. The design, concentration colors,
measurement summaries and research-only EPA calculation remain unchanged.

FUTURE DATA UPDATES (ONLY ONE FILE)
1. Run Alabama_FTMP_Excel_to_Website_JSON.ipynb with the latest source workbook.
   Adjust INPUT_XLSX and START_YEAR/END_YEAR as needed to cover new years.
2. The notebook writes data\mercury_observations.json in the repository.
3. PowerShell:
   cd "D:\repos\alabama-fish-advisory"
   git add data/mercury_observations.json
   git commit -m "Refresh mercury measurements"
   git push origin main
4. After GitHub Pages deploys, reload either page.
The old warning in the notebook about the standalone map's embedded data is
no longer applicable after this one-time update. No need to modify its converter.

Both components (including the homepage's embedded map) load the same JSON
through mercury-data.js, using cache:'no-store'. The shared code generates
sampling periods from the actual years in the records and applies the same
individual/composite selection rule in both views. Station counts and period
labels are derived from the loaded dataset. No second embedded record copy.

The JSON contract remains stations, species, records, meta; records are
[station index, calendar year, species index, measurement type, detected value,
 detection limit, Excel collection day, qualifier flag]. Existing converter works
with this structure. New schema changes would require coordination.

Validation: syntax checks and JavaScript execution tests of the original data
(395 stations, 8,852 mapped records) and a temporary test fixture with new 2025
records, a new station, and a new species passed. Both scripts returned the same
station-level medians. The fixture is not included in this ZIP. Live browser
navigation was blocked in the test environment, so live map rendering is not
verified here. For local testing use a web server (python -m http.server 8000).

Historical total mercury observations and exploratory screening calculations
are not official eating advice. Official Alabama advisories remain separate.
