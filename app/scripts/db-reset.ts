import { runSupabase } from "./_supabase";
import { spawn } from "node:child_process";

async function main() {
	const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
	const skipSeed = rawArgs.includes("--skip-seed");
	const args = rawArgs.filter((arg) => arg !== "--skip-seed");
	await runSupabase(["db", "reset", ...args]);

	if (skipSeed) {
		console.info("ℹ️  Skipped: db:seed (use without --skip-seed to generate local data).");
		return;
	}

	const code = await new Promise<number | null>((resolve, reject) => {
		const child = spawn("pnpm", ["db:seed"], { stdio: "inherit" });
		child.on("error", reject);
		child.on("close", resolve);
	});

	if (code !== 0) process.exit(code ?? 1);
}

main().catch((error) => {
	console.error("❌ db:reset failed:", error);
	process.exit(1);
});
