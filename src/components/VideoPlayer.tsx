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

  // Initialize the player
  useEffect(() => {
    // This effect should only run once on mount
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video");
      // Use vjs-fill so it takes up 100% of the container
      videoElement.className = "video-js vjs-big-play-centered vjs-fill";
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
          // Pass only the relevant options that don't change often
          autoplay: options.autoplay,
          controls: options.controls,
          muted: options.muted,
          sources: options.sources
      }, function() {
        playerRef.current = this;
        // Style the actual <video> tag to cover the container
        const techEl = this.el().querySelector('.vjs-tech');
        if (techEl) {
            (techEl as HTMLElement).style.objectFit = 'cover';
        }
        onReady?.(this);
      });
    }

    // Cleanup on unmount
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once

  // Handle source changes
  useEffect(() => {
    const player = playerRef.current;
    if (player && !player.isDisposed() && options.sources && options.sources.length > 0) {
      const currentSrc = player.currentSrc();
      const newSrc = options.sources[0]?.src;
      // Only change source if it's different
      if (newSrc && newSrc !== currentSrc) {
        player.src(options.sources);
      }
    }
  }, [options.sources]); // This effect only runs when the sources change

  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
