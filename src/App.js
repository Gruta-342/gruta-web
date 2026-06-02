import Header from "./component/Header/Header";
import HeroSlider from "./component/HeroSlider/HeroSlider";
import EventsSection from "./component/EventsSection/EventsSection";
import Footer from "./component/Footer/Footer";

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <HeroSlider />
      <EventsSection />
      <Footer />
    </div>
  );
}