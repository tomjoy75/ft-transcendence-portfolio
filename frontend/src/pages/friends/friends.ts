import { renderFriendsList } from './friendList.js';
import { renderPendingList } from './pendingList.js';
import { renderAddFriendForm } from './friendAdd.js';
import { setupAddFriendForm, setupPendingRequestsHandlers, setupRemoveFriendButtons } from '../../utils/friendsUtils.js';

export function renderFriendsPage(): string {
	return `
		<section class="max-w-2xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-lg animate-fadeIn">
			<h2 class="text-2xl font-bold mb-6">Friends</h2>

		<nav class="flex space-x-4 mb-6 border-b border-gray-600">
			<button data-tab="friends" class="tab-btn border-b-2 border-blue-500 pb-2 font-semibold">Friends</button>
			<button data-tab="pending" class="tab-btn border-b-2 border-transparent pb-2 hover:border-gray-500">Pending</button>
			<button data-tab="add" class="tab-btn border-b-2 border-transparent pb-2 hover:border-gray-500">Add Friend</button>
		</nav>

		<div id="tab-content">
			${renderFriendsList()}
		</div>
		</section>
	`;
}

export async function setupFriendsPageLogic(): Promise<void> {
	const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
	const tabContent = document.getElementById('tab-content');

	async function setActiveTab(tabName: string) {
		tabButtons.forEach(btn => {
			if (btn.dataset.tab === tabName) {
				btn.classList.add('border-blue-500', 'font-semibold');
				btn.classList.remove('border-transparent');
			} else {
				btn.classList.remove('border-blue-500', 'font-semibold');
				btn.classList.add('border-transparent');
			}
		});

	if (!tabContent) return;

	switch (tabName) {
		case 'friends':
			tabContent.innerHTML = await renderFriendsList();
			setupRemoveFriendButtons();
			break;
		case 'pending':
			tabContent.innerHTML = await renderPendingList();
			setupPendingRequestsHandlers();
			break;
		case 'add':
			tabContent.innerHTML = renderAddFriendForm();
			setupAddFriendForm();
			break;
		}
	}

	tabButtons.forEach(btn => {
		btn.addEventListener('click', () => setActiveTab(btn.dataset.tab!));
	});

	setActiveTab('friends');
}

