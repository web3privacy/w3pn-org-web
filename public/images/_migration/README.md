# iterace-1

WebP kandidat vytvoreny z aktualne optimalizovane slozky `all-images`.

Co tato iterace obsahuje:
- stejnou logickou strukturu jako `all-images`
- vsechny raster assety prevedene do `.webp`
- prepsany `manifest.tsv`, ktery uz miri na budouci `.webp` targety v aplikaci
- dokumentaci popisujici, co je potreba zmenit pri navratu do appky

Hlavni slozky:
- `home/` assety hlavni stranky a news cover obrazky
- `about-us/` assety stranky About Us
- `events/` assety events listingu a jednotlivych eventu
- `projects/` assety projects listingu a jednotlivych projektu
- `resources/` assety resources stranky
- `donate/` assety donate stranky
- `site-shared/` assety sdilene napric vice strankami

Velikostni srovnani:
- aktualni optimalizovane `all-images` rastry: `107.79 MB`
- `iterace-1` rastry po WebP migraci: `82.94 MB`
- rozdil oproti dnesnimu stavu: `24.85 MB` (`23.1 %`)
- rozdil oproti uplne puvodni sade pred optimalizaci: priblizne `148.88 MB`

Navrat zpet do aplikace:
- presne mapovani pro tuto iteraci je v `manifest.tsv`
- zde uz nestaci zachovat jen stejnou relativni cestu; je potreba prijmout i novou priponu `.webp`
- SVG a dalsi nerastrove soubory zustavaji beze zmen
- sdilene assety jsou stale schvalne jen na jednom miste, aby se pri upravach nerozjely duplicity

Doporucene vstupni body:
- `optimization-report.md` pro rychly souhrn uspor
- `reimplementation-plan.md` pro poradi navratu do aplikace
- `webp-migration-checklist.md` pro konkretni seznam zmen v appce
