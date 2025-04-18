import type { OperatingSystem } from "@common/Core";
import type { BrowserWindowRegistry } from "@Core/BrowserWindowRegistry";
import type { App, BrowserWindow } from "electron";

export class BrowserWindowToggler {
    public constructor(
        private readonly operatingSystem: OperatingSystem,
        private readonly app: App,
        private readonly browserWindow: BrowserWindow,
        private readonly browserWindowRegistry: BrowserWindowRegistry,
    ) {}

    public toggle(): void {
        if (this.isVisibleAndFocused()) {
            this.hide();
        } else {
            this.showAndFocus();
        }
    }

    public isVisibleAndFocused(): boolean {
        return this.browserWindow.isVisible() && this.browserWindow.isFocused();
    }

    public hide(): void {
        if (this.operatingSystem === "macOS" && !this.settingsWindowIsVisible()) {
            this.app.hide();
        }

        // In order to restore focus correctly to the previously focused window, we need to minimize the window on
        // Windows.
        if (this.operatingSystem === "Windows") {
            this.browserWindow.minimize();
        }

        this.browserWindow.hide();
        // clear search input
        this.browserWindow.webContents.send("clear-search-input");
    }

    public showAndFocus(): void {
        if (typeof this.app.show === "function") {
            this.app.show();
        }

        this.browserWindow.show();

        // Because the window is minimized on Windows when hidden, we need to restore it before focusing it.
        if (this.operatingSystem === "Windows") {
            this.browserWindow.restore();
        }

        this.browserWindow.focus();
        this.browserWindow.webContents.send("windowFocused");
    }

    private settingsWindowIsVisible(): boolean {
        const settingsWindow = this.browserWindowRegistry.getById("settings");

        if (!settingsWindow) {
            return false;
        }

        return !settingsWindow.isDestroyed() && settingsWindow.isVisible();
    }
}
