import Dados from "../../../component/Dados/Dados";

export const metadata = {
  title: "Dados | Gruta",
  description: "Faça sua rolagem de dados e teste sua sorte na Gruta.",
};

export default function DadosPage() {
  return (
    <main style={{ backgroundColor: "#020812", minHeight: "100dvh" }}>
      <Dados />
    </main>
  );
}