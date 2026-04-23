/**
 * Promotions Service
 * Handles the 20% first clean discount logic
 */

import { supabase } from '@/integrations/supabase/client';
import { getPromoDiscountCents, TEXT_PROMO_DISCOUNT_PERCENT } from '@/lib/promotional-offer';

export interface PromoApplication {
  code: string;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

/**
 * Apply 50% first clean discount when customer uses their texted promo code
 */
export async function applyFirst20Discount(
  subtotalCents: number,
  customerEmail: string
): Promise<PromoApplication> {
  // Check if customer has already used the first clean discount
  const { data: customer } = await supabase
    .from('customers')
    .select('first_clean_discount_used')
    .eq('email', customerEmail)
    .maybeSingle();

  if (customer?.first_clean_discount_used) {
    throw new Error('First clean discount already used');
  }

  const discountPercent = TEXT_PROMO_DISCOUNT_PERCENT;
  const discountAmount = getPromoDiscountCents(subtotalCents);
  const finalPrice = subtotalCents - discountAmount;

  return {
    code: 'PROMO_TEXT50',
    discountPercent,
    discountAmount,
    finalPrice
  };
}

/**
 * Legacy helper kept for compatibility; now maps to the texted 50% promo
 */
export async function applyFirst25Discount(
  subtotalCents: number,
  customerEmail: string
): Promise<PromoApplication> {
  // Check if customer has already used the first clean discount
  const { data: customer } = await supabase
    .from('customers')
    .select('first_clean_discount_used')
    .eq('email', customerEmail)
    .maybeSingle();

  if (customer?.first_clean_discount_used) {
    throw new Error('First clean discount already used');
  }

  const discountPercent = TEXT_PROMO_DISCOUNT_PERCENT;
  const discountAmount = getPromoDiscountCents(subtotalCents);
  const finalPrice = subtotalCents - discountAmount;

  return {
    code: 'PROMO_TEXT50',
    discountPercent,
    discountAmount,
    finalPrice
  };
}

/**
 * Check if customer can use the texted 50% discount
 */
export async function canApplyFirst25(customerEmail: string): Promise<boolean> {
  const canApply = await canApplyFirst20(customerEmail);
  
  // Also check if within 24-hour window
  const sessionStart = localStorage.getItem('promo_session_start');
  if (!sessionStart) return false;
  
  const startTime = new Date(sessionStart);
  const now = new Date();
  const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  return canApply && hoursSinceStart < 24;
}

/**
 * Mark first clean discount as used for a customer
 */
export async function markFirstCleanUsed(customerEmail: string): Promise<void> {
  await supabase
    .from('customers')
    .update({ first_clean_discount_used: true })
    .eq('email', customerEmail);
}

/**
 * Validate that the first-clean texted promo can be applied
 */
export async function canApplyFirst20(customerEmail: string): Promise<boolean> {
  const { data: customer } = await supabase
    .from('customers')
    .select('first_clean_discount_used')
    .eq('email', customerEmail)
    .maybeSingle();

  return !customer?.first_clean_discount_used;
}