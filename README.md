# makefun-token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/nyaa-desu/makefun-token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/nyaa-desu/makefun-token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar: a token launch radar for make.fun's “Build the best token launch radar” bounty, $1,325 in USDC. It reads a sealed DefiLlama snapshot of 758 protocols, ranks the 198 pre-token protocols that are not wrapped, staked or bridged products of a token that already trades, and gives each one an implied value and a concrete farm plan.

## The value model (radar-2)

```
implied = $1,000,000 × (TVL / $1M) ^ 0.75
        × (1 + clamped 7-day growth × 0.8)
        × (0.70 + age up to 3 years × 0.30)
        × (1 + 3% per extra chain, up to 5)
```

TVL is sub-linear on purpose: a protocol ten times as large is worth about 5.6 times as much, not ten. Growth is the seven-day TVL change, clamped to −60%…+120%. Maturity rises with the days a protocol has run with no token. No protocol name is ever special-cased: one function scores every row. The board covers all 40 protocols on the snapshot's watchlist, plus 158 early finds below its $50,000,000 floor. The 24 largest live-token protocols are shown apart, at the market's own value, never mixed into the ranking.

## The dashboard

`dashboard/` is a static page with no network: a sortable, filterable board (search, category, chain, watchlist-only), a detail view for every protocol with its value breakdown and farm plan, and a live-token view. Farm plans are generated from each protocol's own record — capital follows its TVL, the hold follows its age, gas follows its chain, the action follows its category — and every step states what it costs and how long it takes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

`main.ts` (Node 22, standard library only) writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and `dossier.json` into the output directory. Two runs on the same snapshot write the same bytes.

`screenshots/` holds three captures of the dashboard taken in a headless browser: the board, a protocol's detail view, and a filtered view. `dossier.json` is what the vendored `vendor/makefun-board.ts` writes from `dashboard/` and `screenshots/` — the file the judge reads.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
