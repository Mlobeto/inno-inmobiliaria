const Logo = ({ color = '#6b8f7a', size = 120 }) => (
  <svg
    viewBox="0 0 200 120"
    width={size}
    height={size * 0.6}
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo"
    role="img"
  >
    <path d="M40 90 V40 Q40 35 45 35 H55 Q60 35 60 40 V90 Z"/>
    <path d="M80 90 V20 Q80 15 85 15 H95 Q100 15 100 20 V90 Z"/>
    <path d="M120 90 V50 Q120 45 125 45 H135 Q140 45 140 50 V90 Z"/>
    <path d="M20 95 Q100 115 180 80 Q100 130 20 95 Z"/>
  </svg>
);

export default Logo;
