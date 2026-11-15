---
# stretto-5uww
title: Use LRCLIB for lyrics via server proxy with cache and synced lyrics
status: completed
type: feature
priority: normal
created_at: 2026-11-15T13:23:29Z
updated_at: 2026-11-15T13:24:42Z
---

Replace azlyrics scraping; server route + Mongo cache keyed by song id; synced highlight in modal

## Summary of Changes
Added /lyrics server route (LRCLIB, Mongo cache by song id incl. synced lyrics), client uses it with synced highlighting in modal.
