
### native-workers (A) vs isoloop:matched (B), 5 kHz, 6/6 runs

Renderer CPU: A 985 ms/s, B 1153 ms/s, gap +168 ms/s. Main thread A 813, B 266; workers A 81 (9), B 786 (11); other renderer threads A 95, B 104. Kernel time within it A 33, B 68 (on worker threads A 10, B 35). GPU process A 285, B 337; browser process A 2, B 3. Trace-event coverage of busy threads: A 90%, B 92%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 16.4 | 90.0 | +73.6 | 44% |
| not covered by trace events (JS threads) | 17.1 | 56.8 | +39.7 | 24% |
| host: other | 0.0 | 23.2 | +23.2 | 14% |
| tasks and scheduling (other native) | 66.0 | 88.4 | +22.4 | 13% |
| runtime: bus client | 0.0 | 21.7 | +21.7 | 13% |
| messaging: postMessage (serialize) | 2.3 | 21.1 | +18.8 | 11% |
| bus: broker | 0.0 | 13.7 | +13.7 | 8% |
| JS: browser API calls | 19.4 | 28.7 | +9.3 | 6% |
| app: metrics panels | 7.7 | 17.0 | +9.3 | 6% |
| host: patch apply | 0.0 | 5.7 | +5.7 | 3% |
| runtime: other | 0.0 | 5.2 | +5.2 | 3% |
| animation frames in workers | 0.0 | 4.2 | +4.2 | 3% |
| app: widgets and page | 8.5 | 12.6 | +4.1 | 2% |
| app: feeds and engines | 55.2 | 59.0 | +3.8 | 2% |
| React | 19.9 | 23.2 | +3.3 | 2% |
| protocol guards | 0.0 | 2.5 | +2.5 | 1% |
| host: bus controller | 0.0 | 2.3 | +2.3 | 1% |
| not covered by trace events (other threads) | 15.3 | 17.5 | +2.2 | 1% |
| bus: schema validation | 0.0 | 1.7 | +1.7 | 1% |
| GC | 22.9 | 24.0 | +1.0 | 1% |
| compositor thread | 25.8 | 21.2 | -4.6 | -3% |
| app: canvas drawing (JS) | 77.5 | 59.2 | -18.2 | -11% |
| canvas and tiles: raster and present | 429.7 | 402.6 | -27.1 | -16% |
| style, layout, paint, commit | 196.3 | 147.1 | -49.3 | -29% |

### native (A) vs isoloop:one (B), 5 kHz, 4/4 runs

Renderer CPU: A 946 ms/s, B 1094 ms/s, gap +148 ms/s. Main thread A 841, B 239; workers A 0 (0), B 730 (2); other renderer threads A 102, B 123. Kernel time within it A 25, B 58 (on worker threads A 0, B 24). GPU process A 287, B 341; browser process A 1, B 3. Trace-event coverage of busy threads: A 94%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 5.6 | 84.8 | +79.2 | 54% |
| tasks and scheduling (other native) | 59.2 | 98.2 | +39.0 | 26% |
| app: feeds and engines | 59.8 | 95.3 | +35.5 | 24% |
| not covered by trace events (JS threads) | 5.1 | 35.1 | +30.0 | 20% |
| host: other | 0.0 | 29.5 | +29.5 | 20% |
| runtime: bus client | 0.0 | 14.9 | +14.9 | 10% |
| app: metrics panels | 6.7 | 20.9 | +14.3 | 10% |
| bus: broker | 0.0 | 12.5 | +12.5 | 8% |
| GC | 20.7 | 32.0 | +11.2 | 8% |
| messaging: postMessage (serialize) | 0.5 | 10.8 | +10.2 | 7% |
| host: patch apply | 0.0 | 8.6 | +8.6 | 6% |
| JS: browser API calls | 19.6 | 27.6 | +7.9 | 5% |
| animation frames in workers | 0.0 | 4.3 | +4.3 | 3% |
| app: widgets and page | 7.4 | 10.9 | +3.5 | 2% |
| runtime: other | 0.0 | 3.5 | +3.5 | 2% |
| not covered by trace events (other threads) | 15.2 | 18.1 | +2.9 | 2% |
| host: bus controller | 0.0 | 2.0 | +2.0 | 1% |
| protocol guards | 0.0 | 1.5 | +1.5 | 1% |
| bus: schema validation | 0.0 | 1.4 | +1.4 | 1% |
| React | 17.0 | 17.6 | +0.6 | 0% |
| compositor thread | 25.0 | 21.0 | -4.0 | -3% |
| app: canvas drawing (JS) | 75.6 | 50.4 | -25.2 | -17% |
| canvas and tiles: raster and present | 436.6 | 389.2 | -47.4 | -32% |
| style, layout, paint, commit | 193.5 | 116.2 | -77.3 | -52% |

