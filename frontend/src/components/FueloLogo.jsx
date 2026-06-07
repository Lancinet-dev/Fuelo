// ================================================
// FUELO — Logo Component Premium
// Usage : <FueloLogo size={36} />
// ================================================

const FueloLogo = ({ size = 40, className = '' }) => (
  <img
    src="https://res.cloudinary.com/de0xeqpj9/image/upload/v1780821117/Capture_vh0qaw.png"
    alt="Fuelo"
    width={size}
    height={size}
    style={{ objectFit: 'contain' }}
    className={className}
  />
)

export default FueloLogo
