var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { state } from './state.js';
import { showToast } from './utils.js';
import { isPasswordValid } from './utils.js';
export function setupSettingsForm() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.getElementById('settingsForm');
        if (!form)
            return;
        update2FASection();
        form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            e.preventDefault();
            const formData = new FormData(form);
            const oldUsername = ((_a = state.currentUser) === null || _a === void 0 ? void 0 : _a.username) || '';
            const oldAvatar = ((_b = state.currentUser) === null || _b === void 0 ? void 0 : _b.avatar) || '';
            const newUsername = String(formData.get('username'));
            let newAvatar = String(formData.get('avatar'));
            const wasDefault = oldAvatar === `https://ui-avatars.com/api/?name=${encodeURIComponent(oldUsername)}`;
            if (wasDefault && newUsername !== oldUsername) {
                newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}`;
            }
            const updated = {
                username: newUsername,
                email: formData.get('email'),
                avatar: newAvatar,
                alias: formData.get('alias'),
            };
            try {
                const res = yield fetch('http://localhost:3001/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(updated),
                });
                if (!res.ok)
                    throw new Error('Update failed');
                const user = yield res.json();
                state.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showToast('Profile updated!');
            }
            catch (err) {
                console.error(err);
                showToast('Failed to update profile');
            }
        }));
        setupChangePasswordForm();
    });
}
export function update2FASection() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const section = document.getElementById('twofaSection');
        if (!section)
            return;
        try {
            const res = yield fetch('http://localhost:3001/2fa/status', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                method: 'POST',
            });
            const data = yield res.json();
            if (data.enabled_2fa) {
                section.innerHTML = `
				<p class="text-green-400">2FA is currently <strong>enabled</strong>.</p>
				<button id="disable2FA" class="bg-red-600 hover:bg-red-700 px-4 py-2 text-white rounded">Disable 2FA</button>
			`;
            }
            else {
                section.innerHTML = `
				<p class="text-yellow-400">2FA is <strong>not enabled</strong>.</p>
				<button id="enable2FA" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white rounded">Enable 2FA</button>
			`;
            }
            (_a = document.getElementById('enable2FA')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const res = yield fetch('http://localhost:3001/2fa/setup', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = yield res.json();
                section.innerHTML = `
				<p>Scan this QR code with Google Authenticator:</p>
				<img src="${data.qrCode}" class="w-40 h-40 mb-4">
				<input id="twofaCode" placeholder="Enter code" class="px-3 py-2 rounded bg-gray-900 text-white border border-gray-600">
				<button id="confirm2FA" class="ml-2 bg-green-600 hover:bg-green-700 px-4 py-2 text-white rounded">Confirm</button>
			`;
                (_a = document.getElementById('confirm2FA')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    const code = document.getElementById('twofaCode').value.trim();
                    const verifyRes = yield fetch('http://localhost:3001/2fa/verify-setup', {
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
                    }
                    else {
                        showToast('Failed to enable 2FA. Check your code.');
                    }
                }));
            }));
            (_b = document.getElementById('disable2FA')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                const res = yield fetch('http://localhost:3001/2fa/disable', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (res.ok) {
                    showToast('2FA disabled');
                    update2FASection();
                }
            }));
        }
        catch (err) {
            console.error(err);
            showToast('Error loading 2FA status');
        }
    });
}
function setupChangePasswordForm() {
    const form = document.getElementById('changePasswordForm');
    if (!form)
        return;
    form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const oldPassword = form.querySelector('input[name="oldPassword"]').value.trim();
        const newPassword = form.querySelector('input[name="newPassword"]').value.trim();
        const confirmPassword = form.querySelector('input[name="confirmPassword"]').value.trim();
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
            const res = yield fetch('http://localhost:3001/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            if (!res.ok) {
                const errData = yield res.json();
                throw new Error(((_a = errData === null || errData === void 0 ? void 0 : errData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to update password');
            }
            showToast('Password changed successfully');
            form.reset();
        }
        catch (err) {
            showToast(err.message || 'Failed to change password');
        }
    }));
}
