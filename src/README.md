# LaTeX → LiaScript Desktop-Konverter

Eine Desktop-Anwendung mit grafischer Benutzeroberfläche zur Konvertierung von LaTeX-Dokumenten in das LiaScript-Format.

## 📋 Voraussetzungen

- **Node.js** (Version 18 oder höher)
- **npm** (wird mit Node.js installiert)
- **Pandoc** (muss installiert und im PATH verfügbar sein)
- Alle bereits vorhandenen Dependencies deines Projekts

## 🚀 Installation

### Schritt 1: Projektstruktur vorbereiten

Erstelle in deinem bestehenden Projekt einen neuen Ordner `electron-app`:

```
FinalApp/
├── src/
│   ├── combined-pipeline.ts (deine bestehende Datei)
│   ├── pandoc_markdown_converter.ts
│   ├── fix-pandoc-divs.ts
│   ├── ... (alle anderen Module)
│   └── electron-app/          ← NEUER ORDNER
│       ├── electron-main.ts
│       ├── preload.ts
│       ├── renderer.ts
│       ├── pipeline-runner.ts
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
```

### Schritt 2: Dateien kopieren

Kopiere die erstellten Dateien in den `electron-app` Ordner:
- `electron-main.ts`
- `preload.ts`
- `renderer.ts`
- `pipeline-runner.ts`
- `index.html`
- `package.json`
- `tsconfig.json`

### Schritt 3: Dependencies installieren

Öffne ein Terminal im `electron-app` Ordner und führe aus:

```bash
cd electron-app
npm install
```

### Schritt 4: Import-Pfade anpassen

In `pipeline-runner.ts` müssen die Import-Pfade auf deine Module angepasst werden:

```typescript
// Ändere diese Zeilen entsprechend deiner Projektstruktur:
import { convertLatexToMarkdown } from "../pandoc_markdown_converter";
import { fixDivs } from "../fix-pandoc-divs";
import { addCoderunnerMacros } from "../md-code-transformer";
// ... etc.
```

### Schritt 5: CodeRunner.md Pfad konfigurieren

In `renderer.ts` (Zeile ~50) kannst du den Standard-Pfad für CodeRunner.md anpassen:

```typescript
const prependMd = "C:/Uni/FinalApp/src/CodeRunner.md"; // Anpassen!
```

## ▶️ Anwendung starten

### Entwicklungsmodus

```bash
npm run dev
```

### Kompilieren und ausführen

```bash
npm run build
npm start
```

### Installer erstellen

Für Windows:
```bash
npm run package
```

Der Installer wird im Ordner `release/` erstellt.

## 🎯 Verwendung

### 1. LaTeX-Verzeichnis auswählen
- Klicke auf "Durchsuchen" neben "LaTeX-Verzeichnis"
- Wähle den Ordner mit deinen LaTeX-Dateien

### 2. Haupt-TeX-Datei angeben
- Gib den relativen Pfad zur Haupt-.tex-Datei ein
- Beispiel: `Kurs_1793.tex` oder `Kurstext_Go/Kurstext_Go.tex`

### 3. Ausgabeverzeichnis wählen
- Klicke auf "Durchsuchen" neben "Ausgabeverzeichnis"
- Wähle den Ordner für die konvertierten Dateien

### 4. Optionen konfigurieren

**Zwischenschritte ausgeben:**
- Aktiviere diese Option, um Zwischenergebnisse zu speichern

**Verarbeitungsschritte:**
- PDF Embedder: PDF-Einbindungen verarbeiten
- Math Fixer: Mathematische Ausdrücke korrigieren
- Div-Blöcke fixen: Pandoc Div-Blöcke bereinigen
- CodeRunner-Makros: CodeRunner-Makros einfügen
- Fußnoten versetzen: Fußnoten ans Ende verschieben

**Export-Formate:**
- Markdown: Finale .md-Datei
- IMS Package: IMS Content Package (.zip)
- SCORM 1.2: SCORM 1.2 Package (.zip)
- SCORM 2004: SCORM 2004 Package (.zip)
- Website: Statische Website (.zip)

### 5. Konvertierung starten
- Klicke auf "▶ Konvertierung starten"
- Beobachte den Fortschritt in der Fortschrittsanzeige
- Nach Abschluss werden die Ausgabedateien aufgelistet

## 🔧 Anpassungen

### UI-Sprache ändern

In `index.html` kannst du alle Texte anpassen.

### Export-Konfiguration

In `renderer.ts` kannst du die Export-Konfiguration anpassen:

```typescript
exportConfig: {
    lia: {
        str_title: "Dein Titel",
        definition: {
            macro: { comment: "Dein Kommentar" },
            logo: "https://deine-url.de/logo.png",
        },
    },
}
```

### Weitere Optionen hinzufügen

1. In `index.html`: UI-Element hinzufügen
2. In `renderer.ts`: Wert auslesen und an config übergeben
3. In `pipeline-runner.ts`: Parameter verarbeiten

## 📦 Deployment

### Windows-Installer erstellen

```bash
npm run package
```

Erstellt eine `.exe` im `release/` Ordner.

### Für andere Plattformen

In `package.json` unter `build` kannst du weitere Targets konfigurieren:

```json
"build": {
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" },
  "linux": { "target": "AppImage" }
}
```

## 🐛 Fehlerbehebung

### "Electron nicht gefunden"
```bash
npm install electron --save-dev
```

### "Module nicht gefunden"
- Überprüfe die Import-Pfade in `pipeline-runner.ts`
- Stelle sicher, dass alle Dependencies installiert sind

### "Pandoc nicht gefunden"
- Installiere Pandoc: https://pandoc.org/installing.html
- Stelle sicher, dass Pandoc im PATH ist

### Kompilierungsfehler
```bash
npm run build
```
Überprüfe TypeScript-Fehler in der Ausgabe.

## 📝 Hinweise

- Die Anwendung erstellt temporäre Ordner im System-Temp-Verzeichnis
- Diese werden nach Abschluss automatisch gelöscht
- Bei Fehlern bleiben sie ggf. bestehen und müssen manuell gelöscht werden
- Stelle sicher, dass Pandoc installiert und verfügbar ist

## 🎨 UI-Design

Das Design verwendet ein modernes, flaches Design mit:
- Gradient-Header (lila/violett)
- Abgerundete Ecken und Schatten
- Responsive Layout
- Visuelles Feedback bei Hover
- Fortschrittsanzeige mit Animation
- Farbcodierte Ergebnismeldungen

## 📄 Lizenz

MIT

## 👤 Autor

Manuel - Master's Thesis Project
