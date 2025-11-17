import { useNavigate } from "@tanstack/react-router";
import { 
  Sparkles, 
  BookMarked, 
  TrendingUp, 
  Zap, 
  Shield, 
  Smartphone,
  ArrowRight,
  Check
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CurioFeed
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: "/sign-in" })}
                className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-8">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">AI-Powered Content Discovery</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Personalized Content
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Feed Experience
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover content that matters to you. CurioFeed learns from your interests 
            and delivers a curated feed of articles, news, and stories you'll love.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate({ to: "/signup" })}
              className="group bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Start Reading for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-colors font-semibold text-lg text-gray-700 hover:bg-gray-50"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Articles Curated</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">AI-Powered</div>
              <div className="text-gray-600">Smart Recommendations</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600">Personalized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Reading
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to enhance your content discovery experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Curation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our intelligent algorithm learns from your reading habits and delivers 
                content that matches your unique interests.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-purple-50">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Save & Organize
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Bookmark articles you love and organize them for later. Never lose 
                track of great content again.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-green-50">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Engagement
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your reading patterns and get insights into your interests. 
                Discover new topics based on what you enjoy.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-orange-50">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Updates
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get fresh content as it's published. Stay up-to-date with the topics 
                that matter most to you.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-pink-50">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Privacy First
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your data belongs to you. We use secure authentication and never 
                share your reading habits.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-cyan-50">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Responsive Design
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Enjoy a seamless reading experience across all your devices. 
                Desktop, tablet, or mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to personalized content discovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign Up Free</h3>
              <p className="text-gray-600">
                Create your account in seconds with secure authentication
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Interests</h3>
              <p className="text-gray-600">
                Select topics you care about and we'll customize your feed
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Reading</h3>
              <p className="text-gray-600">
                Enjoy personalized content tailored just for you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Personalized feed</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Save up to 50 articles</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Basic recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Mobile responsive</span>
                </li>
              </ul>
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="w-full py-3 px-6 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-semibold text-gray-900"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-600 rounded-2xl p-8 relative bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$20</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">Unlimited saved articles</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">Advanced AI recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">Engagement analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Reading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of readers discovering content they love
          </p>
          <button
            onClick={() => navigate({ to: "/signup" })}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg inline-flex items-center gap-2"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">CurioFeed</span>
              </div>
              <p className="text-gray-400">
                Your personalized content discovery platform powered by AI.
                Discover, save, and enjoy content that matters to you.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CurioFeed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
