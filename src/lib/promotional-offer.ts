export const BASE_PRICE_INCREASE_MULTIPLIER = 1.1;
export const TEXT_PROMO_DISCOUNT_PERCENT = 50;
export const TEXT_PROMO_DISCOUNT_MULTIPLIER = 0.5;

export const TEXT_PROMO_LABEL = '50% OFF';
export const TEXT_PROMO_REQUIREMENT = 'with your promo code texted to you';
export const TEXT_PROMO_CODE_MESSAGE = 'Use the promo code texted to you to unlock 50% off.';

export function applyBasePriceIncrease(price: number): number {
  return Math.round(price * BASE_PRICE_INCREASE_MULTIPLIER);
}

export function getPromoPrice(price: number): number {
  return Math.round(price * TEXT_PROMO_DISCOUNT_MULTIPLIER);
}

export function getPromoDiscountAmount(price: number): number {
  return Math.round(price - getPromoPrice(price));
}

export function getPromoDiscountCents(subtotalCents: number): number {
  return Math.round(subtotalCents * TEXT_PROMO_DISCOUNT_MULTIPLIER);
}