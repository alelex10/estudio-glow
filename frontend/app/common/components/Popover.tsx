import { Button } from "./button/Button";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface Props {
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  text: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Popover({ setIsOpen, isOpen, text, children, className }: Props) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        className={clsx(className)}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        {text}
        <ChevronDown
          size={18}
          className={clsx(
            "transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>
      {isOpen && (
        <div id={id} role="dialog" aria-label={text}>
          {children}
        </div>
      )}
    </div>
  );
}
