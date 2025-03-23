"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Microscope, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SplineBackground = () => {
  const [splineReady, setSplineReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplineReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!splineReady) return null;

  return (
    <iframe 
      src='https://my.spline.design/cloneronhoverlightning-0f0cfe84905196cd8bccbd05ba5751bb/' 
      frameBorder='0'
      title="Spline 3D background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'auto'
      }}
      allow="autoplay; fullscreen; vr; accelerometer; magnetometer; gyroscope; xr-spatial-tracking; camera"
      allowFullScreen
    />
  );
};

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-black/30 rounded-xl p-5 border border-gray-500/20 hover:border-emerald-500/30 transition-all shadow-lg"
  >
    <div className="rounded-full bg-emerald-900/30 w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-medium text-emerald-50 mb-2">{title}</h3>
    <p className="text-emerald-100/70 text-sm">{description}</p>
  </motion.div>
);

// Stat card component
interface StatCardProps {
  value: string | number;
  label: string;
  delay: number;
}

const StatCard = ({ value, label, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-black/20 rounded-xl p-4 border border-gray-500/20 shadow-lg text-center"
  >
    <motion.p 
      className="text-4xl font-bold text-emerald-400"
      animate={{ 
        scale: [1, 1.05, 1] 
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity,
        repeatType: "reverse" 
      }}
    >
      {value}
    </motion.p>
    <p className="text-emerald-100/70 text-sm mt-1">{label}</p>
  </motion.div>
);

export default function Home() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <SplineBackground />
      
      {/* Company logo */}
      <div className="absolute top-6 left-6 z-20 pointer-events-auto">
        <a href="https://isd.ai" target="_blank" rel="noopener noreferrer">
          <motion.img 
            src="/company-logo.png"  // Replace with your actual logo path
            alt="Company Logo"
            className="h-10 w-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        </a>
      </div>
      
      {/* Semi-transparent backdrop for better readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none z-[1]"></div>
      
      <div className="absolute inset-0 flex flex-col items-center z-10 pointer-events-none overflow-y-auto">
        <div className="max-w-6xl w-full px-4 py-16 space-y-16">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center space-y-6 mt-8"
          >
            <motion.h1 
              className="text-6xl md:text-7xl font-bold"
              style={{ 
                color: 'rgba(220, 252, 231, 0.9)',
                textShadow: '0 0 10px rgba(16, 185, 129, 0.6), 0 0 30px rgba(5, 150, 105, 0.4)',
                letterSpacing: '0.02em',
                fontWeight: '200'
              }}
              whileHover={{
                textShadow: '0 0 15px rgba(16, 185, 129, 0.8), 0 0 40px rgba(5, 150, 105, 0.6)',
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              PestID Analytics Dashboard
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl"
              style={{ 
                color: 'rgba(209, 250, 229, 0.8)',
                textShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                fontWeight: '200',
                letterSpacing: '0.05em',
                maxWidth: '36rem',
                margin: '0 auto'
              }}
            >
              Internal pest identification and analysis system for field agents and client reporting
            </motion.p>
            
            {/* User Authentication Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="mt-8 pointer-events-auto"
            >
              <Link href="/dashboard" passHref>
                <motion.button
                  suppressHydrationWarning
                  className="px-8 py-3 rounded-full bg-emerald-600/80 text-white hover:bg-emerald-500 border border-emerald-400/30 transition-all duration-300 mr-4"
                  style={{
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center space-x-2" suppressHydrationWarning>
                    <span>Internal Login</span>
                    <ArrowRight size={16} />
                  </span>
                </motion.button>
              </Link>
              
              <Link href="" passHref>
                <motion.button
                  suppressHydrationWarning
                  className="px-8 py-3 rounded-full bg-transparent text-emerald-200 hover:text-white border border-emerald-400/30 transition-all duration-300"
                  style={{
                    backdropFilter: 'blur(4px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center space-x-2" suppressHydrationWarning>
                    <span>Client Portal</span>
                    <ArrowRight size={16} />
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Feature Cards */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pointer-events-auto"
          >
            <FeatureCard 
              icon={<Microscope className="w-6 h-6 text-emerald-400" />}
              title="Species Identification"
              description="Access our comprehensive pest database with taxonomic information, threat levels, and treatment protocols"
              delay={0.6}
            />
            <FeatureCard 
              icon={<MapPin className="w-6 h-6 text-emerald-400" />}
              title="Distribution Mapping"
              description="View real-time outbreak data, filter by region, species, or date range, and export reports"
              delay={0.7}
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-emerald-400" />}
              title="Trend Analysis"
              description="Monitor population trends, set custom alerts, and generate forecasting models for client areas"
              delay={0.8}
            />
          </motion.div>
          
          {/* System Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pointer-events-auto"
          > 
            <StatCard value="70+" label="Species Trained with AI" delay={1.4} />
            <StatCard value="100+" label="User Observation" delay={1.3} />
            <StatCard value="8" label="Australian States Covered" delay={1.1} />
            <StatCard value="24/7" label="System Support" delay={1.2} />
            
          </motion.div>
          
          {/* Support Information */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="relative mt-8 text-center pointer-events-auto border-t border-emerald-800/30 pt-4 pb-6"
          >
            <p className="text-emerald-200/70 text-sm">
              Need assistance? Contact our support team:
            </p>
            <p className="text-emerald-300 mt-1">
              support@isd.ai
            </p>
            <p className="text-emerald-100/50 text-sm mt-1">
              2021 Intelligent System Design. All rights reserved.
            </p>
            <p className="absolute bottom-2 right-4 text-xs text-emerald-100/30">
              v1.0.0
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}