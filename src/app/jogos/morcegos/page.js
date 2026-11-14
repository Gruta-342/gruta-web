import Morcegos from "../../../component/Morcegos/Morcegos";

export const metadata = {
  title: "Caça Morcegos | Gruta",
  description: "Encontre os morcegos escondidos nas regiões da Gruta usando lógica e dedução.",
};

export default function MorcegosPage() {
  return (
    <main style={{ backgroundColor: "#020812", minHeight: "100dvh" }}>
      <Morcegos />
    </main>
  );
}