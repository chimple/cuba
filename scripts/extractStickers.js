const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const SVG_PATH = path.resolve(
  __dirname,
  "../src/assets/images/newWhole_layout.svg"
);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/generated/stickers.js"
);

if (!fs.existsSync(SVG_PATH)) {
  console.log("❌ Whole_layout.svg not found");
  process.exit(0);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

const svgContent = fs.readFileSync(SVG_PATH, "utf-8");
const parsed = parser.parse(svgContent);
const root = parsed.svg;

function findGroups(node, result = []) {
  if (!node) return result;

  if (Array.isArray(node)) {
    node.forEach((n) => findGroups(n, result));
    return result;
  }

  if (node["data-slot-id"]) {
    result.push(node);
  }

  if (typeof node === "object") {
    Object.values(node).forEach((child) => {
      if (typeof child === "object") {
        findGroups(child, result);
      }
    });
  }

  return result;
}

const groups = findGroups(root);
const stickers = {};

groups.forEach((g) => {
  const id = g["data-slot-id"];
  if (!id || id === "background") return;

  stickers[id] = `
<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  ${objectToXml("g", g)}
</svg>`;
});

const fileContent =
  "export const STICKERS = " + JSON.stringify(stickers, null, 2) + ";";

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, fileContent);

console.log("🎯 Stickers extracted automatically");

function objectToXml(tag, obj) {
  let attrs = "";
  let children = "";

  Object.entries(obj).forEach(([key, val]) => {
    if (typeof val === "string" || typeof val === "number") {
      attrs += ` ${key}="${val}"`;
    } else if (Array.isArray(val)) {
      val.forEach((child) => {
        children += objectToXml(key, child);
      });
    } else if (typeof val === "object") {
      children += objectToXml(key, val);
    }
  });

  return `<${tag}${attrs}>${children}</${tag}>`;
}



