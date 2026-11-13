
### native-workers (A) vs isoloop:matched (B), 5 kHz, 6/6 runs

Renderer CPU: A 996 ms/s, B 1145 ms/s, gap +149 ms/s. Main thread A 815, B 270; workers A 82 (9), B 774 (11); other renderer threads A 98, B 99. Kernel time within it A 36, B 70 (on worker threads A 13, B 37). GPU process A 284, B 336; browser process A 2, B 4. Trace-event coverage of busy threads: A 89%, B 92%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 16.9 | 87.5 | +70.6 | 47% |
| not covered by trace events (JS threads) | 17.3 | 53.0 | +35.7 | 24% |
| tasks and scheduling (other native) | 65.7 | 89.7 | +24.0 | 16% |
| runtime: bus client | 0.0 | 23.6 | +23.6 | 16% |
| host: other | 0.0 | 23.3 | +23.3 | 16% |
| messaging: postMessage (serialize) | 2.7 | 21.9 | +19.3 | 13% |
| bus: broker | 0.0 | 13.7 | +13.7 | 9% |
| JS: browser API calls | 21.5 | 34.0 | +12.5 | 8% |
| app: metrics panels | 7.8 | 18.9 | +11.1 | 7% |
| host: patch apply | 0.0 | 5.9 | +5.9 | 4% |
| runtime: other | 0.0 | 5.3 | +5.3 | 4% |
| animation frames in workers | 0.0 | 4.7 | +4.7 | 3% |
| React | 19.7 | 23.9 | +4.2 | 3% |
| host: bus controller | 0.0 | 2.6 | +2.6 | 2% |
| protocol guards | 0.0 | 2.4 | +2.4 | 2% |
| bus: schema validation | 0.0 | 1.6 | +1.6 | 1% |
| not covered by trace events (other threads) | 16.0 | 17.4 | +1.4 | 1% |
| app: widgets and page | 8.8 | 8.1 | -0.7 | -0% |
| GC | 23.9 | 21.8 | -2.1 | -1% |
| compositor thread | 25.8 | 21.4 | -4.4 | -3% |
| app: canvas drawing (JS) | 78.7 | 65.3 | -13.4 | -9% |
| app: feeds and engines | 58.4 | 36.3 | -22.1 | -15% |
| canvas and tiles: raster and present | 440.1 | 408.4 | -31.7 | -21% |
| style, layout, paint, commit | 201.3 | 150.9 | -50.5 | -34% |

### native (A) vs isoloop:one (B), 5 kHz, 4/4 runs

Renderer CPU: A 976 ms/s, B 1075 ms/s, gap +99 ms/s. Main thread A 867, B 242; workers A 0 (0), B 706 (2); other renderer threads A 104, B 129. Kernel time within it A 26, B 58 (on worker threads A 0, B 23). GPU process A 284, B 343; browser process A 1, B 2. Trace-event coverage of busy threads: A 94%, B 92%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 5.6 | 81.4 | +75.9 | 77% |
| not covered by trace events (JS threads) | 5.2 | 42.3 | +37.0 | 37% |
| tasks and scheduling (other native) | 59.3 | 95.8 | +36.5 | 37% |
| host: other | 0.0 | 23.0 | +23.0 | 23% |
| app: metrics panels | 6.6 | 23.5 | +16.9 | 17% |
| runtime: bus client | 0.0 | 15.9 | +15.9 | 16% |
| bus: broker | 0.0 | 12.5 | +12.5 | 13% |
| messaging: postMessage (serialize) | 0.5 | 11.6 | +11.1 | 11% |
| GC | 21.4 | 32.1 | +10.8 | 11% |
| JS: browser API calls | 20.0 | 30.6 | +10.7 | 11% |
| host: patch apply | 0.0 | 8.6 | +8.6 | 9% |
| animation frames in workers | 0.0 | 4.2 | +4.2 | 4% |
| runtime: other | 0.0 | 3.1 | +3.1 | 3% |
| not covered by trace events (other threads) | 15.0 | 17.8 | +2.9 | 3% |
| host: bus controller | 0.0 | 2.6 | +2.6 | 3% |
| bus: schema validation | 0.0 | 1.4 | +1.4 | 1% |
| protocol guards | 0.0 | 1.2 | +1.2 | 1% |
| app: widgets and page | 7.9 | 8.8 | +1.0 | 1% |
| React | 18.1 | 18.8 | +0.7 | 1% |
| compositor thread | 25.4 | 22.6 | -2.8 | -3% |
| app: feeds and engines | 61.6 | 50.9 | -10.7 | -11% |
| app: canvas drawing (JS) | 77.0 | 61.8 | -15.3 | -15% |
| canvas and tiles: raster and present | 443.2 | 395.1 | -48.1 | -49% |
| style, layout, paint, commit | 208.8 | 124.1 | -84.7 | -86% |

### native-workers (A) vs isoloop:matched (B), 1 kHz, 4/4 runs

