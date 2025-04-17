import { ClipboardItem } from "@common/Extensions/ClipBoardHistory";
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Field,
    InfoLabel,
    Input,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";

type CustomWebSearchDialogProps = {
    onSave: (row: ClipboardItem) => void;
    initialEngineSetting?: ClipboardItem;
    isAddDialog: boolean;
    isDialogOpen: boolean;
    closeDialog: () => void;
};

export const ClipboardHistoryDialog = ({
    initialEngineSetting,
    onSave,
    isAddDialog,
    isDialogOpen,
    closeDialog,
}: CustomWebSearchDialogProps) => {
    const [temporaryCustomSearchEngineSetting, setTemporaryCustomSearchEngineSetting] =
        useState<ClipboardItem | undefined>(initialEngineSetting);
    useEffect(() => {
        isDialogOpen && setTemporaryCustomSearchEngineSetting(isAddDialog ? undefined : initialEngineSetting);
    }, [initialEngineSetting, isDialogOpen, isAddDialog]);
    const setContent = (content: string) => {
        setTemporaryCustomSearchEngineSetting({ ...temporaryCustomSearchEngineSetting, content });
    };
    const _closeDialog = () => {
        closeDialog()
    }
    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(event, { open }) => {
                event.stopPropagation();

                if (!open) {
                    _closeDialog();
                }
            }}
        >
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{isAddDialog ? 'Add' : 'Edit'}</DialogTitle>
                    <DialogContent>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 10 }}>
                            <Field
                                orientation="horizontal"
                                required={true}
                                label={
                                    'content'
                                }
                            >
                                <Input
                                    value={temporaryCustomSearchEngineSetting?.content}
                                    onChange={(_, { value }) => setContent(value)}
                                />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary" onClick={_closeDialog}>
                                Cancel
                            </Button>
                        </DialogTrigger>
                        <Button
                            onClick={() => {
                                const content = (temporaryCustomSearchEngineSetting?.content || '').trim();
                                if (!content) {
                                    return;
                                }

                                _closeDialog();

                                onSave({ ...temporaryCustomSearchEngineSetting, content });

                            }}
                            appearance="primary"
                        >
                            Save
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
