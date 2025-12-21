import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { runPipeline, PipelineConfig } from "./pipeline-runner";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    title: "LaTeX → LiaScript Konverter",
  });

   mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  // Entwicklermodus: DevTools öffnen
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handler: Ordner auswählen
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// IPC Handler: Datei auswählen
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "TeX Files", extensions: ["tex"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// IPC Handler: Pipeline ausführen
ipcMain.handle("run-pipeline", async (event, config: PipelineConfig) => {
  try {
    const result = await runPipeline(config, (progress) => {
      // Sende Fortschritt an Renderer
      if (mainWindow) {
        mainWindow.webContents.send("pipeline-progress", progress);
      }
    });
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
});
