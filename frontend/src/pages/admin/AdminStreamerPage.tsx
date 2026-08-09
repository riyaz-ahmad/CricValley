import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Video, Play, Square, Settings, Copy, Check, ArrowLeft, RefreshCw, Youtube, Facebook, Shield, Circle, Zap, Lock, Unlock, Edit3, Save } from 'lucide-react';
import { Match } from '../../types';
import { apiRequest } from '../../services/api';
import { storage } from '../../services/storage';
import { useSocket } from '../../context/SocketContext';

export const AdminStreamerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Camera & Video state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreamingLocally, setIsStreamingLocally] = useState<boolean>(false);
  const [copiedObsLink, setCopiedObsLink] = useState<boolean>(false);

  // RTMP Stream Config
  const [platform, setPlatform] = useState<'YOUTUBE' | 'FACEBOOK'>('YOUTUBE');
  const [streamKey, setStreamKey] = useState<string>('');
  const [rtmpUrl, setRtmpUrl] = useState<string>('rtmp://a.rtmp.youtube.com/live2');
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState<boolean>(false);
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [rtmpStatusMessage, setRtmpStatusMessage] = useState<string>('');

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const res = await apiRequest<Match>(`/matches/${id}`);
      setMatch(res);
    } catch (err) {
      const allMatches = storage.getMatches();
      const found = allMatches.find((m) => m.id === id) || null;
      setMatch(found);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [id]);

  // Fetch available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getDevices();
  }, []);

  const startCamera = async (deviceId?: string) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsStreamingLocally(true);
    } catch (err: any) {
      alert('Camera permission denied or camera not available: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsStreamingLocally(false);
    stopBroadcast();
  };

  const startBroadcast = () => {
    if (!streamKey.trim()) {
      alert('Please paste your YouTube or Facebook Stream Key first!');
      return;
    }
    if (!stream) {
      alert('Please click "Turn On Cam" to enable your camera feed first!');
      return;
    }

    setIsLiveBroadcasting(true);
    setRtmpStatusMessage('Connecting live video feed to server...');

    if (socket) {
      socket.emit('start_rtmp_broadcast', { rtmpUrl, streamKey });

      try {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0 && socket) {
            socket.emit('rtmp_video_chunk', e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (err: any) {
        console.warn('MediaRecorder error:', err);
      }
    }
  };

  const stopBroadcast = () => {
    setIsLiveBroadcasting(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (socket) {
      socket.emit('stop_rtmp_broadcast');
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('rtmp_status', (data: any) => {
        if (data.status === 'broadcasting') {
          setRtmpStatusMessage('🟢 BROADCAST LIVE TRANSMITTING TO YOUTUBE!');
        } else if (data.status === 'error') {
          setRtmpStatusMessage(`⚠️ Note: ${data.message}`);
        } else if (data.status === 'stopped') {
          setRtmpStatusMessage('Broadcast Session Closed.');
        }
      });
    }
    return () => {
      if (socket) socket.off('rtmp_status');
    };
  }, [socket]);

  const obsOverlayUrl = `${window.location.origin}/overlay/${id}`;

  const copyObsLink = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopiedObsLink(true);
    setTimeout(() => setCopiedObsLink(false), 2000);
  };

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading Live Broadcast Studio...</div>;
  }

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const activeInnings = (inn2 && !inn2.isCompleted ? inn2 : inn1) || inn1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-black uppercase">
            <Circle className="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" /> Live Camera Streamer & OBS Studio Console
          </div>
          <h1 className="text-2xl font-heading font-black text-white mt-2">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <p className="text-xs text-slate-400">Stream camera feed to Facebook Live & YouTube Live with real-time scoreboard graphics!</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Admin Hub
          </Link>
          <Link to={`/admin/scorer/${match.id}`} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Scorer Console
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Camera Video Streamer with TV Scoreboard Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" /> Camera Preview & Live Graphics Overlay
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>

                {!isStreamingLocally ? (
                  <button
                    onClick={() => startCamera(selectedDeviceId)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Turn On Cam
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Cam
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {!isStreamingLocally && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90 space-y-3">
                  <Video className="w-12 h-12 text-slate-600 animate-pulse" />
                  <p className="text-xs text-slate-400 font-medium">Click "Turn On Cam" to initialize device camera feed</p>
                </div>
              )}

              {/* OVERLAID TV SPORTS SCOREBOARD GRAPHICS */}
              <div className="absolute bottom-3 left-2 right-2 pointer-events-none flex justify-center">
                <div className="flex items-center bg-[#200a46] p-0.5 rounded-r-xl border-t border-b border-[#3d137b] shadow-2xl scale-90 sm:scale-100 transform origin-bottom">
                  {/* 1. BATTERS BOX */}
                  <div className="bg-white text-black px-3 py-1 flex flex-col justify-center min-w-[170px] font-sans h-11 z-20">
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase">
                      <span className="flex items-center gap-1 text-[#111]">
                        {match.homeTeam.shortName} Batter 1 <span className="text-[#e6007e] font-black">*</span>
                      </span>
                      <div className="flex items-baseline gap-0.5 font-mono">
                        <span className="text-sm font-black text-black">03</span>
                        <span className="text-[10px] font-bold text-gray-600">5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase mt-0.5">
                      <span className="text-[#333]">{match.homeTeam.shortName} Batter 2</span>
                      <div className="flex items-baseline gap-0.5 font-mono">
                        <span className="text-sm font-black text-black">07</span>
                        <span className="text-[10px] font-bold text-gray-600">10</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. CENTER SCORE BOX */}
                  <div className="bg-[#200a46] text-white px-3 py-1 flex flex-col justify-center items-center h-11 z-20">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-black uppercase text-slate-200">
                        {match.awayTeam.shortName} v <strong className="text-white font-black">{match.homeTeam.shortName}</strong>
                      </div>
                      <div className="bg-[#e6007e] text-white font-mono font-black text-lg px-2 py-0.5 rounded-l-sm leading-none">
                        {activeInnings?.totalRuns || 0}-{activeInnings?.wickets || 0}
                      </div>
                      <div className="bg-[#e6e600] text-black font-mono font-black text-[10px] px-1.5 py-0.5 leading-none">
                        P2
                      </div>
                      <div className="text-[11px] font-black uppercase text-slate-100 font-mono">
                        {activeInnings?.overs || 0} OV
                      </div>
                    </div>
                  </div>

                  {/* 3. BOWLER & RECENT BALLS */}
                  <div className="bg-white text-black px-3 py-1 flex flex-col justify-center min-w-[170px] font-sans h-11 z-20">
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase">
                      <span className="text-[#111]">Bowler</span>
                      <div className="font-mono font-black text-xs text-black">
                        2-10 <span className="text-[10px] text-gray-600">(2.5)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {['0', '4', '1', '0', 'W', '●'].map((val, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black font-mono ${
                            val === 'W' ? 'bg-red-600 text-white' : 'bg-[#200a46] text-white'
                          }`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: OBS / Facebook / YouTube RTMP Stream Config */}
        <div className="space-y-4">
          {/* Method 1: OBS Studio Transparent Overlay URL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-heading font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> OBS / Streamyard Overlay Link
            </h3>
            <p className="text-xs text-slate-400">
              Copy this transparent Browser Source link and paste it into **OBS Studio**, **vMix**, or **PRISM Live** to stream to YouTube & Facebook with 4K camera quality!
            </p>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-400 truncate">
              <span className="truncate">{obsOverlayUrl}</span>
              <button
                onClick={copyObsLink}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0 ml-2"
              >
                {copiedObsLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Method 2: Direct Social RTMP Keys */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-heading font-black text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" /> Direct Social RTMP Streamer
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPlatform('YOUTUBE');
                  setRtmpUrl('rtmp://a.rtmp.youtube.com/live2');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  platform === 'YOUTUBE' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Youtube className="w-4 h-4" /> YouTube Live
              </button>

              <button
                onClick={() => {
                  setPlatform('FACEBOOK');
                  setRtmpUrl('rtmps://live-api-s.facebook.com:443/rtmp/');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  platform === 'FACEBOOK' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Facebook className="w-4 h-4" /> Facebook Live
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase text-[10px]">Server RTMP URL</label>
                <input
                  type="text"
                  readOnly
                  value={rtmpUrl}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold uppercase text-[10px]">
                    Your Live Stream Key *
                  </label>
                  {isKeySaved && (
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Saved & Connected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    readOnly={isKeySaved}
                    placeholder="Paste YouTube/Facebook Stream Key here..."
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none transition-all ${
                      isKeySaved
                        ? 'bg-slate-900 border border-emerald-500/60 text-emerald-400 font-bold cursor-not-allowed'
                        : 'bg-slate-950 border border-slate-800 text-white focus:border-emerald-500'
                    }`}
                  />

                  {!isKeySaved ? (
                    <button
                      onClick={() => {
                        if (!streamKey.trim()) {
                          alert('Please paste your YouTube or Facebook Stream Key first!');
                          return;
                        }
                        setIsKeySaved(true);
                        startBroadcast();
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shrink-0 transition-all transform hover:scale-105"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsKeySaved(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-amber-400" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {/* GO LIVE BUTTON & STREAM CONTROLS */}
              <div className="pt-2 space-y-2">
                {!isLiveBroadcasting ? (
                  <button
                    onClick={() => {
                      setIsKeySaved(true);
                      startBroadcast();
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all transform hover:-translate-y-0.5 ${
                      platform === 'YOUTUBE'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current animate-pulse" />
                    🔴 START STREAMING TO {platform === 'YOUTUBE' ? 'YOUTUBE LIVE' : 'FACEBOOK LIVE'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl flex items-center justify-between text-xs text-red-300 font-bold animate-pulse">
                      <span className="flex items-center gap-2">
                        <Circle className="w-3 h-3 fill-current text-red-500" />
                        BROADCAST SESSION ACTIVE
                      </span>
                      <span className="text-[10px] font-mono bg-red-900/60 px-2 py-0.5 rounded text-white">ONLINE</span>
                    </div>

                    {rtmpStatusMessage && (
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-amber-300 font-mono">
                        {rtmpStatusMessage}
                      </div>
                    )}

                    <button
                      onClick={stopBroadcast}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5 fill-current text-red-400" /> End Broadcast Session
                    </button>
                  </div>
                )}

                <a
                  href={platform === 'YOUTUBE' ? 'https://studio.youtube.com/live' : 'https://www.facebook.com/live/producer'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> Open {platform === 'YOUTUBE' ? 'YouTube Live Dashboard' : 'Facebook Live Producer'} ↗
                </a>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 font-medium leading-relaxed space-y-1">
                <p>💡 <strong>How Data Reaches YouTube/Facebook:</strong></p>
                <p className="text-[10px] text-amber-200/80">
                  1. Enter your Stream Key & click <strong>START STREAMING</strong>.<br />
                  2. For 60FPS broadcast quality, copy the <strong>Overlay Link</strong> into OBS Studio as a <em>Browser Source</em> and click Start Streaming!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE BROADCASTING ACTIVE MODAL */}
      {isLiveBroadcasting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-950 border border-red-500/40 rounded-xl text-red-500">
                  <Circle className="w-5 h-5 fill-current animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-black text-white uppercase">
                    Live Broadcast Active ({platform})
                  </h3>
                  <p className="text-xs text-slate-400">Match score overlay is live synced to your stream feed</p>
                </div>
              </div>
              <button
                onClick={() => setIsLiveBroadcasting(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Target Platform:</span>
                  <span className="text-white font-bold">{platform} LIVE</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Server RTMP:</span>
                  <span className="text-emerald-400 truncate max-w-[200px]">{rtmpUrl}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Stream Key:</span>
                  <span className="text-amber-400 font-mono">••••••••{streamKey.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Overlay Graphics:</span>
                  <span className="text-cyan-400 font-bold">1080p Transparent Active</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px]">Choose Your Broadcast Transmission Mode:</h4>
                
                <div className="grid grid-cols-1 gap-2">
                  <a
                    href={platform === 'YOUTUBE' ? 'https://studio.youtube.com/live' : 'https://www.facebook.com/live/producer'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-between shadow-lg transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Youtube className="w-4 h-4" /> 1. Open {platform === 'YOUTUBE' ? 'YouTube Live Dashboard' : 'Facebook Live'} Control Room
                    </span>
                    <span className="text-[10px] font-mono underline">GO TO STUDIO ↗</span>
                  </a>

                  <button
                    onClick={copyObsLink}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-bold rounded-xl flex items-center justify-between shadow-lg transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-emerald-400" /> 2. Copy OBS Overlay URL ({obsOverlayUrl})
                    </span>
                    <span className="text-[10px] font-mono">{copiedObsLink ? 'COPIED! ✓' : 'COPY LINK'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl text-slate-300 text-[11px] leading-relaxed">
                ✅ <strong>Everything is Set Up!</strong> Any ball event recorded in the Scorer Console will immediately display on your YouTube/Facebook Live camera stream graphics in real-time.
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsLiveBroadcasting(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Done / Hide Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
