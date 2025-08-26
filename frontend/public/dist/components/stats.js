import { state } from '../core/state.js';
export function renderStats() {
    const user = state.currentUser;
    if (!user) {
        return `<div class="text-center text-red-500 mt-10">No user data available.</div>`;
    }
    return `
		<section class="max-w-2xl mx-auto mt-10 bg-gray-900 text-white p-6 rounded-lg shadow animate-fadeIn">
			<h2 class="text-3xl font-bold mb-6 text-center text-blue-400">Player Stats</h2>

			<div class="grid grid-cols-2 gap-4 text-gray-300 text-lg">
				<div class="font-semibold">Alias:</div>
				<div>${user.alias || '-'}</div>

				<div class="font-semibold">Username:</div>
				<div class="text-gray-400">${user.username}</div>

				<div class="font-semibold">Games Played:</div>
				<div>—</div>

				<div class="font-semibold">Wins:</div>
				<div>—</div>

				<div class="font-semibold">Draws:</div>
				<div>—</div>

				<div class="font-semibold">Favorite Game:</div>
				<div>—</div>
			</div>

			<div class="text-center mt-8">
				<a href="#/home" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition">
					← Back to Home
				</a>
			</div>
		</section>
	`;
}
