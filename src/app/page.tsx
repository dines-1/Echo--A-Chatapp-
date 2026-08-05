"use client";

import { FullScreenLoader } from "@/src/components/shared/full-screen-loader";
import { SiteHeader } from "@/src/components/index/site-header";
import { HeroSection } from "@/src/components/index/hero";
import { SiteFooter } from "@/src/components/index/site-footer";
import { useAuthRedirect } from "@/src/hooks/use-auth-redirect";

export default function Home() {
  const { status } = useAuthRedirect();

  if (status === "loading") {
    return <FullScreenLoader message="Checking session..." accentClassName="text-blue-500" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <SiteHeader />
      <HeroSection />
      <SiteFooter />
    </div>
  );
}