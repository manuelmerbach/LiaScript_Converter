import { contextBridge, ipcRenderer } from "electron";

// Exponiere nur spezifische APIs an den Renderer
contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectFile: () => ipcRenderer.invoke("select-file"),
  runPipeline: (config: any) => ipcRenderer.invoke("run-pipeline", config),
  onProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("pipeline-progress", (event, progress) => callback(progress));
  },
});
