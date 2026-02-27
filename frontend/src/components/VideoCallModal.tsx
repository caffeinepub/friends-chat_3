import React, { useEffect, useRef } from 'react';
import { Principal } from '@dfinity/principal';
import { useGetUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface VideoCallModalProps {
  friendPrincipal: Principal;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoCallModal({
  friendPrincipal,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  localVideoRef,
}: VideoCallModalProps) {
  const { data: friendProfile } = useGetUserProfile(friendPrincipal);

  // Escape key to end call
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEndCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEndCall]);

  const friendName = friendProfile?.displayName ?? 'Friend';
  const friendInitials = friendName.slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-call-bg">
      {/* Remote video area (simulated) */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Friend avatar / remote video placeholder */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-28 h-28 rounded-full bg-call-remote flex items-center justify-center text-4xl font-bold text-call-text shadow-2xl">
            {friendInitials}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-call-text">{friendName}</h2>
            <p className="text-call-text/70 text-sm mt-1 animate-pulse">Calling…</p>
          </div>
        </div>

        {/* Local camera PiP */}
        <div className="absolute bottom-24 right-4 w-32 h-24 rounded-xl overflow-hidden bg-call-pip border-2 border-call-controls shadow-lg">
          {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-call-pip">
              <VideoOff className="w-8 h-8 text-call-text/50" />
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full border-2 ${
              isMuted
                ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
                : 'bg-call-controls/20 border-call-controls text-call-text hover:bg-call-controls/30'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            size="icon"
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-white border-0 shadow-lg"
            title="End call"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCamera}
            className={`w-14 h-14 rounded-full border-2 ${
              isCameraOff
                ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
                : 'bg-call-controls/20 border-call-controls text-call-text hover:bg-call-controls/30'
            }`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
