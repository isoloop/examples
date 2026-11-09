# Plant dashboard comparison

## chromium

| Rate | Build | Workers | fps | Late frames (of ~600) | Long tasks | Typing (median) | Main-thread CPU | Renderer CPU, all threads | Renderer memory | First data | All 72 widgets | Recovery after a 3 s block | Data gap, T3 | Data gap, other machines |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 kHz | Native | 0 | 60 | 0 | 0 | 15 ms | 28% | 34% | 205 MB | 179 ms | 1.4 s | 3.2 s | 3.8 s | 3.8 s |
| 1 kHz | Native + workers | 9 | 60 | 5 | 0 | 12 ms | 37% | 45% | 248 MB | 301 ms | 1.4 s | 3.1 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 32 ms | 18% | 73% | 465 MB | 616 ms | 1.7 s | 3.2 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 32 ms | 13% | 57% | 451 MB | 297 ms | 1.4 s | 3.4 s | 3.3 s | 0.0 s |
| 1 kHz | Isoloop, shared-engines | 12 | 60 | 0 | 0 | 31 ms | 11% | 53% | 430 MB | 350 ms | 2.2 s | 3.4 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, own | 105 | 60 | 0 | 0 | 33 ms | 15% | 76% | 820 MB | 680 ms | 1.8 s | 2.4 s | 0.0 s | 0.0 s |
| 2 kHz | Native | 0 | 60 | 0 | 0 | 14 ms | 29% | 35% | 223 MB | 241 ms | 1.1 s | 3.1 s | 3.3 s | 3.3 s |
| 2 kHz | Native + workers | 9 | 60 | 0 | 0 | 6 ms | 30% | 41% | 262 MB | 306 ms | 2.2 s | 3.1 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 34 ms | 16% | 71% | 494 MB | 345 ms | 1.3 s | 3.4 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 34 ms | 14% | 66% | 481 MB | 278 ms | 1.3 s | 3.4 s | 2.9 s | 0.0 s |
| 2 kHz | Isoloop, shared-engines | 12 | 60 | 0 | 0 | 34 ms | 14% | 62% | 454 MB | 319 ms | 2.2 s | 2.4 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, own | 105 | 60 | 0 | 0 | 32 ms | 17% | 83% | 857 MB | 969 ms | 1.5 s | 2.5 s | 0.0 s | 0.0 s |
| 5 kHz | Native | 0 | 60 | 0 | 0 | 15 ms | 35% | 41% | 217 MB | 258 ms | 1.1 s | 3.1 s | 3.0 s | 3.0 s |
| 5 kHz | Native + workers | 9 | 60 | 0 | 0 | 13 ms | 34% | 45% | 268 MB | 281 ms | 2.2 s | 3.1 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 32 ms | 15% | 74% | 558 MB | 369 ms | 1.3 s | 2.6 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 41 ms | 16% | 73% | 552 MB | 429 ms | 1.4 s | 3.4 s | 2.6 s | 0.0 s |
| 5 kHz | Isoloop, shared-engines | 12 | 60 | 0 | 0 | 33 ms | 13% | 69% | 530 MB | 288 ms | 1.2 s | 3.4 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, own | 105 | 60 | 0 | 0 | 31 ms | 18% | 100% | 949 MB | 1057 ms | 2.0 s | 2.5 s | 0.0 s | 0.0 s |

## firefox

| Rate | Build | Workers | fps | Late frames (of ~600) | Long tasks | Typing (median) | Main-thread CPU | Renderer CPU, all threads | Renderer memory | First data | All 72 widgets | Recovery after a 3 s block | Data gap, T3 | Data gap, other machines |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 kHz | Native | 0 | 60 | 0 | 0 | 23 ms | – | – | – | 284 ms | 1.5 s | 3.2 s | 3.8 s | 3.8 s |
| 1 kHz | Native + workers | 9 | 60 | 0 | 0 | 21 ms | – | – | – | 321 ms | 2.2 s | 3.2 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 49 ms | – | – | – | 717 ms | 1.9 s | 3.0 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 49 ms | – | – | – | 629 ms | 1.8 s | 3.4 s | 3.3 s | 0.0 s |
| 1 kHz | Isoloop, shared-engines | 12 | 60 | 1 | 0 | 48 ms | – | – | – | 628 ms | 1.6 s | 3.3 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, own | 105 | 60 | 0 | 0 | 37 ms | – | – | – | 1066 ms | 1.9 s | 2.6 s | 0.0 s | 0.0 s |
| 2 kHz | Native | 0 | 60 | 0 | 0 | 18 ms | – | – | – | 234 ms | 1.1 s | 3.2 s | 3.3 s | 3.3 s |
| 2 kHz | Native + workers | 9 | 60 | 0 | 0 | 19 ms | – | – | – | 167 ms | 1.3 s | 3.1 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 46 ms | – | – | – | 619 ms | 2.5 s | 3.4 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 48 ms | – | – | – | 681 ms | 1.6 s | 3.4 s | 2.8 s | 0.0 s |
| 2 kHz | Isoloop, shared-engines | 12 | 60 | 0 | 0 | 48 ms | – | – | – | 515 ms | 1.5 s | 3.3 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, own | 105 | 60 | 1 | 0 | 47 ms | – | – | – | 1092 ms | 2.5 s | 2.5 s | 0.0 s | 0.0 s |
| 5 kHz | Native | 0 | 60 | 0 | 0 | 21 ms | – | – | – | 219 ms | 1.1 s | 3.2 s | 3.0 s | 3.0 s |
| 5 kHz | Native + workers | 9 | 60 | 0 | 0 | 20 ms | – | – | – | 212 ms | 1.3 s | 3.1 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, split | 18 | 60 | 0 | 0 | 48 ms | – | – | – | 614 ms | 1.6 s | 3.3 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, machine | 10 | 60 | 0 | 0 | 50 ms | – | – | – | 730 ms | 1.5 s | 3.5 s | 2.6 s | 0.0 s |
| 5 kHz | Isoloop, shared-engines | 12 | 60 | 0 | 0 | 21 ms | – | – | – | 502 ms | 2.5 s | 2.6 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, own | 105 | 60 | 0 | 0 | 48 ms | – | – | – | 932 ms | 2.5 s | 2.6 s | 0.0 s | 0.0 s |

