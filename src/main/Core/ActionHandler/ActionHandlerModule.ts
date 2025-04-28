import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import type { SearchResultItemAction } from "@common/Core";
import { ActionHandlerRegistry } from "./ActionHandlerRegistry";

export class ActionHandlerModule {
    public static bootstrap(moduleRegistry: UeliModuleRegistry) {
        const eventEmitter = moduleRegistry.get("EventEmitter");
        const ipcMain = moduleRegistry.get("IpcMain");
        const dialog = moduleRegistry.get("Dialog");
        const eventSubscriber = moduleRegistry.get("EventSubscriber");
        const actionHandlerRegistry = new ActionHandlerRegistry();
        moduleRegistry.register("ActionHandlerRegistry", actionHandlerRegistry);

        const actionHandle = async (action: SearchResultItemAction) => {
            try {
                eventEmitter.emitEvent("actionInvocationStarted", { action });
                await actionHandlerRegistry.getById(action.handlerId).invokeAction(action);
            } catch (error) {
                dialog.showErrorBox("Error while invoking action", `Reason: ${error}`);
            }
        };
        ipcMain.handle("invokeAction", async (_, { action }: { action: SearchResultItemAction }) => {
            await actionHandle(action);
        });
        eventSubscriber.subscribe("invokeAction", async ({ action }: { action: SearchResultItemAction }) => {
            await actionHandle(action);
        });
    }
}
