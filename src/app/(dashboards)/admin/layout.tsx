
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
  ChevronLeft,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function AdminSidebar() {
  const pathname = usePathname();
  const basePath = '/admin';

  const adminMenuItems = [
    { href: `${basePath}`, icon: LayoutDashboard, label: 'Dashboard', active: pathname === `${basePath}` },
    { href: `${basePath}/users`, icon: Users, label: 'Users', active: pathname === `${basePath}/users` },
  ]

  const clinicalMenuItems = [
    { href: `${basePath}/live-queue`, icon: Monitor, label: 'Live Queue', active: pathname === `${basePath}/live-queue` },
    { href: `${basePath}/patient-registry`, icon: ClipboardList, label: 'Patient Registry', active: pathname === `${basePath}/patient-registry` },
    { href: `${basePath}/clinics`, icon: Building, label: 'Clinics', active: pathname === `${basePath}/clinics` },
    { href: `${basePath}/specialties`, icon: Sparkles, label: 'Specialties', active: pathname === `${basePath}/specialties` },
  ];

  const advertisersMenuItems = [
      { href: `${basePath}/advertisers`, icon: Megaphone, label: 'Advertisers', active: pathname === `${basePath}/advertisers` },
      { href: `${basePath}/campaigns`, icon: Film, label: 'Campaigns', active: pathname === `${basePath}/campaigns` },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col px-4 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Administration
          </span>
        </div>
        <SidebarMenu>
          {adminMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="flex flex-col px-4 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Clinical
          </span>
        </div>
        <SidebarMenu>
          {clinicalMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="flex flex-col px-4 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Advertisers
          </span>
        </div>
        <SidebarMenu>
          {advertisersMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
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
          <div className="flex items-center gap-3 p-2 border-t border-sidebar-border">
             <Button variant="destructive" className="w-full justify-start text-red-500 bg-red-100 hover:bg-red-200" asChild>
                <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Link>
            </Button>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { state, toggleSidebar } = useSidebar();
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white hidden md:flex" onClick={toggleSidebar}>
                        <ChevronLeft className="h-5 w-5 opacity-80 transition-transform duration-300" data-state={state} style={{ transform: state === 'collapsed' ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                    </Button>
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
