import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  Smartphone, 
  Heart, 
  Zap, 
  Star,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Activity
} from 'lucide-react';

const SkinSightFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Smart Hospital Discovery",
      description: "AI-powered geolocation finds the best healthcare facilities near you",
      gradient: "from-blue-500 to-cyan-500",
      stats: "10K+ Hospitals"
    },
    {
      icon: Calendar,
      title: "Seamless Booking",
      description: "Book appointments instantly with real-time availability",
      gradient: "from-purple-500 to-pink-500",
      stats: "98% Success Rate"
    },
    {
      icon: Clock,
      title: "Live Queue Management",
      description: "Track your position in real-time, no more waiting rooms",
      gradient: "from-green-500 to-emerald-500",
      stats: "50% Less Wait Time"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption protects your sensitive health data",
      gradient: "from-red-500 to-orange-500",
      stats: "100% Secure"
    }
  ];

  const benefits = [
    "Find nearby hospitals instantly",
    "Book appointments in seconds",
    "Track queue positions live",
    "Manage healthcare digitally",
    "Connect with specialists",
    "Access medical history"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Revolutionary Healthcare Platform</span>
            </div>
            
            <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              SkinSight
            </h1>
            
            <p className="text-2xl md:text-3xl font-light mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Bridging the gap between patients and healthcare providers with 
              <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-medium"> next-generation technology</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Now
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              <button className="group flex items-center gap-3 px-8 py-4 border border-white/20 rounded-2xl font-medium text-lg hover:bg-white/5 transition-all duration-300">
                <PlayCircle className="w-6 h-6 text-blue-400" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {[
                { number: "50K+", label: "Active Users" },
                { number: "10K+", label: "Hospitals" },
                { number: "98%", label: "Satisfaction" },
                { number: "24/7", label: "Support" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Grid */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience healthcare management like never before with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  data-animate
                  id={`feature-${index}`}
                  className={`group relative p-8 rounded-3xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-500 cursor-pointer transform hover:scale-105 ${
                    isVisible[`feature-${index}`] ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                  
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${feature.gradient} text-white`}>
                    {feature.stats}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Showcase */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8 text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                Everything You Need for Modern Healthcare
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Transform your healthcare experience with intelligent features designed for the digital age.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-medium group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Live Dashboard</h3>
                    <p className="text-gray-400">Real-time healthcare insights</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span>Queue Position</span>
                    <span className="text-green-400 font-bold">#3</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span>Est. Wait Time</span>
                    <span className="text-blue-400 font-bold">12 mins</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span>Next Appointment</span>
                    <span className="text-purple-400 font-bold">Today 3PM</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text">
              Ready to Transform Healthcare?
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of patients and healthcare providers who are already experiencing the future of medical care.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start Your Journey
                  <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              <button className="px-10 py-5 border-2 border-white/20 rounded-2xl font-bold text-xl hover:bg-white/5 transition-all duration-300 hover:border-white/40">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SkinSightFeatures;