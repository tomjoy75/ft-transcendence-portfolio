import { state } from '../../core/state.js';
import { loadFriends } from '../../utils/friendsUtils.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { hostIP } from '../../core/auth.js';

export async function renderFriendsList(): Promise<string> {
	await loadFriends();

	const friends = state.friends;
	const hasFriends = friends.length > 0;

	return `
		<section class="max-w-2xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-lg animate-fadeIn">
			${hasFriends
				? `
				<ul class="space-y-4" id="friendsList">
					${friends.map((friend) => {
						const avatar = friend.avatar && friend.avatar.startsWith('http')
										? friend.avatar
										: `https://${hostIP}:3443/api${friend.avatar || '/default-avatar.png'}`; 
						const username = escapeHtml(friend.username);
						const alias = escapeHtml(friend.alias);

						return `
							<li
								class="flex items-center justify-between bg-gray-700 p-4 rounded"
								data-username="${username}"
							>
								<div class="flex items-center space-x-4"> <!-- ⬅️ добавляем gap -->
									<img
										src="${avatar}"
										alt="User avatar"
										class="w-10 h-10 rounded-full shadow border border-gray-600"
									/>

									<div>
										<p class="text-lg font-semibold text-white leading-tight">
											${alias}
										</p>
										<a href="#/user/${friend.id}/profile" class="text-sm text-gray-400 hover:underline leading-tight">
											@${username}
										</a>
									</div>
								</div>

								<button class="removeBtn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
									Remove
								</button>
							</li>
						`;
					}).join('')}
				</ul>
			` : `
				<p class="text-gray-400 mb-6 text-center">You don’t have any friends yet.</p>
			`}
		</section>
	`;
}



