// @ts-nocheck

interface Window {
    electronAPI: {
        selectDirectory: () => Promise<string | null>;
        selectFile: () => Promise<string | null>;
        runPipeline: (config: any) => Promise<any>;
        onProgress: (callback: (progress: any) => void) => void;
    };
    selectDirectory: () => Promise<void>;
    selectOutputDirectory: () => Promise<void>;
    startPipeline: () => Promise<void>;
}

// Ordner auswählen - NUR DEFINITION, KEIN AUFRUF!
window.selectDirectory = async function() {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
        document.getElementById('sourceDir').value = path;
    }
}

// Ausgabeordner auswählen - NUR DEFINITION, KEIN AUFRUF!
window.selectOutputDirectory = async function() {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
        document.getElementById('outputDir').value = path;
    }
}

// Pipeline starten - NUR DEFINITION, KEIN AUFRUF!
window.startPipeline = async function() {
    const sourceDir = document.getElementById('sourceDir').value;
    const mainTexFile = document.getElementById('mainTexFile').value;
    const outputDir = document.getElementById('outputDir').value;
    const outputSteps = document.getElementById('outputSteps').checked;

    if (!sourceDir || !mainTexFile || !outputDir) {
        alert('Bitte alle erforderlichen Felder ausfüllen!');
        return;
    }

    const skipSteps = [
        document.getElementById('step0').checked,
        document.getElementById('step1').checked,
        document.getElementById('step2').checked,
        document.getElementById('step3').checked,
        document.getElementById('step4').checked,
    ];

    const exportFormats = [
        document.getElementById('export0').checked,
        document.getElementById('export1').checked,
        document.getElementById('export2').checked,
        document.getElementById('export3').checked,
        document.getElementById('export4').checked,
    ];

    const prependMd = "C:/Uni/FinalApp/src/CodeRunner.md";

    const config = {
        sourceLatexDir: sourceDir,
        mainTexFile: mainTexFile,
        outputDir: outputDir,
        prependMd: prependMd,
        outputSteps: outputSteps,
        skipSteps: skipSteps,
        exportFormats: exportFormats,
        exportConfig: {
            lia: {
                str_title: "Konvertiertes Dokument",
                definition: {
                    macro: { comment: "Automatisch konvertiert" },
                    logo: "https://via.placeholder.com/150",
                },
            },
        },
    };

    const startBtn = document.getElementById('startBtn');
    const progressContainer = document.getElementById('progressContainer');
    const resultContainer = document.getElementById('resultContainer');

    startBtn.disabled = true;
    startBtn.textContent = '⏳ Verarbeitung läuft...';
    progressContainer.classList.add('active');
    resultContainer.classList.remove('active', 'success', 'error');

    try {
        const result = await window.electronAPI.runPipeline(config);
        
        resultContainer.classList.add('active');
        
        if (result.success) {
            resultContainer.classList.add('success');
            document.getElementById('resultTitle').textContent = '✅ Konvertierung erfolgreich!';
            document.getElementById('resultMessage').textContent = result.message;
            
            if (result.outputs && result.outputs.length > 0) {
                const outputList = document.getElementById('outputList');
                outputList.innerHTML = '';
                result.outputs.forEach((output) => {
                    const li = document.createElement('li');
                    li.textContent = output;
                    outputList.appendChild(li);
                });
            }
        } else {
            resultContainer.classList.add('error');
            document.getElementById('resultTitle').textContent = '❌ Fehler bei der Konvertierung';
            document.getElementById('resultMessage').textContent = result.message;
        }
    } catch (error) {
        resultContainer.classList.add('active', 'error');
        document.getElementById('resultTitle').textContent = '❌ Kritischer Fehler';
        document.getElementById('resultMessage').textContent = String(error);
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = '▶ Konvertierung starten';
        progressContainer.classList.remove('active');
    }
}

// Fortschritt empfangen - Event-Listener, KEIN Aufruf!
window.electronAPI.onProgress((progress) => {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const percentage = (progress.step / progress.totalSteps) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Schritt ${progress.step}/${progress.totalSteps}: ${progress.message}`;
});