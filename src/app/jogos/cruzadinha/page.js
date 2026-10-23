import Cruzadinha from "../../../component/Cruzadinha/Cruzadinha";

export const metadata = {
  title: "Cruzadinha | Gruta",
  description: "Jogue Palavras Cruzadas com 17 temas diferentes e 3 níveis de dificuldade.",
};

export default function CruzadinhaPage() {
  return (
    <main style={{ backgroundColor: "#020812", minHeight: "100vh", paddingTop: "20px" }}>
      <Cruzadinha />
    </main>
  );
}
