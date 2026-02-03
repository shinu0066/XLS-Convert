
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // Import Link
import { useRouter } from 'next/navigation';

interface LimitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'guest' | 'loggedIn';
  timeToWaitFormatted?: string;
  onPlan?: boolean;
  planName?: string;
  isPlanExhausted?: boolean;
}

export default function LimitDialog({ 
  isOpen, 
  onOpenChange, 
  userType, 
  timeToWaitFormatted,
  onPlan,
  planName,
  isPlanExhausted
}: LimitDialogProps) {
  const router = useRouter();

  let title = "Conversion Limit Reached";
  let description = "";
  
  if (onPlan) {
    if (isPlanExhausted) {
      title = `${planName || 'Current'} Plan Quota Exhausted`;
      description = `You have used all conversions for your ${planName || 'current'} plan. Please upgrade your plan or wait for your quota to renew.`;
    } else {
      description = `There was an issue with your plan. Please contact support.`;
    }
  } else { // Free tier limit
    if (userType === 'guest') {
      description = `You have used your 1 free conversion. Please wait ${timeToWaitFormatted ? timeToWaitFormatted : '24 hours'}, or sign up for 5 free conversions.`;
    } else { // Logged-in user, free tier limit
      description = `You have used your 5 free conversions. Please wait ${timeToWaitFormatted ? timeToWaitFormatted : '24 hours'} or upgrade to a plan for more conversions.`;
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {userType === 'guest' ? (
            <>
              <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              </AlertDialogCancel>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <AlertDialogAction asChild>
                    <Button onClick={() => router.push('/login')} className="w-full">Login</Button>
                 </AlertDialogAction>
                 <AlertDialogAction asChild>
                    <Button onClick={() => router.push('/signup')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Register</Button>
                 </AlertDialogAction>
              </div>
            </>
          ) : (
             <>
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={() => router.push('/pricing')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    View Pricing Plans
                  </Button>
                </AlertDialogAction>
             </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
