import { KeyboardShortcut } from "@Core/Components";
import { useRescanStatus, useSetting } from "@Core/Hooks";
import type { OperatingSystem, SearchResultItem } from "@common/Core";
import { Button, Divider, Text, tokens, Tooltip } from "@fluentui/react-components";
import { Settings16Regular } from "@fluentui/react-icons";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { BaseLayout } from "../BaseLayout";
import { Footer } from "../Footer";
import { ActionsMenu } from "./ActionsMenu";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { getSearchResultItemActionByKeyboardshortcut } from "./Helpers";
import type { KeyboardEventHandler } from "./KeyboardEventHandler";
import { NoResultsFound } from "./NoResultsFound";
import { RescanIndicator } from "./RescanIndicator";
import { SearchBar } from "./SearchBar";
import type { SearchBarAppearance } from "./SearchBarAppearance";
import type { SearchBarSize } from "./SearchBarSize";
import { SearchHistory } from "./SearchHistory";
import { useSearchHistoryController } from "./SearchHistoryController";
import { SearchResultList } from "./SearchResultList";
import type { SearchResultListLayout } from "./SearchResultListLayout";
import { useSearchViewController } from "./SearchViewController";

type SearchProps = {
    searchResultItems: SearchResultItem[];
    excludedSearchResultItemIds: string[];
    favoriteSearchResultItemIds: string[];
};

