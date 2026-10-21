import Termo from "../../../component/Termo/Termo";

export const metadata = {
  title: "Termo | Gruta",
  description: "Descubra a palavra do dia no Termo da Gruta em 6 tentativas.",
};

export default function TermoPage() {
  return (
    <main style={{ backgroundColor: "#020812", minHeight: "100vh", paddingTop: "20px" }}>
      <Termo />
    </main>
  );
}