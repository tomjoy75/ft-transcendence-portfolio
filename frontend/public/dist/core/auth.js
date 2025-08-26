var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderTwoFAForm } from "../components/login.js";
import { clearUserState, getToken } from "./state.js";
import { showToast, setupPasswordPolicyChecker, isPasswordValid, validateAllFields, loadCurrentUser } from "./utils.js";
export function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form)
        return;
    const usernameInput = form.querySelector('#username');
    const passwordInput = form.querySelector('#password');
    const togglePassword = form.querySelector('#togglePassword');
    let tempToken = '';
    let username = '';
    togglePassword.addEventListener('change', () => {
        passwordInput.type = togglePassword.checked ? 'text' : 'password';
    });
    form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        e.preventDefault();
        const password = passwordInput.value;
        username = usernameInput.value.trim();
        // === 1. If we are in 2FA stage ===
        if (tempToken) {
            const codeInput = form.querySelector('#twofaCode');
            const code = codeInput === null || codeInput === void 0 ? void 0 : codeInput.value.trim();
            if (!code || code.length !== 6) {
                showToast('Enter a valid 6-digit code');
                return;
            }
            const res = yield fetch('https://localhost:3443/api/2fa/verify-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`,
                },
                body: JSON.stringify({ code }),
            });
            const data = yield res.json();
            if (!res.ok) {
                showToast(((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) || '2FA failed');
                return;
            }
            localStorage.setItem('token', data.token);
            try {
                yield loadCurrentUser();
            }
            catch (err) {
                console.error('Failed to load user after 2FA login:', err);
            }
            location.hash = '#/home';
            return;
        }
        // === 2. Initial login attempt ===
        const res = yield fetch('https://localhost:3443/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = yield res.json();
        if (!res.ok) {
            showToast(((_b = data === null || data === void 0 ? void 0 : data.error) === null || _b === void 0 ? void 0 : _b.message) || 'Login failed');
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
            yield loadCurrentUser();
        }
        catch (err) {
            console.error('Failed to load user after login:', err);
        }
        location.hash = '#/home';
    }));
}
export function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form)
        return;
    setupPasswordPolicyChecker();
    const usernameInput = document.getElementById('username');
    const aliasInput = document.getElementById('alias');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
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
    form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
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
            const res = yield fetch('https://localhost:3443/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, alias, email, password, avatar }),
            });
            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);
            if (!res.ok) {
                let errorData = null;
                try {
                    const contentType = res.headers.get('content-type');
                    if (contentType === null || contentType === void 0 ? void 0 : contentType.includes('application/json')) {
                        errorData = yield res.json();
                    }
                    else {
                        errorData = { error: { message: yield res.text(), code: res.status } };
                    }
                }
                catch (parseErr) {
                    console.error('Failed to parse error body:', parseErr);
                }
                console.error('❗ Error response:', errorData);
                const error = errorData === null || errorData === void 0 ? void 0 : errorData.error;
                if (error && typeof error === 'object') {
                    const { message, code } = error;
                    if (code === 409 && message) {
                        if (message.toLowerCase().includes('username')) {
                            showToast('Username already in use.');
                            usernameInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
                        }
                        else if (message.toLowerCase().includes('email')) {
                            showToast('Email already in use.');
                            emailInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
                        }
                        else {
                            showToast('This value is already in use.');
                        }
                        return;
                    }
                }
                showToast('Registration failed. Please try again.');
                return;
            }
            showToast('Registration successful! Please log in.');
            window.location.hash = '#/login';
        }
        catch (err) {
            console.error('❌ Caught error during registration:', err);
            showToast('Registration failed due to network or internal error.');
        }
    }));
}
export function logout() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        console.log('Token from state:', token);
        if (!token) {
            console.log('No token found, aborting logout');
            return;
        }
        try {
            const res = yield fetch('https://localhost:3443/api/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = yield res.json();
                console.error('Logout error:', errorData);
                throw new Error('Logout failed');
            }
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            clearUserState();
            showToast('Logged out successfully.');
            window.location.hash = '#/login';
        }
        catch (err) {
            console.error(err);
            showToast('Logout failed. Please try again.');
        }
    });
}
