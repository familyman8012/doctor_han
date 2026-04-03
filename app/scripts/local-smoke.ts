import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { appRoot, ensureLocalSupabaseEnv } from "./_supabase";

type EnvMap = Record<string, string>;

async function getLocalSupabaseEnv(): Promise<EnvMap> {
	return ensureLocalSupabaseEnv([
		"--override-name",
		"api.url=NEXT_PUBLIC_SUPABASE_URL",
		"--override-name",
		"auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"--override-name",
		"auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
	]);
}

function waitForExit(child: ReturnType<typeof spawn>): Promise<number | null> {
	return new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("close", resolve);
	});
}

function waitForExitDetails(
	child: ReturnType<typeof spawn>,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
	return new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("exit", (code, signal) => resolve({ code, signal }));
	});
}

async function stopExistingDevServers() {
	for (const pattern of ["next dev", "next start", "next-server"]) {
		const child = spawn("pkill", ["-f", pattern], {
			cwd: appRoot,
			stdio: "ignore",
		});

		try {
			await waitForExit(child);
		} catch {
			// ignore: pkill may not exist or there may be no matching process
		}
	}
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
	const startedAt = Date.now();
	let lastStatus: number | null = null;
	let lastError: string | null = null;

	while (Date.now() - startedAt < timeoutMs) {
		try {
			const response = await fetch(url, { redirect: "manual" });
			lastStatus = response.status;
			if (response.status < 500) return;
		} catch {
			lastError = "fetch_failed";
		}

		await delay(1000);
	}

	throw new Error(
		`Timed out waiting for ${url} (lastStatus=${lastStatus ?? "none"}, lastError=${lastError ?? "none"})`,
	);
}

async function waitForSupabaseSchema(env: EnvMap, timeoutMs = 60_000): Promise<void> {
	const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!baseUrl || !anonKey) {
		throw new Error("Missing local Supabase URL/anon key for schema warmup.");
	}

	const headers = {
		apikey: anonKey,
		Authorization: `Bearer ${anonKey}`,
	};
	const checks = [
		`${baseUrl}/rest/v1/categories?select=id&limit=1`,
		`${baseUrl}/rest/v1/vendors?select=id&limit=1`,
	];

	const startedAt = Date.now();
	let lastMessage = "not_started";

	while (Date.now() - startedAt < timeoutMs) {
		let readyCount = 0;

		for (const url of checks) {
			try {
				const response = await fetch(url, { headers });
				const text = await response.text();

				if (
					response.ok &&
					!text.includes("schema cache") &&
					!text.includes("Could not find the table")
				) {
					readyCount += 1;
					continue;
				}

				lastMessage = `${response.status} ${text.slice(0, 120)}`;
			} catch (error) {
				lastMessage = error instanceof Error ? error.message : String(error);
			}
		}

		if (readyCount === checks.length) {
			return;
		}

		await delay(1_000);
	}

	throw new Error(`Timed out waiting for Supabase schema cache warmup (${lastMessage})`);
}

async function runPnpmScript(script: string, env: NodeJS.ProcessEnv) {
	const code = await waitForExit(
		spawn("pnpm", [script], {
			cwd: appRoot,
			env,
			stdio: "inherit",
		}),
	);

	if (code !== 0) {
		process.exit(code ?? 1);
	}
}

function spawnNextServer(serverScript: string, env: NodeJS.ProcessEnv, logFd: number) {
	if (serverScript === "dev") {
		return spawn("pnpm", ["dev"], {
			cwd: appRoot,
			env,
			stdio: ["ignore", logFd, logFd],
		});
	}

	if (serverScript === "start") {
		return spawn(process.execPath, [join(appRoot, "node_modules", "next", "dist", "bin", "next"), serverScript], {
			cwd: appRoot,
			env,
			stdio: ["ignore", logFd, logFd],
		});
	}

	return spawn("pnpm", [serverScript], {
		cwd: appRoot,
		env,
		stdio: ["ignore", logFd, logFd],
	});
}

function formatServerLogTail(logPath: string, lineCount = 80): string {
	try {
		const contents = readFileSync(logPath, "utf8").trim();
		if (!contents) return "(server log is empty)";
		return contents.split("\n").slice(-lineCount).join("\n");
	} catch (error) {
		return `Could not read server log: ${error instanceof Error ? error.message : String(error)}`;
	}
}

async function main() {
	const targetScript = process.argv[2] ?? "smoke:mutation";
	const serverScript = process.env.LOCAL_SERVER_SCRIPT ?? "start";
	const host = process.env.LOCAL_SERVER_HOST ?? "127.0.0.1";
	const serverLogPath = process.env.LOCAL_SERVER_LOG_PATH ?? join(appRoot, ".local-server.log");
	const localEnv = await getLocalSupabaseEnv();
	const port = process.env.LOCAL_SMOKE_PORT ?? "3000";
	const env = {
		...process.env,
		...localEnv,
		PORT: port,
		SMOKE_BASE_URL: `http://${host}:${port}`,
	};

	await stopExistingDevServers();
	await delay(1000);
	await waitForSupabaseSchema(localEnv);
	rmSync(serverLogPath, { force: true });
	const serverLogFd = openSync(serverLogPath, "a");

	if (
		serverScript === "start" &&
		(process.env.LOCAL_SERVER_BUILD === "always" ||
			(process.env.LOCAL_SERVER_BUILD ?? "auto") !== "never" &&
				!existsSync(join(appRoot, ".next", "BUILD_ID")))
	) {
		await runPnpmScript("build", env);
	}

	const devChild = spawnNextServer(serverScript, env, serverLogFd);
	const devChildExit = waitForExitDetails(devChild);

	try {
		await waitForServer(`${env.SMOKE_BASE_URL}/login`, 60_000).catch((error) => {
			throw new Error(
				[
					error instanceof Error ? error.message : String(error),
					"",
					`Server log tail (${serverLogPath}):`,
					formatServerLogTail(serverLogPath),
				].join("\n"),
			);
		});

		const targetChild = spawn("pnpm", [targetScript], {
				cwd: appRoot,
				env,
				stdio: "inherit",
			});
		const targetExit = waitForExit(targetChild);
		const raceResult = await Promise.race([
			targetExit.then((code) => ({ kind: "target" as const, code })),
			devChildExit.then((result) => ({ kind: "server" as const, ...result })),
		]);

		if (raceResult.kind === "server") {
			console.error(`\n💥 Local server exited early (code=${raceResult.code ?? "null"}, signal=${raceResult.signal ?? "null"})`);
			console.error(`\n📄 Local server log tail (${serverLogPath})`);
			console.error(formatServerLogTail(serverLogPath));
			targetChild.kill("SIGTERM");
			process.exit(1);
		}

		if (raceResult.code !== 0) {
			console.error(`\n📄 Local server log tail (${serverLogPath})`);
			console.error(formatServerLogTail(serverLogPath));
			process.exit(raceResult.code ?? 1);
		}
	} finally {
		devChild.kill("SIGTERM");
		await Promise.race([waitForExit(devChild), delay(10_000)]);
		closeSync(serverLogFd);
	}
}

main().catch((error) => {
	console.error("❌ local-smoke failed:", error);
	process.exit(1);
});
