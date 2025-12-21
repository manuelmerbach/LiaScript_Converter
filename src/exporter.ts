import { exporter } from "./export/web";
import * as path from "path";
import * as fs from "fs-extra";

async function run() {
  //const inputMd = "C:/Uni/FinalApp/Input/dokument1.md";
   //const inputMd = "C:/Uni/FinalApp/Input/dokument_cleaned.md";
   const inputMd = "C:/Uni/FinalApp/hello_world/hello_world_go.md";

  // Lies den Inhalt deiner Markdown-Datei
  const mdContent = await fs.readFile(inputMd, "utf8");

  // JSON für die Lia-Metadaten (minimal)
  const json = {
    lia: {
      str_title: "Mein Kurs",
      definition: {
        macro: { comment: "Dies ist ein Testkurs" },
        logo: "https://via.placeholder.com/150"
      }
    }
  };

  await exporter(
    {
      input: inputMd,
      readme: path.basename(inputMd),   // z.B. Input.dokument1.md
      output: path.resolve("./output"), // Zielordner
      format: "web",
      path: path.dirname(inputMd),
      "web-zip": true,                  // als ZIP exportieren
    },
    json
  );

  console.log("Export abgeschlossen!");
}

run().catch(console.error);
