import { runSupabase } from "./_supabase";

async function main() {
	const args = process.argv.slice(2).filter((arg) => arg !== "--");
	await runSupabase(["db", "push", ...args]);
}

main().catch((error) => {
	console.error("❌ db:migrate failed:", error);
	process.exit(1);
});
