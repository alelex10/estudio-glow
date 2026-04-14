import { MenuIcon } from "lucide-react";

interface MobileMenuButtonProps {
  onClick: () => void;
}

export default function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      className="md:hidden text-white hover:text-primary-100 transition-colors"
      onClick={onClick}
      aria-label="Open menu"
    >
      <MenuIcon size={30} />
    </button>
  );
}
