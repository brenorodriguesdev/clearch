import * as path from 'node:path';
import { assertKebabCase, toCamelCase, toPascalCase } from './naming';
import { renderTemplate, type TemplateVars } from './template';
import { getGeneratorsRoot } from './paths';
import { assertClearchProject } from './project-guard';
import { ensureDir, pathExists, readFile, writeFile } from './fs-utils';

export type GenerateUsecaseOptions = {
  useCaseKebab: string;
  cwd: string;
};

type PlannedFile = {
  templateRelativePath: string;
  outputRelativePath: string;
};

export async function runGenerateUsecase(options: GenerateUsecaseOptions): Promise<{
  written: string[];
  skipped: string[];
}> {
  const useCaseKebab = options.useCaseKebab.trim();
  assertKebabCase(useCaseKebab, 'Use case name');

  await assertClearchProject(options.cwd);

  const httpContract = path.join(options.cwd, 'src/presentation/contracts/controller.ts');
  if (!(await pathExists(httpContract))) {
    throw new Error(
      'HTTP presentation contracts are missing. Run `clearch install http` before generating a use case.'
    );
  }

  const useCasePascal = toPascalCase(useCaseKebab);

  const vars: TemplateVars = {
    USE_CASE_KEBAB: useCaseKebab,
    USE_CASE_PASCAL: useCasePascal,
    USE_CASE_CAMEL: toCamelCase(useCaseKebab),
  };

  const templateRoot = getGeneratorsRoot();
  const filesDir = path.join(templateRoot, 'generate-usecase', 'files');

  const planned: PlannedFile[] = [
    {
      templateRelativePath: 'data/services/service.ts.template',
      outputRelativePath: `src/data/services/${useCaseKebab}.ts`,
    },
    {
      templateRelativePath: 'presentation/controllers/controller.ts.template',
      outputRelativePath: `src/presentation/controllers/${useCaseKebab}.ts`,
    },
    {
      templateRelativePath: 'validation/validators/usecase-validators.ts.template',
      outputRelativePath: `src/validation/validators/${useCaseKebab}.ts`,
    },
    {
      templateRelativePath: 'main/factories/validators/factory-validator.ts.template',
      outputRelativePath: `src/main/factories/validators/${useCaseKebab}.ts`,
    },
    {
      templateRelativePath: 'main/factories/controllers/factory-controller.ts.template',
      outputRelativePath: `src/main/factories/controllers/${useCaseKebab}.ts`,
    },
  ];

  const written: string[] = [];
  const skipped: string[] = [];

  for (const plan of planned) {
    const src = path.join(filesDir, plan.templateRelativePath);
    const dest = path.join(options.cwd, plan.outputRelativePath);
    if (await pathExists(dest)) {
      skipped.push(plan.outputRelativePath);
      continue;
    }
    if (!(await pathExists(src))) {
      throw new Error(`Missing template: ${plan.templateRelativePath}`);
    }
    await ensureDir(path.dirname(dest));
    const raw = await readFile(src, 'utf8');
    await writeFile(dest, renderTemplate(raw, vars), 'utf8');
    written.push(plan.outputRelativePath);
  }

  return { written, skipped };
}
