import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Video, Play, Square, Settings, Copy, Check, ArrowLeft, RefreshCw, Youtube, Facebook, Shield, Circle, Zap } from 'lucide-react';
import { Match } from '../../types';
import { apiRequest } from '../../services/api';
import { storage } from '../../services/storage';

export const AdminStreamerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Camera & Video state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreamingLocally, setIsStreamingLocally] = useState<boolean>(false);
  const [copiedObsLink, setCopiedObsLink] = useState<boolean>(false);

  // RTMP Stream Config
  const [platform, setPlatform] = useState<'YOUTUBE' | 'FACEBOOK'>('YOUTUBE');
  const [streamKey, setStreamKey] = useState<string>('');
  const [rtmpUrl, setRtmpUrl] = useState<string>('rtmp://a.rtmp.youtube.com/live2');

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
  };

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
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="bg-slate-950/90 border border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl text-sm">
                      {activeInnings?.battingTeam?.shortName || match.homeTeam.shortName}
                    </div>
                    <div>
                      <div className="font-mono font-black text-xl text-white">
                        {activeInnings?.totalRuns || 0}/{activeInnings?.wickets || 0}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold">{activeInnings?.overs || 0} Overs</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-amber-400 uppercase font-black">🔴 LIVE BROADCAST</div>
                    <div className="text-xs font-bold text-slate-300">{match.tournament?.title || 'CricValley Cup'}</div>
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
                <label className="block text-slate-300 font-bold mb-1 uppercase text-[10px]">Your Live Stream Key *</label>
                <input
                  type="password"
                  placeholder="Paste YouTube/Facebook Stream Key here..."
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 font-medium leading-relaxed">
                💡 <strong>Broadcasting Tip:</strong> For highest 60FPS video quality, open OBS Studio, add Video Capture Source (Camera), add Browser Source URL ({obsOverlayUrl}), enter your Stream Key, and click Start Streaming!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
