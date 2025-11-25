import clsx from "clsx"

interface ButtonProps {
    children: React.ReactNode
    className?: string
    variant?: "primary" | "secondary" | "outline" | "gold"
}

export const Button = ({ children, className, variant = "primary" }: ButtonProps) => {
    const variants = {
        primary: "bg-primary-900 text-primary-100 hover:bg-primary-800",
        secondary: "bg-primary-100 text-primary-900 hover:bg-primary-200",
        outline: "bg-transparent text-primary-900 border border-primary-900 hover:bg-primary-100 hover:text-primary-700 hover:border-primary-700",
        gold: clsx("bg-linear-to-bl",
            "from-primary-900 via-primary-200 to-primary-900",
            "hover:from-primary-800 hover:via-primary-100 hover:to-primary-800"),
    }

    return (
        <button className={clsx("w-full py-3 px-6 rounded-full text-lg text-black font-medium hover:cursor-pointer transition-colors",
            variants[variant],
            className)}>{children}</button>
    )
}
