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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    // Initialize the player only once
    if (!playerRef.current && containerRef.current) {
      // Create a <video> element and append it to the container
      const videoElement = document.createElement("video");
      videoElement.className = 'video-js vjs-big-play-centered';
      containerRef.current.appendChild(videoElement);
      
      const player = playerRef.current = videojs(videoElement, options, function() {
        onReady?.(this);
      });
    }

    // Dispose the player on unmount
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // This effect handles updates to the source
  useEffect(() => {
    const player = playerRef.current;
    if (player && !player.isDisposed() && options.sources) {
        player.src(options.sources);
    }
  }, [options.sources]);


  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
