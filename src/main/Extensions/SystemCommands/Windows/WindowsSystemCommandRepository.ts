import type { AssetPathResolver } from "@Core/AssetPathResolver";
import { SLEEP_COMMAND } from "@Core/Command";
import type { CommandlineUtility } from "@Core/CommandlineUtility";
import type { PowershellUtility } from "@Core/PowershellUtility";
import type { Translator } from "@Core/Translator";
import type { Image } from "@common/Core/Image";
import type { Resources } from "@common/Core/Translator";
import type { SystemCommand } from "../SystemCommand";
import type { SystemCommandRepository } from "../SystemCommandRepository";
import { WindowsSystemCommand } from "./WindowsSystemCommand";
import type { WindowsTranslations } from "./windowsTranslations";

export class WindowsSystemCommandRepository implements SystemCommandRepository {
    public constructor(
        private readonly translator: Translator,
        private readonly assetPathResolver: AssetPathResolver,
        private readonly commandlineUtility: CommandlineUtility,
        private readonly powershellUtility: PowershellUtility,
        private readonly resources: Resources<WindowsTranslations>,
    ) {}

    public async getAll(): Promise<SystemCommand[]> {
        const { t } = this.translator.createT(this.resources);

        return [
            WindowsSystemCommand.create({
                name: t("shutdown"),
                description: t("searchResultItemDescription"),
                details: "shutdown -s -t 0",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand("shutdown -s -t 0");
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("restart"),
                description: t("searchResultItemDescription"),
                details: "shutdown -r -t 0",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand("shutdown -r -t 0");
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("signOut"),
                description: t("searchResultItemDescription"),
                details: "shutdown /l",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand("shutdown /l");
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("lock"),
                description: t("searchResultItemDescription"),
                details: "rundll32 user32.dll,LockWorkStation",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand("rundll32 user32.dll,LockWorkStation");
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("sleep"),
                description: t("searchResultItemDescription"),
                details: "Custom Powershell Script",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand(SLEEP_COMMAND);
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("hibernate"),
                description: t("searchResultItemDescription"),
                details: "shutdown /h",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.commandlineUtility.executeCommand("shutdown /h");
                },
                requiresConfirmation: false,
            }),
            WindowsSystemCommand.create({
                name: t("emptyTrash"),
                description: t("searchResultItemDescription"),
                details: "Powershell: Clear-RecycleBin -Force",
                image: this.getImage({ fileName: "windows-11-system-command.png" }),
                invoke: async () => {
                    await this.powershellUtility.executeCommand("Clear-RecycleBin -Force");
                },
                requiresConfirmation: false,
            }),
        ];
    }

    private getImage({ fileName }: { fileName: string }): Image {
        return { url: `file://${this.assetPathResolver.getExtensionAssetPath("SystemCommands", fileName)}` };
    }
}
