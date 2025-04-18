import { useSetting } from "@Core/Hooks";
import { useStateRef } from "@Core/Hooks/useStateRef";
import type { OperatingSystem, SearchResultItem, SearchResultItemAction } from "@common/Core";
import type { SearchEngineId } from "@common/Core/Search";
import { useEffect, useRef, useState } from "react";
import { getActions, getNextSearchResultItemId, getPreviousSearchResultItemId } from "./Helpers";
import { getSearchResult } from "./Helpers/getSearchResult";

type ViewModel = {
    searchTerm: string;
    selectedItemId: string;
    /** all Searched items */
    searchResult: Record<string, SearchResultItem[]>;
};

type SearchViewControllerProps = {
    searchResultItems: SearchResultItem[];
    excludedSearchResultItemIds: string[];
    favoriteSearchResultItemIds: string[];
    operatingSystem: OperatingSystem;
};

const collectSearchResultItems = (searchResult: Record<string, SearchResultItem[]>) => {
    const result = [];

    for (const key of Object.keys(searchResult)) {
        result.push(...searchResult[key]);
    }

    return result;
};

export const useSearchViewController = ({
    searchResultItems,
    excludedSearchResultItemIds,
    favoriteSearchResultItemIds,
    operatingSystem,
}: SearchViewControllerProps) => {
    const [viewModel, setViewModel] = useState<ViewModel>({
        searchResult: {},
        searchTerm: "",
        selectedItemId: "",
    });
    const selectedItemIdRef = useStateRef(viewModel.selectedItemId);
    const keyboardShortcuts: Record<OperatingSystem, Record<"addToFavorites" | "excludeFromSearchResults", string>> = {
        Linux: {
            addToFavorites: "Ctrl+F",
            excludeFromSearchResults: "Ctrl+Delete",
        },
        macOS: {
            addToFavorites: "Cmd+F",
            excludeFromSearchResults: "Cmd+Delete",
        },
        Windows: {
            addToFavorites: "Ctrl+F",
            excludeFromSearchResults: "Ctrl+Delete",
        },
    };
    const userInputRef = useRef<HTMLInputElement>(null);
    const resetViewModal = () => {
        search("");
    };

    useEffect(() => {
        const handler = () => {
            resetViewModal();
        };
        window.ContextBridge.ipcRenderer.on("clear-search-input", handler);
        return () => {
            window.ContextBridge.ipcRenderer.off("clear-search-input", handler);
        };
    }, []);

    const setSearchTerm = (searchTerm: string) => setViewModel({ ...viewModel, searchTerm });

    const setSelectedItemId = (selectedItemId: string) => setViewModel({ ...viewModel, selectedItemId });

    const setSearchResult = (searchResult: Record<string, SearchResultItem[]>) => {
        return setViewModel({ ...viewModel, searchResult });
    };

    const selectNextSearchResultItem = () =>
        setSelectedItemId(
            getNextSearchResultItemId(viewModel.selectedItemId, collectSearchResultItems(viewModel.searchResult)),
        );

    const selectPreviousSearchResultItem = () =>
        setSelectedItemId(
            getPreviousSearchResultItemId(viewModel.selectedItemId, collectSearchResultItems(viewModel.searchResult)),
        );

    /**
     *
     * @param sort starting from 1
     * @returns
     */
    const selectSortSearchResultItem = (sort: number) => {
        const id = collectSearchResultItems(viewModel.searchResult)[sort - 1]?.id ?? viewModel.selectedItemId;
        setSelectedItemId(id);
        return id;
    };

    const getSelectedSearchResultItem = (id?: string): SearchResultItem | undefined => {
        if (id) {
            return collectSearchResultItems(viewModel.searchResult).find((s) => s.id === id);
        } else {
            return collectSearchResultItems(viewModel.searchResult).find((s) => s.id === selectedItemIdRef.current);
        }
    };

    const getSelectedSearchResultItemActions = (id?: string): SearchResultItemAction[] => {
        const selectedSearchResultItem = getSelectedSearchResultItem(id);
        return selectedSearchResultItem
            ? getActions(selectedSearchResultItem, favoriteSearchResultItemIds, keyboardShortcuts[operatingSystem])
            : [];
    };

    const { value: fuzziness } = useSetting({ key: "searchEngine.fuzziness", defaultValue: 0.5 });
    const { value: maxSearchResultItems } = useSetting({ key: "searchEngine.maxResultLength", defaultValue: 50 });
    const { value: searchEngineId } = useSetting<SearchEngineId>({ key: "searchEngine.id", defaultValue: "fuzzysort" });

    const search = (searchTerm: string, selectedItemId?: string) => {
        const searchResult = getSearchResult({
            searchEngineId,
            excludedSearchResultItemIds,
            favoriteSearchResultItemIds,
            fuzziness,
            instantSearchResultItems: window.ContextBridge.getInstantSearchResultItems(searchTerm),
            maxSearchResultItems,
            searchResultItems,
            searchTerm,
        });

        setViewModel({
            searchTerm,
            selectedItemId: selectedItemId ?? collectSearchResultItems(searchResult)[0]?.id,
            searchResult,
        });
    };

    const focusUserInput = () => userInputRef.current?.focus();
    const selectUserInput = () => userInputRef.current?.select();

    const [confirmationDialogAction, setConfirmationDialogAction] = useState<SearchResultItemAction | undefined>(
        undefined,
    );

    const invokeSelectedSearchResultItem = async () => {
        const searchResultItem = getSelectedSearchResultItem();

        if (!searchResultItem || !searchResultItem.defaultAction) {
            return;
        }

        await invokeAction(searchResultItem.defaultAction);
    };

    const invokeAction = async (action: SearchResultItemAction) => {
        if (!action.requiresConfirmation) {
            await window.ContextBridge.invokeAction(action);
            return;
        }

        // This timeout is a workaround. Without it, for some reason the close button in the confirmation dialog will
        // trigger an "onClick" event and therefore will be closed immediately.
        setTimeout(() => setConfirmationDialogAction(action), 100);
    };

    return {
        invokeAction,
        invokeSelectedSearchResultItem,
        search,
        searchTerm: {
            set: setSearchTerm,
            value: viewModel.searchTerm,
        },
        selectedItemId: {
            set: setSelectedItemId,
            value: viewModel.selectedItemId,
            next: selectNextSearchResultItem,
            previous: selectPreviousSearchResultItem,
            setSort: selectSortSearchResultItem,
        },
        searchResult: {
            value: viewModel.searchResult,
            set: setSearchResult,
            current: () => getSelectedSearchResultItem(),
            currentActions: (id?: string) => getSelectedSearchResultItemActions(id),
        },
        userInput: {
            ref: userInputRef,
            focus: focusUserInput,
            select: selectUserInput,
        },
        confirmationDialog: {
            action: {
                set: setConfirmationDialogAction,
                reset: () => setConfirmationDialogAction(undefined),
                value: confirmationDialogAction,
            },
        },
    };
};
