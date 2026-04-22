import PricingContent from './PricingContent';

export default function PricingPage() {
  return (
    <PricingContent
      priceBasic={process.env.STRIPE_PRICE_BASIC ?? ''}
      pricePremium={process.env.STRIPE_PRICE_PREMIUM ?? ''}
    />
  );
}
