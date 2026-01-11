'use client';
import { useState, useEffect, use } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  QrCode,
  Link as LinkIcon,
  Printer,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [allGroups, setAllGroups] = useState<(ClinicGroup & { resources?: any; cabins?: any[] })[]>([]);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);

  useEffect(() => {
    getClinicGroups(clinicId).then(allGroupsData => {
        const groupsWithResources = allGroupsData.map((group, index) => ({
            ...group,
            resources: {
                docs: [group.doctor].length, // Assuming one doctor for now
                asst: group.assistants.length,
                screens: 1, // Mock
                cabins: 4, // Mock
            },
            cabins: [ // Mock cabin data
              {id: 'cab_1', name: 'Consultation Room 1'},
              {id: 'cab_2', name: 'Consultation Room 2'},
              {id: 'cab_3', name: 'Consultation Room 3'},
              {id: 'cab_4', name: 'Consultation Room 4'},
            ]
        }));
        setAllGroups(groupsWithResources);
        if (groupsWithResources.length > 0) {
            setActiveAccordionItem(groupsWithResources[0].id);
        }
    })
  }, [clinicId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Clinic Groups</h1>
            <Button>CREATE GROUP</Button>
        </div>

        <div className="bg-card rounded-2xl border">
            <div className="grid grid-cols-12 p-4 border-b font-semibold text-xs text-muted-foreground">
                <div className="col-span-3">GROUP NAME</div>
                <div className="col-span-3">RESOURCES</div>
                <div className="col-span-3">REGISTRATION FORM</div>
                <div className="col-span-3 text-center">ACTIONS</div>
            </div>
            <Accordion type="single" value={activeAccordionItem || ""} onValueChange={setActiveAccordionItem} collapsible>
                {allGroups.map((group) => (
                    <AccordionItem value={group.id} key={group.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="grid grid-cols-12 p-4 items-center hover:no-underline hover:bg-muted/50 transition-colors group">
                            <div className="col-span-3 text-left">
                                <div className="flex items-center gap-3">
                                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    <div>
                                        <p className="font-semibold text-sm text-card-foreground">{group.name}</p>
                                        <p className="text-xs text-muted-foreground">Initial: {getInitials(group.name)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3">
                                 <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{group.resources.docs} Docs</Badge>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{group.resources.asst} Asst</Badge>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">{group.resources.screens} Screens</Badge>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.resources.cabins} Cabins</Badge>
                                </div>
                            </div>
                            <div className="col-span-3">
                               <div className="flex gap-2">
                                    <Button variant="outline" size="icon-sm" className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100">
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon-sm" className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100" asChild>
                                      <Link href={`/clinic-admin/${clinicId}/groups/qr-code?groupId=${group.id}`}>
                                        <QrCode className="h-4 w-4"/>
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-sm" className="bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100">
                                        <LinkIcon className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="outline" size="icon-sm" className="bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100">
                                        <Printer className="h-4 w-4"/>
                                    </Button>
                               </div>
                            </div>
                            <div className="col-span-3 flex justify-center gap-2">
                                <Button variant="ghost" size="icon-sm">
                                    <Edit className="h-4 w-4 text-muted-foreground"/>
                                </Button>
                                <Button variant="ghost" size="icon-sm">
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/30 p-6">
                            <div className="grid grid-cols-4 gap-6 text-xs">
                                <div>
                                    <h4 className="font-semibold text-muted-foreground mb-2">DOCTORS</h4>
                                    <ul className="space-y-1">
                                        <li>{group.doctor.name}</li>
                                        {/* Mocking a second doctor */}
                                        {group.name === 'General Medicine' && <li>doctor2</li>}
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-muted-foreground mb-2">ASSISTANTS</h4>
                                    <ul className="space-y-1">
                                        {group.assistants.map(a => <li key={a.id}>{a.name}</li>)}
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-muted-foreground mb-2">SCREENS</h4>
                                    <ul className="space-y-1">
                                       <li>{group.screen.name}</li>
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-muted-foreground mb-2">CABINS</h4>
                                     <ul className="space-y-1">
                                        {group.cabins?.map(c => <li key={c.id}>{c.name}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </div>
  );
}
