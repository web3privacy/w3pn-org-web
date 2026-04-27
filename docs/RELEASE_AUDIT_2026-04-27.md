# Release Audit – 2026-04-27

Audit pred verejnym nasazenim webu `w3pn-org-web-pt3000`.

## Co bylo overeno

- produkcni build (`npm run build`) – prochazi
- smoke-check verejnych routek – hlavni stranky vraci `200`
- browser check adminu:
  - login funguje
  - dashboard se nacte
  - homepage/about/donate/resources editory se nactou
  - projects/events seznamy a detail editory se nactou
- kontrola metadat, `robots.txt`, `sitemap.xml`, manifestu a share image
- code review admin autentizace, uploadu, newsletteru a zapisovacich API
- `npm audit --omit=dev`
- `npm run lint` – uz funguje jako prikaz, ale odhaluje existujici chyby v kodu

## Co bylo v teto fazi opraveno

### SEO a sdileni

- doplnen globalni metadata helper pro canonical, OG a Twitter cards
- doplnen `metadataBase` a globalni JSON-LD pro `Organization` + `WebSite`
- doplnen `robots.txt`
- doplnen `sitemap.xml`
- doplnen `manifest.webmanifest`
- doplnen share asset:
  - `public/share/homepage-share.png`
- doplnen jednoduche app icon:
  - `src/app/icon.svg`
- upraveny metadata title/canonical pro hlavni verejne stranky a detail routy

### Bezpecnost a indexace

- pridany security headers:
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Permissions-Policy`
- admin routy a admin API maji navic:
  - `Cache-Control: no-store`
  - `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
- pridana best-effort ochrana proti cross-site mutacim pro zapisovaci endpointy
- vsechny `target="_blank"` odkazy byly ztvrzeny na `rel="noopener noreferrer"`

### Repo a provoz

- doplnen `.env.example`
- doplnen ESLint 9 flat config
- `npm run lint` uz nepada na zastaraly `next lint`, ale spousti realny lint
- prepsano `README.md`, aby mapovalo:
  - routy
  - data source of truth
  - admin editory
  - upload folders
  - minimalni pole pro events a projects
  - produkcni limity

## Soucasny stav podle checklistu

| Oblast | Stav | Poznamka |
|---|---|---|
| Produkcni build | ✅ | `npm run build` prochazi |
| Verejne routy | ✅ | smoke test hlavnich stranek OK |
| Canonical metadata | ✅ | doplneno |
| Open Graph / Twitter cards | ✅ | doplneno |
| Share image | ✅ | homepage share image doplnen |
| `robots.txt` | ✅ | doplnen |
| `sitemap.xml` | ✅ | doplnen |
| Web manifest / icon | ✅ | doplneno |
| Admin login flow | ✅ | browser test OK |
| Admin indexace blokovana | ✅ | `X-Robots-Tag` + noindex metadata |
| Security headers | ✅ | zakladni sada doplnena |
| Cross-site mutace | ✅ | best-effort origin/referer kontrola doplnena |
| Upload validation | ✅ | uz pred auditem bylo dobre osetrene |
| Lint command | ⚠️ | prikaz funguje, ale kod ma chyby |
| ESLint clean | ❌ | aktualne mnoho realnych chyb a warningu |
| Produkcni admin na read-only hostingu | ❌ | nebude persistovat |
| Newsletter signup na read-only hostingu | ❌ | vraci `503` zamerne |
| Multi-instance rate limiting | ⚠️ | jen in-memory, ne sdileny store |
| Docs zavislost na GitHub raw | ⚠️ | cast docs se nacita vzdaleně |
| Automatizovane e2e testy | ❌ | chybi |

## Hlavni zbyvajici rizika pred public release

### 1. Admin neni vhodny pro serverless/read-only deploy

Nejvetsi architektonicky blocker.

- Web je navrzeny jako filesystem-backed CMS.
- Na Vercelu nebo jinem read-only hostingu admin sice lze zobrazit, ale zapis je blokovany.
- Pokud chcete verejny deploy s funkcni editaci, potrebujete:
  - VPS / server s persistentnim diskem
  - nebo prerobit storage vrstvu na DB / object storage / git-based workflow

### 2. Newsletter subscribe nebude fungovat na read-only deployi

Endpoint:

- `/api/org/mailing-list/subscribe`

se pri `IS_VERCEL_READONLY` zamerne vypina, protoze zapisuje do:

- `data/org/mailing-list.json`

