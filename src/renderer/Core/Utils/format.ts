import { isPlainObject } from "lodash-es";
/**
 * 转化参数params和body
 * 将字符类型trim
 * @param body
 * @returns body
 */
export const formatParamsTrim = <T = any>(body: T) => {
    function format<T>(data: T): T {
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map((item) => format(item)) as T;
        }

        // Handle plain objects
        if (isPlainObject(data)) {
            return Object.entries(data as any).reduce((acc, [key, value]) => {
                return {
                    ...acc,
                    [key]: format(value),
                };
            }, {} as T);
        }

        // Handle strings
        if (typeof data === "string") {
            return data.trim() as T;
        }

        // Return non-string, non-array, non-object values as-is
        return data;
    }

    return format(body) as T;
};
