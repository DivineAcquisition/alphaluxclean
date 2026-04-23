/**
 * New Pricing System - Based on cleaner pay + multipliers
 * Formula: Base = $25/hr × cleaners × hours × state_multiplier × service_multiplier × frequency_discount
 */

import {
  applyBasePriceIncrease,
  getPromoDiscountAmount,
  getPromoPrice,
} from './promotional-offer';

export interface HomeSizeRange {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  bedroomRange: string;
  requiresEstimate?: boolean;
  // Base prices for each service type
  deepPrice: number;           // Tester Deep Clean price
  maintenancePrice: number;    // Standard maintenance clean price
  ninetyDayPrice: number;      // Pre-calculated 90-Day Plan price (deep + 3 maintenance with bundle discount)
  regularPrice: number;        // Deprecated - kept for compatibility
  moveInOutPrice: number;
}

export interface ServiceTypeConfig {
  id: string;
  name: string;
  allowsRecurring: boolean; // Only Regular Clean allows recurring
}

export interface FrequencyConfig {
  id: string;
  name: string;
  recurringMultiplier?: number; // For recurring: weekly=0.40, bi-weekly=0.55, monthly=0.75
  cleansPerMonth?: number; // weekly=4, bi-weekly=2, monthly=1
  discount?: number; // Frequency-specific discount: one_time=0, weekly=0.15, bi_weekly=0.10, monthly=0.05
}

export interface StateConfig {
  code: string;
  name: string;
  multiplier: number; // TX: 1.0, CA: 1.10, NY: 1.15
}

export interface PricingConfig {
  states: StateConfig[];
  serviceTypes: ServiceTypeConfig[];
  frequencies: FrequencyConfig[];
}

export interface PricingResult {
  basePrice: number; // Original price before discount
  discountAmount: number; // Amount saved with discount
  discountedPrice: number; // Price after discount (deprecated, use finalPrice)
  finalPrice: number; // Price after discount (for one-time or per-clean)
  depositAmount: number; // 25% deposit amount
  mrrEstimate: number; // Monthly recurring revenue (if applicable)
  arrEstimate: number; // Annual recurring revenue (if applicable)
  savings: string; // Formatted savings message
  tierLabel: string; // Home size label
  recurringDetails?: {
    perClean: number;
    cleansPerMonth: number;
    monthlyTotal: number;
  };
}

// Deposit configuration
export const DEPOSIT_PERCENTAGE = 0.25; // 25% deposit required

// Universal Hybrid Pricing Model - Home size ranges with base prices
export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  {
    id: '1000_1500',
    label: '1,000 – 1,499 sq ft',
    minSqft: 1000,
    maxSqft: 1499,
    bedroomRange: '1–2 BR condos/homes',
    deepPrice: applyBasePriceIncrease(250),
    maintenancePrice: applyBasePriceIncrease(170),
    ninetyDayPrice: applyBasePriceIncrease(699),
    regularPrice: applyBasePriceIncrease(170),
    moveInOutPrice: applyBasePriceIncrease(315)
  },
  {
    id: '1501_2000',
    label: '1,500 – 1,999 sq ft',
    minSqft: 1500,
    maxSqft: 1999,
    bedroomRange: '2–3 BR homes',
    deepPrice: applyBasePriceIncrease(300),
    maintenancePrice: applyBasePriceIncrease(195),
    ninetyDayPrice: applyBasePriceIncrease(799),
    regularPrice: applyBasePriceIncrease(195),
    moveInOutPrice: applyBasePriceIncrease(385)
  },
  {
    id: '2001_2500',
    label: '2,000 – 2,499 sq ft',
    minSqft: 2000,
    maxSqft: 2499,
    bedroomRange: '3 BR homes',
    deepPrice: applyBasePriceIncrease(350),
    maintenancePrice: applyBasePriceIncrease(220),
    ninetyDayPrice: applyBasePriceIncrease(949),
    regularPrice: applyBasePriceIncrease(220),
    moveInOutPrice: applyBasePriceIncrease(455)
  },
  {
    id: '2501_3000',
    label: '2,500 – 2,999 sq ft',
    minSqft: 2500,
    maxSqft: 2999,
    bedroomRange: '3–4 BR homes',
    deepPrice: applyBasePriceIncrease(400),
    maintenancePrice: applyBasePriceIncrease(250),
    ninetyDayPrice: applyBasePriceIncrease(1099),
    regularPrice: applyBasePriceIncrease(250),
    moveInOutPrice: applyBasePriceIncrease(525)
  },
  {
    id: '3001_4000',
    label: '3,000 – 3,999 sq ft',
    minSqft: 3000,
    maxSqft: 3999,
    bedroomRange: '4 BR homes',
    deepPrice: applyBasePriceIncrease(450),
    maintenancePrice: applyBasePriceIncrease(280),
    ninetyDayPrice: applyBasePriceIncrease(1249),
    regularPrice: applyBasePriceIncrease(280),
    moveInOutPrice: applyBasePriceIncrease(595)
  },
  {
    id: '4001_5000',
    label: '4,000 – 4,999 sq ft',
    minSqft: 4000,
    maxSqft: 4999,
    bedroomRange: '4–5 BR homes',
    deepPrice: applyBasePriceIncrease(500),
    maintenancePrice: applyBasePriceIncrease(310),
    ninetyDayPrice: applyBasePriceIncrease(1399),
    regularPrice: applyBasePriceIncrease(310),
    moveInOutPrice: applyBasePriceIncrease(665)
  },
  {
    id: '5001_plus',
    label: '5,000+ sq ft',
    minSqft: 5000,
    maxSqft: 999999,
    bedroomRange: 'Custom Quote Required - Call (972) 559-0223',
    requiresEstimate: true,
    deepPrice: applyBasePriceIncrease(550),
    maintenancePrice: applyBasePriceIncrease(350),
    ninetyDayPrice: applyBasePriceIncrease(1599),
    regularPrice: 0,
    moveInOutPrice: 0
  }
];

