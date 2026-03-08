const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  const appDir = context.appOutDir;

  const filesToRemove = [
    'dxcompiler.dll',
    'dxil.dll',
    'vk_swiftshader.dll',
    'vk_swiftshader_icd.json',
    'vulkan-1.dll',
    'LICENSES.chromium.html',
  ];

  for (const file of filesToRemove) {
    const filePath = path.join(appDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  Removed: ${file}`);
    }
  }

  const localesDir = path.join(appDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const keep = new Set(['en-US.pak']);
    const locales = fs.readdirSync(localesDir);
    let removed = 0;
    for (const locale of locales) {
      if (!keep.has(locale)) {
        fs.unlinkSync(path.join(localesDir, locale));
        removed++;
      }
    }
    console.log(`  Removed ${removed} unused locale files (kept en-US)`);
  }
};
