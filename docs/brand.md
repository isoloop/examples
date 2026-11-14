# Isoloop brand

The logo, the wordmark, and where each version goes. Decided 2026-11-14 with the maintainer. [ADR 0003](adr/0003-design-system.md) covers the design system around it. The files live in [`packages/ui/brand/`](../packages/ui/brand/).

## The idea

An isometric cube (*iso*) with a ribbon woven through it, running in and out of it. The cube is an isolate, contained on its own. The ribbon is the loop and the messages passing through. In the expressive version a cycle arrow goes around both: the loop running, and an isolate restarting.

## Two marks, one identity

The logo is **responsive**: a compact mark for small places, and a fuller one where there's room. Both share the same cube and ribbon. The ring only appears where there's space for it.

| Mark | What it is | Use it for | Smallest size |
| --- | --- | --- | --- |
| **Everyday mark** | The cube with the woven ribbon, no ring | the site header, favicon, docs, README, npm and GitHub org avatars: anywhere small | 16 px, using the flat version |
| **Expressive mark** | The cube and ribbon inside a circular cycle arrow (two arrowheads) | social cards, the landing hero or footer at large size, the launch post, stickers: anywhere with room to show the loop | 64 px |

Below 64 px, always use the everyday mark. At small sizes the ring takes up the space and the cube shrinks to a few pixels; at 16 px it becomes a circle nobody can recognise. That was checked in the site header and in a browser tab.

## Colour

The marks use a gradient from indigo through violet to teal. The colours come from the design tokens ([ADR 0003](adr/0003-design-system.md)):

| | Light background | Dark background |
| --- | --- | --- |
| Indigo / blue | `#2f57cc` | `#8aa5ff` |
| Violet | `#6e46c2` | `#b79af6` |
| Teal | `#0b7480` → `#4cc6d3` | `#4cc6d3` |
| Cube's shaded faces | deep indigo, a darker step of the blue | the same, lifted for contrast |

- **Gradients are allowed in the logo only.** The rest of the design system stays flat.
- **The flat version** (favicon, single-colour print, embroidery) uses solid fills: teal, blue, violet. No gradients, no glow.
- **The one-colour version** uses ink `#14161c` on light, or `#e9ecf3` on dark.

## Wordmark and lockups

- **The wordmark** is "isoloop" in lowercase, set in Archivo at weight 820 and 68% width, the same as the site's headline type. It's set in type, never drawn by an image model.
- **The horizontal lockup** has the mark on the left and the wordmark on the right, vertically centred. The gap is half the mark's width.
- **The stacked lockup** has the mark centred above the wordmark.
- **The site header** uses the everyday mark with the wordmark.

## Social media

The social style is the **dark** expressive mark on navy `#161c2c`, with a soft glow. Text is set in Archivo, in white and `#aab2c3`, with the address in teal `#4cc6d3`.

| Asset | Size | Layout |
| --- | --- | --- |
| Link preview (the site's Open Graph image, Slack, LinkedIn) | 1200 × 630 | Wordmark, headline, one line and `isoloop.dev` on the left; the large mark on the right |
| GitHub social preview | 1280 × 640 | The same, with the GitHub address |
| X / Twitter header | 1500 × 500 | The mark on the **right**, timeline tracks running out to the left, headline beside it. The profile picture covers the bottom left on X, so the mark must not sit there. |
| Avatar | 400 × 400 | The expressive mark, centred, with a soft glow |

The headline is the site's: "Event-loop isolation for web apps".

## App and social tile

For an app icon or a square social tile: a rounded square with the indigo → teal gradient, and the mark in white on top.

## Favicon

The flat everyday mark, as an SVG plus a 32 px PNG fallback. Check it at 16 px: the hexagonal silhouette has to stay recognisable.

## Don't

- Don't use the expressive mark (with the ring) below 64 px.
- Don't recolour it outside the palette, or add colours.
- Don't put text inside the mark, or redraw the wordmark in another typeface.
- Don't place the gradient mark on busy photos or mid-tone backgrounds. Use the one-colour version there.
- Don't stretch, rotate or outline the mark.
- No ∞ signs. The identity deliberately moved away from them.

## Where it came from

- **The process:** about seven rounds of exploration on 2026-11-14:
  - ∞ and two-loop marks
  - walls and compartments
  - hand-drawn marks: breaker panel, workers, isometric pieces, heartbeat
  - open briefs to the image models

  None was taken. The maintainer then brought a reference image made with Google's Gemini image model (the cube with a woven ribbon and a cycle arrow). Variations on that reference produced these two marks: the expressive mark (variation 1), the everyday mark (variation 3), and the dark social style (variation 10).
- **The tools:** the variations were generated with Higgsfield (GPT Image 2.6 from the reference image), then **redrawn by hand as SVG**. The shipped files are the redraw, with exact geometry and palette colours, not the generated images. The generated originals and the prompts are kept in `packages/ui/brand/source/`.
- **Terms:** Higgsfield's terms (§4.4) claim no ownership of outputs and don't restrict commercial use. They don't guarantee uniqueness, and they may use outputs for training. Before registering a trademark, run a similarity search.

## Status

- [x] Direction and roles decided (this document)
- [ ] SVG redraw of both marks, light and dark, flat favicon, lockups, app tile
- [ ] Social cards rebuilt around the redrawn expressive mark
- [ ] Wired into `packages/ui` (`Header`, favicon) and the site's link previews
