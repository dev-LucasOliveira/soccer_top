import { redirect } from "next/navigation";

export default function SoloSetupPage() {
  redirect("/?mode=lista-secreta");
}
