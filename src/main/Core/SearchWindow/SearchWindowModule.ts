import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import type { UeliCommandInvokedEvent } from "@Core/UeliCommand";
import type { OperatingSystem, SearchResultItem, SearchResultItemAction } from "@common/Core";
import { BrowserWindow } from "electron";
import type { SystemCommand } from "../../Extensions/SystemCommands/SystemCommand";
import type { BrowserWindowConstructorOptionsProvider } from "./BrowserWindowConstructorOptionsProvider";
import {
    DefaultBrowserWindowConstructorOptionsProvider,
    LinuxBrowserWindowConstructorOptionsProvider,
    MacOsBrowserWindowConstructorOptionsProvider,
    WindowsBrowserWindowConstructorOptionsProvider,
} from "./BrowserWindowConstructorOptionsProvider";
import { BrowserWindowToggler } from "./BrowserWindowToggler";

export class SearchWindowModule {
    private static readonly DefaultHideWindowOnOptions = ["blur", "afterInvocation", "escapePressed"];

    public static async bootstrap(moduleRegistry: UeliModuleRegistry) {
        const app = moduleRegistry.get("App");
        const appIconFilePathResolver = moduleRegistry.get("BrowserWindowAppIconFilePathResolver");
        const backgroundMaterialProvider = moduleRegistry.get("BrowserWindowBackgroundMaterialProvider");
        const eventSubscriber = moduleRegistry.get("EventSubscriber");
        const eventEmitter = moduleRegistry.get("EventEmitter");
        const htmlLoader = moduleRegistry.get("BrowserWindowHtmlLoader");
        const ipcMain = moduleRegistry.get("IpcMain");
        const nativeTheme = moduleRegistry.get("NativeTheme");
        const operatingSystem = moduleRegistry.get("OperatingSystem");
        const settingsManager = moduleRegistry.get("SettingsManager");
        const vibrancyProvider = moduleRegistry.get("BrowserWindowVibrancyProvider");
        const browserWindowRegistry = moduleRegistry.get("BrowserWindowRegistry");
        const ueliCommandInvoker = moduleRegistry.get("UeliCommandInvoker");
        const extensionRegistry = moduleRegistry.get("ExtensionRegistry");
        const systemCommands: any = extensionRegistry.getAll().find((extension) => extension.id === "SystemCommands");
        const systemCommandMap = ((await systemCommands.systemCommandRepository.getAll()) as SystemCommand[]).reduce(
            (total, cur) => {
                const item = cur.toSearchResultItem();
                total[item.name] = item;
                return total;
            },
            {} as Record<string, SearchResultItem>,
        );

        const defaultBrowserWindowOptions = new DefaultBrowserWindowConstructorOptionsProvider(
            app,
            settingsManager,
            appIconFilePathResolver,
        ).get();

        const browserWindowConstructorOptionsProviders: Record<
            OperatingSystem,
            BrowserWindowConstructorOptionsProvider
        > = {
            Linux: new LinuxBrowserWindowConstructorOptionsProvider(defaultBrowserWindowOptions),
            macOS: new MacOsBrowserWindowConstructorOptionsProvider(defaultBrowserWindowOptions, vibrancyProvider),
            Windows: new WindowsBrowserWindowConstructorOptionsProvider(
                defaultBrowserWindowOptions,
                backgroundMaterialProvider,
            ),
        };

        const searchWindow = new BrowserWindow(browserWindowConstructorOptionsProviders[operatingSystem].get());

        searchWindow.on("close", () => browserWindowRegistry.getById("settings")?.close());

        browserWindowRegistry.register("search", searchWindow);

        searchWindow.setVisibleOnAllWorkspaces(settingsManager.getValue("window.visibleOnAllWorkspaces", false));

        if (app.isPackaged) {
            searchWindow.removeMenu();
        }

        if (process.env.NODE_ENV === "development") {
            searchWindow.webContents.on("before-input-event", (event, input) => {
                if (input.key === "F12") {
                    searchWindow.webContents.openDevTools();
                    event.preventDefault();
                }
            });
        }

        const browserWindowToggler = new BrowserWindowToggler(
            operatingSystem,
            app,
            searchWindow,
            browserWindowRegistry,
        );

        nativeTheme.on("updated", () => searchWindow.setIcon(appIconFilePathResolver.getAppIconFilePath()));

        const settingsWindowIsVisible = () => {
            const settingsWindow = browserWindowRegistry.getById("settings");
            return settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible();
        };

        const shouldHideWindowOnBlur = () =>
            settingsManager
                .getValue("window.hideWindowOn", SearchWindowModule.DefaultHideWindowOnOptions)
                .includes("blur") && !settingsWindowIsVisible();

        searchWindow.on("blur", () => shouldHideWindowOnBlur() && browserWindowToggler.hide());

        const shouldHideWindowAfterInvocation = (action: SearchResultItemAction) =>
            action.hideWindowAfterInvocation &&
            settingsManager
                .getValue("window.hideWindowOn", SearchWindowModule.DefaultHideWindowOnOptions)
                .includes("afterInvocation");

        const shouldHideWindowOnEscapePressed = () =>
            settingsManager
                .getValue("window.hideWindowOn", SearchWindowModule.DefaultHideWindowOnOptions)
                .includes("escapePressed");

        eventSubscriber.subscribe("settingsWindowClosed", () => {
            if (searchWindow.isVisible() && !searchWindow.isFocused()) {
                browserWindowToggler.showAndFocus();
            }
        });

        eventSubscriber.subscribe("actionInvocationStarted", ({ action }: { action: SearchResultItemAction }) => {
            if (shouldHideWindowAfterInvocation(action)) {
                browserWindowToggler.hide();
            }
        });

        eventSubscriber.subscribe("hotkeyPressed", () => browserWindowToggler.toggle());

        const sendSetSearchInput = (searchTerm: string) => {
            browserWindowToggler.showAndFocus();
            searchWindow.webContents.send("set-search-input", { searchTerm });
        };

        eventSubscriber.subscribe("setSearchInput", (searchTerm: string) => {
            sendSetSearchInput(searchTerm);
        });
        eventSubscriber.subscribe("syCommandHotkeyPressed", (content: string) => {
            const systemCommandName = content.split("/")[1];

            if (systemCommandMap[systemCommandName]) {
                const systemCommand = systemCommandMap[systemCommandName];
                eventEmitter.emitEvent("invokeAction", { action: systemCommand.defaultAction });
            }
        });

        eventSubscriber.subscribe("settingUpdated", ({ key, value }: { key: string; value: unknown }) => {
            searchWindow.webContents.send(`settingUpdated[${key}]`, { value });
        });

        eventSubscriber.subscribe("settingUpdated[window.alwaysOnTop]", ({ value }: { value: boolean }) => {
            searchWindow.setAlwaysOnTop(value);
        });

        eventSubscriber.subscribe("settingUpdated[window.backgroundMaterial]", () => {
            const backgroundMaterial = backgroundMaterialProvider.get();

            if (backgroundMaterial) {
                searchWindow.setBackgroundMaterial(backgroundMaterial);
            }
        });

        eventSubscriber.subscribe("settingUpdated[window.vibrancy]", () => {
            searchWindow.setVibrancy(vibrancyProvider.get());
        });

        eventSubscriber.subscribe("settingUpdated[window.visibleOnAllWorkspaces]", ({ value }: { value: boolean }) => {
            searchWindow.setVisibleOnAllWorkspaces(value);
        });

        ipcMain.on("escapePressed", () => shouldHideWindowOnEscapePressed() && browserWindowToggler.hide());
        ipcMain.on("rescanExtensionsKeyboardShortcutPressed", () =>
            ueliCommandInvoker.invokeUeliCommand("rescanExtensions"),
        );

        app.on("second-instance", (_, argv) => {
            if (argv.includes("--toggle")) {
                browserWindowToggler.toggle();
            } else {
                browserWindowToggler.showAndFocus();
            }
        });

        eventSubscriber.subscribe("ueliCommandInvoked", ({ ueliCommand }: UeliCommandInvokedEvent<unknown>) => {
            const map: Record<string, () => void> = {
                show: () => browserWindowToggler.showAndFocus(),
                centerWindow: () => searchWindow.center(),
            };

            if (Object.keys(map).includes(ueliCommand)) {
                map[ueliCommand]();
            }
        });

        await htmlLoader.loadHtmlFile(searchWindow, "search.html");
    }
}
