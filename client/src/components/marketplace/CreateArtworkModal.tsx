import React, { useState, useEffect } from 'react';
import { X, Palette, AlertCircle, CheckCircle, Plus, Edit, Image as ImageIcon, UploadCloud, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { artworkApi } from '../../services/artwork.service';
import { Artwork, CreateArtworkPayload, UpdateArtworkPayload } from '../../types/artwork';

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

export const CRAFT_STYLES = [
  'Traditional Folk',
  'Royal Heritage',
  'Geometric Jaal',
  'Floral Motifs',
  'Contemporary Heritage',
  'Sculptural & Relic',
  'Abstract & Modern',
] as const;

interface CreateArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworkCreated?: (newArtwork: Artwork) => void;
  onArtworkUpdated?: (updatedArtwork: Artwork) => void;
  artworkToEdit?: Artwork | null;
}

export const CreateArtworkModal: React.FC<CreateArtworkModalProps> = ({
  isOpen,
  onClose,
  onArtworkCreated,
  onArtworkUpdated,
  artworkToEdit = null,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState<string>('Nakshi Kantha');
  const [style, setStyle] = useState<string>('Traditional Folk');
  const [dimensions, setDimensions] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');

  // Direct image file upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Authorization checks: Must be an authenticated ARTIST and, if editing, must own the artwork listing
  const isArtist = user?.role === 'ARTIST';
  const isOwner = artworkToEdit ? user?.id === artworkToEdit.artistId : true;
  const isAuthorized = !!user && isArtist && isOwner;

  useEffect(() => {
    if (!isOpen) return;

    if (artworkToEdit) {
      setTitle(artworkToEdit.title || '');
      setDescription(artworkToEdit.description || '');
      setMedium(artworkToEdit.medium || 'Nakshi Kantha');
      setStyle(artworkToEdit.style || 'Traditional Folk');
      setDimensions(artworkToEdit.dimensions || '');
      setHeight(artworkToEdit.height ? String(artworkToEdit.height) : '');
      setWidth(artworkToEdit.width ? String(artworkToEdit.width) : '');
      setDepth(artworkToEdit.depth ? String(artworkToEdit.depth) : '');
      setWeight(artworkToEdit.weight ? String(artworkToEdit.weight) : '');
      setWeightUnit(artworkToEdit.weightUnit || 'kg');
      setPrice(artworkToEdit.price ? String(artworkToEdit.price) : '');
      setImageUrl(artworkToEdit.imageUrl || '');
      setPreviewUrl(artworkToEdit.imageUrl || null);
      setSelectedFile(null);
    } else {
      setTitle('');
      setDescription('');
      setMedium('Nakshi Kantha');
      setStyle('Traditional Folk');
      setDimensions('');
      setHeight('');
      setWidth('');
      setDepth('');
      setWeight('');
      setWeightUnit('kg');
      setPrice('');
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  }, [artworkToEdit, isOpen]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, image: 'Please select a valid PNG, JPG, or WEBP image.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: 'Artwork image size must be under 5MB.' }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, image: '' }));
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!isAuthorized) {
      setError('403 Forbidden: Only the verified storefront owner is authorized to add or edit artworks.');
      return;
    }

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

    const numericWeight = weight.trim() ? parseFloat(weight) : undefined;
    if (weight.trim() && (isNaN(numericWeight!) || numericWeight! <= 0)) {
      errors.weight = 'Weight must be a positive number.';
    }

    const numericHeight = height.trim() ? parseFloat(height) : undefined;
    if (height.trim() && (isNaN(numericHeight!) || numericHeight! <= 0)) {
      errors.height = 'Height must be a positive number.';
    }

    const numericWidth = width.trim() ? parseFloat(width) : undefined;
    if (width.trim() && (isNaN(numericWidth!) || numericWidth! <= 0)) {
      errors.width = 'Width must be a positive number.';
    }

    const numericDepth = depth.trim() ? parseFloat(depth) : undefined;
    if (depth.trim() && (isNaN(numericDepth!) || numericDepth! <= 0)) {
      errors.depth = 'Depth must be a positive number.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the highlighted form errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalDimensions = dimensions.trim();
      if (!finalDimensions && numericHeight && numericWidth) {
        finalDimensions = `${numericHeight} x ${numericWidth}${numericDepth ? ` x ${numericDepth}` : ''} cm`;
      }

      let finalImageUrl = imageUrl.trim();

      // If artist selected a local file, upload it directly to Supabase S3 Storage
      if (selectedFile) {
        setUploadStatusText('Uploading image to Supabase Storage...');
        const uploadResult = await artworkApi.uploadImage(selectedFile);
        finalImageUrl = uploadResult.imageUrl;
      }

      setUploadStatusText(artworkToEdit ? 'Updating artwork details...' : 'Saving artwork listing...');

      if (artworkToEdit) {
        const updatePayload: UpdateArtworkPayload = {
          title: title.trim(),
          description: description.trim(),
          medium: medium.trim(),
          style: style.trim() || undefined,
          dimensions: finalDimensions || undefined,
          height: numericHeight,
          width: numericWidth,
          depth: numericDepth,
          weight: numericWeight,
          weightUnit: weightUnit.trim() || 'kg',
          price: numericPrice,
          imageUrl: finalImageUrl || undefined,
        };

        const updated = await artworkApi.updateArtwork(artworkToEdit.id, updatePayload);
        setSuccess('Artwork listing successfully updated!');
        if (onArtworkUpdated) {
          onArtworkUpdated(updated);
        } else if (onArtworkCreated) {
          onArtworkCreated(updated);
        }
      } else {
        const createPayload: CreateArtworkPayload = {
          title: title.trim(),
          description: description.trim(),
          medium: medium.trim(),
          style: style.trim() || undefined,
          dimensions: finalDimensions || undefined,
          height: numericHeight,
          width: numericWidth,
          depth: numericDepth,
          weight: numericWeight,
          weightUnit: weightUnit.trim() || 'kg',
          price: numericPrice,
          imageUrl: finalImageUrl || undefined,
          availability: 'AVAILABLE',
        };

        const created = await artworkApi.createArtwork(createPayload);
        setSuccess('Artwork record successfully published to your storefront!');
        onArtworkCreated?.(created);
      }

      setTimeout(() => {
        setTitle('');
        setDescription('');
        setMedium('Nakshi Kantha');
        setDimensions('');
        setHeight('');
        setWidth('');
        setDepth('');
        setWeight('');
        setWeightUnit('kg');
        setPrice('');
        setImageUrl('');
        setSelectedFile(null);
        if (previewUrl && !artworkToEdit) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setShowUrlInput(false);
        setUploadStatusText('');
        setError(null);
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      if (err.statusCode === 403 || err.status === 403) {
        setError('403 Forbidden: You are not authorized to add or edit artworks on this storefront.');
      } else if (err.statusCode === 401 || err.status === 401) {
        setError('401 Unauthorized: Please sign in as an authenticated artist.');
      } else {
        setError(err.message || 'Failed to process artwork request.');
      }

      if (err.details) {
        setFieldErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
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
          <h2 className="font-serif text-2xl font-bold text-on-surface">
            {artworkToEdit ? 'Edit Artwork Listing' : 'Publish New Artwork'}
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant mb-6">
          {artworkToEdit
            ? 'Update handcrafted textile or craft details for your existing storefront listing.'
            : 'Add a handcrafted Bengali textile or heritage craftwork listing to your digital storefront.'}
        </p>

        {!isAuthorized && (
          <div id="unauthorized-artwork-modal-banner" className="mb-4 p-3.5 bg-error-container/60 border border-error/20 text-error rounded text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              403 Forbidden: Only the authentic storefront owner (verified artist) is permitted to add or edit artworks.
            </span>
          </div>
        )}

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

          {/* Grid: Medium, Style & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
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
              <label htmlFor="artwork-style-select" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Craft Style
              </label>
              <select
                id="artwork-style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              >
                {CRAFT_STYLES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="artwork-price-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Price (Credits) *
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
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
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

          {/* Grid: Weight & Weight Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="artwork-weight-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Weight <span className="text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="artwork-weight-input"
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (fieldErrors.weight) setFieldErrors((prev) => ({ ...prev, weight: '' }));
                }}
                placeholder="e.g. 2.50"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              />
              {fieldErrors.weight && (
                <p id="weight-field-error" className="text-error text-xs mt-1 font-medium">
                  {fieldErrors.weight}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="artwork-weight-unit-select" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Unit
              </label>
              <select
                id="artwork-weight-unit-select"
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          {/* Grid: Height, Width, Depth (Numeric Dimensions) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="artwork-height-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Height (cm)
              </label>
              <input
                id="artwork-height-input"
                type="number"
                step="0.1"
                min="0"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (fieldErrors.height) setFieldErrors((prev) => ({ ...prev, height: '' }));
                }}
                placeholder="e.g. 60"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              />
              {fieldErrors.height && (
                <p id="height-field-error" className="text-error text-xs mt-1 font-medium">
                  {fieldErrors.height}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="artwork-width-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Width (cm)
              </label>
              <input
                id="artwork-width-input"
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  if (fieldErrors.width) setFieldErrors((prev) => ({ ...prev, width: '' }));
                }}
                placeholder="e.g. 40"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              />
              {fieldErrors.width && (
                <p id="width-field-error" className="text-error text-xs mt-1 font-medium">
                  {fieldErrors.width}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="artwork-depth-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                Depth (cm)
              </label>
              <input
                id="artwork-depth-input"
                type="number"
                step="0.1"
                min="0"
                value={depth}
                onChange={(e) => {
                  setDepth(e.target.value);
                  if (fieldErrors.depth) setFieldErrors((prev) => ({ ...prev, depth: '' }));
                }}
                placeholder="e.g. 5"
                className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
              />
              {fieldErrors.depth && (
                <p id="depth-field-error" className="text-error text-xs mt-1 font-medium">
                  {fieldErrors.depth}
                </p>
              )}
            </div>
          </div>

          {/* Formatted Size */}
          <div>
            <label htmlFor="artwork-dimensions-input" className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
              Formatted Size <span className="text-[11px] font-normal lowercase">(optional text)</span>
            </label>
            <input
              id="artwork-dimensions-input"
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="e.g. 60 x 40 x 5 cm"
              className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2.5 text-sm outline-none focus:border-primary text-on-surface"
            />
          </div>

          {/* Direct Artwork Image Upload (Supabase Storage) */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1.5 flex items-center justify-between">
              <span>Artwork Image</span>
              <span className="text-[11px] font-normal lowercase text-on-surface-variant/80">PNG, JPG, WEBP (Max 5MB)</span>
            </label>

            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-outline/30 bg-surface-container-low hover:border-primary/60 hover:bg-surface-container'
                }`}
              >
                <input
                  id="artwork-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-xs sm:text-sm text-on-surface block">
                      Choose an image or drag & drop here
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Directly uploads to Supabase Storage
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-outline/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-md bg-surface-container-high overflow-hidden shrink-0 border border-outline/20 relative">
                  <img src={previewUrl} alt="Artwork Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-xs font-bold text-on-surface truncate">
                    {selectedFile?.name || 'Selected Artwork Image'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''} • Ready for Supabase Storage
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <label
                      htmlFor="artwork-replace-file-input"
                      className="px-2 py-0.5 text-[10px] font-semibold text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      Replace
                    </label>
                    <input
                      id="artwork-replace-file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold text-error bg-error/10 rounded hover:bg-error/20 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {fieldErrors.image && (
              <p id="image-field-error" className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.image}</span>
              </p>
            )}

            {/* Optional URL Toggle */}
            <div className="mt-1.5 text-right">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                {showUrlInput ? 'Hide External URL Field' : 'Or enter an external image URL instead'}
              </button>
            </div>

            {showUrlInput && (
              <div className="mt-1.5 relative">
                <input
                  id="artwork-image-url-input"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-3.5 py-2 text-xs outline-none focus:border-primary text-on-surface pr-8"
                />
                <ImageIcon className="w-4 h-4 text-on-surface-variant absolute right-2.5 top-2.5 pointer-events-none opacity-60" />
              </div>
            )}
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
              disabled={isSubmitting || !isAuthorized}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{uploadStatusText || (artworkToEdit ? 'Updating Artwork...' : 'Publishing Artwork...')}</span>
                </>
              ) : artworkToEdit ? (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Save Changes to Artwork</span>
                </>
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
