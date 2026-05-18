import MarketingNav from '../components/marketing/MarketingNav'
import HeroSection from '../components/marketing/HeroSection'
import FeaturesSection from '../components/marketing/FeaturesSection'
import HowItWorksSection from '../components/marketing/HowItWorksSection'
import AiSection from '../components/marketing/AiSection'
import PricingSection from '../components/marketing/PricingSection'
import TestimonialsSection from '../components/marketing/TestimonialsSection'
import CtaSection from '../components/marketing/CtaSection'
import MarketingFooter from '../components/marketing/MarketingFooter'

export default function MarketingPage() {
  return (
    <div className="mk min-h-screen">
      <MarketingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AiSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  )
}
