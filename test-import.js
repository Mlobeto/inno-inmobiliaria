const fs = require('fs');
const path = require('path');

async function testImport() {
  console.log('🚀 Probando importación de clientes...\n');

  const filePath = path.join(__dirname, 'clientes_a_importar.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Crear FormData manualmente
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
  const formData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="clientes_a_importar.csv"',
    'Content-Type: text/csv',
    '',
    fileContent,
    `--${boundary}--`
  ].join('\r\n');

  try {
    const response = await fetch('http://localhost:3001/api/import/clients', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: formData
    });

    const result = await response.json();

    console.log('✅ Resultado de la importación:\n');
    console.log(JSON.stringify(result, null, 2));

    if (result.results) {
      console.log('\n📊 Resumen:');
      console.log(`Total: ${result.results.summary.total}`);
      console.log(`Procesados: ${result.results.summary.processed}`);
      console.log(`Fallidos: ${result.results.summary.failed}`);

      if (result.results.errors.length > 0) {
        console.log('\n❌ Errores encontrados:');
        result.results.errors.forEach(error => {
          console.log(`  Fila ${error.row}: ${error.errors.join(', ')}`);
        });
      }

      if (result.results.success.length > 0) {
        console.log('\n✅ Clientes importados exitosamente:');
        result.results.success.forEach(success => {
          console.log(`  ${success.client.name} (${success.client.cuil})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImport();
