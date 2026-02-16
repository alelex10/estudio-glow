import { SlidersHorizontal } from "lucide-react";
import { Button } from "./Button";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface Props {
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  text: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Popover({ setIsOpen, isOpen, text, children, className }: Props) {
  return (
    <div className="relative">
      <Button
        className={clsx(className)}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
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
      {isOpen && children}
    </div>
  );
}
