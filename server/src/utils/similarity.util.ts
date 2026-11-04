import sharp from 'sharp';

export interface SimilarityResult {
  hash1: string;
  hash2: string;
  hammingDistance: number;
  similarityScore: number; // 0 to 100
  isDuplicate: boolean;
}

export const DEFAULT_SIMILARITY_THRESHOLD = 80.0;

/**
 * Generates a 64-bit perceptual difference hash (dHash) from an image buffer or file path.
 * 
 * Algorithm:
 * 1. Resize to 9x8 pixels (grayscale), removing color and high frequencies.
 * 2. Compare adjacent horizontal pixels (9 per row yields 8 comparisons per row = 64 bits total).
 * 3. Convert 64 bits to a 16-character hexadecimal string.
 */
export async function generateDHash(input: Buffer | string): Promise<string> {
  const { data } = await sharp(input)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let binary = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const leftPixel = data[row * 9 + col];
      const rightPixel = data[row * 9 + (col + 1)];
      binary += leftPixel > rightPixel ? '1' : '0';
    }
  }

  // Convert 64-bit binary string into 16-character hex string
  const hashHex = BigInt('0b' + binary).toString(16).padStart(16, '0');
  return hashHex;
}

/**
 * Generates a set of 16-character perceptual sub-hashes across standardized
 * spatial sub-windows (quadrants, center crop, and multi-scale tiles) to enable
 * crop-resilient duplicate detection without full image re-extraction.
 */
export async function generateSubHashes(input: Buffer | string): Promise<string[]> {
  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || meta.width < 30 || meta.height < 30) {
      return [];
    }

    const width = meta.width;
    const height = meta.height;
    const subHashes: string[] = [];

    // Spatial sub-windows (Center 75%, 4 quadrants, and 4 mid-edge crops)
    const subWindows = [
      // Center 75%
      { left: Math.round(width * 0.125), top: Math.round(height * 0.125), w: Math.round(width * 0.75), h: Math.round(height * 0.75) },
      // 4 Quadrants (70% coverage each with center overlap)
      { left: 0, top: 0, w: Math.round(width * 0.7), h: Math.round(height * 0.7) },
      { left: Math.round(width * 0.3), top: 0, w: Math.round(width * 0.7), h: Math.round(height * 0.7) },
      { left: 0, top: Math.round(height * 0.3), w: Math.round(width * 0.7), h: Math.round(height * 0.7) },
      { left: Math.round(width * 0.3), top: Math.round(height * 0.3), w: Math.round(width * 0.7), h: Math.round(height * 0.7) },
      // 4 Mid-edges (75% x 75%)
      { left: Math.round(width * 0.125), top: 0, w: Math.round(width * 0.75), h: Math.round(height * 0.75) },
      { left: Math.round(width * 0.125), top: Math.round(height * 0.25), w: Math.round(width * 0.75), h: Math.round(height * 0.75) },
      { left: 0, top: Math.round(height * 0.125), w: Math.round(width * 0.75), h: Math.round(height * 0.75) },
      { left: Math.round(width * 0.25), top: Math.round(height * 0.125), w: Math.round(width * 0.75), h: Math.round(height * 0.75) },
    ];

    for (const win of subWindows) {
      try {
        const subBuf = await sharp(input)
          .extract({ left: win.left, top: win.top, width: win.w, height: win.h })
          .toBuffer();
        const subHash = await generateDHash(subBuf);
        subHashes.push(subHash);
      } catch {
        // skip invalid window
      }
    }

    return subHashes;
  } catch {
    return [];
  }
}

/**
 * Computes the Hamming distance between two 16-character hexadecimal dHash strings.
 * Counts differing bits using bitwise XOR.
 */
export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== 16 || hash2.length !== 16) {
    throw new Error('Both hashes must be 16-character hexadecimal strings (64 bits).');
  }

  let xor = BigInt('0x' + hash1) ^ BigInt('0x' + hash2);
  let distance = 0;

  while (xor > 0n) {
    if (xor & 1n) {
      distance++;
    }
    xor >>= 1n;
  }

  return distance;
}

/**
 * Calculates similarity percentage between two hashes.
 * Formula: ((64 - distance) / 64) * 100
 */
