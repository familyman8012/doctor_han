import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

export const appRoot = process.cwd();

type ExitCode = number | null;
type RunResult = {
	code: ExitCode;
	stdout: string;
	stderr: string;
};

type EnvMap = Record<string, string>;

function waitForExit(child: ReturnType<typeof spawn>): Promise<ExitCode> {
	return new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("close", resolve);
	});
}

async function runSupabaseCommand(args: string[], captureStdout: boolean): Promise<RunResult> {
	const child = spawn("pnpm", ["exec", "supabase", ...args], {
		cwd: appRoot,
		stdio: ["inherit", captureStdout ? "pipe" : "inherit", "pipe"],
	});

	let stdout = "";
	let stderr = "";
	child.stdout?.on("data", (chunk) => {
		stdout += chunk.toString();
	});
	child.stderr?.on("data", (chunk) => {
		const text = chunk.toString();
		stderr += text;
		if (!captureStdout) {
			process.stderr.write(text);
		}
	});

	const code = await waitForExit(child);

	return { code, stdout, stderr };
}

async function runCommand(command: string, args: string[]): Promise<RunResult> {
	const child = spawn(command, args, {
		cwd: appRoot,
		stdio: ["ignore", "pipe", "pipe"],
	});

	let stdout = "";
	let stderr = "";
	child.stdout?.on("data", (chunk) => {
		stdout += chunk.toString();
	});
	child.stderr?.on("data", (chunk) => {
		stderr += chunk.toString();
	});

	const code = await waitForExit(child);
	return { code, stdout, stderr };
}

function parseProjectIdFromConfig(contents: string): string | null {
	const match = contents.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
	return match?.[1]?.trim() || null;
}

async function readSupabaseProjectRef(): Promise<string | null> {
	const envProjectRef = process.env.SUPABASE_PROJECT_ID?.trim();
	if (envProjectRef) return envProjectRef;

	const tempProjectRefPath = path.join(appRoot, "supabase", ".temp", "project-ref");
	try {
		const tempProjectRef = (await fs.readFile(tempProjectRefPath, "utf8")).trim();
		if (tempProjectRef) return tempProjectRef;
	} catch {
		// ignore
	}

	const configPath = path.join(appRoot, "supabase", "config.toml");
	try {
		const config = await fs.readFile(configPath, "utf8");
		return parseProjectIdFromConfig(config);
	} catch {
		return null;
	}
}

function parseEnvOutput(output: string): EnvMap {
	const lines = output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const env: EnvMap = {};

	for (const line of lines) {
		if (line.startsWith("Stopped services:")) continue;

		const match = /^([A-Z0-9_]+)="(.*)"$/.exec(line);
		if (!match) continue;

		const [, key, rawValue] = match;
		env[key] = rawValue.replaceAll('\\"', '"');
	}

	return env;
}

async function cleanupStaleSupabaseContainers() {
	const projectRef = await readSupabaseProjectRef();
	if (!projectRef) return;

	const listResult = await runCommand("docker", [
		"ps",
		"-aq",
		"--filter",
		`name=supabase_.*_${projectRef}`,
	]);

	if (listResult.code !== 0) return;

	const ids = listResult.stdout
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (ids.length === 0) return;

	await runCommand("docker", ["rm", "-f", ...ids]);
}

async function waitForLocalSupabaseApi(timeoutMs = 90_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	const apiUrls = [
		"http://127.0.0.1:54321/auth/v1/health",
		"http://127.0.0.1:54321/rest/v1/",
	];

	while (Date.now() < deadline) {
		for (const url of apiUrls) {
			try {
				const response = await fetch(url, { redirect: "manual" });
				if (response.status < 500) {
					return;
				}
			} catch {
				// ignore until ready
			}
		}

		await delay(1_000);
	}

	throw new Error("Timed out waiting for local Supabase API.");
}

function getSupabaseFailureText(result: RunResult, args: string[]): string {
	const combined = `${result.stdout}\n${result.stderr}`.trim();
	return combined || `supabase ${args.join(" ")} failed with code ${result.code ?? "unknown"}`;
}

async function startLocalSupabase(): Promise<void> {
	try {
		await waitForLocalSupabaseApi(2_000);
		return;
	} catch {
		// continue with startup recovery
	}

	const firstAttempt = await runSupabaseCommand(["start"], true);
	if (firstAttempt.code === 0) {
		await waitForLocalSupabaseApi();
		return;
	}

	const failureText = getSupabaseFailureText(firstAttempt, ["start"]);

	if (/Conflict\.\s+The container name/i.test(failureText)) {
		await cleanupStaleSupabaseContainers();

		const secondAttempt = await runSupabaseCommand(["start"], true);
		if (secondAttempt.code !== 0) {
			throw new Error(getSupabaseFailureText(secondAttempt, ["start"]));
		}

		await waitForLocalSupabaseApi();
		return;
	}

	throw new Error(failureText);
}

export async function runSupabase(args: string[]): Promise<void> {
	const result = await runSupabaseCommand(args, false);

	if (result.code !== 0) {
		throw new Error(getSupabaseFailureText(result, args));
	}
}

export async function runSupabaseCaptureStdout(args: string[]): Promise<string> {
	const result = await runSupabaseCommand(args, true);
	if (result.code !== 0) {
		throw new Error(getSupabaseFailureText(result, args));
	}

	return result.stdout;
}

export async function ensureLocalSupabaseEnv(overrideArgs: string[]): Promise<EnvMap> {
	await startLocalSupabase();

	const statusArgs = ["status", "-o", "env", ...overrideArgs];

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const result = await runSupabaseCommand(statusArgs, true);
		if (result.code === 0) {
			return parseEnvOutput(result.stdout);
		}

		await delay(1_000);
	}

	throw new Error("Could not read local Supabase env after startup.");
}
