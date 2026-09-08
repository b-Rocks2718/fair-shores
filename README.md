# Fair Shores

A static Catan and Seafarers map generator for 3–6 players. It keeps the real component inventories and balances resource production by moving number tokens within each scenario’s permitted regions.

## Run locally

Requires Node.js 22 or newer. There are no package dependencies to install.

```sh
npm run dev
```

Open http://localhost:5173. To check and build:

```sh
npm test
npm run build
npm run preview
```

`PORT=8080 npm run dev` selects a different port. The preview server is for local development; Cloudflare serves the built static files directly.

## Included scenarios

| Scenario | Players | Interior tiles | Number tokens | Total pips | Harbors |
| --- | --- | ---: | ---: | ---: | ---: |
| Base Catan | 3–4 | 19 | 18 | 58 | 9 |
| Base Catan + extension | 5–6 | 30 | 28 | 88 | 11 |
| Heading for New Shores | 3 | 35 | 22 | 73 | 8 |
| Heading for New Shores | 4 | 42 | 27 | 87 | 9 |
| Heading for New Shores | 5–6 | 56 | 38 | 118 | 11 |
| Four Islands | 3 | 35 | 20 | 66 | 9 |
| Four Islands | 4 | 35 | 23 | 74 | 9 |
| Six Islands | 5–6 | 56 | 32 | 105 | 11 |
| Through the Desert | 3 | 35 | 22 | 78 | 8 |
| Through the Desert | 4 | 42 | 27 | 87 | 9 |
| Through the Desert | 5–6 | 63 | 38 | 118 | 11 |

The player selector offers **3**, **4**, and **5–6**. Seafarers keeps its separate three- and four-player layouts. The shared 5–6-player layout targets six comparable starting locations, so it has enough choices for either group size. Older shared links retain their original exact player count.

Interior tiles include sea and desert. The board shows the **robber** as a pawn and the **pirate** as a ship when that scenario uses it. A pirate position labeled **ON FRAME** is part of the sea frame, not an additional tile. Physical frame pieces and starting settlements are not drawn; use the linked rulebook diagram to assemble the frame. Other Seafarers scenarios and other expansions are outside this version’s scope.

## Balance and placement

- **Even total pips** is the default. It minimizes squared differences between total pips on lumber, brick, wool, grain, and ore. For the base game, a typical result is 11/11/12/12/12 pips.
- In **New Shores and Through the Desert**, even-total-pip balance compares the starting island and the whole board, giving starting-island evenness **15% more weight**. Relative spread is normalized to account for the areas' different pip budgets. In equivalent units the score is `(wholeVariance + 1.15 × mainVariance × (wholeMean / mainMean)²) / 2.15`. This permits a small whole-board tradeoff to improve starting-island access. Base Catan and Four/Six Islands retain whole-board balancing because all islands are available for starting settlements. Per-tile balancing is unchanged.
- **Even pips per tile** minimizes differences between each resource’s average tile strength. Resources with more tiles retain higher total production.
- **Off / random resource totals** skips resource-total optimization. Turn off starting-choice balance too for an unoptimized token shuffle.
- **Balance starting locations** starts on. It favors enough mutually legal starts within one pip of the best for one per player (targeting six for the 5–6 option), rather than placing a hard cap on any corner. A large gap after just two or three strong choices is penalized. This option works independently of resource balancing; when both are on, it cannot worsen the resource-balance score already achieved, including the starting-island preference.
- Gold is excluded from the five-resource objective and shown separately. Its pip count can vary because it exchanges tokens with other terrain in the same legal region. This is not a guarantee of balance between gold access, settlement corners, starting players, or individual islands.
- **No adjacent harbors** and **no adjacent red tokens** start on. The three other requested placement options start off.
- Adjacent means sharing a hex edge for terrain/tokens. With harbor separation on, harbors cannot share a coastal endpoint: at least one unused edge separates them. With it off, harbors may meet at an endpoint but never occupy the same edge. This is a custom harbor variant.
- Resource separation applies to all productive terrain, including gold. Sea and desert are exempt; in particular, the desert barrier must remain contiguous.
- Recommended harbors preserve the diagram’s positions but shuffle harbor types. New Shores and Through the Desert keep harbors on the main island.
- Recommended tiles preserve the printed terrain and number arrangement and bypass balancing. Other selected constraints remain enforced; a conflict is reported rather than ignored.
- Turning red-token separation off is explicitly labeled a house-rule variant. Through the Desert’s prohibition on red tokens on gold remains enforced.

Terrain assignment uses a bounded backtracking search when resource separation is enabled. Number placement first solves red-token separation. A seeded annealing search then swaps tokens within the same region, retaining the best result. It preserves the exact token multiset, so total pips cannot change. A validator checks the complete board before it is displayed. Search is best effort and does not certify a global optimum; unsatisfied placement constraints produce a visible error. Generation runs in a Web Worker so the interface remains responsive.

Starting-location optimization runs after resource balancing. For each pip threshold, it computes the maximum number of mutually legal starting corners using bipartite matching on the hex-corner graph. This counts settlement spacing exactly, without a greedy tie-breaking approximation. In New Shores and Through the Desert, only corners in the starting region count; foreign-area access cannot inflate the result. Four/Six Islands allows starts on all islands, so they all count. The penalty sums the squared gaps beyond one pip between the best start and each of the first N compatible thresholds, where N is 3, 4, or 6 for the selected player option. Thresholds may use different sets of corners; this is not a simulation of the settlement draft.

