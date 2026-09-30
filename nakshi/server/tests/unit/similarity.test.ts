import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  generateDHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  evaluateSimilarity,
  DEFAULT_SIMILARITY_THRESHOLD,
} from '../../src/utils/similarity.util';

describe('Similarity & Perceptual Hashing Engine (Requirement 2.7)', () => {
  it('should generate a 16-character hexadecimal 64-bit dHash from an image buffer', async () => {
    // Generate a simple 100x100 test image using sharp
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 164, g: 92, b: 64 }, // Terracotta
      },
    })
      .png()
      .toBuffer();

    const hash = await generateDHash(testImageBuffer);

    expect(hash).toBeDefined();
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/i.test(hash)).toBe(true);
  });

  it('should return identical hash and 100% similarity for identical images', async () => {
    const buffer1 = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 27, g: 28, b: 25 },
      },
    })
      .png()
      .toBuffer();

    const hash1 = await generateDHash(buffer1);
    const hash2 = await generateDHash(buffer1);

    expect(hash1).toBe(hash2);
    expect(calculateHammingDistance(hash1, hash2)).toBe(0);
    expect(calculateSimilarityScore(hash1, hash2)).toBe(100);

    const evaluation = evaluateSimilarity(hash1, hash2);
    expect(evaluation.isDuplicate).toBe(true);
    expect(evaluation.similarityScore).toBe(100);
  });

  it('should calculate precise Hamming distance and similarity scores', () => {
    const hashA = '0000000000000000';
    const hashB = '0000000000000001'; // 1 bit different out of 64
    const distance1 = calculateHammingDistance(hashA, hashB);
    expect(distance1).toBe(1);
    expect(calculateSimilarityScore(hashA, hashB)).toBe(98.44);

    // 12 bits different out of 64 -> (52/64) * 100 = 81.25%
    const hashC = '0000000000000fff'; // 12 bits set
    const distance12 = calculateHammingDistance(hashA, hashC);
    expect(distance12).toBe(12);
    const score12 = calculateSimilarityScore(hashA, hashC);
    expect(score12).toBe(81.25);
    expect(evaluateSimilarity(hashA, hashC).isDuplicate).toBe(true); // > 80%

    // 13 bits different out of 64 -> (51/64) * 100 = 79.69%
    const hashD = '0000000000001fff'; // 13 bits set
    const distance13 = calculateHammingDistance(hashA, hashD);
    expect(distance13).toBe(13);
    const score13 = calculateSimilarityScore(hashA, hashD);
    expect(score13).toBe(79.69);
    expect(evaluateSimilarity(hashA, hashD).isDuplicate).toBe(false); // <= 80%
  });

  it('should enforce the 80% threshold rule strictly', () => {
    // Exactly 80% threshold test
    expect(DEFAULT_SIMILARITY_THRESHOLD).toBe(80.0);

    const hashBase = '1234567890abcdef';
    // 0 difference = 100% -> duplicate
    expect(evaluateSimilarity(hashBase, hashBase, 80).isDuplicate).toBe(true);

    // All 64 bits inverted = 0% similarity -> not duplicate
    const invertedHex = (BigInt('0x' + hashBase) ^ BigInt('0xffffffffffffffff'))
      .toString(16)
      .padStart(16, '0');
    const invertedEval = evaluateSimilarity(hashBase, invertedHex, 80);
    expect(invertedEval.hammingDistance).toBe(64);
    expect(invertedEval.similarityScore).toBe(0);
    expect(invertedEval.isDuplicate).toBe(false);
  });

  it('should detect visual duplicate between an original and resized/compressed variant', async () => {
    // Create an image with visual contrast features
    const svgGradient = `
      <svg width="200" height="200">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(164,92,64);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(251,249,244);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad)" />
        <circle cx="100" cy="100" r="50" fill="rgb(27,28,25)" />
      </svg>
    `;

    const originalBuffer = await sharp(Buffer.from(svgGradient))
      .png()
      .toBuffer();

    // Slightly resized and re-encoded variant (simulating slight modification/re-upload)
    const modifiedBuffer = await sharp(originalBuffer)
      .resize(150, 150)
      .jpeg({ quality: 85 })
      .toBuffer();

    const originalHash = await generateDHash(originalBuffer);
    const modifiedHash = await generateDHash(modifiedBuffer);

    const evaluation = evaluateSimilarity(originalHash, modifiedHash);

    // Perceptual dHash is robust to resize and JPEG compression: similarity must be very high (>80%)
    expect(evaluation.similarityScore).toBeGreaterThan(80);
    expect(evaluation.isDuplicate).toBe(true);
  });
});
