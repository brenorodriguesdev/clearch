import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { assertClearchProject } from './project-guard';
import { readProjectContext } from './project-context';
import { copyTemplateDir } from './template';
import { updatePackageJson } from './update-package-json';
import { appendReadmeSection } from './readme-append';
import { getGeneratorsRoot } from './paths';

export type InfraProvider = 'terraform' | 'cdk';

export type InitInfraOptions = {
  cwd: string;
  provider: InfraProvider;
};

export async function runInitInfra(options: InitInfraOptions): Promise<{ skipped: boolean }> {
  const { cwd, provider } = options;

  // Guard: must be a clearch project
  assertClearchProject(cwd);

  // Check idempotency: read clearch config to see if infra was already initialized
  const clearchConfigPath = path.join(cwd, '.clearch', 'config.json');
  let clearchConfig: { infra?: string } = {};
  try {
    const raw = await fs.readFile(clearchConfigPath, 'utf8');
    clearchConfig = JSON.parse(raw);
  } catch {
    // File doesn't exist yet, that's fine
  }

  // If infra is already initialized, warn and skip
  if (clearchConfig.infra === provider) {
    console.log(`[clearch] Infrastructure already initialized with ${provider}`);
    return { skipped: true };
  }

  if (clearchConfig.infra && clearchConfig.infra !== provider) {
    console.log(`[clearch] Note: infra was already initialized with ${clearchConfig.infra}, switching to ${provider}`);
  }

  // Get project context for template rendering
  const context = await readProjectContext(cwd);
  const vars = {
    PROJECT_NAME: context.projectNameKebab,
    PROJECT_NAME_PASCAL: context.projectNamePascal,
    PROJECT_NAME_CAMEL: context.projectNameCamel,
  };

  // Copy provider-specific template files
  const generatorsRoot = getGeneratorsRoot();
  const templateRoot = path.join(generatorsRoot, 'init-infra');

  // Copy shared scripts directory
  const scriptsDir = path.join(templateRoot, 'scripts');
  await copyScriptFiles(scriptsDir, path.join(cwd, 'infra', 'scripts'));

  // Copy provider-specific files
  if (provider === 'terraform') {
    const tfDir = path.join(templateRoot, 'terraform');
    await copyTemplateDir({
      templateRoot: tfDir,
      relativeDir: '.',
      outputDir: path.join(cwd, 'infra', 'terraform'),
      vars,
    });

    // Create terraform wrapper
    const tfWrapperSrc = path.join(templateRoot, 'scripts', 'terraform.sh');
    const tfWrapperDst = path.join(cwd, 'infra', 'scripts', 'terraform.sh');
    await fs.copyFile(tfWrapperSrc, tfWrapperDst);
  } else if (provider === 'cdk') {
    const cdkDir = path.join(templateRoot, 'cdk');
    await copyTemplateDir({
      templateRoot: cdkDir,
      relativeDir: '.',
      outputDir: path.join(cwd, 'infra', 'cdk'),
      vars,
    });

    // Rename stack file from __PROJECT_NAME_PASCAL__-stack.ts to actual name
    const oldStackPath = path.join(cwd, 'infra', 'cdk', 'lib', '__PROJECT_NAME_PASCAL__-stack.ts');
    const newStackPath = path.join(cwd, 'infra', 'cdk', 'lib', `${context.projectNamePascal}-stack.ts`);
    try {
      await fs.rename(oldStackPath, newStackPath);
    } catch {
      // File might already exist from previous run or different name, skip
    }

    // Create cdk wrapper
    const cdkWrapperSrc = path.join(templateRoot, 'scripts', 'cdk.sh');
    const cdkWrapperDst = path.join(cwd, 'infra', 'scripts', 'cdk.sh');
    await fs.copyFile(cdkWrapperSrc, cdkWrapperDst);
  }

  // Make all shell scripts executable
  await makeScriptsExecutable(path.join(cwd, 'infra', 'scripts'));

  // Update package.json with new scripts
  const pkgScripts = buildPackageJsonScripts(provider);
  await updatePackageJson(cwd, { scripts: pkgScripts });

  // Update .gitignore
  const gitignoreEntries = buildGitignoreEntries(provider);
  await appendGitignoreEntries(cwd, gitignoreEntries);

  // Update README
  const readmeSection = buildReadmeSection(provider);
  await updateReadme(cwd, readmeSection);

  // Write clearch config to track initialized infra provider
  await ensureClearchConfigDir(cwd);
  await fs.writeFile(clearchConfigPath, JSON.stringify({ infra: provider }, null, 2) + '\n', 'utf8');

  return { skipped: false };
}

