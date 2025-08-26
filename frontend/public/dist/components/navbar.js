import { state } from '../core/state.js';
export function renderNavbar() {
    const currentHash = window.location.hash;
    if (!state.isLoggedIn || !state.currentUser)
        return '';
    const { username, alias, avatar } = state.currentUser;
    const linkClass = (hash) => `px-4 py-2 rounded transition-colors duration-200 ease-in-out ${currentHash === hash ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`;
    return `
		<nav class="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4 flex flex-wrap items-center justify-between">
			<div class="flex items-center space-x-4">
				<a href="#/home" class="text-blue-400 text-xl font-bold hover:text-blue-300 transition">
					ft_transcendence
				</a>

				<button
					id="burgerBtn"
					aria-label="Toggle menu"
					class="md:hidden text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>

				<div id="navLinks" class="hidden md:flex space-x-4">
					<a href="#/home" class="${linkClass('#/home')}">Home</a>
					<a href="#/profile" class="${linkClass('#/profile')}">Profile</a>
				</div>
			</div>

			<div class="relative">
				<button
					id="avatarBtn"
					aria-haspopup="true"
					aria-expanded="false"
					class="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
				>
					<img
						src="${avatar}"
						alt="${username} avatar"
						class="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
					/>
					<div class="ml-2 text-left hidden md:block">
						<p class="text-sm font-medium text-white">${alias || username}</p>
						<p class="text-xs text-gray-400">@${username}</p>
					</div>
				</button>

				<div
					id="avatarMenu"
					class="hidden absolute right-0 mt-2 w-40 bg-gray-800 rounded shadow-lg text-gray-300 z-50"
					role="menu"
					aria-label="User menu"
				>
					<a href="#/profile" class="block px-4 py-2 hover:bg-gray-700" role="menuitem">Profile</a>
					<a href="#/settings" class="block px-4 py-2 hover:bg-gray-700" role="menuitem">Settings</a>
					<button id="logoutBtn" class="w-full text-left px-4 py-2 hover:bg-red-700 text-red-500" role="menuitem">
						Logout
					</button>
				</div>
			</div>
		</nav>
	`;
}
