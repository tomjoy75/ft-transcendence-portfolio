export type User = {
	id: number;
	username: string;
	alias: string; 
	token?: string; 
	email: string; 
	avatar?: string;
}

export interface Status {
	totalMatches: number;
	finishedMatches: number;
	status: string;
	winnerId: number;
}

export interface Tournament {
	id: number;
	name: string;
	started: boolean;
	status: string;
	created_by: number;
	created_at: string;
	type: string;
}

export interface Match {
	id: number;
	round: number;
	position: number;
	winner_id: number | null;
	player1_score: number | null;
	player2_score: number | null;
	tournament_id: number;
	player1_id: number;
	player2_id: number;
	parent_match1_id: number;
	parent_match2_id: number;
	is_bye: boolean;
}

export interface TournamentPlayer {
	user_id: number;
	tournament_id: number;
	username: string;
	avatar: string;
	alias: string;
	score: number;
}

export interface MatchInfo {
	id: number;
	date: string;
	player1: {
		username: string;
		avatar: string;
		alias: string;
		score: number | null;
	};
	player2: {
		username: string;
		avatar: string;
		alias: string;
		score: number | null;
	};
	winner: string | null;
	round: number;
	tournamentId: number | null;
	type: string | null;
	position: number;
	parent_match1_id: number | null;
	parent_match2_id: number | null;
	is_bye: boolean;
}

const savedUserRaw = localStorage.getItem('currentUser');
let savedUser: User | null = null;

try {
  if (savedUserRaw) {
    savedUser = JSON.parse(savedUserRaw);
  }
} catch {
  localStorage.removeItem('currentUser');
  savedUser = null;
}

export const state = {
  isLoggedIn: !!savedUser,
  currentUser: savedUser,
  friends: [] as User[],
  tournaments: [] as Tournament[],
};

export function login(id: number, username: string, alias: string, email: string, avatar: string, token: string): void {
	const user = { id, username, alias, email, avatar, token };
	state.isLoggedIn = true;
	state.currentUser = user;
	localStorage.setItem('token', token);
	localStorage.setItem('currentUser', JSON.stringify(user));
}


export function clearUserState(): void {
	console.log('clearUserState called — before:', state.isLoggedIn, state.currentUser);
	state.isLoggedIn = false;
	state.currentUser = null;
	localStorage.removeItem('currentUser');
	console.log('clearUserState called — after:', state.isLoggedIn, state.currentUser);
}

export function getLoginStatus(): boolean {
	return state.isLoggedIn;
}

export function getCurrentUser(): User | null {
	return state.currentUser;
}

export function getToken(): string | null {
	return state.currentUser?.token ?? null;
}
