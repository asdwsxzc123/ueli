import type { SearchResultItem } from "@common/Core";
import { Text } from "@fluentui/react-components";
import { SearchResultItemDescriptionBadge } from "./SearchResultItemDescriptionBadge";
import { SearchResultItemImage } from "./SearchResultItemImage";

type CompactSearchResultListItemProps = {
    searchResultItem: SearchResultItem;
    sort: number;
};

export const CompactSearchResultListItem = ({ searchResultItem, sort }: CompactSearchResultListItemProps) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 8,
                boxSizing: "border-box",
                gap: 8,
                width: "100%",
            }}
        >
            <div style={{ flexShrink: 0 }}>
                <SearchResultItemImage image={searchResultItem.image} altText={searchResultItem.name} size={20} />
            </div>
            <Text
                style={{
                    flexGrow: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {searchResultItem.name}
            </Text>
            <div style={{ flexShrink: 0, display: "flex" }}>
                <SearchResultItemDescriptionBadge searchResultItem={searchResultItem} />
                {sort + 1 < 10 && <Text style={{ marginLeft: 8 }}>ALT+{sort + 1}</Text>}
            </div>
        </div>
    );
};
