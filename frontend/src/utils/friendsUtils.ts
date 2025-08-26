import { state, User } from '../core/state.js';
import { showToast } from './authUtils.js';
import { hostIP } from "../core/auth.js";

const BASE = `https://${hostIP}:3443/api/friends`;

export async function loadFriends(): Promise<void> {
	try {
		const res = await fetch(`${BASE}/list`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (!res.ok) throw new Error('Failed to fetch friends');
		const friends = await res.json();
		state.friends = friends;
	} catch (err) {
		console.error(err);
		showToast('Could not load friends.');
	}
}

export async function getPendingRequests(): Promise<User[]> {
	const res = await fetch(`${BASE}/pending`, {
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error('Failed to fetch pending requests');
	return await res.json();
}

export async function acceptFriend(username: string): Promise<void> {
	const res = await fetch(`${BASE}/accept/${encodeURIComponent(username)}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error(`Failed to accept ${username}`);
}

export async function declineFriend(username: string): Promise<void> {
	const res = await fetch(`${BASE}/decline/${encodeURIComponent(username)}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	});
	if (!res.ok) throw new Error(`Failed to decline ${username}`);
}

export function setupPendingRequestsHandlers(): void {
	document.querySelectorAll('.accept-btn').forEach((btn) => {
		btn.addEventListener('click', async () => {
			const username = (btn as HTMLElement).dataset.username;
			if (!username) return;

			try {
				await acceptFriend(username);
				btn.closest('li')?.remove();
				showToast(`Accepted ${username}`);
			} catch (err) {
				console.error(err);
				showToast(`Failed to accept ${username}`);
			}
		});
	});

	document.querySelectorAll('.decline-btn').forEach((btn) => {
		btn.addEventListener('click', async () => {
			const username = (btn as HTMLElement).dataset.username;
			if (!username) return;

			try {
				await declineFriend(username);
				btn.closest('li')?.remove();
				showToast(`Declined ${username}`);
			} catch (err) {
				console.error(err);
				showToast(`Failed to decline ${username}`);
			}
		});
	});
}

export function setupAddFriendForm(): void {
	const form = document.getElementById('addFriendForm') as HTMLFormElement;
	if (!form) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const input = form.friendUsername as HTMLInputElement;
		const username = input.value.trim();
		if (!username) {
			showToast('Please enter a username');
			return;
		}

		try {
			const res = await fetch(`${BASE}/request/${encodeURIComponent(username)}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			const data = await res.json();
			if (!res.ok) {
				showToast(data?.error?.message || `Error: ${res.status}`);
				return;
			}

			showToast(`Friend request sent to ${username}`);
			form.reset();
		} catch (err) {
			console.error(err);
			showToast('Network error while sending friend request');
		}
	});
}


export function setupRemoveFriendButtons(): void {
	const buttons = document.querySelectorAll('button.removeBtn');

	buttons.forEach((btn) => {
		const li = btn.closest('li') as HTMLLIElement;
		if (!li || !li.dataset.username) return;

		const username = li.dataset.username;
		const friend = state.friends.find(f => f.username === username);
		if (!friend) return;

		btn.addEventListener('click', () => {
			btn.remove();

			createConfirmUI(li, friend, () => {
				const restoreBtn = document.createElement('button');
				restoreBtn.textContent = 'Remove';
				restoreBtn.className = 'removeBtn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm';
				li.appendChild(restoreBtn);
				setupRemoveFriendButtons();
			});
		});
	});
}


export function createConfirmUI(
	li: HTMLLIElement,
	friend: User,
	onCancel: () => void
): void {
	const confirmDiv = document.createElement('div');
	confirmDiv.className = 'flex gap-2';

	const text = document.createElement('span');
	text.textContent = 'Are you sure?';
	text.className = 'text-white self-center mr-2';

	const yesBtn = document.createElement('button');
	yesBtn.textContent = 'Yes';
	yesBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm';

	const noBtn = document.createElement('button');
	noBtn.textContent = 'No';
	noBtn.className = 'bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm';

	confirmDiv.append(text, yesBtn, noBtn);
	li.appendChild(confirmDiv);

	yesBtn.addEventListener('click', async () => {
		try {
			const res = await fetch(`https://${hostIP}:3443/api/friends/remove/${encodeURIComponent(friend.username)}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			const data = await res.json();

			if (!res.ok) {
				showToast(data?.error?.message || `Error: ${res.status}`);
				return;
			}

			state.friends = state.friends.filter(f => f.username !== friend.username);
			showToast('Friend removed');
			location.reload();
		} catch (err) {
			console.error(err);
			showToast('Failed to remove friend');
		}
	});

	noBtn.addEventListener('click', () => {
		confirmDiv.remove();
		onCancel();
	});
}