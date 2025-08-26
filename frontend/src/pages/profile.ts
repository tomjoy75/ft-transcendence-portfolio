import { escapeHtml } from '../utils/escapeHtml.js';
import { state } from '../core/state.js';
import { hostIP } from '../core/auth.js';

export async function renderFullProfile(container: HTMLElement) {
  const user = state.currentUser;
  if (!user) {
    container.innerHTML = `<div class="text-center text-red-400 mt-10">No user data available.</div>`;
    return;
  }
  
  container.innerHTML = renderProfile();
  
  const historyHtml = await renderMatchHistory(user.username);
  container.innerHTML += historyHtml;
}

export function renderProfile(): string {
	const user = state.currentUser;

	if (!user) {
		return `<div class="text-center text-red-400 mt-10">No user data available.</div>`;
	}

	const avatarUrl = user.avatar && user.avatar.startsWith('http')
		? user.avatar
		: `https://${hostIP}:3443/api${user.avatar}`;

	return `
		<section class="w-full max-w-xl mx-auto mt-10 bg-gray-800 text-gray-100 p-6 rounded-xl shadow-lg animate-fadeIn">
			<div class="flex flex-col items-center">
				<img
					src="${avatarUrl}"
					alt="User avatar"
					class="w-20 h-20 rounded-full shadow mb-4 border border-gray-600"
				/>

				<p class="text-2xl font-bold text-white mb-1">${escapeHtml(user.alias || user.username)}</p>
				<p class="text-gray-400 text-sm mb-6">@${escapeHtml(user.username)}</p>

				<div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm w-full">
					<div class="text-gray-400 font-semibold">Email:</div>
					<div class="text-white">${escapeHtml(user.email) || '<i class="text-gray-500">Not set</i>'}</div>
					<div class="text-gray-400 font-semibold">Status:</div>
					<div class="text-green-400">Online</div>
				</div>
			</div>
		</section>
	`;
}

export async function renderMatchHistory(username: string): Promise<string> {
	
	const token = localStorage.getItem('token');
	const res = await fetch(`https://${hostIP}:3443/api/matches/history/${encodeURIComponent(username)}`, {
		headers: {
			Authorization: token ? `Bearer ${token}` : '',
		},
	});

	if (!res.ok) {
		return `<div class="text-red-500 mt-6">Failed to load match history.</div>`;
	}

	const matches = await res.json();

	if (matches.length === 0) {
		return `<div class="mt-6 text-gray-400">User have not played any matches yet.</div>`;
	}

	const rows = matches.map((m: any) => {
		const date = new Date(m.date).toLocaleString();
		return `
			<tr>
				<td class="border px-2 py-1">${escapeHtml(m.opponent)}</td>
				<td class="border px-2 py-1">${m.you_won ? '<span class="text-green-500 font-semibold">Win</span>' : '<span class="text-red-500 font-semibold">Loss</span>'}</td>
				<td class="border px-2 py-1">${m.score}</td>
				<td class="border px-2 py-1">${date}</td>
				<td class="border px-2 py-1">${m.tournament_id ? `<a href="#/tournaments/${m.tournament_id}/bracket" class="text-blue-400 underline">Tournament</a>` : 'Free'}</td>
			</tr>
		`;
	}).join('');

	return `
		<section class="max-w-xl mx-auto mt-8 p-4 bg-gray-900 text-gray-100 rounded-lg shadow-lg animate-fadeIn">
			<h3 class="text-xl font-bold mb-4">Match History</h3>
			<table class="w-full table-auto text-left border-collapse">
				<thead>
					<tr>
						<th class="border px-2 py-1">Opponent</th>
						<th class="border px-2 py-1">Result</th>
						<th class="border px-2 py-1">Score</th>
						<th class="border px-2 py-1">Date</th>
						<th class="border px-2 py-1">Type</th>
					</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>
		</section>
	`;
}


