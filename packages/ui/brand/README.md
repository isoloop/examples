# Brand files

The Isoloop logo, as decided in [docs/brand.md](../../../docs/brand.md): which mark goes where, colours, sizes and what not to do.

| File | Use |
| --- | --- |
| `mark.svg`, `mark-dark.svg` | The **everyday mark**: the cube and woven ribbon. Header, docs, avatars, anything small. |
| `mark-flat.svg`, `favicon.svg` | Flat fills, no gradients: the favicon and single-colour print. |
| `mark-mono.svg` | One colour, `currentColor`. Set `color` where it's used. |
| `expressive.svg`, `expressive-dark.svg` | The **expressive mark**, with the cycle arrow: social, the hero, the launch post. At least 64 px. |
| `lockup.svg`, `lockup-dark.svg`, `lockup-stacked.svg` | The mark with the "isoloop" wordmark, outlined from Archivo, so it needs no font. |
| `app-tile.svg` | The app or social tile: gradient square, white mark. |
| `favicon-32.png`, `apple-touch-icon-180.png` | Raster favicons. The Apple icon is the square tile. |
| `social/*.png` | Link preview 1200 × 630, GitHub 1280 × 640, X header 1500 × 500, avatar 400 × 400. |

## Changing them

Every SVG is generated: edit `build/geometry.ts` (the shapes) or `build/marks.ts` (colours, versions, lockups), then run:

```bash
pnpm --filter ui brand:marks    # the SVGs
pnpm --filter ui brand:render   # the favicon PNGs and the social cards (Playwright)
```

- **The social cards'** text and layout are in `social/cards.html` and `cards.css`, set in Archivo (`social/archivo.woff2`, OFL, with its licence).
- **The wordmark's outlines** are in `build/wordmark.ts`, made once by `build/wordmark.py` (Python with fontTools). Rerun it only if the wordmark changes.
- **The images the marks were measured from**, and the prompts that made them, are in `source/`.
