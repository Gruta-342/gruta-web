import Termo from "../../../component/Termo/Termo";

export const metadata = {
  title: "Termo | Gruta",
  description: "Descubra a palavra do dia no Termo da Gruta em 6 tentativas.",
};

export default function TermoPage() {
  return (
    <div style={{ 
      backgroundColor: "#020812", 
      width: "100vw",
      height: "100dvh", 
      overflow: "hidden", 
      position: "fixed", 
      top: 0, 
      left: 0,
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <Termo />
    </div>
  );
}