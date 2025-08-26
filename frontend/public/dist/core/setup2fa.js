var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderLogin } from "../components/login.js";
import { setupLoginForm } from "./auth.js";
export function setup2FA() {
    return __awaiter(this, void 0, void 0, function* () {
        const enableBtn = document.getElementById('enable2faBtn');
        const qrContainer = document.getElementById('qrContainer');
        if (!enableBtn || !qrContainer)
            return;
        enableBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            enableBtn.setAttribute('disabled', 'true');
            const token = localStorage.getItem('token');
            const res = yield fetch('http://localhost:3001/2fa/setup', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                console.error(yield res.text());
                enableBtn.removeAttribute('disabled');
                return;
            }
            const data = yield res.json();
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
            const verifyBtn = document.getElementById('verify2faBtn');
            verifyBtn === null || verifyBtn === void 0 ? void 0 : verifyBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                const code = document.getElementById('twofaCode').value;
                const verifyRes = yield fetch('http://localhost:3001/2fa/verify-setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ code }),
                });
                if (!verifyRes.ok) {
                    alert('Invalid code');
                    return;
                }
                alert('✅ 2FA successfully enabled!');
                location.reload();
            }));
        }));
    });
}
export function show2FAForm() {
    const root = document.getElementById('app');
    if (!root)
        return;
    root.innerHTML = renderLogin();
    setupLoginForm();
}
