import { redirect } from "next/navigation"

export const metadata = {
  title: "lum.tools Blog",
  description: "Insights, research and updates from the lum.tools platform.",
}

export default function RootRedirect() {
  // This component should not be reached in production as middleware handles the redirect
  redirect("/en")
}
