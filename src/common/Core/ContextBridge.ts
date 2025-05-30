import type {
    IpcRenderer,
    OpenDialogOptions,
    OpenDialogReturnValue,
    OpenExternalOptions,
    SaveDialogOptions,
    SaveDialogReturnValue,
} from "electron";
import type { AboutUeli } from "./AboutUeli";
import type { ExtensionInfo } from "./ExtensionInfo";
import type { InstantSearchResultItems } from "./InstantSearchResultItems";
import type { OperatingSystem } from "./OperatingSystem";
import type { RescanStatus } from "./RescanStatus";
import type { SearchResultItem } from "./SearchResultItem";
import type { SearchResultItemAction } from "./SearchResultItemAction";
import type { Terminal } from "./Terminal";
import type { Resources, Translations } from "./Translator";

/**
 * Represents the context bridge that is used to expose Electron APIs to the renderer process.
 */
export type ContextBridge = {
    ipcRenderer: {
        on: IpcRenderer["on"];
        off: IpcRenderer["off"];
        send: IpcRenderer["send"];
        sendSync: IpcRenderer["sendSync"];
        invoke: IpcRenderer["invoke"];
    };

    autostartIsEnabled: () => boolean;
    autostartSettingsChanged: (autostartIsEnabled: boolean) => void;
    copyTextToClipboard: (textToCopy: string) => void;
    exportSettings: (filePath: string) => Promise<void>;
    openSettingsFile: () => Promise<void>;
    extensionDisabled: (extensionId: string) => void;
    extensionEnabled: (extensionId: string) => void;
    fileExists: (filePath: string) => boolean;
    getAboutUeli: () => AboutUeli;
    getAvailableExtensions: () => ExtensionInfo[];
    getAvailableTerminals: () => Terminal[];
    getEnabledExtensions: () => ExtensionInfo[];
    getEnvironmentVariable: (environmentVariable: string) => string | undefined;
    getExcludedSearchResultItemIds: () => string[];
    getExtension: (extensionId: string) => ExtensionInfo;
    getExtensionAssetFilePath: (extensionId: string, key: string) => string;
    getExtensionResources: <T extends Translations>() => { extensionId: string; resources: Resources<T> }[];
    getExtensionSettingDefaultValue: <Value>(extensionId: string, settingKey: string) => Value;
    getFavorites: () => string[];
    getInstantSearchResultItems: (searchTerm: string) => InstantSearchResultItems;
    getLogs: () => string[];
    getOperatingSystem: () => OperatingSystem;
    getSearchResultItems: () => SearchResultItem[];
    getSettingValue: <Value>(key: string, defaultValue: Value, isSensitive?: boolean) => Value;
    getRescanStatus: () => RescanStatus;
    importSettings: (filePath: string) => Promise<void>;
    invokeAction: (action: SearchResultItemAction) => Promise<void>;
    invokeExtension: <Argument, Result>(extensionId: string, searchArguments: Argument) => Promise<Result>;
    openExternal: (url: string, options?: OpenExternalOptions) => Promise<void>;
    openSettings: () => void;
    removeExcludedSearchResultItem: (itemId: string) => Promise<void>;
    removeFavorite: (id: string) => Promise<void>;
    resetAllSettings: () => Promise<void>;
    restartApp: () => void;
    searchIndexCacheFileExists: () => boolean;
    showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
    showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
    triggerExtensionRescan: (extensionId: string) => Promise<void>;
    updateSettingValue: <Value>(key: string, value: Value, isSensitive?: boolean) => Promise<void>;
};
