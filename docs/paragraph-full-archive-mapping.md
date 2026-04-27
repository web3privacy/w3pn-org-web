# Paragraph archiv Web3Privacy Now — mapování na eventy a projekty

Tento dokument je **obsahová analýza a návrh mapování** pro validovaný korpus Paragraph článků (profil `@web3privacy-now`, stránky 1–4). **Neobsahuje implementaci** odkazů v aplikaci.

## Validated archive size

- **Očekávaný rozsah:** 47 skutečných článků (validace přes profil, ne přes RSS — RSS vracel jen posledních ~20).
- **Poznámka k tomuto dokumentu:** níže jsou systematicky zpracované **URL z vašeho validovaného seznamu** (bucket A–H). Po deduplikaci překryvů (`building-l2beat-for-privacy-at-ethrome` v B+E; `getting-serious-about-ethereum-privacy` v E+F) jde o **stejný řád velikosti** jako 47; případný rozdíl ±1 řešte proti finální tabulce z profilu.
- **Cíl mapování:** vybrat články s **jasnou** vazbou na `app/data/org/projects/*` nebo `app/data/events/*`; zbytek ponechat jako org-wide / essay / report / ambiguous.

### Konvence cílů

- **Projekt:** `id` z `app/data/org/projects/index.yaml` (např. `privacy-explorer`, `scoring`, `privacy-tech-awards`).
- **Event:** `id` z `app/data/events/index.yaml` (např. `h25ber`, `s23prg`).
- **Org-wide:** žádná jedna entita jako „vlastník“; vhodné pro kvartální reporty a delivery updaty (viz pravidlo 3).

---

## High-confidence project mappings

### Bucket A — Privacy Tech Awards / PrivacyProof (`privacy-tech-awards`)

| Title (odvozeno ze slugu) | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Annual Privacy Tech Poll 2023 (PrivacyProof) | https://paragraph.com/@web3privacy-now/annual-privacy-tech-poll-2023privacyproof | `privacy-tech-awards` | — | **high** | Přímá součást roční awards / PrivacyProof série 2023. |
| Annual Privacy Tech Poll — longlist update | https://paragraph.com/@web3privacy-now/annual-privacy-tech-poll-longlist-update | `privacy-tech-awards` | — | **high** | Longlist update k téže iniciativě. |
| 2023 PrivacyProof — longlist selection announced | https://paragraph.com/@web3privacy-now/2023privacyproof-longlist-selection-announced | `privacy-tech-awards` | — | **high** | Oficiální milník výběru longlistu. |
| 2023 PrivacyProof — finalists announced | https://paragraph.com/@web3privacy-now/2023privacyproof-finalists-announced | `privacy-tech-awards` | — | **high** | Finálová fáze stejného programu. |
| Pro-privacy projects of the year (2023 PrivacyProof) | https://paragraph.com/@web3privacy-now/pro-privacy-projects-of-the-year-2023privacyproof | `privacy-tech-awards` | — | **high** | Kategorie / výsledky v rámci PrivacyProof. |
| Major news & events in ’23 — privacy (2023 PrivacyProof) | https://paragraph.com/@web3privacy-now/major-news-events-in-23-privacy-2023privacyproof | `privacy-tech-awards` | — | **high** | Tematická kategorie awards. |
| Exciting innovation in privacy (2023 PrivacyProof) | https://paragraph.com/@web3privacy-now/exciting-innovation-in-privacy-2023privacyproof | `privacy-tech-awards` | — | **high** | Kategorie innovation v rámci PrivacyProof. |
| Doxxer of the year (2023 PrivacyProof) | https://paragraph.com/@web3privacy-now/doxxer-of-the-year-2023privacyproof | `privacy-tech-awards` | — | **high** | Kategorie „doxxer“ v rámci PrivacyProof. |
| PrivacyProof Awards ’24 — projects category longlist | https://paragraph.com/@web3privacy-now/privacy-proof-awards-24-projects-category-longlist | `privacy-tech-awards` | — | **high** | Longlist 2024 — projekty. |
| PrivacyProof Awards ’24 — innovation category longlist | https://paragraph.com/@web3privacy-now/privacy-proof-awards-24-innovation-category-longlist | `privacy-tech-awards` | — | **high** | Longlist 2024 — innovation. |
| PrivacyProof Awards ’24 — doxxer category longlist | https://paragraph.com/@web3privacy-now/privacy-proof-awards-24-doxxer-category-longlist | `privacy-tech-awards` | — | **high** | Longlist 2024 — doxxer. |
| PrivacyProof Awards ’24 — news & events category longlist | https://paragraph.com/@web3privacy-now/privacy-proof-awards-24-news-events-category-longlist | `privacy-tech-awards` | — | **high** | Longlist 2024 — news/events. |
| PrivacyProof 2024 — projects category winners | https://paragraph.com/@web3privacy-now/privacyproof-2024-awards-projects-category-winners | `privacy-tech-awards` | — | **high** | Winner announcement — projekty. |
| PrivacyProof 2024 — exciting innovation category winners | https://paragraph.com/@web3privacy-now/privacyproof-2024-awards-exciting-innovation-category-winners | `privacy-tech-awards` | — | **high** | Winner announcement — innovation. |
| PrivacyProof 2024 — news & events category winners | https://paragraph.com/@web3privacy-now/privacyproof-2024-awards-news-events-category-winners | `privacy-tech-awards` | — | **high** | Winner announcement — news/events. |
| PrivacyProof 2024 — doxxer category winners | https://paragraph.com/@web3privacy-now/privacyproof-2024-awards-doxxer-category-winners | `privacy-tech-awards` | — | **high** | Winner announcement — doxxer. |

