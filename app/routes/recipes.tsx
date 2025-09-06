import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function loader({}: LoaderFunctionArgs) {
  // Consolidated: this route now lives at /projects
  return redirect("/projects");
}

export default function Recipes() {
  return null;
}

