import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router";

export interface WhatsAppButtonProps {
  /** WhatsApp number (international digits, no `+`). Falls back to VITE_WHATSAPP_PHONE */
  phoneNumber?: string;
  /** Pre-filled message text. Falls back to VITE_WHATSAPP_MESSAGE, then hardcoded default */
  defaultMessage?: string;
  /** Whether to show the CTA label on desktop (default: true) */
  showLabel?: boolean;
  /** Screen corner for fixed positioning (default: "bottom-right") */
  position?: "bottom-right" | "bottom-left";
  /** Visual shape: round (icon-only by default) or pill (with label) (default: "round") */
  variant?: "round" | "pill";
  /** Alternate message for business hours; takes priority over defaultMessage when set */
  businessHoursMessage?: string;
  /** Accessible label override (default: "Hablar por WhatsApp") */
  ariaLabel?: string;
}

export function WhatsAppButton({
  phoneNumber,
  defaultMessage,
  showLabel = true,
  position = "bottom-right",
  variant = "round",
  businessHoursMessage,
  ariaLabel = "Hablar por WhatsApp",
}: WhatsAppButtonProps) {
  const location = useLocation();

  const phone = phoneNumber ?? import.meta.env.VITE_WHATSAPP_PHONE;
  if (!phone) return null;

  // Don't render on admin routes
  if (location.pathname.startsWith("/admin")) return null;

  const message =
    businessHoursMessage ??
    defaultMessage ??
    import.meta.env.VITE_WHATSAPP_MESSAGE ??
    "Hola, quiero consultar sobre sus servicios.";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const positionClasses =
    position === "bottom-left" ? "bottom-4 left-4" : "bottom-4 right-4";

  const sizeClasses = variant === "pill" ? "px-5 py-3" : "p-3.5";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`fixed ${positionClasses} z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 animate-whatsapp-enter ${sizeClasses}`}
    >
      <MessageCircle className="h-6 w-6" />
      {showLabel && (
        <span
          className={`text-sm font-medium pr-1 ${
            variant === "pill" ? "" : "hidden md:inline"
          }`}
        >
          {ariaLabel}
        </span>
      )}
    </a>
  );
}