async function copyScriptFiles(srcDir: string, dstDir: string): Promise<void> {
  await fs.mkdir(dstDir, { recursive: true });
  const files = await fs.readdir(srcDir);
  for (const file of files) {
    const src = path.join(srcDir, file);
    const dst = path.join(dstDir, file);
    const stat = await fs.stat(src);
    if (stat.isFile()) {
      await fs.copyFile(src, dst);
    }
  }
}

async function makeScriptsExecutable(dir: string): Promise<void> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (file.endsWith('.sh')) {
      const filePath = path.join(dir, file);
      await fs.chmod(filePath, 0o755);
    }
  }
}

function buildPackageJsonScripts(provider: InfraProvider): Record<string, string> {
  const commonScripts = {
    'aws:login': 'bash infra/scripts/aws-login.sh',
  };

  if (provider === 'terraform') {
    return {
      ...commonScripts,
      'infra:fmt': 'bash infra/scripts/terraform.sh fmt -recursive',
      'infra:init': 'bash infra/scripts/terraform.sh init',
      'infra:plan': 'bash infra/scripts/terraform.sh plan',
      'infra:apply': 'bash infra/scripts/terraform.sh apply',
      'infra:destroy': 'bash infra/scripts/terraform.sh destroy',
    };
  } else {
    return {
      ...commonScripts,
      'infra:bootstrap': 'bash infra/scripts/cdk.sh bootstrap',
      'infra:synth': 'bash infra/scripts/cdk.sh synth',
      'infra:deploy': 'bash infra/scripts/cdk.sh deploy',
      'infra:destroy': 'bash infra/scripts/cdk.sh destroy',
    };
  }
}

function buildGitignoreEntries(provider: InfraProvider): string[] {
  const commonEntries = ['infra/.aws-runtime.env'];

  if (provider === 'terraform') {
    return [
      ...commonEntries,
      'infra/terraform/.terraform/',
      'infra/terraform/.terraform.lock.hcl',
      'infra/terraform/terraform.tfstate',
      'infra/terraform/terraform.tfstate.backup',
      'infra/terraform/*.tfplan',
    ];
  } else {
    return [...commonEntries, 'infra/cdk/cdk.out/', 'infra/cdk/node_modules/'];
  }
}

async function appendGitignoreEntries(cwd: string, entries: string[]): Promise<void> {
  const gitignorePath = path.join(cwd, '.gitignore');
  let existing = '';
  try {
    existing = await fs.readFile(gitignorePath, 'utf8');
  } catch {
    // File doesn't exist yet
  }

  const missing = entries.filter((e) => !existing.includes(e));
  if (missing.length === 0) {
    return;
  }

  const newContent = existing.trimEnd() + '\n\n' + missing.join('\n') + '\n';
  await fs.writeFile(gitignorePath, newContent, 'utf8');
}

