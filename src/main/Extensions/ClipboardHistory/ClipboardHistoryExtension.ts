import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { EventSubscriber } from "@Core/EventSubscriber";
import type { Extension } from "@Core/Extension";
import type { Logger } from "@Core/Logger";
import type { SettingsManager } from "@Core/SettingsManager";
import {
    createEmptyInstantSearchResult,
    type InstantSearchResultItems,
    type OperatingSystem,
    type SearchResultItem,
    type SearchResultItemAction,
} from "@common/Core";
import type { Image } from "@common/Core/Image";
import type { SearchEngineId } from "@common/Core/Search";
import { searchFilter } from "@common/Core/Search/SearchFilter";
import type { ClipBoardHistorySetting, Settings } from "@common/Extensions/ClipBoardHistory";
import Database from "better-sqlite3";
import type { App } from "electron";
import { clipboard } from "electron";
import { join } from "path";
import type { ClipboardArgument } from "../../../types/Custom.type";
import { ExtensionTypeEnum } from "../../../types/Custom.type";

type ClipboardHistoryItem = {
    id: string;
    content: string;
    timestamp: string;
    count: number;
};
export class ClipboardHistoryExtension implements Extension {
    public readonly id = ExtensionTypeEnum.ClipboardHistory;
    public readonly name = "Clipboard History";
    private readonly MAX_RECORDS = 800;
    private readonly SQL_TABLE_NAME = "clipboard_history";
    private lastClipboardText = "";
    private readonly settingKey = `extension[${ExtensionTypeEnum.ClipboardHistory}].clipBoardHistorySetting`;
    public readonly nameTranslation = {
        key: "extensionName",
        namespace: `extension[${this.id}]`,
    };
    public readonly author = {
        name: "li ben",
        githubUserName: "asdwsxzc123",
    };
    private readonly getAppDBPath = () => {
        return join(this.app.getPath("userData"), "app.db");
    };

    private recentArr: SearchResultItem[] = [];

    public constructor(
        private readonly operatingSystem: OperatingSystem,
        private readonly assetPathResolver: AssetPathResolver,
        private readonly logger: Logger,
        private readonly settingsManager: SettingsManager,
        private readonly app: App,
        private readonly eventSubscriber: EventSubscriber,
    ) {
        this.subscriberEvents();
        this.initializeDatabase();
        this.setupClipboardMonitoring();
    }

    private initializeDatabase(): void {
        const db = new Database(this.getAppDBPath());

        try {
            db.prepare(
                `
                CREATE TABLE IF NOT EXISTS ${this.SQL_TABLE_NAME} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    count INTEGER  DEFAULT 1
                )
            `,
            ).run();

            db.prepare(`CREATE INDEX IF NOT EXISTS idx_count ON ${this.SQL_TABLE_NAME}(count DESC)`).run();
        } finally {
            db.close();
        }
    }
    private subscriberEvents() {
        this.eventSubscriber.subscribe("actionInvocationStarted", ({ action }: { action: SearchResultItemAction }) => {
            const { extensionId, itemId, handlerId } = action;

            if (extensionId === this.id) {
                if (handlerId === "copyToClipboard") {
                    const argument = action.argument;
                    this.lastClipboardText = argument;

                    if (itemId) {
                        this.insertOrUpdateClipboardItem(itemId.split("-")[1]);
                    }
                } else if (handlerId === "Custom") {
                    const { type, ...args } = JSON.parse(action.argument) as ClipboardArgument;

                    if (type === "addRecord") {
                        const copyText = args.copyText;
                        const setting = this.getValue();
                        const initRecords = setting.initRecords || [];
                        initRecords.push({
                            id: `clipboard-sys-${Math.random().toString(36).slice(2)}`,
                            content: copyText,
                        });

                        this.settingsManager.updateValue(this.settingKey, { ...setting, initRecords });
                        this.getClipboardHistory();
                    }
                }
            }
        });
    }

