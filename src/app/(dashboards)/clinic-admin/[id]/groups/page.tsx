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
  ExternalLink,
  QrCode,
  Link as LinkIcon,
  ChevronDown
} from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


export default function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [allGroups, setAllGroups] = useState<(ClinicGroup & { resources?: any; cabins?: any[] })[]>([]);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getClinicGroups(clinicId).then(allGroupsData => {
        const groupsWithResources = allGroupsData.map((group) => ({
            ...group,
            resources: {
                docs: [group.doctor].length, 
                asst: group.assistants.length,
                displays: 1, 
                cabins: 4, 
            },
            cabins: [
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
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Link Copied!",
            description: "The registration link has been copied to your clipboard.",
        });
    }, (err) => {
        toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Could not copy the link to your clipboard.",
        });
    });
  };


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
                           <div className="col-span-3 text-left flex items-center gap-3">
                                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                <div>
                                    <p className="font-semibold text-sm text-card-foreground">{group.name}</p>
                                    <p className="text-xs text-muted-foreground">Initial: {getInitials(group.name)}</p>
                                </div>
                            </div>
                            <div className="col-span-3">
                                 <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{group.resources.docs} Docs</Badge>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{group.resources.asst} Asst</Badge>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">{group.resources.displays} Displays</Badge>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.resources.cabins} Cabins</Badge>
                                </div>
                            </div>
                            <div className="col-span-3">
                               <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/register/${group.id}`} target="_blank">
                                            <ExternalLink className="mr-2 h-3 w-3"/> Preview
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/clinic-admin/${clinicId}/groups/qr-code?groupId=${group.id}`}>
                                        <QrCode className="mr-2 h-3 w-3"/> View QR
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/register/${group.id}`)}>
                                        <LinkIcon className="mr-2 h-3 w-3"/> Copy Link
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
                                    <h4 className="font-semibold text-muted-foreground mb-2">DISPLAYS</h4>
                                    <ul className="space-y-1">
                                       <li>{group.screen.name} (Display User)</li>
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
