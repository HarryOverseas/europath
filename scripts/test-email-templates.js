import { listTemplates, renderTemplate, getTemplate } from '../server/services/templateEngine.js';

console.log('====================================================');
console.log('     HARRY OVERSEAS EMAIL TEMPLATE SUITE VERIFICATION');
console.log('====================================================');

const templates = listTemplates();
console.log(`Discovered ${templates.length} email templates in catalog:\n`);

let allPassed = true;

for (const t of templates) {
  const tplDef = getTemplate(t.id);
  const personalizedInput = {
    ...t.sampleData,
    fullName: 'Ananya Deshmukh',
    phone: '+91 9820123456',
    email: 'ananya.deshmukh@example.com'
  };

  try {
    const rendered = renderTemplate(t.id, personalizedInput);

    // Check for unresolved double curly braces
    const strayPlaceholders = (rendered.html.match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g) || []).concat(
      rendered.subject.match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g) || []
    );

    if (strayPlaceholders.length > 0) {
      console.warn(`  ⚠️  Template '${t.id}' has un-interpolated placeholders:`, strayPlaceholders);
      allPassed = false;
    } else {
      console.log(`  ✅ [${t.category.toUpperCase()}] ${t.id}`);
      console.log(`     Subject: "${rendered.subject}"`);
      console.log(`     Target:  ${rendered.targetInbox}`);
      console.log(`     HTML Size: ${rendered.html.length} bytes | Text Size: ${rendered.text.length} bytes\n`);
    }
  } catch (err) {
    console.error(`  ❌ Failed rendering template '${t.id}':`, err.message);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 ALL EMAIL TEMPLATES VERIFIED SUCCESSFULLY WITH ZERO UNRESOLVED PLACEHOLDERS!');
} else {
  console.error('❌ Some templates had issues.');
  process.exit(1);
}
