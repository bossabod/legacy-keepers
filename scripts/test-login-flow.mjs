/**
 * Headless logic test for the login flow (no browser required).
 * Mirrors LoginScreen handlers against src/lib/auth.ts.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load auth.ts via a tiny transpile (strip types manually)
const authSrc = readFileSync(join(root, "src/lib/auth.ts"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/export type[\s\S]*?;/g, "")
  .replace(/: AuthResult/g, "")
  .replace(/: AuthReason/g, "")
  .replace(/: string/g, "")
  .replace(/: Record<AuthReason, string>/g, "")
  .replace(/as const/g, "")
  .replace(/export /g, "");

const fn = new Function(`${authSrc}\nreturn { checkCredentials, AUTH_MESSAGES, VALID_MEMBERSHIP_ID, VALID_MEMBERSHIP_PASS };`);
const auth = fn();

function simulateLogin({ id, pass, action }) {
  const state = {
    membership: id,
    pass,
    showPass: false,
    verifying: false,
    error: null,
    phase: "login",
    demoMode: false,
  };

  const finishAuth = (demo = false) => {
    state.verifying = false;
    state.demoMode = demo;
    state.phase = "app";
  };

  const authenticate = () => {
    if (state.verifying) return "blocked";
    const res = auth.checkCredentials(state.membership, state.pass);
    if (!res.ok) {
      state.error = auth.AUTH_MESSAGES[res.reason];
      return "error";
    }
    state.error = null;
    state.verifying = true;
    finishAuth(false);
    return "ok";
  };

  const enterDemo = () => {
    if (state.verifying) return "blocked";
    state.membership = auth.VALID_MEMBERSHIP_ID;
    state.pass = auth.VALID_MEMBERSHIP_PASS;
    state.error = null;
    state.verifying = true;
    finishAuth(true);
    return "ok";
  };

  const toggleShowPass = () => {
    state.showPass = !state.showPass;
    return state.showPass;
  };

  if (action === "authenticate") authenticate();
  if (action === "demo") enterDemo();
  if (action === "toggle-pass") toggleShowPass();
  if (action === "type-id") state.membership = id;
  if (action === "type-pass") state.pass = pass;
  if (action === "enter-key") authenticate(); // Enter submits form

  return state;
}

const tests = [];
function assert(name, cond, detail = "") {
  tests.push({ name, ok: !!cond, detail });
  console.log(cond ? `✓ ${name}` : `✗ ${name} ${detail}`);
}

// 1. Wrong credentials → error, stay on login
{
  const s = simulateLogin({ id: "bad", pass: "bad", action: "authenticate" });
  assert("wrong creds stay on login", s.phase === "login");
  assert("wrong creds show error", typeof s.error === "string" && s.error.length > 0, s.error);
  assert("wrong creds not verifying", s.verifying === false);
}

// 2. Correct credentials → app
{
  const s = simulateLogin({ id: "Q-T-971", pass: "COVENANT", action: "authenticate" });
  assert("correct creds enter app", s.phase === "app");
  assert("correct creds no error", s.error === null);
  assert("correct creds not demo", s.demoMode === false);
}

// 3. Case-insensitive
{
  const s = simulateLogin({ id: "q-t-971", pass: "covenant", action: "authenticate" });
  assert("case-insensitive login", s.phase === "app");
}

// 4. Enter key
{
  const s = simulateLogin({ id: "Q-T-971", pass: "COVENANT", action: "enter-key" });
  assert("Enter key authenticates", s.phase === "app");
}

// 5. Empty fields error
{
  const s = simulateLogin({ id: "", pass: "", action: "authenticate" });
  assert("empty shows error", !!s.error);
  assert("empty stays login", s.phase === "login");
}

// 6. Demo access
{
  const s = simulateLogin({ id: "", pass: "", action: "demo" });
  assert("demo enters app", s.phase === "app");
  assert("demo mode flag", s.demoMode === true);
  assert("demo fills credentials", s.membership === "Q-T-971" && s.pass === "COVENANT");
}

// 7. Show/hide password
{
  const s = simulateLogin({ id: "", pass: "", action: "toggle-pass" });
  assert("show password toggles on", s.showPass === true);
}

// 8. Fields accept input
{
  let s = simulateLogin({ id: "X", pass: "", action: "type-id" });
  assert("id field accepts input", s.membership === "X");
  s = simulateLogin({ id: "", pass: "secret", action: "type-pass" });
  assert("pass field accepts input", s.pass === "secret");
}

const failed = tests.filter((t) => !t.ok);
console.log(`\n${tests.length - failed.length}/${tests.length} passed`);
process.exit(failed.length ? 1 : 0);
