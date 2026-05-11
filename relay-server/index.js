const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT || '8080', 10);
const PHONE_CLIENT_DIR = path.join(__dirname, 'phone-client');

// Map roomId -> Map<"desktop"|"phone", WebSocket>
const rooms = new Map();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Serve phone client
  if (url.pathname === '/phone' || url.pathname === '/phone/') {
    const filePath = path.join(PHONE_CLIENT_DIR, 'index.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(fs.readFileSync(filePath, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end('Phone client not found');
    }
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const room = url.searchParams.get('room');
  const role = url.searchParams.get('role'); // 'desktop' | 'phone'

  if (!room || !role || !['desktop', 'phone'].includes(role)) {
    ws.close(4000, 'Missing or invalid room/role parameter');
    return;
  }

  console.log(`[Relay] ${role} connected to room ${room.slice(0, 8)}...`);

  if (!rooms.has(room)) {
    rooms.set(room, new Map());
  }
  const roomPeers = rooms.get(room);

  // If same role already connected, close old connection
  const existing = roomPeers.get(role);
  if (existing && existing.readyState === 1) {
    existing.close(4001, 'New connection with same role');
  }
  roomPeers.set(role, ws);

  ws.on('message', (data) => {
    // Forward to the other peer in the room
    const otherRole = role === 'desktop' ? 'phone' : 'desktop';
    const peer = roomPeers.get(otherRole);
    if (peer && peer.readyState === 1) {
      peer.send(data.toString());
    }
  });

  ws.on('close', () => {
    console.log(`[Relay] ${role} disconnected from room ${room.slice(0, 8)}...`);
    roomPeers.delete(role);
    if (roomPeers.size === 0) {
      rooms.delete(room);
      console.log(`[Relay] Room ${room.slice(0, 8)}... cleaned up`);
    }
  });

  ws.on('error', (err) => {
    console.error(`[Relay] WebSocket error (${role}, ${room.slice(0, 8)}...):`, err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CCTerm Relay] Listening on port ${PORT}`);
  console.log(`[CCTerm Relay] Phone client: http://0.0.0.0:${PORT}/phone`);
});
