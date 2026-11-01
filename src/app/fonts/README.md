# Fonts

Self-hosted so `next build` never fetches from Google Fonts.

| Files | Family | License |
|---|---|---|
| `GeistVF.woff`, `GeistMonoVF.woff` | Geist (Vercel) | SIL OFL 1.1 |
| `ibm-plex-serif-*`, `ibm-plex-mono-*` | IBM Plex | SIL OFL 1.1 |
| `fraunces-*` | Fraunces (variable: wght, opsz) | SIL OFL 1.1 |
| `dm-sans-*` | DM Sans (variable: wght 300–600) | SIL OFL 1.1 |
| `space-mono-*` | Space Mono | SIL OFL 1.1 |

The Google families are the latin subset as served by Google Fonts (woff2).
To add a weight, download it from fonts.google.com and add an entry in
`src/app/layout.tsx`.
