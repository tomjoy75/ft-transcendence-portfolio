import { escapeHtml } from '../utils/escapeHtml.js';
import { state } from '../core/state.js';

export function renderHome(): string {
	const username = state.currentUser?.username || 'Unknown';

	return `
	<section class="max-w-4xl mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg shadow-lg animate-fadeIn">
		<h1 class="text-4xl font-bold text-blue-400 mb-4 text-center">Welcome, ${escapeHtml(username)}!</h1>
		<p class="text-gray-300 text-center mb-8">
			Dive into online tournaments, challenge your friends, and track your progress in real-time.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition animate-fadeIn delay-100">
				<h2 class="text-xl font-semibold text-blue-400 mb-2">🏓 Pong Arena</h2>
				<p class="text-gray-300 text-sm">Play classic Pong with global players. Climb the leaderboard and earn rewards.</p>
				<div class="mt-4 text-center">
					<a href="#/pong" class="inline-block px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition">
						▶️ Play Pong
					</a>
				</div>
			</div>

			<div class="bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition animate-fadeIn delay-300">
				<h2 class="text-xl font-semibold text-purple-400 mb-2">📊 Leaderboard</h2>
				<p class="text-gray-300 text-sm">Check out the top players and their wins!</p>
				<div class="mt-4 text-center">
					<a href="#/leaderboard" class="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
						📈 View Leaderboard
					</a>
				</div>
			</div>
		</div>

		<div class="text-center mt-6">
			<a href="#/profile" class="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
				Go to your profile →
			</a>
		</div>
	</section>
	`;
}






  
  