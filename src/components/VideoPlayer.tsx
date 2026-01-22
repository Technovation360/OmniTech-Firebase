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
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    if (!playerRef.current && videoContainerRef.current) {
      // Create the video element dynamically
      const videoElement = document.createElement("video");
      videoElement.className = "video-js vjs-big-play-centered vjs-fill";
      videoContainerRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, options, function() {
        onReady?.(this);
      });
    } else if(playerRef.current && !playerRef.current.isDisposed()) {
      const player = playerRef.current;
      // When options change, update player source and attempt to play.
      if (options.sources && options.sources.length > 0) {
        player.src(options.sources);
        if (options.autoplay) {
            player.ready(() => {
                player.play().catch(error => {
                    console.error("Video play failed:", error);
                });
            });
        }
      }
    }
  }, [options, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={videoContainerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
