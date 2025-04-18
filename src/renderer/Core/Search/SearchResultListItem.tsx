import type { SearchResultItem } from "@common/Core";
import { tokens } from "@fluentui/react-components";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CompactSearchResultListItem } from "./CompactSearchResultListItem";
import { DetailedSearchResultListItem } from "./DetailedSearchResultItem";
import { elementIsVisible } from "./Helpers";
import { SearchResultListItemSelectedIndicator } from "./SearchResultListItemSelectedIndicator";
import type { SearchResultListLayout } from "./SearchResultListLayout";

type SearchResultListItemProps = {
    containerRef: RefObject<HTMLDivElement>;
    isSelected: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    layout: SearchResultListLayout;
    searchResultItem: SearchResultItem;
    scrollBehavior: ScrollBehavior;
    dragAndDropEnabled: boolean;
    sort: number;
};

export const SearchResultListItem = ({
    containerRef,
    isSelected,
    onClick,
    onDoubleClick,
    searchResultItem,
    scrollBehavior,
    layout,
    dragAndDropEnabled,
    sort,
}: SearchResultListItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const scrollIntoViewIfSelectedAndNotVisible = () => {
        if (containerRef.current && ref.current && isSelected && !elementIsVisible(ref.current, containerRef.current)) {
            ref.current?.scrollIntoView({ behavior: scrollBehavior, block: "nearest" });
        }
    };

    const selectedBackgroundColor = tokens.colorNeutralBackground1Selected;
    const hoveredBackgroundColor = tokens.colorNeutralBackground1Hover;

    useEffect(() => {
        scrollIntoViewIfSelectedAndNotVisible();
    }, [isSelected]);

    return (
        <div
            ref={ref}
            key={searchResultItem.id}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={dragAndDropEnabled && searchResultItem.dragAndDrop !== undefined}
            onDragStart={({ preventDefault }) => {
                if (dragAndDropEnabled && searchResultItem.dragAndDrop) {
                    preventDefault();
                    window.ContextBridge.ipcRenderer.send("dragStarted", searchResultItem.dragAndDrop);
                }
            }}
            style={{
                position: "relative",
                backgroundColor: isSelected ? selectedBackgroundColor : isHovered ? hoveredBackgroundColor : undefined,
                userSelect: "none",
                borderRadius: tokens.borderRadiusMedium,
                cursor: "pointer",
            }}
        >
            {isSelected && <SearchResultListItemSelectedIndicator />}
            {layout === "compact" && <CompactSearchResultListItem searchResultItem={searchResultItem} sort={sort} />}
            {layout === "detailed" && <DetailedSearchResultListItem searchResultItem={searchResultItem} />}
        </div>
    );
};
