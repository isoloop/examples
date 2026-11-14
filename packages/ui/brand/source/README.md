# Where the marks came from

The shipped marks in `packages/ui/brand/` are drawn from geometry in
`../build/geometry.ts`, not these images. These are the generated originals
they were measured from, kept as a record ([docs/brand.md](../../../../docs/brand.md)).

| File | What it is |
| --- | --- |
| `reference.webp` | The maintainer's reference, made with Google's Gemini image model: an isometric cube with a woven ribbon in a cycle arrow |
| `everyday-source.webp` | Higgsfield variation 3 (no ring): the everyday mark |
| `expressive-source.webp` | Higgsfield variation 1 (refined, with the ring): the expressive mark |
| `dark-source.webp` | Higgsfield variation 10 (dark mode): the social style |
| `app-tile-source.webp` | Higgsfield variation 16: the app tile |

The variations were generated on 2026-11-14 with Higgsfield, model GPT Image 2.6 (`gpt_image_2_6`, high quality), each with `reference.webp` as the reference image. The prompts:

- **3 (everyday):** "Variation of the reference logo without the outer circular arrow: only the isometric cube with the ribbon loop woven in and out of it, bigger and bolder, indigo to teal gradient, centred on white, no text."
- **1 (expressive):** "Redraw this logo as a refined professional version: same concept (isometric cube with a ribbon loop woven through it, wrapped by a circular cycle arrow), cleaner geometry, perfectly even ribbon width, crisp vector edges, smooth indigo to teal gradient, balanced spacing, centred on white, no text."
- **10 (dark):** "Dark mode version of the reference logo on a deep navy background #161c2c: brighter teal #4cc6d3, periwinkle #8aa5ff and lavender #b79af6, same cube, woven ribbon and cycle arrow, crisp vector, no text."
- **16 (tile):** "App icon version of the reference logo: a rounded square tile with an indigo to teal gradient background, the cube with the woven ribbon and cycle arrow drawn in white on top, simple enough for a small icon, no text."

## Terms

- **Ownership:** Higgsfield's terms of use, §4.4, say the company doesn't claim ownership of outputs and doesn't restrict their commercial use.
- **Uniqueness and training:** the company doesn't guarantee outputs are unique, and may use them for training.
- **What ships:** the marks drawn from geometry, with exact isometric lines and palette colours.
- **Before a trademark:** run a similarity search before registering one.
