'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { handleLogin } from '@/lib/auth-actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, message, redirectUrl } = await handleLogin(email, password);

    setLoading(false);

    if (success && redirectUrl) {
      router.push(redirectUrl);
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <header className="flex justify-between items-center py-8">
            <h1 className="text-2xl font-bold">Portal Login</h1>
            <Button variant="link" asChild>
                <Link href="/register/select-group">Patient Portal</Link>
            </Button>
        </header>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={onLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@omni.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <footer className="text-center text-muted-foreground text-sm mt-8">
            &copy; 2024 OMNITOKEN
        </footer>
      </div>
    </div>
  );
}
