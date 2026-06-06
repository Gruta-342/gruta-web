import About from "../../component/About/About";

// Você pode até ter um SEO específico para cada página!
export const metadata = {
  title: "Sobre a Gruta",
  description: "Conheça os membros e o caos da Gruta Game House.",
};

export default function SobrePage() {
  return <About />;
}