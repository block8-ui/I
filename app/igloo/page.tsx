import type { Metadata } from "next";
import Experience from "../components/Experience";

export const metadata: Metadata = {
  title: { absolute: "Floe — Arctic build studio" },
  description: "A community studio. Scroll to build the shelter.",
};

export default function IglooPage() {
  return <Experience />;
}
