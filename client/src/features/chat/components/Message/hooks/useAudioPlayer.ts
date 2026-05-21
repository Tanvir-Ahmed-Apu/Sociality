import { useState, useEffect, useCallback } from 'react';

export const useAudioPlayer = (voiceUrl: string | null) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    return () => {
      audioPlayer?.pause();
      setAudioPlayer(null);
    };
  }, [audioPlayer]);

  const togglePlay = useCallback(() => {
    if (!voiceUrl) return;
    if (!audioPlayer) {
      const player = new Audio(voiceUrl);
      player.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };
      player.ontimeupdate = () => {
        setPlaybackProgress((player.currentTime / player.duration) * 100);
      };
      setAudioPlayer(player);
      player.play().catch(console.error);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  }, [voiceUrl, audioPlayer, isPlaying]);

  return {
    isPlaying,
    playbackProgress,
    togglePlay
  };
};
