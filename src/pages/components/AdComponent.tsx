import { useEffect, useRef } from "react";

const AdComponent = () => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (
          adRef.current &&
          !adRef.current.getAttribute("data-adsbygoogle-status")
        ) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{
        display: "block",
        width: "100%",
        minHeight: "100px",
      }}
      data-ad-client="ca-pub-XXXX"
      data-ad-slot="YYYY"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default AdComponent;