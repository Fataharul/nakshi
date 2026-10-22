import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Filter,
  Tag,
  Package,
  ArrowUpDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CRAFT_MEDIUMS, CRAFT_STYLES } from './CreateArtworkModal';
import { artworkApi } from '../../services/artwork.service';
import { Artwork } from '../../types/artwork';
import { ArtworkCard, SearchableArtwork } from './ArtworkCard';

export type { SearchableArtwork };

// Curated authentic Bangladeshi craft demonstration collection
const CURATED_HERITAGE_ARTWORKS: SearchableArtwork[] = [
  {
    id: 'art-001',
    title: 'Sonargaon Heritage Jamdani Saree',
    artistName: 'Alkas Mia',
    artistRegion: 'Narayanganj',
    medium: 'Handloom Jamdani',
    style: 'Floral Motifs',
    description: 'Authentic 200-count handloom muslin Jamdani woven with pure zari floral jaal motifs.',
    dimensions: '5.5 meters x 1.2 meters',
    weight: '0.85 kg',
    price: 1250.0,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-28T10:00:00Z',
    featured: true,
  },
  {
    id: 'art-002',
    title: 'Mayurpakkhi Heirloom Nakshi Kantha',
    artistName: 'Rokeya Begum',
    artistRegion: 'Jessore',
    medium: 'Nakshi Kantha',
    style: 'Traditional Folk',
    description: 'Traditional quilt featuring intricate run-stitch peacocks, lotus pond medallions, and village folklore.',
    dimensions: '72 x 54 inches',
    weight: '1.4 kg',
    price: 850.0,
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-27T14:30:00Z',
    featured: true,
  },
  {
    id: 'art-003',
    title: 'Terracotta Folk Horse Sculpture',
    artistName: 'Gouranga Pal',
    artistRegion: 'Panchagarh',
    medium: 'Terracotta Clay',
    style: 'Sculptural & Relic',
    description: 'Hand-molded kiln-fired terracotta folk artifact embodying ancient North Bengal sacrificial horse motifs.',
    dimensions: '35 x 22 x 12 cm',
    weight: '2.8 kg',
    price: 450.0,
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-26T09:15:00Z',
  },
  {
    id: 'art-004',
    title: 'Dhamrai Bell Metal Royal Kansa Urn',
    artistName: 'Sukumar Banik',
    artistRegion: 'Dhamrai',
    medium: 'Brass & Bell Metal',
    style: 'Royal Heritage',
    description: 'Hand-beaten high-resonance lost-wax cast bell metal ceremonial vessel polished with natural clay.',
    dimensions: '28 x 28 x 38 cm',
    weight: '4.2 kg',
    price: 920.0,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-25T16:45:00Z',
  },

  {
    id: 'art-006',
    title: 'Sylhet Imperial Murta Cane Shital Pati',
    artistName: 'Binoy Das',
    artistRegion: 'Sylhet',
    medium: 'Shital Pati Cane Weave',
    style: 'Geometric Jaal',
    description: 'Master-grade cold mat handwoven from strips of green Murta reed featuring geometric diamond weave.',
    dimensions: '84 x 60 inches',
    weight: '1.2 kg',
    price: 640.0,
    imageUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80',
    availability: 'SOLD',
    createdAt: '2026-09-23T08:10:00Z',
  },
  {
    id: 'art-007',
    title: 'Golden Fiber Embroidered Jute Tapestry',
    artistName: 'Fatema Khatun',
    artistRegion: 'Faridpur',
    medium: 'Jute Fiber Craft',
    style: 'Contemporary Heritage',
    description: 'Naturally dyed spun golden jute fibers braided and cross-stitched into an expansive wall tapestry.',
    dimensions: '40 x 30 inches',
    weight: '1.5 kg',
    price: 360.0,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-22T13:00:00Z',
  },
  {
    id: 'art-008',
    title: 'Chittagong Carved Sheesham Wood Casket',
    artistName: 'Ranjit Barua',
    artistRegion: 'Chittagong',
    medium: 'Wood Carving & Inlay',
    style: 'Floral Motifs',
    description: 'Seasoned solid rosewood chest adorned with deep relief floral carvings and brass wire inlays.',
    dimensions: '30 x 20 x 15 cm',
    weight: '2.1 kg',
    price: 780.0,
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-21T15:20:00Z',
  },
  {
    id: 'art-009',
    title: 'Rajshahi Glazed Heritage Clay Pitcher',
    artistName: 'Bipul Kumar',
    artistRegion: 'Rajshahi',
    medium: 'Ceramic & Traditional Pottery',
    style: 'Traditional Folk',
    description: 'Wheel-thrown red river silt vessel wood-fired with natural terracotta slip and glazed neck.',
    dimensions: '25 x 25 x 32 cm',
    weight: '1.9 kg',
    price: 320.0,
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    createdAt: '2026-09-20T10:40:00Z',
  },
];

type SortOption = 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'TITLE_ASC';

const ITEMS_PER_PAGE = 48;

