
### native-workers (A) vs isoloop:matched (B), 5 kHz, 4/4 runs

Renderer CPU: A 1005 ms/s, B 1299 ms/s, gap +294 ms/s. Main thread A 829, B 264; workers A 84 (9), B 933 (11); other renderer threads A 96, B 105. Kernel time within it A 37, B 69 (on worker threads A 12, B 36). GPU process A 287, B 347; browser process A 2, B 3. Trace-event coverage of busy threads: A 90%, B 90%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 16.6 | 95.2 | +78.6 | 27% |
| canvas and tiles: raster and present | 454.3 | 518.6 | +64.3 | 22% |
| not covered by trace events (JS threads) | 16.8 | 66.7 | +49.9 | 17% |
| host: other | 0.0 | 27.5 | +27.5 | 9% |
| tasks and scheduling (other native) | 63.3 | 87.8 | +24.5 | 8% |
| runtime: bus client | 0.0 | 23.8 | +23.8 | 8% |
| messaging: postMessage (serialize) | 2.5 | 26.2 | +23.7 | 8% |
| bus: broker | 0.0 | 16.5 | +16.5 | 6% |
| app: metrics panels | 7.3 | 17.6 | +10.3 | 3% |
| JS: browser API calls | 22.0 | 30.3 | +8.4 | 3% |
| host: patch apply | 0.0 | 5.7 | +5.7 | 2% |
| app: widgets and page | 9.2 | 14.5 | +5.3 | 2% |
| animation frames in workers | 0.0 | 4.9 | +4.9 | 2% |
| runtime: other | 0.0 | 4.9 | +4.9 | 2% |
| React | 19.4 | 23.2 | +3.8 | 1% |
| host: bus controller | 0.0 | 2.9 | +2.9 | 1% |
| GC | 22.7 | 25.5 | +2.8 | 1% |
| bus: schema validation | 0.0 | 1.9 | +1.9 | 1% |
| not covered by trace events (other threads) | 17.0 | 18.3 | +1.4 | 0% |
| protocol guards | 0.0 | 1.3 | +1.3 | 0% |
| app: feeds and engines | 58.3 | 58.1 | -0.2 | -0% |
| compositor thread | 25.7 | 21.1 | -4.5 | -2% |
| app: canvas drawing (JS) | 80.3 | 64.2 | -16.1 | -5% |
| style, layout, paint, commit | 202.4 | 146.3 | -56.1 | -19% |

### native (A) vs isoloop:one (B), 5 kHz, 4/4 runs

Renderer CPU: A 1015 ms/s, B 1110 ms/s, gap +95 ms/s. Main thread A 915, B 244; workers A 0 (0), B 741 (2); other renderer threads A 103, B 128. Kernel time within it A 24, B 60 (on worker threads A 0, B 24). GPU process A 281, B 340; browser process A 1, B 2. Trace-event coverage of busy threads: A 92%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 5.4 | 88.7 | +83.2 | 88% |
| not covered by trace events (JS threads) | 8.7 | 46.8 | +38.1 | 40% |
| app: feeds and engines | 60.6 | 96.6 | +35.9 | 38% |
| tasks and scheduling (other native) | 60.3 | 94.6 | +34.3 | 36% |
| host: other | 0.0 | 28.4 | +28.4 | 30% |
| bus: broker | 0.0 | 15.7 | +15.7 | 17% |
| runtime: bus client | 0.0 | 14.2 | +14.2 | 15% |
| messaging: postMessage (serialize) | 0.6 | 13.9 | +13.4 | 14% |
| GC | 21.2 | 31.7 | +10.4 | 11% |
| app: metrics panels | 7.2 | 17.0 | +9.9 | 10% |
| JS: browser API calls | 20.1 | 29.1 | +9.0 | 9% |
| host: patch apply | 0.0 | 8.1 | +8.1 | 9% |
| animation frames in workers | 0.0 | 4.3 | +4.3 | 5% |
| app: widgets and page | 7.3 | 10.9 | +3.7 | 4% |
| runtime: other | 0.0 | 3.3 | +3.3 | 3% |
| host: bus controller | 0.0 | 2.3 | +2.3 | 2% |
| bus: schema validation | 0.0 | 1.8 | +1.8 | 2% |
| not covered by trace events (other threads) | 16.9 | 18.6 | +1.8 | 2% |
| protocol guards | 0.0 | 0.9 | +0.9 | 1% |
| React | 17.4 | 16.5 | -1.0 | -1% |
| compositor thread | 25.2 | 23.1 | -2.1 | -2% |
| app: canvas drawing (JS) | 78.3 | 47.6 | -30.7 | -32% |
| style, layout, paint, commit | 199.0 | 120.6 | -78.4 | -83% |
| canvas and tiles: raster and present | 476.1 | 394.1 | -82.0 | -86% |