### Bucket B — Privacy Explorer + scoring (split primary)

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Add your privacy project to Explorer | https://paragraph.com/@web3privacy-now/add-your-privacy-project-to-explorer | `privacy-explorer` | `scoring` (jen pokud text zmiňuje hodnocení) | **high** | Onboarding do Exploreru — primárně produktový tok Exploreru. |
| Add a project to Explorer — how to | https://paragraph.com/@web3privacy-now/add-a-project-to-explorer-how-to | `privacy-explorer` | — | **high** | Návody patří pod Explorer jako kanál distribuce. |
| Edit your project on Explorer — how to | https://paragraph.com/@web3privacy-now/edit-your-project-on-explorer-how-to | `privacy-explorer` | — | **high** | Editor flow Exploreru. |
| Explorer scoring mechanism breakdown | https://paragraph.com/@web3privacy-now/explorer-scoring-mechanism-breakdown | `scoring` | `privacy-explorer` | **high** | Metodika skóringu v kontextu Exploreru — dle pravidla 2 primárně scoring. |
| Building „L2beat for privacy“ at ETHRome | https://paragraph.com/@web3privacy-now/building-l2beat-for-privacy-at-ethrome | `privacy-explorer` | `scoring`, event `m24rom` (viz níže) | **high** / **medium** (event) | Silná vazba na Explorer narrative; eventová vazba jen pokud text explicitně vázaný na konkrétní ETHRome iteraci (v datasetu nejbližší `m24rom` 2024-10-03, nebo obecně „ETHRome“ bez ID). |
| From scoring model to interfaces (Web3Privacy Now) | https://paragraph.com/@web3privacy-now/from-scoring-model-to-interfaces-web3privacy-now | `scoring` | `privacy-explorer` | **high** | Produktová evoluce ze skóringu k UI — dual relevance. |
| Making Web3 privacy assessment research public (feedback) | https://paragraph.com/@web3privacy-now/making-web3-privacy-assessment-research-public-feedback | `scoring` | `privacy-explorer`, `privacy-ecosystem-report` | **medium** | Research + feedback loop; pokud jde čistě o metodiku, zvednout `scoring` na high. |
| Privacy services scoring model — part 1 | https://paragraph.com/@web3privacy-now/privacy-services-scoring-model-part-1 | `scoring` | `privacy-explorer` | **high** | Explicitně scoring model série. |
| Privacy services scoring model for non-techies (playbook) | https://paragraph.com/@web3privacy-now/privacy-services-scoring-model-for-non-techies-playbook | `scoring` | `academy` | **high** | Metodika + edukační playbook — sekundárně Academy. |

