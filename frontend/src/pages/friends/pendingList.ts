import { getPendingRequests, acceptFriend, declineFriend } from '../../utils/friendsUtils.js';
import { User } from '../../core/state.js';
import { escapeHtml } from '../../utils/escapeHtml.js'; // Импорт функции экранирования
import { hostIP } from '../../core/auth.js';

export async function renderPendingList(): Promise<string> {
	let html = `
		<section class="max-w-2xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-lg animate-fadeIn">
	`;

	try {
		const pendingUsers: User[] = await getPendingRequests();

		if (pendingUsers.length === 0) {
			html += `<p class="text-gray-400 text-center">You have no incoming friend requests.</p>`;
		} else {
			html += `<ul class="space-y-4">`;
			html += pendingUsers.map((user) => {
				const avatarUrl = user.avatar && user.avatar.startsWith("http")
					? user.avatar
					: `https://${hostIP}:3443/api${user.avatar || "/default-avatar.png"}`;

				const alias = escapeHtml(user.alias);
				const username = escapeHtml(user.username);

				return `
					<li class="flex items-center justify-between bg-gray-700 p-4 rounded shadow">
						<div class="flex items-center space-x-4">
							<img
								src="${avatarUrl}"
								alt="User avatar"
								class="w-10 h-10 rounded-full shadow border border-gray-600"
							/>

							<div>
								<p class="text-lg font-semibold text-white leading-tight">
									${alias}
								</p>
								<a href="#/user/${user.id}/profile" class="text-sm text-gray-400 hover:underline leading-tight">
									@${username}
								</a>
							</div>
						</div>

						<div class="space-x-2">
							<button class="accept-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm" data-username="${username}">
								Accept
							</button>
							<button class="decline-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" data-username="${username}">
								Decline
							</button>
						</div>
					</li>
				`;
			}).join("");
			html += `</ul>`;
		}
	} catch (err) {
		console.error(err);
		html += `<p class="text-red-500 text-center mt-4">Failed to load pending requests.</p>`;
	}

	html += `</section>`;
	return html;
}



