# AppContest: Multiplayer Arena

A tiny browser multiplayer game starter. Open two browser tabs, join the same room, move your squares, and race to collect the golden target. First to 5 points wins a round.

## Requirements
- Node.js 20 or newer
- npm

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000 in two tabs (or on two devices on the same network using your computer's LAN IP). Enter the same room code in both tabs. Use WASD or arrow keys to move.

## Project layout
- `server/index.js`: HTTP server, room state, movement validation and WebSocket events
- `public/index.html`: browser interface
- `public/style.css`: visual styling
- `public/game.js`: keyboard input, network client and canvas rendering

## How it works
The server owns player positions, target positions and scores. Clients send movement intentions, not scores. A room supports up to 8 players; empty rooms are removed. This is an experimental local prototype, not a production deployment: there is no login, persistence, moderation, reconnection recovery, or anti-cheat beyond basic input limits.

## Next steps
Add matchmaking, mobile touch controls, accessible controls, better game modes, tests, and deployment configuration. The game intentionally has no dependency on SHIFT-CHANGE-EMERGENT.
