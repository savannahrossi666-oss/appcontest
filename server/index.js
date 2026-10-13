const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');

const PORT = Number(process.env.PORT) || 3000;
const root = path.resolve(__dirname, '../public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  const file = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(root, '.' + file);
  if (!resolved.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(resolved, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(resolved)] || 'application/octet-stream' });
    res.end(data);
  });
});
const wss = new WebSocket.Server({ server });
const rooms = new Map();
const randomTarget = () => ({ x: Math.floor(Math.random() * 18) + 1, y: Math.floor(Math.random() * 12) + 1 });
const send = (ws, data) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); };
const publish = (room) => {
  const state = { type: 'state', players: [...room.players.values()].map(({ id, x, y, score }) => ({ id, x, y, score })), target: room.target };
  for (const player of room.players.values()) send(player.ws, state);
};
wss.on('connection', (ws) => {
  let room, player;
  ws.on('message', (raw) => {
    if (raw.length > 1024) return;
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!room) {
      if (msg.type !== 'join' || typeof msg.room !== 'string') return;
      const code = msg.room.trim().toUpperCase();
      if (!/^[A-Z0-9]{1,12}$/.test(code)) { send(ws, { type: 'error', message: 'Use 1-12 letters or numbers.' }); return; }
      room = rooms.get(code);
      if (!room) { room = { players: new Map(), target: randomTarget() }; rooms.set(code, room); }
      if (room.players.size >= 8) { send(ws, { type: 'error', message: 'Room is full.' }); room = null; return; }
      const id = Math.random().toString(36).slice(2, 10);
      player = { id, ws, x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 14), score: 0, lastMove: 0 };
      room.players.set(id, player);
      send(ws, { type: 'joined', id, room: code });
      publish(room);
      return;
    }
    if (msg.type !== 'move' || !['up', 'down', 'left', 'right'].includes(msg.direction)) return;
    const now = Date.now();
    if (now - player.lastMove < 65) return;
    player.lastMove = now;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[msg.direction];
    player.x = Math.max(0, Math.min(19, player.x + delta[0]));
    player.y = Math.max(0, Math.min(13, player.y + delta[1]));
    if (player.x === room.target.x && player.y === room.target.y) {
      player.score++;
      if (player.score >= 5) {
        for (const p of room.players.values()) send(p.ws, { type: 'winner', id: player.id });
        for (const p of room.players.values()) p.score = 0;
      }
      room.target = randomTarget();
    }
    publish(room);
  });
  ws.on('close', () => {
    if (!room || !player) return;
    room.players.delete(player.id);
    if (room.players.size === 0) {
      for (const [code, candidate] of rooms) if (candidate === room) rooms.delete(code);
    } else publish(room);
  });
});
server.listen(PORT, () => console.log('AppContest running at http://localhost:' + PORT));
