import type { PageServerLoad } from './$types';
import type { FEN } from '$lib/types/chess';

// Default starting position
const DEFAULT_FEN: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Basic FEN validation
function isValidFEN(fen: string): boolean {
  // Basic FEN format check (not comprehensive but covers common cases)
  const fenRegex = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[wb]\s[KQkq-]+\s[a-h1-8-]+\s\d+\s\d+$/;
  return fenRegex.test(fen);
}

export const load: PageServerLoad = async ({ url }) => {
  // Get FEN from query parameter
  const fenParam = url.searchParams.get('fen');

  let fen: FEN = DEFAULT_FEN;
  let error: string | null = null;

  if (fenParam) {
    // Decode the FEN (it might be URL-encoded)
    const decodedFen = decodeURIComponent(fenParam);

    if (isValidFEN(decodedFen)) {
      fen = decodedFen as FEN;
    } else {
      error = 'Invalid FEN provided. Using default starting position.';
    }
  }

  return {
    fen,
    error,
    isCustomPosition: fenParam !== null && error === null
  };
};