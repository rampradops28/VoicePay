'use client';

import { useBilling } from '@/context/BillingContext';
import { useEffect, useRef } from 'react';

export default function AudioPlayer() {
  const { audio, clearAudio } = useBilling();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audio && audioRef.current) {
      audioRef.current.src = audio.src;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audio]);

  const handleEnded = () => {
    clearAudio();
  };

  return <audio ref={audioRef} onEnded={handleEnded} className="hidden" />;
}
