'use client';

import { useState, useEffect, useRef, use, useCallback, Suspense, useMemo } from 'react';
import type { Patient, Advertisement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { getSignedVideoUrl } from '@/ai/flows/get-signed-video-url';
import VideoPlayer from '@/components/VideoPlayer';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type EnrichedQueuePatient = Patient & { cabinName: string; clinicName: string; groupName: string };

type QueueInfo = {
  waiting: (Patient & { groupName: string })[];
  inConsultation: EnrichedQueuePatient[];
  nowCalling: EnrichedQueuePatient | null;
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
    setCurrentVideoIndex(prevIndex => {
        if (videoSources.length === 0) return 0;
        return (prevIndex + 1) % videoSources.length;
    });
  }, [videoSources.length]);

  useEffect(() => {
    const fetchVideoUrls = async () => {
      const newAdsId = advertisements.map(ad => ad.id).sort().join(',');
      // Only refetch if the list of ads has actually changed.
      if (newAdsId === adsIdRef.current && videoSources.length > 0) {
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
  }, [advertisements, videoSources.length]);

  const playerRef = useRef<VideoJsPlayer | null>(null);

  const playerOptions: VideoJsPlayerOptions = useMemo(() => ({
    autoplay: true,
    controls: false,
    muted: false, // Attempt to play with audio
    fluid: true,
    sources: videoSources.length > 0 ? [videoSources[currentVideoIndex]] : [],
  }), [videoSources, currentVideoIndex]);
  
  const handlePlayerReady = useCallback((player: VideoJsPlayer) => {
    playerRef.current = player;
    player.on('ended', handleNextVideo);
  }, [handleNextVideo]);

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

function DisplayPageContent({ params }: { params: { id: string } }) {
  const { id } = params;
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
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
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

      <div className="h-[30vh] flex flex-row">
        <div className="w-1/2 bg-blue-900 p-4 overflow-hidden">
          <Card className="h-full bg-transparent border-0 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-center text-yellow-300">
                IN CONSULTATION
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/20">
                    <TableHead className="text-white font-semibold">Cabin</TableHead>
                    <TableHead className="text-white font-semibold">Group</TableHead>
                    <TableHead className="text-white font-semibold text-right">Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueInfo.inConsultation.map((p) => (
                    <TableRow key={p.id} className="border-b-white/10">
                      <TableCell>{p.cabinName}</TableCell>
                      <TableCell>{p.groupName}</TableCell>
                      <TableCell className="font-bold text-lg text-right">{p.tokenNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="w-1/2 bg-gray-800 p-4 overflow-hidden">
          <Card className="h-full bg-transparent border-0 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-center">
                NEXT IN LINE
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/20">
                    <TableHead className="text-white font-semibold">Group</TableHead>
                    <TableHead className="text-white font-semibold text-right">Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueInfo.waiting.map((p) => (
                    <TableRow key={p.id} className="border-b-white/10">
                      <TableCell>{p.groupName}</TableCell>
                      <TableCell className="font-bold text-lg text-right">{p.tokenNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="h-[70vh] w-full bg-gray-800">
        <VideoPlayerDisplay advertisements={queueInfo.advertisements} />
      </div>
    </div>
  );
}


export default function DisplayPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div>Loading Display...</div>}>
            <DisplayPageContent params={resolvedParams} />
        </Suspense>
    )
}
