
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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


function DashboardSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const clinicId = params.id as string;

  const menuItems = [
      { href: `/clinic-admin/${clinicId}`, icon: LayoutDashboard, label: 'Dashboard', active: pathname === `/clinic-admin/${clinicId}` },
      { href: `/clinic-admin/${clinicId}/live-queue`, icon: Monitor, label: 'Live Queue', active: pathname === `/clinic-admin/${clinicId}/live-queue` },
      { href: `/clinic-admin/${clinicId}/register`, icon: Ticket, label: 'Patients Register', active: pathname === `/clinic-admin/${clinicId}/register` },
      { href: `/clinic-admin/${clinicId}/stations`, icon: Building, label: 'Stations', active: pathname === `/clinic-admin/${clinicId}/stations` },
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
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40">
          {children}
      </main>
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
