# Documentation Demo Data

## Theme fonts

The theme customizer includes local, optional WOFF2 conversions of OFL-licensed
fonts. Sources and per-font copyright/license texts are in `public/fonts/theme/`.
They load on demand. Xiaolai SC and the original Yozai subset are supplied by
`@inkra/react`; their notices and OFL licenses are copied into the built site's
`licenses/` directory. Fonts are not covered by the documentation's MIT license.

The optional multilingual handwriting collection includes Caveat, Patrick Hand,
Kalam, Handlee, Yomogi, Gaegu, Klee One, Yuji Syuku, Yuji Mai, Hachi Maru Pop,
Nanum Pen Script, Nanum Brush Script, Hi Melody and Single Day from the official
google/fonts repository.
Each retains its original SIL OFL 1.1 license as `<font>-OFL.txt`; immutable source
URLs, font versions and archive checksums are recorded in
`public/fonts/theme/sources.json`. WOFF2 conversion preserves character coverage;
Caveat is instantiated at its regular 400 weight.

The following public datasets were copied unchanged from the travel site's public/data directory. They are documentation fixtures, not bundled geographic data in the Inkra component package.

## Natural Earth

`src/data/pencil-geography.json`: Natural Earth geographic data, public domain. Original source and transformation metadata are retained in the JSON.

## ESA WorldCover 2021

`src/data/pencil-land-cover.json`: generalized ESA WorldCover 2021 land-cover data, CC BY 4.0. Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium. Original provenance and processing metadata are retained in the JSON; Inkra made no further changes to the copied dataset.

License: https://creativecommons.org/licenses/by/4.0/

Calendar and agenda events are fictional examples. Public map locations do not disclose bookings, itineraries, or user location.

## Feather GitHub Icon

The GitHub outline in `src/components/GitHubLink.tsx` is from Feather v4.29.2,
rendered with Inkra pencil strokes. Source:
https://github.com/feathericons/feather/blob/v4.29.2/icons/github.svg

The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Monaco street demonstration data — OpenStreetMap (ODbL-1.0)

`src/data/street-reference.json` contains a clipped historical OpenStreetMap
excerpt, © OpenStreetMap contributors, available under the Open Database License
1.0: https://www.openstreetmap.org/copyright and
https://opendatacommons.org/licenses/odbl/1-0/ . This data retains its own licence,
separate from the application code.

Source: GraphHopper's `core/files/monaco.osm.gz` at commit
`92dca7ceacdd2f98abe3cacd8c20e08c38324c32`:
https://raw.githubusercontent.com/graphhopper/graphhopper/92dca7ceacdd2f98abe3cacd8c20e08c38324c32/core/files/monaco.osm.gz

The latest object timestamp in that fixture is 2012-07-06. It is a historical
geometry demonstration, not current navigation data. The source archive's SHA-256,
bounding box and processing details are retained in the JSON metadata. Surface
streets and building footprints are clipped and lightly simplified; underground
roads are excluded. No fictional buildings, routes or street geometry are added.

Rebuild using Python with Shapely 2 installed in a separate tools environment:
`python scripts/import-street-reference.py /path/to/monaco.osm.gz`.
The generated JSON is checked in; normal builds and map interaction need neither
Python nor an external data API. The map shows a compact linked OSM credit.
