const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'corelab.db');
const db = new Database(dbPath);

console.log('--- Product Image Cleaning Script ---');

const products = db.prepare('SELECT id, name, image_url, images FROM products').all();
let updatedCount = 0;

products.forEach(p => {
  let needsUpdate = false;
  let newImageUrl = p.image_url;
  let newImagesString = p.images;

  // 1. Clean image_url if it's ibb.co
  if (p.image_url && p.image_url.includes('ibb.co')) {
    console.log(`Product #${p.id} (${p.name}): Removing invalid main image URL: ${p.image_url}`);
    newImageUrl = null;
    needsUpdate = true;
  }

  // 2. Clean images array
  try {
    const imagesArr = JSON.parse(p.images || '[]');
    if (Array.isArray(imagesArr)) {
      const cleanedArr = imagesArr.filter(url => url && !url.includes('ibb.co'));
      if (cleanedArr.length !== imagesArr.length) {
        console.log(`Product #${p.id} (${p.name}): Cleaned gallery (before: ${imagesArr.length}, after: ${cleanedArr.length})`);
        newImagesString = JSON.stringify(cleanedArr);
        needsUpdate = true;
      }
    } else {
      // images field is not an array, reset to []
      console.log(`Product #${p.id} (${p.name}): Resetting malformed images string to []`);
      newImagesString = '[]';
      needsUpdate = true;
    }
  } catch (e) {
    console.log(`Product #${p.id} (${p.name}): Error parsing images field, resetting to []`);
    newImagesString = '[]';
    needsUpdate = true;
  }

  if (needsUpdate) {
    db.prepare('UPDATE products SET image_url = ?, images = ? WHERE id = ?')
      .run(newImageUrl, newImagesString, p.id);
    updatedCount++;
  }
});

console.log(`\nFinished! Updated ${updatedCount} products.`);
db.close();
