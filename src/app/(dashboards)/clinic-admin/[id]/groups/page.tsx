'use client';
import { useState, useEffect, use } from 'react';
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
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Wand2,
  LayoutGrid,
  Link,
  Printer,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import { cn } from '@/lib/utils';


// Mocking more data based on the screenshot for a richer UI
const getGroupsForClinic = (clinicId: string, allGroups: ClinicGroup[]): (ClinicGroup & { resources: any })[] => {
    // In a real app, this would be a more complex data fetching and mapping logic.
    // Here, we'll just use the existing groups and add some mock resource counts.
    const clinicGroups = allGroups.filter(g => g.id === 'grp_cardiology_01' || g.id === 'grp_ortho_01');
    return clinicGroups.map((group, index) => ({
        ...group,
        // The name is more like a specialty name in the screenshot
        name: group.specialties[0] || 'General',
        tokenInitial: group.specialties[0]?.substring(0,2).toUpperCase() || 'GE',
        resources: index === 0 ? {
            docs: 2,
            asst: 1,
            screens: 1,
            cabins: 4,
            doctors: ['doctor1', 'doctor2'],
            assistants: ['Assistant One'],
            screensList: ['Screen One'],
            cabinsList: ['Consultation Room 1', 'Consultation Room 2', 'Consultation Room 3', 'Consultation Room 4'],
        } : {
            docs: 1,
            asst: 2,
            screens: 1,
            cabins: 1,
            doctors: [group.doctor.name],
            assistants: ['Assistant Two', 'Assistant Three'],
            screensList: ['Screen Two'],
            cabinsList: ['Consultation Room 5'],
        }
    }));
}


export default function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [groups, setGroups] = useState<(ClinicGroup & { resources: any })[]>([]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  useEffect(() => {
    getClinicGroups().then(allGroups => {
        const clinicGroups = getGroupsForClinic(clinicId, allGroups);
        setGroups(clinicGroups);
        if (clinicGroups.length > 0) {
            setOpenGroupId(clinicGroups[0].id); // Default to open the first group
        }
    })
  }, [clinicId]);
  
  const toggleGroup = (groupId: string) => {
    setOpenGroupId(prevId => (prevId === groupId ? null : groupId));
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clinic Groups</CardTitle>
          <Button>CREATE GROUP</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">GROUP NAME</TableHead>
                <TableHead className="w-[25%]">RESOURCES</TableHead>
                <TableHead className="w-[25%]">REGISTRATION FORM</TableHead>
                <TableHead className="w-[25%] text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Collapsible key={group.id} asChild open={openGroupId === group.id} onOpenChange={() => toggleGroup(group.id)}>
                    <TableRow className="hover:bg-transparent [&[data-state=open]]:bg-muted/50">
                      <TableCell className="font-medium py-3">
                         <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer">
                                {openGroupId === group.id ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                                <div>
                                    <span className="font-semibold">{group.name}</span>
                                    <p className="text-xs text-muted-foreground">Initial: {group.tokenInitial}</p>
                                </div>
                            </div>
                        </CollapsibleTrigger>
                      </TableCell>
                       <TableCell className="py-3">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">{group.resources.docs} Docs</Badge>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">{group.resources.asst} Asst</Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">{group.resources.screens} Screens</Badge>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.resources.cabins} Cabins</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon-xs"><Wand2 className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon-xs"><LayoutGrid className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon-xs"><Link className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon-xs"><Printer className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon-xs"><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon-xs"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
