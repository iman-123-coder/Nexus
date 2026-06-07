import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff,
  Copy, Check, Loader, Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();

  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [inCall, setInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (remoteConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remoteConnected]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const createPeer = (stream: MediaStream) => {
    const peer = new RTCPeerConnection(iceServers);

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', event.candidate, roomId);
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        setRemoteConnected(false);
        toast.error('Remote user disconnected');
      }
    };

    return peer;
  };

  const startCall = async () => {
    const newRoomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setRoomId(newRoomId);
    await joinRoom(newRoomId, true);
  };

  const joinCall = async () => {
    if (!joinInput.trim()) {
      toast.error('Enter a room ID');
      return;
    }
    setRoomId(joinInput.trim().toUpperCase());
    await joinRoom(joinInput.trim().toUpperCase(), false);
  };

  const joinRoom = async (room: string, isInitiator: boolean) => {
    try {
      setIsConnecting(true);

      const stream = await getLocalStream();

      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

      socketRef.current.emit('join-room', room, user?.id);

      const peer = createPeer(stream);
      peerRef.current = peer;

      // Other user already in room — we create offer
      socketRef.current.on('user-connected', async () => {
        toast.success('Someone joined the room!');
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current?.emit('offer', offer, room);
      });

      socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current?.emit('answer', answer, room);
      });

      socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ignore stale candidates
        }
      });

      setInCall(true);
      setIsConnecting(false);
    } catch (err: any) {
      setIsConnecting(false);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/mic permission denied');
      } else {
        toast.error('Failed to start call');
      }
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    socketRef.current?.disconnect();
    localStreamRef.current = null;
    peerRef.current = null;
    setInCall(false);
    setRemoteConnected(false);
    setRoomId('');
    setJoinInput('');
    setIsCamOn(true);
    setIsMicOn(true);
    setCallDuration(0);
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success('Room ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Pre-call lobby ───────────────────────────────────────────────
  if (!inCall) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
            <p className="text-gray-500 mt-1 text-sm">Start a new call or join an existing room</p>
          </div>

          {/* Start new call */}
          <button
            onClick={startCall}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Phone size={20} />
            )}
            {isConnecting ? 'Connecting...' : 'Start New Call'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or join existing</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Join existing */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room ID..."
              value={joinInput}
              onChange={e => setJoinInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCall()}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase tracking-widest"
            />
            <button
              onClick={joinCall}
              disabled={isConnecting || !joinInput.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── In-call view ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-gray-900 rounded-xl overflow-hidden animate-fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white text-sm font-medium">
            {remoteConnected ? `Connected · ${formatDuration(callDuration)}` : 'Waiting for others to join...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-mono tracking-widest">{roomId}</span>
          <button
            onClick={copyRoomId}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy room ID"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">

        {/* Remote video */}
        {remoteConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
              <Video size={36} className="text-gray-500" />
            </div>
            <p className="text-sm">Share the Room ID with someone to connect</p>
            <button
              onClick={copyRoomId}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              Copy Room ID: {roomId}
            </button>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-600 shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isCamOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={24} className="text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1">
            <span className="text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">You</span>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 py-5 bg-gray-800/80 backdrop-blur">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMicOn
              ? 'bg-gray-600 hover:bg-gray-500 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isCamOn
              ? 'bg-gray-600 hover:bg-gray-500 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg"
          title="End call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};