# AI Science Cartoon Studio — Phase 1

A mobile-friendly, single-file prototype for creating science-video production plans.

## Run
Open `index.html` in a modern browser, or deploy the repository root to Netlify / Cloudflare Pages.

## Implemented
- Responsive dashboard and project creation form.
- Local demo script and editable storyboard generation.
- Scene editing, add/delete/duplicate/reorder.
- Browser-local project saving using localStorage.
- Add source URLs and claim notes manually.
- Script TXT, storyboard Markdown, subtitle SRT, project JSON and full backup exports.
- Browser speech-synthesis preview where supported.
- Clear demo labels; no fake AI or MP4-rendering success.

## Not implemented yet
Live web research, live language-model generation, image generation, downloadable TTS audio, genuine video animation, accounts/cloud storage, and MP4 rendering. These require external integrations. Keep secrets server-side; never place private API keys in frontend code.

## Storage note
Projects are saved only in the current browser profile. Clearing browser data may delete them. Download backups regularly.

## Scientific review
The local template output is not independently fact-checked. Add and open reputable sources, verify every scientific claim and visual, and use human review before publishing, especially for medical topics.
