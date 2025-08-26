import { renderTwoFAForm } from "../pages/login.js";
import { clearUserState, getToken, login } from "./state.js";
import {
	showToast,
	setupPasswordPolicyChecker,
	isPasswordValid,
	validateAllFields,
	loadCurrentUser
} from "../utils/authUtils.js";

export const hostIP = window.location.hostname;

export function setupLoginForm(): void {
	const form = document.getElementById('loginForm') as HTMLFormElement;
	if (!form) return;

	const usernameInput = form.querySelector('#username') as HTMLInputElement;
	const passwordInput = form.querySelector('#password') as HTMLInputElement;
	const togglePassword = form.querySelector('#togglePassword') as HTMLInputElement;

	let tempToken: string = '';
	let username: string = '';

	togglePassword.addEventListener('change', () => {
		passwordInput.type = togglePassword.checked ? 'text' : 'password';
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const password = passwordInput.value;
		username = usernameInput.value.trim();

		// === 1. If we are in 2FA stage ===
		if (tempToken) {
			const codeInput = form.querySelector('#twofaCode') as HTMLInputElement;
			const code = codeInput?.value.trim();

			if (!code || code.length !== 6) {
				showToast('Enter a valid 6-digit code');
				return;
			}

			const res = await fetch(`https://${hostIP}:3443/api/2fa/verify-login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${tempToken}`,
				},
				body: JSON.stringify({ code }),
			});

			const data = await res.json();

			if (!res.ok) {
				showToast(data?.error?.message || '2FA failed');
				return;
			}

			localStorage.setItem('token', data.token);
			try {
				await loadCurrentUser();
			} catch (err) {
				console.error('Failed to load user after 2FA login:', err);
			}

			location.hash = '#/home';
			return;
		}

		// === 2. Initial login attempt ===
		const res = await fetch(`https://${hostIP}:3443/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});
		const data = await res.json();

		if (!res.ok) {
			switch (res.status) {
				case 400:
					showToast("Login failed: username or password are missing");
					break;
				case 401:
					showToast("Login failed: username or password are incorrect");
					break;
				case 404:
					showToast("Login failed: username or password are incorrect");
					break;
				default:
					showToast(data?.error?.message || `Error: ${res.status}`);
			}
			return;
		}

		// === 2FA required ===
		if (data.tempToken) {
			tempToken = data.tempToken;
			renderTwoFAForm(form);

			showToast('Enter your 2FA code to continue');
			return;
		}

		// === Normal login ===
		localStorage.setItem('token', data.token);
		try {
			await loadCurrentUser();
		} catch (err) {
			console.error('Failed to load user after login:', err);
		}

		location.hash = '#/home';
	});
}


export function setupRegisterForm(): void {
	const form = document.getElementById('registerForm') as HTMLFormElement;
	if (!form) return;

	setupPasswordPolicyChecker();

	const usernameInput = document.getElementById('username') as HTMLInputElement;
	const aliasInput = document.getElementById('alias') as HTMLInputElement;
	const emailInput = document.getElementById('email') as HTMLInputElement;
	const passwordInput = document.getElementById('password') as HTMLInputElement;
	const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

	[
		usernameInput,
		aliasInput,
		emailInput,
		passwordInput,
		confirmPasswordInput
	].forEach(input => {
		input.addEventListener('input', () => {
			input.classList.remove('border-red-500', 'ring-red-500');
			validateAllFields();
		});
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const username = usernameInput.value.trim();
		const alias = aliasInput.value.trim() || username;
		const email = emailInput.value.trim();
		const password = passwordInput.value;
		const confirmPassword = confirmPasswordInput.value;
		const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`;

		if (password !== confirmPassword) {
			showToast('Passwords do not match.');
			return;
		}

		if (!isPasswordValid(password)) {
			showToast('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
			return;
		}

		try {
			const res = await fetch(`https://${hostIP}:3443/api/signup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, alias, email, password, avatar }),
			});
			const data = await res.json();

			if (!res.ok) {

				showToast(data?.error?.message || `Error: ${res.status}`);
				return;
			}

			showToast('Registration successful! Please log in.');
			window.location.hash = '#/login';

		} catch (err) {
			console.error('❌ Caught error during registration:', err);
			showToast('Registration failed due to network or internal error.');
		}
	});
}


export async function logout(): Promise<void> {

	try {
		const res = await fetch(`https://${hostIP}:3443/api/logout`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
		});

		if (!res.ok) {
			const errorData = await res.json();
			console.error('Logout error:', errorData);
			throw new Error('Logout failed');
		}

		localStorage.removeItem('token');
		localStorage.removeItem('username');
		clearUserState();

		showToast('Logged out successfully.');
		window.location.hash = '#/login';

	} catch (err) {
		console.error(err);
		showToast('Logout failed. Please try again.');
	}
}

