import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6ACB]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#0B6ACB] text-white shadow-sm hover:bg-[#0A5EB8] hover:shadow",
        destructive: "bg-[#FF4D4D] text-white shadow-sm hover:bg-[#E63E3E] hover:shadow",
        outline: "border border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50 hover:text-[#1D2433] hover:border-gray-300",
        secondary: "bg-gray-100 text-[#4B5563] hover:bg-gray-200 hover:text-[#1D2433]",
        ghost: "text-[#6B7280] hover:text-[#1D2433] hover:bg-gray-50",
        link: "text-[#0B6ACB] underline-offset-4 hover:underline",
        good: "bg-[#00D4A0]/10 text-[#059669] hover:bg-[#00D4A0]/20",
        warning: "bg-[#F5A623]/10 text-[#B45309] hover:bg-[#F5A623]/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-2.5 py-1 text-[11px]",
        lg: "h-11 px-6 py-3 text-[14px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }
