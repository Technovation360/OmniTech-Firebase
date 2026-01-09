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
  UserPlus
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
  { href: '/admin/clinics', label: 'Clinics' },
  { href: '/admin/specialties', label: 'Specialties' },
  { href: '/admin/live-queue', label: 'Live Queue' },
  { href: '/admin/central-register', label: 'Central Register' },
];

const advertisingSubMenu = [
  { href: '/admin/advertising', label: 'Campaigns' },
  { href: '/admin/advertisers', label: 'Advertisers' },
]

function CollapsibleMenu({
  label,
  icon: Icon,
  items,
  path,
}: {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string }[];
  path: string;
}) {
  const [isOpen, setIsOpen] = useState(items.some(item => path.startsWith(item.href)));
  const isActive = isOpen || items.some(item => path.startsWith(item.href));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          className="justify-between"
          isActive={isActive}
        >
          <div className="flex items-center gap-2">
            <Icon />
            <span>{label}</span>
          </div>
          <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuSubButton
                asChild
                isActive={path.startsWith(item.href)}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarMenuSubButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}


function DashboardSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <Logo variant="enterprise" />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                  <Link href="#">
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <CollapsibleMenu label="Clinicals" icon={Building} items={clinicalsSubMenu} path={pathname} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <CollapsibleMenu label="Advertising" icon={Megaphone} items={advertisingSubMenu} path={pathname} />
              </SidebarMenuItem>

              {/* These are just for demo navigation purposes */}
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
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // A bit of a hack to get breadcrumbs. A real app would have a more robust system.
  const breadcrumbs = pathname.split('/').filter(Boolean);
  const currentPage = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1] : 'Dashboard';

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col bg-background">
        <header className="p-4 flex items-center justify-between bg-primary text-primary-foreground">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/80">
              <ChevronLeft />
            </Button>
            <div className="text-sm font-medium">
              <Link href="/" className="hover:underline opacity-80">Home</Link>
              <span className="opacity-80"> / </span>
              <span className="capitalize">{currentPage}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-foreground text-primary">J</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/80" asChild>
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
