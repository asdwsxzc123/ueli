import type { ClipboardItem } from "@common/Extensions/ClipBoardHistory";
import { useForm } from "@Core/Hooks/useForm";
import {
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Field,
    Input,
} from "@fluentui/react-components";
import { Controller } from "react-hook-form";

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
    const { control, validateFields } = useForm<ClipboardItem>({ defaultValues: initialEngineSetting });
    const _closeDialog = () => {
        closeDialog();
    };

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
                    <DialogTitle>{isAddDialog ? "Add" : "Edit"}</DialogTitle>
                    <DialogContent>
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 10 }}>
                            <form>
                                <Controller
                                    name="content"
                                    control={control}
                                    rules={{ required: "Content is required" }}
                                    render={({ field, fieldState }) => {
                                        return (
                                            <Field
                                                orientation="horizontal"
                                                required
                                                label={"content"}
                                                className="mb-[12px]"
                                            >
                                                <Input {...field} />
                                                {fieldState.error && (
                                                    <span className="red">{fieldState.error.message}</span>
                                                )}
                                            </Field>
                                        );
                                    }}
                                />
                            </form>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary" onClick={_closeDialog}>
                                Cancel
                            </Button>
                        </DialogTrigger>
                        <Button
                            onClick={async () => {
                                const data = await validateFields();
                                _closeDialog();
                                onSave(data);
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
