export function setupNavbarEvents(): void {
	const avatarBtn = document.getElementById('avatarBtn');
	const dropdownMenu = document.getElementById('dropdownMenu');

	if (!avatarBtn || !dropdownMenu) return;

	avatarBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		dropdownMenu.classList.toggle('hidden');
	});

	document.addEventListener('click', (e) => {
		if (!dropdownMenu.classList.contains('hidden')) {
			if (!dropdownMenu.contains(e.target as Node) && e.target !== avatarBtn) {
				dropdownMenu.classList.add('hidden');
			}
		}
	});
}

export function setupNavbarMenu() {
	const burgerBtn = document.getElementById('burgerBtn');
	const navLinks = document.getElementById('navLinks');
	const avatarBtn = document.getElementById('avatarBtn');
	const avatarMenu = document.getElementById('avatarMenu');

	if (burgerBtn && navLinks) {
		burgerBtn.addEventListener('click', () => {
			navLinks.classList.toggle('hidden');
		});
	}

	if (avatarBtn && avatarMenu) {
		avatarBtn.addEventListener('click', () => {
			const expanded = avatarBtn.getAttribute('aria-expanded') === 'true';
			avatarBtn.setAttribute('aria-expanded', String(!expanded));
			avatarMenu.classList.toggle('hidden');
		});

		document.addEventListener('click', (e) => {
			if (
				avatarMenu.classList.contains('hidden') ||
				avatarBtn.contains(e.target as Node) ||
				avatarMenu.contains(e.target as Node)
			) {
				return;
			}
			avatarMenu.classList.add('hidden');
			avatarBtn.setAttribute('aria-expanded', 'false');
		});
	}
}