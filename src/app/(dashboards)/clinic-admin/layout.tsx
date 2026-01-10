
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
  LogOut,
  PanelLeft,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="p-2 bg-primary text-primary-foreground flex items-center justify-between border-b border-primary-foreground/20">
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white" onClick={toggleSidebar}>
          <PanelLeft />
      </Button>
      
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-background text-foreground">CA</AvatarFallback>
        </Avatar>
        <Button variant="destructive" size="icon" className="h-8 w-8 hover:bg-destructive/80" asChild>
          <Link href="/">
            <LogOut className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}


function DashboardSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const clinicId = params.id as string;

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === `/clinic-admin/${clinicId}`}>
              <Link href={`/clinic-admin/${clinicId}`}>
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/clinic-admin/${clinicId}/users`)}>
              <Link href="#">
                <Users />
                Users
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/clinic-admin/${clinicId}/live-queue`)}>
              <Link href="#">
                <Monitor/>
                Live Queue
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/clinic-admin/${clinicId}/patient-registry`)}>
              <Link href="#">
                <List/>
                Patient Registry
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
          <div className="flex items-center gap-3 p-4 border-t border-sidebar-border">
            <Avatar className="h-10 w-10">
                <AvatarFallback>CA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">Clinic Admin</span>
                <span className="text-xs text-muted-foreground">admin@clinic.com</span>
            </div>
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
  return (
    <>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col bg-muted/30">
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
