import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function loader({}: LoaderFunctionArgs) {
  // Make the app a one‑pager by landing on /projects
  return redirect("/projects");
}

export default function Index() {
  // This route redirects via loader
  return null;
}
