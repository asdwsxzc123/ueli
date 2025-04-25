import type { ClipboardItem } from "@common/Extensions/ClipBoardHistory";
import { useSetting } from "@Core/Hooks";
import { SettingGroupList } from "@Core/Settings/SettingGroupList";
import {
    Button,
    DialogTrigger,
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
import { SettingGroup } from "../../SettingGroup";
import { HotkeyEditDialog } from "./HotkeyEditDialog";
export const Hotkeys = () => {
    const { value } = useSetting({
        key: "hotkeys",
        defaultValue: [],
    });
    console.log(`%c [Hotkeys.tsx]-[26]-[value]: `, "font-size:13px; background:#e6f7ff; color:#118aff;", value);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [row, setRow] = useState<ClipboardItem>();
    // const updateClipboardSetting = (field: Partial<ClipBoardHistorySetting>) => {
    //     // updateValue()
    // };
    const updateClipboardRecord = () => {
        // const initRecords = clipBoardHistorySetting?.initRecords || [];
        // if (!row.id) {
        //     row.id = `clipboard-sys-${Math.random().toString(36).slice(2)}`;
        //     initRecords.push(row);
        // } else {
        //     const index = initRecords.findIndex((item) => item.id === row.id);
        //     initRecords[index] = row;
        // }
        // setSearchHistory({ ...clipBoardHistorySetting, initRecords });
    };

    const removeClipboardRecord = () => {
        // const arr = initRecords.filter((item) => item.id !== id);
        // setSearchHistory({ ...clipBoardHistorySetting, initRecords: arr });
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
        <SettingGroupList>
            <SettingGroup title={"Hot keys"}>
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
                                <HotkeyEditDialog
                                    isAddDialog={!row?.id}
                                    isDialogOpen={isDialogOpen}
                                    closeDialog={() => setIsDialogOpen(false)}
                                    onSave={updateClipboardRecord}
                                    initialEngineSetting={row}
                                />
                            )}
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ width: 80 }}>{"Operator"}</TableHeaderCell>
                                <TableHeaderCell style={{ width: 180 }}>{"Hot Key"}</TableHeaderCell>
                                <TableHeaderCell style={{ width: 70 }}>{"Operator"}</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {value?.map((row) => {
                                const { id, content } = row;
                                return (
                                    <TableRow key={id}>
                                        <TableCell>{id}</TableCell>
                                        <TableCell>{content}</TableCell>
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
            </SettingGroup>
        </SettingGroupList>
    );
};
