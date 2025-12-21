# 📦 Electron Desktop-App - Dateienübersicht

## ✅ Erstellte Dateien

Alle Dateien für deine LaTeX → LiaScript Desktop-Anwendung wurden erstellt!

### 📋 Dokumentation (zuerst lesen!)

1. **SCHNELLSTART.md** ⭐
   - Schritt-für-Schritt-Installationsanleitung
   - Projektstruktur-Übersicht
   - Häufige Probleme und Lösungen
   - **Start hier!**

2. **README.md**
   - Vollständige Dokumentation
   - Detaillierte Funktionsbeschreibungen
   - Troubleshooting
   - Deployment-Anleitung

3. **ERWEITERUNGEN.md**
   - Ideen für weitere Features
   - Implementierungsvorschläge
   - Priorisierungsempfehlungen

### 💻 Electron-Anwendung (Hauptdateien)

4. **electron-main.ts**
   - Electron-Hauptprozess
   - Fenster-Management
   - IPC-Handler für Dateiauswahl
   - Pipeline-Ausführung

5. **preload.ts**
   - Sicherer IPC-Bridge zwischen Main und Renderer
   - Context Isolation
   - Exponiert nur benötigte APIs

6. **renderer.ts**
   - UI-Logik (Frontend)
   - Event-Handler
   - Pipeline-Konfiguration
   - Fortschrittsanzeige

7. **index.html**
   - Benutzeroberfläche
   - Modernes, responsives Design
   - Lila/Violett-Gradient-Theme
   - Dateiauswahl, Checkboxen, Fortschrittsbalken

### ⚙️ Backend-Logik

8. **pipeline-runner-adjusted.ts** ⚠️
   - **WICHTIG**: Diese Datei als `pipeline-runner.ts` umbenennen!
   - Wrapper für deine bestehende Pipeline
   - Angepasste Imports (relativ zu `electron-app/`)
   - Progress-Callbacks
   - Error-Handling

### 🔧 Konfiguration

9. **package.json**
   - NPM-Package-Konfiguration
   - Dependencies (Electron, TypeScript, etc.)
   - Build-Scripts
   - Electron-Builder-Konfiguration

10. **tsconfig.json**
    - TypeScript-Compiler-Einstellungen
    - Output-Verzeichnis: `dist/`
    - Target: ES2020

## 📂 Installation in dein Projekt

### Schritt 1: Ordnerstruktur

Erstelle in deinem Projekt:
```
C:/Uni/FinalApp/src/electron-app/
```

### Schritt 2: Dateien kopieren

Kopiere folgende Dateien nach `electron-app/`:

✅ Kopieren:
- electron-main.ts
- preload.ts
- renderer.ts
- **pipeline-runner-adjusted.ts** → als **pipeline-runner.ts** umbenennen!
- index.html
- package.json
- tsconfig.json

📚 Optional (Dokumentation):
- SCHNELLSTART.md
- README.md
- ERWEITERUNGEN.md

### Schritt 3: Dependencies installieren

```bash
cd C:/Uni/FinalApp/src/electron-app
npm install
```

### Schritt 4: Kompilieren

```bash
npm run build
```

### Schritt 5: Starten

```bash
npm start
```

## 🎨 Was du bekommst

### Benutzeroberfläche
- ✅ Moderne, intuitive GUI
- ✅ Datei-/Ordnerauswahl mit Buttons
- ✅ Toggle-Switches für Optionen
- ✅ Checkboxen für Verarbeitungsschritte
- ✅ Checkboxen für Export-Formate
- ✅ Echtzeit-Fortschrittsanzeige
- ✅ Erfolgs-/Fehlermeldungen
- ✅ Liste generierter Dateien

### Features
- ✅ Kein Kommandozeilen-Wissen nötig
- ✅ Visuelles Feedback
- ✅ Fehlerbehandlung
- ✅ Cross-Platform (Windows, Mac, Linux)
- ✅ Kann als Installer verteilt werden

## 🛠️ Wichtige Anpassungen

### 1. Import-Pfade überprüfen

In `pipeline-runner.ts` (nach Umbenennung):

```typescript
// Diese Pfade müssen zu deinen Modulen passen!
import { convertLatexToMarkdown } from "../pandoc_markdown_converter";
import { fixDivs } from "../fix-pandoc-divs";
// usw.
```

Das `../` bedeutet: ein Verzeichnis höher (von `electron-app/` nach `src/`)

### 2. CodeRunner.md Pfad

In `renderer.ts` (Zeile ~50):

```typescript
const prependMd = "C:/Uni/FinalApp/src/CodeRunner.md";
```

Passe diesen Pfad an deine Dateistruktur an!

### 3. Export-Konfiguration

In `renderer.ts` kannst du Standard-Titel und Logos ändern:

```typescript
exportConfig: {
    lia: {
        str_title: "Dein Standard-Titel",
        definition: {
            macro: { comment: "Dein Kommentar" },
            logo: "https://deine-url.de/logo.png",
        },
    },
}
```

## 📊 Dateigrößen (ungefähr)

- electron-main.ts: ~2 KB
- preload.ts: ~0.5 KB
- renderer.ts: ~4 KB
- pipeline-runner.ts: ~8 KB
- index.html: ~12 KB
- Gesamt Quellcode: ~27 KB

Nach Installation:
- node_modules: ~300 MB
- Kompilierter Code: ~30 KB
- Installer (Windows): ~150 MB

## 🚀 Next Steps

1. ✅ Dateien in `electron-app/` kopieren
2. ✅ `pipeline-runner-adjusted.ts` → `pipeline-runner.ts` umbenennen
3. ✅ Import-Pfade überprüfen
4. ✅ `npm install` ausführen
5. ✅ `npm run build` ausführen
6. ✅ `npm start` - Fertig! 🎉

## 💡 Tipps

- **Entwicklung**: Nutze `npm run dev` für schnelleres Testen
- **Debugging**: Aktiviere DevTools in `electron-main.ts` (Zeile 18)
- **Fehler**: Siehe SCHNELLSTART.md → "Häufige Probleme"
- **Erweiterungen**: Siehe ERWEITERUNGEN.md für weitere Features

## 📞 Unterstützung

Bei Problemen:
1. Prüfe SCHNELLSTART.md → "Häufige Probleme"
2. Überprüfe Import-Pfade in `pipeline-runner.ts`
3. Stelle sicher, dass Pandoc installiert ist
4. Prüfe TypeScript-Kompilierungsfehler mit `npm run build`

## 🎯 Für deine Thesis

Diese Anwendung zeigt:
- ✅ Praktische Umsetzung deiner Pipeline
- ✅ User-friendly Interface
- ✅ Professional Software Engineering
- ✅ Cross-Platform-Kompatibilität
- ✅ Error Handling & Progress Tracking

Viel Erfolg mit deiner Desktop-Anwendung! 🚀
