import { isValidHotkey } from "@common/Core/Hotkey";
import { useSetting } from "@Core/Hooks";
import { SettingGroupList } from "@Core/Settings/SettingGroupList";
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
import { AddRegular, DismissRegular } from "@fluentui/react-icons";
import { useState } from "react";
import { SettingGroup } from "../../SettingGroup";

type HotKeyItem = {
    id: string;
    hotkey: string;
    content: string;
};
export const Hotkeys = () => {
    const { value: hotKeys, updateValue: setHotKeys } = useSetting<HotKeyItem[]>({
        key: "hotkeys",
        defaultValue: [],
    });
    const [tempItem, setTempItem] = useState({ id: "", hotkey: "", content: "" });
    const onAdd = () => {
        setHotKeys([...hotKeys, { id: `hotkeys-sys-${Math.random().toString(36).slice(2)}`, content: "", hotkey: "" }]);
    };

    const updateRecord = (oldId: string, updatedItem: HotKeyItem) => {
        setHotKeys(hotKeys.map((item) => (item.id === oldId ? updatedItem : item)));
    };

    const removeRecord = (id: string) => {
        setHotKeys(hotKeys.filter((item) => item.id !== id));
    };

    return (
        <SettingGroupList>
            <SettingGroup title={"Hot keys"}>
                <div>
                    <div className="flex justify-between mb-[12px]">
                        <Label weight="semibold">Please first press shift or alt key</Label>
                        <div>
                            <DialogTrigger disableButtonEnhancement>
                                <Button onClick={() => onAdd()} icon={<AddRegular />}>
                                    Add
                                </Button>
                            </DialogTrigger>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ width: 90 }}>{"Hot Key"}</TableHeaderCell>
                                <TableHeaderCell style={{ width: 160 }}>{"cmd"}</TableHeaderCell>
                                <TableHeaderCell style={{ width: 70 }}>{"Operator"}</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hotKeys?.map((row) => {
                                const { id, content, hotkey } = row;
                                return (
                                    <TableRow key={id}>
                                        <TableCell>
                                            <Input
                                                value={tempItem.id === id ? tempItem.hotkey : hotkey}
                                                onKeyUp={() => {
                                                    if (isValidHotkey(tempItem.hotkey)) {
                                                        updateRecord(id, tempItem);
                                                    }

                                                    setTempItem({ id: "", hotkey: "", content: "" });
                                                }}
                                                onKeyDown={(e) => {
                                                    const key = e.key;

                                                    if (!e.ctrlKey && !e.altKey) {
                                                        return;
                                                    }

                                                    const hotkey = [
                                                        e.ctrlKey ? "Ctrl" : undefined,
                                                        e.shiftKey ? "Shift" : undefined,
                                                        e.altKey ? "Alt" : undefined,
                                                        ["Control", "Shift", "Alt"].includes(key)
                                                            ? undefined
                                                            : key.toUpperCase(),
                                                    ]
                                                        .filter(Boolean)
                                                        .join("+");
                                                    setTempItem({ ...row, hotkey });
                                                }}
                                                placeholder="Hot Key"
                                                className="w-[180px]"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={content}
                                                onChange={(e) => updateRecord(id, { ...row, content: e.target.value })}
                                                placeholder="Command"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip relationship="label" content={"remove"}>
                                                <Button
                                                    style={{ marginLeft: 4 }}
                                                    size="small"
                                                    icon={<DismissRegular />}
                                                    onClick={() => removeRecord(id as string)}
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
