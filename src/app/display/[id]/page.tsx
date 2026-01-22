
'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import type { Patient, Advertisement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { getSignedVideoUrl } from '@/ai/flows/get-signed-video-url';
import VideoPlayer from '@/components/VideoPlayer';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

type QueueInfo = {
  waiting: Patient[];
  inConsultation: (Patient & { cabinName: string; clinicName: string })[];
  nowCalling: (Patient & { cabinName: string; clinicName: string }) | null;
  advertisements: Advertisement[];
};

async function fetchQueueInfo(screenId: string): Promise<QueueInfo> {
  const res = await fetch(`/api/queue/${screenId}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch queue info');
  }
  return res.json();
}

function useQueue(screenId: string) {
  const [queueInfo, setQueueInfo] = useState<QueueInfo>({
    waiting: [],
    inConsultation: [],
    nowCalling: null,
    advertisements: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getInfo = async () => {
      try {
        const data = await fetchQueueInfo(screenId);
        setQueueInfo(data);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    };

    getInfo(); // Initial fetch
    const interval = setInterval(getInfo, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [screenId]);

  return { queueInfo, error };
}

function VideoPlayerDisplay({ advertisements }: { advertisements: Advertisement[] }) {
  const [videoSources, setVideoSources] = useState<{ src: string; type: string }[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const adsIdRef = useRef<string | null>(null);
  
  const handleNextVideo = useCallback(() => {
    if (videoSources.length > 0) {
      setCurrentVideoIndex(prevIndex => (prevIndex + 1) % videoSources.length);
    }
  }, [videoSources.length]);

  useEffect(() => {
    const fetchVideoUrls = async () => {
      const newAdsId = advertisements.map(ad => ad.id).sort().join(',');
      if (newAdsId === adsIdRef.current && videoSources.length > 0) { // Keep playing if list is same and not empty
        return; 
      }
      adsIdRef.current = newAdsId;
      
      setIsLoading(true);

      if (advertisements.length === 0) {
        setVideoSources([]);
        setIsLoading(false);
        return;
      }

      const sources = await Promise.all(
          advertisements.map(async (ad) => {
              try {
                  const { signedUrl } = await getSignedVideoUrl({ fileName: ad.videoUrl });
                  return { src: signedUrl, type: ad.contentType || 'video/mp4' };
              } catch (e) {
                  console.error(`Failed to get signed URL for ${ad.videoUrl}`, e);
                  return null;
              }
          })
      );
      const validSources = sources.filter((s): s is {src: string; type: string} => s !== null);
      
      if (validSources.length > 0) {
        setVideoSources(validSources);
        setCurrentVideoIndex(0);
      } else {
        setVideoSources([]);
      }
      setIsLoading(false);
    };

    fetchVideoUrls();
  }, [advertisements, videoSources.length]); // Depend on videoSources.length to re-evaluate if it becomes empty

  const playerRef = useRef<VideoJsPlayer | null>(null);

  const playerOptions: VideoJsPlayerOptions = {
    autoplay: true,
    controls: false,
    muted: true,
    fluid: true,
    sources: videoSources.length > 0 ? [videoSources[currentVideoIndex]] : [],
  };

  const handlePlayerReady = (player: VideoJsPlayer) => {
    playerRef.current = player;
    player.on('ended', handleNextVideo);
  };

  if (isLoading) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Loading Advertisements...</div>;
  }

  if (videoSources.length === 0) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-muted-foreground">No advertisements scheduled for this display.</div>;
  }

  return (
      <VideoPlayer 
        options={playerOptions}
        onReady={handlePlayerReady}
      />
  );
}

export default function DisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { queueInfo, error } = useQueue(id);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    if (queueInfo.nowCalling && synthRef.current) {
      synthRef.current.cancel(); // Cancel any previous speech
      const { tokenNumber, name, cabinName } = queueInfo.nowCalling;
      const textToSpeak = `Token number ${tokenNumber}, ${name}, please proceed to ${cabinName}.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      synthRef.current.speak(utterance);
    }
  }, [queueInfo.nowCalling]);

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      <AnimatePresence>
        {queueInfo.nowCalling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 bg-primary/90 z-20 flex flex-col items-center justify-center"
          >
            <div className="text-center text-primary-foreground">
              <p className="text-4xl md:text-6xl font-light">Token Number</p>
              <p className="text-8xl md:text-9xl font-bold my-4 tracking-wider">
                {queueInfo.nowCalling.tokenNumber}
              </p>
              <p className="text-4xl md:text-6xl font-semibold">
                {queueInfo.nowCalling.name}
              </p>
              <p className="text-2xl md:text-4xl mt-8">Please proceed to</p>
              <p className="text-4xl md:text-6xl font-bold text-yellow-300 mt-2">
                {queueInfo.nowCalling.cabinName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-[70%] h-full bg-gray-800">
        <VideoPlayerDisplay advertisements={queueInfo.advertisements} />
      </div>
      <div className="w-[30%] h-full flex flex-col">
        <div className="h-[50%] bg-blue-900 p-4 overflow-hidden">
          <Card className="h-full bg-transparent border-0 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center text-yellow-300">
                IN CONSULTATION
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {queueInfo.inConsultation.map((p) => (
                  <div key={p.id} className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-xs font-medium truncate" title={`${p.clinicName}`}>{p.clinicName}</div>
                    <div className="text-sm font-semibold truncate" title={p.cabinName}>{p.cabinName}</div>
                    <div className="text-3xl font-bold tracking-wider mt-1">{p.tokenNumber}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="h-[50%] bg-gray-800 p-4 overflow-hidden">
          <Card className="h-full bg-transparent border-0 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">
                NEXT IN LINE
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-center">
                {queueInfo.waiting.map((p) => (
                  <div key={p.id} className="text-3xl font-semibold p-2">
                    {p.tokenNumber}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
