# Reimplementation Plan

Tento plan plati pro `iterace-1`, tedy pro variantu, kde se raster assety vraci do aplikace uz jako `.webp`.

1. Pri navratu pouzij `manifest.tsv` z `iterace-1`: kazdy radek uz mapuje WebP export na budouci WebP target v aplikaci.
2. Nejdriv vrat soubory podle manifestu do `public/`, ale nepovazuj to za hotove bez upravy referenci na nove pripony.
3. U eventu vrat hlavne `events/items/<eventId>/...` do `public/events/` nebo `public/org/gallery/events/...` podle manifestu.
4. U projektu vrat `projects/items/<projectId>/...` do `public/org/assets/projects/**` nebo jinych puvodnich cest podle manifestu.
5. Sdilene profily, partneri a obecne assety vracej jen jednou ze `site-shared/`, protoze je casto pouziva vice stranek najednou.
6. U vsech mist, kde aplikace explicitne referencuje `.png`, `.jpg` nebo `.jpeg`, prepis reference na `.webp`.
7. Variants jako `--thumb.webp` a `--preview.webp` uz byly ve WebP i pred touto iteraci; hlavni rozdil je u puvodnich bitmap, ktere menily priponu.
8. SVG a dalsi nerastrove soubory zustavaji beze zmen, takze tam neni potreba delat zadnou migraci.
9. Po zpetnem zahrnuti assetu spust build a vizualni smoke test nad hlavni strankou, about, events, projects a resources.

Co je potreba zapracovat v appce:
- reference v YAML datech, pokud nekde pracuji s explicitni priponou souboru
- reference v React/TS kodu, pokud nekde skladaji cestu jako string
- pripadne pomocne skripty, ktere se opiraji o puvodni raster extension

Poznamka: route `/privacy-portal` dnes prebira vizualy z projektu `privacy-portal`, takze jeho assety jsou pod `projects/items/privacy-portal/`.
