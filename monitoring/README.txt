ALABAMA FISH ADVISORY TOOL - MONITORING STATION MAP PREVIEW
================================================================

Source: "FTMP Data ALAWADR 1970_2024 0728_2025(1).xlsx"

Quick start
-----------
Open "station-map.html" in a modern browser. You can also put it in the
root of your existing GitHub Pages repository and open:
https://zavgleb90.github.io/alabama-fish-advisory/station-map.html

The map uses Leaflet + Leaflet.markercluster from unpkg.com and standard
OpenStreetMap tiles when online. If map scripts/tiles are unavailable, the
page shows a simplified coordinate-based backup plot. Standard OSM tiles
are best effort; follow the OSM tile usage policy at:
https://operations.osmfoundation.org/policies/tiles/

Map design
----------
* All 395 registered FTMP stations are shown, with 218 literal distinct
  waterbody names (NOT necessarily 218 distinct physical waterbodies).
* 259 station codes in the directory are linked to mercury observations
  dated 2000-2024. There are 261 codes in the chemistry table, but 2 have
  no matching station-directory entry: GUNM-8A and TRKB-1.
* 331 stations in the directory link to mercury observations at any time.
* 42 stations in the directory have a mercury observation dated in 2024.
* The worksheet contains 395 valid latitude/longitude pairs. The pair
  TENR-281 / TRNR-281 shares the same coordinates; those appear stacked
  until zoomed/spiderfied with the online marker clustering plugin.
* Multiple stations in the same named lake/river are separate points.
  Waterbody and county dropdowns are FILTERS, not data aggregation.
* Marker colors indicate recent mercury record availability only.
  They do NOT indicate measured concentrations or consumption safety.

Files
-----
station-map.html  - standalone interactive browser map (station data embedded)
stations.geojson - accurate station point coordinates and station metadata
stations.json    - smaller station data format for later website integration
metadata.json    - count validation metadata
README.txt       - these instructions

Caution
-------
This is a station LOCATION visualization, not an advisory, and not a map
of mercury levels. We must later decide species, date window and handling
of below-detection values before assigning concentration-based colors.
Waterbody grouping is based on exact LOCALE_NAME strings; naming variants
may need harmonization. Geographic lake/reservoir polygons are not provided
in this workbook and must come from a separate verified GIS source.
