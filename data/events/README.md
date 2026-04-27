# Events data

Data sekce Events portálu. Schéma je 1:1 kompatibilní s [web3privacy/data events](https://github.com/web3privacy/data/blob/main/src/events/index.yaml).

## Soubory

- **index.yaml** – hlavní seznam eventů (kopie + rozšíření z web3privacy)
- **events-user.yaml** – volitelné uživatelské / lokální úpravy (merge s index.yaml v další fázi)

## Schéma položky (Event)

- **id** (string) – jednoznačný identifikátor
- **type** (string) – typ: `congress` | `summit` | `meetup` | `collab` | `rave` | `hackathon` | `privacycorner`
- **date** (string) – datum ve formátu YYYY-MM-DD
- **days** (number, volitelné) – počet dní (např. u privacycorner)
- **city**, **country** (string) – město, kód země (ISO 3166-1 alpha-2)
- **place**, **place-address** (volitelné)
- **confirmed** (boolean, volitelné)
- **coincidence** (string, volitelné) – např. „Devcon“, „ETHPrague“
- **lead** (string)
- **links** (object, volitelné) – `rsvp`, `web`
- **speakers** (string[], volitelné)
- **helpers** (string[], volitelné)
- **optional** (boolean, volitelné)
- **design** (object, volitelné) – `image`: název legacy souboru (řeší se na `/images/events/legacy/<image>.webp`), absolutní `/images/...` cesta nebo plná URL (http/https)
- **premium** (boolean, volitelné) – zobrazení jako zvýrazněná karta s vlastním pozadím

## Editace

Data v této složce jsou připravena na budoucí editaci (admin / formuláře). Prozatím se načítají pouze z `index.yaml`.