### Bucket C — Academy / Publishing / Privacy Guides

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Unlocking privacy for all — W3PN Academy launches today | https://paragraph.com/@web3privacy-now/unlocking-privacy-for-all-w3pn-academy-launches-today | `academy` | `publishing` | **high** | Launch Academy — primárně projekt `academy`. |
| Privacy as freedom of behavior | https://paragraph.com/@web3privacy-now/privacy-as-freedom-of-behavior | `publishing` | `academy` | **high** | Filozofický / movement text — dle pravidla 4 primárně `publishing`. |
| Rethinking freedom in the digital age — the rise of the carepunks | https://paragraph.com/@web3privacy-now/rethinking-freedom-in-the-digital-age-the-rise-of-the-carepunks | `publishing` | `academy` | **high** | Kulturně-teoretický essay rámec. |
| Cypherpunks 2.0 / 3.0 / 4.0 — beginning of a new era | https://paragraph.com/@web3privacy-now/cypherpunks-2-0-3-0-4-0-the-beginning-of-a-new-era | `publishing` | `academy` | **high** | Manifestová linie / movement narrative. |
| A 5-step guide to make Ethereum and crypto cypherpunk again | https://paragraph.com/@web3privacy-now/a-5-step-guide-to-make-ethereum-and-crypto-cypherpunk-again | `academy` | `publishing`, `hackathon-pack` | **medium** | Edukativní guide — primary `academy`; pokud je to spíš manifest, zvážit swap s `publishing` po přečtení úvodu. |
| Make cypherpunk — one Ethereum block at a time | https://paragraph.com/@web3privacy-now/make-cypherpunk-one-ethereum-block-at-a-time | `publishing` | `academy` | **medium** | Slogan/essay vs návod — bez textu držet medium a rozhodnout ručně. |
| Zero knowledge for everyone — as easy as ABC | https://paragraph.com/@web3privacy-now/zero-knowledge-for-everyone-as-abc | `academy` | — | **high** | Explainer typu „edukace široké publikum“. |
| The EU’s GDPR update could kill public blockchains (unless we act now) | https://paragraph.com/@web3privacy-now/the-eu-s-gdpr-update-could-kill-public-blockchains-unless-we-act-now | `privacy-guides` | `publishing` | **high** | Policy / práva / regulatorický framing — primary `privacy-guides` dle pravidla C. |

### Bucket D — Drips / funding / newsletter

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Drips for Privacy — give back to privacy projects | https://paragraph.com/@web3privacy-now/drips-for-privacy-give-back-to-privacy-projects | `drips-for-privacy` | `gitcoin-privacy-round` | **high** | Launch / popis Drips streamu. |
| Can privacy be a public good and still survive? | https://paragraph.com/@web3privacy-now/can-privacy-be-a-public-good-and-still-survive | `drips-for-privacy` | `gitcoin-privacy-round`, `publishing` | **medium** | Funding / public goods diskurz — často multi-owner; secondary Gitcoin pokud text explicitně zmiňuje QF roundy. |
| Week in the Privacy News (Feb 5–11) | https://paragraph.com/@web3privacy-now/week-in-the-privacy-news-feb-5-11 | `newsletter` | — | **high** | Formát přímo odpovídá projektu Newsletter. |

### Bucket E — Hackathon / builder methodology

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Cypherpunk hacker class 2.0 | https://paragraph.com/@web3privacy-now/cypherpunk-hacker-class-2-0 | `hackathon-pack` | `ethereum-privacy-hackathon-overview`, `publishing` | **high** | Builder metodologie — primary Builder Pack. |
| Building „L2beat for privacy“ at ETHRome | https://paragraph.com/@web3privacy-now/building-l2beat-for-privacy-at-ethrome | *(viz B)* | `hackathon-pack` | **medium** | Metodický „build story“ může sekundárně sedět na hackathon pack; primary zůstává Explorer/scoring dle obsahu. |
| Getting serious about Ethereum privacy | https://paragraph.com/@web3privacy-now/getting-serious-about-ethereum-privacy | **event `h25ber`** (preferované pro explicitní mapování) | `hackathon-pack`, `ethereum-privacy-hackathon-overview`, `privacy-explorer` | **high** (event, pokud text opravdu reflektuje Berlin hackathon 2025) | Podle vašeho zadání: **primary `h25ber`**; zároveň obsahově souvisí s hackathon / privacy building tématy — secondaries dávají smysl pro čtenáře mimo jeden den akce. |

---

## High-confidence event mappings (opatrné / ověřené proti YAML)

### `getting-serious-about-ethereum-privacy` → `h25ber`

- V `app/data/events/index.yaml` existuje **`h25ber`**: hackathon, Berlin, **2025-06-13**, BBW, `page: https://web3privacy.info/event/h25ber/`.
- **Primary:** `h25ber` — **high**, pokud Paragraph text explicitně vychází z této akce (Vitalik / hackathon kontext dle vašeho interního ověření).
- **Secondary:** `hackathon-pack`, `ethereum-privacy-hackathon-overview`.

### `web3privacy-now-rome-meetup-2-community-1st` → řím podzim 2023