The starting-choice pass keeps the best result and never worsens its initial starting-gap penalty or the resource-balance score. The UI reports how many strong starts can coexist and flags remaining gaps. It does not guarantee equal strategic value: resource diversity, ports, number diversity, expansion paths, and the two-settlement snake draft are not part of this pip-based measure. Recommended tiles bypass both optimizations.

New share links use generator **version 3**, which adds the starting-island pip preference. Existing version 1 and 2 links reproduce their original tile and harbor layouts; regression fixtures cover both. Version 1 has starting-location optimization off, while version 2 preserves its original whole-board pip objective and exact player count. Robber and pirate markers are also shown on these older maps. Changing settings or generating a fresh map uses the current version. Introduce a new version when changing either algorithm or scenario data if old links must remain stable.

## Rulebook sources and interpretation

The setup facts were independently transcribed from the official English **2020/2021 editions and 2023 extensions**, including visual inspection of the diagrams. The app does not claim to reproduce changes in later editions. No artwork or application code was copied from CATAN or the reference generator; the terrain art is original SVG.

- [Base game rules (2020)](https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf): beginner board on page 3, variable setup in the almanac.
- [Base game 5–6 extension (2023)](https://www.catan.com/sites/default/files/2024-03/Catan%20Game%205-6%20Rules%202022%20240313.pdf): pages 3–5; use the extension’s complete 28-token set, not both token sets together.
- [Seafarers (2021)](https://www.catan.com/sites/default/files/2021-06/catan-seafarers_2021_rule_book_201201.pdf): New Shores pages 8–10, Four Islands pages 11–13, Through the Desert pages 17–19.
- [Seafarers 5–6 extension (2023)](https://www.catan.com/sites/default/files/2024-03/Catan%20Seafarers%205-6%202023%20Rules%20220313.pdf): New Shores pages 6–7, Six Islands pages 8–9, Through the Desert pages 12–13.
- [Original generator](https://www.seafarers-generator.com/): inspiration for the five placement preferences.

New Shores keeps the mainland’s terrain and token pools separate from the foreign pool, and keeps the intervening sea fixed. Four/Six Islands retain their coastlines. Through the Desert fixes the desert barrier, keeps the main and foreign pools separate, and allows sea to move only inside the foreign-area outline.

The robber starts on a desert where present (the depicted middle desert in Through the Desert), or on a 12-token tile where there is no desert. If there is more than one eligible tile, a deterministic valid choice is shown. Pirate positions follow the scenario diagrams, including their frame positions; the base game has no pirate. Initial markers are validated along with the board inventory and placement constraints.

Two diagram details need interpretation:

1. New Shores for 5–6 players leaves the main island blank and refers to the base extension setup. With recommended tiles on, Fair Shores fills it with that extension’s beginner layout, rotated to fit the diagram.
2. Through the Desert for 5–6 players lists **11 harbors** but draws **10 harbor locations**. Recommended harbor placement preserves all 10 depicted edges and adds the remaining harbor to a legal main-island coast. The app surfaces this choice in its setup notes. 

Balanced random setups are optional variants; the normal base game uses the lettered spiral token procedure. The chart is an estimate of resource production probabilities, not expected cards per turn: it does not model settlement ownership, cities, or the robber.

## Deploy on Cloudflare Pages

This app needs no backend, database, secrets, paid API, or runtime dependencies.

1. Put this project in a Git repository and connect it to a Cloudflare Pages project.
2. Choose **None** as the framework preset.
3. Set the build command to **`npm run build`** and the output directory to **`dist`**.
4. Use Node.js 22 or newer for the build, then deploy.

Alternatively, run `npm run build` locally and upload `dist` through Pages Direct Upload. See [Cloudflare’s static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/). No site has been published as part of this implementation.

## Useful next additions

- Compare complete two-settlement starts, including resource mix and draft order, to refine the current pip-based starting-choice balance.
- An option to separate identical numbers, so a position depends less heavily on one roll.
- Tile and number locks for rerolling only part of a board.
- An option to balance the main island separately from the whole map, without changing its token pool.

## Project layout

- `src/scenarios.js`: versioned setup data and rulebook references.
- `src/geometry.js`: hexes, corners, coast edges, and harbor spacing.
- `src/generator.js`: seeded constraint solver, pip optimization, statistics, and validation.
- `src/starts.js`: eligible starting-corner graph, exact compatible-start counts, and relative starting-strength assessment.
- `src/pieces.js`: robber and pirate placement and validation.
- `src/worker.js`: browser worker entry point.
- `src/render.js`: original SVG board and terrain artwork.
- `src/app.js` and `src/style.css`: responsive UI, settings persistence, sharing, SVG export, and print view.
- `tests/generator.test.js`: independent inventory fixtures, probability checks, many-seed constraints, determinism, balance comparisons, and mutation tests for validation.
- `tests/starts.test.js`: elite-group examples, spacing checks against brute force, player counts, starting-region eligibility, optimization comparisons, and legacy-link fixtures.
- `tests/setup.test.js`: starting pieces, frame positions, SVG markers, main-island resource preference, and version 2 compatibility.

Unofficial fan project. CATAN is a trademark of CATAN GmbH; this project is not affiliated with or endorsed by them.
