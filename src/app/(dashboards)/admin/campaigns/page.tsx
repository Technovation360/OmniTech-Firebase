
'use client';

import { getAdvertisements } from '@/lib/data';
import { useState, useEffect } from 'react';
import type { Advertisement } from '@/lib/types';
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
import { Eye, Film, Users, Monitor, ArrowUp, ArrowDown } from 'lucide-react';

const stats = [
    { title: "Total Impressions", value: "20,879", icon: Eye },
    { title: "Active Campaigns", value: "2", icon: Film },
    { title: "Clinic Count", value: "1", icon: Users },
    { title: "Screen Count", value: "1", icon: Monitor },
]

export default function CampaignsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Advertisement; direction: 'asc' | 'desc' } | null>({ key: 'campaign', direction: 'asc'});

  useEffect(() => {
    getAdvertisements().then(setAds);
  }, []);

  const handleSort = (key: keyof Advertisement) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedAds = [...ads].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setAds(sortedAds);
  };

  const getSortIcon = (key: keyof Advertisement) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Campaigns Dashboard</h1>
        </div>
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
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('campaign')}>
                        Campaign
                        {getSortIcon('campaign')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('advertiser')}>
                        Advertiser
                        {getSortIcon('advertiser')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('impressions')}>
                        Impressions
                        {getSortIcon('impressions')}
                    </Button>
                </TableHead>
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
