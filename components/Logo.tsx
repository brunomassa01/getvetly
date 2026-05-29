// Logo oficial da Vetly — SVG inline (paths extraídos do logo.svg oficial).
// viewBox e paths são a fonte da verdade (design/logo/vetly-logo-official.svg).
// Variantes: "default" (lime + ink), "inverted" (lime + paper, p/ fundos escuros).

type LogoVariant = "default" | "inverted";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  title?: string;
}

const CHECK = "#C8FF02";

export function Logo({
  variant = "default",
  className,
  title = "Vetly",
}: LogoProps) {
  const wordmark = variant === "inverted" ? "#FAFAF7" : "#1E1E1E";

  return (
    <svg
      viewBox="0 0 761.7 327.8"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        fill={CHECK}
        d="M197.1,157.8l4.4-4.3,6-5.9,6.8-6.8,8-7.7,7.6-7.4,15.8-15.9,10.6-10.5,6.5-6.2,7.2-7.2,7.1-7.1,12.5-12.3,8-7.9,9.1-8.4c4.3-4,14-4.1,18.9.3,10.3,9.3,19.5,18.5,29.2,28.7,4.6,4.8,5.6,14.9.4,20.1l-180.5,178c-5.3,5.3-15.8,3.7-20.5-.9l-81.5-80.3c-5-4.9-6.5-14.4-1.5-20.1,9.3-10.4,19.4-19.7,29.7-29.6,5.2-5,15.2-5.1,20.7.3l41.8,40.7c2.1,2.1,4.5-.9,5.7-2.1l19.7-19.5,8.2-7.9Z"
      />
      <polygon
        fill={wordmark}
        points="311.5 217.1 311.2 236.9 373.4 237 373.3 264.1 281.4 264.1 281.3 184.2 300.6 164.8 323.4 141.7 373.3 141.7 373.3 169.2 311.3 169.2 311.3 189.3 361.2 189.4 361.2 217.1 311.5 217.1"
      />
      <path
        fill={wordmark}
        d="M693.3,175c0,9.5-5,17.9-9.3,25.5l-4.8,5.1c-6.2,6.6-14.7,10.2-23.7,12.8v45.7s-29.9,0-29.9,0v-45.4c-23.9-5.8-38-23.3-39.1-47.5l-.2-29.4h30.2c0-.1.2,30.4.2,30.4,0,5,2.6,9.4,5.5,13.1,4.5,5.7,10.9,6.9,18,7.2,10,.3,20-4.3,22.2-14.6l1.2-5.7v-30.5c.1,0,29.9,0,29.9,0v33.3Z"
      />
      <polygon
        fill={wordmark}
        points="420.6 264.1 420.7 216.8 420.5 192.3 420.3 169.2 383.9 169.1 384.1 141.7 487.1 141.7 487 169.2 450.6 168.9 450.6 263.9 420.6 264.1"
      />
      <polygon
        fill={wordmark}
        points="595.4 237 595.4 264.1 502.9 264.1 502.9 141.7 533.4 141.9 533.4 236.9 595.4 237"
      />
    </svg>
  );
}
