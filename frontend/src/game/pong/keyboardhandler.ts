let handler: ((event: KeyboardEvent) => void) | null = null;

export function setKeyEventHandler(funct: (e: KeyboardEvent) => void)
{
    if (handler)
        clearKeyHandler();
    handler = funct;
    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', handler);
}

export function clearKeyHandler()
{
    if (handler)
    {
        document.removeEventListener('keydown', handler);
        document.removeEventListener('keyup', handler);
        handler = null;
    }
}

export function getKeyEventHandler(): ((e: KeyboardEvent) => void) | null
{
    return handler;
}