import type { FluentIcon } from "./FluentIcon";

/**
 * Represents an action that can be invoked from the search result list.
 */
export type SearchResultItemAction = {
    /**
     * The description of the action. This will be shown in the flyout of the additional action menu.
     */
    description: string;

    /**
     * The translation of the description. If given, this will be used instead of the description.
     */
    descriptionTranslation?: { key: string; namespace: string };

    /**
     * The argument that will be passed to the action handler when invoking the action.
     * if handlerId is Commandline,argument need JSON.stringify({})
     */
    argument: string;

    /**
     * The ID of the action handler that will be invoked when invoking the action.
     * navigateTo: navigate new page
     * copyToClipboard: copy to clipboard
     * Commandline: system cmd
     */
    handlerId:
    | 'Custom'
    | 'AppearanceSwitcher'
    | 'Commandline'
    | 'copyToClipboard'
    | 'excludeFromSearchResults'
    | 'Favorites'
    | 'navigateTo'
    | 'OpenFilePath'
    | 'OpenFile'
    | 'Url'
    | 'UeliCommand'
    | 'Workflow'
    | 'LaunchDesktopFile'
    | 'LaunchTerminalActionHandler'
    | 'WindowsOpenAsAdministrator'
    | 'WindowsSystemSetting'
    | 'ShowItemInFileExplorer'
    | 'SystemCommandActionHandler';

    /**
     * Determines if the action requires confirmation before invoking.
     */
    requiresConfirmation?: boolean;

    /**
     * The icon of the action. This icon will be used in the additional action menu.
     */
    fluentIcon?: FluentIcon;

    /**
     * Determines if the window should be hidden after invoking the action. The option "Hide window after invocation"
     * in the settings is disabled, this option will be ignored.
     */
    hideWindowAfterInvocation?: boolean;

    /**
     * The keyboard shortcut that can be used to invoke the action, in the following format: `<KEY>` or `<MODIFIER>+<KEY>`,
     * for example: `Ctrl+C`, `Shift+ArrowUp` or `Enter`. Currently supported modifiers are: `Ctrl`, `Cmd`, `Shift` and
     * `Alt`. If the action is the default action this property will be ignored and overwritten with
     * `Enter`.
     */
    keyboardShortcut?: string;

    itemId?: string;
    extensionId?: string;
};