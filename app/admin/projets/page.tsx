import { redirect } from "next/navigation";

// Ancienne page en doublon avec /admin : on redirige simplement.
export default function ProjetsRedirect() {
  redirect("/admin");
}
