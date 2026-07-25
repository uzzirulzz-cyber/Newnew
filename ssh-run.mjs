#!/usr/bin/env node
/**
 * SSH command runner for cPanel (server49.shared.spaceship.host).
 * Usage: node ssh-run.mjs "command to run"
 *
 * Password is read from the CPANEL_SSH_PASS environment variable.
 */

import { Client } from "ssh2";

const password = process.env.CPANEL_SSH_PASS;
const command = process.argv[2];

if (!password) {
  console.error("✗ Set CPANEL_SSH_PASS environment variable first");
  process.exit(1);
}
if (!command) {
  console.error("Usage: node ssh-run.mjs 'command'");
  process.exit(1);
}

const conn = new Client();
conn.on("ready", () => {
  conn.exec(command, (err, stream) => {
    if (err) { console.error("exec error:", err.message); conn.end(); process.exit(1); }
    let stdout = "";
    let stderr = "";
    stream.on("data", (d) => { stdout += d; process.stdout.write(d); });
    stream.stderr.on("data", (d) => { stderr += d; process.stderr.write(d); });
    stream.on("close", (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
}).on("error", (e) => {
  console.error("✗ SSH error:", e.message);
  process.exit(1);
}).connect({
  host: "server49.shared.spaceship.host",
  port: 22,
  username: "jxfdmejtgt",
  password,
  readyTimeout: 15000,
});
