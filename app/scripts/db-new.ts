import { runSupabase } from "./_supabase";

async function main() {
	const [name, ...rest] = process.argv.slice(2).filter((arg) => arg !== "--");

	if (!name) {
		console.error('Usage: pnpm db:new -- "<migration_name>"');
		process.exit(1);
	}

	await runSupabase(["migration", "new", name, ...rest]);
}

main().catch((error) => {
	console.error("❌ db:new failed:", error);
	process.exit(1);
});
