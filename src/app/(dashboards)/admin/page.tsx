'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Building, Ticket, Megaphone, Film, Users, Monitor, Stethoscope, List, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicsTab } from '@/components/admin/clinics-tab';
import { UsersTab } from '@/components/admin/users-tab';
import { LiveQueueTab } from '@/components/admin/live-queue-tab';

const stats = [
    { title: "CLINICS", value: "2", icon: Building },
    { title: "ACTIVE TOKENS", value: "3", icon: Ticket },
    { title: "ADVERTISERS", value: "2", icon: Megaphone },
    { title: "CAMPAIGNS", value: "2", icon: Film },
];

function InsightsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <div className="p-3 bg-accent rounded-md">
               <stat.icon className="h-5 w-5 text-accent-foreground" />
             </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">{stat.title}</div>
            <div className="text-4xl font-bold mt-1">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline">Central Admin Dashboard</h1>

        <Tabs defaultValue="insights">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="insights"><Eye className="mr-2" /> Insights</TabsTrigger>
                <TabsTrigger value="clinics"><Building className="mr-2" /> Clinics</TabsTrigger>
                <TabsTrigger value="users"><Users className="mr-2" /> Users</TabsTrigger>
                <TabsTrigger value="live-queue"><Monitor className="mr-2" /> Live Queue</TabsTrigger>
                <TabsTrigger value="patient-details"><List className="mr-2" /> Patient Registry</TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="mt-6">
                <InsightsTab />
            </TabsContent>
            <TabsContent value="clinics" className="mt-6">
                <ClinicsTab />
            </TabsContent>
            <TabsContent value="users" className="mt-6">
                <UsersTab />
            </TabsContent>
            <TabsContent value="live-queue" className="mt-6">
                <LiveQueueTab />
            </TabsContent>
            <TabsContent value="patient-details" className="mt-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Patient Registry</h2>
                  <p className="text-muted-foreground">This feature is under development.</p>
                </CardHeader>
                <CardContent>
                  <p>The global patient registry will be available here soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
