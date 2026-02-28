/**
 * Image Compression Utility
 * Light compression to optimize storage while maintaining quality
 */

export const compressImage = async (file, maxSizeMB = 2, maxWidthOrHeight = 2560, quality = 0.85) => {
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return { file, compressed: false, originalSize: file.size, newSize: file.size };
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Only resize if image is too large
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = height * (maxWidthOrHeight / width);
            width = maxWidthOrHeight;
          } else {
            width = width * (maxWidthOrHeight / height);
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve({ 
              file: compressedFile, 
              compressed: blob.size < originalSize,
              originalSize,
              newSize: blob.size,
              savingsPercent: Math.round(((originalSize - blob.size) / originalSize) * 100)
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const compressMultipleImages = async (files, onProgress) => {
  const results = [];
  let totalOriginal = 0;
  let totalCompressed = 0;
  let compressedCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (file.type.startsWith('image/')) {
      console.log(`[COMPRESS] Image detected: ${file.name} (${file.type}, ${file.size} bytes)`);
      try {
        const result = await compressImage(file);
        results.push(result.file);
        totalOriginal += result.originalSize;
        totalCompressed += result.newSize;
        if (result.compressed) compressedCount++;
        console.log(`[COMPRESS] ✅ Image compressed: ${file.name} (${result.originalSize} → ${result.newSize})`);
      } catch (compressErr) {
        console.warn(`[COMPRESS] ⚠️ Compression failed for ${file.name}, using original:`, compressErr?.message);
        results.push(file);
        totalOriginal += file.size;
        totalCompressed += file.size;
      }
    } else {
      console.log(`[COMPRESS] Non-image, passing through: ${file.name} (${file.type}, ${file.size} bytes)`);
      results.push(file);
      totalOriginal += file.size;
      totalCompressed += file.size;
    }
    
    if (onProgress) {
      onProgress((i + 1) / files.length);
    }
  }
  
  return { 
    files: results,
    stats: {
      compressedCount,
      totalOriginal,
      totalCompressed,
      savingsPercent: totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0,
      savedMB: ((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(2)
    }
  };
};