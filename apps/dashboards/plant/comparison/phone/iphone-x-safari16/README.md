# Plant dashboard on an iPhone X, Safari 16.6

Recorded on 2026-11-13 at `plant-v0.1.0-rc.5` (`@isoloop/*@0.0.0-next.b8ffdcf`, `matched` as the default placement) from https://isoloop.github.io/examples/dashboards/plant/. Each page's own **Record 10 s** panel was driven remotely through Safari's Web Inspector by [`../../ios-inspector/record.mjs`](../../ios-inspector/README.md).

- **Device:** iPhone X (`iPhone10,6`, A11 Bionic), iOS 16.7.16, Safari 16.6.2 (`Version/16.6.2` in the user agent). Display 60 Hz. Safari reports `navigator.hardwareConcurrency` as 4 and no `deviceMemory`. Only the chip name is given; no core layout is claimed. Connected over USB to a PC (usbmuxd under WSL), Auto-Lock off, Safari in front.
- **The device's class:** a 2017 phone. It is the only iOS device in these runs where Safari has little headroom; the M2 iPad held 60 fps on `split` and `matched` at 5 kHz (an observation, not a recorded run).
- **Method:** one page at a time, opened by navigation in the same tab. 25 s to fill, then 10 s recorded. Two rounds of the 10 pages, `own` once at the end. The 21 JSON files are in this folder (`r<round>-<page>-…`).
- **Typing is synthetic** (`synthetic: true` in each file): a `keydown` plus `input` event on the *Type here* box every 100 ms, dispatched in the page (`isTrusted: false`). The page times each from dispatch to the next frame, so the figures include main-thread queueing after dispatch but not the OS input path. They are not directly comparable with the hand-typed runs on the other phones.
- **Long tasks:** Safari has no `longtask` entries, so the page counts timer drift over 50 ms instead (`metrics/main-thread.ts`).
- **First data** is left out of the table. Read on navigation within one tab, it ranged from 0.2 to 34 s for the same build with no pattern, so it isn't a usable start-up figure here. The values are in the JSON files.
- **Heat:** round 2 was recorded right after round 1, about 11 minutes into continuous load. Every build, native included, was slower in round 2 than in round 1. The battery read 38.6 °C at the end; there is no reading from the start. Round 1 is the cooler phone; the two rounds are shown side by side, not averaged.

Each cell is round 1 / round 2. 60 frames/s is the ceiling.

| # | Build | Frames/s | Late frames | Long tasks | Typing, median / worst (ms, synthetic) |
| --- | --- | --- | --- | --- | --- |
| 1 | native, 1 kHz | 60 / 57.9 | 1 / 36 | 0 / 0 | 15 / 32, 20 / 47 |
| 2 | Isoloop `one`, 1 kHz | 59.8 / 49.9 | 2 / 92 | 0 / 2 | 15 / 61, 23 / 68 |
| 3 | native + workers, 1 kHz | 60 / 56 | 0 / 51 | 0 / 0 | 14 / 25, 19 / 64 |
| 4 | Isoloop `matched`, 1 kHz | 59.9 / 37.7 | 5 / 160 | 0 / 1 | 13 / 33, 34 / 92 |
| 5 | Isoloop `split`, 1 kHz | no result / 15.1 | no result / 148 | no result / 35 | no result / no result, 77 / 151 |
| 6 | native, 5 kHz | 60 / 53.3 | 3 / 61 | 0 / 1 | 16 / 32, 23 / 93 |
| 7 | Isoloop `one`, 5 kHz | 59.5 / 48.3 | 14 / 100 | 0 / 1 | 19 / 38, 26 / 85 |
| 8 | native + workers, 5 kHz | 58.5 / 48.1 | 33 / 96 | 0 / 0 | 19 / 46, 25 / 52 |
| 9 | Isoloop `matched`, 5 kHz | 51.9 / 37.1 | 93 / 158 | 0 / 2 | 21 / 96, 35 / 91 |
| 10 | Isoloop `split`, 5 kHz | 11.1 / 8.9 | 106 / 89 | 30 / 42 | 91 / 232, 117 / 218 |
| 11 | Isoloop `own` (105 workers), 5 kHz | 5.6 / – | 56 / – | 39 / – | 194 / 413, – / – |

- **Round 1, page 5 (`split`, 1 kHz):** the panel returned no result within 56 s of navigation. The page was replaced by navigation as usual; Safari didn't report a crash. Round 2 recorded it.

## What it shows

- **At 1 kHz (round 1)** every build except `split` holds 60 frames/s with at most 5 late frames.
- **At 5 kHz (round 1)** native holds 60 frames/s (3 late), `one` 59.5 (14 late), native + workers 58.5 (33 late) and `matched` 51.9 (93 late).
- **`split` and `own` don't keep up in Safari on this phone:** 9–15 frames/s for `split` with 30–42 long tasks, and 5.6 frames/s for `own`. These are the placements with the most workers: 18 and 105, plus the bus.
- **Unlike the mid-range Android phone** ([`../ikko-mindone-focus156/`](../ikko-mindone-focus156/README.md)), Isoloop does not run ahead of native here. On the MindOne in Firefox, native ran short and `one`/`matched` held 68–84 frames/s. In Safari on the iPhone X, native keeps 60 frames/s at both rates in round 1, and the more workers a placement has, the further it drops.
- **The fewer the workers, the closer to native:** `one` (1 pool + bus) stays within a few frames of native in round 1 at both rates. That matches the pools guide's advice for smaller devices.
- **Against the other devices:** the Fold6 ([`../galaxy-fold6-chrome157/`](../galaxy-fold6-chrome157/README.md)) had headroom in every build; the desktop server ([`../../final/`](../../final/README.md)) at 2.0 GHz kept Isoloop at 0 late frames in Chromium, while native ran short at 5 kHz.
- **Not measured here:** CPU, memory, and the cause of the drop in `split` and `own`. Engine constraint 2 in the main repo describes worker-canvas presents costing WebKit's main thread in Playwright's WebKit on Linux. Whether the same mechanism is at work in Safari on this phone is not established by this run.
