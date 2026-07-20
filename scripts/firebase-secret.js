import fs from "fs";

const file = process.argv[2];

if (!file) {
  console.error("Utilisation : node scripts/firebase-secret.js chemin/vers/fichier.json");
  process.exit(1);
}

const json = fs.readFileSync(file, "utf8");

const oneLine = json.replace(/\r?\n/g, "");

console.log(`FIREBASE_SERVICE_ACCOUNT='${oneLine}'`);