import HeroSlider from "./components/HeroSlider";
import PromoBanner from "./components/PromoBanner";
import FlashSale from "./components/FlashSale";
import Katalog from "./components/Katalog";
import BrandShowcase from "./components/BrandShowcase";
import Layanan from "./components/Layanan";
import Artikel from "./components/Artikel";
import Testimoni from "./components/Testimoni";
import CtaWhatsapp from "./components/CtaWhatsapp";
import Footer from "./components/Footer";
import FloatWA from "./components/FloatWA";
import Toast from "./components/Toast";

export default function Home() {
  return (
    <>
      <main>
        <HeroSlider />
        <PromoBanner />
        <FlashSale />
        <Katalog />
        <BrandShowcase />
        <Layanan />
        <Artikel />
        <Testimoni />
        <CtaWhatsapp />
      </main>
      <Footer />
      <FloatWA />
      <Toast />
    </>
  );
}
