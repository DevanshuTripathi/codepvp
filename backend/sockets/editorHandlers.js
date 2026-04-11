export function editorHandlers(io, socket) {
  socket.on("joinProblemRoom", ({ roomId, teamId, problemId, username, language }) => {
    socket.join(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`);
  });

  socket.on("leaveProblemRoom", ({ roomId, teamId, problemId, language }) => {
    socket.leave(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`);
  });

  socket.on("editorChange", ({ roomId, teamId, problemId, code, source, language }) => {
    io.to(`${roomId}-team-${teamId}-problem-${problemId}-language-${language}`).emit("editorUpdate", { code, source });
  });

  socket.on("markSolved", ({ roomId, teamId, problemId, username }) => {
    io.to(`${roomId}-team-${teamId}`).emit("solvedProblem", { problemId, teamId, username });
  });

  socket.on("joinProblemset", ({ roomId, teamId }) => {
    socket.join(`${roomId}-team-${teamId}`);
  });
}
