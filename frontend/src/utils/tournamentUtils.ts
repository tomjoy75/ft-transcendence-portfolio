import { renderTournamentPlayersPage } from '../pages/tournaments/tournamentPlayers.js';
import { Match, state, Status, Tournament, TournamentPlayer, User } from '../core/state.js';
import { showToast } from './authUtils.js';
import { hostIP } from "../core/auth.js";

const BASE = `https://${hostIP}:3443/api/tournaments`;

export async function createTournament(name: string): Promise<void> {
	const res = await fetch(`${BASE}/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
		body: JSON.stringify({ name }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Failed to create tournament');
	}
}

export async function getTournamentById(id: number): Promise<{
	started: boolean;
	id: number; name: string; status: string; created_by: number; created_at: string; type: string
} | null> {
	try {
		const res = await fetch(`${BASE}/${id}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (!res.ok) throw new Error('Failed to fetch tournaments');

		return res.json();
	} catch (err) {
		console.error(err);
		return null;
	}
}



export async function loadTournaments(): Promise<Tournament[]> {
	try {
		const res = await fetch(`${BASE}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (!res.ok) throw new Error('Failed to fetch tournaments');
		const tournaments: Tournament[] = await res.json();

		const tournamentsWithStatus = await Promise.all(tournaments.map(async (t) => {
			try {
				const matchesRes = await fetch(`${BASE}/${t.id}/matches`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				if (!matchesRes.ok) throw new Error('Failed to fetch matches');
				const matches = await matchesRes.json();
				return { ...t, started: matches.length > 0 };
			} catch {
				return { ...t, started: false };
			}
		}));

		return tournamentsWithStatus;
	} catch (err) {
		console.error(err);
		showToast('Could not load tournaments.');
		return [];
	}
}


export async function getTournamentPlayers(id: number): Promise<TournamentPlayer[]> {
	const res = await fetch(`${BASE}/${id}/players`, {
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error('Failed to fetch players');
	return res.json();
}

export async function getTournamentMatches(tournamentId: number): Promise<Match[]> {
	const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/matches`, {
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error('Failed to fetch matches');
	return res.json();
}

export async function getTournamentStatus(tournamentId: number):  Promise<Status>{
	const res = await fetch(`https://${hostIP}:3443/api/tournaments/${tournamentId}/status`, {
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error('Failed to fetch touranment status');
	return res.json();
}


export async function getUserById(userId: number): Promise<User | null> {
	if (!userId) return null;

	try {
		const res = await fetch(`https://${hostIP}:3443/api/user/id/${userId}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (!res.ok) return null;

		const user: User = await res.json();
		return user;
	} catch (err) {
		console.error('Failed to fetch user by id', err);
		return null;
	}
}

export async function getUserByUsername(username: string): Promise<User | null> {
	if (!username) return null;

	try {
		const res = await fetch(`https://${hostIP}:3443/api/user/username/${username}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (!res.ok) return null;

		const user: User = await res.json();
		return user;
	} catch (err) {
		console.error('Failed to fetch user by id', err);
		return null;
	}
}


