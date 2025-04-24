import { formatParamsTrim } from "@Core/Utils/format";
import type { FieldValues, UseFormProps, UseFormReturn } from "react-hook-form";
import { useForm as _useForm } from "react-hook-form";

export type CustomUseFormReturn<TFieldValues extends FieldValues = FieldValues, TContext = any> = UseFormReturn<
    TFieldValues,
    TContext
> & {
    validateFields: () => Promise<TFieldValues>;
    setValues: (data?: Partial<TFieldValues>) => void;
};

export const useForm = <TFieldValues extends FieldValues = FieldValues, TContext = any>(
    options?: UseFormProps<TFieldValues, TContext>,
): CustomUseFormReturn<TFieldValues, TContext> => {
    const form = _useForm<TFieldValues, TContext>({
        mode: "onChange",
        ...options,
    });

    const validateFields = (): Promise<TFieldValues> => {
        return new Promise((resolve, reject) => {
            form.trigger()
                .then((isValid) => {
                    if (!isValid) {
                        reject(new Error("Form validation failed"));
                        return;
                    }

                    form.handleSubmit(
                        (data) => resolve(formatParamsTrim(data) as TFieldValues),
                        () => reject(new Error("Form submission failed")),
                    )();
                })
                .catch((error) => reject(error));
        });
    };

    return {
        ...form,
        validateFields,
    } as CustomUseFormReturn<TFieldValues, TContext>;
};
