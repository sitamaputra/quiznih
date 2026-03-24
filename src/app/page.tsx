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
    <main className="w-full relative flex flex-col min-h-screen transition-colors duration-300">
      <Navbar />

      <div className="flex-grow">
        <HeroSection />
        <HowItWorks />

        {/* Decorative Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent my-16"></div>

        <UpcomingQuizzes />
        
        {/* Blink Section */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-black dark:text-white">
           <BlinkShare />
        </section>

        {/* Decorative Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent my-16"></div>
        
        <Leaderboard />
      </div>

      <Footer />
    </main>
  );
}
