'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  setVolume: (vol: number) => void;
  formattedTime: string;
  formattedDuration: string;
}

export function useAudioPlayer(src?: string, fallbackDurationSeconds?: number): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(fallbackDurationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(1.0);

  // Synchronize fallbackDurationSeconds if updated from backend data
  useEffect(() => {
    if (fallbackDurationSeconds !== undefined) {
      setDuration(fallbackDurationSeconds);
    }
  }, [fallbackDurationSeconds]);

  // Initialize Audio Source
  useEffect(() => {
    if (!src) return;

    if (!audioRef.current) {
      const audio = new Audio(src);
      audioRef.current = audio;
    } else {
      audioRef.current.src = src;
    }

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      if (fallbackDurationSeconds === undefined || fallbackDurationSeconds === 0) {
        setDuration(audio.duration || 0);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [src, fallbackDurationSeconds]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const maxDur = duration || audioRef.current.duration || seconds;
    const target = Math.max(0, Math.min(seconds, maxDur));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying, duration]);

  const setSpeed = useCallback((rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = vol;
    setVolumeState(vol);
  }, []);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  const effectiveDuration = (fallbackDurationSeconds !== undefined && fallbackDurationSeconds > 0)
    ? fallbackDurationSeconds
    : duration;

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration: effectiveDuration,
    playbackRate,
    volume,
    togglePlayPause,
    seekTo,
    setSpeed,
    setVolume,
    formattedTime: formatSeconds(currentTime),
    formattedDuration: formatSeconds(effectiveDuration),
  };
}
