import { loadTournaments } from '../../utils/tournamentUtils.js';
import { state, Tournament } from '../../core/state.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { showToast } from '../../utils/authUtils.js';

export function renderTournamentsPage(): string {
	return `
		<section class="max-w-3xl mx-auto mt-10 text-white">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-2xl font-bold">Tournaments</h2>
				<a href="#/tournaments/create" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition animate-fadeIn">
					Create Tournament
				</a>
			</div>
			<ul id="tournamentList" class="space-y-4"></ul>
		</section>
	`;
}

export async function setupTournamentsPage(): Promise<void> {
	const list = document.getElementById('tournamentList');
	if (!list) return;

	let tournaments: Tournament[] = [];

	try {
		tournaments = await loadTournaments();
		state.tournaments = tournaments;
	} catch (err) {
		showToast('Failed to load tournaments');
		return;
	}

	list.innerHTML = tournaments.map(t => {
		const statusClass = t.status === 'started' ? 'text-red-500' : 'text-green-400';
		return `
			<li class="bg-gray-800 p-4 rounded shadow flex justify-between items-center animate-fadeIn">
				<div>
					<p class="text-lg font-semibold">
						${escapeHtml(t.name)}
						<span class="text-sm ml-2 ${statusClass}">(${escapeHtml(t.status)})</span>
					</p>
					<p class="text-sm text-gray-400">Created at: ${new Date(t.created_at).toLocaleString()}</p>
				</div>
				<a href="#/tournaments/${t.id}/players" class="text-blue-400 hover:underline">View</a>
			</li>
		`;
	}).join('');
}