function buildReadmeSection(provider: InfraProvider): string {
  if (provider === 'terraform') {
    return `## Infrastructure (Terraform)

This project uses **Terraform** for infrastructure-as-code (IaC). All AWS resources are defined in the \`infra/terraform/\` directory.

### Prerequisites

- Terraform >= 1.0: https://developer.hashicorp.com/terraform/install
- AWS CLI: https://aws.amazon.com/cli/
- AWS credentials configured

### AWS Login & Credentials

Log in to AWS using the AWS SSO login flow:

\`\`\`bash
npm run aws:login
\`\`\`

This command:
- Opens your browser for AWS SSO authentication
- Exports credentials to \`infra/.aws-runtime.env\` (repo-local, gitignored)
- Validates credentials with \`aws sts get-caller-identity\`

Credentials are automatically sourced when you run infra commands.

### Terraform Workflow

\`\`\`bash
npm run infra:init      # Initialize Terraform
npm run infra:plan      # Plan infrastructure changes
npm run infra:apply     # Apply infrastructure changes
npm run infra:destroy   # Destroy infrastructure
npm run infra:fmt       # Format .tf files
\`\`\`

### Project Structure

\`\`\`
infra/
  terraform/
    main.tf             # Your AWS resources
    variables.tf        # Input variables
    outputs.tf          # Output values
    versions.tf         # Terraform version & provider constraints
    providers.tf        # AWS provider configuration
  scripts/
    aws-login.sh        # AWS SSO login script
    load-aws-env.sh     # Helper to source .aws-runtime.env
    terraform.sh        # Wrapper to load credentials + run terraform
  .aws-runtime.env      # Generated by \`npm run aws:login\` (gitignored)
\`\`\`
`;
  } else {
    return `## Infrastructure (AWS CDK)

This project uses **AWS CDK** for infrastructure-as-code (IaC). All AWS resources are defined in the \`infra/cdk/\` directory.

### Prerequisites

- Node.js >= 18: https://nodejs.org/
- AWS CLI: https://aws.amazon.com/cli/
- AWS credentials configured
- Run \`npm install\` in \`infra/cdk/\` before first deploy

### AWS Login & Credentials

Log in to AWS using the AWS SSO login flow:

\`\`\`bash
npm run aws:login
\`\`\`

This command:
- Opens your browser for AWS SSO authentication
- Exports credentials to \`infra/.aws-runtime.env\` (repo-local, gitignored)
- Validates credentials with \`aws sts get-caller-identity\`

Credentials are automatically sourced when you run infra commands.

### CDK Workflow

\`\`\`bash
# First-time setup (one-time per AWS account)
npm run infra:bootstrap

# Deployment
npm run infra:synth     # Synthesize CloudFormation template
npm run infra:deploy    # Deploy to AWS
npm run infra:destroy   # Destroy resources
\`\`\`

### Project Structure

\`\`\`
infra/
  cdk/
    bin/
      app.ts              # CDK app entry point
    lib/
      *-stack.ts          # Your stacks
    package.json          # CDK dependencies
    tsconfig.json         # TypeScript config
    cdk.json              # CDK configuration
  scripts/
    aws-login.sh          # AWS SSO login script
    load-aws-env.sh       # Helper to source .aws-runtime.env
    cdk.sh                # Wrapper to load credentials + run cdk
  .aws-runtime.env        # Generated by \`npm run aws:login\` (gitignored)
\`\`\`

### Development

To add new resources:

1. Edit \`infra/cdk/lib/<stack-name>.ts\`
2. Run \`npm run infra:synth\` to check for errors
3. Run \`npm run infra:deploy\` to deploy changes
`;
  }
}

async function updateReadme(cwd: string, section: string): Promise<void> {
  const readmePath = path.join(cwd, 'README.md');
  let readme = '';
  try {
    readme = await fs.readFile(readmePath, 'utf8');
  } catch {
    return; // README doesn't exist, skip
  }

  const marker = '<!-- CLEARCH_INFRA_SECTION -->';
  const updated = appendReadmeSection(readme, marker, marker + '\n' + section);
  await fs.writeFile(readmePath, updated, 'utf8');
}

async function ensureClearchConfigDir(cwd: string): Promise<void> {
  const configDir = path.join(cwd, '.clearch');
  await fs.mkdir(configDir, { recursive: true });
}
