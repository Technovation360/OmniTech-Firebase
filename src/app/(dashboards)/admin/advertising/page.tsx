'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Advertisement, Category, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Film, Edit, Trash2, Loader, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, getDoc, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadVideo } from '@/ai/flows/upload-video';
import { getSignedVideoUrl } from '@/ai/flows/get-signed-video-url';
import { v4 as uuidv4 } from 'uuid';
import VideoPlayer from '@/components/VideoPlayer';

type Advertiser = {
  id: string;
  name: string;
};

function AdvertisementForm({
  isOpen,
  onClose,
  advertisement,
  onConfirm,
  advertisers,
  categories,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  advertisement: Advertisement | null;
  onConfirm: (formData: any) => void;
  advertisers: Advertiser[];
  categories: Category[];
  currentUser: User | null;
}) {
  const isEditMode = !!advertisement;
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    advertiserId: '',
    categoryId: '',
    contentType: '',
    duration: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
  
  const bufferToHex = (buffer: ArrayBuffer): string => {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
  };

  useEffect(() => {
    if (isOpen) {
      if (advertisement) {
        setFormData({
          title: advertisement.title,
          videoUrl: advertisement.videoUrl,
          advertiserId: advertisement.advertiserId,
          categoryId: advertisement.categoryId || '',
          contentType: advertisement.contentType || '',
          duration: advertisement.duration || 0,
        });
      } else {
        setFormData({ title: '', videoUrl: '', advertiserId: '', categoryId: '', contentType: '', duration: 0 });
      }
      setFileName('');
      setFile(null);
    }
  }, [advertisement, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            setFormData(prev => ({...prev, duration: Math.round(video.duration) }));
        }
        video.src = URL.createObjectURL(selectedFile);
    }
  }

  const handleConfirm = async () => {
    if (
      !formData.title ||
      !formData.categoryId ||
      (currentUser?.role === 'central-admin' && !formData.advertiserId)
    ) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
  
    setIsUploading(true);
  
    try {
      let finalVideoUrl = formData.videoUrl;
      let finalContentType = formData.contentType;
  
      if (file) {
        const { uploadUrl, authorizationToken } = await uploadVideo({});

        const fileBuffer = await fileToArrayBuffer(file);
        const sha1 = await crypto.subtle.digest('SHA-1', fileBuffer);
        const sha1Hex = bufferToHex(sha1);
        const uniqueFileName = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;

        const b2Response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': authorizationToken,
                'Content-Type': file.type,
                'X-Bz-File-Name': encodeURIComponent(uniqueFileName),
                'X-Bz-Content-Sha1': sha1Hex
            },
            body: fileBuffer
        });

        if (!b2Response.ok) {
            const errorBody = await b2Response.json();
            throw new Error(`B2 Upload failed: ${errorBody.message || 'Unknown error'}`);
        }
        
        const b2UploadResult = await b2Response.json();

        finalVideoUrl = b2UploadResult.fileName;
        finalContentType = file.type;

      } else if (!isEditMode) {
        toast({ title: 'Please select a video file to upload.', variant: 'destructive' });
        setIsUploading(false);
        return;
      }
  
      onConfirm({ ...formData, videoUrl: finalVideoUrl, contentType: finalContentType });
      onClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{isEditMode ? 'Edit Video' : 'Upload Video'}</DialogTitle>
          <DialogDescription>
            Manage your video assets for campaigns.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoFile">Upload File</Label>
            <Input id="videoFile" type="file" accept="video/*" onChange={handleFileChange} />
            {fileName && <p className="text-sm text-muted-foreground mt-1">{fileName}</p>}
            {isEditMode && !fileName && formData.videoUrl && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                    Current File: {formData.videoUrl}
                </p>
            )}
          </div>
          {currentUser?.role === 'central-admin' && (
            <div className="space-y-2">
              <Label htmlFor="advertiser">Advertiser</Label>
              <Select value={formData.advertiserId} onValueChange={(value) => setFormData({ ...formData, advertiserId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select advertiser..." /></SelectTrigger>
                  <SelectContent>
                      {advertisers.map(ad => <SelectItem key={ad.id} value={ad.id}>{ad.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
             <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="bg-muted/50 px-6 py-4 rounded-b-lg">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isUploading}>
            {isUploading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/> Uploading...</> : isEditMode ? 'Save Changes' : 'Add Video'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function VideosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);

  useEffect(() => {
    if (authUser && !isUserLoading) {
      const userDocRef = doc(firestore, 'users', authUser.uid);
      getDoc(userDocRef).then(snap => {
        if (snap.exists()) {
          const userData = snap.data() as User;
          setCurrentUserData(userData);
          if (userData.role === 'advertiser' && userData.affiliation) {
            const advQuery = query(collection(firestore, 'advertisers'), where('name', '==', userData.affiliation));
            getDocs(advQuery).then((advSnap) => {
              if (!advSnap.empty) {
                setAdvertiserId(advSnap.docs[0].id);
              }
            });
          }
        }
      });
    }
  }, [authUser, isUserLoading, firestore]);

  const advertisementsQuery = useMemoFirebase(() => {
    if (!currentUserData) return null;
    if (currentUserData.role === 'central-admin') {
        return collection(firestore, 'advertisements');
    }
    if (currentUserData.role === 'advertiser' && advertiserId) {
        return query(collection(firestore, 'advertisements'), where('advertiserId', '==', advertiserId));
    }
    return null;
  }, [firestore, currentUserData, advertiserId]);

  const { data: advertisements, isLoading: adsLoading } = useCollection<Advertisement>(advertisementsQuery);
  const { data: categories, isLoading: catsLoading } = useCollection<Category>(useMemoFirebase(() => collection(firestore, 'categories'), [firestore]));
  const { data: advertisers, isLoading: advertisersLoading } = useCollection<Advertiser>(useMemoFirebase(() => collection(firestore, 'advertisers'), [firestore]));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertisementToEdit, setAdvertisementToEdit] = useState<Advertisement | null>(null);
  const [advertisementToDelete, setAdvertisementToDelete] = useState<Advertisement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Advertisement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  useEffect(() => {
    if (selectedVideo?.videoUrl) {
        const fetchUrl = async () => {
            setIsFetchingUrl(true);
            setPlayingUrl(null);
            try {
                const { signedUrl } = await getSignedVideoUrl({ fileName: selectedVideo.videoUrl });
                setPlayingUrl(signedUrl);
            } catch (error) {
                console.error("Failed to get signed URL", error);
                toast({ title: 'Error', description: 'Could not load video.', variant: 'destructive' });
            } finally {
                setIsFetchingUrl(false);
            }
        };
        fetchUrl();
    }
  }, [selectedVideo, toast]);
  
  const handleFormConfirm = (formData: any) => {
    const { title, videoUrl, categoryId, advertiserId: formAdvertiserId, contentType, duration } = formData;
    
    let finalAdvertiserId: string | null = null;
    let finalAdvertiserName: string | undefined;

    if (currentUserData?.role === 'advertiser') {
      finalAdvertiserId = advertiserId;
      finalAdvertiserName = currentUserData.affiliation;
    } else { // central-admin
      finalAdvertiserId = formAdvertiserId;
      finalAdvertiserName = advertisers?.find(a => a.id === formAdvertiserId)?.name;
    }

    if (!finalAdvertiserId) {
      toast({ title: 'Advertiser could not be determined.', variant: 'destructive' });
      return;
    }

    const category = categories?.find(c => c.id === categoryId);

    const dataToSave = {
      title,
      videoUrl,
      advertiserId: finalAdvertiserId,
      advertiser: finalAdvertiserName,
      categoryId,
      categoryName: category?.name,
      contentType,
      duration,
    };
    
    if (advertisementToEdit) {
      setDocumentNonBlocking(doc(firestore, 'advertisements', advertisementToEdit.id), dataToSave, { merge: true });
      toast({ title: 'Video updated!' });
    } else {
      addDocumentNonBlocking(collection(firestore, 'advertisements'), dataToSave);
      toast({ title: 'Video added!' });
    }
    setIsModalOpen(false);
    setAdvertisementToEdit(null);
  };
  
  const handleDeleteConfirm = () => {
    if (advertisementToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'advertisements', advertisementToDelete.id));
      setAdvertisementToDelete(null);
      toast({ title: 'Video deleted.' });
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const isLoading = adsLoading || catsLoading || advertisersLoading || isUserLoading;

  const handleClosePlayer = () => {
      setSelectedVideo(null);
      setPlayingUrl(null);
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Video Library</h1>
          <p className="text-muted-foreground">Manage your video assets.</p>
        </div>
        <Button onClick={() => { setAdvertisementToEdit(null); setIsModalOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload Video
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && advertisements?.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium py-2 text-xs">{ad.title}</TableCell>
                  <TableCell className="py-2 text-xs">{ad.categoryName || 'N/A'}</TableCell>
                  <TableCell className="py-2 text-xs">{formatDuration(ad.duration)}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon-xs" onClick={() => setSelectedVideo(ad)} title="Watch Video">
                            <Film className="h-4 w-4 text-primary" />
                        </Button>
                         <Button variant="ghost" size="icon-xs" onClick={() => { setAdvertisementToEdit(ad); setIsModalOpen(true); }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setAdvertisementToDelete(ad)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && advertisements?.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No videos found.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    
     <AdvertisementForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        advertisement={advertisementToEdit}
        onConfirm={handleFormConfirm}
        advertisers={advertisers || []}
        categories={categories || []}
        currentUser={currentUserData}
      />
      
      <AlertDialog open={!!advertisementToDelete} onOpenChange={() => setAdvertisementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDesc>
              This will permanently delete the video "{advertisementToDelete?.title}".
            </AlertDialogDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedVideo} onOpenChange={handleClosePlayer}>
        <DialogContent className="max-w-3xl p-0">
            <DialogHeader className="p-6 pb-4">
                <DialogTitle>{selectedVideo?.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-black flex items-center justify-center">
                {isFetchingUrl && <Loader className="animate-spin text-white h-8 w-8" />}
                {!isFetchingUrl && playingUrl && (
                     <VideoPlayer
                        options={{
                            autoplay: true,
                            controls: true,
                            fluid: true,
                            sources: [{
                                src: playingUrl,
                                type: selectedVideo?.contentType || 'video/mp4'
                            }]
                        }}
                     />
                )}
                {!isFetchingUrl && !playingUrl && (
                    <p className="text-white">Could not load video.</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
