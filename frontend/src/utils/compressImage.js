// ================================================
// FUELO — Compression photo avant upload
// ================================================
// Une photo prise avec la caméra d'un téléphone pèse 5-12 Mo (voire plus sur
// les capteurs 48 Mpx). Or :
//   • le serveur refuse au-delà de 8 Mo → erreur "Photo trop volumineuse"
//   • sur réseau mobile lent (Afrique de l'Ouest), l'upload expire souvent
//   • les iPhones produisent du HEIC parfois mal géré par Cloudinary
// On redimensionne donc à 1600px max et on ré-encode en JPEG qualité 0.7 :
// typiquement 200-500 Ko, upload 10-20x plus rapide, format normalisé.
// En cas d'échec (format exotique non décodable, pas de canvas…), on renvoie
// le fichier d'origine pour ne JAMAIS bloquer la prise de photo.

const MAX_DIMENSION = 1600
const QUALITY       = 0.7

export async function compressImage(file) {
  // Pas un fichier image → on ne touche à rien
  if (!file || !file.type || !file.type.startsWith('image/')) return file

  try {
    const dataUrl = await readAsDataURL(file)
    const img     = await loadImage(dataUrl)

    let { width, height } = img
    if (!width || !height) return file

    // Redimensionnement proportionnel si une dimension dépasse le max
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round(height * (MAX_DIMENSION / width))
        width  = MAX_DIMENSION
      } else {
        width  = Math.round(width * (MAX_DIMENSION / height))
        height = MAX_DIMENSION
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )

    // Compression inefficace (image déjà minuscule) → on garde l'original
    if (!blob || blob.size >= file.size) return file

    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    // Décodage impossible (ex: HEIC sur navigateur non-Safari) → original
    return file
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
