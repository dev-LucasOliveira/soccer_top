import { redirect } from "next/navigation";

export default function ImpostorHomePage() {
  redirect("/?mode=impostor");
}
