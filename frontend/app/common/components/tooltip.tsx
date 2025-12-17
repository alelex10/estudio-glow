import clsx from "clsx";

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    text: string;
    position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ children, text, position = "bottom", ...props }: TooltipProps) {
    const positions = {
        top: "bottom-full",
        bottom: "top-full",
        left: "right-full",
        right: "left-full",
    }
    return (
        <div {...props} className="relative group w-full h-full">
            {children}
            <div className={clsx("absolute left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10",
                positions[position])}>
                {text}
            </div>
        </div>
    );
}