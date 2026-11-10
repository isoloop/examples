# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-10T09:40:04.466Z",
  "args": {
    "pair": [
      "native=isoloop:one",
      "native-workers=isoloop:matched"
    ],
    "extra": [
      "isoloop:split"
    ],
    "rates": "1",
    "rounds": "3",
    "hold": "600",
    "engines": "chromium",
    "out": "comparison/matched/memory",
    "warm": "6",
    "window": "10",
    "summary-only": false
  },
  "configs": [
    "native",
    "isoloop:one",
    "native-workers",
    "isoloop:matched",
    "isoloop:split"
  ],
  "cpus": "2,4,6,8"
}
```

Each pair ran interleaved (A, B, A, B…), one page at a time. **Gap** is B minus A within each round; the table gives its median over the rounds, as a share of A’s median, and its spread (lowest to highest round). Medians of A and B are over the rounds too. Stopped runs are left out and counted.

## chromium, 1 kHz

### native (A) vs isoloop:one (B)

Rounds: A 3/3 ran, B 3/3 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 33 ms | 26 ms | -7 ms | -21% | -14 ms to +10 ms |
| Main-thread CPU | 68% | 25% | -43 pp | -63% | -43 pp to -43 pp |
| CPU, all threads | 78% | 90% | +12 pp | +16% | +12 pp to +15 pp |
| Memory, first reading | 193 MB | 286 MB | +91 MB | +47% | +89 MB to +96 MB |
| Memory, first reading, after GC | 150 MB | 193 MB | +43 MB | +29% | +38 MB to +43 MB |
| Memory at hold | 270 MB | 339 MB | +70 MB | +26% | +67 MB to +74 MB |
| Memory at hold, after GC | 179 MB | 214 MB | +35 MB | +20% | +33 MB to +39 MB |
| First data | 243 ms | 506 ms | +284 ms | +117% | +174 ms to +401 ms |
| All 72 widgets with data | 1380 ms | 2387 ms | +1020 ms | +74% | +905 ms to +1040 ms |
| Recovery after a 3 s block | 3253 ms | 5508 ms | +2258 ms | +69% | +2253 ms to +2324 ms |
| Data gap, T3 | 3.8 s | 5.6 s | +1.8 s | +47% | +1.8 s to +1.8 s |
| Data gap, other machines | 3.8 s | 5.6 s | +1.8 s | +47% | +1.8 s to +1.8 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 3/3 ran, B 3/3 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 35 ms | 42 ms | +1 ms | +3% | -10 ms to +7 ms |
| Main-thread CPU | 69% | 26% | -43 pp | -63% | -47 pp to -41 pp |
| CPU, all threads | 84% | 102% | +18 pp | +22% | +9 pp to +19 pp |
| Memory, first reading | 259 MB | 360 MB | +105 MB | +41% | +87 MB to +108 MB |
| Memory, first reading, after GC | 191 MB | 240 MB | +49 MB | +26% | +48 MB to +49 MB |
| Memory at hold | 387 MB | 602 MB | +220 MB | +57% | +205 MB to +225 MB |
| Memory at hold, after GC | 246 MB | 268 MB | +25 MB | +10% | +21 MB to +26 MB |
| First data | 300 ms | 642 ms | +345 ms | +115% | +286 ms to +351 ms |
| All 72 widgets with data | 2222 ms | 1722 ms | -550 ms | -25% | -675 ms to +298 ms |
| Recovery after a 3 s block | 3183 ms | 2876 ms | -280 ms | -9% | -362 ms to +435 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 20 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 111% |
| Memory, first reading | 386 MB |
| Memory, first reading, after GC | 288 MB |
| Memory at hold | 875 MB |
| Memory at hold, after GC | 328 MB |
| First data | 850 ms |
| All 72 widgets with data | 1826 ms |
| Recovery after a 3 s block | 3254 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