### native-workers (A) vs isoloop:matched (B), 1 kHz, 4/4 runs

Renderer CPU: A 846 ms/s, B 979 ms/s, gap +133 ms/s. Main thread A 705, B 256; workers A 42 (9), B 632 (11); other renderer threads A 98, B 93. Kernel time within it A 32, B 64 (on worker threads A 8, B 31). GPU process A 287, B 327; browser process A 2, B 2. Trace-event coverage of busy threads: A 93%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 13.1 | 76.1 | +63.0 | 47% |
| not covered by trace events (JS threads) | 27.3 | 57.5 | +30.1 | 23% |
| host: other | 0.0 | 25.2 | +25.2 | 19% |
| runtime: bus client | 0.0 | 16.2 | +16.2 | 12% |
| tasks and scheduling (other native) | 67.6 | 83.7 | +16.1 | 12% |
| messaging: postMessage (serialize) | 1.7 | 14.4 | +12.7 | 10% |
| bus: broker | 0.0 | 10.4 | +10.4 | 8% |
| host: patch apply | 0.0 | 8.5 | +8.5 | 6% |
| app: metrics panels | 8.6 | 15.9 | +7.4 | 6% |
| JS: browser API calls | 21.0 | 27.0 | +6.1 | 5% |
| runtime: other | 0.0 | 6.0 | +6.0 | 5% |
| React | 12.8 | 17.9 | +5.1 | 4% |
| animation frames in workers | 0.0 | 4.4 | +4.4 | 3% |
| host: bus controller | 0.0 | 3.3 | +3.3 | 2% |
| app: widgets and page | 7.3 | 10.1 | +2.8 | 2% |
| protocol guards | 0.0 | 2.1 | +2.1 | 2% |
| bus: schema validation | 0.0 | 1.5 | +1.5 | 1% |
| not covered by trace events (other threads) | 14.7 | 16.0 | +1.3 | 1% |
| GC | 15.6 | 16.0 | +0.5 | 0% |
| canvas and tiles: raster and present | 376.2 | 374.7 | -1.5 | -1% |
| app: feeds and engines | 25.7 | 20.3 | -5.4 | -4% |
| compositor thread | 27.7 | 20.8 | -7.0 | -5% |
| app: canvas drawing (JS) | 34.9 | 26.4 | -8.5 | -6% |
| style, layout, paint, commit | 194.1 | 146.5 | -47.6 | -36% |

### native (A) vs isoloop:one (B), 1 kHz, 4/4 runs

Renderer CPU: A 787 ms/s, B 877 ms/s, gap +90 ms/s. Main thread A 693, B 241; workers A 0 (0), B 532 (2); other renderer threads A 91, B 108. Kernel time within it A 20, B 48 (on worker threads A 0, B 14). GPU process A 287, B 345; browser process A 1, B 2. Trace-event coverage of busy threads: A 93%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 6.0 | 67.4 | +61.3 | 68% |
| not covered by trace events (JS threads) | 7.7 | 35.8 | +28.1 | 31% |
| host: other | 0.0 | 26.2 | +26.2 | 29% |
| tasks and scheduling (other native) | 51.2 | 73.6 | +22.4 | 25% |
| app: metrics panels | 7.8 | 17.8 | +10.1 | 11% |
| app: feeds and engines | 20.3 | 30.3 | +10.1 | 11% |
| runtime: bus client | 0.0 | 9.6 | +9.6 | 11% |
| bus: broker | 0.0 | 8.8 | +8.8 | 10% |
| host: patch apply | 0.0 | 8.8 | +8.8 | 10% |
| messaging: postMessage (serialize) | 0.3 | 8.3 | +8.0 | 9% |
| JS: browser API calls | 20.6 | 26.3 | +5.7 | 6% |
| not covered by trace events (other threads) | 13.6 | 18.0 | +4.4 | 5% |
| GC | 14.6 | 18.9 | +4.2 | 5% |
| animation frames in workers | 0.0 | 3.7 | +3.7 | 4% |
| runtime: other | 0.0 | 3.4 | +3.4 | 4% |
| host: bus controller | 0.0 | 3.1 | +3.1 | 3% |
| app: widgets and page | 6.3 | 8.3 | +2.0 | 2% |
| bus: schema validation | 0.0 | 1.2 | +1.2 | 1% |
| protocol guards | 0.0 | 0.9 | +0.9 | 1% |
| React | 13.5 | 13.2 | -0.3 | -0% |
| compositor thread | 27.3 | 24.3 | -3.1 | -3% |
| app: canvas drawing (JS) | 34.9 | 25.8 | -9.1 | -10% |
| canvas and tiles: raster and present | 376.5 | 324.0 | -52.6 | -58% |
| style, layout, paint, commit | 186.9 | 123.5 | -63.4 | -70% |
