## Sizes

| Size | Build | Main-thread CPU | Renderer CPU, all threads | GPU process CPU | Renderer memory (PSS) | Layouts/s | Style recalcs/s | Frames over 25 ms | Frame p95 | Typing (median) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lite | Native · React | 5.1% | 7.5% | 2.5% | 123 MB | 9.5 | 60.1 | 0 of 600 | 16.7 ms | 6 ms |
| Lite | Isoloop · React | 2.7% | 10.0% | 3.1% | 192 MB | 10.9 | 60.0 | 0 of 600 | 16.7 ms | 27 ms |
| Lite | Native · Preact | 4.7% | 7.5% | 2.9% | 117 MB | 10.0 | 60.0 | 0 of 600 | 16.8 ms | 5 ms |
| Lite | Isoloop · Preact | 2.8% | 9.8% | 2.8% | 187 MB | 11.1 | 60.1 | 0 of 600 | 16.7 ms | 28 ms |
| Normal | Native · React | 42.2% | 50.1% | 24.0% | 202 MB | 56.1 | 62.6 | 0 of 600 | 16.8 ms | 11 ms |
| Normal | Isoloop · React | 17.5% | 73.6% | 26.1% | 524 MB | 56.3 | 60.7 | 0 of 600 | 16.8 ms | 37 ms |
| Normal | Native · Preact | 27.3% | 34.5% | 5.4% | 211 MB | 56.7 | 60.9 | 0 of 600 | 16.8 ms | 5 ms |
| Normal | Isoloop · Preact | 13.5% | 49.9% | 5.5% | 498 MB | 55.9 | 60.4 | 0 of 600 | 16.7 ms | 32 ms |
| Heavy | Native · React | 59.0% | 67.9% | 5.8% | 278 MB | 59.1 | 75.5 | 0 of 600 | 16.7 ms | 15 ms |
| Heavy | Isoloop · React | 20.5% | 99.6% | 8.5% | 754 MB | 58.4 | 60.7 | 0 of 600 | 16.8 ms | 32 ms |
| Heavy | Native · Preact | 43.8% | 54.0% | 5.9% | 252 MB | 58.7 | 65.7 | 0 of 600 | 16.7 ms | 16 ms |
| Heavy | Isoloop · Preact | 17.3% | 79.3% | 6.8% | 687 MB | 56.4 | 60.5 | 0 of 600 | 16.7 ms | 32 ms |

| Size | Pair | Renderer CPU, Isoloop ÷ native | Memory, Isoloop ÷ native | Main-thread CPU, Isoloop ÷ native | Typing, Isoloop ÷ native |
| --- | --- | --- | --- | --- | --- |
| Lite | React | 1.33× | 1.56× | 0.53× | 4.50× |
| Lite | Preact | 1.31× | 1.60× | 0.60× | 5.60× |
| Normal | React | 1.47× | 2.59× | 0.41× | 3.36× |
| Normal | Preact | 1.45× | 2.36× | 0.49× | 6.40× |
| Heavy | React | 1.47× | 2.71× | 0.35× | 2.13× |
| Heavy | Preact | 1.47× | 2.73× | 0.39× | 2.00× |

**Normal, React pair: time per category, ms per second, and updates/s**

| Category | Native: render and draw (main thread) | Isoloop: render and draw (own threads) | Isoloop: DOM apply (main thread) | Updates/s, native | Updates/s, Isoloop |
| --- | --- | --- | --- | --- | --- |
| raw · canvas | 10.3 | 15.3 | 0.0 | 55 | 56 |
| raw · dom | 3.5 | 4.1 | 1.1 | 39 | 39 |
| filtered · canvas | 19.7 | 16.8 | 0.0 | 55 | 56 |
| filtered · dom | 2.9 | 4.2 | 0.3 | 39 | 39 |
| aggregated · canvas | 0.6 | 1.2 | 0.0 | 5 | 7 |
| aggregated · dom | 0.0 | 0.1 | 0.1 | 1 | 1 |
| combined · canvas | 0.7 | 1.5 | 0.0 | 2 | 2 |
| combined · dom | 5.0 | 7.5 | 9.3 | 110 | 112 |
| engines | 0.8 | 1.5 | 0.0 | 0 | 0 |

**Heavy, React pair: time per category, ms per second, and updates/s**

| Category | Native: render and draw (main thread) | Isoloop: render and draw (own threads) | Isoloop: DOM apply (main thread) | Updates/s, native | Updates/s, Isoloop |
| --- | --- | --- | --- | --- | --- |
| raw · canvas | 11.0 | 13.7 | 0.0 | 58 | 53 |
| raw · dom | 6.4 | 13.2 | 6.0 | 60 | 59 |
| filtered · canvas | 34.5 | 29.4 | 0.0 | 116 | 105 |
| filtered · dom | 7.2 | 16.0 | 1.7 | 60 | 58 |
| aggregated · canvas | 28.0 | 26.4 | 0.0 | 65 | 63 |
| aggregated · dom | 0.0 | 0.2 | 0.1 | 1 | 1 |
| combined · canvas | 1.9 | 6.2 | 0.0 | 8 | 11 |
| combined · dom | 3.9 | 6.7 | 6.6 | 116 | 106 |
| engines | 1.1 | 2.7 | 0.0 | 0 | 0 |

## One chart blocked (Lite, replay at 10×)

| Build | Typing, calm (median) | Typing, one chart blocked (median) | (worst) | fps after | Long tasks (10 s) | First data | JS, gzipped |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Native · React | 13 ms | 2821 ms | 2836 ms | 3 | 3 | 110 ms | 108 KB |
| Isoloop · React | 33 ms | 38 ms | 60 ms | 61 | 0 | 331 ms | 168 KB |
| Native · Preact | 8 ms | 2822 ms | 2823 ms | 9 | 3 | 78 ms | 49 KB |
| Isoloop · Preact | 32 ms | 29 ms | 65 ms | 61 | 0 | 261 ms | 108 KB |
