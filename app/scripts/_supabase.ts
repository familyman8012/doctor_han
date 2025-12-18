import { spawn } from "node:child_process";

export const appRoot = process.cwd();

type ExitCode = number | null;

function waitForExit(child: ReturnType<typeof spawn>): Promise<ExitCode> {
	return new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("close", resolve);
	});
}

export async function runSupabase(args: string[]): Promise<void> {
	const code = await waitForExit(
		spawn("pnpm", ["exec", "supabase", ...args], {
			cwd: appRoot,
			stdio: "inherit",
		}),
	);

	if (code !== 0) process.exit(code ?? 1);
}

export async function runSupabaseCaptureStdout(args: string[]): Promise<string> {
	const child = spawn("pnpm", ["exec", "supabase", ...args], {
		cwd: appRoot,
		stdio: ["inherit", "pipe", "inherit"],
	});

	let stdout = "";
	child.stdout?.on("data", (chunk) => {
		stdout += chunk.toString();
	});

	const code = await waitForExit(child);
	if (code !== 0) process.exit(code ?? 1);

	return stdout;
}
