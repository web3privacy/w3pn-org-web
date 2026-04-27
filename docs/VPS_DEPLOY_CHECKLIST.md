# VPS Deploy Checklist

This checklist covers the two persistence layers this project needs on a VPS:

- writable admin data outside the release directory
- uploaded image folders that still remain reachable under `public/images/**`

## 1. Create persistent directories

Recommended shared paths:

```bash
sudo mkdir -p /var/lib/w3pn-data
sudo mkdir -p /var/lib/w3pn-uploads/images/admin-uploads
sudo mkdir -p /var/lib/w3pn-uploads/images/site-shared/admin-uploads
sudo mkdir -p /var/lib/w3pn-uploads/images/projects/uploads
sudo mkdir -p /var/lib/w3pn-uploads/images/donate/uploads
sudo mkdir -p /var/lib/w3pn-uploads/images/about-us/sections/about/assets/gallery
```

## 2. Give the app user write access

Replace `w3pn` with the Unix user that runs `next start`:

```bash
sudo chown -R w3pn:w3pn /var/lib/w3pn-data /var/lib/w3pn-uploads
sudo chmod -R 775 /var/lib/w3pn-data /var/lib/w3pn-uploads
```

## 3. Configure persistent YAML/JSON admin data

Set this environment variable for the app process:

```bash
W3PN_DATA_ROOT=/var/lib/w3pn-data
```

What will be written there:

- admin audit log
- mailing list JSON
- event overrides and visibility
- edited event detail YAML files
- edited project index and project detail YAML files
- edited `defaultContent.yaml`

Behavior:

- reads prefer `W3PN_DATA_ROOT/...` when the file exists there
- otherwise reads fall back to the repo copy in `data/...`
- writes always go into `W3PN_DATA_ROOT/...`

This means you do not have to pre-copy the whole `data/` tree before first boot.

## 4. Keep uploaded images under `public/images/**`

Uploads still use the existing public URLs and still need to be reachable inside the release at these paths:

- `public/images/admin-uploads`
- `public/images/site-shared/admin-uploads`
- `public/images/projects/uploads`
- `public/images/donate/uploads`
- `public/images/about-us/sections/about/assets/gallery`

Recommended deployment pattern:

- keep the real files in `/var/lib/w3pn-uploads/...`
- create symlinks from the current release's `public/images/...` paths to those shared directories

Example from the release directory:

```bash
rm -rf public/images/admin-uploads
ln -s /var/lib/w3pn-uploads/images/admin-uploads public/images/admin-uploads

rm -rf public/images/site-shared/admin-uploads
ln -s /var/lib/w3pn-uploads/images/site-shared/admin-uploads public/images/site-shared/admin-uploads

rm -rf public/images/projects/uploads
ln -s /var/lib/w3pn-uploads/images/projects/uploads public/images/projects/uploads

rm -rf public/images/donate/uploads
ln -s /var/lib/w3pn-uploads/images/donate/uploads public/images/donate/uploads

rm -rf public/images/about-us/sections/about/assets/gallery
ln -s /var/lib/w3pn-uploads/images/about-us/sections/about/assets/gallery public/images/about-us/sections/about/assets/gallery
```

This keeps the editable paths under `public/images/**` while making them survive new releases.

## 5. Add self-hosted Plausible config

After your Plausible CE instance is running and the site has been created in its dashboard, add:

```bash
NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC=https://analytics.example.com/js/pa-XXXXX.js
```

Optional:

```bash
NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST=0
```

Notes:

- for Plausible CE v3.1+ prefer the exact site-specific script URL from "Site Installation"
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is only useful for legacy `script.js` style snippets
- no cookie banner is implemented in this project

## 6. Verify persistence after deploy

Run this smoke test after every new server setup:

1. Log into admin and edit one homepage field.
2. Edit one event detail.
3. Upload one image through admin.
4. Restart the app process.
5. Confirm the edited content is still present.
6. Confirm the uploaded file still exists and loads by its `/images/...` URL.

## 7. Backups

Back up both shared directories:

- `/var/lib/w3pn-data`
- `/var/lib/w3pn-uploads`

Without those backups, admin edits and uploads can be lost even if the code repository is intact.

## 8. Monitoring

Plausible covers visit analytics only. It does not replace service monitoring.

Add at least:

- HTTP uptime checks against the public site
- SSL expiry alerts
- disk-space alerts for `/var/lib/w3pn-data` and `/var/lib/w3pn-uploads`
- process restart policy and failure alerts for the app service