    private setupClipboardMonitoring(): void {
        this.lastClipboardText = clipboard.readText();

        setInterval(() => {
            const currentText = clipboard.readText();

            if (currentText && currentText !== this.lastClipboardText) {
                this.lastClipboardText = currentText;
                this.insertClipboardItem(currentText);
            }
        }, 500);
    }
    private insertClipboardItem(text: string) {
        const db = new Database(this.getAppDBPath());

        try {
            db.transaction(() => {
                const existingItem: any = db
                    .prepare(
                        `
                    SELECT id FROM ${this.SQL_TABLE_NAME}
                    WHERE content = ?
                `,
                    )
                    .get(text);

                if (existingItem) {
                    db.prepare(
                        `
                        UPDATE ${this.SQL_TABLE_NAME}
                        SET count = count + 1,
                            timestamp = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `,
                    ).run(existingItem.id);
                } else {
                    db.prepare(
                        `
                        INSERT INTO ${this.SQL_TABLE_NAME} (content, count, timestamp)
                        VALUES (?, 1, CURRENT_TIMESTAMP)
                    `,
                    ).run(text);

                    const total = db
                        .prepare(
                            `
                        SELECT COUNT(*) FROM ${this.SQL_TABLE_NAME}
                    `,
                        )
                        .pluck()
                        .get() as number;

                    if (total > this.MAX_RECORDS) {
                        db.prepare(
                            `
                            DELETE FROM ${this.SQL_TABLE_NAME}
                            WHERE id IN (
                                SELECT id FROM ${this.SQL_TABLE_NAME}
                                ORDER BY timestamp ASC, count ASC
                                LIMIT ?
                            )
                        `,
                        ).run(total - this.MAX_RECORDS);
                    }
                }
            })();
        } catch (error) {
            this.logger.error(`operator error: ${error}`);
            return null;
        } finally {
            db.close();
            this.getClipboardHistory();
        }
    }

