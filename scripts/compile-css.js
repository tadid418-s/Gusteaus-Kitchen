const fs = require('fs');
const path = require('path');
const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');

async function run() {
  const inputPath = path.join(__dirname, '../app/tailwind-input.css');
  const outputPath = path.join(__dirname, '../app/globals.css');
  const inputCss = fs.readFileSync(inputPath, 'utf8');

  const compiler = await compile(inputCss, {
    from: inputPath,
    base: path.join(__dirname, '..'),
    shouldRewriteUrls: true,
    onDependency: () => {},
  });

  const sources = [
    { base: path.join(__dirname, '../app'), pattern: '**/*.{ts,tsx,js,jsx}', negated: false },
  ];

  const componentsDir = path.join(__dirname, '../components');
  if (fs.existsSync(componentsDir)) {
    sources.push({ base: componentsDir, pattern: '**/*.{ts,tsx,js,jsx}', negated: false });
  }

  const scanner = new Scanner({ sources });
  const candidates = scanner.scan();
  console.log('Scanned candidates count:', candidates.length);

  const outputCss = compiler.build(candidates);
  console.log('Output CSS generated! Size in bytes:', Buffer.byteLength(outputCss, 'utf8'));

  fs.writeFileSync(outputPath, outputCss);
  console.log('SUCCESS! Precompiled Tailwind CSS directly into app/globals.css');
}

run().catch(console.error);
