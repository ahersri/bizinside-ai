const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

// Read all model files
fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace UUID with INTEGER
    content = content.replace(
      /id:\s*{[^}]*type:\s*DataTypes\.UUID[^}]*}/s,
      `id: {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true
}`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${file}`);
  });

console.log('🎉 All models updated to use INTEGER IDs');