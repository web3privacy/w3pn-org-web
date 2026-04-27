# WebP Migration Checklist

Tento checklist je pro pripad, ze se `iterace-1` stane novym zdrojem assetu pro aplikaci.

1. Zkopiruj assety z `iterace-1` zpet do appky podle `manifest.tsv`.
2. Najdi reference na `.png`, `.jpg` a `.jpeg` v datech i kodu a porovnej je s `iterace-1/manifest.tsv`.
3. U vsech reference-mapped assetu prepis cil na `.webp`.
4. Zkontroluj cesty skladane dynamicky v TS/JS, hlavne tam, kde se pripona sklada jako string.
5. Nech bez zmen SVG a dalsi nerastrove soubory, ty tato iterace nemeni.
6. Spust build a otevri nejdulezitejsi stranky:
   `home`, `about-us`, `events`, `projects`, `resources`, `donate`.
7. U event galerii a article coveru over, ze se nezmenilo ratio, lazy-loading ani placeholder flow.
8. Pokud nekde zustane potreba puvodni pripony kvuli externimu integracnimu bodu, nech ten asset mimo WebP migraci a uprav manifest cilene.

Rychla cisla:
- baseline po prvni optimalizaci: `107.79 MB` rastru
- `iterace-1`: `82.94 MB` rastru
- dalsi uspora proti aktualnimu stavu: `24.85 MB`
