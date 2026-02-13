#!/usr/bin/env bun

type BumpType = 'patch' | 'minor' | 'major';

interface PackageJson {
	name: string;
	version: string;
	[key: string]: unknown;
}

async function main() {
	const bumpType = process.argv[2] as BumpType | undefined;

	if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
		console.error('Error: Invalid bump type');
		console.error('Usage: bun run scripts/bump-version.ts [patch|minor|major]');
		console.error('');
		console.error('Examples:');
		console.error('  bun run scripts/bump-version.ts patch  # 1.0.0 -> 1.0.1');
		console.error('  bun run scripts/bump-version.ts minor  # 1.0.0 -> 1.1.0');
		console.error('  bun run scripts/bump-version.ts major  # 1.0.0 -> 2.0.0');
		process.exit(1);
	}

	try {
		// Read package.json
		const packageJsonPath = 'package.json';
		const file = Bun.file(packageJsonPath);
		const packageJson: PackageJson = await file.json();

		// Parse current version
		const currentVersion = packageJson.version;
		const versionParts = currentVersion.split('.').map(Number);

		if (versionParts.length !== 3 || versionParts.some(Number.isNaN)) {
			throw new Error(`Invalid version format: ${currentVersion}`);
		}

		let [major, minor, patch] = versionParts;

		// Increment version based on bump type
		switch (bumpType) {
			case 'major':
				major += 1;
				minor = 0;
				patch = 0;
				break;
			case 'minor':
				minor += 1;
				patch = 0;
				break;
			case 'patch':
				patch += 1;
				break;
		}

		const newVersion = `${major}.${minor}.${patch}`;

		// Update package.json
		packageJson.version = newVersion;

		// Write updated package.json with pretty formatting
		await Bun.write(
			packageJsonPath,
			JSON.stringify(packageJson, null, 2) + '\n'
		);

		console.log(`Version bumped: ${currentVersion} -> ${newVersion}`);

		// Create git tag
		const tagName = `v${newVersion}`;
		const tagProcess = Bun.spawn(['git', 'tag', tagName], {
			stdout: 'inherit',
			stderr: 'inherit',
		});

		const exitCode = await tagProcess.exited;

		if (exitCode !== 0) {
			// Rollback package.json
			packageJson.version = currentVersion;
			await Bun.write(
				packageJsonPath,
				JSON.stringify(packageJson, null, 2) + '\n'
			);
			throw new Error(
				`Failed to create git tag ${tagName}. Package.json has been rolled back.`
			);
		}

		console.log(`Git tag created: ${tagName}`);
		console.log('');
		console.log('Success! To push the tag to remote:');
		console.log(`  git push origin ${tagName}`);
	} catch (error) {
		console.error('Error:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
