'use client';

import { useBilling } from "@/context/BillingContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { language, setLanguage } = useBilling();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Adjust your preferences for the application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Voice Command Language</Label>
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
                <p className="text-xs text-muted-foreground pt-2">
                    Select the language you will use for voice commands. "Mixed" language is not yet supported.
                </p>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
