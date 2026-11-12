# Plant dashboard, head-to-head

Run settings:

```json
{
  "started": "2026-11-12T11:46:53.461Z",
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
    "out": "comparison/matched-v2/memory",
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
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 34 ms | 20 ms | -13 ms | -38% | -64 ms to +8 ms |
| Main-thread CPU | 70% | 23% | -47 pp | -67% | -51 pp to -42 pp |
| CPU, all threads | 80% | 87% | +11 pp | +14% | +7 pp to +11 pp |
| Memory, first reading | 201 MB | 268 MB | +72 MB | +36% | +66 MB to +84 MB |
| Memory, first reading, after GC | 157 MB | 184 MB | +28 MB | +18% | +26 MB to +35 MB |
| Memory at hold | 281 MB | 340 MB | +59 MB | +21% | +51 MB to +66 MB |
| Memory at hold, after GC | 185 MB | 215 MB | +30 MB | +16% | +30 MB to +35 MB |
| First data | 248 ms | 506 ms | +253 ms | +102% | +222 ms to +413 ms |
| All 72 widgets with data | 1284 ms | 2360 ms | +1061 ms | +83% | +192 ms to +1118 ms |
| Recovery after a 3 s block | 3233 ms | 5496 ms | +2263 ms | +70% | +2210 ms to +2287 ms |
| Data gap, T3 | 3.8 s | 5.6 s | +1.8 s | +47% | +1.8 s to +1.8 s |
| Data gap, other machines | 3.8 s | 5.6 s | +1.8 s | +47% | +1.8 s to +1.8 s |

### native-workers (A) vs isoloop:matched (B)

Rounds: A 3/3 ran, B 3/3 ran.

| Figure | A | B | Gap (B − A) | Gap % | Gap spread |
| --- | --- | --- | --- | --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 9 | 10 | +1 | +11% | +1 to +1 |
| Late frames (of ~60/s × window) | 0 | 0 | 0 | – | 0 to 0 |
| Typing (median of 5) | 33 ms | 23 ms | -10 ms | -30% | -17 ms to -7 ms |
| Main-thread CPU | 69% | 25% | -44 pp | -64% | -44 pp to -42 pp |
| CPU, all threads | 84% | 95% | +10 pp | +12% | +9 pp to +11 pp |
| Memory, first reading | 264 MB | 351 MB | +85 MB | +32% | +83 MB to +94 MB |
| Memory, first reading, after GC | 192 MB | 241 MB | +50 MB | +26% | +43 MB to +50 MB |
| Memory at hold | 396 MB | 551 MB | +155 MB | +39% | +147 MB to +158 MB |
| Memory at hold, after GC | 252 MB | 271 MB | +19 MB | +8% | +16 MB to +22 MB |
| First data | 390 ms | 658 ms | +266 ms | +68% | +212 ms to +274 ms |
| All 72 widgets with data | 2282 ms | 1732 ms | -541 ms | -24% | -555 ms to +284 ms |
| Recovery after a 3 s block | 3170 ms | 2879 ms | -280 ms | -9% | -331 ms to +502 ms |
| Data gap, T3 | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |
| Data gap, other machines | 0.0 s | 0.0 s | 0.0 s | – | 0.0 s to 0.0 s |

### Measured alongside

| Figure | isoloop:split |
| --- | --- |
| Workers (Isoloop also runs the bus worker, not counted) | 18 |
| Late frames (of ~60/s × window) | 0 |
| Typing (median of 5) | 23 ms |
| Main-thread CPU | 26% |
| CPU, all threads | 109% |
| Memory, first reading | 386 MB |
| Memory, first reading, after GC | 282 MB |
| Memory at hold | 832 MB |
| Memory at hold, after GC | 331 MB |
| First data | 870 ms |
| All 72 widgets with data | 1780 ms |
| Recovery after a 3 s block | 3217 ms |
| Data gap, T3 | 0.0 s |
| Data gap, other machines | 0.0 s |

