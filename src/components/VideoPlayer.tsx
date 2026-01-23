
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
    // Initialize player if it doesn't exist
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video");
      videoElement.className = "video-js vjs-big-play-centered vjs-fill";
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, options, function() {
        onReady?.(this);
      });
    }

    // Dispose player on unmount
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once to initialize the player

  // Handle updates to options, like changing the source
  useEffect(() => {
    const player = playerRef.current;

    if (player && !player.isDisposed()) {
      // Update sources if they have changed
      if (options.sources && options.sources.length > 0) {
        const currentSrc = player.currentSrc();
        const newSrc = options.sources[0]?.src;
        
        // Only update the source if it's different to prevent re-loading the same video
        if (newSrc && newSrc !== currentSrc) {
          player.src(options.sources);
          // With autoplay: true, video.js will attempt to play automatically.
        }
      }
      
      // Update other properties like controls and muted state
       if (player.controls() !== (options.controls ?? false)) {
            player.controls(options.controls ?? false);
        }
      if (player.muted() !== (options.muted ?? false)) {
        player.muted(options.muted ?? false);
      }
    }
  }, [options.sources, options.muted, options.controls]); // Re-run when sources, muted, or controls state changes

  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
