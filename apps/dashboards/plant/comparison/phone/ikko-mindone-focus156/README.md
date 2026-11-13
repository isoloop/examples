# Plant dashboard on an iKKO MindOne, Firefox Focus 156

Recorded on 2026-11-13 with each page's **Record 10 s** panel at `plant-v0.1.0-rc.3` (`@isoloop/*@0.0.0-next.b8ffdcf`), from https://isoloop.github.io/examples/dashboards/plant/. This is decision 11's mid-range phone.

- **Device:** iKKO MindOne, MediaTek MT8781V (mt6789), 8 cores, 8 GB, Android 15. The display runs at 96 Hz, so a frame budget is 10.4 ms and 96 frames/s is the ceiling. The phone was plugged in, in portrait, with one dashboard tab open at a time.
- **Browser:** Firefox Focus 156 (Gecko 156). Chrome 157 couldn't be used; see [Chrome](#chrome).
- **How it was driven:** plain adb from a PC, with no browser debugging:
  - Each page was opened with `am start`, and the other tabs were closed through Focus's own menu. The page was then left about 25 s to fill.
  - **Record** was tapped with `input tap`, and the *Type here* box got a steady burst of `input text` keystrokes for the 10 s. That's about 80 bursts of five characters, the same for every page.
  - Each result was read from a screenshot (`screencap`). `uiautomator dump` can't read a page that redraws every frame.
- **Rounds:** two, in the order native, `one`, native + workers, `matched`, `split`, at 1 kHz and then 5 kHz. `own` was recorded once, at the end of round 1. One more native 1 kHz run was taken before a phone restart (file `r0-…`); it matches round 1.
- **Temperature:** the battery read 40.0 °C at the end. Rounds 1 and 2 agree closely, so no thermal drift shows between them.
- **Precision:** each cell gives round 1 / round 2. With two rounds there's no spread to quote, so read differences of a few milliseconds or frames as noise.

| # | Build | Workers | Frames/s | Late frames | Long tasks | Typing median (ms) | Typing worst (ms) | First data (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | native, 1 kHz | 0 | 56.2 / 55.4 | 46 / 32 | 3 / 2 | 34 / 32 | 428 / 369 | 443 / 925 |
| 2 | Isoloop `one`, 1 kHz | 1 + bus | 80.3 / 82.1 | 3 / 1 | 1 / 2 | 18 / 15 | 109 / 144 | 1843 / 1192 |
| 3 | native + workers, 1 kHz | 9 | 51.2 / 54.4 | 42 / 29 | 2 / 1 | 38 / 33 | 449 / 437 | 928 / 695 |
| 4 | Isoloop `matched`, 1 kHz | 10 + bus | 77.4 / 76.4 | 4 / 7 | 2 / 1 | 19 / 19 | 167 / 140 | 1959 / 1420 |
| 5 | Isoloop `split`, 1 kHz | 18 + bus | 46.3 / 47.9 | 110 / 92 | 8 / 8 | 44 / 43 | 926 / 784 | 1766 / 1932 |
| 6 | native, 5 kHz | 0 | 45.2 / 48.3 | 56 / 45 | 6 / 5 | 64 / 56 | 549 / 522 | 713 / 568 |
| 7 | Isoloop `one`, 5 kHz | 1 + bus | 83.5 / 83.1 | 2 / 1 | 1 / 1 | 16 / 16 | 120 / 149 | 1479 / 1366 |
| 8 | native + workers, 5 kHz | 9 | 47.4 / 47.2 | 50 / 48 | 3 / 2 | 57 / 50 | 506 / 575 | 688 / 683 |
| 9 | Isoloop `matched`, 5 kHz | 10 + bus | 67.5 / 70.7 | 23 / 13 | 2 / 2 | 23 / 22 | 171 / 312 | 1546 / 1920 |
| 10 | Isoloop `split`, 5 kHz | 18 + bus | 31.1 / 32.2 | 156 / 143 | 18 / 11 | 164 / 199 | 2502 / 1365 | 2304 / 2177 |
| 11 | Isoloop `own`, 5 kHz | 105 + bus | 23.5 | 133 | 20 | 222 | 4491 | 8145 |

## What it shows

- **Unlike the Fold6, the main thread on this phone runs short in both native builds, at both rates.**
  - **At 1 kHz:** native and native + workers draw 51–56 frames/s of a possible 96, with 29–46 late frames, and the slowest keystroke takes 369–449 ms.
  - **At 5 kHz:** they draw 45–48 frames/s, the median keystroke takes 50–64 ms, and the slowest 506–575 ms.
- **The two matched pairs:**
  - **native vs `one`:** `one` draws 80–84 frames/s with 1–3 late frames. Its median keystroke is 15–18 ms and its slowest 109–149 ms, at both rates.
  - **native + workers vs `matched`:** `matched` draws 68–77 frames/s with 4–23 late frames. Its median keystroke is 19–23 ms and its slowest 140–312 ms.
- **The price is start-up:** Isoloop takes 1.2–2.0 s to first data, against 0.4–0.9 s for the native builds.
- **`split`, the default placement, is the worst build on this phone.** It draws 31–48 frames/s with 92–156 late frames and 8–18 long tasks. Its median keystroke at 5 kHz is 164–199 ms, and its slowest is up to 2.5 s. With 18 workers plus the bus on 8 cores, the page's own main thread gets less CPU time than in any other build.
- **`own` runs:** 105 workers plus the bus, on a mid-range phone, and decision 6 left open whether it would.
  - It draws 23.5 frames/s, its median keystroke is 222 ms, and its slowest is 4.5 s.
  - First data takes 8.1 s.
  - Several widgets showed "Not responding…" while it started, before they caught up.
- **The pools guide's advice holds on this phone:** fewer, larger pools (`one`, `matched`) do better than many workers (`split`, `own`) when there are only a few cores.
- **Not recorded:** CPU and memory. The panel doesn't report them, and there was no DevTools access on this phone.

## Compared with the other devices

- **Galaxy Z Fold6, Chrome 157** ([`../galaxy-fold6-chrome157/`](../galaxy-fold6-chrome157/README.md)): every build held 60 frames/s there, with the median keystroke at 9–13 ms. That flagship has the headroom this phone lacks, so the builds only separate here.
- **The server's 4-core profile at a fixed 2.0 GHz** ([`../../matched-v2/`](../../matched-v2/README.md)): there too, native ran short at 5 kHz while `one` and `matched` didn't. This phone shows the same direction at 1 kHz as well.
- **Different browsers:** these figures come from Firefox, while the Fold6 and the server's main tables come from Chrome. The server's Firefox runs showed the same direction: native dropped frames at 5 kHz, and Isoloop didn't.

## Chrome

Chrome 157 on this phone couldn't be used, and the cause found was the test tooling, not the page.

- **What failed:** after an attempted Playwright run, Chrome failed to start its renderer and GPU processes, even for `example.com`. Its log showed `cr_ChildProcessConn: Failed to establish the service connection` and `[FATAL:…browser_gpu_channel_host_factory.cc:53] Timed out waiting for GPU channel`.
- **Firefox Focus failed the same way.** Its child processes were refused by Android (ActivityManager: `Unable to launch app org.mozilla.focus/… for service …GeckoChildProcessServices$tab…: process is bad`). That began right after the app was stopped with `am force-stop`, and logcat had no Focus crash before it.
- **The Chrome run had done the same:** it had force-stopped Chrome before each run.
- **The fix:** a phone restart cleared the "bad" state. Without force-stopping again, every page above ran, with no browser crash.
- **Chrome wasn't retried after the restart,** so whether it runs the plant on this phone is still unrecorded.
