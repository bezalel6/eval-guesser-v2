import type { PageServerLoad } from './$types';
import type { FEN } from '$lib/types/chess';

export const load: PageServerLoad = async ({ url }) => {
  // Default to starting position
  const fen: FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return {
    fen
  };
};