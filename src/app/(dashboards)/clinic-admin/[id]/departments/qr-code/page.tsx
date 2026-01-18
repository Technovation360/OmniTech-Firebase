
'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DeprecatedQrCodePage() {
    const params = useParams();
    const clinicId = params.id;
  return (
    <Card className="max-w-lg mx-auto mt-10">
        <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">This Page is Obsolete</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
                QR Code generation has been moved to the "Groups" section.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
             <Button asChild>
                <Link href={`/clinic-admin/${clinicId}/groups`}>
                    Go to Groups
                </Link>
            </Button>
        </CardContent>
    </Card>
  );
}
