// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { FEN } from '$lib/types/chess';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		// interface Locals {}
		interface PageData {
			fen?: FEN;
		}
		// interface PageState {}
		// interface Platform {}
	}

	// Declare Stockfish worker global types
	interface Window {
		stockfish?: Worker;
	}
}

export {};
