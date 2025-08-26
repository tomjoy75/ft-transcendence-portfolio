const savedUserRaw = localStorage.getItem('currentUser');
let savedUser = null;
try {
    if (savedUserRaw) {
        savedUser = JSON.parse(savedUserRaw);
    }
}
catch (_a) {
    localStorage.removeItem('currentUser');
    savedUser = null;
}
export const state = {
    isLoggedIn: !!savedUser,
    currentUser: savedUser,
};
export function login(id, username, alias, email, avatar, token) {
    const user = { id, username, alias, email, avatar, token };
    state.isLoggedIn = true;
    state.currentUser = user;
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}
export function clearUserState() {
    console.log('clearUserState called — before:', state.isLoggedIn, state.currentUser);
    state.isLoggedIn = false;
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    console.log('clearUserState called — after:', state.isLoggedIn, state.currentUser);
}
export function getLoginStatus() {
    return state.isLoggedIn;
}
export function getCurrentUser() {
    return state.currentUser;
}
export function getToken() {
    var _a, _b;
    return (_b = (_a = state.currentUser) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : null;
}
