# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-10T13:33:40.431Z",
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
    "out": "comparison/matched-q6/responsiveness",
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
| Typing (median of 5) | 33 ms | 21 ms | -10 ms | -30% | -16 ms to +4 ms |
| Main-thread CPU | 67% | 24% | -43 pp | -64% | -44 pp to -43 pp |
| CPU, all threads | 77% | 88% | +11 pp | +15% | +11 pp to +13 pp |
| Memory, first reading | 169 MB | 250 MB | +82 MB | +49% | +73 MB to +85 MB |
| Memory, first reading, after GC | 156 MB | 188 MB | +36 MB | +23% | +28 MB to +37 MB |
| First data | 236 ms | 457 ms | +159 ms | +67% | +137 ms to +336 ms |
| All 72 widgets with data | 1359 ms | 2369 ms | +1010 ms | +74% | +88 ms to +1155 ms |
| Recovery after a 3 s block | 3164 ms | 3478 ms | +307 ms | +10% | +221 ms to +332 ms |
| Data gap, T3 | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 34 ms | 21 ms | -13 ms | -38% | -27 ms to +15 ms |
| Main-thread CPU | 68% | 26% | -42 pp | -62% | -50 pp to -37 pp |
| CPU, all threads | 83% | 102% | +13 pp | +16% | +10 pp to +24 pp |
| Memory, first reading | 213 MB | 308 MB | +93 MB | +44% | +81 MB to +102 MB |
| Memory, first reading, after GC | 191 MB | 239 MB | +47 MB | +25% | +45 MB to +49 MB |
| First data | 292 ms | 559 ms | +242 ms | +83% | +158 ms to +411 ms |
| All 72 widgets with data | 1450 ms | 1720 ms | +104 ms | +7% | -551 ms to +394 ms |
| Recovery after a 3 s block | 3132 ms | 2825 ms | -299 ms | -10% | -367 ms to -163 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 42 ms |
| Main-thread CPU | 29% |
| CPU, all threads | 111% |
| Memory, first reading | 339 MB |
| Memory, first reading, after GC | 287 MB |
| First data | 857 ms |
| All 72 widgets with data | 1871 ms |
| Recovery after a 3 s block | 2836 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## chromium, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 77 ms | 22 ms | -52 ms | -68% | -67 ms to -10 ms |
| Main-thread CPU | 83% | 23% | -59 pp | -71% | -64 pp to -57 pp |
| CPU, all threads | 94% | 111% | +16 pp | +17% | +13 pp to +18 pp |
| Memory, first reading | 188 MB | 280 MB | +93 MB | +49% | +85 MB to +99 MB |
| Memory, first reading, after GC | 165 MB | 204 MB | +37 MB | +22% | +35 MB to +44 MB |
| First data | 278 ms | 483 ms | +229 ms | +82% | +138 ms to +332 ms |
| All 72 widgets with data | 1192 ms | 2366 ms | +1176 ms | +99% | +1085 ms to +1221 ms |
| Recovery after a 3 s block | 3201 ms | 3490 ms | +295 ms | +9% | +224 ms to +372 ms |
| Data gap, T3 | 3.1 s | 2.6 s | -0.5 s | -16% | -0.5 s to -0.4 s |
| Data gap, other machines | 3.1 s | 2.6 s | -0.5 s | -16% | -0.5 s to -0.4 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 63 ms | 24 ms | -41 ms | -65% | -46 ms to -5 ms |
| Main-thread CPU | 78% | 27% | -51 pp | -65% | -53 pp to -51 pp |
| CPU, all threads | 97% | 119% | +22 pp | +23% | +18 pp to +28 pp |
| Memory, first reading | 246 MB | 354 MB | +109 MB | +44% | +105 MB to +123 MB |
| Memory, first reading, after GC | 221 MB | 287 MB | +68 MB | +31% | +65 MB to +75 MB |
| First data | 318 ms | 646 ms | +328 ms | +103% | +199 ms to +392 ms |
| All 72 widgets with data | 2297 ms | 1509 ms | -775 ms | -34% | -815 ms to +154 ms |
| Recovery after a 3 s block | 3177 ms | 2868 ms | -296 ms | -9% | -314 ms to -256 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 47 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 137% |
| Memory, first reading | 402 MB |
| Memory, first reading, after GC | 332 MB |
| First data | 918 ms |
| All 72 widgets with data | 1593 ms |
| Recovery after a 3 s block | 3417 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 1 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 15 | 0 | -15 | -100% | -45 to -11 |
| Typing (median of 5) | 112 ms | 69 ms | -46 ms | -41% | -52 ms to -33 ms |
| First data | 286 ms | 764 ms | +411 ms | +144% | +332 ms to +507 ms |
| All 72 widgets with data | 1450 ms | 2631 ms | +1143 ms | +79% | +1066 ms to +1306 ms |
| Recovery after a 3 s block | 3342 ms | 3658 ms | +312 ms | +9% | +290 ms to +424 ms |
| Data gap, T3 | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 15 | 0 | -14 | -93% | -68 to -13 |
| Typing (median of 5) | 122 ms | 78 ms | -43 ms | -35% | -62 ms to -24 ms |
| First data | 402 ms | 966 ms | +577 ms | +144% | +445 ms to +674 ms |
| All 72 widgets with data | 2403 ms | 2108 ms | -204 ms | -8% | -380 ms to +497 ms |
| Recovery after a 3 s block | 3354 ms | 3582 ms | +225 ms | +7% | +56 ms to +332 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 9 |
| Typing (median of 5) | 82 ms |
| First data | 1311 ms |
| All 72 widgets with data | 2580 ms |
| Recovery after a 3 s block | 3345 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 123 | 0 | -123 | -100% | -150 to -109 |
| Typing (median of 5) | 122 ms | 97 ms | -25 ms | -20% | -36 ms to -13 ms |
| First data | 341 ms | 803 ms | +471 ms | +138% | +282 ms to +493 ms |
| All 72 widgets with data | 1258 ms | 2636 ms | +1395 ms | +111% | +1280 ms to +1517 ms |
| Recovery after a 3 s block | 3381 ms | 3804 ms | +414 ms | +12% | +321 ms to +448 ms |
| Data gap, T3 | 3.1 s | 2.8 s | -0.3 s | -10% | -0.3 s to 0.0 s |
| Data gap, other machines | 3.1 s | 2.8 s | -0.3 s | -10% | -0.3 s to -0.1 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 87 | 1 | -86 | -99% | -126 to -71 |
| Typing (median of 5) | 123 ms | 104 ms | -25 ms | -20% | -36 ms to -14 ms |
| First data | 436 ms | 1007 ms | +583 ms | +134% | +477 ms to +734 ms |
| All 72 widgets with data | 2414 ms | 1956 ms | -458 ms | -19% | -620 ms to +1217 ms |
| Recovery after a 3 s block | 3402 ms | 3609 ms | +211 ms | +6% | +20 ms to +298 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 14 |
| Typing (median of 5) | 88 ms |
| First data | 1281 ms |
| All 72 widgets with data | 2306 ms |
| Recovery after a 3 s block | 3592 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

