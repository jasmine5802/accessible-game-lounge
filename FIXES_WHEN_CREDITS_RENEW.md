# Accessible Game Lounge — Fixes for When Credits Renew

## Implementation progress — July 24, 2026

Implemented in the working source:

- The application root now opens the keyboard-first desktop lobby instead of the older webpage-style page.
- The lobby uses a compact desktop-client presentation rather than a large webpage-style landing layout.
- Every game now uses the same desktop-client shell: compact title bar, flat game panels, standard controls, square dialogs, and solid application backgrounds.
- Game screens use a `Return to Game List` control instead of webpage-style lobby navigation links.
- The game list stops at its first and last entries instead of wrapping around.
- Duck Race is now the consistent name throughout the interface and game messages.
- Duck Race and The Game of Life are now included in the unified desktop game list and create/join/start flow.
- Login is restored from the launch session and is not shown again when returning from a game.
- Create and join actions are presented from each selected game's table menu.
- Direct `Y`/`N` prompts now control options, instructions, and keyboard-command setup.
- Monopoly board, UNO rules, Dominoes settings, and Game of Life theme selections are saved to the game room and used throughout that game.
- A newly created game starts with its default options. Options from an earlier finished or abandoned game are not reused.
- Rejoining a game already in progress restores that room's existing options and Monopoly token selections from the server.
- Every game page now has separate persistent sound and synthesized-speech volume controls.
- Sound effects now default to 125 percent and can be boosted to 200 percent; speech remains independently adjustable from 0 to 100 percent.
- `Q`/`q` now opens an accessible `Y`/`N` leave confirmation and removes the player from the game before returning to the game list.
- All active game clients now connect to the server that launched the desktop application.
- The Windows installer configuration now uses a normal assisted installation flow, supports choosing the destination, creates Start Menu and desktop shortcuts, and registers an uninstaller.

Automated checks currently passing:

- Keyboard-first lobby route and two-player create/join/start flow for all eight games in the desktop game list.
- Two authenticated players successfully entered every game, and the host completed a representative gameplay action that produced a synchronized state update for both-player rooms.
- Selected Monopoly, UNO, and Dominoes options are present in the created room.
- Q-style server cleanup prevents a player from rejoining a finished game as an active participant.
- UNO rules regression checks and JavaScript syntax checks.

Still required before building or sharing the installer:

- Representative full-match testing for every game with two players.
- Hands-on testing with a blind screen-reader user and a sighted player.
- Clean install, upgrade, later-launch, shortcut, and uninstall testing.

## Primary goal

Rework Accessible Game Lounge so that it behaves like a conventional accessible desktop game client, using RS Games and Quentin C's Playroom as interaction references. It must not feel or navigate like a webpage. Both blind and sighted players must be able to install it, enter every game, configure it, play it, and leave it successfully.

## Priority 1: Make the games playable

- Test every included game from launch through completion or a representative full match.
- Confirm that both blind and sighted players can enter and play every game.
- Fix any game that prevents players from entering, starting, continuing, or completing play.
- Confirm that all game-specific option selections are applied and saved when appropriate.
- Do not build the final shareable installer until every game passes the test checklist below.

## Game-selection and lobby flow

1. Launch the installed Accessible Game Lounge application.
2. Show the login prompt once per application launch. Do not display it twice.
3. Present the game list as an accessible desktop list/menu, not as webpage navigation.
4. After a player selects a game and presses Enter, show the relevant lobby actions:
   - **Create a game** must always be available.
   - **Join a game** must be available when a joinable game is in progress or waiting for players.
5. After the player chooses **Create a game**, open that game's options flow before starting the game.

The interaction and navigation should take inspiration from RS Games and Quentin C's Playroom, while retaining Accessible Game Lounge's own identity.

## Game options, instructions, and keyboard commands

These prompts must use direct keyboard choices rather than webpage-style buttons:

- Ask whether the player wants to change the current game options: `Y` for yes and `N` for no.
- Pressing `Y` must open the game-options menu.
- Pressing `N` must retain the current/default options and continue.
- Ask whether the player wants to hear/read the game instructions: `Y` for yes and `N` for no.
- Pressing `Y` must open the instructions/how-to-play content.
- Ask whether the player wants to hear/read the keyboard commands: `Y` for yes and `N` for no.
- Pressing `Y` must open the keyboard-commands content.
- Both uppercase and lowercase input should work (`Y`/`y` and `N`/`n`).
- Each prompt must announce its purpose, the valid keys, and what happens next.
- Focus must be placed on the prompt so that the first `Y` or `N` keypress is recognized.
- Do not implement these choices as buttons.
- Invalid keys should not silently advance the flow; repeat or re-announce the valid choices.

Current defect: the tested build does not accept `Y` or `N` for these choices.

## Known game defects

### Monopoly

- Fix saving/applying the selected board.
- Fix saving/applying the selected token.
- Verify that the chosen board and token remain selected when the game begins.

### Quit command

