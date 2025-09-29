import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  // Optional: Load initial position from query params
  const fenParam = url.searchParams.get('fen');
  const colorParam = url.searchParams.get('color') || 'white';
  const levelParam = url.searchParams.get('level') || '10'; // Stockfish strength 1-20

  // Default starting position
  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return {
    fen: fenParam || defaultFen,
    playerColor: colorParam as 'white' | 'black',
    computerLevel: parseInt(levelParam, 10)
  };
};