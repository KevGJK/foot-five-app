import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(process.argv[2], "utf8")
);

console.log(`FIREBASE_PROJECT_ID=${serviceAccount.project_id}`);
console.log(`FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`);
console.log(`FIREBASE_PRIVATE_KEY=${serviceAccount.private_key.replace(/\n/g, "\\n")}`

);