# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-10T08:54:09.554Z",
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
    "out": "comparison/matched/responsiveness",
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
| Typing (median of 5) | 35 ms | 20 ms | -14 ms | -40% | -77 ms to +3 ms |
| Main-thread CPU | 69% | 24% | -45 pp | -65% | -60 pp to -44 pp |
| CPU, all threads | 79% | 91% | +10 pp | +13% | -5 pp to +18 pp |
| Memory, first reading | 167 MB | 250 MB | +83 MB | +50% | +77 MB to +90 MB |
| Memory, first reading, after GC | 153 MB | 194 MB | +39 MB | +25% | +34 MB to +43 MB |
| First data | 284 ms | 459 ms | +226 ms | +80% | +94 ms to +269 ms |
| All 72 widgets with data | 1360 ms | 2375 ms | +1027 ms | +76% | +910 ms to +1142 ms |
| Recovery after a 3 s block | 3160 ms | 3443 ms | +293 ms | +9% | +225 ms to +352 ms |
| Data gap, T3 | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.5 s |
| Data gap, other machines | 3.8 s | 3.3 s | -0.5 s | -13% | -0.5 s to -0.5 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 46 ms | 45 ms | -4 ms | -9% | -34 ms to +12 ms |
| Main-thread CPU | 75% | 27% | -48 pp | -64% | -58 pp to -40 pp |
| CPU, all threads | 90% | 98% | +8 pp | +9% | +1 pp to +15 pp |
| Memory, first reading | 214 MB | 309 MB | +95 MB | +44% | +87 MB to +102 MB |
| Memory, first reading, after GC | 195 MB | 244 MB | +47 MB | +24% | +44 MB to +52 MB |
| First data | 370 ms | 526 ms | +205 ms | +55% | +115 ms to +256 ms |
| All 72 widgets with data | 2259 ms | 1727 ms | -527 ms | -23% | -699 ms to +277 ms |
| Recovery after a 3 s block | 3145 ms | 2855 ms | -290 ms | -9% | -446 ms to +554 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 23 ms |
| Main-thread CPU | 28% |
| CPU, all threads | 110% |
| Memory, first reading | 343 MB |
| Memory, first reading, after GC | 285 MB |
| First data | 786 ms |
| All 72 widgets with data | 1791 ms |
| Recovery after a 3 s block | 3353 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## chromium, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | -1 to 0 |
| Typing (median of 5) | 89 ms | 21 ms | -69 ms | -78% | -89 ms to -35 ms |
| Main-thread CPU | 83% | 24% | -59 pp | -71% | -68 pp to -58 pp |
| CPU, all threads | 94% | 113% | +19 pp | +20% | +8 pp to +20 pp |
| Memory, first reading | 185 MB | 284 MB | +98 MB | +53% | +86 MB to +104 MB |
| Memory, first reading, after GC | 164 MB | 205 MB | +41 MB | +25% | +39 MB to +45 MB |
| First data | 223 ms | 472 ms | +247 ms | +111% | +238 ms to +299 ms |
| All 72 widgets with data | 1173 ms | 2367 ms | +1191 ms | +102% | +1123 ms to +1212 ms |
| Recovery after a 3 s block | 3211 ms | 3490 ms | +265 ms | +8% | +172 ms to +331 ms |
| Data gap, T3 | 3.0 s | 2.6 s | -0.4 s | -13% | -0.6 s to -0.4 s |
| Data gap, other machines | 3.0 s | 2.6 s | -0.4 s | -13% | -0.6 s to -0.4 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 74 ms | 33 ms | -40 ms | -54% | -78 ms to -34 ms |
| Main-thread CPU | 82% | 27% | -54 pp | -66% | -63 pp to -53 pp |
| CPU, all threads | 101% | 121% | +19 pp | +19% | +16 pp to +27 pp |
| Memory, first reading | 244 MB | 365 MB | +123 MB | +50% | +100 MB to +124 MB |
| Memory, first reading, after GC | 217 MB | 283 MB | +67 MB | +31% | +49 MB to +73 MB |
| First data | 311 ms | 654 ms | +330 ms | +106% | +82 ms to +389 ms |
| All 72 widgets with data | 2311 ms | 1513 ms | +133 ms | +6% | -800 ms to +187 ms |
| Recovery after a 3 s block | 3161 ms | 2865 ms | -314 ms | -10% | -392 ms to -192 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 43 ms |
| Main-thread CPU | 29% |
| CPU, all threads | 135% |
| Memory, first reading | 396 MB |
| Memory, first reading, after GC | 325 MB |
| First data | 889 ms |
| All 72 widgets with data | 1637 ms |
| Recovery after a 3 s block | 3407 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 1 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 11 | 0 | -11 | -100% | -56 to -8 |
| Typing (median of 5) | 115 ms | 84 ms | -39 ms | -34% | -41 ms to -5 ms |
| First data | 325 ms | 695 ms | +333 ms | +102% | +268 ms to +521 ms |
| All 72 widgets with data | 1431 ms | 2628 ms | +1199 ms | +84% | +1133 ms to +1253 ms |
| Recovery after a 3 s block | 3366 ms | 3663 ms | +274 ms | +8% | +239 ms to +381 ms |
| Data gap, T3 | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |
| Data gap, other machines | 3.8 s | 3.6 s | -0.2 s | -5% | -0.5 s to -0.2 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 16 | 1 | -15 | -94% | -21 to -8 |
| Typing (median of 5) | 111 ms | 87 ms | -29 ms | -26% | -39 ms to -6 ms |
| First data | 538 ms | 997 ms | +535 ms | +99% | +384 ms to +555 ms |
| All 72 widgets with data | 1727 ms | 2037 ms | +325 ms | +19% | -457 ms to +437 ms |
| Recovery after a 3 s block | 3348 ms | 3604 ms | +263 ms | +8% | +33 ms to +414 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 6 |
| Typing (median of 5) | 83 ms |
| First data | 1245 ms |
| All 72 widgets with data | 2385 ms |
| Recovery after a 3 s block | 3221 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

