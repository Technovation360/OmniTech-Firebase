import Link from "next/link";
import { ArrowRight, Monitor, Stethoscope, User, UserPlus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";

const roles = [
  {
    name: "Admin",
    description: "Manage clinics, doctors, and ads.",
    href: "/admin",
    icon: Stethoscope,
  },
  {
    name: "Doctor",
    description: "View queue and manage consultations.",
    href: "/doctor/doc_ashish",
    icon: User,
  },
  {
    name: "Assistant",
    description: "Register patients on their behalf.",
    href: "/assistant/asst_sunita",
    icon: UserPlus,
  },
  {
    name: "Queue Display",
    description: "Show queue on a TV screen.",
    href: "/display/scr_main_hall",
    icon: Monitor,
  },
   {
    name: "Patient",
    description: "Register for a consultation.",
    href: "/register/select-group",
    icon: QrCode,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b">
        <Logo />
      </header>
      <main className="flex-1 bg-gray-50/50">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                  Welcome to Clinic Flow
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Select your role to get started. The modern way to manage patient flow and clinic operations.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full pb-12 md:pb-24 lg:pb-32">
          <div className="container grid gap-6 md:gap-8 px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card key={role.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">{role.name}</CardTitle>
                    <role.icon className="w-6 h-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                    <Button asChild className="w-full">
                      <Link href={role.href}>
                        Go to {role.name} view <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Clinic Flow. All rights reserved.</p>
      </footer>
    </div>
  );
}
