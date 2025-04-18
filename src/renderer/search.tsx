import { App } from "@Core/App";
import { ThemeProvider } from "@Core/Theme/ThemeProvider";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./main.css";
document.addEventListener("DOMContentLoaded", () => {
    createRoot(document.getElementById("react-app") as HTMLDivElement).render(
        <HashRouter>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </HashRouter>,
    );
});
