export function Badge({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-orange-100 text-orange-800 border-orange-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    outline: "text-gray-700 border-gray-300 bg-transparent",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
