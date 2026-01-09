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
  Building,
  Monitor,
  Megaphone,
  LogOut,
  Stethoscope,
  UserPlus,
  PanelLeft,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="p-3 bg-background flex items-center justify-between border-b">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          <PanelLeft />
      </Button>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-9 w-9">
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/">
            <LogOut className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}


function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin'}>
              <Link href="/admin">
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/clinics')}>
              <Link href="/admin">
                <Building />
                Clinics
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
              <Link href="/admin">
                <Users />
                Users
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/advertising')}>
              <Link href="/admin/advertising">
                <Megaphone />
                Advertising
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/patient-registry')}>
              <Link href="/admin">
                <List />
                Patient Registry
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/display')}>
              <Link href="/display/scr_main_hall">
                <Monitor />
                Live Queue
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* DEMO Links */}
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/doctor')}>
              <Link href="/doctor/doc_ashish">
                  <Stethoscope />
                  <span>Doctor</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/assistant')}>
              <Link href="/assistant/asst_sunita">
                  <UserPlus />
                  <span>Assistant</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
          <div className="flex items-center gap-3 p-4 border-t border-sidebar-border">
            <Avatar className="h-10 w-10">
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">Admin</span>
                <span className="text-xs text-muted-foreground">admin@omni.com</span>
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


export default function DashboardLayout({
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