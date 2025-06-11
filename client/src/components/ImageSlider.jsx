import { useState, useEffect } from 'react';

const ImageSlider = ({ slides, currentSlide, setCurrentSlide }) => {

  return (
    <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-[#2C3E50]">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 transform ${
            index === currentSlide
              ? 'opacity-100 translate-x-0 scale-100'
              : 'opacity-0 translate-x-full scale-95'
          }`}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
            <div
              className="w-32 h-32 rounded-full mb-8 flex items-center justify-center transition-all duration-700"
              style={{ backgroundColor: slide.color + '20' }}
            >
              <slide.icon
                className="w-16 h-16 transition-all duration-700"
                style={{ color: slide.color }}
              />
            </div>
            <h3 className="text-4xl font-bold mb-4 text-white transform transition-all duration-700">
              {slide.title}
            </h3>
            <p className="text-xl text-[#A6DCEF] max-w-2xl transform transition-all duration-700">
              {slide.description}
            </p>
          </div>
        </div>
      ))}
      
      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-3 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? 'w-10 bg-[#A6DCEF]'
                : 'w-3 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;