import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock } from 'lucide-react';
import { usePromoCountdown } from '@/hooks/usePromoCountdown';
import { TEXT_PROMO_CODE_MESSAGE, TEXT_PROMO_LABEL } from '@/lib/promotional-offer';

export function PromotionalBanner() {
  const { isEligible, formattedTime } = usePromoCountdown();

  if (!isEligible) {
    // Show standard 50% text-code offer if time expired
    return (
      <div className="w-full max-w-4xl mx-auto px-2 md:px-4">
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent shadow-lg mb-6">
          <CardContent className="py-3 md:py-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-primary/20">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base md:text-xl font-bold mb-1">New Customer Special</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Get {TEXT_PROMO_LABEL} when you use the promo code texted to you</p>
              </div>
              <Badge className="bg-primary text-primary-foreground px-3 py-1.5 text-base md:px-4 md:py-2 md:text-lg w-full sm:w-auto">
                {TEXT_PROMO_LABEL}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show urgent 50% offer reminder with countdown
  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4">
      <Card className="border-destructive/40 bg-gradient-to-r from-destructive/15 to-transparent shadow-xl mb-6 animate-pulse-subtle">
        <CardContent className="py-3 md:py-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-full bg-destructive/20 animate-pulse">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2 mb-1">
                <h3 className="text-base md:text-xl font-bold">⏰ Promo Code Reminder</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Use the promo code texted to you in the next <span className="font-mono font-bold text-destructive text-sm md:text-base">{formattedTime}</span> to get <span className="font-bold">{TEXT_PROMO_LABEL}</span> off your first cleaning
              </p>
            </div>
            <div className="text-center sm:text-right w-full sm:w-auto">
              <Badge className="bg-destructive text-destructive-foreground px-3 py-1.5 text-xl md:px-4 md:py-2 md:text-2xl font-bold">
                {TEXT_PROMO_LABEL}
              </Badge>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{TEXT_PROMO_CODE_MESSAGE}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}