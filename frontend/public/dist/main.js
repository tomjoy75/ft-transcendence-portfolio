var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderHome } from './components/home.js';
import { renderLogin } from './components/login.js';
import { renderNavbar } from './components/navbar.js';
import { renderProfile } from './components/profile.js';
import { renderRegister } from './components/register.js';
import { getCurrentUser } from './core/state.js';
import { showToast, logoutConfirmation, loadCurrentUser } from './core/utils.js';
import { setupLoginForm, setupRegisterForm, logout } from './core/auth.js';
import { getPongScreen } from './game/pong/gameRender.js';
import { getTicTacToeScreen } from './game/tictactoe/gameRender.js';
import { setupNavbarEvents, setupNavbarMenu } from './core/navbarUtils.js';
import { renderSettings } from './components/settings.js';
import { setupSettingsForm } from './core/settingsUtils.js';
import { renderStats } from './components/stats.js';
const appRoot = document.getElementById('app');
const pageRoot = document.getElementById('page');
const navbarRoot = document.getElementById('navbar');
function initApp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadCurrentUser();
        renderRoute();
    });
}
function renderRoute() {
    const hash = window.location.hash || '#/home';
    const user = getCurrentUser();
    const isLoggedIn = !!user;
    if (!pageRoot || !navbarRoot)
        return;
    // Show navbar only if user is logged in and not on login/register page
    if (isLoggedIn && hash !== '#/login' && hash !== '#/register') {
        navbarRoot.innerHTML = renderNavbar();
        setupNavbarEvents();
        setupNavbarMenu();
    }
    else {
        navbarRoot.innerHTML = '';
    }
    // Redirect logged-in users away from login/register pages
    if ((hash === '#/login' || hash === '#/register') && isLoggedIn) {
        window.location.hash = '#/home';
        return;
    }
    // Protect routes except login/register
    if (!isLoggedIn && hash !== '#/login' && hash !== '#/register') {
        showToast('You must be logged in to access this page.');
        window.location.hash = '#/login';
        return;
    }
    // Render routes using switch
    switch (hash) {
        case '#/login':
            pageRoot.innerHTML = renderLogin();
            setupLoginForm();
            break;
        case '#/register':
            pageRoot.innerHTML = renderRegister();
            setupRegisterForm();
            break;
        case '#/home':
            pageRoot.innerHTML = renderHome();
            break;
        case '#/profile':
            pageRoot.innerHTML = renderProfile();
            break;
        case '#/pong':
            pageRoot.innerHTML = '';
            pageRoot.appendChild(getPongScreen());
            break;
        case '#/tictactoe':
            pageRoot.innerHTML = '';
            pageRoot.appendChild(getTicTacToeScreen());
            break;
        case '#/stats':
            pageRoot.innerHTML = renderStats();
            break;
        case '#/settings':
            pageRoot.innerHTML = renderSettings();
            setupSettingsForm();
            break;
        default:
            pageRoot.innerHTML = `<p class="text-center mt-10 text-xl text-red-500">Page not found</p>`;
            break;
    }
    // Setup logout button listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            const confirmed = yield logoutConfirmation();
            if (confirmed) {
                yield logout();
            }
        }));
    }
}
window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', initApp);
