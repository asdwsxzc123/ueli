import type { ClipBoardHistorySetting, ClipboardItem, Settings } from "@common/Extensions/ClipBoardHistory";
import { useExtensionSetting } from "@Core/Hooks";
import { Setting } from "@Core/Settings/Setting";
import {
    Button,
    DialogTrigger,
    Input,
    Label,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Tooltip,
} from "@fluentui/react-components";
import { AddRegular, DismissRegular, EditRegular } from "@fluentui/react-icons";
import { useState } from "react";
import { ExtensionTypeEnum } from "../../../types/Custom.type";
import { ClipboardHistoryDialog } from "./ClipboardHistoryDialog";

export const ClipboardHistorySettings = () => {
    const extensionId = ExtensionTypeEnum.ClipboardHistory;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [row, setRow] = useState<ClipboardItem>();
    const { value: clipBoardHistorySetting, updateValue: setCustomSearchEngineSettings } = useExtensionSetting<
        Settings["clipBoardHistorySetting"]
    >({
        extensionId,
        key: "clipBoardHistorySetting",
    });
    const updateClipboardSetting = (field: Partial<ClipBoardHistorySetting>) => {
        setCustomSearchEngineSettings({ ...clipBoardHistorySetting, ...field });
    };
    const updateClipboardRecord = (row: ClipboardItem) => {
        let initRecords = clipBoardHistorySetting?.initRecords || [];

        if (!row.id) {
            row.id = `clipboard-sys-${Math.random().toString(36).slice(2)}`;
            initRecords.push(row);
        } else {
            const index = initRecords.findIndex((item) => item.id === row.id);
            initRecords[index] = row;
        }

        initRecords = initRecords.sort((a, b) => {
            return (a.sort || 0) - (b.sort || 0);
        });
        setCustomSearchEngineSettings({ ...clipBoardHistorySetting, initRecords });
    };

    const removeClipboardRecord = (id: string) => {
        const initRecords = clipBoardHistorySetting?.initRecords || [];
        const arr = initRecords.filter((item) => item.id !== id);
        setCustomSearchEngineSettings({ ...clipBoardHistorySetting, initRecords: arr });
    };

    const openEditDialog = (row?: ClipboardItem) => {
        if (row === undefined) {
            setRow(undefined);
        } else {
            setRow(row);
        }

        setIsDialogOpen(true);
    };
    return (
        <div>
            <div className="flex justify-between mb-[12px]">
                <Label weight="semibold">Clipboard History</Label>
                <div>
                    <DialogTrigger disableButtonEnhancement>
                        <Button onClick={() => openEditDialog()} icon={<AddRegular />}>
                            Add Clipboard Record
                        </Button>
                    </DialogTrigger>
                    {isDialogOpen && (
                        <ClipboardHistoryDialog
                            isAddDialog={!row?.id}
                            isDialogOpen={isDialogOpen}
                            closeDialog={() => setIsDialogOpen(false)}
                            onSave={updateClipboardRecord}
                            initialEngineSetting={row}
                        />
                    )}
                </div>
            </div>
            <div className="mb-[12px]">
                <Setting
                    label={"Prefix"}
                    control={
                        <Input
                            value={clipBoardHistorySetting?.prefix}
                            onChange={(_, { value }) => updateClipboardSetting({ prefix: value })}
                        />
                    }
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell style={{ width: 80 }}>{"id"}</TableHeaderCell>
                        <TableHeaderCell style={{ width: 180 }}>{"Content"}</TableHeaderCell>
                        <TableHeaderCell style={{ width: 20 }}>{"Sort"}</TableHeaderCell>
                        <TableHeaderCell style={{ width: 70 }}>{"Operator"}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clipBoardHistorySetting?.initRecords?.map((row) => {
                        const { id, content, sort } = row;
                        return (
                            <TableRow key={id}>
                                <TableCell>{id}</TableCell>
                                <TableCell>{content}</TableCell>
                                <TableCell>{sort || 0}</TableCell>
                                <TableCell>
                                    <Tooltip relationship="label" content={"edit"}>
                                        <Button
                                            size="small"
                                            icon={<EditRegular />}
                                            onClick={() => openEditDialog(row)}
                                        />
                                    </Tooltip>
                                    <Tooltip relationship="label" content={"remove"}>
                                        <Button
                                            style={{ marginLeft: 4 }}
                                            size="small"
                                            icon={<DismissRegular />}
                                            onClick={() => removeClipboardRecord(id as string)}
                                        />
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