## firefox, 5 kHz

### native (A) vs isoloop:one (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 0 | 1 | +1 | – | +1 to +1 |
| Late frames (of ~60/s × window) | 130 | 0 | -130 | -100% | -152 to -99 |
| Typing (median of 5) | 124 ms | 100 ms | -11 ms | -9% | -48 ms to +2 ms |
| First data | 334 ms | 620 ms | +286 ms | +86% | +229 ms to +587 ms |
| All 72 widgets with data | 1228 ms | 2645 ms | +1417 ms | +115% | +1382 ms to +1468 ms |
| Recovery after a 3 s block | 3362 ms | 3635 ms | +265 ms | +8% | +191 ms to +311 ms |
| Data gap, T3 | 3.1 s | 2.7 s | -0.4 s | -13% | -3.1 s to -0.4 s |
| Data gap, other machines | 3.1 s | 2.7 s | -0.4 s | -13% | -0.4 s to -0.3 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 5/5 ran, B 5/5 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 76 | 1 | -75 | -99% | -101 to -69 |
| Typing (median of 5) | 133 ms | 83 ms | -50 ms | -38% | -64 ms to -3 ms |
| First data | 491 ms | 985 ms | +456 ms | +93% | +364 ms to +635 ms |
| All 72 widgets with data | 1529 ms | 1851 ms | +206 ms | +13% | -546 ms to +419 ms |
| Recovery after a 3 s block | 3380 ms | 3618 ms | +244 ms | +7% | +120 ms to +403 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 13 |
| Typing (median of 5) | 103 ms |
| First data | 1219 ms |
| All 72 widgets with data | 2188 ms |
| Recovery after a 3 s block | 3508 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

