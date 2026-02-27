import { useState } from 'react';

interface AccordionItem {
  id: number;
  title: string;
  imageUrl: string;
}

interface ImageAccordionProps {
  items: AccordionItem[];
  defaultActiveIndex?: number;
  height?: string;
}

export function ImageAccordion({ items, defaultActiveIndex = 0, height = '450px' }: ImageAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  return (
    <div className="flex gap-2" style={{ height }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`
            relative rounded-2xl overflow-hidden cursor-pointer
            transition-all duration-700 ease-in-out
            ${index === activeIndex ? 'flex-1' : 'flex-[0_0_60px]'}
          `}
          onMouseEnter={() => setActiveIndex(index)}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className={`absolute inset-0 ${
            index === activeIndex
              ? 'bg-gradient-to-t from-black/65 via-black/10 to-transparent'
              : 'bg-black/45'
          }`} />
          <span className={`
            absolute text-white font-semibold whitespace-nowrap
            transition-all duration-500
            ${index === activeIndex
              ? 'bottom-4 left-1/2 -translate-x-1/2 rotate-0 text-sm'
              : 'bottom-1/2 left-1/2 -translate-x-1/2 rotate-90 text-xs'
            }
          `}>
            {item.title}
          </span>
        </div>
      ))}
    </div>
  );
}
