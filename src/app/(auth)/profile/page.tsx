
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/core/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const memberSince = currentUser?.metadata.creationTime 
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
            <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-md mb-3">
              <AvatarImage src={currentUser.photoURL || undefined} alt="User avatar" />
              <AvatarFallback className="text-4xl">
                {getInitials(userProfile?.firstName, userProfile?.lastName, currentUser.email || '')}
              </AvatarFallback>
            </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">
             {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Welcome!'}
          </CardTitle>
          <CardDescription>
            View and manage your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Full Name</p>
                        <p className="font-medium text-foreground">
                            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Not Available'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Email Address</p>
                        <p className="font-medium text-foreground">{currentUser.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                     <div>
                        <p className="text-muted-foreground">Member Since</p>
                        <p className="font-medium text-foreground">{memberSince}</p>
                    </div>
                </div>
            </div>
             <Separator />
          <div className="text-center pt-4">
            <p className="text-muted-foreground">This page is a placeholder for future profile management features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
