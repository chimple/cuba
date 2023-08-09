var fs = require("fs");
var fsp = require("fs/promises");

var path = require("path");
var crypto = require("crypto");

const ChecksumReport = {
  /**
   * Generate a checksum file for a given directory path.
   *
   * @param directoryPath - The path to generate a checksum for.
   *
   * @returns A JSON string containing the directory checksum.
   */
  get: async (buildPath) => {
    // Generate a checksum output for the build.
    const filePaths = await getDirectoryFileList(buildPath);
    const checksum = { id: "", timestamp: new Date(), files: [] };
    for (const filePath of filePaths) {
      checksum.files.push({
        path: path.relative(buildPath, filePath),
        hash: await getFileHash(filePath),
      });
    }
    // Create an unique id for the build by combining all hashes.
    checksum.id = getDataHash(
      checksum.files.reduce((acc, curr) => acc + curr.hash, "")
    );
    // Return the resulting checksum hash once done.
    return checksum;
  },
  /**
   * Generate a checksum file for a given directory path and saves it to disk.
   *
   * @param directoryPath - The path to the directory to generate a checksum for.
   * @param outputPath - The path to save the checksum output to, defaults to checksum.json in the given directory.
   *
   * @returns A JSON string containing the directory checksum.
   */
  save: async (directoryPath, outputPath) => {
    // Set the default output file path.
    if (!outputPath) {
      outputPath = path.join(directoryPath, "checksum.json");
    }
    // Generate the directory checksum.
    const checksumJSON = await ChecksumReport.get(directoryPath);
    // Write the checksum output the specified directory.
    await fsp.writeFile(outputPath, JSON.stringify(checksumJSON));
    // Return the resulting checksum hash once done.
    return checksumJSON;
  },
};
// ----------------
// HELPER FUNCTIONS
// ----------------
/**
 * Gets a flat lists of file paths that exist in a given directory and its sub-directories.
 *
 * @param directory - The directory to get a file list for.
 *
 * @returns The list of file path in the directory structure.
 */
async function getDirectoryFileList(directory) {
  const files = [];
  const filesInDirectory = await fsp.readdir(directory);
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file);
    if ((await fsp.stat(absolute)).isDirectory()) {
      files.push(...(await getDirectoryFileList(absolute)));
    } else {
      files.push(absolute);
    }
  }
  return files;
}
/**
 * Generates a checksum hash string for a given string value.
 *
 * @param value - The string value to generate a checksum for.
 *
 * @returns The checksum hash string.
 */
function getDataHash(value) {
  // Create a hashing function to apply against the data value.
  const hash = crypto.createHash("sha1");
  hash.setEncoding("hex");
  // Write the value through the hashing function to generate the checksum.
  hash.write(value);
  // Return the resulting checksum hash once done.
  return hash.digest("hex");
}
/**
 * Generates a checksum string for a given file.
 *
 * @param filePath - The file to generate a checksum for.
 *
 * @returns The checksum hash string.
 */
async function getFileHash(filePath) {
  // Create a stream to read the file.
  const fileStream = fs.createReadStream(filePath);
  // Create a hashing function to apply against the file contents.
  const hash = crypto.createHash("sha1");
  hash.setEncoding("hex");
  // Pipe the file through the hashing function to generate the checksum.
  fileStream.pipe(hash);
  // Return the resulting checksum hash once done.
  return new Promise(function (resolve, reject) {
    fileStream.on("end", () => resolve(hash.read()));
    fileStream.on("error", reject);
  });
}
//# sourceMappingURL=ChecksumReport.js.map

const createJson = async () => {
  const json = await ChecksumReport.get("./build");
  console.log("🚀 ~ file: createCheckSum.js:138 ~ createJson ~ json:");
  const destCheckSum = path.join("build", "checksum.json");
  const destCheckSumVersion = path.join("build", "checksum-version.json");
  fs.writeFile(destCheckSum, JSON.stringify(json), (err) => {
    if (err) throw err;
    console.log("checksum.json successfully generated");
  });
  fs.writeFile(
    destCheckSumVersion,
    JSON.stringify({
      id: json.id,
      timestamp: json.timestamp,
    }),
    (err) => {
      if (err) throw err;
      console.log("checksum-version.json successfully generated");
    }
  );
};

createJson();
