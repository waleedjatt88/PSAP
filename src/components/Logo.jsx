import logoImg from "../assets/passpoint-logo.jpeg";

// `withText`:
//   true  → full official lockup (icon + "PassPoint" wordmark from the JPEG).
//   false → icon-only (the JPEG cropped via object-position to hide the wordmark).
// `size` controls icon height in pixels (the lockup is wider).
export default function Logo({ size = 36, withText = true, className = "" }) {
  if (withText) {
    // The official artwork is a wide image: icon + wordmark below. We render
    // it as a single image and let height drive the size.
    return (
      <img
        src={logoImg}
        alt="PassPoint"
        className={`select-none ${className}`}
        style={{ height: size * 1.4, width: "auto", objectFit: "contain" }}
        draggable={false}
      />
    );
  }

  // Icon-only — crop the top portion of the artwork.
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: size, width: size }}
    >
      <img
        src={logoImg}
        alt="PassPoint"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center 30%", transform: "scale(1.5)" }}
        draggable={false}
      />
    </div>
  );
}
