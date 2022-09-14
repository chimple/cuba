import { IonContent } from "@ionic/react";
import "./CustomSlider.css";
import "swiper/css";
import "swiper/css/free-mode";
import { Swiper, SwiperSlide } from "swiper/react";
import SlideCard from "./SlideCard";
import { FreeMode, Mousewheel } from "swiper";

import "swiper/css/free-mode";
import "swiper/css/mousewheel";

const CustomSlider: React.FC<any> = ({ lessonData }) => {
  console.log("CustomSlider LessonData", lessonData);
  return (
    <IonContent className="content">
      <div className="vertical-center">
        <Swiper
          modules={[FreeMode, Mousewheel]}
          direction={"horizontal"}
          spaceBetween={20}
          slidesPerView={"auto"}
          mousewheel={true}
          freeMode={true}
          onSlideChange={() => console.log("slide change")}
          onSwiper={(swiper) => console.log(swiper)}
        >
          {lessonData.map((m: any, i: number) => (
            <SwiperSlide className="slide" key={i}>
              <SlideCard lesson={m} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </IonContent>
  );
};

export default CustomSlider;
