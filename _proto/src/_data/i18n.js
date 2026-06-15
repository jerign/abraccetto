import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.resolve(__dirname, "../../../assets/i18n");

export default function () {
  const langs = ["fr", "en", "es"];
  const data = {};
  for (const lang of langs) {
    const file = path.join(i18nDir, `${lang}.json`);
    data[lang] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return data;
}
