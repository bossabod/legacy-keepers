import { readFileSync } from "fs";

const home = readFileSync("src/components/sections/Home.tsx", "utf8");
const projects = readFileSync("src/components/sections/Projects.tsx", "utf8");
const ops = readFileSync("src/components/projects/ProjectOperations.tsx", "utf8");
const dash = readFileSync("src/components/Dashboard.tsx", "utf8");

const fail = (m) => {
  console.error("FAIL:", m);
  process.exit(1);
};

if (home.includes("GlobalCommandGlobe")) fail("HOME still imports globe");
if (home.includes("Operational Performance")) fail("HOME still has operational dashboard");
if (home.includes("ProjectsDashboard")) fail("HOME still has projects dashboard");
if (!projects.includes("import ProjectOperations")) fail("PROJECTS missing ProjectOperations import");
if (!projects.includes('useState<Tab>("operations")')) fail("PROJECTS does not default to operations");
if (!ops.includes("GlobalCommandGlobe")) fail("ProjectOperations missing globe");
if (!ops.includes("ProjectsDashboard")) fail("ProjectOperations missing ProjectsDashboard");
if (!dash.includes("case \"projects\": return <ProjectsSection")) fail("Navbar projects route broken");
if (!ops.includes("pointer-events-none")) fail("globe overlays should not steal pointer events");

console.log("OK Home has no globe/ops");
console.log("OK Projects mounts ProjectOperations by default");
console.log("OK Globe + ProjectsDashboard wired");
console.log("OK Dashboard navbar routes projects to ProjectsSection");
