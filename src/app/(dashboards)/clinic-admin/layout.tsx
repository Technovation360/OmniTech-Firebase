
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Monitor,
  List,
  ChevronLeft,
  Settings,
  Ticket,
  Building,
  Folder,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function DashboardHeader() {
  const { isMobile } = useSidebar();
  
  return (
    <header className="p-4 bg-primary text-primary-foreground flex items-center justify-between ">
      <div className="flex items-center gap-4">
        {!isMobile && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white">
          <ChevronLeft />
        </Button>}
        <div className="flex items-center gap-2">
            <span className="text-sm">Home</span>
            <span className="text-sm">/</span>
            <span className="text-sm font-semibold">Analytics</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-background text-foreground">A</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}


function DashboardSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const clinicId = params.id as string;

  const menuItems = [
      { href: `/clinic-admin/${clinicId}`, icon: LayoutDashboard, label: 'Dashboard', active: pathname === `/clinic-admin/${clinicId}` },
      { href: '#', icon: Monitor, label: 'Live Queue' },
      { href: '#', icon: Ticket, label: 'Patients Register' },
      { href: '#', icon: Building, label: 'Stations' },
      { href: '#', icon: Folder, label: 'Groups' },
      { href: '#', icon: Users, label: 'Users' },
      { href: '#', icon: Settings, label: 'Settings' },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
        </div>
        <SidebarMenu>
            {menuItems.map(item => (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={item.active}>
                    <Link href={item.href}>
                        <item.icon />
                        {item.label}
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col bg-muted/40">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}


export default function ClinicAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
