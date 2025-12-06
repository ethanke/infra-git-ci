import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

async function UnsubscribeResult({ token }: { token: string }) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/unsubscribe?token=${token}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{data.message}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{data.message}</span>
        </div>
      );
    }
  } catch (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Failed to unsubscribe. Please try again later.</span>
      </div>
    );
  }
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe from Newsletter</CardTitle>
          <CardDescription>
            {token ? 'Processing your unsubscribe request...' : 'Invalid unsubscribe link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <Suspense fallback={
              <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            }>
              <UnsubscribeResult token={token} />
            </Suspense>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Invalid unsubscribe link. Please check your email for the correct link.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
