'use client';

import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { UseAudioPlayerReturn } from '@/hooks/useAudioPlayer';
import styles from './MediaPlayerBar.module.css';

interface MediaPlayerBarProps {
  player: UseAudioPlayerReturn;
}

export const MediaPlayerBar: React.FC<MediaPlayerBarProps> = ({ player }) => {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    togglePlayPause,
    seekTo,
    setSpeed,
    setVolume,
    formattedTime,
    formattedDuration,
  } = player;

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  const handleSpeedCycle = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    seekTo(targetTime);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(1.0);
    }
  };

  return (
    <div className={styles.playerBar}>
      <div className={styles.leftControls}>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        <div className={styles.timeDisplay}>
          <span>{formattedTime}</span>
          <span style={{ margin: '0 0.25rem', opacity: 0.5 }}>/</span>
          <span>{formattedDuration}</span>
        </div>
      </div>

      <div className={styles.seekContainer}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          className={styles.seekSlider}
          title="Seek playback position"
        />
      </div>

      <div className={styles.rightControls}>
        <button
          className={styles.speedBtn}
          onClick={handleSpeedCycle}
          title="Change playback speed"
        >
          {playbackRate}x
        </button>

        <div className={styles.volumeControl}>
          <button
            className={styles.volumeBtn}
            onClick={toggleMute}
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
            title="Adjust volume"
          />
        </div>
      </div>
    </div>
  );
};
