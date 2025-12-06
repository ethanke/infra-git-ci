import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionForm } from '@/components/subscription-form';
import { Mail, Users, Bell } from 'lucide-react';

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params;
  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Stay Updated with Our Latest Articles
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Subscribe to our newsletter and never miss a new article. Get notified directly in your inbox when we publish fresh content.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive instant notifications when new articles are published
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Get notified immediately when we publish new content</li>
              <li>• Receive article summaries and direct links</li>
              <li>• Professional, mobile-friendly email templates</li>
              <li>• Easy one-click unsubscribe from any email</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              What You'll Get
            </CardTitle>
            <CardDescription>
              Stay informed about our latest insights and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Technical articles and tutorials</li>
              <li>• Industry insights and best practices</li>
              <li>• Product updates and announcements</li>
              <li>• Exclusive content not available elsewhere</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-md mx-auto">
        <SubscriptionForm />
      </div>

      <div className="text-center mt-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Join our community of readers</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We respect your privacy and will never share your email address. You can unsubscribe at any time using the link in our emails.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
