import { showToast } from '../../utils/authUtils.js';
import { state } from '../../core/state.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { getTournamentPlayers, getTournamentById, loadTournaments, getTournamentMatches, getTournamentStatus } from '../../utils/tournamentUtils.js';
import { hostIP } from '../../core/auth.js';

export async function renderTournamentPlayersPage(tournamentId: number): Promise<string> {
	const players = await getTournamentPlayers(tournamentId);
	const tournament = await getTournamentById(tournamentId);
	const matches = await getTournamentMatches(tournamentId);
	const status = await getTournamentStatus(tournamentId);

	const currentUser = state.currentUser;

	console.log(status);

	if (!tournament) {
		return `<p class="text-red-500">Tournament not found.</p>`;
	}

	const isOwner = tournament.created_by === currentUser?.id;
	const isJoined = players.some(player => player.username === currentUser?.username);

	const tournamentStarted = matches.length > 0;

	const joinButton = !isJoined && !tournamentStarted
		? `<button id="joinTournamentBtn"
				class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white mb-4 transition">
			Join Tournament
		</button>`
		: '';

	const deleteButton = isOwner && !tournamentStarted
		? `<button id="deleteTournamentBtn"
				class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white mb-4 transition">
			Delete Tournament
		</button>`
		: '';

	const startButton = isOwner && !tournamentStarted
		? `<button id="startTournamentBtn"
				class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white mb-4 transition">
			Start Tournament
		</button>`
		: '';

	const leaveButton = isJoined && !tournamentStarted && !isOwner
		? `<button id="leaveTournamentBtn"
				class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white mb-4 transition">
			Leave Tournament
		</button>`
		: '';

	const bracketButton = tournamentStarted
		? `<div class="text-center mt-6">
				<a href="#/tournaments/${tournamentId}/bracket"
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
					Brackets
				</a>
			</div>`
		: '';

	const playerList = players.length > 0
		? players.map(player => {
			const avatarUrl = player.avatar && player.avatar.startsWith('http')
				? player.avatar
				: `https://${hostIP}:3443/api${player.avatar || '/default-avatar.png'}`;

			return `
				<section class="w-full max-w-xl mx-auto mt-4 bg-gray-800 text-gray-100 p-4 rounded-xl shadow-lg animate-fadeIn">
					<div class="flex items-center space-x-4">
						<img
							src="${avatarUrl}"
							alt="User avatar"
							class="w-12 h-12 rounded-full shadow border border-gray-600"
						/>

						<div class="flex-1">
							<p class="text-lg font-semibold text-white mb-1">
								${escapeHtml(player.alias || player.username)}
								${status.winnerId === player.user_id ? '<span class="ml-2">👑</span>' : ''}
								${tournament.created_by === player.user_id ? '<span class="ml-2">⭐</span>' : ''}
							</p>
							<a href="#/user/${player.user_id}/profile" class="text-sm text-gray-400 hover:underline">
								@${escapeHtml(player.username)}
							</a>
						</div>
					</div>
				</section>
			`;
		}).join('')
		: `<p class="text-gray-400 mt-4 text-center">No players joined yet.</p>`;

	return `
		<section class="max-w-2xl mx-auto mt-10 p-4 animate-fadeIn text-white">
			<h2 class="text-3xl font-bold mb-2">${escapeHtml(tournament.name)}</h2>

			${playerList}
			<div class="flex space-x-4 mt-4">
				${joinButton}
				${leaveButton}
				${startButton}
				${deleteButton}
				${bracketButton}
			</div>
		</section>
	`;
}

export async function setupTournamentPlayersPage(tournamentId: number): Promise<void> {
	const deleteBtn = document.getElementById('deleteTournamentBtn');
	const joinBtn = document.getElementById('joinTournamentBtn');
	const leaveBtn = document.getElementById('leaveTournamentBtn');
	const startBtn = document.getElementById('startTournamentBtn');

	if (joinBtn) {
		joinBtn.addEventListener('click', async () => {
			try {
				const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/join`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
					body: JSON.stringify({})
				});

				if (!res.ok) {
					const err = await res.json();
					showToast(err.message || 'Failed to join tournament');
					return;
				}

				showToast('Joined tournament successfully');
				location.reload();

			} catch (err) {
				console.error(err);
				showToast('Network error while joining tournament');
			}
		});
	}

	if (startBtn) {
		startBtn.addEventListener('click', async () => {
			try {
				const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/start`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});

				if (!res.ok) {
					const err = await res.json();
					showToast(err.message || 'Failed to start tournament');
					return;
				}

				showToast('Tournament started successfully');
				location.reload();

			} catch (err) {
				console.error(err);
				showToast('Network error while starting tournament');
			}
		});
	}

	if (leaveBtn) {
		leaveBtn.addEventListener('click', async () => {
			try {
				const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/leave`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});

				if (!res.ok) {
					const err = await res.json();
					showToast(err.message || 'Failed to leave tournament');
					return;
				}

				showToast('You left the tournament successfully');
				location.reload();
			} catch (err) {
				console.error(err);
				showToast('Network error while leaving tournament');
			}
		});
	}

	if (deleteBtn) {
		deleteBtn.addEventListener('click', () => {
			const overlay = document.getElementById('modal-overlay')!;
			const modalBox = document.getElementById('modal-box')!;
			const cancelBtn = document.getElementById('cancelLogout')!;
			const confirmBtn = document.getElementById('confirmLogout')!;

			modalBox.querySelector('h2')!.textContent = 'Confirm Delete';
			modalBox.querySelector('p')!.textContent = 'Are you sure you want to delete this tournament?';
			confirmBtn.textContent = 'Confirm';

			overlay.classList.remove('hidden');

			const onCancel = () => {
				overlay.classList.add('hidden');
				cleanup();
			};

			cancelBtn.onclick = onCancel;

			confirmBtn.onclick = async () => {
				try {
					const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}`, {
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${localStorage.getItem('token')}`,
						},
					});

					overlay.classList.add('hidden');
					cleanup();

					if (!res.ok) {
						const error = await res.json();
						showToast(error.message || 'Failed to delete tournament');
						return;
					}

					showToast('Tournament deleted successfully');
					state.tournaments = await loadTournaments();
					location.hash = '#/tournaments';
				} catch (err) {
					console.error(err);
					showToast('Unexpected error while deleting tournament');
					overlay.classList.add('hidden');
					cleanup();
				}
			};

			function cleanup() {
				cancelBtn.onclick = null;
				confirmBtn.onclick = null;
			}
		});
	}
}





