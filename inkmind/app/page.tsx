import HomeContent from "@/components/HomeContent";
import DesignGalleryServer from "@/components/DesignGalleryServer";

export default function Home() {
  return <HomeContent designGallerySlot={<DesignGalleryServer />} />;
}
