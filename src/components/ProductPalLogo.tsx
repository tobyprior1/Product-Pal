import type { ComponentProps } from "react"
import { useTheme } from "next-themes"
import logo from "@/assets/product-pal-logo.png"
import logoLight from "@/assets/product-pal-logo-light.png"

export function ProductPalLogo(props: Omit<ComponentProps<"img">, "src" | "alt">) {
  const { resolvedTheme } = useTheme()

  return (
    <img
      width={882}
      height={177}
      {...props}
      src={resolvedTheme === "dark" ? logoLight : logo}
      alt="Product Pal"
    />
  )
}