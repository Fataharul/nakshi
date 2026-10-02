import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Filter,
  Sparkles,
  Tag,
  Package,
  ArrowUpDown,
  MapPin,
  Layers,
} from 'lucide-react';
import { CRAFT_MEDIUMS, CRAFT_STYLES } from './CreateArtworkModal';
import { artworkApi } from '../../services/artwork.service';
import { Artwork } from '../../types/artwork';

export interface SearchableArtwork {
  id: string;
  title: string;
  artistName: string;
  artistRegion: string;
  medium: string;
  style?: string;
  description: string;
  dimensions: string;
  weight?: string;
  price: number;
  imageUrl: string;
  availability: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  createdAt: string;
  featured?: boolean;
}

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

  // Live Backend API items state
  const [apiArtworks, setApiArtworks] = useState<SearchableArtwork[]>([]);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    artworkApi
      .getArtworks({
        medium: selectedMedium !== 'ALL' ? selectedMedium : undefined,
        style: selectedStyle !== 'ALL' ? selectedStyle : undefined,
        search: searchTerm.trim() || undefined,
        creatorName: creatorName.trim() || undefined,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        availability: availabilityFilter !== 'ALL' ? availabilityFilter : undefined,
      })
      .then((data) => {
        if (isMounted && data.artworks && data.artworks.length > 0) {
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
            price: item.price,
            imageUrl: item.imageUrl,
            availability: item.availability === 'SOLD' ? 'SOLD' : item.availability === 'RESERVED' ? 'RESERVED' : 'AVAILABLE',
            createdAt: item.createdAt,
          }));
          setApiArtworks(mapped);
          setIsApiLoaded(true);
        }
      })
      .catch(() => {
        // Fallback to static collection if backend is offline/unreachable
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMedium, selectedStyle, searchTerm, creatorName, minPrice, maxPrice, availabilityFilter]);

  // Combined Collection & Filter & Sort Logic
  const allCollection = useMemo(() => {
    if (isApiLoaded && apiArtworks.length > 0) {
      // Merge unique backend artworks with demonstration dataset
      const apiIds = new Set(apiArtworks.map((a) => a.id));
      const demoRemainder = CURATED_HERITAGE_ARTWORKS.filter((a) => !apiIds.has(a.id));
      return [...apiArtworks, ...demoRemainder];
    }
    return CURATED_HERITAGE_ARTWORKS;
  }, [apiArtworks, isApiLoaded]);

  const filteredArtworks = useMemo(() => {
    return allCollection.filter((art) => {
      // 1. Text Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesArtist = art.artistName.toLowerCase().includes(query);
        const matchesRegion = art.artistRegion.toLowerCase().includes(query);
        const matchesMedium = art.medium.toLowerCase().includes(query);
        const matchesStyle = art.style ? art.style.toLowerCase().includes(query) : false;
        const matchesDesc = art.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesArtist && !matchesRegion && !matchesMedium && !matchesStyle && !matchesDesc) {
          return false;
        }
      }

      // 2. Medium filter
      if (selectedMedium !== 'ALL' && art.medium.toLowerCase() !== selectedMedium.toLowerCase()) {
        return false;
      }

      // 3. Style filter
      if (selectedStyle !== 'ALL') {
        if (!art.style || art.style.toLowerCase() !== selectedStyle.toLowerCase()) {
          return false;
        }
      }

      // 3a. Creator filter (for static/demo data)
      if (creatorName.trim()) {
        const query = creatorName.toLowerCase();
        if (!art.artistName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 4. Price filter
      const artPrice = Number(art.price);
      if (minPrice !== '' && artPrice < Number(minPrice)) return false;
      if (maxPrice !== '' && artPrice > Number(maxPrice)) return false;

      // 5. Availability
      if (availabilityFilter === 'AVAILABLE' && art.availability !== 'AVAILABLE') {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_ASC':
          return a.price - b.price;
        case 'PRICE_DESC':
          return b.price - a.price;
        case 'TITLE_ASC':
          return a.title.localeCompare(b.title);
        case 'LATEST':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allCollection, searchTerm, selectedMedium, selectedStyle, creatorName, minPrice, maxPrice, availabilityFilter, sortBy]);

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
          Showing <strong className="text-on-surface font-semibold">{filteredArtworks.length}</strong> {filteredArtworks.length === 1 ? 'artwork' : 'artworks'}
          {selectedMedium !== 'ALL' && <span> in <strong className="text-primary">{selectedMedium}</strong></span>}
          {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
        </div>
      </div>

      {/* 6. Gallery Grid / Empty State */}
      {filteredArtworks.length === 0 ? (
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
        <div id="search-artworks-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredArtworks.map((artwork) => (
            <div
              key={artwork.id}
              className="bg-surface-container-lowest rounded-xl border border-outline/20 ambient-shadow overflow-hidden flex flex-col hover:border-outline/40 transition-all hover:scale-[1.01] duration-300 group"
            >
              {/* Image Frame */}
              <div className="h-60 bg-surface-container-high relative overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Availability Badge */}
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-xs border ${
                    artwork.availability === 'AVAILABLE'
                      ? 'bg-surface-container-lowest/90 text-status-valid border-status-valid/30'
                      : 'bg-surface-container-lowest/90 text-on-surface-variant border-outline/20'
                  }`}
                >
                  {artwork.availability}
                </span>

                {artwork.featured && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-on-primary flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Curator Pick</span>
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {artwork.medium}
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-outline" />
                      <span>{artwork.artistRegion}</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {artwork.title}
                  </h3>

                  <p className="text-xs text-on-surface-variant/90 font-medium mb-2">
                    By <span className="text-on-surface font-semibold">{artwork.artistName}</span>
                  </p>

                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                    {artwork.description}
                  </p>

                  <div className="text-[11px] text-on-surface-variant/80 mb-3 flex flex-wrap gap-2">
                    {artwork.style && (
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                        {artwork.style}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-surface-container-low border border-outline/10">
                      {artwork.dimensions}
                    </span>
                    {artwork.weight && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-low border border-outline/10">
                        {artwork.weight}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price & Details */}
                <div className="pt-3 border-t border-outline/10 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-medium">
                      Valuation
                    </span>
                    <span className="font-serif font-bold text-base text-primary">
                      {artwork.price.toFixed(2)}{' '}
                      <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
                    </span>
                  </div>

                  <button
                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-full border border-outline/20 hover:border-outline/40 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