## webkit

| Rate | Build | Workers | fps | Late frames (of ~600) | Long tasks | Typing (median) | Main-thread CPU | Renderer CPU, all threads | Renderer memory | First data | All 72 widgets | Recovery after a 3 s block | Data gap, T3 | Data gap, other machines |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 kHz | Native | 0 | 45 | 122 | 1 | 29 ms | – | – | – | 171 ms | 1.3 s | 3.2 s | 3.8 s | 3.8 s |
| 1 kHz | Native + workers | 9 | 47 | 117 | 0 | 32 ms | – | – | – | 250 ms | 2.1 s | 3.3 s | 0.0 s | 0.0 s |
| 1 kHz | Isoloop, split | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 1 kHz | Isoloop, machine | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 1 kHz | Isoloop, shared-engines | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 1 kHz | Isoloop, own | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 2 kHz | Native | 0 | 52 | 94 | 0 | 36 ms | – | – | – | 243 ms | 1.2 s | 3.2 s | 3.5 s | 3.5 s |
| 2 kHz | Native + workers | 9 | 51 | 85 | 0 | 31 ms | – | – | – | 222 ms | 2.2 s | 3.3 s | 0.0 s | 0.0 s |
| 2 kHz | Isoloop, split | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 2 kHz | Isoloop, machine | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 2 kHz | Isoloop, shared-engines | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 2 kHz | Isoloop, own | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 5 kHz | Native | 0 | 39 | 186 | 0 | 45 ms | – | – | – | 230 ms | 1.2 s | 3.3 s | 3.0 s | 3.0 s |
| 5 kHz | Native + workers | 9 | 43 | 125 | 0 | 15 ms | – | – | – | 276 ms | 1.2 s | 3.3 s | 0.0 s | 0.0 s |
| 5 kHz | Isoloop, split | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 5 kHz | Isoloop, machine | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 5 kHz | Isoloop, shared-engines | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |
| 5 kHz | Isoloop, own | – | page stopped (expect(locator).toHaveText(expected) failed) | – | – | – | – | – | – | – | – | – | – | – |

## Hypothesis (decision 10), against these runs

- **chromium, 1 kHz:** native keeps headroom (0 late frames, typing 15 ms): falsified on this machine; Isoloop split: 0 late frames, typing 32 ms; no better than native + workers (5 late frames, typing 12 ms).
- **chromium, 2 kHz:** native keeps headroom (0 late frames, typing 14 ms): falsified on this machine; Isoloop split: 0 late frames, typing 34 ms; no better than native + workers (0 late frames, typing 6 ms).
- **chromium, 5 kHz:** native keeps headroom (0 late frames, typing 15 ms): falsified on this machine; Isoloop split: 0 late frames, typing 32 ms; no better than native + workers (0 late frames, typing 13 ms).
- **firefox, 1 kHz:** native keeps headroom (0 late frames, typing 23 ms): falsified on this machine; Isoloop split: 0 late frames, typing 49 ms; no better than native + workers (0 late frames, typing 21 ms).
- **firefox, 2 kHz:** native keeps headroom (0 late frames, typing 18 ms): falsified on this machine; Isoloop split: 0 late frames, typing 46 ms; no better than native + workers (0 late frames, typing 19 ms).
- **firefox, 5 kHz:** native keeps headroom (0 late frames, typing 21 ms): falsified on this machine; Isoloop split: 0 late frames, typing 48 ms; no better than native + workers (0 late frames, typing 20 ms).
- **webkit, 1 kHz:** native loses headroom (122 late frames, typing 29 ms); Isoloop split: page stopped.
- **webkit, 2 kHz:** native loses headroom (94 late frames, typing 36 ms); Isoloop split: page stopped.
- **webkit, 5 kHz:** native loses headroom (186 late frames, typing 45 ms); Isoloop split: page stopped.

