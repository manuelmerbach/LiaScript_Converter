# 🚀 Erweiterungsideen für die Desktop-App

## Schnelle Verbesserungen (einfach)

### 1. Letzte Einstellungen speichern
Nutze `localStorage` oder eine JSON-Datei, um die letzten Eingaben zu speichern.

**In `renderer.ts`:**
```typescript
// Einstellungen speichern
function saveSettings(config: any) {
    localStorage.setItem('lastConfig', JSON.stringify(config));
}

// Einstellungen laden beim Start
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('lastConfig');
    if (saved) {
        const config = JSON.parse(saved);
        // Felder füllen
        (document.getElementById('sourceDir') as HTMLInputElement).value = config.sourceLatexDir || '';
        // usw.
    }
});
```

### 2. Drag & Drop für Ordner
Erlaube Drag & Drop auf die Eingabefelder.

**In `index.html` (im `<script>`-Tag):**
```javascript
document.getElementById('sourceDir').addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files[0]) {
        document.getElementById('sourceDir').value = files[0].path;
    }
});
```

### 3. Export-Vorlagen
Mehrere vordefinierte Export-Konfigurationen.

```typescript
const templates = {
    "Moodle SCORM": {
        exportFormats: [true, false, true, false, false]
    },
    "Alle Formate": {
        exportFormats: [true, true, true, true, true]
    },
    // ...
};
```

### 4. Dark Mode
Ein Umschalter für dunkles Design.

**CSS hinzufügen:**
```css
body.dark-mode {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
}
.dark-mode .container {
    background: #2d3748;
    color: #e2e8f0;
}
/* usw. */
```

## Mittlere Erweiterungen (moderat)

### 5. Konfigurationsdateien
Lade/Speichere Konfigurationen als JSON.

**Neue Buttons:**
```html
<button onclick="loadConfig()">⬆ Konfiguration laden</button>
<button onclick="saveConfig()">⬇ Konfiguration speichern</button>
```

**Implementation:**
```typescript
async function saveConfig() {
    const config = getCurrentConfig();
    const result = await dialog.showSaveDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.filePath) {
        fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
    }
}
```

### 6. Log-Viewer
Zeige detaillierte Logs während der Verarbeitung.

**UI erweitern:**
```html
<div class="log-container">
    <textarea id="logViewer" readonly></textarea>
</div>
```

**Log-Funktion:**
```typescript
function log(message: string) {
    const viewer = document.getElementById('logViewer') as HTMLTextAreaElement;
    viewer.value += `${new Date().toLocaleTimeString()} - ${message}\n`;
    viewer.scrollTop = viewer.scrollHeight;
}
```

### 7. Batch-Verarbeitung
Mehrere Dokumente gleichzeitig konvertieren.

**UI:**
```html
<div class="batch-mode">
    <h3>Batch-Verarbeitung</h3>
    <button onclick="addDocument()">+ Dokument hinzufügen</button>
    <div id="documentList"></div>
</div>
```

### 8. Vorschau
Zeige eine Live-Vorschau des generierten Markdowns.

```typescript
async function showPreview() {
    const markdown = await fs.readFile(outputPath, 'utf8');
    // Render mit marked.js oder ähnlich
    document.getElementById('preview').innerHTML = marked(markdown);
}
```

## Fortgeschrittene Erweiterungen (komplex)

### 9. Integrierter Editor
Bearbeite generiertes Markdown direkt in der App.

**Nutze Monaco Editor:**
```bash
npm install monaco-editor
```

### 10. Vergleichsansicht
Zeige LaTeX und Markdown nebeneinander.

**Split-Screen-Layout:**
```html
<div class="split-view">
    <div class="pane"><!-- LaTeX --></div>
    <div class="pane"><!-- Markdown --></div>
</div>
```

### 11. Cloud-Integration
Upload zu Google Drive, Dropbox, etc.

```typescript
import { google } from 'googleapis';

async function uploadToGoogleDrive(filePath: string) {
    // OAuth2-Authentifizierung
    // Upload-Logik
}
```

### 12. Fehlerberichterstattung
Automatische Bug-Reports mit Details.

