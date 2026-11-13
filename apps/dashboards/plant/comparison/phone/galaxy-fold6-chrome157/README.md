# Plant dashboard on a Galaxy Z Fold6, Chrome 157

Recorded by hand on 2026-11-13 with each page's **Record 10 s** panel (decision 11's device run), at `plant-v0.1.0-rc.3` (`@isoloop/*@0.0.0-next.b8ffdcf`) from https://isoloop.github.io/examples/dashboards/plant/.

- **Device:** Samsung Galaxy Z Fold6 inner screen, portrait, Chrome 157 on Android. It was plugged in, with one dashboard tab open at a time.
- **What the page reports:** `navigator.hardwareConcurrency` reports 8 cores. `navigator.deviceMemory` reports 8 GB; browsers cap that value at 8.
- **The device's class:** it's a flagship phone, not the mid-range phone decision 11 asks for.
- **Method:** each page was opened in a fresh tab and left about 15–20 s to fill. Then 10 s were recorded while typing into the *Type here* box. Each native build was recorded right before its matched Isoloop build.
- **Breaks:** about 40 minutes passed between page 3 and page 4, so the device may have been at a different temperature for pages 4–11.
- **Precision:** the JSON files keep the panel's output, with input times rounded to 0.1 ms.
- **Runs:** one run per page, so there's no spread. Read differences of a few milliseconds as noise.

| # | Build | Workers | Frames/s | p95 frame | Late frames | Long tasks | Typing, median / worst | First data |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | native, 1 kHz | 0 | 61.3 | 16.8 ms | 0 | 0 | 12.1 / 24.4 ms | 685 ms |
| 2 | Isoloop `one`, 1 kHz | 1 + bus | 61.1 | 16.8 ms | 0 | 0 | 11.5 / 20.8 ms | 613 ms |
| 3 | native + workers, 1 kHz | 9 | 61.1 | 16.7 ms | 0 | 0 | 12.4 / 18.7 ms | 763 ms |
| 4 | Isoloop `matched`, 1 kHz | 10 + bus | 61.0 | 16.7 ms | 0 | 0 | 11.2 / 20.3 ms | 388 ms |
| 5 | Isoloop `split`, 1 kHz | 18 + bus | 61.1 | 16.7 ms | 0 | 0 | 10.3 / 18.2 ms | 496 ms |
| 6 | native, 5 kHz | 0 | 61.1 | 16.7 ms | 0 | 0 | 12.9 / 23.7 ms | 142 ms |
| 7 | Isoloop `one`, 5 kHz | 1 + bus | 61.1 | 16.7 ms | 0 | 0 | 10.3 / 19.8 ms | 374 ms |
| 8 | native + workers, 5 kHz | 9 | 61.1 | 16.7 ms | 0 | 0 | 12.2 / 21.1 ms | 829 ms |
| 9 | Isoloop `matched`, 5 kHz | 10 + bus | 61.0 | 16.7 ms | 0 | 0 | 9.0 / 18.6 ms | 458 ms |
| 10 | Isoloop `split`, 5 kHz | 18 + bus | 61.0 | 16.8 ms | 1 | 0 | 11.6 / 22.1 ms | 476 ms |
| 11 | Isoloop `own`, 5 kHz | 105 + bus | 61.1 | 16.7 ms | 0 | 0 | 11.4 / 22.5 ms | 1326 ms |

## What it shows

- **Every build holds 60 frames/s with no long tasks, at both rates.** That includes native with everything on the main thread at 5 kHz. Typing is 9–13 ms median and at most 24 ms everywhere. On this phone the main thread has headroom in every build, so there's no responsiveness difference between builds to report. That's unlike the server's fixed 2.0 GHz profile ([`../../matched-v2/`](../../matched-v2/README.md)), where native ran short at 5 kHz.
- **`own` runs, with 105 workers plus the bus,** at 60 frames/s. Decision 6 left open whether it would run on a phone at all. Its first data takes the longest, 1.3 s.
- **First data varies widely between pages:** native took 685 ms at 1 kHz and 142 ms at 5 kHz, for example. Without repeated runs it can't be compared between builds here. The server figures are the ones to use for start-up cost.
- **Not recorded on the phone:** CPU and memory. The panel doesn't report them, so the battery and memory cost of Isoloop's extra threads isn't visible in this run.
