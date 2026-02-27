import React, { useEffect, useRef } from 'react';
import { Principal } from '@dfinity/principal';
import { useGetUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle } from 'lucide-react';
import type { CallStatus } from '../hooks/useVideoCall';

interface VideoCallModalProps {
  friendPrincipal: Principal;
  callStatus: CallStatus;
  isMuted: boolean;
  isCameraOff: boolean;
  mediaError: string | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function VideoCallModal({
  friendPrincipal,
  callStatus,
  isMuted,
  isCameraOff,
  mediaError,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  localVideoRef,
  remoteAudioRef,
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

  // Local video element ref — synced with the hook's localVideoRef
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el && el.srcObject) {
      el.play().catch(() => {});
    }
  };

  // Remote audio element ref — synced with the hook's remoteAudioRef
  const setRemoteAudioRef = (el: HTMLAudioElement | null) => {
    (remoteAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el;
    if (el && el.srcObject) {
      el.play().catch((err) => {
        console.warn('Remote audio play error:', err);
      });
    }
  };

  // When isCameraOff transitions to false, ensure the video element plays
  useEffect(() => {
    if (!isCameraOff && videoElRef.current && videoElRef.current.srcObject) {
      videoElRef.current.play().catch(() => {});
    }
  }, [isCameraOff]);

  const friendName = friendProfile?.displayName ?? 'Friend';
  const friendInitials = friendName.slice(0, 2).toUpperCase();

  const statusLabel =
    callStatus === 'connected' ? 'Connected' : 'Calling…';
  const statusClass =
    callStatus === 'connected'
      ? 'text-green-400 text-sm mt-1'
      : 'text-call-text/70 text-sm mt-1 animate-pulse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-call-bg">
      {/*
        Hidden remote audio element — receives the remote media stream.
        Must NOT be muted so the user can hear the other party.
        autoPlay ensures playback starts as soon as srcObject is set.
      */}
      <audio
        ref={setRemoteAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />

      {/* Remote video area */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Friend avatar / remote video placeholder */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-28 h-28 rounded-full bg-call-remote flex items-center justify-center text-4xl font-bold text-call-text shadow-2xl">
            {friendInitials}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-call-text">{friendName}</h2>
            <p className={statusClass}>{statusLabel}</p>
          </div>
        </div>

        {/* Media error notice */}
        {mediaError && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive mb-4 max-w-xs text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Camera/mic unavailable: {mediaError}</span>
          </div>
        )}

        {/* Local camera PiP */}
        <div className="absolute bottom-24 right-4 w-32 h-24 rounded-xl overflow-hidden bg-call-pip border-2 border-white/10 shadow-lg">
          {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-call-pip">
              <VideoOff className="w-8 h-8 text-call-text/50" />
            </div>
          ) : (
            <video
              ref={setVideoRef}
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
            className={`w-14 h-14 rounded-full border-2 transition-colors ${
              isMuted
                ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
                : 'bg-white/10 border-white/20 text-call-text hover:bg-white/20'
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
            className={`w-14 h-14 rounded-full border-2 transition-colors ${
              isCameraOff
                ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
                : 'bg-white/10 border-white/20 text-call-text hover:bg-white/20'
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
