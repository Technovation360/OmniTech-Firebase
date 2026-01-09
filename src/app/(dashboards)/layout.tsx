
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
  SidebarMenuSubItem,
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
  PanelLeft,
  List,
  HeartPulse,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React, { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';

function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="p-2 bg-primary text-primary-foreground flex items-center justify-between border-b border-primary-foreground/20">
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white">
          <PanelLeft onClick={toggleSidebar} />
      </Button>
      
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-background text-foreground">A</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white" asChild>
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
  const isClinicalActive = pathname.startsWith('/admin/clinics') || pathname.startsWith('/admin/live-queue') || pathname.startsWith('/admin/patient-registry');

  const [isClinicalOpen, setIsClinicalOpen] = useState(false);

  useEffect(() => {
    setIsClinicalOpen(isClinicalActive);
  }, [isClinicalActive]);


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
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
              <Link href="/admin/users">
                <Users />
                Users
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Collapsible open={isClinicalOpen} onOpenChange={setIsClinicalOpen}>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isClinicalActive} className="justify-between">
                        <div className="flex items-center gap-2">
                            <HeartPulse />
                            Clinical
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === '/admin/clinics'}>
                                <Link href="/admin/clinics">
                                    <Building/>
                                    Clinics
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                                <Link href="#">
                                    <Stethoscope/>
                                    Specialties
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === '/admin/live-queue'}>
                                <Link href="/admin/live-queue">
                                    <Monitor/>
                                    Live Queue
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === '/admin/patient-registry'}>
                                <Link href="/admin/patient-registry">
                                    <List/>
                                    Central Register
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/advertising')}>
              <Link href="/admin/advertising">
                <Megaphone />
                Advertising
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
