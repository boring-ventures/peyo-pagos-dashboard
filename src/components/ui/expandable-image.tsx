import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageExpandModal } from "@/components/ui/image-expand-modal";
import { Expand, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableImageProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  className?: string;
  showExpandButton?: boolean;
  expandButtonPosition?: "top-right" | "center" | "bottom-right";
}

export function ExpandableImage({
  src,
  alt,
  title,
  description,
  width = 300,
  height = 200,
  className,
  showExpandButton = true,
  expandButtonPosition = "top-right",
}: ExpandableImageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageClick = () => {
    setIsExpanded(true);
  };

  const getExpandButtonClasses = () => {
    const baseClasses =
      "absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200";

    switch (expandButtonPosition) {
      case "center":
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      case "bottom-right":
        return `${baseClasses} bottom-2 right-2`;
      case "top-right":
      default:
        return `${baseClasses} top-2 right-2`;
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative group cursor-pointer border rounded-lg overflow-hidden",
          "hover:shadow-lg transition-shadow duration-200",
          className
        )}
        onClick={handleImageClick}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-document.png";
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />

        {/* Expand Button */}
        {showExpandButton && (
          <Button
            size="sm"
            variant="secondary"
            className={getExpandButtonClasses()}
            onClick={(e) => {
              e.stopPropagation();
              handleImageClick();
            }}
          >
            {expandButtonPosition === "center" ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Ver imagen
              </>
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <ImageExpandModal
        src={src}
        alt={alt}
        title={title}
        description={description}
        open={isExpanded}
        onOpenChange={setIsExpanded}
      />
    </>
  );
}
