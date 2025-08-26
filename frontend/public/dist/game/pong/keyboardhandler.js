let handler = null;
export function setKeyEventHandler(funct) {
    if (handler)
        clearKeyHandler();
    handler = funct;
    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', handler);
}
export function clearKeyHandler() {
    if (handler) {
        document.removeEventListener('keydown', handler);
        document.removeEventListener('keyup', handler);
        handler = null;
    }
}
export function getKeyEventHandler() {
    return handler;
}
