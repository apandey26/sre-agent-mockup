import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#0B6ACB]/8 text-[#0B6ACB]",
        secondary: "bg-gray-100 text-[#6B7280]",
        destructive: "bg-[#FF4D4D]/8 text-[#DC2626]",
        good: "bg-[#00D4A0]/8 text-[#059669]",
        warning: "bg-[#F5A623]/8 text-[#B45309]",
        purple: "bg-[#9333EA]/8 text-[#7C3AED]",
        outline: "border border-gray-200 text-[#6B7280] bg-transparent",
        p1: "bg-red-50 text-[#DC2626] font-semibold",
        p2: "bg-amber-50 text-[#B45309] font-semibold",
        p3: "bg-blue-50 text-[#0B6ACB] font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