### 3. `npm run lint` odhaluje realny release debt

Lint uz je funkcni, ale aktualni kod ma velky pocet problemu:

- poruseni React hooks pravidel
- synchronni `setState` uvnitr `useEffect`
- prace s refs behem renderu
- mnozstvi `no-img-element` warningu

To nejsou kosmeticke warningy. Cast z nich muze znamenat:

- potencialne nestabilni chovani komponent
- horsi vykon
- problematicke budoucni upgrady React Compiler / Next

Pred verejnym releasem doporucuju alespon odstranit:

- vsechny `react-hooks/rules-of-hooks`
- vsechny `react-hooks/set-state-in-effect`
- vsechny `react-hooks/refs`

### 4. Rate limiting je jen lokalni v pameti procesu

Plati pro:

- admin login rate limit
- newsletter subscribe rate limit

Na jednom procesu je to lepsi nez nic. Na vice instancich se limity nesdili.

Pokud web pobezi za load balancerem nebo v autoscalingu, pouzit:

- Redis / Upstash / KV store

### 5. Docs route je castecne zavisla na vzdalenem GitHubu

`/docs/[...slug]` umi nacitat cast obsahu z:

- `raw.githubusercontent.com`

Je tam lokalni fallback, ale i tak to zvysuje:

- latenci
- dalsi bod selhani
- zavislost na externi sluzbe pro runtime render

Pro stabilni public release je lepsi:

- build-time sync docs do repa
- nebo full local mirror vsech docs pages

### 6. `npm audit` hlasi stredni zavislostni problem

Lokalni audit hlasi:

- `postcss` XSS advisory `GHSA-qx2v-qp2m-jg93`
- ve vetvi, kterou si s sebou nese `next`

Aktualni stav v repu:

- `@tailwindcss/postcss` -> `postcss@8.5.10`
- `next@16.2.4` -> bundled `postcss@8.4.31`

Doporuceni:

- pri releasu zkontrolovat, jestli existuje patch release Next.js, ktery bundluje opravene `postcss`
- pokud ano, aktualizovat `next`

## Doporuceni pred verejnym spustenim

### Minimum, ktere bych udelala jeste pred launch

1. Rozhodnout hosting model:
   - read-only deploy bez produkcni editace
   - nebo writable server s funkcni editaci
2. Opravit kriticke lint chyby kolem hooks/effectu.
3. Rozhodnout, jak chcete resit newsletter:
   - nechat vypnute na read-only
   - nebo presunout subscribery do DB / email provider API
4. Omezit runtime zavislost docs na GitHubu.
5. Otestovat realne produkcni env promenne:
   - `NEXT_PUBLIC_SITE_URL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `NEXT_PUBLIC_ALLOWED_NEWSLETTER_ACTION_HOSTS`

### Co bych doporucila hned potom

1. Pridat monitoring a error tracking.
2. Pridat automatizovany smoke test pro:
   - homepage
   - `/about`
   - `/events`
   - `/projects`
   - admin login
3. Pridat externi shared rate limiting store.
4. Doresit dlouhodobe image optimization pres `next/image` jen tam, kde to neprerusi design.
5. Zkontrolovat finalni produkcni Search Console setup:
   - domena
   - sitemap submit
   - indexing status

## Poznamka k Google "rozcestnikum" / sitelinks

Google sitelinks nejdou vynutit rucne. Podle Google Search Central jsou algoritmicke.

Co jim pomaha:

- cista informace architektura
- konzistentni titles a canonical URL
- dobre interní prolinkovani
- sitemap
- breadcrumbs / structured data tam, kde dava smysl

V tomto auditu byly doplneny technicke zaklady, ktere pravdepodobnost sitelinks zvedaji, ale **garance zobrazeni neexistuje**.

## Pouzite referencni zdroje

- Google Search Essentials:
  - <https://developers.google.com/search/docs/essentials>
- Google sitelinks:
  - <https://developers.google.com/search/docs/appearance/sitelinks>
- Google breadcrumb structured data:
  - <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb>
- Google organization structured data:
  - <https://developers.google.com/search/docs/appearance/structured-data/logo>
- Next.js metadata and OG images:
  - <https://nextjs.org/docs/app/getting-started/metadata-and-og-images>
- Next.js sitemap metadata route:
  - <https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap>
- OWASP HTTP security headers:
  - <https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html>
- OWASP file upload:
  - <https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html>
- OWASP CSRF prevention:
  - <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
