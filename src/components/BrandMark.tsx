import Image from "next/image";

type BrandMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  size = 32,
  className = "",
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/devdrill_logo.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={`rounded-[22%] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.35)] ${className}`}
      aria-hidden
    />
  );
}