// Aliases that map legacy or shorthand home-size ids (persisted in older
// customer localStorage) back to the canonical ids in HOME_SIZE_RANGES.
// Keep this list strictly additive — never rename an existing id.
const HOME_SIZE_ID_ALIASES: Record<string, string> = {
  // Legacy sub-1,000 sq ft bucket → smallest current tier.
  under_1000: '1000_1500',
  '0_1000': '1000_1500',
  // Older half-step buckets that were merged into the 1,000–1,499 tier.
  '1000_1200': '1000_1500',
  '1200_1500': '1000_1500',
  // Intermediate tier that collapsed into 1,500–1,999.
  '1500_1800': '1501_2000',
  '1800_2000': '1501_2000',
  // 2,000–2,499 legacy shortcuts.
  '2000_2200': '2001_2500',
  '2200_2500': '2001_2500',
  '2200_2800': '2501_3000',
  '2500_2800': '2501_3000',
  // 2,800–3,600 → merged into 3,000–3,999 today.
  '2800_3600': '3001_4000',
  '3001_3500': '3001_4000',
  '3501_4000': '3001_4000',
  // 3,600–5,000 → split into 3,000–3,999 / 4,000–4,999.
  '3600_5000': '4001_5000',
  '4001_4500': '4001_5000',
  '4501_5000': '4001_5000',
  '5000_plus': '5001_plus',
};

/**
 * Resolve any persisted home-size id into a canonical id present in
 * HOME_SIZE_RANGES. Falls back to the 2,000–2,499 tier when nothing
 * matches so the Offer page never renders with an undefined size.
 */
export function resolveHomeSizeId(id: string | undefined | null): string {
  if (!id) return '2001_2500';
  if (HOME_SIZE_RANGES.some((tier) => tier.id === id)) return id;
  return HOME_SIZE_ID_ALIASES[id] || '2001_2500';
}

// Universal Hybrid Pricing Configuration
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  states: [
    { code: 'TX', name: 'Texas', multiplier: 1.0 },
    { code: 'CA', name: 'California', multiplier: 1.10 },
    { code: 'NY', name: 'New York', multiplier: 1.15 }
  ],
  serviceTypes: [
    { id: 'regular', name: 'Standard Cleaning', allowsRecurring: true },
    { id: 'deep', name: 'Deep Cleaning', allowsRecurring: false },
    { id: 'move_in_out', name: 'Move-In/Out Cleaning', allowsRecurring: false }
  ],
  frequencies: [
    { id: 'one_time', name: 'One-time', discount: 0 },
    { id: 'weekly', name: 'Weekly', recurringMultiplier: 1.0, cleansPerMonth: 4, discount: 0.15 },
    { id: 'bi_weekly', name: 'Bi-Weekly', recurringMultiplier: 1.0, cleansPerMonth: 2, discount: 0.10 },
    { id: 'monthly', name: 'Monthly', recurringMultiplier: 1.0, cleansPerMonth: 1, discount: 0.05 }
  ]
};

/**
 * Calculate pricing based on Universal Hybrid Pricing Model
 */
