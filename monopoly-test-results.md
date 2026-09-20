# Monopoly verification — September 20, 2026

Tested the current workspace source, package version 1.0.61, with Node 24.14.0. All commands below completed with exit code 0. No crash was reproduced. This does not verify previously built installers or the deployed service.

## Checks completed

- `npm run test:monopoly`: all five suites passed. Covers all 184 board editions and token/deck structure, rent calculations, property menu state and keyboard isolation, computer building, live Socket.IO rule scenarios, and three-player scenarios through bankruptcy and a winner.
- `node monopoly-jackpot.test.js`: dice, doubles, jail, Free Parking jackpot, themed cards, and hotel rule checks passed.
- `node game-options.test.js`: all 184 editions, unique tokens, and jackpot on/off saved and started with two players.
- `node mixed-mode.test.js`: independent accessible/visual preferences and live join announcements passed; its multiplayer subprocess passed two- and four-player starts and gameplay actions.
- `node full-gameplay.test.js` with `FULL_GAME_FILTER=Monopoly`: the existing accelerated $1 game finished after two host actions.
- The same playthrough with `LOUNGE_TEST_MONOPOLY_BALANCE=1500`: normal starting-balance game finished after 31 host actions; Computer Player won.
- `node monopoly-property-menu.test.js` (included in the Monopoly command): property selection, complete groups, even building/selling, hotels, affordability, pending decisions, B/X shortcuts, and form/modal isolation passed.
- Shared interface checks passed: `visual-mode.test.js`, `desktop-prompt-keys.test.js`, `game-start-layout.test.js`, `accessible-mode.test.js`, `yes-no-flow.test.js`, `prompt-coverage.test.js`, `lounge-prompt-flow.test.js`, `game-join-announcements.test.js`, and `quit-to-list.test.js`.

The live rules scenarios covered purchases/declines, turn and host authorization, GO salary, taxes, jackpot collection, rent, houses/hotels and refunds, trade acceptance/rejection, jail attempts/bail/doubles/jail-free cards, three doubles, card awards/fees/transit/repairs, bankruptcy, and game completion. This is broad regression coverage, not every possible card/state combination.

## Test improvement

`full-gameplay.test.js` now respects an explicitly supplied `LOUNGE_TEST_MONOPOLY_BALANCE`, retaining its $1 default. Reproduce the normal-balance run in PowerShell:

```powershell
$env:FULL_GAME_FILTER='Monopoly'
$env:LOUNGE_TEST_MONOPOLY_BALANCE='1500'
node full-gameplay.test.js
```

No production game code was changed during this verification. Existing workspace changes were retained.

## Limits

These were automated source/VM and local server/socket tests. A live desktop visual walkthrough and actual screen-reader speech were not tested. No evidence establishes the cause of the previously reported crash. Some server test processes remained alive briefly after printing success while connection cleanup completed; all ultimately exited successfully.