```typescript
async function reportError(error: Error, context: any) {
    // Sende an GitHub Issues API
    // oder an deinen eigenen Server
}
```

### 13. Update-Checker
Prüfe auf neue Versionen.

```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdates();
```

### 14. Plugin-System
Erlaube benutzerdefinierte Verarbeitungsschritte.

```typescript
interface Plugin {
    name: string;
    process: (input: string) => string;
}

const plugins: Plugin[] = [];

function registerPlugin(plugin: Plugin) {
    plugins.push(plugin);
}
```

## UI/UX-Verbesserungen

### 15. Besseres Feedback
- Toast-Benachrichtigungen
- Animierte Übergänge
- Sound-Effekte bei Fertigstellung

### 16. Keyboard-Shortcuts
```typescript
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        saveConfig();
    }
    if (e.ctrlKey && e.key === 'Enter') {
        startPipeline();
    }
});
```

### 17. Multi-Language-Support
Internationalisierung mit i18n.

```typescript
const translations = {
    de: { start: "Starten", cancel: "Abbrechen" },
    en: { start: "Start", cancel: "Cancel" }
};
```

### 18. Responsive Design
Bessere Anpassung an verschiedene Fenstergrößen.

## Performance-Optimierungen

### 19. Worker Threads
Nutze Worker für CPU-intensive Aufgaben.

```typescript
import { Worker } from 'worker_threads';

const worker = new Worker('./pipeline-worker.js');
worker.postMessage(config);
```

### 20. Caching
Speichere häufig genutzte Zwischenergebnisse.

```typescript
const cache = new Map<string, string>();

function getCached(key: string, compute: () => string): string {
    if (!cache.has(key)) {
        cache.set(key, compute());
    }
    return cache.get(key)!;
}
```

## Implementierungsreihenfolge (empfohlen)

1. **Letzte Einstellungen speichern** (Quick Win!)
2. **Log-Viewer** (Debugging-Hilfe)
3. **Dark Mode** (Beliebt bei Nutzern)
4. **Konfigurationsdateien** (Wiederverwendbarkeit)
5. **Drag & Drop** (Bessere UX)
6. **Export-Vorlagen** (Effizienz)
7. **Batch-Verarbeitung** (Produktivität)
8. **Update-Checker** (Wartung)

## Testing-Tipps

### Unit-Tests mit Jest
```bash
npm install --save-dev jest @types/jest ts-jest
```

### E2E-Tests mit Spectron
```bash
npm install --save-dev spectron
```

### Beispiel-Test:
```typescript
test('Pipeline sollte erfolgreich laufen', async () => {
    const config = {
        sourceLatexDir: './test-data',
        mainTexFile: 'test.tex',
        // ...
    };
    const result = await runPipeline(config);
    expect(result.success).toBe(true);
});
```

## Dokumentation

### JSDoc hinzufügen
```typescript
/**
 * Startet die Konvertierungs-Pipeline
 * @param config - Pipeline-Konfiguration
 * @param progressCallback - Callback für Fortschrittsmeldungen
 * @returns Promise mit Ergebnis
 * @throws Error wenn Pandoc nicht verfügbar
 */
export async function runPipeline(
    config: PipelineConfig,
    progressCallback?: (progress: PipelineProgress) => void
): Promise<PipelineResult>
```

## Deployment

### Automatisches Build mit GitHub Actions
```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run package
```

## Community-Features

### Telemetrie (optional)
Anonyme Nutzungsstatistiken für Verbesserungen.

### Feedback-System
In-App-Feedback-Formular.

### Changelog
Zeige neue Features beim Start.

## Prioritäten für deine Thesis

Für eine Master-Thesis sind besonders relevant:

1. **Log-Viewer** - Dokumentiere den Prozess
2. **Fehlerbehandlung** - Zeige Robustheit
3. **Konfigurationsdateien** - Reproduzierbarkeit
4. **Performance-Messung** - Vergleichbare Metriken
5. **Batch-Verarbeitung** - Skalierbarkeit demonstrieren

## Ressourcen

- Electron Docs: https://www.electronjs.org/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Electron Forge: https://www.electronforge.io/ (Alternative zu electron-builder)
