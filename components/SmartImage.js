import Image from "next/image";

function isRemoteImage(src) {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}

export default function SmartImage({ src, alt, width, height, priority, ...props }) {
  if (isRemoteImage(src)) {
    return <img src={src} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} {...props} />;
  }

  return <Image src={src} alt={alt} width={width} height={height} priority={priority} {...props} />;
}