export function calculateSimilarityScore(hash1: string, hash2: string): number {
  const distance = calculateHammingDistance(hash1, hash2);
  const score = ((64 - distance) / 64) * 100;
  return Math.round(score * 100) / 100;
}

/**
 * Evaluates whether two hashes exceed the similarity threshold (default 80%).
 * Per Requirement 2.7: scores exceeding 80% route to moderation review.
 */
export function evaluateSimilarity(
  hash1: string,
  hash2: string,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): SimilarityResult {
  const hammingDistance = calculateHammingDistance(hash1, hash2);
  const similarityScore = calculateSimilarityScore(hash1, hash2);
  const isDuplicate = similarityScore > threshold;

  return {
    hash1,
    hash2,
    hammingDistance,
    similarityScore,
    isDuplicate,
  };
}

/**
 * Crop-aware perceptual similarity evaluator.
 * Compares two image inputs (buffers or file paths) by evaluating both global dHash
 * and multi-scale spatial sub-window dHashes to detect cropped, zoomed, or detail variants.
 * 
 * If either image is a cropped subset (e.g. 50%–90% crop) of the other, returns a score > 80%.
 */
export async function calculateCropAwareSimilarity(
  inputA: Buffer | string,
  inputB: Buffer | string,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<number> {
  const hashA = await generateDHash(inputA);
  const hashB = await generateDHash(inputB);
  let maxScore = calculateSimilarityScore(hashA, hashB);

  // Fast path: If global similarity already indicates a duplicate, return immediately
  if (maxScore > threshold) {
    return maxScore;
  }

  try {
    const [metaA, metaB] = await Promise.all([
      sharp(inputA).metadata(),
      sharp(inputB).metadata(),
    ]);

    if (!metaA.width || !metaA.height || !metaB.width || !metaB.height) {
      return maxScore;
    }

    const areaA = metaA.width * metaA.height;
    const areaB = metaB.width * metaB.height;

    // Designate the larger image as container and smaller image as target
    const [largeInput, largeMeta, smallHash, smallMeta] = areaA >= areaB
      ? [inputA, metaA, hashB, metaB]
      : [inputB, metaB, hashA, metaA];

    const lWidth = largeMeta.width!;
    const lHeight = largeMeta.height!;
    const sWidth = smallMeta.width!;
    const sHeight = smallMeta.height!;

    const targetRatio = sWidth / sHeight;
    const scales = [0.9, 0.82, 0.75, 0.67, 0.58, 0.5];
    const steps = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];

    for (const scale of scales) {
      let subW = Math.round(lWidth * scale);
      let subH = Math.round(subW / targetRatio);

      if (subH > lHeight) {
        subH = Math.round(lHeight * scale);
        subW = Math.round(subH * targetRatio);
      }

      if (subW < 20 || subH < 20 || subW > lWidth || subH > lHeight) continue;

      const maxLeft = lWidth - subW;
      const maxTop = lHeight - subH;

      for (const sx of steps) {
        const left = Math.round(maxLeft * sx);
        for (const sy of steps) {
          const top = Math.round(maxTop * sy);
          try {
            const subBuf = await sharp(largeInput)
              .extract({ left, top, width: subW, height: subH })
              .toBuffer();
            const subHash = await generateDHash(subBuf);
            const score = calculateSimilarityScore(subHash, smallHash);
            if (score > maxScore) {
              maxScore = score;
              if (maxScore > threshold) {
                return maxScore;
              }
            }
          } catch {
            // skip out of bounds extraction
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Similarity] Crop-aware evaluation encountered an error, falling back to global hash:', err);
  }

  return maxScore;
}

/**
 * Evaluates similarity with crop-awareness, returning a structured SimilarityResult.
 */
export async function evaluateSimilarityWithCrops(
  inputA: Buffer | string,
  inputB: Buffer | string,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<SimilarityResult> {
  const hash1 = await generateDHash(inputA);
  const hash2 = await generateDHash(inputB);
  const similarityScore = await calculateCropAwareSimilarity(inputA, inputB, threshold);
  const hammingDistance = calculateHammingDistance(hash1, hash2);
  const isDuplicate = similarityScore > threshold;

  return {
    hash1,
    hash2,
    hammingDistance,
    similarityScore,
    isDuplicate,
  };
}
