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
