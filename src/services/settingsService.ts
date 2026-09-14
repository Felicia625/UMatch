type Settings = { darkMode: boolean };

let settings: Settings = { darkMode: false };

export const settingsService = {
    get: () => settings,
    setDarkMode: (darkMode: boolean) => { settings = { ...settings, darkMode }; return settings; },
};
