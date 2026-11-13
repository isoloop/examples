# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-13T14:07:14.496Z",
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
    "out": "comparison/final/responsiveness",
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
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 33 ms | 22 ms | -12 ms | -36% | -37 ms to +3 ms |
| Main-thread CPU | 68% | 24% | -45 pp | -66% | -53 pp to -44 pp |
| CPU, all threads | 78% | 87% | +7 pp | +9% | +4 pp to +10 pp |
| Memory, first reading | 168 MB | 247 MB | +78 MB | +46% | +70 MB to +89 MB |
| Memory, first reading, after GC | 155 MB | 190 MB | +36 MB | +23% | +32 MB to +38 MB |
| First data | 282 ms | 556 ms | +305 ms | +108% | +218 ms to +344 ms |
| All 72 widgets with data | 1339 ms | 2366 ms | +1030 ms | +77% | +160 ms to +1076 ms |
| Recovery after a 3 s block | 3182 ms | 3398 ms | +216 ms | +7% | +168 ms to +372 ms |
| Data gap, T3 | 3.8 s | 3.3 s | -0.5 s | -13% | -0.8 s to -0.3 s |
| Data gap, other machines | 3.8 s | 3.3 s | -0.5 s | -13% | -0.8 s to -0.5 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 46 ms | 32 ms | -8 ms | -17% | -23 ms to -1 ms |
| Main-thread CPU | 69% | 26% | -44 pp | -64% | -51 pp to -42 pp |
| CPU, all threads | 84% | 95% | +11 pp | +13% | +2 pp to +17 pp |
| Memory, first reading | 214 MB | 291 MB | +78 MB | +36% | +77 MB to +79 MB |
| Memory, first reading, after GC | 191 MB | 232 MB | +41 MB | +21% | +33 MB to +46 MB |
| First data | 391 ms | 663 ms | +307 ms | +79% | +119 ms to +348 ms |
| All 72 widgets with data | 2280 ms | 1624 ms | -568 ms | -25% | -657 ms to +200 ms |
| Recovery after a 3 s block | 3141 ms | 2923 ms | -218 ms | -7% | -401 ms to +412 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 26 ms |
| Main-thread CPU | 27% |
| CPU, all threads | 108% |
| Memory, first reading | 326 MB |
| Memory, first reading, after GC | 286 MB |
| First data | 831 ms |
| All 72 widgets with data | 1824 ms |
| Recovery after a 3 s block | 2688 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## chromium, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 82 ms | 21 ms | -55 ms | -67% | -84 ms to -44 ms |
| Main-thread CPU | 84% | 23% | -60 pp | -71% | -66 pp to -59 pp |
| CPU, all threads | 95% | 107% | +11 pp | +12% | +8 pp to +14 pp |
| Memory, first reading | 190 MB | 275 MB | +80 MB | +42% | +72 MB to +106 MB |
| Memory, first reading, after GC | 164 MB | 203 MB | +40 MB | +24% | +33 MB to +43 MB |
| First data | 286 ms | 473 ms | +187 ms | +65% | +119 ms to +265 ms |
| All 72 widgets with data | 1178 ms | 2373 ms | +1195 ms | +101% | +1092 ms to +1233 ms |
| Recovery after a 3 s block | 3208 ms | 3524 ms | +316 ms | +10% | +204 ms to +369 ms |
| Data gap, T3 | 3.0 s | 2.6 s | -0.4 s | -13% | -0.5 s to -0.4 s |
| Data gap, other machines | 3.0 s | 2.6 s | -0.5 s | -17% | -0.5 s to -0.4 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 62 ms | 41 ms | -28 ms | -45% | -41 ms to -14 ms |
| Main-thread CPU | 79% | 27% | -53 pp | -67% | -55 pp to -51 pp |
| CPU, all threads | 97% | 116% | +19 pp | +19% | +16 pp to +29 pp |
| Memory, first reading | 247 MB | 354 MB | +108 MB | +44% | +106 MB to +118 MB |
| Memory, first reading, after GC | 222 MB | 275 MB | +51 MB | +23% | +49 MB to +60 MB |
| First data | 345 ms | 680 ms | +294 ms | +85% | +270 ms to +422 ms |
| All 72 widgets with data | 2294 ms | 1536 ms | -719 ms | -31% | -793 ms to +1019 ms |
| Recovery after a 3 s block | 3180 ms | 2934 ms | -246 ms | -8% | -411 ms to -118 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 31 ms |
| Main-thread CPU | 29% |
| CPU, all threads | 131% |
| Memory, first reading | 410 MB |
| Memory, first reading, after GC | 326 MB |
| First data | 912 ms |
| All 72 widgets with data | 1669 ms |
| Recovery after a 3 s block | 3388 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 1 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 22 | 0 | -22 | -100% | -45 to -16 |
| Typing (median of 5) | 113 ms | 89 ms | -19 ms | -17% | -47 ms to -12 ms |
| First data | 323 ms | 795 ms | +472 ms | +146% | +295 ms to +576 ms |
| All 72 widgets with data | 1369 ms | 2549 ms | +1207 ms | +88% | +1024 ms to +1274 ms |
| Recovery after a 3 s block | 3341 ms | 3719 ms | +344 ms | +10% | +288 ms to +406 ms |
| Data gap, T3 | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 18 | 0 | -18 | -100% | -110 to -4 |
| Typing (median of 5) | 113 ms | 68 ms | -42 ms | -37% | -63 ms to -12 ms |
| First data | 485 ms | 978 ms | +425 ms | +88% | +409 ms to +554 ms |
| All 72 widgets with data | 1685 ms | 2661 ms | +362 ms | +21% | +288 ms to +990 ms |
| Recovery after a 3 s block | 3367 ms | 3668 ms | +301 ms | +9% | -231 ms to +581 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 5 |
| Typing (median of 5) | 76 ms |
| First data | 1263 ms |
| All 72 widgets with data | 2458 ms |
| Recovery after a 3 s block | 3475 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 126 | 0 | -126 | -100% | -133 to -112 |
| Typing (median of 5) | 128 ms | 100 ms | -26 ms | -20% | -44 ms to -7 ms |
| First data | 331 ms | 747 ms | +434 ms | +131% | +252 ms to +493 ms |
| All 72 widgets with data | 1235 ms | 2673 ms | +1426 ms | +115% | +1356 ms to +1477 ms |
| Recovery after a 3 s block | 3345 ms | 3724 ms | +379 ms | +11% | +286 ms to +424 ms |
| Data gap, T3 | 3.1 s | 2.8 s | -0.3 s | -10% | -0.4 s to -0.2 s |
| Data gap, other machines | 3.1 s | 2.8 s | -0.3 s | -10% | -0.4 s to -0.3 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 89 | 1 | -89 | -100% | -96 to -67 |
| Typing (median of 5) | 115 ms | 105 ms | -8 ms | -7% | -66 ms to +12 ms |
| First data | 484 ms | 993 ms | +498 ms | +103% | +487 ms to +738 ms |
| All 72 widgets with data | 1549 ms | 1898 ms | +376 ms | +24% | -516 ms to +407 ms |
| Recovery after a 3 s block | 3366 ms | 3519 ms | +144 ms | +4% | +121 ms to +334 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 12 |
| Typing (median of 5) | 91 ms |
| First data | 1233 ms |
| All 72 widgets with data | 2293 ms |
| Recovery after a 3 s block | 3574 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

