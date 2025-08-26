import { state } from "../../core/state.js";
import { showToast } from "../../utils/authUtils.js";
import { createTournament } from "../../utils/tournamentUtils.js";
import { hostIP } from "../../core/auth.js";

export function renderCreateTournamentPage(): string {
	return `
		<section class="max-w-xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded shadow animate-fadeIn">
			<h2 class="text-2xl font-bold mb-4">Create Tournament</h2>
			<form id="createTournamentForm" class="space-y-4">
				<input
					type="text"
					name="name"
					id="tournamentName"
					placeholder="Tournament name"
					class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
					required
					minlength="3"
				>

				<div class="relative">
					<label for="tournamentType" class="block mb-1">Type
					</label>
					<select
						name="type"
						id="tournamentType"
						class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
						required
					>
						<option value="local">Local</option>
						<option value="remote">Remote</option>
					</select>
				</div>

				<button
					type="submit"
					class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition"
				>
					Create
				</button>
			</form>
		</section>
	`;
}

export function setupCreateTournamentPage(): void {
	const form = document.getElementById('createTournamentForm') as HTMLFormElement;
	const nameInput = document.getElementById('tournamentName') as HTMLInputElement;
	const typeSelect = document.getElementById('tournamentType') as HTMLSelectElement;

	if (!form || !nameInput || !typeSelect) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const name = nameInput.value.trim();
		const type = typeSelect.value;

		if (!name || name.length < 3) {
			showToast('Tournament name must be at least 3 characters');
			return;
		}

		try {
			const res = await fetch(`https://${hostIP}:3443/api/tournaments/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({ name, type })
			});

			if (!res.ok) {
				const error = await res.json();
				showToast(error.message || 'Failed to create tournament');
				return;
			}

			state.tournaments = [];

			const data = await res.json();
			const tournamentId = data.tournament_id;

			const joinRes = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/join`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({})
			});

			if (!joinRes.ok) {
				const error = await joinRes.json();
				console.warn('Failed to join tournament as creator:', error.message);
				showToast('Tournament created, but failed to join as player');
			} else {
				showToast('Tournament created and joined successfully');
				location.hash = `#/tournaments/${tournamentId}/players`;
			}

		} catch (err: any) {
			console.error(err);
			showToast('Unexpected error while creating tournament');
		}
	});
}

