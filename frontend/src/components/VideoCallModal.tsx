import React, { useEffect, useRef, RefObject } from 'react';
import { UserProfile } from '../backend';
import { MicOff, Mic, VideoOff, Video, PhoneOff } from 'lucide-react';

interface VideoCallModalProps {
  friend: UserProfile;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export default function VideoCallModal({
  friend,
  localVideoRef,
  remoteAudioRef,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: VideoCallModalProps) {
  const localVideoElRef = useRef<HTMLVideoElement>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement>(null);

  // Sync local video element with hook ref
  useEffect(() => {
    if (localVideoRef && localVideoElRef.current) {
      (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = localVideoElRef.current;
    }
  }, [localVideoRef]);

  // Sync remote audio element with hook ref
  useEffect(() => {
    if (remoteAudioRef && remoteAudioElRef.current) {
      (remoteAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = remoteAudioElRef.current;
      if (remoteAudioElRef.current.srcObject) {
        remoteAudioElRef.current.play().catch(() => {});
      }
    }
  }, [remoteAudioRef]);

  const initials = friend.displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Remote "video" area — shows avatar since this is simulated */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Remote participant */}
        <div className="flex flex-col items-center gap-4 mb-24">
          <div className="w-28 h-28 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center text-5xl font-bold text-primary">
            {initials}
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold">{friend.displayName}</p>
            <p className="text-white/60 text-sm mt-1 animate-pulse">Calling…</p>
          </div>
        </div>

        {/* Local video PiP */}
        <div className="absolute top-4 right-4 w-36 h-48 rounded-xl overflow-hidden border-2 border-white/20 bg-black shadow-xl">
          {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <VideoOff className="w-8 h-8 text-white/40" />
            </div>
          ) : (
            <video
              ref={localVideoElRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2 text-xs text-white/80 font-medium bg-black/40 px-1.5 py-0.5 rounded">
            You
          </div>
        </div>

        {/* Hidden remote audio */}
        <audio ref={remoteAudioElRef} autoPlay className="hidden" />

        {/* Call controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xl"
            title="End call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            onClick={onToggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              isCameraOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
