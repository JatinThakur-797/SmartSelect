import {
  ArrowRight,
  ChevronRight,
  Cpu,
  IndianRupee,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Gemini AI Powered',
    desc: 'Google\'s Gemini 1.5 Flash analyzes your needs and suggests the perfect match.',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    icon: <IndianRupee className="w-6 h-6" />,
    title: 'Live Amazon Prices',
    desc: 'Real-time prices and availability from Amazon India—always up-to-date.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Results in Seconds',
    desc: 'Smart caching delivers instant recommendations. Fresh data every 24 hours.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Unbiased & Honest',
    desc: 'No affiliate bias. Recommendations purely based on your stated needs.',
    color: 'bg-blue-100 text-blue-700',
  },
];

const TESTIMONIALS = [
  { name: 'Rahul M.', role: 'CS Student', text: 'Found the perfect laptop within my ₹45k budget. The AI actually understood I need it for coding!', rating: 5 },
  { name: 'Priya K.', role: 'Content Creator', text: 'Stopped me from overspending on specs I didn\'t need. Got a phone perfect for reels.', rating: 5 },
  { name: 'Arjun S.', role: 'Working Professional', text: 'Compared 5 options with clear reasons. Bought within 10 minutes of getting results.', rating: 5 },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const cta = isAuthenticated ? '/category' : '/register';

  return (
    <div className="page-enter">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[600px] h-[600px] bg-emerald-700/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                            border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Powered by Google Gemini AI + Live Amazon Data</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
              Buy Smarter,
              <br />
              <span className="text-emerald-300">Not Harder</span>
            </h1>

            <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed mb-10">
              Tell us your budget, profession, and needs.
              Our AI finds the perfect laptop or smartphone for <em>you</em>—
              no confusing spec sheets, no overwhelm.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={cta}
                className="inline-flex items-center justify-center gap-2
                           bg-white text-emerald-700 hover:bg-emerald-50
                           font-bold text-lg px-8 py-4 rounded-2xl
                           shadow-xl hover:shadow-2xl transition-all duration-200"
              >
                Get Smart Recommendations
                <ArrowRight className="w-5 h-5" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2
                             bg-white/10 hover:bg-white/20 border border-white/30
                             text-white font-semibold text-lg px-8 py-4 rounded-2xl
                             transition-all duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
              {['Free to use', 'No hidden fees', 'India prices', 'Updated daily'].map(b => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY CARDS ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">What are you looking for?</h2>
            <p className="text-gray-500 text-lg">Select a category to get personalised AI recommendations</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Laptop Card */}
            <Link
              to={isAuthenticated ? '/recommend/laptop' : '/register'}
              className="group card p-8 flex flex-col items-center text-center
                         hover:border-emerald-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-20 h-20 bg-emerald-50 group-hover:bg-emerald-100
                              rounded-2xl flex items-center justify-center mb-5
                              transition-colors border border-emerald-200">
                <Cpu className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Laptops</h3>
              <p className="text-gray-500 mb-4">
                From budget ultrabooks to gaming beasts and creator workstations
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Gaming', 'Work', 'Study', 'Creative'].map(t => (
                  <span key={t} className="badge bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-emerald-600 font-semibold
                              group-hover:gap-3 transition-all">
                Find My Laptop <ChevronRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Smartphone Card */}
            <Link
              to={isAuthenticated ? '/recommend/smartphone' : '/register'}
              className="group card p-8 flex flex-col items-center text-center
                         hover:border-teal-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-20 h-20 bg-teal-50 group-hover:bg-teal-100
                              rounded-2xl flex items-center justify-center mb-5
                              transition-colors border border-teal-200">
                <Smartphone className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Smartphones</h3>
              <p className="text-gray-500 mb-4">
                Camera powerhouses, battery champions, and 5G flagships
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Camera', 'Battery', '5G', 'Performance'].map(t => (
                  <span key={t} className="badge bg-teal-50 text-teal-700 border border-teal-100">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-teal-600 font-semibold
                              group-hover:gap-3 transition-all">
                Find My Phone <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">How SmartBuy AI Works</h2>
            <p className="text-gray-500 text-lg">Get expert recommendations in under 10 seconds</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Tell Us Your Needs', desc: 'Set your budget, profession, and what you\'ll use the device for.' },
              { step: '02', title: 'AI Analyses', desc: 'Gemini AI picks the best 5 products for your exact use case and budget.' },
              { step: '03', title: 'Get Real Prices', desc: 'Live Amazon India prices, images, and buy links—all in one place.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl
                                flex items-center justify-center text-xl font-black
                                mx-auto mb-4 shadow-lg shadow-emerald-200">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">Why SmartBuy AI?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className="card p-6 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Loved by Smart Shoppers</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <div key={name} className="card p-6">
                <div className="flex mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-gray-400 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-hero-gradient py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <TrendingUp className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to buy smarter?
          </h2>
          <p className="text-emerald-200 mb-8">
            Join thousands of Indians who stopped guessing and started buying smart.
          </p>
          <Link
            to={cta}
            className="inline-flex items-center gap-2 bg-white text-emerald-700
                       hover:bg-emerald-50 font-bold px-8 py-4 rounded-2xl
                       shadow-xl hover:shadow-2xl transition-all"
          >
            Start For Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2024 SmartBuy AI. Prices sourced from Amazon India. Not an affiliate platform.</p>
      </footer>
    </div>
  );
}