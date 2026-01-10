
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Monitor,
  PanelLeft,
  LogOut,
  Building,
  ClipboardList,
  Megaphone,
  Film,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function AdminSidebar() {
  const pathname = usePathname();
  const basePath = '/admin';

  const platformMenuItems = [
    { href: `${basePath}`, icon: LayoutDashboard, label: 'Dashboard', active: pathname === `${basePath}` },
    { href: `${basePath}/live-queue`, icon: Monitor, label: 'Live Queue', active: pathname === `${basePath}/live-queue` },
    { href: `${basePath}/patient-registry`, icon: ClipboardList, label: 'Patient Registry', active: pathname === `${basePath}/patient-registry` },
  ];

  const adminMenuItems = [
    { href: `${basePath}/clinics`, icon: Building, label: 'Clinics', active: pathname === `${basePath}/clinics` },
    { href: `${basePath}/users`, icon: Users, label: 'Users', active: pathname === `${basePath}/users` },
    { href: `${basePath}/specialties`, icon: Sparkles, label: 'Specialties', active: pathname === `${basePath}/specialties` },
    { href: `${basePath}/advertisers`, icon: Megaphone, label: 'Advertisers', active: pathname === `${basePath}/advertisers` },
    { href: `${basePath}/campaigns`, icon: Film, label: 'Campaigns', active: pathname === `${basePath}/campaigns` },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 px-4 pt-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Platform Management
          </span>
        </div>
        <SidebarMenu>
          {platformMenuItems.map((item) => (
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
        
        <div className="flex flex-col gap-2 px-4 pt-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Administration
          </span>
        </div>
        <SidebarMenu>
          {adminMenuItems.map((item) => (
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
      <SidebarFooter>
          <div className="flex items-center gap-3 p-4 border-t border-sidebar-border">
            <Avatar className="h-10 w-10">
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@omni.com</span>
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

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const pageName = pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';
  
  return (
    <>
      <AdminSidebar />
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
                A
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
