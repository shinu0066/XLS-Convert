
import fs from "fs";
import { uploadPdfAndGetCsv } from "./api.js";

const fileBuffer = fs.readFileSync("/Users/apple/Desktop/pdf-to-csv/XLS-Convert/backend/statements/doc-statement.pdf");

const url = await uploadPdfAndGetCsv("test-statement.pdf", fileBuffer);
console.log("CSV URL:", url);


