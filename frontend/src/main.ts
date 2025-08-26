import { renderHome } from './pages/home.js';
import { renderLogin } from './pages/login.js';
import { renderNavbar } from './pages/navbar.js';
import { renderFullProfile, renderProfile } from './pages/profile.js';
import { renderRegister } from './pages/register.js';
import { getCurrentUser, getLoginStatus, state } from './core/state.js';
import { showToast, logoutConfirmation, loadCurrentUser } from './utils/authUtils.js';
import { setupLoginForm, setupRegisterForm, logout } from './core/auth.js';
import { getPongScreen } from './game/pong/gameRender.js';
import { setupNavbarEvents, setupNavbarMenu } from './utils/navbarUtils.js';
import { renderSettings } from './pages/settings.js';
import { setupSettingsForm } from './utils/settingsUtils.js';
import { renderFriendsPage, setupFriendsPageLogic } from './pages/friends/friends.js';
import { renderTournamentsPage, setupTournamentsPage } from './pages/tournaments/tournament.js';
import { renderCreateTournamentPage, setupCreateTournamentPage } from './pages/tournaments/tournamentCreate.js';
import { renderTournamentPlayersPage, setupTournamentPlayersPage } from './pages/tournaments/tournamentPlayers.js';
import { renderTournamentBracket } from './pages/tournaments/tournamentBracket.js';
import { renderUserFullProfile } from './pages/profileOther.js';
import { renderLeaderboard } from './pages/leaderboard.js';

const appRoot = document.getElementById('app')!;
const pageRoot = document.getElementById('page');
const navbarRoot = document.getElementById('navbar');

async function initApp() {
	await loadCurrentUser();

	renderRoute();
}

async function renderRoute() {
	const hash = window.location.hash || '#/home';
	const user = getCurrentUser();
	const isLoggedIn = !!user;

	if (!pageRoot || !navbarRoot) return;

	// Show navbar only if user is logged in and not on login/register page
	if (isLoggedIn && hash !== '#/login' && hash !== '#/register') {
		navbarRoot.innerHTML = renderNavbar();
		setupNavbarEvents();
		setupNavbarMenu();

		const logoutBtn = document.getElementById('logoutBtn');
		if (logoutBtn) {
			logoutBtn.addEventListener('click', async () => {
				const confirmed = await logoutConfirmation();
				if (confirmed) {
					await logout();
				}
			});
		}
	} else {
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

	let match;

	// /user/:id/profile
	match = hash.match(/^#\/user\/(\d+)\/profile$/);
	if (match) {
		const userId = parseInt(match[1], 10);
		renderUserFullProfile(userId, pageRoot!);
		return;
	}

	// /tournaments/:id/players
	match = hash.match(/^#\/tournaments\/(\d+)\/players$/);
	if (match) {
		const id = parseInt(match[1], 10);
		renderTournamentPlayersPage(id).then(html => {
			pageRoot.innerHTML = html;
			setupTournamentPlayersPage(id);
		});
		return;
	}

	// /tournaments/:id/bracket
	match = hash.match(/^#\/tournaments\/(\d+)\/bracket$/);
	if (match) {
		const id = parseInt(match[1], 10);
		renderTournamentBracket(id).then(html => {
			pageRoot.innerHTML = html;
			// setupTournamentBracketPage(id);
		});
		return;
	}

	// /pong/:matchId
	match = hash.match(/^#\/pong\/(\d+)$/);
	if (match) {
		const matchId: number = parseInt(match[1], 10);
		pageRoot.innerHTML = '';
		pageRoot.appendChild(getPongScreen(matchId));
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
			await renderFullProfile(pageRoot!);
			break;

		case '#/friends':
			pageRoot.innerHTML = renderFriendsPage();
			setupFriendsPageLogic();
			break;

		case '#/pong':
			pageRoot.innerHTML = '';
			pageRoot.appendChild(getPongScreen());
			break;

		case '#/tournaments':
			pageRoot.innerHTML = renderTournamentsPage();
			setupTournamentsPage();
			break;

		case '#/tournaments/create':
			pageRoot.innerHTML = renderCreateTournamentPage();
			setupCreateTournamentPage();
			break;
		
		case '#/leaderboard':
			pageRoot.innerHTML = await renderLeaderboard();
			break;
		
		case '#/settings':
			pageRoot.innerHTML = renderSettings();
			setupSettingsForm();
			break;

		default:
			pageRoot.innerHTML = `<p class="text-center mt-10 text-xl text-red-500">Page not found</p>`;
			break;
	}

}



window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', initApp);



