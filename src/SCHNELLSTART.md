# 🚀 Schnellstart-Anleitung

## Empfohlene Projektstruktur

```
C:/Uni/FinalApp/
├── Input/                          # Deine LaTeX-Quelldateien
│   ├── Kurstext_Go_Merbach/
│   └── 63812 Software Engineering/
│
├── Output/                         # Generierte Ausgaben
│
├── src/                           # Deine bestehenden TypeScript-Module
│   ├── combined-pipeline.ts       # Original (kann bleiben)
│   ├── pandoc_markdown_converter.ts
│   ├── fix-pandoc-divs.ts
│   ├── md-code-transformer.ts
│   ├── pdf_embedder.ts
│   ├── tex_preprocessor2.ts
│   ├── footnotes_shifter.ts
│   ├── math_fixer.ts
│   ├── export/
│   │   ├── web.ts
│   │   ├── ims.ts
│   │   ├── scorm2004.ts
│   │   └── scorm12.ts
│   ├── CodeRunner.md
│   │
│   └── electron-app/              # NEUE ELECTRON-ANWENDUNG
│       ├── electron-main.ts       ← Hauptprozess
│       ├── preload.ts             ← IPC-Bridge
│       ├── renderer.ts            ← UI-Logik
│       ├── pipeline-runner.ts     ← Pipeline-Wrapper
│       ├── index.html             ← UI-Interface
│       ├── package.json           ← Electron-Config
│       ├── tsconfig.json          ← TypeScript-Config
│       ├── README.md              ← Dokumentation
│       └── dist/                  ← Kompilierte Dateien (generiert)
│
├── node_modules/                  # Dependencies (generiert)
└── package.json                   # Hauptprojekt
```

## 📝 Schritt-für-Schritt-Installation

### 1. Electron-App-Ordner erstellen

```bash
cd C:/Uni/FinalApp/src
mkdir electron-app
cd electron-app
```

### 2. Dateien kopieren

Kopiere alle erstellten Dateien in `C:/Uni/FinalApp/src/electron-app/`:

- ✅ `electron-main.ts`
- ✅ `preload.ts`
- ✅ `renderer.ts`
- ✅ `pipeline-runner-adjusted.ts` (als `pipeline-runner.ts` umbenennen!)
- ✅ `index.html`
- ✅ `package.json`
- ✅ `tsconfig.json`

### 3. Import-Pfade überprüfen

In `pipeline-runner.ts` sollten die Imports so aussehen:

```typescript
import { convertLatexToMarkdown } from "../pandoc_markdown_converter";
import { fixDivs } from "../fix-pandoc-divs";
import { addCoderunnerMacros } from "../md-code-transformer";
// usw.
```

Die `..` bedeuten "ein Verzeichnis höher", also von `electron-app/` nach `src/`.

### 4. Dependencies installieren

```bash
cd C:/Uni/FinalApp/src/electron-app
npm install
```

Das installiert:
- Electron
- TypeScript
- fs-extra
- Alle anderen benötigten Pakete

### 5. TypeScript kompilieren

```bash
npm run build
```

Das erstellt den `dist/` Ordner mit kompiliertem JavaScript.

### 6. Anwendung starten

```bash
npm start
```

Die GUI-Anwendung sollte sich öffnen! 🎉

## ⚙️ Erste Verwendung

### Schritt 1: Verzeichnisse auswählen
1. **LaTeX-Verzeichnis**: Klicke auf "Durchsuchen" und wähle z.B. `C:/Uni/FinalApp/Input/Kurstext_Go_Merbach`
2. **Haupt-TeX-Datei**: Trage ein: `Kurstext_Go/Kurstext_Go.tex`
3. **Ausgabeverzeichnis**: Wähle `C:/Uni/FinalApp/Output`

### Schritt 2: Optionen konfigurieren
- Aktiviere/Deaktiviere Verarbeitungsschritte nach Bedarf
- Wähle gewünschte Export-Formate
- Optional: "Zwischenschritte ausgeben" aktivieren

### Schritt 3: Starten
- Klicke "▶ Konvertierung starten"
- Beobachte den Fortschritt
- Nach Abschluss siehst du die Liste der generierten Dateien

## 🔧 Häufige Probleme

### Problem: "Cannot find module '../pandoc_markdown_converter'"

**Lösung**: Import-Pfade in `pipeline-runner.ts` anpassen
- Überprüfe, wo deine Module relativ zu `electron-app/` liegen
- Nutze `../` für jede Ebene nach oben

### Problem: "Pandoc not found"

**Lösung**: Pandoc installieren
1. Download: https://pandoc.org/installing.html
2. Installieren
3. Terminal neu starten
4. Testen: `pandoc --version`

### Problem: Kompilierungsfehler

**Lösung**: TypeScript-Fehler beheben
```bash
npm run build
```
Lies die Fehlerausgabe und korrigiere die angegebenen Zeilen.

### Problem: "electron: command not found"

**Lösung**: Dependencies neu installieren
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Installer erstellen

Für Windows (`.exe`):
```bash
npm run package
```

Installer findest du in: `release/`

## 🎨 Anpassungen

### CodeRunner.md Pfad ändern

In `renderer.ts` (Zeile ~50):
```typescript
const prependMd = "C:/Uni/FinalApp/src/CodeRunner.md";
```

### Export-Titel ändern

In `renderer.ts` (im `config`-Objekt):
```typescript
exportConfig: {
    lia: {
        str_title: "Dein Titel hier",
        definition: {
            macro: { comment: "Dein Kommentar" },
            logo: "https://deine-url.de/logo.png",
        },
    },
}
```

### UI-Texte ändern

Alle Texte in `index.html` können nach Belieben angepasst werden.

## 🧪 Entwicklungsmodus

Für schnellere Entwicklung:

1. Terminal 1 - TypeScript Watch-Modus:
```bash
tsc --watch
```

2. Terminal 2 - Electron starten:
```bash
electron .
```

Bei Änderungen an TypeScript-Dateien:
- Speichern → automatisch kompiliert
- Electron neu starten (Strg+R in der App)

Bei Änderungen an HTML/CSS:
- Speichern → Electron neu laden (Strg+R)

## 📚 Weitere Informationen

Siehe `README.md` für:
- Detaillierte Dokumentation
- Troubleshooting
- Erweiterte Konfiguration
- Deployment-Optionen

## ✅ Checkliste

- [ ] Node.js installiert (v18+)
- [ ] Pandoc installiert
- [ ] Ordner `electron-app/` erstellt
- [ ] Alle Dateien kopiert
- [ ] `pipeline-runner-adjusted.ts` → `pipeline-runner.ts` umbenannt
- [ ] Import-Pfade überprüft
- [ ] `npm install` ausgeführt
- [ ] `npm run build` erfolgreich
- [ ] `npm start` öffnet die Anwendung

Bei Problemen: Überprüfe jeden Punkt der Checkliste!