- V datasetu pro **Řím + říjen 2023 + ETHRome** odpovídá **`s23rom`**: typ `summit`, datum **2023-10-05**, `coincidence: ETHRome`, `page: https://web3privacy.info/event/s23rom/`.
- **Primary candidate:** `s23rom` — **medium** (ne high): slug říká „meetup 2“, v datech je to **summit**, ne samostatný meetup záznam; může jít o komunikační název série.
- **Není v datasetu:** samostatný event „rome meetup #2“ mimo `s23rom` — pokud článek popisuje jinou malou akci, zvažte **org-wide** + ruční poznámka.
- **Nekandidovat:** `m24rom` (2024-10-03) — špatný rok pro „říjen 2023“.

### `web3privacy-now-ecosystem-launch` → Praha červen 2023 (korekce oproti `m23prg` / `m25prg`)

- **`m25prg`** v YAML je **2025-05-29** Praha — **nesedí** na červen 2023.
- **`m23prg`** je **2023-11-14** Praha (DCxPrague) — **nesedí** na červen 2023.
- **`s23prg`** je **2023-06-05** Praha, `coincidence: ETHPrague` — **nejlepší časová a geografická shoda** s „ecosystem launch v Praze v červnu 2023“.
- **Primary candidate:** `s23prg` — **medium až high** podle toho, jestli článek mluví o summit programu / ETHPrague týdnu vs obecném „launch“ bez akce.
- **Alternativa (org-wide):** pokud jde o multi-program „birth of ecosystem“ bez vazby na konkrétní stage day, držet **org-wide** + odkazy na více projektů z textu.

---

## Multi-owner org-wide reports (bucket G)

**Pravidlo:** kvartální reporty a delivery updaty **nepřiřazovat** jako primary jedné entitě; modelovat jako **org-wide** a případně **shared inventory** s tagy / many-to-many odkazy.

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Delivery update Q4’23 | https://paragraph.com/@web3privacy-now/delivery-update-q423 | **org-wide** | *(odkazy podle obsahu)* | **high** | Horizontální delivery across initiatives. |
| Community update Q1’24 | https://paragraph.com/@web3privacy-now/community-update-q1-24 | **org-wide** | — | **high** | Quarterly community wrap. |
| Q2 delivery update | https://paragraph.com/@web3privacy-now/q2-delivery-update | **org-wide** | — | **high** | Delivery update — multi-owner default. |
| Q3 delivery report | https://paragraph.com/@web3privacy-now/q3-delivery-report | **org-wide** | — | **high** | Totéž. |
| Web3Privacy Q1 2025 report | https://paragraph.com/@web3privacy-now/web3privacy-q1-2025-report | **org-wide** | `annual-report` *(jen pokud je to annual research line, ne operations report)* | **medium** | Název „report“ může křížit research annual report — ověřit obsah. |
| Q2 report is here | https://paragraph.com/@web3privacy-now/q2-report-is-here | **org-wide** | — | **high** | Obecný quarterly report. |
| Community feedback on our work | https://paragraph.com/@web3privacy-now/community-feedback-on-our-work | **org-wide** | — | **high** | Meta / community process, ne jeden projekt. |

### Explicitní výskyty eventů a projektů u reportů (bez nového crawl Paragraphu)

V této fázi **neextrahujeme** konkrétní zmínky entit z fulltextu (nebyl spuštěn ingest článků). Doporučený postup pro implementaci:

1. **Fáze 1 (ručně / levně):** u každého reportu vytvořit v CMS YAML pole `mentions: [project-id…]` a `mentions_events: [event-id…]` podle skutečného textu.
2. **Fáze 2 (automatizace):** jednorázově stáhnout Paragraph export / HTML a extrahovat entity string matching proti `index.yaml` id.

**Doporučení k modelu:** reporty držet jako **org-wide** v navigaci, ale v datech povolit **`related_projects[]` a `related_events[]`** (0..N) — žádná položka není „primary owner“, jen cross-reference.

---

## Ambiguous cases requiring manual decision

| Issue | Články / oblast | Co rozhodnout |
| --- | --- | --- |
| Meetup vs summit v Římě 2023 | `web3privacy-now-rome-meetup-2-community-1st` | Je to komunikace kolem **`s23rom`** (summit), nebo samostatná community akce mimo dataset? | ano je to summit
| Pražský „ecosystem launch“ červen 2023 | `web3privacy-now-ecosystem-launch` | Potvrdit vazbu na **`s23prg`** vs čistě org-wide launch post. | ano potvrzuji
| „Make cypherpunk one block…“ | slug výše | `publishing` vs `academy` — záleží na tónu (essay vs tutorial). | ano, pridat do akademii
| „Getting serious…“ | slug výše | Pokud text není o `h25ber` ale obecný manifest, **snížit** event confidence a dát primary `hackathon-pack` nebo org-wide. | ano pridat do hackathonu
| „Can privacy be a public good…“ | slug výše | Silně multi-topic — držet `drips-for-privacy` jen pokud text primárně prodává Drips; jinak org-wide + secondaries. | ano pridat do drips
| **Low priority / unclear** | `your-time-to-shine-light-on-privacy` | **Nepřiřazovat** bez ověření textu — zapsáno níže. | neprirazovat 

