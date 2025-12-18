import { runSupabase } from "./_supabase";

async function main() {
	const args = process.argv.slice(2).filter((arg) => arg !== "--");
	await runSupabase(["db", "reset", ...args]);
}

main().catch((error) => {
	console.error("❌ db:reset failed:", error);
	process.exit(1);
});
