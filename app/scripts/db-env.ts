import fs from "node:fs/promises";
import path from "node:path";

import { appRoot, runSupabaseCaptureStdout } from "./_supabase";

type EnvMap = Record<string, string>;

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

function replaceOrAppendKey(lines: string[], key: string, value: string): string[] {
	const prefix = `${key}=`;
	let replaced = false;

	const next = lines.map((line) => {
		if (!line.startsWith(prefix)) return line;
		replaced = true;
		return `${key}=${value}`;
	});

	if (!replaced) next.push(`${key}=${value}`);
	return next;
}

async function main() {
	const args = new Set(process.argv.slice(2));
	const force = args.has("--force");

	const envExamplePath = path.resolve(appRoot, ".env.example");
	const envLocalPath = path.resolve(appRoot, ".env.local");

	try {
		await fs.access(envLocalPath);
		if (!force) {
			console.info(`ℹ️  Skipped: ${path.relative(appRoot, envLocalPath)} already exists (use --force to overwrite).`);
			return;
		}
	} catch {
		// ok: does not exist
	}

	const statusEnv = await runSupabaseCaptureStdout([
		"status",
		"-o",
		"env",
		"--override-name",
		"api.url=NEXT_PUBLIC_SUPABASE_URL",
		"--override-name",
		"auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"--override-name",
		"auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
	]);

	const envFromStatus = parseEnvOutput(statusEnv);

	const requiredKeys = [
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
	] as const;

	for (const key of requiredKeys) {
		if (!envFromStatus[key]) {
			console.error(
				[
					`❌ Missing ${key} from \`supabase status\` output.`,
					"",
					"Make sure local Supabase is running:",
					"  pnpm db:start",
				].join("\n"),
			);
			process.exit(1);
		}
	}

	const template = await fs.readFile(envExamplePath, "utf8");
	let outLines = template.replaceAll("\r\n", "\n").split("\n");

	outLines = replaceOrAppendKey(outLines, "NEXT_PUBLIC_SUPABASE_URL", envFromStatus.NEXT_PUBLIC_SUPABASE_URL);
	outLines = replaceOrAppendKey(outLines, "NEXT_PUBLIC_SUPABASE_ANON_KEY", envFromStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY);
	outLines = replaceOrAppendKey(outLines, "SUPABASE_SERVICE_ROLE_KEY", envFromStatus.SUPABASE_SERVICE_ROLE_KEY);

	const schema = process.env.SUPABASE_SCHEMA ?? "public";
	outLines = replaceOrAppendKey(outLines, "SUPABASE_SCHEMA", schema);

	const out = `${outLines.join("\n").trimEnd()}\n`;
	await fs.writeFile(envLocalPath, out, "utf8");

	console.info(`✅ Generated: ${path.relative(appRoot, envLocalPath)}`);
}

main().catch((error) => {
	console.error("❌ db:env failed:", error);
	process.exit(1);
});
