<script lang="ts">
</script>

<div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-6 py-12">
        <!-- Hero Section -->
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-6">Eval Guesser</h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Master chess evaluation with real-time Stockfish analysis. Test your positional understanding and improve your chess skills.
            </p>
        </div>

        <!-- Main Actions -->
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <!-- Analysis Board Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                        <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Analysis Board</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Analyze any position with deep Stockfish evaluation and explore variations
                    </p>
                    <a
                        href="/analysis"
                        class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Open Analysis Board
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Eval Guesser Game Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                        <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Play Eval Guesser</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Test your evaluation skills by guessing the computer's assessment
                    </p>
                    <button
                        disabled
                        class="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium opacity-75"
                    >
                        Coming Soon
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Example Positions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Try These Example Positions
            </h3>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                    href="/analysis?fen=r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">Italian Game</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Classic opening position</p>
                </a>
                <a
                    href="/analysis?fen=r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">Four Knights</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Symmetrical development</p>
                </a>
                <a
                    href="/analysis?fen=rnbqkb1r/pp2pppp/3p1n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 4"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">Pirc Defense</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Hypermodern opening</p>
                </a>
                <a
                    href="/analysis?fen=r1bqkbnr/pppp1ppp/2n5/8/3pP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 4"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">Scotch Game</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Open center position</p>
                </a>
                <a
                    href="/analysis?fen=rnbqk2r/pppp1ppp/4pn2/2b5/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 4 4"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">Queen's Gambit</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Classical chess opening</p>
                </a>
                <a
                    href="/analysis?fen=6k1/5p2/6p1/8/7P/8/5PP1/6K1 b - - 0 1"
                    class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <p class="font-medium text-gray-900 dark:text-white mb-1">King & Pawn Endgame</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Test endgame knowledge</p>
                </a>
            </div>
        </div>
    </div>
</div>


