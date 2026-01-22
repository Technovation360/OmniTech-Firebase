'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Advertisement, Category } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}: {
  isOpen: boolean;
  onClose: () => void;
  advertisement: Advertisement | null;
  onConfirm: (formData: any) => void;
  advertisers: Advertiser[];
  categories: Category[];
}) {
  const isEditMode = !!advertisement;
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    advertiserId: '',
    categoryId: '',
  });
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (advertisement) {
      setFormData({
        title: advertisement.title,
        videoUrl: advertisement.videoUrl,
        advertiserId: advertisement.advertiserId,
        categoryId: advertisement.categoryId || '',
      });
    } else {
      setFormData({ title: '', videoUrl: '', advertiserId: '', categoryId: '' });
    }
    setFileName('');
  }, [advertisement]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if(reader.result) {
            setFormData(prev => ({...prev, videoUrl: reader.result as string}));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  const handleConfirm = () => {
    if (formData.title && formData.videoUrl && formData.advertiserId && formData.categoryId) {
        const advertiser = advertisers.find(a => a.id === formData.advertiserId);
        const category = categories.find(c => c.id === formData.categoryId);

        onConfirm({
            title: formData.title,
            videoUrl: formData.videoUrl,
            advertiserId: formData.advertiserId,
            advertiser: advertiser?.name,
            categoryId: formData.categoryId,
            categoryName: category?.name,
        });
        onClose();
    } else {
        toast({ title: 'Please fill all fields', variant: 'destructive' });
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="advertiser">Advertiser</Label>
            <Select value={formData.advertiserId} onValueChange={(value) => setFormData({ ...formData, advertiserId: value })}>
                <SelectTrigger><SelectValue placeholder="Select advertiser..." /></SelectTrigger>
                <SelectContent>
                    {advertisers.map(ad => <SelectItem key={ad.id} value={ad.id}>{ad.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>{isEditMode ? 'Save Changes' : 'Add Video'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function VideosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: advertisements, isLoading: adsLoading } = useCollection<Advertisement>(useMemoFirebase(() => collection(firestore, 'advertisements'), [firestore]));
  const { data: categories, isLoading: catsLoading } = useCollection<Category>(useMemoFirebase(() => collection(firestore, 'categories'), [firestore]));
  const { data: advertisers, isLoading: advertisersLoading } = useCollection<Advertiser>(useMemoFirebase(() => collection(firestore, 'advertisers'), [firestore]));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertisementToEdit, setAdvertisementToEdit] = useState<Advertisement | null>(null);
  const [advertisementToDelete, setAdvertisementToDelete] = useState<Advertisement | null>(null);
  
  const handleFormConfirm = (formData: any) => {
    const dataToSave = { ...formData };
    
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
  
  const isLoading = adsLoading || catsLoading || advertisersLoading;

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
                <TableHead>Advertiser</TableHead>
                <TableHead>Category</TableHead>
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
                  <TableCell className="py-2 text-xs">{ad.advertiser}</TableCell>
                  <TableCell className="py-2 text-xs">{ad.categoryName || 'N/A'}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon-xs" asChild>
                            <a href={ad.videoUrl} target="_blank" rel="noopener noreferrer" title="Watch Video">
                                <Film className="h-4 w-4 text-primary" />
                            </a>
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
    </>
  );
}
