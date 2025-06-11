import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider';
import {
  SmilePlus,
  Calendar,
  Clock,
  User,
  Lock,
  Mail,
  Building2,
  Stethoscope,
  CheckCircle,
  Search,
  ArrowRight,
  Menu,
  X,
  Shield,
  Brain,
  ClipboardList,
  VideoIcon,
  FileText
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Brain,
      color: "#4A90E2",
      title: "AI-Powered Analysis",
      description: "Advanced skin condition detection with machine learning"
    },
    {
      icon: Stethoscope,
      color: "#50C878",
      title: "Expert Dermatologists",
      description: "Connect with certified skin specialists for personalized care"
    },
    {
      icon: Calendar,
      color: "#FF6B6B",
      title: "Smart Scheduling",
      description: "Book and manage appointments with real-time availability"
    },
    {
      icon: FileText,
      color: "#FFB347",
      title: "Digital Records",
      description: "Secure storage and easy access to your medical history"
    },
    {
      icon: VideoIcon,
      color: "#9B59B6",
      title: "Virtual Care",
      description: "Get expert medical advice from the comfort of your home"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Search,
      title: "Smart Doctor Search",
      description: "Find the right specialist near you with advanced search filters"
    },
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Book appointments instantly with real-time availability"
    },
    {
      icon: Clock,
      title: "Queue Management",
      description: "Save time with our digital queuing system"
    },
    {
      icon: Shield,
      title: "Secure Health Records",
      description: "Your medical data is protected with top-tier encryption"
    }
  ];

  const services = [
    {
      title: "Virtual Consultations",
      description: "Connect with doctors from the comfort of your home",
      icon: Building2
    },
    {
      title: "Specialist Care",
      description: "Access to a wide network of medical specialists",
      icon: Stethoscope
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock medical assistance when you need it",
      icon: CheckCircle
    }
  ];

  const testimonials = [
    {
      quote: "SkinSight has revolutionized how I manage my appointments. No more waiting in long queues!",
      author: "Rahul Sharma",
      role: "Patient"
    },
    {
      quote: "As a doctor, this platform helps me serve my patients more efficiently.",
      author: "Dr. Priya Patel",
      role: "Dermatologist"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-white border-b border-[#A6DCEF]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[#2C3E50]">
                <SmilePlus className="w-6 h-6 text-[#A6DCEF]" />
              </div>
              <span className="text-2xl font-bold text-[#2C3E50]">
                SkinSight
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors">Features</a>
              <a href="#services" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors">Services</a>
              <a href="#testimonials" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors">Testimonials</a>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-[#2C3E50] hover:text-[#A6DCEF] transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-[#2C3E50] text-white rounded-xl hover:bg-[#A6DCEF] hover:text-[#2C3E50] transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#A6DCEF]/10 text-[#2C3E50]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors px-2">Features</a>
                <a href="#services" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors px-2">Services</a>
                <a href="#testimonials" className="text-[#2C3E50] hover:text-[#A6DCEF] transition-colors px-2">Testimonials</a>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="block w-full text-left px-2 py-2 text-[#2C3E50] hover:text-[#A6DCEF] transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="block w-full px-2 py-2 bg-[#2C3E50] text-white rounded-lg hover:bg-[#A6DCEF] hover:text-[#2C3E50] transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-[#2C3E50] leading-tight">
                Your Health Journey <br />
                Made <span className="text-[#A6DCEF]">Simple</span>
              </h1>
              <p className="text-xl text-[#2C3E50]/80 leading-relaxed">
                Experience seamless healthcare access with instant appointments, 
                reduced wait times, and personalized care - all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#2C3E50] text-white rounded-xl hover:bg-[#A6DCEF] hover:text-[#2C3E50] transition-all group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#A6DCEF] text-[#2C3E50] rounded-xl hover:border-[#2C3E50] transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
            <ImageSlider
              slides={slides}
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#A6DCEF]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C3E50] mb-4">
              Why Choose SkinSight?
            </h2>
            <p className="text-xl text-[#2C3E50]/70 max-w-3xl mx-auto">
              Experience healthcare like never before with our innovative features
              designed for modern patients and healthcare providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl border-2 border-[#A6DCEF] hover:border-[#2C3E50] transition-all group"
              >
                <div className="w-14 h-14 bg-[#2C3E50] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#A6DCEF] transition-colors">
                  <feature.icon className="w-7 h-7 text-white group-hover:text-[#2C3E50]" />
                </div>
                <h3 className="text-xl font-bold text-[#2C3E50] mb-3">{feature.title}</h3>
                <p className="text-[#2C3E50]/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C3E50] mb-4">
              Our Services
            </h2>
            <p className="text-xl text-[#2C3E50]/70 max-w-3xl mx-auto">
              Comprehensive healthcare solutions designed around your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-2xl border-2 border-[#A6DCEF] hover:border-[#2C3E50] transition-all group"
              >
                <div className="w-16 h-16 bg-[#2C3E50] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#A6DCEF] transition-colors">
                  <service.icon className="w-8 h-8 text-white group-hover:text-[#2C3E50]" />
                </div>
                <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">{service.title}</h3>
                <p className="text-[#2C3E50]/70 text-lg">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-[#A6DCEF]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C3E50] mb-4">
              What People Say
            </h2>
            <p className="text-xl text-[#2C3E50]/70 max-w-3xl mx-auto">
              Hear from our satisfied users about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-2xl border-2 border-[#A6DCEF] hover:border-[#2C3E50] transition-all"
              >
                <p className="text-[#2C3E50] text-lg mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-bold text-[#2C3E50]">{testimonial.author}</p>
                  <p className="text-[#2C3E50]/70">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2C3E50] mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-[#2C3E50]/70 mb-8">
            Join thousands of satisfied users who have made SkinSight their preferred healthcare platform
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#2C3E50] text-white rounded-xl hover:bg-[#A6DCEF] hover:text-[#2C3E50] transition-all group text-lg font-medium"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C3E50] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-[#A6DCEF]">
                <SmilePlus className="w-6 h-6 text-[#2C3E50]" />
              </div>
              <span className="text-2xl font-bold">SkinSight</span>
            </div>
            <p className="text-[#A6DCEF]">
              Making healthcare accessible and efficient for everyone.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="#features" className="block text-[#A6DCEF] hover:text-white transition-colors">Features</a>
              <a href="#services" className="block text-[#A6DCEF] hover:text-white transition-colors">Services</a>
              <a href="#testimonials" className="block text-[#A6DCEF] hover:text-white transition-colors">Testimonials</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <div className="space-y-2">
              <a href="#" className="block text-[#A6DCEF] hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-[#A6DCEF] hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-[#A6DCEF] hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <div className="space-y-2">
              <p className="text-[#A6DCEF]">support@skinsight.com</p>
              <p className="text-[#A6DCEF]">+91 123 456 7890</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#A6DCEF]/20">
          <p className="text-center text-[#A6DCEF]">
            © 2025 SkinSight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;