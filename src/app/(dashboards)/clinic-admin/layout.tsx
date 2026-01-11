
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
  SidebarFooter,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Monitor,
  PanelLeft,
  LogOut,
  ChevronLeft,
  Settings,
  Ticket,
  Building,
  Folder,
  QrCode,
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
      { 
          isGroup: true,
          label: 'Groups',
          icon: Folder,
          active: pathname.includes(`/clinic-admin/${clinicId}/groups`),
          subItems: [
              { href: `/clinic-admin/${clinicId}/groups`, label: 'Manage Groups', active: pathname === `/clinic-admin/${clinicId}/groups`},
              { href: `/clinic-admin/${clinicId}/groups/qr-code`, label: 'QR Codes', active: pathname === `/clinic-admin/${clinicId}/groups/qr-code`},
          ]
      },
      { href: `/clinic-admin/${clinicId}/users`, icon: Users, label: 'Users', active: pathname === `/clinic-admin/${clinicId}/users` },
      { href: `/clinic-admin/${clinicId}/settings`, icon: Settings, label: 'Settings', active: pathname === `/clinic-admin/${clinicId}/settings` },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
        </div>
        <SidebarMenu>
            {menuItems.map(item => (
                 <SidebarMenuItem key={item.label}>
                    {item.isGroup ? (
                        <>
                            <SidebarMenuButton asChild isActive={item.active}>
                                <Link href={item.subItems[0].href}>
                                    <item.icon />
                                    {item.label}
                                </Link>
                            </SidebarMenuButton>
                            <SidebarMenuSub>
                                {item.subItems.map(subItem => (
                                    <SidebarMenuSubItem key={subItem.label}>
                                        <SidebarMenuSubButton asChild isActive={subItem.active}>
                                            <Link href={subItem.href}>{subItem.label}</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </>
                    ) : (
                        <SidebarMenuButton asChild isActive={item.active}>
                            <Link href={item.href!}>
                                <item.icon />
                                {item.label}
                            </Link>
                        </SidebarMenuButton>
                    )}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
          <div className="flex items-center gap-3 p-4 border-t border-sidebar-border">
            <Avatar className="h-10 w-10">
                <AvatarFallback>CA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">Clinic Admin</span>
                <span className="text-xs text-muted-foreground">clinic-admin@omni.com</span>
            </div>
            <Link href="/" className="ml-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                </Button>
            </Link>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const pageName = pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';
  
  return (
    <>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col">
         <header className="p-3 bg-primary text-primary-foreground flex items-center justify-between border-b-2 border-primary-foreground/20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white md:hidden" onClick={toggleSidebar}>
                    <PanelLeft />
                </Button>
                <div className="flex items-center gap-2">
                    <Link href="/"><ChevronLeft className="h-5 w-5 opacity-80"/></Link>
                    <span className="text-sm font-medium capitalize">Home / {pageName}</span>
                </div>
            </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-background text-foreground">
                CA
              </AvatarFallback>
            </Avatar>
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40">
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
