const fs = require('fs');
const path = require('path');
const { compile } = require('tailwindcss');

async function run() {
  const inputCss = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');
  console.log('Read globals.css, length:', inputCss.length);
  
  // Find all class names in kitchen.tsx
  const kitchenCode = fs.readFileSync(path.join(__dirname, '../app/kitchen.tsx'), 'utf8');
  const pageCode = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');
  const layoutCode = fs.readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8');

  const candidates = new Set();
  const regex = /["'`\s]([a-zA-Z0-9_\-\:\[\]\/\#\.\%\(\)]+)["'`\s]/g;
  for (const text of [kitchenCode, pageCode, layoutCode]) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      candidates.add(match[1]);
    }
  }

  console.log('Candidates count:', candidates.size);

  const compiler = await compile(inputCss, { base: path.join(__dirname, '..') });
  const outputCss = compiler.build(Array.from(candidates));
  console.log('Compiled output CSS length:', outputCss.length);
  fs.writeFileSync(path.join(__dirname, '../app/compiled-tailwind.css'), outputCss);
  console.log('Successfully wrote compiled-tailwind.css');
}

run().catch(console.error);
