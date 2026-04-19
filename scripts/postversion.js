const fs = require("fs");
const path = require("path");

const version = require("../package.json").version;
const today = new Date().toISOString().split("T")[0];
const anchor = version.replace(/\./g, "") + "--" + today;

// --- Update README badge ---
const readmePath = path.resolve(__dirname, "../README.md");
let readme = fs.readFileSync(readmePath, "utf-8");
readme = readme.replace(
	/badge\/version-[\d.]+(-[\w.]+)?-blue/,
	`badge/version-${version}-blue`,
);
fs.writeFileSync(readmePath, readme);
console.log(`README badge updated to ${version}`);

// --- Add release notes entry ---
const changelogPath = path.resolve(__dirname, "../docs/ChangeLog.md");
let changelog = fs.readFileSync(changelogPath, "utf-8");

// Add row to the top of the version history table (after |---|---|---|)
const tableRow = `| [${version}](#${anchor}) | ${today} | - |`;
changelog = changelog.replace(/(^\|[-| ]+\|$)/m, `$1\n${tableRow}`);

// Add new section after the first --- separator following the table
const newSection = [
	`## [${version}] — ${today}`,
	"",
	"### Added",
	"",
	"- _Update this section before publishing_",
	"",
	"### Changed",
	"",
	"- _Update this section before publishing_",
	"",
	"### Fixed",
	"",
	"- _Update this section before publishing_",
].join("\n");

// Insert before the first ## [x.y.z] section
changelog = changelog.replace(
	/(\n---\n\n)(## \[)/,
	`$1${newSection}\n\n---\n\n$2`,
);

fs.writeFileSync(changelogPath, changelog);
console.log(`ChangeLog entry added for ${version}`);
