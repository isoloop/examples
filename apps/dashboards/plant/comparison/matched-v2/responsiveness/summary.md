# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-12T11:00:55.307Z",
  "args": {
    "pair": [
      "native=isoloop:one",
      "native-workers=isoloop:matched"
    ],
    "extra": [
      "isoloop:split"
    ],
    "rates": "1,5",
    "rounds": "5",
    "hold": "0",
    "engines": "chromium,firefox",
    "out": "comparison/matched-v2/responsiveness",
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

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 35 ms | 43 ms | +8 ms | +23% | -64 ms to +12 ms |
| Main-thread CPU | 70% | 24% | -45 pp | -65% | -53 pp to -44 pp |
| CPU, all threads | 80% | 88% | +9 pp | +11% | +3 pp to +13 pp |
| Memory, first reading | 170 MB | 245 MB | +75 MB | +44% | +72 MB to +81 MB |
| Memory, first reading, after GC | 156 MB | 185 MB | +30 MB | +19% | +27 MB to +34 MB |
| First data | 238 ms | 512 ms | +264 ms | +111% | +211 ms to +340 ms |
| All 72 widgets with data | 1274 ms | 2367 ms | +1089 ms | +85% | +277 ms to +1179 ms |
| Recovery after a 3 s block | 3151 ms | 3434 ms | +285 ms | +9% | +245 ms to +338 ms |
| Data gap, T3 | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 33 ms | 28 ms | -5 ms | -15% | -29 ms to +11 ms |
| Main-thread CPU | 70% | 26% | -44 pp | -63% | -53 pp to -41 pp |
| CPU, all threads | 86% | 95% | +10 pp | +11% | -2 pp to +13 pp |
| Memory, first reading | 212 MB | 303 MB | +90 MB | +42% | +76 MB to +103 MB |
| Memory, first reading, after GC | 191 MB | 239 MB | +47 MB | +25% | +43 MB to +49 MB |
| First data | 321 ms | 535 ms | +229 ms | +71% | +187 ms to +338 ms |
| All 72 widgets with data | 2284 ms | 1727 ms | +105 ms | +5% | -647 ms to +217 ms |
| Recovery after a 3 s block | 3138 ms | 2862 ms | -299 ms | -10% | -435 ms to -53 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 33 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 110% |
| Memory, first reading | 333 MB |
| Memory, first reading, after GC | 285 MB |
| First data | 816 ms |
| All 72 widgets with data | 1701 ms |
| Recovery after a 3 s block | 3328 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## chromium, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 68 ms | 22 ms | -45 ms | -66% | -69 ms to -29 ms |
| Main-thread CPU | 82% | 23% | -59 pp | -72% | -64 pp to -58 pp |
| CPU, all threads | 93% | 110% | +17 pp | +18% | +12 pp to +22 pp |
| Memory, first reading | 185 MB | 274 MB | +83 MB | +45% | +82 MB to +98 MB |
| Memory, first reading, after GC | 161 MB | 198 MB | +38 MB | +24% | +34 MB to +43 MB |
| First data | 290 ms | 502 ms | +276 ms | +95% | +178 ms to +361 ms |
| All 72 widgets with data | 1154 ms | 2368 ms | +1214 ms | +105% | +1147 ms to +1230 ms |
| Recovery after a 3 s block | 3194 ms | 3426 ms | +232 ms | +7% | +203 ms to +348 ms |
| Data gap, T3 | 3.0 s | 2.5 s | -0.5 s | -17% | -0.6 s to -0.4 s |
| Data gap, other machines | 3.1 s | 2.5 s | -0.5 s | -16% | -0.6 s to -0.4 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -31 to 0 |
| Typing (median of 5) | 51 ms | 25 ms | -28 ms | -55% | -76 ms to -14 ms |
| Main-thread CPU | 80% | 26% | -54 pp | -67% | -73 pp to -51 pp |
| CPU, all threads | 98% | 120% | +18 pp | +19% | -0 pp to +27 pp |
| Memory, first reading | 246 MB | 352 MB | +107 MB | +43% | +90 MB to +113 MB |
| Memory, first reading, after GC | 220 MB | 281 MB | +60 MB | +27% | +50 MB to +63 MB |
| First data | 339 ms | 575 ms | +255 ms | +75% | +182 ms to +327 ms |
| All 72 widgets with data | 2305 ms | 1526 ms | -687 ms | -30% | -784 ms to +181 ms |
| Recovery after a 3 s block | 3183 ms | 2895 ms | -334 ms | -10% | -370 ms to -199 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 31 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 134% |
| Memory, first reading | 405 MB |
| Memory, first reading, after GC | 329 MB |
| First data | 862 ms |
| All 72 widgets with data | 1702 ms |
| Recovery after a 3 s block | 3317 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 1 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 19 | 0 | -19 | -100% | -54 to -13 |
| Typing (median of 5) | 123 ms | 76 ms | -43 ms | -35% | -67 ms to -19 ms |
| First data | 326 ms | 775 ms | +443 ms | +136% | +221 ms to +533 ms |
| All 72 widgets with data | 1455 ms | 2629 ms | +1209 ms | +83% | +1003 ms to +1276 ms |
| Recovery after a 3 s block | 3333 ms | 3644 ms | +309 ms | +9% | +240 ms to +404 ms |
| Data gap, T3 | 3.8 s | 3.6 s | -0.2 s | -5% | -0.2 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.6 s | -0.2 s | -5% | -0.2 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 15 | 0 | -15 | -100% | -20 to -7 |
| Typing (median of 5) | 111 ms | 77 ms | -21 ms | -19% | -57 ms to -6 ms |
| First data | 434 ms | 1010 ms | +602 ms | +139% | +438 ms to +663 ms |
| All 72 widgets with data | 2432 ms | 2098 ms | -289 ms | -12% | -451 ms to +304 ms |
| Recovery after a 3 s block | 3364 ms | 3445 ms | +142 ms | +4% | +52 ms to +481 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 6 |
| Typing (median of 5) | 83 ms |
| First data | 1277 ms |
| All 72 widgets with data | 2447 ms |
| Recovery after a 3 s block | 3511 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 122 | 0 | -122 | -100% | -174 to -117 |
| Typing (median of 5) | 130 ms | 107 ms | -25 ms | -19% | -77 ms to +3 ms |
| First data | 335 ms | 801 ms | +469 ms | +140% | +240 ms to +488 ms |
| All 72 widgets with data | 1273 ms | 2636 ms | +1385 ms | +109% | +1347 ms to +1419 ms |
| Recovery after a 3 s block | 3361 ms | 3698 ms | +366 ms | +11% | +238 ms to +393 ms |
| Data gap, T3 | 3.1 s | 2.8 s | -0.3 s | -10% | -0.4 s to -0.3 s |
| Data gap, other machines | 3.1 s | 2.8 s | -0.3 s | -10% | -0.4 s to -0.3 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 85 | 2 | -83 | -98% | -89 to -78 |
| Typing (median of 5) | 124 ms | 94 ms | -31 ms | -25% | -57 ms to -18 ms |
| First data | 484 ms | 1008 ms | +527 ms | +109% | +471 ms to +546 ms |
| All 72 widgets with data | 1449 ms | 1863 ms | +404 ms | +28% | -580 ms to +1279 ms |
| Recovery after a 3 s block | 3437 ms | 3722 ms | +325 ms | +9% | +151 ms to +415 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 15 |
| Typing (median of 5) | 96 ms |
| First data | 1258 ms |
| All 72 widgets with data | 2264 ms |
| Recovery after a 3 s block | 3443 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

