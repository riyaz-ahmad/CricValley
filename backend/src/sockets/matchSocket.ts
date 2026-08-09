import { Server, Socket } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';

const activeRtmpProcesses: Map<string, ChildProcess> = new Map();

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

    // RTMP Video Streaming Relay to YouTube / Facebook Live
    socket.on('start_rtmp_broadcast', (data: { rtmpUrl: string; streamKey: string }) => {
      const { rtmpUrl, streamKey } = data;
      if (!streamKey) {
        socket.emit('rtmp_status', { status: 'error', message: 'Stream Key is required' });
        return;
      }

      const fullRtmpDestination = rtmpUrl.endsWith('/')
        ? `${rtmpUrl}${streamKey}`
        : `${rtmpUrl}/${streamKey}`;

      console.log(`📡 Starting RTMP stream relay for socket ${socket.id} to ${rtmpUrl}`);

      try {
        const ffmpegArgs = [
          '-i', 'pipe:0',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-g', '30',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-f', 'flv',
          fullRtmpDestination,
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        ffmpeg.stderr.on('data', (stderrData) => {
          console.log(`FFmpeg [${socket.id}]:`, stderrData.toString());
        });

        ffmpeg.on('close', (code) => {
          console.log(`FFmpeg process for socket ${socket.id} exited with code ${code}`);
          activeRtmpProcesses.delete(socket.id);
          socket.emit('rtmp_status', { status: 'stopped', code });
        });

        ffmpeg.on('error', (err) => {
          console.error(`FFmpeg error for socket ${socket.id}:`, err.message);
          activeRtmpProcesses.delete(socket.id);
          socket.emit('rtmp_status', {
            status: 'error',
            message: `FFmpeg not found or failed to start: ${err.message}. Please use OBS Studio with Overlay Link!`,
          });
        });

        activeRtmpProcesses.set(socket.id, ffmpeg);
        socket.emit('rtmp_status', { status: 'broadcasting', destination: fullRtmpDestination });
      } catch (err: any) {
        socket.emit('rtmp_status', { status: 'error', message: err.message });
      }
    });

    socket.on('rtmp_video_chunk', (chunk: Buffer | ArrayBuffer) => {
      const ffmpeg = activeRtmpProcesses.get(socket.id);
      if (ffmpeg && ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
        try {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          ffmpeg.stdin.write(buffer);
        } catch (e) {
          console.error('Error writing video chunk to FFmpeg stdin:', e);
        }
      }
    });

    socket.on('stop_rtmp_broadcast', () => {
      const ffmpeg = activeRtmpProcesses.get(socket.id);
      if (ffmpeg) {
        try {
          if (ffmpeg.stdin) ffmpeg.stdin.end();
          ffmpeg.kill('SIGINT');
        } catch (e) {}
        activeRtmpProcesses.delete(socket.id);
      }
      socket.emit('rtmp_status', { status: 'stopped' });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket client disconnected: ${socket.id}`);
      const ffmpeg = activeRtmpProcesses.get(socket.id);
      if (ffmpeg) {
        try {
          if (ffmpeg.stdin) ffmpeg.stdin.end();
          ffmpeg.kill('SIGKILL');
        } catch (e) {}
        activeRtmpProcesses.delete(socket.id);
      }
    });
  });
}
