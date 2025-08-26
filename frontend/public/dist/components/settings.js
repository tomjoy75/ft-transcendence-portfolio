import { state } from '../core/state.js';
export function renderSettings() {
    const user = state.currentUser;
    if (!user)
        return `<p class="text-center mt-10 text-red-500">No user data.</p>`;
    return `
		<section class="max-w-2xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-lg animate-fadeIn">
			<h2 class="text-2xl font-bold mb-6">Settings</h2>

			<form id="settingsForm" class="space-y-4">
				<div>
					<label class="block mb-1 text-gray-300">Username</label>
					<input type="text" name="username" value="${user.username}" class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-600">
				</div>
				<div>
					<label class="block mb-1 text-gray-300">Alias</label>
					<input type="text" name="alias" value="${user.alias}" class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-600">
				</div>
				<div>
					<label class="block mb-1 text-gray-300">Email</label>
					<input type="email" name="email" value="${user.email}" class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-600">
				</div>
				<div>
					<label class="block mb-1 text-gray-300">Avatar URL</label>
					<input type="text" name="avatar" value="${user.avatar}" class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-600">
				</div>
				<button type="submit" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
					Save Changes
				</button>
			</form>

			<hr class="my-6 border-gray-600">

			<div>
				<h3 class="text-xl mb-4">Change Password</h3>
				<form id="changePasswordForm" class="space-y-4 max-w-md">
					<div>
						<label for="oldPassword" class="block mb-1 text-gray-300">Current Password</label>
						<input
							type="password"
							id="oldPassword"
							name="oldPassword"
							required
							class="w-full px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter current password"
						/>
					</div>

					<div class="relative">
						<label for="newPassword" class="block mb-1 text-gray-300">New Password</label>
						<div class="flex items-center">
							<input
								type="password"
								id="newPassword"
								name="newPassword"
								required
								class="w-full px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Enter new password"
								autocomplete="new-password"
							/>
							<div class="ml-2 relative group cursor-pointer">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 18h.01M16 10h.01M12 6v.01M12 12h.01M12 14h.01M12 16h.01"/>
								</svg>
								<div
									class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10"
								>
									<ul class="space-y-1">
										<li id="check-length" class="text-red-400">• At least 8 characters</li>
										<li id="check-lowercase" class="text-red-400">• At least one lowercase letter</li>
										<li id="check-uppercase" class="text-red-400">• At least one uppercase letter</li>
										<li id="check-number" class="text-red-400">• At least one number</li>
										<li id="check-special" class="text-red-400">• At least one special character</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					<div>
						<label for="confirmPassword" class="block mb-1 text-gray-300">Confirm New Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							class="w-full px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Confirm new password"
						/>
					</div>

					<button
						type="submit"
						class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors"
					>
						Change Password
					</button>
				</form>
			</div>

			<hr class="my-6 border-gray-600">

			<div>
				<h3 class="text-xl mb-2">Two-Factor Authentication (2FA)</h3>
				<div id="twofaSection" class="space-y-4">
					<p class="text-gray-400">Checking 2FA status...</p>
				</div>
			</div>
		</section>
	`;
}
