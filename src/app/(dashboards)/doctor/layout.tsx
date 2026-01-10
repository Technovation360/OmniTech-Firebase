
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
  MessageSquare,
  List,
  PanelLeft,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React, { use } from 'react';

function DoctorSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const doctorId = params.id as string;
  const basePath = `/doctor/${doctorId}`;

  const menuItems = [
    {
      href: basePath,
      icon: LayoutDashboard,
      label: 'Dashboard',
      active: pathname === basePath,
    },
    {
      href: `${basePath}/consultation`,
      icon: Stethoscope,
      label: 'Consultation',
      active: pathname.startsWith(`${basePath}/consultation`),
    },
    {
      href: `${basePath}/live-queue`,
      icon: List,
      label: 'Live Queue',
      active: pathname.startsWith(`${basePath}/live-queue`),
    },
    {
      href: `${basePath}/patients`,
      icon: Users,
      label: 'Patients',
      active: pathname.startsWith(`${basePath}/patients`),
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo variant="enterprise" />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            NAVIGATION
          </span>
        </div>
        <SidebarMenu>
          {menuItems.map((item) => (
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
                <AvatarFallback>DR</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">Dr. Ashish</span>
                <span className="text-xs text-muted-foreground">doc_ashish@omni.com</span>
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

function DoctorLayoutContent({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  const { id } = use(useParams());
  return (
    <>
      <DoctorSidebar />
      <SidebarInset className="flex flex-col">
        <header className="p-3 bg-primary text-primary-foreground flex items-center justify-between border-b-2 border-primary-foreground/20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 hover:text-white md:hidden" onClick={toggleSidebar}>
                    <PanelLeft />
                </Button>
                <div className="flex items-center gap-2">
                    <Link href="/"><ChevronLeftIcon className="h-5 w-5 opacity-80"/></Link>
                    <span className="text-sm font-medium">Home / Overview</span>
                </div>
            </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-background text-foreground">
                {id.toString().charAt(0).toUpperCase()}
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

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    )
  }

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DoctorLayoutContent>{children}</DoctorLayoutContent>
    </SidebarProvider>
  );
}
