// ================================================
// FUELO — Logo Component Premium
// Usage : <FueloLogo size={36} />
// ================================================

// f_auto,q_auto → format moderne (WebP/AVIF) + qualité auto = image bien plus légère sur 3G
export const LOGO_URL = 'https://res.cloudinary.com/de0xeqpj9/image/upload/f_auto,q_auto,e_background_removal/v1780821117/Capture_vh0qaw.png'

const FueloLogo = ({ size = 40, className = '' }) => (
  <img
    src={LOGO_URL}
    alt="Fuelo"
    width={size}
    height={size}
    style={{ objectFit: 'contain' }}
    className={className}
  />
)

export default FueloLogo
