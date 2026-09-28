import React, { useState } from 'react';
import { X, Palette, AlertCircle, CheckCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';
import { Artwork, CreateArtworkPayload } from '../../types/artwork';

export const CRAFT_MEDIUMS = [
  'Nakshi Kantha',
  'Terracotta Clay',
  'Handloom Jamdani',
  'Brass & Bell Metal',
  'Folk Painting & Patua',
  'Wood Carving & Inlay',
  'Shital Pati Cane Weave',
  'Ceramic & Traditional Pottery',
  'Jute Fiber Craft',
  'Leather Craft',
  'Other Traditional Craft',
] as const;

interface CreateArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworkCreated: (newArtwork: Artwork) => void;
}

export const CreateArtworkModal: React.FC<CreateArtworkModalProps> = ({
  isOpen,
  onClose,
  onArtworkCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState<string>('Nakshi Kantha');
  const [dimensions, setDimensions] = useState('');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters.';
    }

    if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters detailing the craft.';
    }

    if (!medium.trim()) {
      errors.medium = 'Craft medium is required.';
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      errors.price = 'Price must be greater than zero credits.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the highlighted form errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateArtworkPayload = {
        title: title.trim(),
        description: description.trim(),
        medium: medium.trim(),
        dimensions: dimensions.trim() || undefined,
        price: numericPrice,
        imageUrl: imageUrl.trim() || undefined,
        availability: 'AVAILABLE',
      };

      const created = await artworkApi.createArtwork(payload);
      setSuccess('Artwork record successfully published to your storefront!');
      onArtworkCreated(created);

      setTimeout(() => {
        setTitle('');
        setDescription('');
        setMedium('Nakshi Kantha');
        setDimensions('');
        setPrice('');
        setImageUrl('');
        setError(null);
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create artwork listing.');
      if (err.details) {
        setFieldErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-artwork-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest max-w-lg w-full rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 relative max-h-[90vh] overflow-y-auto">
        <button
          id="create-artwork-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-on-surface">Publish New Artwork</h2>
        </div>
        <p className="text-xs text-on-surface-variant mb-6">
          Add a handcrafted Bengali textile or heritage craftwork listing to your digital storefront.
        </p>

        {error && (
          <div id="create-artwork-error-banner" className="mb-4 p-3.5 bg-error-container/60 border border-error/20 text-error rounded text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div id="create-artwork-success-banner" className="mb-4 p-3.5 bg-status-valid/10 border border-status-valid/30 text-status-valid rounded text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="artwork-title-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
              Artwork Title *
            </label>
            <input
              id="artwork-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Heirloom Sonargaon Jamdani Saree"
              className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              required
            />
            {fieldErrors.title && (
              <p id="title-field-error" className="text-error text-xs mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Grid: Medium & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="artwork-medium-select" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Craft Medium *
              </label>
              <select
                id="artwork-medium-select"
                value={medium}
                onChange={(e) => {
                  setMedium(e.target.value);
                  if (fieldErrors.medium) setFieldErrors((prev) => ({ ...prev, medium: '' }));
                }}
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
                required
              >
                {CRAFT_MEDIUMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {fieldErrors.medium && (
                <p id="medium-field-error" className="text-error text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.medium}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="artwork-price-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Listing Price (Credits) *
              </label>
              <input
                id="artwork-price-input"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                }}
                placeholder="e.g. 450.00"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
                required
              />
              {fieldErrors.price && (
                <p id="price-field-error" className="text-error text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.price}</span>
                </p>
              )}
            </div>
          </div>

          {/* Grid: Dimensions & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="artwork-dimensions-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Dimensions / Size <span className="text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="artwork-dimensions-input"
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 48 x 36 inches"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label htmlFor="artwork-image-url-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Image URL <span className="text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <input
                  id="artwork-image-url-input"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface pr-8"
                />
                <ImageIcon className="w-4 h-4 text-on-surface-variant absolute right-2.5 top-3 pointer-events-none opacity-60" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="artwork-description-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
              Craft History & Description *
            </label>
            <textarea
              id="artwork-description-input"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Describe the weaving technique, motif heritage, and materials used..."
              className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface resize-none"
              required
            />
            {fieldErrors.description && (
              <p id="description-field-error" className="text-error text-xs mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.description}</span>
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="create-artwork-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Publishing Artwork...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Artwork to Storefront</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
