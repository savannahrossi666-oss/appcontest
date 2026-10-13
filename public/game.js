const canvas = document.querySelector('#board');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const scores = document.querySelector('#scores');
const form = document.querySelector('#join');
let socket, myId, state;
const cell = 30;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#29354e';
  for (let x = 0; x <= 20; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, 420); ctx.stroke(); }
  for (let y = 0; y <= 14; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(600, y * cell); ctx.stroke(); }
  if (!state) return;
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.arc(state.target.x * cell + 15, state.target.y * cell + 15, 11, 0, Math.PI * 2); ctx.fill();
  for (const p of state.players) {
    ctx.fillStyle = p.id === myId ? '#56d9d0' : '#e979ac';
    ctx.fillRect(p.x * cell + 3, p.y * cell + 3, 24, 24);
  }
  scores.replaceChildren(...state.players.map(p => {
    const li = document.createElement('li');
    li.textContent = (p.id === myId ? 'You' : 'Player ' + p.id.slice(0, 4)) + ': ' + p.score;
    return li;
  }));
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (socket) socket.close();
  myId = null; state = null; scores.replaceChildren(); draw();
  const room = document.querySelector('#room').value.trim().toUpperCase();
  socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  const current = socket;
  status.textContent = 'Connecting…';
  current.addEventListener('open', () => current.send(JSON.stringify({ type: 'join', room })));
  current.addEventListener('message', event => {
    if (socket !== current) return;
    const msg = JSON.parse(event.data);
    if (msg.type === 'joined') { myId = msg.id; status.textContent = 'Room ' + msg.room + ' • connected'; }
    if (msg.type === 'state') { state = msg; draw(); }
    if (msg.type === 'winner') status.textContent = (msg.id === myId ? 'You won!' : 'Another player won!') + ' New round started.';
    if (msg.type === 'error') status.textContent = msg.message;
  });
  current.addEventListener('close', () => { if (socket === current) status.textContent = 'Disconnected. Join again to reconnect.'; });
});
const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement) return;
  const direction = keys[event.key] || keys[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  if (socket?.readyState === WebSocket.OPEN && myId) socket.send(JSON.stringify({ type: 'move', direction }));
});
draw();