### Low priority / unclear (bucket H)

| Title | URL | Primary | Secondary | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- |
| Your time to shine (light on privacy) | https://paragraph.com/@web3privacy-now/your-time-to-shine-light-on-privacy | **ambiguous / none** | `privacy-tech-awards` nebo org-wide CTA | **low** | Bez textu nelze rozlišit awards vs obecnou community výzvu — **neimplementovat** pevné vazby. | neprrazovat 

---

## Doporučený content model (pro pozdější implementaci referencí)

### A) Jen current event/project article refs

- **Plus:** jednoduchá data vrstva, málo edge cases.
- **Minus:** multi-owner články (reporty, funding essays) se rozbijí nebo se špatně vybírají.

### B) Shared article inventory + reference z projektů/eventů

- **Plus:** jeden kanonický záznam na článek; many-to-many vazby (`article.related_entities[]`).
- **Minus:** potřeba centrálního indexu a UI patternu „články“.

### C) Jen org-wide content bucket

- **Plus:** čisté pro reporty.
- **Minus:** slabá discoverability z konkrétních projektů (Explorer, Awards).

### Doporučení (soulad s vaším očekáváním)

**Nejlepší kombinace: B + C + reference.**

- **Shared inventory** (`articles[]` nebo externí `paragraph_articles.yaml`) s poli: `id`, `url`, `title`, `kind` (`project_update` \| `event_recap` \| `essay` \| `report` \| `ambiguous`), `primary_owner` (optional), `related_projects[]`, `related_events[]`, `confidence`.
- **Org-wide bucket** pro reporty a meta update (`kind: report`), defaultně bez `primary_owner`.
- **Na stranách projektů/eventů** jen **kurátorované odkazy** (`featured_article_ids[]` nebo `links.paragraph[]`) směřující do inventáře — žádné duplikování metadat.

Tím splníte pravidla 1–3: event dostane článek jen při silné vazbě; reporty zůstanou org-wide s optional `mentions`.

---

## Stručné shrnutí pro implementátora

1. **`privacy-tech-awards`:** celý bucket A je **high** a bezpečný jako project-primary.
2. **Explorer vs scoring:** bucket B rozdělit podle tabulky; `explorer-scoring-mechanism-breakdown` a scoring série → primary **`scoring`**.
3. **Akademie / publishing / guides:** bucket C podle tabulky; GDPR článek → **`privacy-guides`**.
4. **Funding / newsletter:** bucket D dle tabulky.
5. **Hackathon obsah:** `cypherpunk-hacker-class-2-0` → **`hackathon-pack`**; `getting-serious…` → **`h25ber`** pokud obsah potvrdí.
6. **Eventové opravy proti YAML:** Řím říjen 2023 → spíš **`s23rom`** než `m24rom`; Praha červen 2023 → spíš **`s23prg`**, ne `m23prg` ani `m25prg`.
7. **Reporty (G):** vždy **org-wide** + optional `mentions_*` po ručním / ingest review.
8. **Nejasný článek (H):** držet mimo automatiku do ručního rozhodnut - rozhodnuti jsou napsana v tomto dokumentu na radich s otazkama

dulezite je zavest tyto clanky do konkretnich projektu, neni potreba delat centralizovany registr, uz mame administraci, kde pripadne clanek priradime znovu - takze jde v podstate o vyplnovani
nezapomen, ze pri tvorbe a integraci techto clanku na ruzne detaily bude potreba udelat omezeni na zobrazeni clanku najednou - musi tam byt tlacitko "zobrazit vsechny clanky" (anglicky) ..na desktopu treba staci 4 clanky, na tabletu taky, na mobilu treba jen 3 

davej pozor at nerozbijes soucasnou strukturu a poamatuj na to, ze uz mame i generor nahledu pri pridavani clanku, tak ho vyuzit a pro kazdy clanek zkus vygenerovat nahled

---

*Poslední aktualizace datové sady: ověřeno proti `app/data/events/index.yaml` a `app/data/org/projects/index.yaml` v repozitáři.*
