# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-10T14:19:32.778Z",
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
    "out": "comparison/matched-q6/memory",
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
| Typing (median of 5) | 40 ms | 23 ms | -17 ms | -42% | -28 ms to -9 ms |
| Main-thread CPU | 73% | 24% | -49 pp | -67% | -53 pp to -45 pp |
| CPU, all threads | 83% | 89% | +7 pp | +8% | 0 pp to +10 pp |
| Memory, first reading | 198 MB | 286 MB | +90 MB | +45% | +84 MB to +106 MB |
| Memory, first reading, after GC | 158 MB | 188 MB | +32 MB | +20% | +27 MB to +35 MB |
| Memory at hold | 280 MB | 386 MB | +106 MB | +38% | +60 MB to +116 MB |
| Memory at hold, after GC | 182 MB | 220 MB | +39 MB | +21% | +34 MB to +39 MB |
| First data | 288 ms | 472 ms | +188 ms | +65% | +141 ms to +199 ms |
| All 72 widgets with data | 1369 ms | 2396 ms | +1032 ms | +75% | +1003 ms to +1091 ms |
| Recovery after a 3 s block | 3205 ms | 5533 ms | +2337 ms | +73% | +2263 ms to +2356 ms |
| Data gap, T3 | 3.8 s | 5.9 s | +2.1 s | +55% | +2.1 s to +2.1 s |
| Data gap, other machines | 3.8 s | 5.9 s | +2.1 s | +55% | +2.1 s to +2.1 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 3/3 ran, B 3/3 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 47 ms | 21 ms | -18 ms | -38% | -30 ms to -16 ms |
| Main-thread CPU | 69% | 26% | -44 pp | -63% | -46 pp to -42 pp |
| CPU, all threads | 85% | 94% | +12 pp | +14% | +10 pp to +15 pp |
| Memory, first reading | 264 MB | 362 MB | +98 MB | +37% | +97 MB to +111 MB |
| Memory, first reading, after GC | 192 MB | 243 MB | +51 MB | +27% | +41 MB to +52 MB |
| Memory at hold | 393 MB | 595 MB | +202 MB | +51% | +191 MB to +205 MB |
| Memory at hold, after GC | 251 MB | 271 MB | +21 MB | +8% | +20 MB to +22 MB |
| First data | 324 ms | 621 ms | +279 ms | +86% | +276 ms to +326 ms |
| All 72 widgets with data | 1642 ms | 1741 ms | +99 ms | +6% | -533 ms to +200 ms |
| Recovery after a 3 s block | 3214 ms | 3085 ms | -85 ms | -3% | -307 ms to +273 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 47 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 110% |
| Memory, first reading | 386 MB |
| Memory, first reading, after GC | 286 MB |
| Memory at hold | 834 MB |
| Memory at hold, after GC | 327 MB |
| First data | 835 ms |
| All 72 widgets with data | 1749 ms |
| Recovery after a 3 s block | 3234 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

