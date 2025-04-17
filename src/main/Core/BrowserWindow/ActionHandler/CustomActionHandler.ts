import { SearchResultItemAction } from "@common/Core";
import type { ActionHandler } from "@Core/ActionHandler";
import { ClipboardArgument, ExtensionTypeEnum } from "../../../../types/Custom.type";
import { Logger } from "@Core/Logger";
import { EventSubscriber } from "@Core/EventSubscriber";

/**
 * Action handler for custom actions .
 */
export class CustomActionHandler implements ActionHandler {
    public id = "Custom";

    // private readonly browserWindowNotifier: BrowserWindowNotifier
    public constructor(
    ) { }

    /**
     * Navigates to the given path in the renderer process.
     * Expects the given action's argument to be a valid path, e.g.: "/my/path".
     */
    public async invokeAction(action: SearchResultItemAction): Promise<void> {
    }
}
