export type LocationCommandMode = 'peek' | 'goto';

export interface LocationCommandSelection {
    command: 'editor.action.peekLocations' | 'editor.action.goToLocations';
    mode: LocationCommandMode;
}

export function getLocationCommand(clickAction: 'peek' | 'reveal'): LocationCommandSelection {
    if (clickAction === 'reveal') {
        return {
            command: 'editor.action.goToLocations',
            mode: 'goto'
        };
    }

    return {
        command: 'editor.action.peekLocations',
        mode: 'peek'
    };
}
