import { ArrowLeft, Clock, LayoutDashboard, RefreshCw, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { RecommendationRequest } from '../types/RecommendationRequest';
import { RecommendationResponse } from '../types/RecommendationResponse';


export default function ResultsPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  const result  = location.state?.result  as RecommendationResponse | undefined;
  const request = location.state?.request as RecommendationRequest  | undefined;

  // Guard: if navigated here directly without state
  if (!result || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>No recommendation data found.</p>
        <Link to="/category" className="btn-primary text-sm">
          Start a new search
        </Link>
      </div>
    );
  }

  const categoryLabel = request.category === 'laptop' ? 'Laptops' : 'Smartphones';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 page-enter">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500
                       hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Adjust filters
          </button>

          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/recommend/${request.category}`}
              state={{ prefill: request }}
              className="flex items-center gap-1.5 text-sm btn-secondary py-2 px-4"
            >
              <RefreshCw className="w-4 h-4" /> New Search
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm btn-secondary py-2 px-4"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>

        {/* ── Page title ───────────────────────────────────────────────── */}
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Top {result.products.length} {categoryLabel} For You
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Based on your budget of{' '}
            <strong className="text-emerald-700">
              ₹{result.budget?.toLocaleString('en-IN')}
            </strong>{' '}
            · Profession: <strong>{result.profession}</strong>
          </p>
        </div>

        {/* ── Cache badge ───────────────────────────────────────────────── */}
        {result.servedFromCache ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                          text-emerald-700 rounded-xl px-4 py-2.5 text-sm mb-6">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div>
              <span className="font-semibold">Instant results</span>
              {' — '}
              These recommendations were cached{' '}
              <strong>{result.cacheAgeLabel}</strong> and are shared with other
              users with similar needs.
              {' '}
              <span className="text-emerald-600 opacity-70 text-xs">
                Refreshed every 24 hours to keep prices current.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200
                          text-violet-700 rounded-xl px-4 py-2.5 text-sm mb-6">
            <Zap className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <span>
              <strong>Fresh results</strong>
              {' — '}
              Generated live by Gemini AI with real-time Amazon prices for your query.
            </span>
          </div>
        )}

        {/* ── Product Cards ─────────────────────────────────────────────── */}
        {result.products.length > 0 ? (
          <div className="space-y-5">
            {result.products.map((product, idx) => (
              <ProductCard key={product.asin || idx} product={product} rank={idx + 1} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No products found</p>
            <p className="text-sm">Try adjusting your budget or requirements.</p>
          </div>
        )}

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <div className="mt-10 text-center text-xs text-gray-400 space-y-1">
          <p>Prices sourced live from Amazon India. Click any card to see the current price.</p>
          <p>This search has been saved to your{' '}
            <Link to="/dashboard" className="text-emerald-500 hover:underline">dashboard history</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}