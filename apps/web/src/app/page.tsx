import { LandingNav } from './_components/landing/LandingNav';
import { HeroSection } from './_components/landing/HeroSection';
import { HowItWorksSection } from './_components/landing/HowItWorksSection';
import { FeaturesSection } from './_components/landing/FeaturesSection';
import { ProductPreviewSection } from './_components/landing/ProductPreviewSection';
import { TestimonialsSection } from './_components/landing/TestimonialsSection';
import { CtaBanner } from './_components/landing/CtaBanner';

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: '#FBF5EE' }}>
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ProductPreviewSection />
      <TestimonialsSection />
      <CtaBanner />
    </main>
  );
}
