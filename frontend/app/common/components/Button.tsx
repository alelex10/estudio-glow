import clsx from "clsx"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    className?: string
    variant?: "primary" | "secondary" | "outline" | "gold"
    size?: "lg" | "md" | "sm" | "none"
    rounded?: "full" | "medium" | "none"
}

export const Button = ({ children, className, variant = "primary", size = "md", rounded = "medium", ...props }: ButtonProps) => {
    const variants = {
        primary: "bg-white text-primary-900 hover:bg-primary-100",
        secondary: "bg-primary-100 text-primary-900 hover:bg-primary-200",
        outline: clsx("bg-transparent text-primary-900  hover:text-primary-700 hover:border-primary-700",
            "border border-primary-500 hover:border-primary-700 transition-colors hover:bg-primary-100",
        ),
        gold: clsx("bg-linear-to-bl",
            "from-primary-500 via-primary-200 to-primary-500",
            "hover:from-primary-300 hover:via-primary-100 hover:to-primary-300"),
    }
    const sizes = {
        none: "",
        lg: "py-3 px-6 text-lg",
        md: "py-2 px-4 text-base",
        sm: "py-1 px-2 text-sm",
    }
    const roundedBtn = {
        full: "rounded-full",
        medium: "rounded-sm",
        none: "rounded-none",
    }

    return (
        <button {...props} className={clsx("w-full text-primary-900 font-medium hover:cursor-pointer transition-colors",
            roundedBtn[rounded],
            variants[variant],
            sizes[size],
            "active:scale-95",
            "flex items-center gap-2 justify-center",
            className)}>{children}</button>
    )
}
