export function renderAddFriendForm(): string {
	return `
		<div class="max-w-md mx-auto">
			<form id="addFriendForm" class="space-y-4 bg-gray-700 p-6 rounded">
				<label for="friendUsername" class="block text-white mb-2 font-semibold">
					Friend's Username
				</label>
				<input
					type="text"
					id="friendUsername"
					name="friendUsername"
					placeholder="Enter username"
					class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors"
				>
					Add Friend
				</button>
			</form>
		</div>
	`;
}