    private insertOrUpdateClipboardItem(id: string) {
        const db = new Database(this.getAppDBPath());

        try {
            db.transaction(() => {
                db.prepare(
                    `
                    UPDATE ${this.SQL_TABLE_NAME}
                    SET count = count + 1,
                        timestamp = CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                ).run(id);
            })();
        } catch (error) {
            this.logger.error(`update error: ${error}`);
            return null;
        } finally {
            db.close();
            this.getClipboardHistory();
        }
    }
    public async getSearchResultItems(): Promise<SearchResultItem[]> {
        // const recentArr: ClipboardHistoryItem[] = [];

        // for (const recent of this.getClipboardHistory()) {
        //     try {
        //         recentArr.push(await this.getRecent(recent));
        //     } catch (error) {
        //         this.logger.error(this.id + ": " + error);
        //     }
        // }

        this.getClipboardHistory();
        return [];
    }
    private getSearchResultItem(recent: ClipboardHistoryItem): SearchResultItem {
        const id = String(recent?.id)?.includes("sys") ? recent.id : `clipboard-${recent.id}`;
        return {
            id,
            name: recent.content,
            description: this.getTag(recent),
            image: this.getImage(),
            defaultAction: {
                handlerId: "copyToClipboard",
                description: `Copy to clipboard`,
                argument: recent.content,
                hideWindowAfterInvocation: true,
                itemId: id,
                extensionId: this.id,
            },
            additionalActions: [
                {
                    handlerId: "Custom",
                    description: `Add to system clipboard setting`,
                    argument: JSON.stringify({
                        copyText: recent.content,
                        type: "addRecord",
                    } as ClipboardArgument),
                    // hideWindowAfterInvocation: false,
                    itemId: id,
                    extensionId: this.id,
                },
            ],
        };
    }
    private getTag(recent: ClipboardHistoryItem): string {
        if (String(recent?.id)?.includes("sys")) {
            return "system";
        }

        return recent.count > 99 ? "99+" : String(recent.count);
    }
    public getClipboardHistory() {
        const values = this.getValue();
        const db = new Database(this.getAppDBPath());

        try {
            let query = `SELECT id, content, timestamp, count
                        FROM ${this.SQL_TABLE_NAME}`;

            const params = [];

            // 按时间倒序排列并限制数量
            query += ` ORDER BY timestamp DESC LIMIT ?`;
            params.push(this.MAX_RECORDS);

            const stmt = db.prepare(query);
            const list = stmt.all(...params) as ClipboardHistoryItem[];
            this.recentArr = (values?.initRecords || ([] as any))
                .concat(list)
                .map((recent: ClipboardHistoryItem) => this.getSearchResultItem(recent));
        } catch (error) {
            this.logger.error(`query db error: ${error}`);
            this.recentArr = ((values?.initRecords as any) || []).map((recent: ClipboardHistoryItem) =>
                this.getSearchResultItem(recent),
            );
        } finally {
            db.close();
        }
    }

    public getImage(): Image {
        const path = this.assetPathResolver.getExtensionAssetPath(this.id, "index.png");

        return {
            url: `file://${path}`,
        };
    }
    public isSupported(): boolean {
        return ["macOS", "Linux", "Windows"].includes(this.operatingSystem);
    }

    public getSettingDefaultValue<T extends keyof Settings>(key: T): Settings[T] {
        const defaultSettings: Settings = {
            clipBoardHistorySetting: {
                prefix: "copy",
            },
        };

        return defaultSettings[key];
    }

    public getDefaultFileImage(): Image {
        const path = this.assetPathResolver.getExtensionAssetPath("VSCode", "default-file-icon.png");

        return {
            url: `file://${path}`,
        };
    }

    public getI18nResources() {
        return {
            "en-US": {
                extensionName: this.name,
                prefix: "Prefix",
                prefixDescription:
                    "The prefix to trigger Clipboard History. Open recently opened files and projects: <prefix>",
            },
        };
    }

    public getInstantSearchResultItems(searchTerm: string): InstantSearchResultItems {
        // 只要基于prefix的前缀存在,就显示
        const prefix = this.getPrefix();

        if (prefix.trim() !== "" && !searchTerm.startsWith(prefix + " ")) {
            return createEmptyInstantSearchResult();
        }

        searchTerm = searchTerm.replace(prefix + " ", "").trim();
        return this.getFilterSearchResults(searchTerm);
    }

    private getFilterSearchResults(searchTerm: string): InstantSearchResultItems {
        const searchResultItems = this.recentArr;
        const maxSearchResultItems = this.settingsManager.getValue<number>("searchEngine.maxResultLength", 100);

        if (searchTerm === "") {
            return {
                before: searchResultItems.slice(0, maxSearchResultItems),
                after: [],
            };
        }

        const fuzziness = this.settingsManager.getValue<number>("searchEngine.fuzziness", 0.5);
        const searchEngineId = this.settingsManager.getValue<SearchEngineId>("searchEngine.id", "fuzzysort");
        return {
            before: searchFilter(
                {
                    searchResultItems,
                    searchTerm,
                    fuzziness,
                    maxSearchResultItems,
                },
                searchEngineId,
            ),
            after: [],
        };
    }

    private getPrefix(): string {
        const obj = this.settingsManager.getValue<ClipBoardHistorySetting>(this.settingKey, { prefix: "copy" });
        return obj?.prefix || "copy";
    }
    private getValue() {
        return this.settingsManager.getValue<ClipBoardHistorySetting>(this.settingKey, { prefix: "copy" });
    }
}

export const isPath = (searchTerm: string | null | undefined) => {
    if (!searchTerm) {
        return false;
    }

    const windowMatch = searchTerm.match(/[A-Z]:.*/) !== null;
    return searchTerm.startsWith("/") || searchTerm.startsWith("~") || windowMatch;
};
