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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const clinicalsSubMenu = [
  { href: '/admin/clinics', label: 'Clinics', icon: Building },
  { href: '/admin/specialties', label: 'Specialties', icon: Stethoscope },
  { href: '/admin/live-queue', label: 'Live Queue', icon: Monitor },
  { href: '/admin/central-register', label: 'Central Register', icon: List },
];

const advertisingSubMenu = [
  { href: '/admin/advertising', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/advertisers', label: 'Advertisers', icon: Users },
]


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
            
            <SidebarGroup>
                <SidebarGroupLabel>Management</SidebarGroupLabel>
                <SidebarGroupContent>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/clinics-section')}>
                          <Link href="#">
                            <Building />
                            Clinics
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/patient-details')}>
                          <Link href="#">
                            <List />
                            Patient Details
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                          <Link href="#">
                            <Users />
                            Users
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

             <SidebarGroup>
                <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
                <SidebarGroupContent>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/live-queue-section')}>
                          <Link href="#">
                            <Eye />
                            Live Queue
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>Advertising</SidebarGroupLabel>
                <SidebarGroupContent>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/advertising')}>
                          <Link href="/admin/advertising">
                            <Megaphone />
                            Ad-Campaigns
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                </SidebarGroupContent>
            </SidebarGroup>

            {/* DEMO Links */}
            <SidebarGroup>
                <SidebarGroupLabel>Demo Roles</SidebarGroupLabel>
                <SidebarGroupContent>
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
                </SidebarGroupContent>
            </SidebarGroup>
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


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col bg-muted/30">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
