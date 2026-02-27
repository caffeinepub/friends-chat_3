import { useState, useRef, useCallback, useEffect } from 'react';

export type CallStatus = 'idle' | 'calling' | 'connected';

export interface UseVideoCallReturn {
  callStatus: CallStatus;
  isCallActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  mediaError: string | null;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useVideoCall(): UseVideoCallReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whenever the stream or the video element changes, wire them together.
  // This handles the case where the stream is ready before the video element mounts.
  const attachStream = useCallback(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
      localVideoRef.current.play().catch(() => {
        // Autoplay may be blocked; the muted+playsInline attributes handle most cases
      });
    }
  }, []);

  const startCall = useCallback(async () => {
    setMediaError(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallStatus('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      // Attach immediately if the video element is already mounted
      attachStream();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not access camera/microphone';
      setMediaError(message);
      // Still proceed with the call in simulated mode (camera off)
      setIsCameraOff(true);
    }

    // Simulate "Calling…" → "Connected" after 3 seconds
    connectedTimerRef.current = setTimeout(() => {
      setCallStatus('connected');
    }, 3000);
  }, [attachStream]);

  const endCall = useCallback(() => {
    if (connectedTimerRef.current) {
      clearTimeout(connectedTimerRef.current);
      connectedTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCallStatus('idle');
    setIsMuted(false);
    setIsCameraOff(false);
    setMediaError(null);
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const newEnabled = audioTracks.length > 0 ? !audioTracks[0].enabled : false;
      audioTracks.forEach(track => {
        track.enabled = newEnabled;
      });
      setIsMuted(!newEnabled);
    } else {
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      const newEnabled = videoTracks.length > 0 ? !videoTracks[0].enabled : false;
      videoTracks.forEach(track => {
        track.enabled = newEnabled;
      });
      setIsCameraOff(!newEnabled);
    } else {
      setIsCameraOff(prev => !prev);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectedTimerRef.current) {
        clearTimeout(connectedTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    callStatus,
    isCallActive: callStatus !== 'idle',
    isMuted,
    isCameraOff,
    mediaError,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    localVideoRef,
  };
}
