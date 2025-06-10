import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  Search, 
  Phone, 
  Mail, 
  Shield, 
  Zap,
  ChevronRight,
  Activity,
  Stethoscope,
  Building2,
  UserCheck,
  TrendingUp,
  Award,
  Menu,
  X,
  Play,
  ArrowRight,
  CheckCircle,
  Globe,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyCareBridgeLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navigate,setisnavigate]=useState();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient'
  });

  const heroSlides = [
    {
      title: "Find Doctors",
      subtitle: "Connect with 1000+ verified doctors",
      image: "👩‍⚕️",
      color: "from-blue-600 to-purple-600"
    },
    {
      title: "Book Instantly",
      subtitle: "Skip the queues, book appointments online",
      image: "📅",
      color: "from-emerald-600 to-teal-600"
    },
    {
      title: "Real-time Updates",
      subtitle: "Track your queue position live",
      image: "⏱️",
      color: "from-orange-600 to-red-600"
    }
  ];

  const features = [
    {
      icon: MapPin,
      title: "Find Nearby Hospitals",
      description: "Locate healthcare facilities near you with real-time availability",
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Book appointments that fit your schedule with AI-powered suggestions",
      color: "from-emerald-500 to-teal-400"
    },
    {
      icon: Clock,
      title: "Queue Management",
      description: "Join virtual queues and get notified when it's your turn",
      color: "from-purple-500 to-pink-400"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is encrypted and completely secure",
      color: "from-orange-500 to-red-400"
    }
  ];

  const stats = [
    { number: "250K+", label: "Happy Patients", icon: Users },
    { number: "5,000+", label: "Verified Doctors", icon: Stethoscope },
    { number: "500+", label: "Partner Hospitals", icon: Building2 },
    { number: "99.9%", label: "Uptime", icon: TrendingUp }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const AuthModal = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in duration-300">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {type === 'signup' ? 'Join SkinSight' : 'Welcome Back'}
            </h2>
            <p className="text-gray-300">
              {type === 'signup' ? 'Create your account to get started' : 'Sign in to your account'}
            </p>
          </div>

          <form className="space-y-4">
            {type === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">I am a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['patient', 'doctor', 'hospital'].map((userType) => (
                      <button
                        key={userType}
                        type="button"
                        onClick={() => setFormData({...formData, userType})}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          formData.userType === userType
                            ? 'bg-cyan-500 text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {userType.charAt(0).toUpperCase() + userType.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {type === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg"
            >
              {type === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {type === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => {
                  onClose();
                  type === 'signup' ? setIsSignInOpen(true) : setIsSignUpOpen(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 ml-2 font-medium"
              >
                {type === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                SkinSight
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'Features', 'About', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setIsSignInOpen(true)}
                className="px-6 py-2 text-white hover:text-cyan-300 transition-colors duration-200 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUpOpen(true)}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg font-medium"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <div className="flex flex-col space-y-4">
                {['Home', 'Features', 'About', 'Contact'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/20">
                  <button
                    onClick={() => {navigate('/signin') }}/*  setIsSignInOpen(true); setIsMenuOpen(false);  */
                    className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setIsSignUpOpen(true); setIsMenuOpen(false); }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
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
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    Healthcare
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Made Simple
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Connect with doctors, book appointments, and manage your health journey with India's most trusted healthcare platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-xl font-semibold text-lg flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all transform hover:scale-105 font-semibold text-lg flex items-center justify-center">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold">
                      {i === 1 ? '👨‍⚕️' : i === 2 ? '👩‍⚕️' : i === 3 ? '👨‍💼' : '👩‍💼'}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white font-semibold">Trusted by 250K+ patients</p>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-gray-300 ml-2">4.9/5 rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Carousel */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden">
                {heroSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 transform ${
                      index === currentSlide ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                    }`}
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${slide.color} rounded-3xl flex flex-col items-center justify-center text-center p-8 shadow-2xl`}>
                      <div className="text-8xl mb-6">{slide.image}</div>
                      <h3 className="text-3xl font-bold text-white mb-2">{slide.title}</h3>
                      <p className="text-white/80 text-lg">{slide.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6 space-x-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-cyan-400 w-8' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300"
              >
                <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition-all">
                  <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-4 group-hover:animate-bounce" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                Why Choose
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                SkinSight?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience healthcare like never before with our cutting-edge platform designed for modern patients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl border border-cyan-500/30 shadow-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who have already simplified their healthcare journey with MyCareBridge.
            </p>
            <button
              onClick={() => setIsSignUpOpen(true)}
              className="group px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-xl font-semibold text-xl flex items-center justify-center mx-auto"
            >
              Start Your Journey Today
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              SkinSight
            </span>
          </div>
          <p className="text-gray-400 mb-6">
            Bridging the gap between patients and healthcare providers across India.
          </p>
          <div className="flex justify-center space-x-8 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <p className="text-gray-500 mt-8">© 2025 MyCareBridge. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthModal 
        isOpen={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)} 
        type="signup"
      />
      <AuthModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
        type="signin"
      />
    </div>
  );
};

export default MyCareBridgeLanding;