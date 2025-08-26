import { escapeHtml } from '../utils/escapeHtml.js';
import { hostIP } from '../core/auth.js';

export async function renderLeaderboard(limit = 10): Promise<string> {
	const res = await fetch(`https://${hostIP}:3443/api/leaderboard?limit=${limit}`);

	if (!res.ok) {
		return `<div class="text-center text-red-500 mt-10">Failed to load leaderboard.</div>`;
	}

	const leaderboard = await res.json();

	if (leaderboard.length === 0) {
		return `<div class="text-center text-gray-400 mt-10">No data available.</div>`;
	}

	const rows = leaderboard.map((user: any, index: number) => {
		const avatarUrl = user.avatar && user.avatar.startsWith('http')
			? user.avatar
			: `https://${hostIP}:3443/api${user.avatar}`;

		return `
			<tr class="${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}">
				<td class="px-4 py-2 text-center font-semibold">${index + 1}</td>
				<td class="px-4 py-2 flex items-center space-x-3">
					<img src="${avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full border border-gray-600" />
					<span>${escapeHtml(user.alias || user.username)}</span>
				</td>
				<td class="px-4 py-2 text-center">${escapeHtml(user.username)}</td>
				<td class="px-4 py-2 text-center font-bold text-green-400">${user.wins}</td>
			</tr>
		`;
	}).join('');

	return `
		<section class="max-w-3xl mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg shadow animate-fadeIn">
			<h2 class="text-3xl font-bold mb-6 text-center text-blue-400">Leaderboard</h2>
			<table class="w-full table-auto text-left border-collapse">
				<thead>
					<tr class="bg-gray-800">
						<th class="px-4 py-2 text-center">#</th>
						<th class="px-4 py-2">Player</th>
						<th class="px-4 py-2 text-center">Username</th>
						<th class="px-4 py-2 text-center">Wins</th>
					</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>
		</section>
	`;
}

