# Analýza: Project Detail vs administrace (org web)

## Zdroj dat

- **Runtime:** aplikace načítá přímo z `data/org/projects/index.yaml` a `data/org/projects/details/*.yaml`.
- **YAML zdroj:** `data/org/projects/index.yaml` + `data/org/projects/details/*.yaml`.
- **Admin API:** PUT `/api/org/projects` a PUT `/api/org/projects/[id]/details` zapisují přímo do YAML.

Pro konzistenci se zbytkem webu (events a další YAML data v `data/`) je vhodné:
- mít admin ukládání i runtime na YAML jako single source of truth,
- a JSON generovat jen jako export, pokud ho některý downstream workflow ještě potřebuje.

---

## Sekce na stránce Project Detail vs administrace

| Sekce na stránce | Zdroj dat | V adminu editovatelné? | Poznámka |
|------------------|-----------|-------------------------|----------|
| **Hero** | `detail.hero` (title, tagline, ctaLabel, ctaHref, logo, metrics) | ✅ Ano – „Hero & Metrics“ | OK |
| **Highlights (metriky)** | `hero.metrics` | ✅ Ano – v rámci Hero | OK |
| **Mission** | `detail.mission` (text, readMoreHref) | ✅ Ano – „Mission“ | OK |
| **Links** | `detail.links` | ✅ Ano – „Links“ | OK |
| **Mission highlights** (malé obrázky v bloku Mission) | `mission.highlights` | ✅ Ano – sekce „Screenshots“ v adminu ale **ukládá do `mission.highlights`** | Název sekce v adminu je matoucí (viz níže) |
| **Screenshots** (velká sekce s mřížkou) | `detail.screenshots` | ❌ **Ne** | Admin nemá pole pro `detail.screenshots`; pouze raw JSON. |
| **Features** | `detail.features` | ✅ Ano – „Features“ | OK |
| **Articles** | `detail.articles`, `detail.articlesHrefAll` | ✅ Ano – „Articles“ | OK |
| **Roadmap** | `detail.roadmap`, `detail.roadmapPagination` | Částečně | Položky roadmap (quarter, title, description, readMoreHref, completed) ano. Chybí: **roadmapPagination** (current, total). Komponenta ještě podporuje `phase`, `release`, `items[]` – v adminu nejsou. |
| **Testimonials** | `detail.testimonials`, `detail.testimonialsReadMoreHref` | ✅ Ano – „Testimonials“ | OK |
| **Contribute** | `detail.contribute` (text, links[], ctaLabel, ctaHref) | ❌ **Ne** | Pouze přes raw „JSON“. |
| **Feedback** | `detail.feedback` (email, subjectPrefix) | ✅ Ano – „Feedback“ | OK |
| **Team** | `detail.team` | ✅ Ano – „Team“ | OK |
| **Partners** | `detail.partners` | ✅ Ano – „Partners“ | OK |
| **Donate** | `detail.donate` | ❌ Není na stránce | Komponenta `ProjectDetailDonate` existuje, ale v `page.tsx` se nevykresluje. |
| **Footer** | `detail.footer` | ❌ Není na stránce | Komponenta `ProjectDetailFooter` existuje, ale v `page.tsx` se nevykresluje. |

---

## Hlavní nesrovnalosti

### 1. Screenshots vs mission.highlights

- **Stránka:** velká sekce „Screenshots“ bere **`detail.screenshots`** (`ProjectDetailScreenshots`).
- **Admin:** záložka „Screenshots“ ukládá do **`mission.highlights`** (malé obrázky vedle Mission textu v `ProjectDetailMissionLinks`).
- **Důsledek:** obsah velké sekce Screenshots **nelze v adminu editovat** (jen přes JSON). Data z „Screenshots“ v adminu se zobrazují jen v bloku Mission/Links jako highlights.

**Doporučení:**  
- Buď přidat v adminu samostatnou sekci pro **`detail.screenshots`** (např. „Screenshots (main grid)“) a stávající přejmenovat na „Mission highlights“.  
- Nebo sjednotit zdroj: velkou sekci Screenshots krmit z `mission.highlights` (a v adminu jen upravit popisky), pak není potřeba `detail.screenshots`.

### 2. Contribute

- Sekce **Contribute** na stránce používá `detail.contribute` (text, links, ctaLabel, ctaHref).
- V adminu chybí záložka „Contribute“ – editace jen přes raw JSON.

**Doporučení:** přidat do adminu sekci **Contribute** (text, seznam odkazů s label/href, ctaLabel, ctaHref).

### 3. Roadmap – roadmapPagination a další pole

- `ProjectDetailRoadmap` používá `roadmapPagination` (current, total) a u položek i `phase`, `release`, `items[]`.
- V adminu jsou jen položky s quarter/title/description/readMoreHref/completed; **roadmapPagination** chybí a **phase/release/items** taky.

**Doporučení:**  
- Přidat do sekce Roadmap pole pro **roadmapPagination** (current, total).  
- Volitelně rozšířit položky o **phase**, **release**, **items** (seznam řetězců), aby YAML/JSON a admin byly 1:1 s komponentou.

### 4. YAML jako zdroj po editaci v adminu

- Admin ukládá přímo do **YAML** (`data/org/projects/index.yaml` a `data/org/projects/details/*.yaml`).
- Staré JSON mirrory už do aktivního workflow nepatří; repo má držet YAML jako jediný source of truth.

**Doporučení:**  
- Udržovat YAML jako jediný source of truth.  
- Pokud někdy bude potřeba downstream JSON export, generovat ho až sekundárně z YAML, ne obráceně.

---

## Plán úprav (prioritně)

1. **Screenshots**
   - Rozhodnout: buď přidat `detail.screenshots` do adminu (nová sekce „Screenshots (main)“), nebo sjednotit zobrazení na `mission.highlights`.
   - V adminu přejmenovat nebo doplnit sekce tak, aby bylo jasné, co se kde ukládá („Mission highlights“ vs „Screenshots“).

2. **Contribute**
   - Přidat záložku **Contribute** v `ProjectAdminEditor`: text, opakující se bloky link (label, href, volitelně icon), ctaLabel, ctaHref.

3. **Roadmap**
   - Přidat **roadmapPagination** (current, total) do sekce Roadmap v adminu.
   - Volitelně přidat u položek pole **phase**, **release**, **items** (např. textarea s odrážkami nebo dynamický seznam).

4. **Držet YAML jako jediný zdroj pravdy**
   - Admin i runtime už mají číst a zapisovat jen YAML.
   - Pokud bude potřeba export do JSON pro jiné workflow, generovat ho až následně z YAML.

5. **Donate / Footer** (nízká priorita)
   - Pokud se v budoucnu bude na stránce používat `ProjectDetailDonate` nebo `ProjectDetailFooter`, doplnit do `page.tsx` jejich vykreslení z `detail.donate` / `detail.footer` a v adminu přidat odpovídající sekce.

Po těchto úpravách bude možné editovat v administraci vše, co project detail z YAML/JSON používá, v souladu s tím, jak je zvykem na zbytku webu (YAML/JSON jako jediný zdroj pravdy).
