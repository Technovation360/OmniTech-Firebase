
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
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

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
        <div className="flex flex-col px-4 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            NAVIGATION
          </span>
        </div>
        <SidebarMenu>
          {menuItems.map((item) => (
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

function DoctorLayoutContent({ children }: { children: React.ReactNode }) {
  const { state, toggleSidebar } = useSidebar();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

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
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white text-primary hover:bg-white/90 hidden md:flex" onClick={toggleSidebar}>
                        <ChevronLeft className="h-5 w-5 opacity-80 transition-transform duration-300" data-state={state} style={{ transform: state === 'collapsed' ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                    </Button>
                    <span className="text-sm font-medium">Home / Overview</span>
                </div>
            </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-background text-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </SidebarInset>
    </>
  );
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
