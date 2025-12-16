/**
 * Script pour ouvrir la page de configuration des IPs autorisées Brevo
 * 
 * Ce script ouvre automatiquement la page Brevo avec la plage IP pré-remplie
 * dans le presse-papiers pour faciliter l'ajout.
 */

const plageIP = '2001:42d8:3205:5100::/64';
const urlBrevo = 'https://app.brevo.com/security/authorised_ips';

console.log('🔗 Ouverture de la page de configuration Brevo...');
console.log('');
console.log('📋 Plage IP à ajouter :', plageIP);
console.log('');
console.log('📝 Instructions :');
console.log('1. La plage IP a été copiée dans votre presse-papiers');
console.log('2. Collez-la dans le champ "Adresse IP" sur la page Brevo');
console.log('3. Cliquez sur "Ajouter" ou "Save"');
console.log('');
console.log('🌐 URL :', urlBrevo);

// Pour Node.js
if (typeof require !== 'undefined') {
  const { exec } = require('child_process');
  const os = require('os');
  
  // Copier dans le presse-papiers selon l'OS
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows - Utiliser PowerShell pour copier
    exec(`powershell -Command "Set-Clipboard -Value '${plageIP}'"`, (error) => {
      if (error) {
        // Fallback sur clip
        exec(`echo ${plageIP} | clip`, (error2) => {
          if (error2) {
            console.log('⚠️  Impossible de copier dans le presse-papiers automatiquement');
            console.log('📋 Copiez manuellement :', plageIP);
          } else {
            console.log('✅ Plage IP copiée dans le presse-papiers !');
          }
        });
      } else {
        console.log('✅ Plage IP copiée dans le presse-papiers !');
      }
    });
    
    // Ouvrir le navigateur
    exec(`start "" "${urlBrevo}"`, (error) => {
      if (error) {
        console.log('⚠️  Impossible d\'ouvrir le navigateur automatiquement');
        console.log('🌐 Ouvrez manuellement :', urlBrevo);
      } else {
        console.log('✅ Page ouverte dans votre navigateur !');
      }
    });
  } else if (platform === 'darwin') {
    // macOS
    exec(`echo "${plageIP}" | pbcopy`, (error) => {
      if (error) {
        console.log('⚠️  Impossible de copier dans le presse-papiers automatiquement');
        console.log('📋 Copiez manuellement :', plageIP);
      } else {
        console.log('✅ Plage IP copiée dans le presse-papiers !');
      }
    });
    
    exec(`open "${urlBrevo}"`, (error) => {
      if (error) {
        console.log('⚠️  Impossible d\'ouvrir le navigateur automatiquement');
        console.log('🌐 Ouvrez manuellement :', urlBrevo);
      } else {
        console.log('✅ Page ouverte dans votre navigateur !');
      }
    });
  } else {
    // Linux
    exec(`echo "${plageIP}" | xclip -selection clipboard`, (error) => {
      if (error) {
        console.log('⚠️  Impossible de copier dans le presse-papiers automatiquement');
        console.log('📋 Copiez manuellement :', plageIP);
      } else {
        console.log('✅ Plage IP copiée dans le presse-papiers !');
      }
    });
    
    exec(`xdg-open "${urlBrevo}"`, (error) => {
      if (error) {
        console.log('⚠️  Impossible d\'ouvrir le navigateur automatiquement');
        console.log('🌐 Ouvrez manuellement :', urlBrevo);
      } else {
        console.log('✅ Page ouverte dans votre navigateur !');
      }
    });
  }
}

// Ouvrir le navigateur (Node.js uniquement)
if (typeof require !== 'undefined') {
  const { exec } = require('child_process');
  const os = require('os');
  
  const platform = os.platform();
  let openCommand;
  
  if (platform === 'win32') {
    openCommand = `start ${urlBrevo}`;
  } else if (platform === 'darwin') {
    openCommand = `open ${urlBrevo}`;
  } else {
    openCommand = `xdg-open ${urlBrevo}`;
  }
  
  exec(openCommand, (error) => {
    if (error) {
      console.log('⚠️  Impossible d\'ouvrir le navigateur automatiquement');
      console.log('🌐 Ouvrez manuellement :', urlBrevo);
    } else {
      console.log('✅ Page ouverte dans votre navigateur !');
    }
  });
}

