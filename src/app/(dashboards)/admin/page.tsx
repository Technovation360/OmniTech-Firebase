import { getClinicGroups } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Copy, QrCode } from 'lucide-react';

export default async function AdminPage() {
  const clinicGroups = await getClinicGroups();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your clinic groups and operations.</p>
        </div>
        <Button>Add New Group</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Groups</CardTitle>
          <CardDescription>
            View and manage all clinic groups. Each group has its own registration QR code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Cabin</TableHead>
                <TableHead>Registration Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.doctor.name}</TableCell>
                  <TableCell>{group.cabin.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/register/${group.id}`} target="_blank">
                          <QrCode className="mr-2 h-4 w-4" />
                          Show QR
                        </Link>
                       </Button>
                       <Button variant="ghost" size="icon">
                         <Copy className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Master QR Code</CardTitle>
          <CardDescription>
            Use this master link to allow patients to choose their desired clinic group upon registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-mono flex-1">/register/select-group</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/register/select-group" target="_blank">
                <QrCode className="mr-2 h-4 w-4" />
                View Page
              </Link>
            </Button>
            <Button variant="ghost" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
