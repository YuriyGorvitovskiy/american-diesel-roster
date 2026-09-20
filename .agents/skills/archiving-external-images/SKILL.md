---
name: archiving-external-images
description: Use when adding or changing externally hosted photographs or image fallbacks in American Diesel Roster, or when refreshing the local WebArchive copy.
---

# Archive external images locally

Keep external image URLs as the primary display source. The original source page, credit, caption, and date remain in project data and visible in the UI.

`WebArchive/` is a personal, Git-ignored backup for the local site. After adding or changing a remote image URL, run `node scripts/archive-remote-images.js` to refresh copies. The archive path is derived from the exact URL by `src/image-archive.js`; do not add a local archive path to domain JSON or substitute a different photo. Check the command's final count and resolve failed downloads before claiming the archive is complete.

On remote load failure, the UI tries the matching archive copy once. If that also fails, it displays the existing link to the original source. Verify this path in the local browser. The archive is local only and does not make an image available in a published build.

Respect `PROJECT.md` provenance and licensing rules. Do not commit archived third-party photographs or treat a personal backup as permission to republish them.
