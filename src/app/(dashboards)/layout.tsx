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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubContent,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  Users,
  Building,
  Monitor,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Stethoscope,
  UserPlus,
  Eye,
  List,
  PanelLeft,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
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
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                <Link href="/admin">
                  <Users />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuSub>
              <SidebarMenuButton>
                <Building />
                Clinicals
              </SidebarMenuButton>
              <SidebarMenuSubContent>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton>
                      <Link href="#">Clinics</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton>
                      <Link href="#">Patient Details</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
              </SidebarMenuSubContent>
            </SidebarMenuSub>

            <SidebarMenuSub>
              <SidebarMenuButton>
                <Megaphone />
                Advertising
              </SidebarMenuButton>
               <SidebarMenuSubContent>
                  <SidebarMenuItem>
                    <SidebarMenuSubButton>
                      <Link href="/admin/advertising">Ad-Campaigns</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
              </SidebarMenuSubContent>
            </SidebarMenuSub>

            {/* DEMO Links */}
            <SidebarGroup>
                <SidebarGroupLabel>Demo Roles</SidebarGroupLabel>
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
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/display')}>
                        <Link href="/display/scr_main_hall">
                            <Monitor />
                            <span>Display</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarGroup>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col bg-muted/30">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
