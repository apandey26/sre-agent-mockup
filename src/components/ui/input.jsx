import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-[#1D2433] transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#C4C9D2] focus-visible:outline-none focus-visible:border-[#0B6ACB] focus-visible:ring-2 focus-visible:ring-[#0B6ACB]/10 disabled:cursor-not-allowed disabled:opacity-40",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
