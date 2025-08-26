import { hostIP } from '../core/auth.js';
import { state } from '../core/state.js';
import { showToast, isPasswordValid } from './authUtils.js';


export async function setupSettingsForm(): Promise<void> {
	const form = document.getElementById('settingsForm') as HTMLFormElement;
	if (!form) return;

	const avatarFileInput = document.getElementById('avatarFile') as HTMLInputElement;
	const avatarPreview = document.getElementById('avatarPreview') as HTMLImageElement;
	let uploadedAvatarUrl: string | null = null;

	update2FASection();

	avatarFileInput?.addEventListener('change', () => {
		const file = avatarFileInput.files?.[0];
		if (file && avatarPreview) {
			const reader = new FileReader();
			reader.onload = () => {
				avatarPreview.src = String(reader.result);
				avatarPreview.classList.remove('hidden');
			};
			reader.readAsDataURL(file);
		}
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const formData = new FormData(form);

		const oldUsername = state.currentUser?.username || '';
		const oldAvatar = state.currentUser?.avatar || '';
		const newUsername = String(formData.get('username'));

		if (avatarFileInput?.files?.[0]) {
			try {
				const avatarFormData = new FormData();
				avatarFormData.append('avatar', avatarFileInput.files[0]);

				const uploadRes = await fetch(`https://${hostIP}:3443/api/users/me/avatar`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
					body: avatarFormData,
				});

				if (!uploadRes.ok) throw new Error('Avatar upload failed');

				const data = await uploadRes.json();
				uploadedAvatarUrl = data.avatar;
			} catch (err) {
				console.error('Failed to upload avatar:', err);
				showToast('Failed to upload avatar. Please try again or continue without one.');
			}
		}

		const wasDefault = oldAvatar === `https://ui-avatars.com/api/?name=${encodeURIComponent(oldUsername)}`;
		let newAvatar = uploadedAvatarUrl || oldAvatar;
		if (!uploadedAvatarUrl && wasDefault && newUsername !== oldUsername) {
			newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}`;
		}

		const updated = {
			username: newUsername,
			email: formData.get('email'),
			avatar: newAvatar,
			alias: formData.get('alias'),
		};

		try {
			const res = await fetch(`https://${hostIP}:3443/api/update`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify(updated),
			});
			if (!res.ok) throw new Error('Update failed');
			const user = await res.json();

			state.currentUser = user;
			localStorage.setItem('currentUser', JSON.stringify(user));
			showToast('Profile updated!');
		} catch (err) {
			console.error(err);
			showToast('Failed to update profile');
		}
	});

	setupChangePasswordForm();
}

export async function update2FASection(): Promise<void> {
	const section = document.getElementById('twofaSection');
	if (!section) return;

	try {
		const res = await fetch(`https://${hostIP}:3443/api/2fa/status`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
			method: 'POST',
		});
		const data = await res.json();

		if (data.enabled_2fa) {
			section.innerHTML = `
				<p class="text-green-400">2FA is currently <strong>enabled</strong>.</p>
				<button id="disable2FA" class="bg-red-600 hover:bg-red-700 px-4 py-2 text-white rounded">Disable 2FA</button>
			`;
		} else {
			section.innerHTML = `
				<p class="text-yellow-400">2FA is <strong>not enabled</strong>.</p>
				<button id="enable2FA" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white rounded">Enable 2FA</button>
			`;
		}

		document.getElementById('enable2FA')?.addEventListener('click', async () => {
			const res = await fetch(`https://${hostIP}:3443/api/2fa/setup`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			const data = await res.json();
			section.innerHTML = `
				<p>Scan this QR code with Google Authenticator:</p>
				<img src="${data.qrCode}" class="w-40 h-40 mb-4">
				<input id="twofaCode" placeholder="Enter code" class="px-3 py-2 rounded bg-gray-900 text-white border border-gray-600">
				<button id="confirm2FA" class="ml-2 bg-green-600 hover:bg-green-700 px-4 py-2 text-white rounded">Confirm</button>
			`;

			document.getElementById('confirm2FA')?.addEventListener('click', async () => {
				const code = (document.getElementById('twofaCode') as HTMLInputElement).value.trim();
				const verifyRes = await fetch(`https://${hostIP}:3443/api/2fa/verify-setup`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ code }),
				});
				if (verifyRes.ok) {
					showToast('2FA enabled!');
					update2FASection();
				} else {
					showToast('Failed to enable 2FA. Check your code.');
				}
			});
		});

		document.getElementById('disable2FA')?.addEventListener('click', async () => {
			const res = await fetch(`https://${hostIP}:3443/api/2fa/disable`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (res.ok) {
				showToast('2FA disabled');
				update2FASection();
			}
		});
	} catch (err) {
		console.error(err);
		showToast('Error loading 2FA status');
	}
}

function setupChangePasswordForm(): void {
	const form = document.getElementById('changePasswordForm') as HTMLFormElement;
	if (!form) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		const oldPassword = (form.querySelector('input[name="oldPassword"]') as HTMLInputElement).value.trim();
		const newPassword = (form.querySelector('input[name="newPassword"]') as HTMLInputElement).value.trim();
		const confirmPassword = (form.querySelector('input[name="confirmPassword"]') as HTMLInputElement).value.trim();

		if (!oldPassword || !newPassword || !confirmPassword) {
			showToast('Please fill all password fields');
			return;
		}

		if (newPassword !== confirmPassword) {
			showToast('New password and confirmation do not match');
			return;
		}

		if (!isPasswordValid(newPassword)) {
			showToast('Password does not meet complexity requirements');
			return;
		}

		try {
			const res = await fetch(`https://${hostIP}:3443/api/update-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ oldPassword, newPassword }),
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData?.error?.message || 'Failed to update password');
			}
			showToast('Password changed successfully');
			form.reset();
		} catch (err: any) {
			showToast(err.message || 'Failed to change password');
		}
	});
}


