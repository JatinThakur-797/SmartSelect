import { ExternalLink, MessageSquareQuote, ShieldCheck, Star, Zap } from 'lucide-react';
import { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
  rank: number;
}

export default function ProductCard({ product, rank }: ProductCardProps) {
  const isTopPick = rank === 1;

  return (
    <div
      className={`
        card overflow-hidden animate-slide-up
        ${isTopPick
          ? 'ring-2 ring-emerald-500 shadow-emerald-100 shadow-xl'
          : 'hover:shadow-lg'}
      `}
      style={{ animationDelay: `${(rank - 1) * 80}ms` }}
    >
      {/* Top badge */}
      {isTopPick && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5
                        flex items-center gap-1.5 justify-center">
          <Zap className="w-3.5 h-3.5" />
          BEST MATCH FOR YOU
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-0">

        {/* Image panel */}
        <div className={`
          relative flex-shrink-0 flex items-center justify-center
          bg-gradient-to-br from-gray-50 to-gray-100
          ${isTopPick ? 'sm:w-52' : 'sm:w-44'}
          h-48 sm:h-auto
        `}>
          {/* Rank badge */}
          <div className={`
            absolute top-3 left-3 w-7 h-7 rounded-full
            flex items-center justify-center text-xs font-bold shadow-md
            ${isTopPick
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200'}
          `}>
            #{rank}
          </div>

          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-4 mix-blend-multiply"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://placehold.co/200x200/ecfdf5/059669?text=${encodeURIComponent(
                    product.name.split(' ')[0]
                  )}`;
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-2 p-4">
              <ShieldCheck className="w-10 h-10 opacity-40" />
              <span className="text-xs text-center opacity-60">{product.name.split(' ').slice(0, 2).join(' ')}</span>
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="flex-1 p-5 flex flex-col gap-4">

          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {/* Price */}
                <span className="text-2xl font-extrabold text-emerald-700">
                  {product.price}
                </span>
                {/* Rating */}
                {product.rating && product.rating !== 'N/A' && (
                  <span className="flex items-center gap-1 bg-amber-50 border border-amber-200
                                   text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {product.rating}
                    {product.reviewCount > 0 && (
                      <span className="text-amber-500 font-normal">
                        ({product.reviewCount.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Specs chips */}
          {product.specs && product.specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.specs.map((spec, i) => (
                <span
                  key={i}
                  className="badge bg-emerald-50 text-emerald-800 border border-emerald-100"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* AI reason */}
          {product.aiReason && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50
                            border border-emerald-100 rounded-xl p-3.5 flex gap-2.5">
              <MessageSquareQuote className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900 leading-relaxed">
                <span className="font-semibold">Why this fits you: </span>
                {product.aiReason}
              </p>
            </div>
          )}

          {/* CTA button */}
          <div className="mt-auto pt-1">
            <a
              href={product.amazonUrl || `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center justify-center gap-2 w-full sm:w-auto
                font-semibold text-sm px-6 py-2.5 rounded-xl
                transition-all duration-200 shadow-sm hover:shadow-md
                ${isTopPick
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'}
              `}
            >
              <ExternalLink className="w-4 h-4" />
              View on Amazon India
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}