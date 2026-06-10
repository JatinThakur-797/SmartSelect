import { ChevronLeft, Cpu, IndianRupee, Send, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recommendApi } from '../auth/recommendApi ';
import LoadingSpinner from '../components/LoadingSpinner';
import { Category } from '../types/Category';
import { RecommendationRequest } from '../types/RecommendationRequest';


// ── Static options ─────────────────────────────────────────────────────────────

const PROFESSIONS = [
  'Student', 'Working Professional', 'Gamer', 'Content Creator',
  'Business Owner', 'Freelancer', 'Teacher / Educator', 'Other',
];

const USAGE_CHIPS = {
  laptop: [
    'Online classes & studying', 'Office work & Excel', 'Coding & programming',
    'Video editing & rendering', 'Gaming', 'Graphic design', 'Lightweight browsing',
    'Running multiple apps', 'Machine learning / AI',
  ],
  smartphone: [
    'Instagram & reels', 'YouTube & streaming', 'Photography & portraits',
    'Long battery life', 'Gaming', 'Business calls', 'Social media', 'Travel & maps',
  ],
};

const RAM_OPTIONS_LAPTOP     = ['Any', '4GB', '8GB', '16GB', '32GB+'];
const RAM_OPTIONS_PHONE      = ['Any', '4GB', '6GB', '8GB', '12GB+'];
const STORAGE_LAPTOP         = ['Any', '256GB SSD', '512GB SSD', '1TB SSD'];
const STORAGE_PHONE          = ['Any', '64GB', '128GB', '256GB', '512GB'];
const PROCESSOR_OPTIONS      = ['Any', 'Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M-series'];
const GRAPHICS_OPTIONS       = ['Any', 'Integrated (basic tasks)', 'Dedicated NVIDIA', 'Dedicated AMD', 'RTX 3060+'];
const DISPLAY_OPTIONS        = ['Any', '13 inch', '14 inch', '15.6 inch', '16+ inch'];
const CAMERA_OPTIONS         = ['Any', 'Basic (calls only)', 'Medium (daily photos)', 'High (photography)', 'Pro (videography)'];
const BATTERY_OPTIONS        = ['Any', '4000mAh+', '5000mAh+', '6000mAh+'];
const FGG_OPTIONS            = ['Doesn\'t matter', 'Yes — 5G only', 'No — 4G is fine'];
const BRANDS_LAPTOP          = ['Any', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI', 'Samsung'];
const BRANDS_PHONE           = ['Any', 'Samsung', 'Apple', 'OnePlus', 'Realme', 'Poco', 'iQOO', 'Vivo', 'Oppo', 'Motorola', 'Nothing'];

const formatBudget = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

type FormState = Omit<RecommendationRequest, 'category'>;

const INITIAL: FormState = {
  budget: 50000,
  profession: '',
  usage: '',
  brandPreference: 'Any',
  ram: 'Any',
  storage: 'Any',
  processor: 'Any',
  graphicsCard: 'Any',
  displaySize: 'Any',
  smartphoneRam: 'Any',
  smartphoneStorage: 'Any',
  cameraPriority: 'Any',
  battery: 'Any',
  fiveGPreference: "Doesn't matter",
};

const calculateMinBudget = (formState: FormState, isLaptop: boolean): number => {
  if (!isLaptop) {
    let min = 7000;
    if (formState.brandPreference === 'Apple') {
      min = Math.max(min, 45000);
    } else if (formState.brandPreference === 'OnePlus') {
      min = Math.max(min, 20000);
    } else if (formState.brandPreference === 'Samsung') {
      min = Math.max(min, 12000);
    }
    return min;
  } else {
    let min = 20000;
    if (formState.brandPreference === 'Apple' || formState.processor === 'Apple M-series') {
      min = Math.max(min, 70000);
    } else if (formState.brandPreference === 'Samsung') {
      min = Math.max(min, 45000);
    } else if (formState.brandPreference === 'MSI') {
      min = Math.max(min, 40000);
    } else if (formState.brandPreference === 'Dell') {
      min = Math.max(min, 32000);
    } else if (formState.brandPreference === 'HP') {
      min = Math.max(min, 28000);
    } else if (formState.brandPreference === 'Lenovo') {
      min = Math.max(min, 25000);
    } else if (formState.brandPreference === 'Asus') {
      min = Math.max(min, 24000);
    } else if (formState.brandPreference === 'Acer') {
      min = Math.max(min, 22000);
    }

    if (formState.ram === '32GB+') {
      min = Math.max(min, 80000);
    } else if (formState.ram === '16GB') {
      min = Math.max(min, 35000);
    }
    if (formState.graphicsCard === 'RTX 3060+') {
      min = Math.max(min, 70000);
    } else if (formState.graphicsCard === 'Dedicated NVIDIA' || formState.graphicsCard === 'Dedicated AMD') {
      min = Math.max(min, 50000);
    }
    if (formState.storage === '1TB SSD') {
      min = Math.max(min, 45000);
    }
    return min;
  }
};

export default function RecommendationFormPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const isLaptop = category === 'laptop';
  const maxBudget = isLaptop ? 200000 : 150000;
  const stepBudget = isLaptop ? 2000 : 1000;

  const [form, setForm]     = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Modal suggestion state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [suggestedMinBudget, setSuggestedMinBudget] = useState<number | null>(null);

  const minBudget = calculateMinBudget(form, isLaptop);

  useEffect(() => {
    // Reset budget to dynamic default when category changes
    const defaultVal = isLaptop ? 50000 : 20000;
    setForm(f => ({ ...f, budget: defaultVal }));
  }, [category, isLaptop]);

  useEffect(() => {
    // Keep budget above the dynamic minimum based on specifications
    if (form.budget < minBudget) {
      setForm(f => ({ ...f, budget: minBudget }));
    }
  }, [minBudget]);

  const set = (k: keyof FormState, v: any) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleUsageChip = (chip: string) => {
    const current = form.usage;
    if (current.includes(chip)) {
      set('usage', current.replace(chip, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim());
    } else {
      set('usage', current ? `${current}, ${chip}` : chip);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profession) { setError('Please select your profession.'); return; }
    if (!form.usage.trim()) { setError('Please describe what you\'ll use it for.'); return; }

    setError('');
    setLoading(true);
    try {
      const payload: RecommendationRequest = {
        ...form,
        category: category as Category,
      };
      const result = await recommendApi.getRecommendations(payload);
      navigate('/results', { state: { result, request: payload } });
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      if (errMsg.toLowerCase().includes('budget') || errMsg.toLowerCase().includes('no products found')) {
        setModalMessage(errMsg);
        // Extract the suggested budget number (e.g. ₹70,000) from the error message if present
        const match = errMsg.match(/₹([\d,]+)/);
        if (match && match.length > 0) {
          const num = parseInt(match[1].replace(/[^0-9]/g, ''));
          setSuggestedMinBudget(num);
        } else {
          setSuggestedMinBudget(minBudget);
        }
        setShowModal(true);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectRow = ({ label, value, options, onChange }: {
    label: string; value: string; options: string[];
    onChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 py-10 px-4 page-enter">
      <div className="max-w-2xl mx-auto">

        {/* Back + Header */}
        <button onClick={() => navigate('/category')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600
                     mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to categories
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
            {isLaptop
              ? <Cpu className="w-6 h-6 text-white" />
              : <Smartphone className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Find My Perfect {isLaptop ? 'Laptop' : 'Smartphone'}
            </h1>
            <p className="text-sm text-gray-500">Fill in the details below for personalised AI picks</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── BUDGET SLIDER ─────────────────────────────────────────────── */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="font-semibold text-gray-800 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" /> Budget
              </label>
              <span className="text-2xl font-black text-emerald-600">
                {formatBudget(form.budget)}
              </span>
            </div>
            <input
              type="range"
              min={minBudget}
              max={maxBudget}
              step={stepBudget}
              value={form.budget}
              onChange={e => set('budget', Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                         bg-emerald-100 [&::-webkit-slider-thumb]:bg-emerald-600
                         [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:shadow-md"
            />
            {isLaptop ? (
              <div className="relative h-4 mt-2 text-xs text-gray-400">
                <span className="absolute left-0">₹20K</span>
                <span className="absolute left-[16.7%] -translate-x-1/2">₹50K</span>
                <span className="absolute left-[44.4%] -translate-x-1/2">₹1L</span>
                <span className="absolute right-0">₹2L</span>
              </div>
            ) : (
              <div className="relative h-4 mt-2 text-xs text-gray-400">
                <span className="absolute left-0">₹7K</span>
                <span className="absolute left-[9.1%] -translate-x-1/2">₹20K</span>
                <span className="absolute left-[30.1%] -translate-x-1/2">₹50K</span>
                <span className="absolute left-[65.0%] -translate-x-1/2">₹1L</span>
                <span className="absolute right-0">₹1.5L</span>
              </div>
            )}
            {minBudget > (isLaptop ? 20000 : 7000) && (
              <div className="mt-4 text-xs bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex flex-col gap-0.5 animate-pulse">
                <span className="font-semibold">Minimum budget increased to {formatBudget(minBudget)}</span>
                <span className="opacity-90">Based on your premium specifications (e.g. Brand, RAM, Graphics, or Processor).</span>
              </div>
            )}
          </div>

          {/* ── PROFESSION ───────────────────────────────────────────────── */}
          <div className="card p-6">
            <label className="block font-semibold text-gray-800 mb-3">
              Your Profession
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROFESSIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('profession', p)}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm font-medium text-center
                    border transition-all duration-150
                    ${form.profession === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ── USAGE ────────────────────────────────────────────────────── */}
          <div className="card p-6">
            <label className="block font-semibold text-gray-800 mb-1.5">
              What will you use it for?
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Click chips or type freely — be specific for best results
            </p>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {USAGE_CHIPS[isLaptop ? 'laptop' : 'smartphone'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleUsageChip(chip)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${form.usage.includes(chip)
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300'}
                  `}
                >
                  {chip}
                </button>
              ))}
            </div>
            <textarea
              className="input-field resize-none h-24"
              placeholder="E.g. I'm a CS student who needs it for coding, running Docker, and occasional gaming on weekends..."
              value={form.usage}
              onChange={e => set('usage', e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">{form.usage.length}/1000</span>
            </div>
          </div>

          {/* ── SPECS (Optional) ─────────────────────────────────────────── */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Optional Specifications
              <span className="text-xs font-normal text-gray-400 ml-2">
                (leave as "Any" to let AI decide)
              </span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <SelectRow
                label="Brand Preference"
                value={form.brandPreference!}
                options={isLaptop ? BRANDS_LAPTOP : BRANDS_PHONE}
                onChange={v => set('brandPreference', v)}
              />

              {isLaptop ? (
                <>
                  <SelectRow label="RAM" value={form.ram!}     options={RAM_OPTIONS_LAPTOP} onChange={v => set('ram', v)} />
                  <SelectRow label="Storage" value={form.storage!} options={STORAGE_LAPTOP} onChange={v => set('storage', v)} />
                  <SelectRow label="Processor" value={form.processor!} options={PROCESSOR_OPTIONS} onChange={v => set('processor', v)} />
                  <SelectRow label="Graphics Card" value={form.graphicsCard!} options={GRAPHICS_OPTIONS} onChange={v => set('graphicsCard', v)} />
                  <SelectRow label="Display Size" value={form.displaySize!} options={DISPLAY_OPTIONS} onChange={v => set('displaySize', v)} />
                </>
              ) : (
                <>
                  <SelectRow label="RAM" value={form.smartphoneRam!}     options={RAM_OPTIONS_PHONE}  onChange={v => set('smartphoneRam', v)} />
                  <SelectRow label="Storage" value={form.smartphoneStorage!} options={STORAGE_PHONE}  onChange={v => set('smartphoneStorage', v)} />
                  <SelectRow label="Camera Priority" value={form.cameraPriority!} options={CAMERA_OPTIONS} onChange={v => set('cameraPriority', v)} />
                  <SelectRow label="Battery" value={form.battery!}        options={BATTERY_OPTIONS}    onChange={v => set('battery', v)} />
                  <SelectRow label="5G Preference" value={form.fiveGPreference!} options={FGG_OPTIONS} onChange={v => set('fiveGPreference', v)} />
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2
                       text-base py-4 text-lg"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-normal animate-pulse">
                  AI is finding the best {isLaptop ? 'laptops' : 'phones'} for you...
                </span>
              </div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Get My AI Recommendations
              </>
            )}
          </button>

          {loading && (
            <p className="text-center text-xs text-gray-400">
              This may take up to 10 seconds on first request · Cached results load instantly
            </p>
          )}
        </form>
      </div>

      {/* Suggestion modal popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform scale-100 transition-all">
            <h2 className="text-xl font-bold text-gray-905 text-gray-900 mb-2 flex items-center gap-2">
              ⚠️ Adjust Recommendation Budget
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {modalMessage}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Cancel
              </button>
              {suggestedMinBudget && (
                <button
                  type="button"
                  onClick={() => {
                    set('budget', suggestedMinBudget);
                    setShowModal(false);
                    setError('');
                  }}
                  className="btn-primary flex-1 py-3 text-sm"
                >
                  Increase Budget to {formatBudget(suggestedMinBudget)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}