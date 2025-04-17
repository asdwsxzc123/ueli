export type ClipboardItem = {
    id?: string;
    content: string
}
export type ClipBoardHistorySetting = {
    prefix?: string;
    initRecords?: ClipboardItem[]
};
