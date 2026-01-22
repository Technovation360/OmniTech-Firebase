'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

interface VideoPlayerProps {
  options: VideoJsPlayerOptions;
  onReady?: (player: VideoJsPlayer) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    // Initialize player on mount
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video");
      videoElement.className = "video-js vjs-big-play-centered vjs-fill";
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, options, function() {
        onReady?.(this);
      });
      playerRef.current = player;
    }

    // Cleanup on unmount
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []); // <- Empty dependency array ensures this runs only once

  useEffect(() => {
    // Handle subsequent updates to options
    const player = playerRef.current;
    if (player && !player.isDisposed()) {
      if (options.sources && options.sources.length > 0) {
        const currentSrc = player.currentSrc();
        const newSrc = options.sources[0]?.src;
        
        // Only update source if it's different to prevent interrupting playback
        if (newSrc && currentSrc !== newSrc) {
          player.src(options.sources);
        }
      }
      player.autoplay(options.autoplay || false);
      player.muted(options.muted || false);
    }
  }, [options]); // <- React to changes in the options object

  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