- Fix `Q` so that it quits or exits the current game as documented.
- Make the exit behavior predictable and accessible, including any confirmation prompt.
- Test uppercase and lowercase (`Q` and `q`) unless the command documentation explicitly states otherwise.

## Audio and speech

- Add separate **sound volume** and **speech volume** controls, similar in purpose to those in RS Games.
- Make both controls keyboard accessible and screen-reader accessible.
- Announce the control name, current value, and changes.
- Provide enough volume range because the current game sounds are too quiet.
- Save the player's volume settings between application launches.
- Confirm that changing speech volume does not unintentionally change sound-effects volume, and vice versa.

## Desktop layout and accessibility

- Replace the webpage-style layout and interaction model with an accessible desktop game-client layout.
- Ensure every game is fully playable by sighted players as well as blind players. Important game state, choices, turns, scores, instructions, alerts, and results must be clearly visible and must not depend on speech or audio alone.
- Keep visual game boards, cards, pieces, controls, status information, and player feedback clear and understandable throughout play.
- Use standard, logical keyboard navigation and predictable focus order.
- Ensure every screen exposes meaningful names, roles, states, and instructions to screen readers.
- Do not require a mouse for login, game selection, lobby actions, configuration, gameplay, help, or quitting.
- Keep visual focus clear for sighted keyboard users.
- Ensure text, selection, and focus indicators have sufficient visual contrast.
- Avoid unexpected focus changes and make screen transitions clear to both sighted and blind players.
- Verify that screen-reader announcements do not repeat unnecessarily or omit important state changes.

## Login behavior

- Show the login flow only when the application is launched and authentication is needed.
- Do not show duplicate login prompts during one launch.
- Do not show the login prompt again merely because a player enters or leaves a game.
- Verify keyboard and screen-reader access to every login field, error, and action.

## Installer and uninstaller

- The installer must work like other normal Windows program installers, with a clear installation flow separate from launching the installed game.
- Replace the current executable behavior with a normal program installer.
- Running the installed application must launch the program; it must not reinstall the program each time.
- During installation, clearly display and/or announce the destination folder.
- Allow the player to review or choose the installation location where practical.
- Add Accessible Game Lounge to the operating system's installed-apps/programs list.
- Provide a working uninstaller.
- Create appropriate application shortcuts and ensure they launch the installed program rather than the installer.
- Preserve user settings during an upgrade when appropriate; clearly handle settings during uninstall.
- Test clean install, first launch, later launches, upgrade/reinstall, and uninstall.
- Do not build, publish, share, or ask the player to download the final installer until every game fix, accessibility fix, and required test in this document is complete.

## Per-game test checklist

Run this checklist for **every game**, documenting the result and any defect found:

- [ ] Game appears in the game list and its name is announced correctly.
- [ ] Enter opens the correct lobby/game-entry screen.
- [ ] Create-game flow works.
- [ ] Join-game flow works when a joinable session exists.
- [ ] `Y` opens game options when options are offered.
- [ ] `N` keeps the current/default options and continues.
- [ ] Every available option can be navigated with the keyboard.
- [ ] Option selections can be saved/applied.
- [ ] Saved selections are actually used when gameplay starts.
- [ ] Instructions open when `Y` is pressed at the instructions prompt.
- [ ] Keyboard commands open when `Y` is pressed at the commands prompt.
- [ ] Gameplay is understandable and operable with a screen reader.
- [ ] Gameplay is understandable and operable visually.
- [ ] All documented keyboard commands work.
- [ ] `Q`/quit behavior works.
- [ ] A representative full game can be completed without becoming blocked.
- [ ] Returning to the game list works and focus lands in a sensible place.

For multiplayer games, test with at least two players where possible, including the create, discover/join, turn-taking, disconnect, reconnect (if supported), and end-of-game flows.

## Installer release checklist

- [ ] Clean installation succeeds on a supported computer.
- [ ] The installer states the installation destination.
- [ ] The installed application is distinct from the installer.
- [ ] First launch shows one login flow.
- [ ] Second and later launches do not trigger installation again.
- [ ] Shortcuts launch the application correctly.
- [ ] Sound and speech volume controls work and persist.
- [ ] A blind player completes the core install-to-gameplay flow.
- [ ] A sighted player completes the core install-to-gameplay flow.
- [ ] Every game's per-game checklist passes.
- [ ] Uninstall succeeds and removes the installed program.
- [ ] The final installer is built only after the tested build passes all required checks.

## Definition of done

This work is complete only when the application installs and uninstalls like a normal desktop program; login appears once at launch; the interface no longer behaves like a webpage; game creation, joining, options, instructions, commands, volume controls, and quitting all work from the keyboard; Monopoly retains its board and token selections; and every included game has been verified as playable by both blind and sighted players before the final installer is shared.

The final installer and download are the last step. They must wait until all fixes and checklists above pass.

No game passes testing unless a sighted player can understand and complete it using the visible interface, without relying on screen-reader speech or audio-only information.
