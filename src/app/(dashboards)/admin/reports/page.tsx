
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Reports</h1>
          <p className="text-muted-foreground">View your campaign performance reports.</p>
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
            <p>Detailed campaign reports will be available here shortly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
