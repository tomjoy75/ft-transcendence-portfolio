import { escapeHtml } from 'utils/escapeHtml.js';
import { state } from '../../core/state.js';

export function renderTournamentList(): string {
	if (state.tournaments.length === 0) {
		return `<p class="text-gray-400">No tournaments found.</p>`;
	}

	return `
		<ul class="space-y-4">
			${state.tournaments.map(t => `
				<li class="p-4 bg-gray-700 rounded flex justify-between items-center">
					<div>
						<p class="font-semibold text-lg">${escapeHtml(t.name)}</p>
						<p class="text-sm text-gray-300">
							Created at: ${new Date(t.created_at).toLocaleString()}
						</p>
						<p class="text-sm text-gray-400 mt-1">
							Type: <span class="uppercase font-mono ${t.type === 'remote' ? 'text-blue-400' : 'text-green-400'}">
								${t.type}
							</span>
						</p>
					</div>
					<a href="#/tournaments/${t.id}" class="text-blue-400 hover:underline">View</a>
				</li>
			`).join('')}
		</ul>
	`;
}

