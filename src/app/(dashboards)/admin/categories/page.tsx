'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUp, ArrowDown, Search, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, query } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Category } from '@/lib/types';

const seedCategories = [
    { name: 'General' },
    { name: 'Dental' },
    { name: 'Skin' },
    { name: 'Eye' },
]

function CategoryForm({
  isOpen,
  onClose,
  category,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: (formData: Omit<Category, 'id'>) => void;
}) {
  const isEditMode = !!category;
  const [formData, setFormData] = useState({
      name: '',
  });

  useEffect(() => {
      if (category) {
          setFormData({
              name: category.name,
          });
      } else {
          setFormData({ name: '' });
      }
  }, [category]);

  const handleConfirm = () => {
    if (formData.name) {
        onConfirm(formData);
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT CATEGORY' : 'ADD CATEGORY'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
            <div className="space-y-1">
                <Label htmlFor="categoryName" className="text-[10px] font-semibold text-gray-600">CATEGORY NAME</Label>
                <Input id="categoryName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
            <Button variant="destructive" onClick={onClose} size="xs">CANCEL</Button>
            <Button onClick={handleConfirm} size="xs">CONFIRM</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
    isOpen,
    onClose,
    onConfirm,
    categoryName,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    categoryName: string;
  }) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category "{categoryName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

export default function CategoriesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const categoriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'categories')
  }, [firestore, user]);
  const { data: allCategories, isLoading } = useCollection<Category>(categoriesRef);
  
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSeeded, setHasSeeded] = useState(false);
  
  useEffect(() => {
    if (!isLoading && allCategories && allCategories.length === 0 && !hasSeeded) {
        console.log("No categories found, seeding...");
        setHasSeeded(true);
        const categoriesCol = collection(firestore, 'categories');
        for(const category of seedCategories) {
            addDocumentNonBlocking(categoriesCol, category);
        }
    }
  }, [allCategories, isLoading, hasSeeded, firestore]);

  useEffect(() => {
    if (!allCategories) {
        setFilteredCategories([]);
        return;
    };
    
    let filteredData = [...allCategories];
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allCategories.filter(category =>
            category.name.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredCategories(sorted);
    } else {
        setFilteredCategories(filteredData);
    }

  }, [searchQuery, allCategories, sortConfig]);

  const openEditModal = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null);
  }

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
  }

  const closeDeleteDialog = () => {
    setCategoryToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'categories', categoryToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Category, 'id'>) => {
    if (categoryToEdit) {
        setDocumentNonBlocking(doc(firestore, 'categories', categoryToEdit.id), formData, { merge: true });
    } else {
        addDocumentNonBlocking(collection(firestore, 'categories'), formData);
    }
    closeModal();
  };

  const handleSort = (key: keyof Category) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Category) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Medical Categories</h1>
        <Button onClick={openCreateModal}>ADD CATEGORY</Button>
      </div>
      <Card>
        <CardHeader>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                            placeholder="Search by name..." 
                            className="pl-9 h-9" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Category Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={2} className="text-center"><Loader className="animate-spin mx-auto" /></TableCell></TableRow>}
              {!isLoading && filteredCategories && filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium py-2 text-xs">{category.name}</TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(category)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(category)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!filteredCategories || filteredCategories.length === 0) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No categories found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CategoryForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        category={categoryToEdit}
        onConfirm={handleFormConfirm}
      />
       <DeleteCategoryDialog 
        isOpen={!!categoryToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        categoryName={categoryToDelete?.name || ''}
      />
    </>
  );
}
