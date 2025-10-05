
'use client';

import Header from '@/components/Header';
import { useBilling } from "@/context/BillingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { language, setLanguage, isSpeechEnabled, setSpeechEnabled } = useBilling();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Application Settings</CardTitle>
              <CardDescription>
                Adjust your preferences for the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                  <h3 className="font-semibold">Voice Command Language</h3>
                  <RadioGroup 
                      defaultValue={language} 
                      onValueChange={(value) => setLanguage(value as 'en-IN' | 'ta-IN')}
                  >
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="en-IN" id="lang-en" />
                          <Label htmlFor="lang-en">English</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ta-IN" id="lang-ta" />
                          <Label htmlFor="lang-ta">Tamil (தமிழ்)</Label>
                      </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground pt-2">
                      Select the language you will use for voice commands.
                  </p>
              </div>
              <Separator />
              <div className="space-y-4">
                  <h3 className="font-semibold">Audio Feedback</h3>
                   <div className="flex items-center space-x-2">
                      <Switch
                          id="speech-toggle"
                          checked={isSpeechEnabled}
                          onCheckedChange={setSpeechEnabled}
                      />
                      <Label htmlFor="speech-toggle">Enable Voice Synthesis</Label>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">
                      Get spoken confirmation when you add or remove items.
                  </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
