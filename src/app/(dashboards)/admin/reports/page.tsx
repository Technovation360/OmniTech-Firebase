
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function StatisticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Campaign Statistics</h1>
          <p className="text-muted-foreground">View performance data for your campaigns.</p>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            This section is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Detailed campaign statistics and performance graphs will be available here shortly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
