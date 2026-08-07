import { Server, Socket } from 'socket.io';

export function setupSocketIO(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Socket client connected: ${socket.id}`);

    // Join match real-time score room
    socket.on('join_match', (matchId: string) => {
      const room = `match:${matchId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Leave match real-time score room
    socket.on('leave_match', (matchId: string) => {
      const room = `match:${matchId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Join tournament room
    socket.on('join_tournament', (tournamentId: string) => {
      const room = `tournament:${tournamentId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined tournament room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket client disconnected: ${socket.id}`);
    });
  });
}
