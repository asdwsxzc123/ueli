import type { ActionHandler } from "@Core/ActionHandler";

/**
 * Action handler for custom actions .
 */
export class CustomActionHandler implements ActionHandler {
    public id = "Custom";
    /**
     * Navigates to the given path in the renderer process.
     * Expects the given action's argument to be a valid path, e.g.: "/my/path".
     */
    public async invokeAction(): Promise<void> {}
}