### native-workers (A) vs isoloop:matched (B), 1 kHz, 4/4 runs

Renderer CPU: A 846 ms/s, B 933 ms/s, gap +87 ms/s. Main thread A 700, B 261; workers A 44 (9), B 574 (11); other renderer threads A 100, B 98. Kernel time within it A 31, B 61 (on worker threads A 7, B 29). GPU process A 290, B 321; browser process A 2, B 3. Trace-event coverage of busy threads: A 94%, B 94%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 13.1 | 75.0 | +61.9 | 71% |
| not covered by trace events (JS threads) | 18.6 | 55.3 | +36.7 | 42% |
| host: other | 0.0 | 28.8 | +28.8 | 33% |
| runtime: bus client | 0.0 | 15.4 | +15.4 | 18% |
| messaging: postMessage (serialize) | 2.3 | 16.0 | +13.7 | 16% |
| tasks and scheduling (other native) | 66.5 | 79.8 | +13.3 | 15% |
| bus: broker | 0.0 | 11.9 | +11.9 | 14% |
| app: metrics panels | 8.1 | 16.6 | +8.6 | 10% |
| React | 13.3 | 19.7 | +6.4 | 7% |
| host: patch apply | 0.0 | 6.3 | +6.3 | 7% |
| runtime: other | 0.0 | 5.0 | +5.0 | 6% |
| animation frames in workers | 0.0 | 3.7 | +3.7 | 4% |
| host: bus controller | 0.0 | 3.7 | +3.7 | 4% |
| app: widgets and page | 7.7 | 9.9 | +2.3 | 3% |
| not covered by trace events (other threads) | 13.8 | 15.8 | +2.0 | 2% |
| JS: browser API calls | 20.9 | 22.7 | +1.8 | 2% |
| bus: schema validation | 0.0 | 1.6 | +1.6 | 2% |
| worker DOM and recorder | 0.0 | 0.9 | +0.9 | 1% |
| protocol guards | 0.0 | 0.8 | +0.8 | 1% |
| GC | 14.3 | 14.7 | +0.4 | 0% |
| app: feeds and engines | 25.6 | 19.2 | -6.5 | -7% |
| compositor thread | 29.1 | 21.5 | -7.6 | -9% |
| app: canvas drawing (JS) | 34.0 | 23.8 | -10.3 | -12% |
| canvas and tiles: raster and present | 378.0 | 340.6 | -37.4 | -43% |
| style, layout, paint, commit | 200.5 | 144.8 | -55.8 | -64% |

### native (A) vs isoloop:one (B), 1 kHz, 4/4 runs

Renderer CPU: A 789 ms/s, B 881 ms/s, gap +92 ms/s. Main thread A 696, B 246; workers A 0 (0), B 530 (2); other renderer threads A 94, B 109. Kernel time within it A 22, B 49 (on worker threads A 0, B 16). GPU process A 289, B 341; browser process A 1, B 2. Trace-event coverage of busy threads: A 92%, B 92%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 6.2 | 70.6 | +64.4 | 70% |
| not covered by trace events (JS threads) | 9.9 | 43.6 | +33.7 | 37% |
| host: other | 0.0 | 26.6 | +26.6 | 29% |
| tasks and scheduling (other native) | 52.0 | 71.0 | +19.0 | 21% |
| app: metrics panels | 7.4 | 24.7 | +17.2 | 19% |
| runtime: bus client | 0.0 | 9.7 | +9.7 | 11% |
| host: patch apply | 0.0 | 9.5 | +9.5 | 10% |
| bus: broker | 0.0 | 9.4 | +9.4 | 10% |
| messaging: postMessage (serialize) | 0.4 | 9.4 | +9.1 | 10% |
| app: feeds and engines | 20.3 | 27.3 | +7.1 | 8% |
| GC | 14.5 | 19.2 | +4.7 | 5% |
| JS: browser API calls | 20.3 | 24.8 | +4.5 | 5% |
| animation frames in workers | 0.0 | 3.9 | +3.9 | 4% |
| not covered by trace events (other threads) | 14.6 | 18.4 | +3.7 | 4% |
| runtime: other | 0.0 | 3.3 | +3.3 | 4% |
| app: widgets and page | 6.5 | 9.7 | +3.3 | 4% |
| host: bus controller | 0.0 | 2.0 | +2.0 | 2% |
| React | 13.7 | 15.0 | +1.3 | 1% |
| bus: schema validation | 0.0 | 1.1 | +1.1 | 1% |
| protocol guards | 0.0 | 0.6 | +0.6 | 1% |
| compositor thread | 27.8 | 24.0 | -3.7 | -4% |
| app: canvas drawing (JS) | 35.6 | 24.8 | -10.7 | -12% |
| canvas and tiles: raster and present | 376.5 | 319.3 | -57.2 | -62% |
| style, layout, paint, commit | 196.4 | 124.1 | -72.3 | -79% |
