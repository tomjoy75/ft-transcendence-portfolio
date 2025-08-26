export function renderLogin(): string {
	return `
		<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 px-4">
			<div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-8 w-full max-w-md animate-fadeIn">
				<form id="loginForm" class="space-y-6">
					<h2 id="formTitle" class="text-2xl font-bold text-white text-center">Welcome back</h2>
					<input
						type="text"
						id="username"
						name="username"
						placeholder="Username"
						class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					<div class="mb-4">
						<input
							type="password"
							id="password"
							name="password"
							placeholder="Password"
							class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
						<div class="mt-2 text-sm">
							<label class="inline-flex items-center">
								<input type="checkbox" id="togglePassword" class="form-checkbox text-blue-500" />
								<span class="ml-2 text-white">Show password</span>
							</label>
						</div>
					</div>
					<button
						type="submit"
						class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
					>
						Login
					</button>
				</form>
				<p class="mt-4 text-center text-sm text-white">
					Don’t have an account?
					<a href="#/register" class="text-blue-400 hover:underline">Sign Up</a>
				</p>
			</div>
		</div>
	`;
}

export function renderTwoFAForm(form: HTMLFormElement): void {
	form.innerHTML = `
		<h2 class="text-2xl font-bold text-white mb-6 text-center">Two-Factor Authentication</h2>
		<div class="space-y-4">
			<input
				type="text"
				id="twofaCode"
				name="code"
				placeholder="6-digit code"
				class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
			<button
				type="submit"
				class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
			>
				Verify
			</button>
		</div>
	`;
}


  