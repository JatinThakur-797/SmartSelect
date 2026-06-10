import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  Calendar,
  ChevronRight,
  Clock,
  Cpu,
  IndianRupee,
  LayoutDashboard,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react';
import { recommendApi } from '../auth/recommendApi ';
import LoadingSpinner from '../components/LoadingSpinner';
import { HistoryItem } from '../types/HistoryItem';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    recommendApi.getHistory()
      .then(setHistory)
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 page-enter">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-500">Your account and recommendation history</p>
          </div>
        </div>

        {/* ── Profile Card ─────────────────────────────────────────────── */}
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500
                            rounded-2xl flex items-center justify-center shadow-md">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {memberSince}
              </div>
            </div>
            <Link to="/category" className="btn-primary text-sm py-2.5 px-4 hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> New Search
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{history.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Recommendations saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-teal-600">
                {history.reduce((acc, h) => acc + (h.products?.length || 0), 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Products reviewed</p>
            </div>
          </div>
        </div>

        {/* ── Recommendation History ────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Recommendations</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            Last 3 saved
          </span>
        </div>

        {loading && (
          <div className="card p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading history..." />
          </div>
        )}

        {error && (
          <div className="card p-6 text-center text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="card p-12 text-center">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500 mb-1">No recommendations yet</p>
            <p className="text-sm text-gray-400 mb-5">
              Start your first AI-powered product search
            </p>
            <Link to="/category" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" /> Get Recommendations
            </Link>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-5">
            {history.map(item => (
              <HistoryCard key={item.id} item={item} onRerun={() =>
                navigate(`/recommend/${item.category}`)
              } />
            ))}
          </div>
        )}

        {/* Mobile new search button */}
        <div className="mt-8 sm:hidden">
          <Link to="/category" className="btn-primary w-full flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> New Search
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── History Card ──────────────────────────────────────────────────────────────

function HistoryCard({ item, onRerun }: { item: HistoryItem; onRerun: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLaptop = item.category === 'laptop';
  const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer
                   hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            ${isLaptop ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'}`}>
            {isLaptop ? <Cpu className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 capitalize">{item.category}</span>
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100">
                <IndianRupee className="w-3 h-3" />
                {item.budget?.toLocaleString('en-IN')}
              </span>
              <span className="badge bg-gray-100 text-gray-600">{item.profession}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Clock className="w-3 h-3" /> {date}
            </div>
          </div>
        </div>

        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0
          ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded products */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-3">
          <p className="text-xs text-gray-500 font-medium mb-3">
            Usage: <span className="text-gray-700">{item.usage}</span>
          </p>
          {item.products?.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl
                                   p-3 border border-gray-100 shadow-sm">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name}
                     className="w-12 h-12 object-contain flex-shrink-0 rounded-lg bg-gray-50 p-1"
                     onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.name}</p>
                <p className="text-emerald-600 font-bold text-sm">{p.price}</p>
              </div>
              {p.amazonUrl && (
                <a href={p.amazonUrl} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-emerald-600 hover:underline flex-shrink-0 font-medium">
                  View ↗
                </a>
              )}
            </div>
          ))}

          <button onClick={onRerun}
            className="btn-secondary w-full text-sm mt-2 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Run Similar Search
          </button>
        </div>
      )}
    </div>
  );
}