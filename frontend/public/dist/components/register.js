export function renderRegister() {
    return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 px-4">
            <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-8 w-full max-w-md animate-fadeIn">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">Create your account</h2>
                <form id="registerForm" class="space-y-4">
                    <input
                        type="text"
                        id="username"
                        placeholder="Username"
                        required
                        class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="text"
                        id="alias"
                        name="alias"
                        placeholder="Alias (optional)"
                        class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="email"
                        id="email"
                        placeholder="Email"
                        required
                        class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p id="emailError" class="text-red-500 text-sm mt-1 hidden">Invalid email address.</p>

                    <input
                        type="password"
                        id="password"
                        placeholder="Password"
                        required
                        class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p id="passwordError" class="text-red-500 text-sm mt-1 hidden">Invalid password.</p>

                    <div id="password-policy" class="text-sm text-gray-400 space-y-1 mb-2">
                        <p class="font-semibold text-gray-300">Password must contain:</p>
                        <ul class="ml-4 space-y-1">
                            <li id="check-length" class="text-red-400">• At least 8 characters</li>
                            <li id="check-lowercase" class="text-red-400">• A lowercase letter</li>
                            <li id="check-uppercase" class="text-red-400">• An uppercase letter</li>
                            <li id="check-number" class="text-red-400">• A number</li>
                            <li id="check-special" class="text-red-400">• A special character</li>
                        </ul>
                    </div>

                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        class="w-full px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p id="confirmPasswordError" class="text-red-500 text-sm mt-1 hidden">Passwords do not match.</p>

                    <button
                        type="submit"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                    >
                        Register
                    </button>
                </form>
                <p class="mt-4 text-center text-sm">
                    Already have an account?
                    <a href="#/login" class="text-blue-500 hover:underline">Log in</a>
                </p>
            </div>
        </div>
    `;
}
