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

  // 1. Initialize player
  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      // Create video element
      const videoElement = document.createElement("video");
      videoElement.className = "video-js vjs-big-play-centered vjs-fill";
      videoRef.current.appendChild(videoElement);

      // Initialize video.js. Pass static options. Dynamic ones are handled in the next effect.
      const staticOptions = { ...options };
      delete staticOptions.sources;

      playerRef.current = videojs(videoElement, staticOptions, function() {
        onReady?.(this);
      });
    }

    // 2. Dispose player on unmount
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // 3. Handle dynamic prop changes
  useEffect(() => {
    const player = playerRef.current;

    if (player && !player.isDisposed()) {
        // Update sources
        if (options.sources && options.sources.length > 0) {
            const currentSrc = player.currentSrc();
            const newSrc = options.sources[0]?.src;
            
            // Only update if the source is different to prevent interruptions
            if (newSrc && newSrc !== currentSrc) {
                player.src(options.sources);
                
                // After setting the source, attempt to play
                const playPromise = player.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // This is common in browsers that block autoplay with sound.
                        console.warn("Autoplay with sound was prevented. Muting and retrying.");
                        if (!player.muted()) {
                            player.muted(true);
                        }
                        // Retry playing now that it's muted
                        player.play().catch(finalError => {
                            console.error("Video failed to play even after muting.", finalError);
                        });
                    });
                }
            }
        }
        
        // Update other options like controls if they change
        if (player.controls() !== (options.controls ?? false)) {
            player.controls(options.controls ?? false);
        }

        // Ensure muted state matches options, unless it was already muted by autoplay fallback
        if (!player.muted() && player.muted() !== (options.muted ?? false)) {
             player.muted(options.muted ?? false);
        }
    }
  }, [options.sources, options.controls, options.muted]);

  return (
    <div data-vjs-player className="w-full h-full">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
