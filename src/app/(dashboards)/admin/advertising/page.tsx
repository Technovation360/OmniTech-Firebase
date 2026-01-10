import { getAdvertisements } from '@/lib/data';
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
import { Eye, Film, Users, Monitor } from 'lucide-react';

const stats = [
    { title: "Total Impressions", value: "20,879", icon: Eye },
    { title: "Active Campaigns", value: "2", icon: Film },
    { title: "Clinic Count", value: "1", icon: Users },
    { title: "Screen Count", value: "1", icon: Monitor },
]

export default async function AdvertisingPage() {
  const ads = await getAdvertisements();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Advertising Management</h1>
          <p className="text-muted-foreground">Oversee advertisers and campaigns.</p>
        </div>
        <Button>New Campaign</Button>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>
            List of all video advertisements currently in rotation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Video</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium py-2 text-xs">{ad.campaign}</TableCell>
                  <TableCell className="py-2 text-xs">{ad.advertiser}</TableCell>
                  <TableCell className="py-2 text-xs">{ad.impressions.toLocaleString()}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <a href={ad.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Watch Video
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