Renderer CPU: A 848 ms/s, B 913 ms/s, gap +65 ms/s. Main thread A 701, B 264; workers A 45 (9), B 563 (11); other renderer threads A 100, B 96. Kernel time within it A 31, B 63 (on worker threads A 8, B 30). GPU process A 288, B 320; browser process A 2, B 3. Trace-event coverage of busy threads: A 96%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 13.8 | 73.2 | +59.5 | 91% |
| not covered by trace events (JS threads) | 19.5 | 52.8 | +33.3 | 51% |
| host: other | 0.0 | 27.6 | +27.6 | 42% |
| tasks and scheduling (other native) | 66.8 | 84.6 | +17.7 | 27% |
| runtime: bus client | 0.0 | 15.7 | +15.7 | 24% |
| messaging: postMessage (serialize) | 2.1 | 16.1 | +14.0 | 22% |
| bus: broker | 0.0 | 10.7 | +10.7 | 16% |
| JS: browser API calls | 18.6 | 27.8 | +9.2 | 14% |
| host: patch apply | 0.0 | 7.1 | +7.1 | 11% |
| app: metrics panels | 8.1 | 12.8 | +4.7 | 7% |
| runtime: other | 0.0 | 4.7 | +4.7 | 7% |
| React | 13.4 | 17.7 | +4.3 | 7% |
| animation frames in workers | 0.0 | 3.7 | +3.7 | 6% |
| host: bus controller | 0.0 | 3.1 | +3.1 | 5% |
| GC | 15.0 | 17.5 | +2.5 | 4% |
| bus: schema validation | 0.0 | 1.6 | +1.6 | 2% |
| protocol guards | 0.0 | 1.4 | +1.4 | 2% |
| not covered by trace events (other threads) | 14.0 | 15.4 | +1.4 | 2% |
| worker DOM and recorder | 0.0 | 0.5 | +0.5 | 1% |
| app: widgets and page | 7.3 | 6.8 | -0.6 | -1% |
| compositor thread | 28.0 | 21.0 | -7.0 | -11% |
| app: canvas drawing (JS) | 36.1 | 24.1 | -12.0 | -18% |
| app: feeds and engines | 26.8 | 12.8 | -14.0 | -22% |
| style, layout, paint, commit | 194.7 | 144.8 | -49.9 | -77% |
| canvas and tiles: raster and present | 391.2 | 335.4 | -55.9 | -86% |

### native (A) vs isoloop:one (B), 1 kHz, 4/4 runs

Renderer CPU: A 803 ms/s, B 901 ms/s, gap +98 ms/s. Main thread A 710, B 243; workers A 0 (0), B 538 (2); other renderer threads A 94, B 111. Kernel time within it A 24, B 49 (on worker threads A 0, B 14). GPU process A 291, B 348; browser process A 1, B 3. Trace-event coverage of busy threads: A 93%, B 93%.

| Bucket | A ms/s | B ms/s | B − A | Share of gap |
| --- | --- | --- | --- | --- |
| messaging: serialize, deserialize, IPC | 6.1 | 67.8 | +61.8 | 63% |
| not covered by trace events (JS threads) | 7.7 | 50.3 | +42.6 | 43% |
| host: other | 0.0 | 29.6 | +29.6 | 30% |
| tasks and scheduling (other native) | 53.4 | 77.1 | +23.6 | 24% |
| app: metrics panels | 7.3 | 21.9 | +14.6 | 15% |
| JS: browser API calls | 21.0 | 31.2 | +10.2 | 10% |
| runtime: bus client | 0.0 | 10.0 | +10.0 | 10% |
| bus: broker | 0.0 | 8.2 | +8.2 | 8% |
| host: patch apply | 0.0 | 7.6 | +7.6 | 8% |
| messaging: postMessage (serialize) | 0.3 | 7.5 | +7.2 | 7% |
| GC | 13.6 | 19.4 | +5.8 | 6% |
| animation frames in workers | 0.0 | 4.1 | +4.1 | 4% |
| runtime: other | 0.0 | 3.1 | +3.1 | 3% |
| host: bus controller | 0.0 | 3.0 | +3.0 | 3% |
| not covered by trace events (other threads) | 15.2 | 17.9 | +2.7 | 3% |
| React | 13.6 | 14.7 | +1.1 | 1% |
| app: widgets and page | 6.5 | 7.5 | +1.0 | 1% |
| protocol guards | 0.0 | 0.9 | +0.9 | 1% |
| bus: schema validation | 0.0 | 0.9 | +0.9 | 1% |
| compositor thread | 27.9 | 25.1 | -2.8 | -3% |
| app: canvas drawing (JS) | 34.9 | 29.3 | -5.6 | -6% |
| app: feeds and engines | 21.2 | 14.6 | -6.6 | -7% |
| canvas and tiles: raster and present | 385.6 | 340.5 | -45.1 | -46% |
| style, layout, paint, commit | 197.0 | 115.5 | -81.5 | -83% |
