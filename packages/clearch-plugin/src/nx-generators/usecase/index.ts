import { Tree } from '@nx/devkit';
import { runGenerateUsecase } from '../../lib/generate-usecase';

export interface UsecaseGeneratorOptions {
  name: string;
}

export default async function (tree: Tree, options: UsecaseGeneratorOptions): Promise<void> {
  const cwd = tree.root;
  const { written, skipped } = await runGenerateUsecase({
    useCaseKebab: options.name,
    cwd,
  });

  if (written.length) {
    console.log('[clearch] wrote:');
    for (const file of written) {
      console.log(`  - ${file}`);
    }
  }

  if (skipped.length) {
    console.log('[clearch] skipped (already exists):');
    for (const file of skipped) {
      console.log(`  - ${file}`);
    }
  }

  console.log('[clearch] next steps:');
  console.log('  - Register a route in src/main/routes using adaptRouter(...)');
  console.log('  - Implement TODOs in the generated service (add contracts/repos in data/ if you need them)');
  console.log('  - Run npm run build to verify TypeScript');
}
