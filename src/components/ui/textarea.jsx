import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[60px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-[#1D2433] transition-all duration-150 placeholder:text-[#C4C9D2] focus-visible:outline-none focus-visible:border-[#0B6ACB] focus-visible:ring-2 focus-visible:ring-[#0B6ACB]/10 disabled:cursor-not-allowed disabled:opacity-40 resize-none",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
