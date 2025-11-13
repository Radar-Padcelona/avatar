const fs = require('fs');
const path = require('path');

// Lee el index.html
const indexPath = path.join(__dirname, 'build', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Crea un directorio para /control
const controlDir = path.join(__dirname, 'build', 'control');
if (!fs.existsSync(controlDir)) {
  fs.mkdirSync(controlDir, { recursive: true });
}

// Copia index.html a /control/index.html
fs.writeFileSync(path.join(controlDir, 'index.html'), indexContent);

console.log('✅ Rutas creadas correctamente');
