"use client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import UpcomingQuizzes from "@/components/UpcomingQuizzes";
import Footer from "@/components/Footer";
import BlinkShare from "@/components/BlinkShare";

export default function Home() {
  return (
    <main className="w-full relative flex flex-col min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar />

      <div className="flex-grow">
        <HeroSection />

        {/* Cyberpunk Divider */}
        <div className="w-full flex items-center justify-center py-8">
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-r from-transparent to-black/10 dark:to-[#FCFF52]/20" />
          <div className="w-2 h-2 rotate-45 border border-black/10 dark:border-[#FCFF52]/30 mx-4" />
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-l from-transparent to-black/10 dark:to-[#FCFF52]/20" />
        </div>

        <HowItWorks />

        <div className="w-full flex items-center justify-center py-8">
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-r from-transparent to-[#35D07F]/15 dark:to-[#35D07F]/20" />
          <div className="w-2 h-2 rotate-45 border border-[#35D07F]/20 dark:border-[#35D07F]/30 mx-4" />
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-l from-transparent to-[#35D07F]/15 dark:to-[#35D07F]/20" />
        </div>

        <UpcomingQuizzes />
        
        {/* Blink Section */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-black dark:text-white">
           <BlinkShare />
        </section>

        <div className="w-full flex items-center justify-center py-8">
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-r from-transparent to-black/10 dark:to-[#FCFF52]/20" />
          <div className="w-2 h-2 rotate-45 border border-black/10 dark:border-[#FCFF52]/30 mx-4" />
          <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-l from-transparent to-black/10 dark:to-[#FCFF52]/20" />
        </div>
        
        <Leaderboard />
      </div>

      <Footer />
    </main>
  );
}
