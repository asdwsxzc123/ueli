export type ClipboardItem = {
    id?: string;
    content: string;
    /** 排序 */
    sort?: number;
};
export type ClipBoardHistorySetting = {
    prefix?: string;
    initRecords?: ClipboardItem[];
};
