import { state } from '../core/state.js';
export function renderProfile() {
    const user = state.currentUser;
    if (!user) {
        return `<div class="text-center text-red-400 mt-10">No user data available.</div>`;
    }
    return `
		<section class="w-full max-w-xl mx-auto mt-10 bg-gray-800 text-gray-100 p-6 rounded-xl shadow-lg animate-fadeIn">
			<div class="flex flex-col items-center">
				<img
					src="${user.avatar}"
					alt="User avatar"
					class="w-20 h-20 rounded-full shadow mb-4 border border-gray-600"
				/>

				<p class="text-2xl font-bold text-white mb-1">${user.alias || user.username}</p>
				<p class="text-gray-400 text-sm mb-6">@${user.username}</p>

				<div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm w-full">
					<div class="text-gray-400 font-semibold">Email:</div>
					<div class="text-white">${user.email || '<i class="text-gray-500">Not set</i>'}</div>
					<div class="text-gray-400 font-semibold">Status:</div>
					<div class="text-green-400">Online</div>
				</div>
			</div>
		</section>
	`;
}
