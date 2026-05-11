import { spawn } from 'node:child_process';
import process from 'node:process';

const tasks = [
  { label: 'api', cmd: 'npm', args: ['run', 'dev', '--workspace=apps/api'] },
  { label: 'web', cmd: 'npm', args: ['run', 'dev', '--workspace=apps/web'] },
];

function killProcessGroupOrChild(child, signal) {
  // If spawned with `detached: true`, the child pid is also the process group id.
  try {
    process.kill(-child.pid, signal);
    return;
  } catch {
    // Fallback: kill just the direct child pid.
  }

  try {
    child.kill(signal);
  } catch {
    // Ignore failures (e.g. already exited).
  }
}

const children = tasks.map((t) => {
  const child = spawn(t.cmd, t.args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
    detached: true, // allow Ctrl+C handling to kill the whole tree via process groups
  });

  if (!child.pid) {
    throw new Error(`Failed to start ${t.label}`);
  }
  return child;
});

const exitPromises = children.map(
  (child) =>
    new Promise((resolve) => {
      child.on('exit', (code, signal) => resolve({ code, signal }));
    }),
);

let shuttingDown = false;

async function shutdown(triggerSignal) {
  if (shuttingDown) return;
  shuttingDown = true;

  // Prefer a graceful shutdown first, then hard-kill if anything keeps running.
  for (const child of children) {
    killProcessGroupOrChild(child, triggerSignal === 'SIGTERM' ? 'SIGTERM' : 'SIGINT');
  }

  await new Promise((r) => setTimeout(r, 1200));

  for (const child of children) {
    killProcessGroupOrChild(child, 'SIGKILL');
  }

  // Don't hang forever if a process ignores signals.
  await Promise.race([
    Promise.all(exitPromises),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// If one server exits unexpectedly, stop the other too so we don't leave ports hanging.
for (const child of children) {
  child.on('exit', () => {
    if (!shuttingDown) shutdown('SIGINT');
  });
}

// Keep the parent alive until shutdown completes.
await new Promise(() => {});

