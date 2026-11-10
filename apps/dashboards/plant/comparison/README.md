# The recorded comparison

The plant dashboard (M3d task 11). It compares native, native + workers and the Isoloop build in each placement, at 1, 2 and 5 kHz vibration. Results are measured on Chromium, Firefox and WebKit, one page at a time.

**This recording:** a local desktop under WSL2, restricted to 4 cores with `taskset -c 0-3` to stand in for decision 10's 4-core desktop. Playwright 1.64.1, headless, no GPU, seed 7, 2026-11-09. The raw numbers are in [`desktop-4core/`](desktop-4core/) and the tables in [`desktop-4core/summary.md`](desktop-4core/summary.md).

To rerun it:

- On CI, the *Comparison (plant)* workflow (`.github/workflows/comparison-plant.yml`): GitHub's 4-core runner, one job per engine.
- Locally: `pnpm --filter ./apps/dashboards/plant compare`. To use 4 cores, prefix it with `taskset -c 0-3`.

What each run does, and what each figure covers, is in [`e2e/comparison.spec.ts`](../e2e/comparison.spec.ts):

1. 6 s of warm-up.
2. A 10 s window with no input, for frames, long tasks and CPU.
3. 5 keystrokes into T1's event-log filter (a widget).
4. A 3 s block of T3's gauges, for the fault figures.

## Head-to-head runs (`run.ts`)

`run.ts` runs pairs of configurations against each other, a native build (A) and an Isoloop placement (B), interleaved: A, B, A, B, for N rounds, one page at a time. In each round it reads memory twice, once after the measuring window (about 16 s after navigation) and once at the hold (10 min by default), each time before and after a forced GC in the page and every worker. It writes each run's JSON and `summary.md`, with the median gap B − A per round, as a share of A, and the gap's spread across rounds.

The two pairs it was written for:

- `native` vs `isoloop:one`: everything on one thread against everything in one worker.
- `native-workers` vs `isoloop:matched`: one data worker per machine and one for the fleet on both sides. Isoloop adds one worker for all 72 widgets, plus the bus's worker, which the worker counts leave out.

```bash
pnpm --filter ./apps/dashboards/plant compare:pairs \
  --pair native=isoloop:one --pair native-workers=isoloop:matched \
  --extra isoloop:split --rates 1,5 --rounds 5 --hold 600 \
  --engines chromium,firefox --out comparison/matched/results
```

Arguments are in the header of [`run.ts`](run.ts). `--summary-only` rebuilds `summary.md` from the JSON already in `--out`.

Durations: each run takes about 1 minute plus the hold. The command above has 5 configurations × 2 rates × 5 rounds × 2 engines = 100 runs, at about 11 minutes each, so roughly 18 hours. `--hold 0` skips the 10-minute reading, at about 1 minute a run.

Memory figures (renderer PSS from `/proc`) are Chromium on Linux only. Firefox runs report frames, typing, start-up and the fault figures.

### In Docker, on a dedicated machine

[`Dockerfile`](Dockerfile) is Playwright's official image at the repo's Playwright version (1.64.1, with its browsers), plus Node 26 and pnpm (installed with npm; Node 25+ no longer ships corepack). From a clone of `isoloop/examples` used only for this:

```bash
docker build -t plant-compare apps/dashboards/plant/comparison
docker run --rm --init --cpuset-cpus=2,4,6,8 --shm-size=2g \
  -v "$PWD":/work -w /work plant-compare \
  bash -lc 'pnpm install --frozen-lockfile && pnpm --filter ./apps/dashboards/plant compare:pairs \
    --pair native=isoloop:one --pair native-workers=isoloop:matched \
    --extra isoloop:split --rates 1,5 --rounds 5 --hold 600 \
    --engines chromium,firefox --out comparison/matched/results'
```

- `--cpuset-cpus=2,4,6,8` pins the run to 4 physical cores, one thread each, as `taskset` does locally. On a machine with two threads per core, CPUs 0–3 are only 2 physical cores; `lscpu -e=CPU,CORE` shows the pairing. Core 0 is left out because it takes most interrupts. Drop the flag to use the whole machine.
- `--shm-size=2g` gives Chromium enough shared memory; Docker's default of 64 MB is too small for it.
- The results land in `apps/dashboards/plant/comparison/matched/results/`, owned by root, because the container runs as root.
- `run.json` there records the arguments and the CPUs the run was allowed.

## Chromium, 4 cores, 1 kHz and 5 kHz

