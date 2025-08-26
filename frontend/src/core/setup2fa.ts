import { showToast } from "utils/authUtils.js";
import { renderLogin } from "../pages/login.js";
import { setupLoginForm } from "./auth.js";
import { hostIP } from "./auth.js";

export async function setup2FA(): Promise<void> {
	const enableBtn = document.getElementById('enable2faBtn');
	const qrContainer = document.getElementById('qrContainer');

	if (!enableBtn || !qrContainer) return;

	enableBtn.addEventListener('click', async () => {
		enableBtn.setAttribute('disabled', 'true');

		const token = localStorage.getItem('token');
		const res = await fetch(`https://${hostIP}:3443/api/2fa/setup`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			console.error(await res.text());
			enableBtn.removeAttribute('disabled');
			return;
		}

		const data = await res.json();
		qrContainer.innerHTML = `
			<p class="mb-4 text-white">Scan this QR code in your authenticator app:</p>
			<img src="${data.qrCode}" class="mx-auto w-40 h-40" />
			<input id="twofaCode" type="text" placeholder="Enter 6-digit code" 
				class="mt-4 px-4 py-2 rounded bg-gray-100 text-black"/>
			<button id="verify2faBtn"
				class="ml-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
				Verify
			</button>
		`;
		qrContainer.classList.remove('hidden');

		const verifyBtn = document.getElementById('verify2faBtn') as HTMLButtonElement;
		verifyBtn?.addEventListener('click', async () => {
			const code = (document.getElementById('twofaCode') as HTMLInputElement).value;
			const verifyRes = await fetch(`https://${hostIP}:3443/api/2fa/verify-setup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ code }),
			});

			if (!verifyRes.ok) {
				showToast('Invalid code');
				return;
			}

			showToast('✅ 2FA successfully enabled!');
			location.reload();
		});
	});
}

export function show2FAForm(): void {
	const root = document.getElementById('app');
	if (!root) return;
	root.innerHTML = renderLogin();
	setupLoginForm();
}
