#!/usr/bin/env node
import { io } from 'socket.io-client';

const SERVER = process.env.SERVER || 'http://localhost:5000';

function makeClient(name) {
  const socket = io(SERVER, { transports: ['websocket'], reconnection: true });
  socket.on('connect', () => console.log(`${name} connected ${socket.id}`));
  socket.on('disconnect', () => console.log(`${name} disconnected`));
  socket.on('editorUpdate', (d) => console.log(`${name} editorUpdate`, d));
  return socket;
}

(async () => {
  const alice = makeClient('alice');
  const bob = makeClient('bob');
  const carol = makeClient('carol');

  await new Promise(r => setTimeout(r, 1500));

  alice.emit('registerUser', { username: 'alice' });
  bob.emit('registerUser', { username: 'bob' });
  carol.emit('registerUser', { username: 'carol' });

  const roomId = 'itest-room-1';
  alice.emit('joinProblemRoom', { roomId, teamId: 'A', problemId: 'p1', username: 'alice', language: 'js' });
  bob.emit('joinProblemRoom', { roomId, teamId: 'A', problemId: 'p1', username: 'bob', language: 'js' });
  carol.emit('joinProblemRoom', { roomId, teamId: 'B', problemId: 'p1', username: 'carol', language: 'js' });

  await new Promise(r => setTimeout(r, 500));

  alice.emit('editorChange', { roomId, teamId: 'A', problemId: 'p1', code: 'console.log("hello from alice")', source: 'alice', language: 'js' });

  await new Promise(r => setTimeout(r, 1000));

  bob.emit('editorChange', { roomId, teamId: 'A', problemId: 'p1', code: 'console.log("bob edit")', source: 'bob', language: 'js' });

  await new Promise(r => setTimeout(r, 2000));

  alice.close(); bob.close(); carol.close();
  process.exit(0);
})();
