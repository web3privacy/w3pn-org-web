# Iterace 1 WebP Report

Generated: 2026-04-23T22:26:24.520Z

## Summary

- Source folder: `all-images`
- Target folder: `all-images/iterace-1`
- Raster files converted/copied as WebP: 1484
- Non-raster files copied: 18
- Current optimized raster size: 107.79 MB
- Iterace-1 raster size: 82.94 MB
- Raster savings vs current optimized set: 24.85 MB (23.1%)
- Current total copied folder size baseline: 118.41 MB
- Iterace-1 total size: 93.56 MB
- Total savings including docs/non-raster copies: 24.85 MB (21.0%)

## What Changed

- Every raster asset in this iteration now exists as `.webp`.
- Directory hierarchy and basenames stay aligned with the original export, only raster extensions change.
- `manifest.tsv` now points to future `.webp` targets, so app references cannot stay on `.png` / `.jpg` if this iteration is adopted.

## App Work Needed

- Update app references that currently expect `.png`, `.jpg` or `.jpeg` paths to the new `.webp` targets from `iterace-1/manifest.tsv`.
- Re-run any asset ingestion/export step that depends on filename extension matching.
- Smoke-test the build and image rendering after swapping targets back into `public/`.

## Top Source Formats

- webp: 757 files, 42.52 MB
- jpg: 430 files, 40.64 MB
- png: 297 files, 24.63 MB
