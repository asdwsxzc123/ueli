import { isValidHotkey } from "@common/Core/Hotkey";
import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

export class GlobalShortcutModule {
    public static bootstrap(moduleRegistry: UeliModuleRegistry) {
        const globalShortcut = moduleRegistry.get("GlobalShortcut");
        const eventEmitter = moduleRegistry.get("EventEmitter");
        const eventSubscriber = moduleRegistry.get("EventSubscriber");
        const settingsManager = moduleRegistry.get("SettingsManager");
        const logger = moduleRegistry.get("Logger");

        const hotkeyIsEnabled = () => settingsManager.getValue("general.hotkey.enabled", true);

        const registerHotkey = () => {
            const hotkey = settingsManager.getValue("general.hotkey", "Alt+Space");
            const hotkeys = settingsManager.getValue("hotkeys", []);

            if (!isValidHotkey(hotkey)) {
                logger.error(`Unable to register hotkey. Reason: unexpected hotkey ${hotkey}`);
            }

            globalShortcut.unregisterAll();
            globalShortcut.register(hotkey, () => eventEmitter.emitEvent("hotkeyPressed"));

            hotkeys.forEach(({ hotkey, content }: { id: string; hotkey: string; content: string }) => {
                {
                    if (!hotkey) {
                        return;
                    }

                    if (!isValidHotkey(hotkey)) {
                        logger.error(`Unable to register hotkey. Reason: unexpected hotkey ${hotkey}`);
                    } else {
                        if (content.startsWith("/")) {
                            // syCommandHotkeyPressed
                            globalShortcut.register(hotkey, () =>
                                eventEmitter.emitEvent("syCommandHotkeyPressed", content),
                            );
                        } else {
                            globalShortcut.register(hotkey, () => eventEmitter.emitEvent("setSearchInput", content));
                        }
                    }
                }
            });
        };

        if (hotkeyIsEnabled()) {
            registerHotkey();
        }

        eventSubscriber.subscribe("settingUpdated[general.hotkey]", () => registerHotkey());

        eventSubscriber.subscribe("settingUpdated[general.hotkey.enabled]", () => {
            if (hotkeyIsEnabled()) {
                registerHotkey();
            } else {
                globalShortcut.unregisterAll();
            }
        });
    }
}
