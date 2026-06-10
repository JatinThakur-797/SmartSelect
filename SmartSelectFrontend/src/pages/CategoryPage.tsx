import { Battery, Camera, ChevronRight, Cpu, Monitor, Smartphone, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'laptop',
    label: 'Laptop',
    icon: <Cpu className="w-12 h-12" />,
    color: 'emerald',
    tagline: 'Work, Study, Game, Create',
    desc: 'Find the perfect laptop based on your profession, usage, and budget. We match processors, RAM, and storage to your actual needs.',
    examples: [
      { icon: <Monitor className="w-4 h-4" />, text: 'Office & Work' },
      { icon: <Zap className="w-4 h-4" />, text: 'Gaming' },
      { icon: <Cpu className="w-4 h-4" />, text: 'Coding & Dev' },
      { icon: <Camera className="w-4 h-4" />, text: 'Video Editing' },
    ],
    priceRange: '₹20,000 – ₹2,00,000',
  },
  {
    id: 'smartphone',
    label: 'Smartphone',
    icon: <Smartphone className="w-12 h-12" />,
    color: 'teal',
    tagline: 'Camera, Battery, Performance, 5G',
    desc: 'Get recommended phones that match your shooting style, battery needs, and budget—without drowning in specs.',
    examples: [
      { icon: <Camera className="w-4 h-4" />, text: 'Best Camera' },
      { icon: <Battery className="w-4 h-4" />, text: 'Long Battery' },
      { icon: <Zap className="w-4 h-4" />, text: '5G Ready' },
      { icon: <Monitor className="w-4 h-4" />, text: 'Content Creation' },
    ],
    priceRange: '₹8,000 – ₹1,50,000',
  },
];

export default function CategoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 py-16 px-4 page-enter">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700
                          rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" /> AI Recommendations
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            What are you buying?
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            Choose a category and we'll ask a few smart questions to find your perfect match.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/recommend/${cat.id}`}
              className={`
                group card p-8 flex flex-col gap-5 hover:-translate-y-2
                hover:border-${cat.color}-300 hover:shadow-${cat.color}-100
                transition-all duration-300 cursor-pointer
              `}
            >
              {/* Icon */}
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center
                bg-${cat.color}-50 text-${cat.color}-600
                group-hover:bg-${cat.color}-100
                border border-${cat.color}-200
                transition-colors
              `}>
                {cat.icon}
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cat.label}</h2>
                <p className="text-sm font-medium text-gray-400 mt-0.5">{cat.tagline}</p>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-sm">{cat.desc}</p>

              {/* Use cases */}
              <div className="grid grid-cols-2 gap-2">
                {cat.examples.map(ex => (
                  <div key={ex.text}
                       className={`flex items-center gap-2 text-sm text-${cat.color}-700
                                  bg-${cat.color}-50 rounded-lg px-3 py-2`}>
                    {ex.icon}
                    <span className="font-medium">{ex.text}</span>
                  </div>
                ))}
              </div>

              {/* Price range + CTA */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-400">
                  Budget range: <strong className="text-gray-700">{cat.priceRange}</strong>
                </span>
                <div className={`
                  flex items-center gap-1 text-${cat.color}-600 font-bold text-sm
                  group-hover:gap-2 transition-all
                `}>
                  Get Recommendations
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Takes less than 60 seconds • No account required for browsing
        </p>
      </div>
    </div>
  );
}