| Rate | Build | Workers | Late frames (of 600) | Typing (median) | Main-thread CPU | Renderer CPU, all threads | Renderer memory | Recovery after a 3 s block | Data gap, T3 | Data gap, other machines |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 kHz | Native | 0 | 0 | 15 ms | 28% | 34% | 205 MB | 3.2 s | 3.8 s | 3.8 s |
| 1 kHz | Native + workers | 9 | 5 | 12 ms | 37% | 45% | 248 MB | 3.1 s | 0 | 0 |
| 1 kHz | Isoloop, split | 18 | 0 | 32 ms | 18% | 73% | 465 MB | 3.2 s | 0 | 0 |
| 1 kHz | Isoloop, machine | 10 | 0 | 32 ms | 13% | 57% | 451 MB | 3.4 s | 3.3 s | 0 |
| 1 kHz | Isoloop, shared-engines | 12 | 0 | 31 ms | 11% | 53% | 430 MB | 3.4 s | 0 | 0 |
| 1 kHz | Isoloop, own | 105 | 0 | 33 ms | 15% | 76% | 820 MB | 2.4 s | 0 | 0 |
| 5 kHz | Native | 0 | 0 | 15 ms | 35% | 41% | 217 MB | 3.1 s | 3.0 s | 3.0 s |
| 5 kHz | Native + workers | 9 | 0 | 13 ms | 34% | 45% | 268 MB | 3.1 s | 0 | 0 |
| 5 kHz | Isoloop, split | 18 | 0 | 32 ms | 15% | 74% | 558 MB | 2.6 s | 0 | 0 |
| 5 kHz | Isoloop, own | 105 | 0 | 31 ms | 18% | 100% | 949 MB | 2.5 s | 0 | 0 |

The 2 kHz rows, the other placements and Firefox and WebKit are in [`summary.md`](desktop-4core/summary.md).

## What the numbers show, on this machine

- **The hypothesis (decision 10) doesn't hold on this desktop.** It was that native would drop frames and type slower than 100 ms, with Isoloop closer to 60 fps and under 100 ms.
  - On Chromium and Firefox, every build keeps 60 fps at every rate: 0 to 5 late frames of 600.
  - Typing stays under 100 ms everywhere: native 14–23 ms, native + workers 6–21 ms, Isoloop 21–50 ms.
  - Native keeps headroom, so the hypothesis is falsified for this machine, as decision 10 allows. Against native + workers, Isoloop does no better on frames or typing.
- **Isoloop moves work off the main thread and uses more in total.** On Chromium, Isoloop's main thread runs 11–18% against native's 28–35%. Across all threads it uses 53–76% of a core in its pooled placements against native's 34–41%, and 100% in `own` at 5 kHz. Memory is 430–560 MB pooled and 820–950 MB in `own`, against native's 205–220 MB.
- **Typing costs Isoloop about 15–30 ms more:** the keystroke goes to the widget's worker and back (engine constraint 3).
- **Pools cut what own workers cost.** `machine` (10 workers) and `shared-engines` (12) use less CPU and memory than `split` (18), and much less than `own` (105).
- **Faults show where each placement draws its lines:**
  - **Native:** a 3 s block stalls the whole page. Every machine loses 3–4 s of data, because the feeds on the main thread can't run.
  - **Native + workers:** the page stalls too, but the data workers keep producing, so there's no data gap.
  - **Isoloop:** the kernel kills the blocked pool after 2 s and it restarts. In `split`, `shared-engines` and `own` only widgets restart, and no data is lost. In `machine` the machine's feed is in the pool, so T3 alone loses about 3 s of data. Recovery is 2.4–3.5 s on every build; on Isoloop it is the kill delay plus the restart.
- **WebKit (Playwright, Linux, no GPU):**
  - The Isoloop page stops in every placement: engine constraint 2, with 8 waveforms scrolling every frame in workers.
  - Native and native + workers run at 39–52 fps there, with 85–186 late frames.
  - Not checked in Safari on macOS or iOS.
- Start-up: first data at 170–320 ms on native builds and 290–1,100 ms on Isoloop (`own` is slowest). All 72 widgets show data within 1.1–2.5 s on every build.

These are one run per configuration on one machine. CI's runner will give different absolute numbers.

## Phone run (manual, not yet recorded)

Decision 11 asks for a mid-range phone. To record one:

1. Build and serve on the local network:

   ```bash
   pnpm --filter ./apps/dashboards/plant build
   pnpm --filter ./apps/dashboards/plant preview --host --port 4792
   ```

2. On the phone, open `http://<computer's LAN address>:4792/<build>/?rate=1`. Do it for `native`, `native-workers` and `isoloop` (with `&placement=split`, then each other placement).
3. Wait about 10 s. Open **Record 10 s**, press **Record**, and type into the *Type here* box until it finishes.
4. Copy the JSON it shows into `comparison/phone/<build>-<placement>-<rate>khz.json`. Note the phone's model and browser.
5. `own` may not run on a phone. If it doesn't, record that as the result (decision 6).