export function calculateNewPricing(
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string,
  stateCode: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): PricingResult {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = config.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = config.frequencies.find(f => f.id === frequencyId);
  const state = config.states.find(s => s.code === stateCode);

  if (!homeSize || !serviceType || !frequency || !state) {
    throw new Error('Invalid pricing parameters');
  }

  // Handle custom quote for 5,000+ sq ft
  if (homeSize.requiresEstimate) {
    return {
      basePrice: 0,
      discountAmount: 0,
      discountedPrice: 0,
      finalPrice: 0,
      depositAmount: 0,
      mrrEstimate: 0,
      arrEstimate: 0,
      savings: 'Custom Quote Required - Call (972) 559-0223',
      tierLabel: homeSize.label
    };
  }

  // Get base price from pricing table based on service type
  let basePrice = 0;
  switch (serviceTypeId) {
    case 'regular':
      basePrice = homeSize.regularPrice;
      break;
    case 'deep':
      basePrice = homeSize.deepPrice;
      break;
    case 'move_in_out':
      basePrice = homeSize.moveInOutPrice;
      break;
    default:
      throw new Error(`Unknown service type: ${serviceTypeId}`);
  }

  // Apply state multiplier
  basePrice = basePrice * state.multiplier;

  // Calculate pricing based on frequency
  let finalPrice = basePrice;
  let discountAmount = 0;
  let mrrEstimate = 0;
  let arrEstimate = 0;
  let savings = '';
  let recurringDetails;

  // For one-time cleanings: display 50% off when customer uses the texted promo code
  if (frequencyId === 'one_time') {
    discountAmount = getPromoDiscountAmount(basePrice);
    finalPrice = getPromoPrice(basePrice);
    savings = 'Use your texted promo code to unlock 50% off this one-time cleaning.';
  }
  // For recurring cleanings (Regular Clean only): apply frequency-specific discount
  else if (serviceTypeId === 'regular' && frequency.cleansPerMonth) {
    // Apply frequency-specific discount
    const frequencyDiscount = frequency.discount || 0;
    discountAmount = basePrice * frequencyDiscount;
    finalPrice = basePrice - discountAmount; // Per clean price after discount
    
    // Calculate MRR and ARR
    mrrEstimate = finalPrice * frequency.cleansPerMonth;
    arrEstimate = mrrEstimate * 12;
    
    recurringDetails = {
      perClean: finalPrice,
      cleansPerMonth: frequency.cleansPerMonth,
      monthlyTotal: mrrEstimate
    };
    
    // Format savings message
    if (frequencyDiscount > 0) {
      savings = `You save ${(frequencyDiscount * 100).toFixed(0)}% on recurring cleanings!`;
    }
  }

  // Calculate deposit (25% of final price)
  const depositAmount = finalPrice * DEPOSIT_PERCENTAGE;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(finalPrice * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    depositAmount: Math.round(depositAmount * 100) / 100,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
    arrEstimate: Math.round(arrEstimate * 100) / 100,
    savings,
    tierLabel: homeSize.label,
    recurringDetails
  };
}

/**
 * Get home size by square footage
 */
export function getHomeSizeBySquareFootage(sqft: number): HomeSizeRange | null {
  return HOME_SIZE_RANGES.find(range => sqft >= range.minSqft && sqft <= range.maxSqft) || null;
}

/**
 * Calculate recurring upgrade discount when switching from one-time to recurring
 */
export function calculateRecurringUpgradeDiscount(
  basePrice: number,
  currentFrequency: string,
  newFrequency: string,
  wasOneTime: boolean
): { finalPrice: number; totalDiscount: number; bonusDiscount: number; frequencyDiscount: number } {
  // Bonus 10% discount for upgrading from one-time to recurring
  const bonusDiscount = wasOneTime ? 0.10 : 0;
  
  // Get standard frequency discount
  const frequencyConfig = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === newFrequency);
  const frequencyDiscount = frequencyConfig?.discount || 0;
  
  // Stack discounts: frequency + bonus (capped at 25% total)
  const totalDiscount = Math.min(frequencyDiscount + bonusDiscount, 0.25);
  
  const finalPrice = basePrice * (1 - totalDiscount);
  
  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    totalDiscount,
    bonusDiscount,
    frequencyDiscount
  };
}

/**
 * Format pricing for webhook payload
 */
export function formatPricingForWebhook(
  result: PricingResult,
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string
) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  return {
    sqft_range: homeSize?.label || '',
    service_type: serviceType?.name || '',
    frequency: frequency?.name || '',
    base_price: result.basePrice,
    discount_amount: result.discountAmount,
    price_final: result.finalPrice,
    mrr_est: result.mrrEstimate,
    arr_est: result.arrEstimate,
    savings: result.savings
  };
}