export const ArtworkSearchInterface: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('ALL');
  const [selectedStyle, setSelectedStyle] = useState('ALL');
  const [creatorName, setCreatorName] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('LATEST');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Infinite Scroll & Pagination state
  const [apiArtworks, setApiArtworks] = useState<SearchableArtwork[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Fetch a page of artworks from backend
  const fetchArtworks = useCallback(
    async (targetPage: number, isReset: boolean) => {
      const currentRequestId = ++activeRequestIdRef.current;
      if (isReset) {
        setIsLoading(true);
      } else {
        setIsFetchingNextPage(true);
      }

      try {
        const data = await artworkApi.getArtworks({
          medium: selectedMedium !== 'ALL' ? selectedMedium : undefined,
          style: selectedStyle !== 'ALL' ? selectedStyle : undefined,
          search: searchTerm.trim() || undefined,
          creatorName: creatorName.trim() || undefined,
          minPrice: minPrice !== '' ? Number(minPrice) : undefined,
          maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
          availability: availabilityFilter !== 'ALL' ? availabilityFilter : undefined,
          sortBy: sortBy,
          page: targetPage,
          limit: ITEMS_PER_PAGE,
        });

        if (currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        if (data && Array.isArray(data.artworks)) {
          const mapped: SearchableArtwork[] = data.artworks.map((item: Artwork) => ({
            id: item.id,
            title: item.title,
            artistName: item.artist?.name || 'Master Artisan',
            artistRegion: 'Bangladesh',
            medium: item.medium,
            style: item.style || undefined,
            description: item.description,
            dimensions: item.dimensions || 'N/A',
            weight: item.weight ? `${item.weight} ${item.weightUnit || 'kg'}` : undefined,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            availability:
              item.availability === 'SOLD'
                ? 'SOLD'
                : item.availability === 'RESERVED'
                ? 'RESERVED'
                : 'AVAILABLE',
            createdAt: item.createdAt,
            like: item.like ?? 0,
          }));

          const paginationTotalPages = data.pagination?.totalPages || 1;
          const paginationTotal = data.pagination?.total ?? mapped.length;

          setTotalCount(paginationTotal);
          setHasMore(targetPage < paginationTotalPages && mapped.length > 0);

          if (isReset) {
            setApiArtworks(mapped);
            setPage(1);
          } else {
            setApiArtworks((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const uniqueNew = mapped.filter((a) => !existingIds.has(a.id));
              return [...prev, ...uniqueNew];
            });
            setPage(targetPage);
          }
        }
      } catch (err) {
        if (currentRequestId === activeRequestIdRef.current) {
          console.error('Failed to load artworks from API:', err);
        }
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoading(false);
          setIsFetchingNextPage(false);
        }
      }
    },
    [selectedMedium, selectedStyle, searchTerm, creatorName, minPrice, maxPrice, availabilityFilter, sortBy]
  );

  // When filters or search criteria change, reset to Page 1
  useEffect(() => {
    fetchArtworks(1, true);
  }, [fetchArtworks]);

  // Set up IntersectionObserver on sentinel element for automatic infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading && !isFetchingNextPage) {
          fetchArtworks(page + 1, false);
        }
      },
      {
        rootMargin: '250px',
        threshold: 0.05,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, isFetchingNextPage, page, fetchArtworks]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMedium('ALL');
    setSelectedStyle('ALL');
    setCreatorName('');
    setMinPrice('');
    setMaxPrice('');
    setAvailabilityFilter('ALL');
    setSortBy('LATEST');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedMedium !== 'ALL' ||
    selectedStyle !== 'ALL' ||
    creatorName !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    availabilityFilter !== 'ALL' ||
    sortBy !== 'LATEST';

  return (
    <div id="artwork-search-container" className="space-y-8">
      {/* 1. Hero Discovery Header */}
      <div className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 pb-2">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-2 inline-block">
          Curated Heritage Discovery
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface tracking-tight mb-3">
          Explore Artworks & Crafts
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
          Discover authentic handloom Jamdani, heirloom Nakshi Kantha, terracotta sculptures, and rare bell metal crafts directly from Bengal’s master artisans.
        </p>
      </div>

      {/* 2. Search Bar & Primary Input Box */}
      <div className="max-w-2xl mx-auto">
        <div className="relative flex items-center bg-surface-container-lowest rounded-full border border-outline/30 ambient-shadow focus-within:border-primary transition-all p-1.5 sm:p-2">
          <div className="pl-3.5 pr-2 text-primary">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="artwork-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by artwork title, artisan, craft medium, or motif..."
            className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none py-2 px-1"
          />
          {searchTerm && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchTerm('')}
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors mr-1"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden p-2 bg-surface-container text-on-surface rounded-full border border-outline/20 mr-1"
            title="Toggle filters"
          >
            <Filter className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* 3. Craft Medium Filter Chips Scroll */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Filter by Craft Medium</span>
          </span>
          {hasActiveFilters && (
            <button
              id="reset-search-filters-btn"
              onClick={resetFilters}
              className="text-xs text-primary hover:text-surface-tint font-medium underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            id="medium-filter-all"
            onClick={() => setSelectedMedium('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
              selectedMedium === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-outline/20'
            }`}
          >
            All Crafts ({CURATED_HERITAGE_ARTWORKS.length})
          </button>

          {CRAFT_MEDIUMS.map((medium) => {
            const count = CURATED_HERITAGE_ARTWORKS.filter((a) => a.medium === medium).length;
            const isSelected = selectedMedium === medium;
            return (
              <button
                key={medium}
                id={`medium-filter-${medium.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedMedium(medium)}
                className={`px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline/20'
                }`}
              >
                <span>{medium}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Controls Bar: Refinements & Sorting */}
      <div className={`bg-surface-container-lowest p-4 rounded-xl border border-outline/20 ambient-shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${showFiltersMobile ? 'block' : 'hidden sm:flex'}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Craft Style Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Style:</span>
            </span>
            <select
              id="artwork-style-filter"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="bg-surface-container-low text-xs text-on-surface rounded-lg px-3 py-1.5 border border-outline/20 focus:outline-none focus:border-primary font-medium"
            >
              <option value="ALL">All Styles</option>
              {CRAFT_STYLES.map((styleItem) => (
                <option key={styleItem} value={styleItem}>
                  {styleItem}
                </option>
              ))}
            </select>
          </div>

          {/* Creator Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Creator:</span>
            <input
              type="text"
              id="artwork-creator-filter"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Artist Name"
              className="bg-surface-container-low text-xs text-on-surface rounded-lg px-3 py-1.5 border border-outline/20 focus:outline-none focus:border-primary font-medium w-32"
            />
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Price:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                id="artwork-min-price-filter"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                className="bg-surface-container-low text-xs text-on-surface rounded-lg px-2 py-1.5 border border-outline/20 focus:outline-none focus:border-primary font-medium w-16"
              />
              <span className="text-on-surface-variant">-</span>
              <input
                type="number"
                id="artwork-max-price-filter"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                className="bg-surface-container-low text-xs text-on-surface rounded-lg px-2 py-1.5 border border-outline/20 focus:outline-none focus:border-primary font-medium w-16"
              />
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Status:</span>
            <select
              id="artwork-availability-filter"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="bg-surface-container-low text-xs text-on-surface rounded-lg px-3 py-1.5 border border-outline/20 focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Pieces</option>
              <option value="AVAILABLE">Available Only</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/10">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
            <span>Sort by:</span>
          </div>
          <select
            id="artwork-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-surface-container-low text-xs text-on-surface rounded-lg px-3 py-1.5 border border-outline/20 focus:outline-none focus:border-primary font-medium"
          >
            <option value="LATEST">Latest Additions</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="TITLE_ASC">Artwork Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* 5. Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <div>
          Showing <strong className="text-on-surface font-semibold">{apiArtworks.length}</strong> of{' '}
          <strong className="text-primary font-semibold">{totalCount}</strong> {totalCount === 1 ? 'artwork' : 'artworks'}
          {selectedMedium !== 'ALL' && <span> in <strong className="text-primary">{selectedMedium}</strong></span>}
          {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
        </div>
      </div>

      {/* 6. Gallery Grid / Loading / Empty State */}
      {isLoading ? (
        <div id="gallery-loading-spinner" className="text-center py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif uppercase tracking-widest text-on-surface-variant">
            Loading Authentic Gallery Collection...
          </span>
        </div>
      ) : apiArtworks.length === 0 ? (
        <div id="no-search-results-banner" className="text-center py-16 px-6 bg-surface-container-low rounded-xl border border-dashed border-outline/30">
          <Package className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-on-surface mb-2">No Artworks Found</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
            We couldn't find any heritage craft pieces matching your current filters. Try changing your search query or selecting a different medium.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all cursor-pointer shadow-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div id="search-artworks-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {apiArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div
              id="gallery-infinite-scroll-sentinel"
              ref={sentinelRef}
              className="h-10 w-full flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Loading More Spinner */}
          {isFetchingNextPage && (
            <div id="gallery-loading-more-spinner" className="text-center py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-serif uppercase tracking-widest text-on-surface-variant">
                Curating more heritage masterworks...
              </span>
            </div>
          )}

          {/* Manual Load More fallback button */}
          {hasMore && !isFetchingNextPage && !isLoading && (
            <div className="text-center pt-2 pb-2">
              <button
                id="gallery-load-more-btn"
                onClick={() => fetchArtworks(page + 1, false)}
                className="px-6 py-2 border border-outline/30 hover:border-primary/50 text-xs font-medium text-on-surface-variant hover:text-primary rounded-full transition-colors cursor-pointer bg-surface-container-lowest shadow-2xs"
              >
                Scroll down or tap to load more
              </button>
            </div>
          )}

          {/* End of Collection Banner */}
          {!hasMore && apiArtworks.length > 0 && !isLoading && (
            <div id="gallery-end-of-collection" className="text-center py-12 px-4 border-t border-outline/10 mt-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container mb-3 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-on-surface">You've reached the end of the collection</h4>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                All {totalCount} authentic Bengali heritage pieces have been presented.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
