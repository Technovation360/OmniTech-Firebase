
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building, Ticket, Megaphone, Film, Loader } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { User, Campaign } from '@/lib/types';


function CentralAdminDashboard() {
    const stats = [
        { title: "CLINICS", value: "2", icon: Building },
        { title: "ACTIVE TOKENS", value: "3", icon: Ticket },
        { title: "ADVERTISERS", value: "2", icon: Megaphone },
        { title: "CAMPAIGNS", value: "2", icon: Film },
    ];

    return (
        <div className="space-y-6">
           <h1 className="text-3xl font-bold font-headline">Central Admin Dashboard</h1>
           <p className="text-muted-foreground">Welcome to the central hub for managing the OmniToken platform.</p>
           <div className="max-w-4xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2">
                {stats.map((stat) => (
                    <Card key={stat.title} className="shadow-sm">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center gap-4">
                        <div className="p-3 bg-accent rounded-full">
                        <stat.icon className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div className="text-4xl font-bold">{stat.value}</div>
                    </CardContent>
                    </Card>
                ))}
                </div>
           </div>
        </div>
    );
}

function AdvertiserDashboard() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    const [advertiserId, setAdvertiserId] = useState<string | null>(null);

    useEffect(() => {
        if (authUser && !isUserLoading) {
            const userDocRef = doc(firestore, 'users', authUser.uid);
            getDoc(userDocRef).then(snap => {
                if (snap.exists()) {
                    const userData = snap.data() as User;
                    if (userData.role === 'advertiser' && userData.affiliation) {
                        const advQuery = query(collection(firestore, 'advertisers'), where('name', '==', userData.affiliation));
                        getDocs(advQuery).then((advSnap) => {
                            if (!advSnap.empty) {
                                setAdvertiserId(advSnap.docs[0].id);
                            }
                        });
                    }
                }
            });
        }
    }, [authUser, isUserLoading, firestore]);
    
    const campaignsQuery = useMemoFirebase(() => {
        if (!advertiserId) return null;
        return query(collection(firestore, 'campaigns'), where('advertiserId', '==', advertiserId));
    }, [firestore, advertiserId]);

    const { data: campaigns, isLoading: campaignsLoading } = useCollection<Campaign>(campaignsQuery);

    const stats = [
        { title: "CAMPAIGNS", value: campaigns?.length ?? 0, icon: Film },
        { title: "VIDEOS", value: "N/A", icon: Megaphone },
    ];
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Advertiser Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your dashboard.</p>
            {(campaignsLoading || isUserLoading) && <Loader className="animate-spin" />}
            {!(campaignsLoading || isUserLoading) && (
                <div className="max-w-4xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-2">
                        {stats.map((stat) => (
                            <Card key={stat.title} className="shadow-sm">
                            <CardHeader className="pb-2 text-center">
                                <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center gap-4">
                                <div className="p-3 bg-accent rounded-full">
                                <stat.icon className="h-6 w-6 text-accent-foreground" />
                                </div>
                                <div className="text-4xl font-bold">{stat.value}</div>
                            </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !isUserLoading) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
            setCurrentUserData(docSnap.data() as User);
            }
            setLoading(false);
        });
        } else if (!isUserLoading) {
            setLoading(false);
        }
    }, [user, isUserLoading, firestore]);

    if (loading) {
        return (
        <div className="flex h-full items-center justify-center">
            <Loader className="h-8 w-8 animate-spin" />
        </div>
        );
    }
    
    if (currentUserData?.role === 'advertiser') {
        return <AdvertiserDashboard />;
    }

    return <CentralAdminDashboard />;
}