export const Search = ({
    searchResultItems,
    excludedSearchResultItemIds,
    favoriteSearchResultItemIds,
}: SearchProps) => {
    const { t } = useTranslation();

    const [additionalActionsMenuIsOpen, setAdditionalActionsMenuIsOpen] = useState(false);

    const operatingSystem = window.ContextBridge.getOperatingSystem();

    const {
        searchResult,
        searchTerm,
        selectedItemId,
        search,
        userInput,
        confirmationDialog,
        invokeAction,
        invokeSelectedSearchResultItem,
    } = useSearchViewController({
        searchResultItems,
        excludedSearchResultItemIds,
        favoriteSearchResultItemIds: [],
        operatingSystem,
    });
    const searchHistory = useSearchHistoryController();
    const containerRef = useRef<HTMLDivElement>(null);
    const additionalActionsButtonRef = useRef<HTMLButtonElement>(null);

    const handleUserInputKeyDownEvent = (keyboardEvent: ReactKeyboardEvent<HTMLElement>) => {
        const eventHandlers: KeyboardEventHandler[] = [
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.key === "Escape",
                    action: () => window.ContextBridge.ipcRenderer.send("escapePressed"),
                }),
            },
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.key === "ArrowUp",
                    action: () => selectedItemId.previous(),
                }),
            },
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.ctrlKey && keyboardEvent.key === "p",
                    action: () => selectedItemId.previous(),
                }),
            },
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.key === "ArrowDown",
                    action: () => selectedItemId.next(),
                }),
            },
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.ctrlKey && keyboardEvent.key === "n",
                    action: () => selectedItemId.next(),
                }),
            },
            {
                check: (keyboardEvent) => ({
                    shouldInvokeAction: keyboardEvent.ctrlKey && !isNaN(Number(keyboardEvent.key)),
                    action: () => {
                        const id = selectedItemId.setSort(Number(keyboardEvent.key));
                        const searchResultItemAction = searchResult
                            .currentActions(id)
                            .find((action) => action.keyboardShortcut === `Enter`);

                        if (searchResultItemAction) {
                            invokeAction(searchResultItemAction);
                        }
                    },
                }),
            },
            {
                check: (keyboardEvent) => {
                    // custom keyboard shortcuts
                    const searchResultItemAction = getSearchResultItemActionByKeyboardshortcut(
                        keyboardEvent,
                        searchResult.currentActions(),
                    );
                    return {
                        shouldInvokeAction: searchResultItemAction !== undefined,
                        action: () => {
                            searchHistory.add(searchTerm.value);

                            if (searchResultItemAction !== undefined) {
                                invokeAction(searchResultItemAction);
                            }
                        },
                    };
                },
            },
            {
                check: (keyboardEvent) => {
                    return {
                        shouldInvokeAction: keyboardEvent.key === "F5",
                        action: () => window.ContextBridge.ipcRenderer.send("rescanExtensionsKeyboardShortcutPressed"),
                    };
                },
            },
        ];

        for (const eventHandler of eventHandlers) {
            const { shouldInvokeAction, action } = eventHandler.check(keyboardEvent);

            if (shouldInvokeAction) {
                keyboardEvent.preventDefault();
                action();
                break;
            }
        }
    };

    const clickHandlers: Record<string, (s: SearchResultItem) => void> = {
        selectSearchResultItem: (s) => selectedItemId.set(s.id),
        invokeSearchResultItem: (s) => {
            searchHistory.add(searchTerm.value);
            invokeAction(s.defaultAction);
        },
    };

    const handleSearchResultItemClickEvent = (searchResultItem: SearchResultItem) => {
        const singleClickBehavior = window.ContextBridge.getSettingValue(
            "keyboardAndMouse.singleClickBehavior",
            "selectSearchResultItem",
        );

        clickHandlers[singleClickBehavior](searchResultItem);
    };

    const handleSearchResultItemDoubleClickEvent = (searchResultItem: SearchResultItem) => {
        const doubleClickBehavior = window.ContextBridge.getSettingValue(
            "keyboardAndMouse.doubleClickBehavior",
            "invokeSearchResultItem",
        );

        clickHandlers[doubleClickBehavior](searchResultItem);
    };

    const closeConfirmationDialog = () => {
        confirmationDialog.action.reset();
        userInput.focus();
    };

    const toggleAdditionalActionsMenu = (open: boolean) => {
        setAdditionalActionsMenuIsOpen(open);

        if (!open) {
            userInput.focus();
            userInput.select();
        }
    };

    const windowKeyDownEventHandlers: {
        validate: (e: KeyboardEvent) => boolean;
        action: (e: KeyboardEvent) => void;
    }[] = [
        {
            validate: (event) =>
                window.ContextBridge.getOperatingSystem() === "macOS"
                    ? event.key === "," && event.metaKey
                    : event.key === "," && event.ctrlKey,
            action: (event) => {
                event.preventDefault();
                window.ContextBridge.openSettings();
            },
        },
        {
            validate: (event) =>
                window.ContextBridge.getOperatingSystem() === "macOS"
                    ? event.key === "k" && event.metaKey
                    : event.key === "k" && event.ctrlKey,
            action: (event) => {
                event.preventDefault();
                additionalActionsButtonRef.current?.click();
            },
        },
        {
            validate: (event) =>
                window.ContextBridge.getOperatingSystem() === "macOS"
                    ? event.key === "l" && event.metaKey
                    : event.key === "l" && event.ctrlKey,
            action: () => {
                userInput.focus();
                userInput.select();
            },
        },
    ];

    const keyboardShortcuts: Record<"openSettings" | "openAdditionalActionsMenu", Record<OperatingSystem, string>> = {
        openSettings: {
            Windows: "^+,",
            Linux: "^+,",
            macOS: "⌘+,",
        },
        openAdditionalActionsMenu: {
            Windows: "^+K",
            Linux: "^+K",
            macOS: "⌘+K",
        },
    };

    const currentDefaultActionDescription = () => {
        const defaultAction = searchResult.current()?.defaultAction;

        if (defaultAction) {
            return defaultAction.descriptionTranslation
                ? t(defaultAction.descriptionTranslation.key, { ns: defaultAction.descriptionTranslation.namespace })
                : defaultAction.description;
        }
    };

    useEffect(() => {
        const setFocusOnUserInputAndSelectText = () => {
            userInput.focus();
            userInput.select();
        };

        setFocusOnUserInputAndSelectText();

        searchHistory.closeMenu();

        const windowFocusedEventHandler = () => {
            setFocusOnUserInputAndSelectText();
            searchHistory.closeMenu();
            setAdditionalActionsMenuIsOpen(false);
        };

        const keyDownEventHandler = (event: KeyboardEvent) => {
            for (const { action, validate } of windowKeyDownEventHandlers) {
                if (validate(event)) {
                    action(event);
                }
            }
        };

        window.ContextBridge.ipcRenderer.on("windowFocused", windowFocusedEventHandler);
        window.addEventListener("keydown", keyDownEventHandler);

        return () => {
            window.ContextBridge.ipcRenderer.off("windowFocused", windowFocusedEventHandler);
            window.removeEventListener("keydown", keyDownEventHandler);
        };
    }, []);

    useEffect(() => {
        searchHistory.closeMenu();
        search(searchTerm.value, selectedItemId.value);
    }, [searchResultItems]);

    useEffect(() => {
        searchHistory.closeMenu();
        search(searchTerm.value);
    }, [favoriteSearchResultItemIds, excludedSearchResultItemIds]);

    const { value: searchBarAppearance } = useSetting<SearchBarAppearance>({
        key: "appearance.searchBarAppearance",
        defaultValue: "auto",
    });

    const { value: searchBarSize } = useSetting<SearchBarSize>({
        key: "appearance.searchBarSize",
        defaultValue: "large",
    });

    const { value: searchBarPlaceholderText } = useSetting({
        key: "appearance.searchBarPlaceholderText",
        defaultValue: t("searchBarPlaceholderText", { ns: "search" }),
    });

    const { value: searchBarShowSearchIcon } = useSetting({
        key: "appearance.showSearchIcon",
        defaultValue: true,
    });

    const { value: layout } = useSetting<SearchResultListLayout>({
        key: "appearance.searchResultListLayout",
        defaultValue: "compact",
    });

    const { status: rescanStatus } = useRescanStatus();

    const totalNumberOfSearchResultItems = Object.keys(searchResult.value).reduce(
        (previous, group) => previous + searchResult.value[group].length,
        0,
    );
    return (
        <BaseLayout
            header={
                <div
                    className="draggable-area"
                    style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        padding: 10,
                    }}
                >
                    <SearchBar
                        refObject={userInput.ref}
                        onKeyDown={handleUserInputKeyDownEvent}
                        onSearchTermUpdated={search}
                        searchTerm={searchTerm.value}
                        searchBarSize={searchBarSize}
                        searchBarAppearance={searchBarAppearance}
                        searchBarPlaceholderText={searchBarPlaceholderText}
                        showIcon={searchBarShowSearchIcon}
                        contentAfter={
                            searchHistory.isEnabled ? (
                                <SearchHistory
                                    {...searchHistory}
                                    onItemSelected={search}
                                    onMenuClosed={() => {
                                        userInput.focus();
                                        userInput.select();
                                    }}
                                />
                            ) : undefined
                        }
                    />
                </div>
            }
            contentRef={containerRef}
            content={
                totalNumberOfSearchResultItems === 0 ? (
                    <NoResultsFound searchTerm={searchTerm.value} />
                ) : (
                    <>
                        <ConfirmationDialog
                            closeDialog={closeConfirmationDialog}
                            action={confirmationDialog.action.value}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                padding: 10,
                                boxSizing: "border-box",
                            }}
                        >
                            {Object.keys(searchResult.value)
                                .filter((group) => searchResult.value[group].length)
                                .map((group) => (
                                    <div key={`search-result-group-${group}`}>
                                        <div style={{ paddingBottom: 5, paddingLeft: 5 }}>
                                            <Text
                                                size={200}
                                                weight="medium"
                                                style={{ color: tokens.colorNeutralForeground4 }}
                                            >
                                                {t(`searchResultGroup.${group}`, { ns: "search" })}
                                            </Text>
                                        </div>
                                        <SearchResultList
                                            containerRef={containerRef}
                                            selectedItemId={selectedItemId.value}
                                            searchResultItems={searchResult.value[group]}
                                            onSearchResultItemClick={handleSearchResultItemClickEvent}
                                            onSearchResultItemDoubleClick={handleSearchResultItemDoubleClickEvent}
                                            layout={layout}
                                        />
                                    </div>
                                ))}
                        </div>
                    </>
                )
            }
            footer={
                <Footer draggable>
                    <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                        <Tooltip
                            withArrow
                            positioning="above-start"
                            content={
                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    {t("settings", { ns: "general" })}
                                    <KeyboardShortcut
                                        shortcut={keyboardShortcuts["openSettings"][operatingSystem]}
                                        style={{ paddingTop: 2 }}
                                    />
                                </div>
                            }
                            relationship="label"
                        >
                            <Button
                                className="non-draggable-area"
                                onClick={() => window.ContextBridge.openSettings()}
                                size="small"
                                appearance="subtle"
                                icon={<Settings16Regular />}
                            />
                        </Tooltip>
                        {rescanStatus === "scanning" && (
                            <>
                                <Divider appearance="subtle" vertical />
                                <RescanIndicator />
                            </>
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                        {searchResult.current() ? (
                            <Button
                                className="non-draggable-area"
                                size="small"
                                appearance="subtle"
                                onClick={invokeSelectedSearchResultItem}
                            >
                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    {currentDefaultActionDescription()}
                                    <KeyboardShortcut shortcut="Enter" />
                                </div>
                            </Button>
                        ) : null}
                        <Divider appearance="subtle" vertical />
                        <ActionsMenu
                            actions={searchResult.currentActions()}
                            invokeAction={invokeAction}
                            additionalActionsButtonRef={additionalActionsButtonRef}
                            open={additionalActionsMenuIsOpen}
                            onOpenChange={toggleAdditionalActionsMenu}
                            keyboardShortcut={keyboardShortcuts["openAdditionalActionsMenu"][operatingSystem]}
                        />
                    </div>
                </Footer>
            }
        />
    );
};
