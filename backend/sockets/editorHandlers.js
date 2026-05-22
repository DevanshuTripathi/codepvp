import { setCode, getCode, setCursor, getCursors } from '../services/roomService.js';

export function editorHandlers(io, socket) {
  socket.on('joinProblemRoom', async ({ roomId, teamId, problemId, username, language }) => {
    socket.join(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`);
    socket.join(`${roomId}-team-${teamId}`);
    // send existing code and cursors
    const code = await getCode(`${roomId}:${problemId}:${language}`) || '';
    const cursors = await getCursors(`${roomId}:${problemId}:${language}`);
    socket.emit('editorUpdate', { code, cursors });
  });

  socket.on('leaveProblemRoom', ({ roomId, teamId, problemId, language }) => {
    socket.leave(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`);
  });

  socket.on('editorChange', async ({ roomId, teamId, problemId, code, source, language }) => {
    // persist code
    await setCode(`${roomId}:${problemId}:${language}`, code);
    io.to(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`).emit('editorUpdate', { code, source });
  });

  socket.on('cursorMove', async ({ roomId, teamId, problemId, username, cursor, language }) => {
    await setCursor(`${roomId}:${problemId}:${language}`, username, cursor);
    io.to(`${roomId}-team-${teamId}`).emit('cursorUpdate', { username, cursor });
  });

  socket.on('markSolved', ({ roomId, teamId, problemId, username }) => {
    io.to(`${roomId}-team-${teamId}`).emit('solvedProblem', { problemId, teamId, username });
  });

  socket.on('joinProblemset', ({ roomId, teamId }) => {
    socket.join(`${roomId}-team-${teamId}`);
  });
}
