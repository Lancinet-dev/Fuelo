// ================================================
// FUELO — Logo Component Premium
// Usage : <FueloLogo size={36} />
// ================================================

export const LOGO_URL = 'https://res.cloudinary.com/de0xeqpj9/image/upload/e_background_removal/v1780821117/Capture_vh0qaw.png'

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
