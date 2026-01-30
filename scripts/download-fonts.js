const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  {
    url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Regular.ttf',
    dest: path.join(fontsDir, 'Kanit-Regular.ttf')
  },
  {
    url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Bold.ttf',
    dest: path.join(fontsDir, 'Kanit-Bold.ttf')
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(dest)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function downloadAllFonts() {
  console.log('Downloading Kanit fonts...');
  
  for (const font of fonts) {
    await downloadFile(font.url, font.dest);
  }
  
  console.log('All fonts downloaded successfully!');
}

downloadAllFonts().catch(err => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
});
