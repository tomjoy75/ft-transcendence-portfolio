import { Match, TournamentPlayer, User, getCurrentUser, Tournament } from '../../core/state.js';
import { hostIP } from '../../core/auth.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { getTournamentMatches, getUserById, getTournamentById, getTournamentStatus } from '../../utils/tournamentUtils.js';

export async function renderTournamentBracket(tournamentId: number): Promise<string> {
	const token = localStorage.getItem('token') ?? '';
	const status = await getTournamentStatus(tournamentId);

	const [playersRes] = await Promise.all([
		fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/players`, {
			headers: { Authorization: `Bearer ${token}` },
		}),
	]);

	if (!playersRes.ok) {
		return '<div class="text-red-500 p-4">Failed to load tournament players</div>';
	}
	const players: TournamentPlayer[] = await playersRes.json();

	let matches: Match[];
	try {
		matches = await getTournamentMatches(tournamentId);
	} catch {
		return '<div class="text-red-500 p-4">Failed to load tournament matches</div>';
	}

	const winnerIds = Array.from(new Set(matches.map(m => m.winner_id).filter(id => id !== null))) as number[];
	const winnerUsers: (User | null)[] = await Promise.all(winnerIds.map(id => getUserById(id)));

	const winnerIdToUsername = new Map<number, string>();
	winnerIds.forEach((id, i) => {
		const user = winnerUsers[i];
		if (user) winnerIdToUsername.set(id, user.username);
	});

	const tournament: Tournament | null = await getTournamentById(tournamentId);
	const currentUser: User | null = getCurrentUser();
	let currentUserMatchId: number | undefined = undefined;
	let showStartButton: boolean = false;

	let winnerHtml = '';
	if (status.status === 'finished' && status.winnerId) {
		const winnerPlayer = players.find(p => p.user_id === status.winnerId);
		if (winnerPlayer) {
			winnerHtml = `
				<div class="mb-6 p-4 bg-yellow-700 text-white rounded text-center font-semibold">
					Tournament finished, the winner is: 
					<a href="#/user/${winnerPlayer.user_id}/profile" class="underline hover:text-yellow-300">
						${escapeHtml(winnerPlayer.alias)}
					</a>
				</div>
			`;
		}
	}


	if (currentUser && tournament)
	{
		const isLocalTournament: boolean = tournament.type === 'local';
		const isHost: boolean = tournament.created_by === currentUser.id;
		let availableMatch: Match | undefined = undefined;

		if (isLocalTournament && isHost)
		{
			availableMatch = matches.find(match =>
				match.winner_id === null &&
				match.player1_id !== null &&
				match.player2_id !== null
			);
		}
		else if (!isLocalTournament)
		{
			availableMatch = matches.find(match => 
				(match.player1_id === currentUser.id || match.player2_id === currentUser.id) &&
				match.winner_id === null &&
				match.player1_id !== null &&
				match.player2_id !== null
			);
		}

		if (availableMatch)
		{
			currentUserMatchId = availableMatch.id;
			showStartButton = true;
		}
	}

	return `
		<div class="p-6">
			<h2 class="text-2xl font-bold mb-4">Tournament bracket</h2>
			
			${winnerHtml}
			
			${renderBracketHtml(matches, players, winnerIdToUsername)}

			<div class="mt-8 flex justify-center gap-4">
				<a 
					href="#/tournaments/${tournamentId}/players" 
					class="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition animate-fadeIn"
				>
					← Back to Players List
				</a>
				${showStartButton ? `
					<a 
						href="#/pong/${currentUserMatchId}"
						class="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition animate-fadeIn"
					>
						Start tournament game
					</a>
				` : ''}
			</div>
		</div>
	`;
}


export function renderBracketHtml(
	matches: Match[], 
	players: TournamentPlayer[],
	winnerIdToUsername: Map<number, string>
): string {

	const filteredMatches = matches.filter(match => !match.is_bye);

	const matchesById = new Map<number, Match>();
	for (const match of matches) {
		matchesById.set(match.id, match);
	}

	const getDisplayAliasOrParentMatch = (match: Match, playerNumber: 1 | 2) => {
		const playerId = playerNumber === 1 ? match.player1_id : match.player2_id;
		if (playerId) {
			const player = players.find(p => p.user_id === playerId);
			return player?.alias || 'Unknown';
		} else {
			const parentMatchId = playerNumber === 1 ? match.parent_match1_id : match.parent_match2_id;
			if (parentMatchId) return `From match #${parentMatchId}`;
			return 'TBD';
		}
	};

	const rounds: Record<number, Match[]> = {};
	for (const match of filteredMatches) {
		if (!rounds[match.round]) rounds[match.round] = [];
		rounds[match.round].push(match);
	}

	const sortedRounds = Object.entries(rounds)
		.map(([roundNumber, roundMatches]): [number, Match[]] => [
			Number(roundNumber),
			roundMatches.sort((a,b) => a.position - b.position)
		])
		.sort((a, b) => a[0] - b[0]);

	const calculateY = (match: Match): number => {
		const parent1 = match.parent_match1_id ? matchesById.get(match.parent_match1_id) : null;
		const parent2 = match.parent_match2_id ? matchesById.get(match.parent_match2_id) : null;

		if (parent1 || parent2) {
			const y1 = parent1 ? getY(parent1.round, parent1.position) : null;
			const y2 = parent2 ? getY(parent2.round, parent2.position) : null;

			if (y1 !== null && y2 !== null) {
				return (y1 + y2) / 2;
			}
			if (y1 !== null) return y1;
			if (y2 !== null) return y2;
		}

		return getY(match.round, match.position);
	};

	const blockHeight = 80;
	const gapBetweenMatches = 40;
	const roundTopOffset = 16;

	const getY = (_round: number, position: number) =>
		roundTopOffset + position * (blockHeight + gapBetweenMatches);

	return `
		<style>
			.bracket-container {
				display: flex;
				gap: 32px;
				overflow-x: auto;
				padding-bottom: 60px;
				min-height: 600px;
			}
			.round-column {
				position: relative;
				min-width: 220px;
			}
			.round-column h3 {
				padding: 8px 12px;
				background: #1f2937;
				border-radius: 8px;
				margin-bottom: 0;
				font-size: 1.2em;
				user-select: none;
				height: 40px;
				line-height: 40px;
				display: flex;
				align-items: center;
				justify-content: center;
				text-align: center;
			}

			.matches-wrapper {
				position: relative;
				padding-top: 16px;
				height: calc(100% - 40px);
			}
			.match-block {
				position: absolute;
				width: 200px;
				height: ${blockHeight}px;
				background: #374151;
				color: white;
				padding: 8px 12px;
				border-radius: 12px;
				box-shadow: 0 0 8px rgb(0 0 0 / 0.3);
				user-select: none;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			}
			.player {
				display: flex;
				justify-content: space-between;
				font-weight: 500;
				margin-bottom: 6px;
			}
			.player.winner {
				color: #22c55e;
				font-weight: 700;
			}
			.match-id {
				font-size: 0.7em;
				color: #9ca3af;
				text-align: right;
				user-select: text;
			}
		</style>

		<div class="bracket-container animate-fadeIn" style="height: ${Math.max(...Object.values(rounds).map(r => r.length)) * (blockHeight + gapBetweenMatches)}px">
			${sortedRounds.map(([roundNum, roundMatches]) => `
				<div class="round-column" style="height: 100%; position: relative;">
					<h3 class="text-center mb-6 font-semibold text-white">Round ${roundNum}</h3>
					<div class="matches-wrapper">
						${roundMatches.map(match => {
							const y = calculateY(match);
							const p1Alias = getDisplayAliasOrParentMatch(match, 1);
							const p2Alias = getDisplayAliasOrParentMatch(match, 2);

							const winnerP1 = match.winner_id === match.player1_id;
							const winnerP2 = match.winner_id === match.player2_id;

							const hasParent = match.round > 1;

							return `
								<div
									class="match-block"
									style="top: ${y}px"
									data-match-id="${match.id}"
								>
									<div class="player ${winnerP1 ? 'winner' : ''}">
										<span class="player1-name">${escapeHtml(p1Alias)}</span>
										<span class="player1-score">${match.player1_score !== null ? match.player1_score : '-'}</span>
									</div>
									<div class="player ${winnerP2 ? 'winner' : ''}">
										<span class="player2-name">${escapeHtml(p2Alias)}</span>
										<span class="player2-score">${match.player2_score !== null ? match.player2_score : '-'}</span>
									</div>
									<div class="match-id">Match ID: ${match.id}</div>
								</div>
							`;
						}).join('')}
					</div>
				</div>
			`).join('')}
		</div>
	`;
}







