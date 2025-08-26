var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { login, state } from "./state.js";
export function showToast(message, duration = 2000) {
    const container = document.getElementById('toast-container');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.className = `
    bg-gray-800 text-white px-4 py-2 rounded shadow-lg
    opacity-0 scale-95 transition-all duration-300 ease-out
  `;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'scale-95');
        toast.classList.add('opacity-100', 'scale-100');
    });
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100');
        toast.classList.add('opacity-0', 'translate-x-20');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}
export function logoutConfirmation() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const cancelBtn = document.getElementById('cancelLogout');
        const confirmBtn = document.getElementById('confirmLogout');
        const modalBox = document.getElementById('modal-box');
        overlay.classList.remove('hidden');
        confirmBtn.focus();
        const handleClickOutside = (event) => {
            if (!modalBox.contains(event.target)) {
                cleanup();
                resolve(false);
            }
        };
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                cleanup();
                resolve(false);
            }
        };
        const cleanup = () => {
            overlay.classList.add('hidden');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleKeydown);
        };
        const onConfirm = () => {
            cleanup();
            resolve(true);
        };
        const onCancel = () => {
            cleanup();
            resolve(false);
        };
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeydown);
    });
}
export function isPasswordValid(password) {
    const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return policyRegex.test(password);
}
export function isEmailValid(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
export function setupPasswordPolicyChecker() {
    const passwordInput = document.getElementById('password');
    const checks = {
        length: document.getElementById('check-length'),
        lowercase: document.getElementById('check-lowercase'),
        uppercase: document.getElementById('check-uppercase'),
        number: document.getElementById('check-number'),
        special: document.getElementById('check-special'),
    };
    if (!passwordInput)
        return;
    passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        const hasLength = value.length >= 8;
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[\W_]/.test(value);
        checks.length.classList.toggle('text-green-400', hasLength);
        checks.length.classList.toggle('text-red-400', !hasLength);
        checks.lowercase.classList.toggle('text-green-400', hasLower);
        checks.lowercase.classList.toggle('text-red-400', !hasLower);
        checks.uppercase.classList.toggle('text-green-400', hasUpper);
        checks.uppercase.classList.toggle('text-red-400', !hasUpper);
        checks.number.classList.toggle('text-green-400', hasNumber);
        checks.number.classList.toggle('text-red-400', !hasNumber);
        checks.special.classList.toggle('text-green-400', hasSpecial);
        checks.special.classList.toggle('text-red-400', !hasSpecial);
    });
}
export function validateAllFields() {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const form = document.getElementById('registerForm');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const emailValue = email.value.trim();
    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;
    const validEmail = isEmailValid(emailValue);
    const validPassword = isPasswordValid(passwordValue);
    const doPasswordsMatch = passwordValue === confirmPasswordValue;
    // Email - validate only if not empty
    if (emailValue !== '' && !validEmail) {
        email.classList.add('border-red-500');
        emailError === null || emailError === void 0 ? void 0 : emailError.classList.remove('hidden');
    }
    else {
        email.classList.remove('border-red-500');
        emailError === null || emailError === void 0 ? void 0 : emailError.classList.add('hidden');
    }
    // Password - validate only if not empty
    if (passwordValue !== '' && !validPassword) {
        password.classList.add('border-red-500');
        passwordError === null || passwordError === void 0 ? void 0 : passwordError.classList.remove('hidden');
    }
    else {
        password.classList.remove('border-red-500');
        passwordError === null || passwordError === void 0 ? void 0 : passwordError.classList.add('hidden');
    }
    // Confirm password - validate only if not empty
    if (confirmPasswordValue !== '' && !doPasswordsMatch) {
        confirmPassword.classList.add('border-red-500');
        confirmPasswordError === null || confirmPasswordError === void 0 ? void 0 : confirmPasswordError.classList.remove('hidden');
    }
    else {
        confirmPassword.classList.remove('border-red-500');
        confirmPasswordError === null || confirmPasswordError === void 0 ? void 0 : confirmPasswordError.classList.add('hidden');
    }
}
export function loadCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const res = yield fetch('http://localhost:3001/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Failed to fetch user');
            const { id, username, alias, email, avatar } = yield res.json();
            login(id, username, alias, email, avatar, token);
        }
        catch (err) {
            console.error('Could not restore session:', err);
            state.currentUser = null;
            state.isLoggedIn = false;
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    });
}
['email', 'password', 'confirmPassword'].forEach((id) => {
    const input = document.getElementById(id);
    if (input)
        input.addEventListener('input', validateAllFields);
});
