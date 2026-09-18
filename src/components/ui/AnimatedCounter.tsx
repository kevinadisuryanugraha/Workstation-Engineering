import React, { useEffect, useRef } from "react";
import { animate } from "animejs";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    if (!spanRef.current) return;

    const counterObj = { val: prevValueRef.current };

    const anim = animate(counterObj, {
      val: value,
      duration: duration,
      ease: "outExpo",
      onUpdate: () => {
        if (spanRef.current) {
          const formatted = decimals > 0 ? counterObj.val.toFixed(decimals) : Math.round(counterObj.val).toString();
          spanRef.current.innerText = `${prefix}${formatted}${suffix}`;
        }
      },
      onComplete: () => {
        prevValueRef.current = value;
      }
    });

    return () => {
      // clean up if necessary
    };
  }, [value, duration, decimals, prefix, suffix]);

  const initialFormatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={spanRef} className={className}>
      {prefix}{initialFormatted}{suffix}
    </span>
  );
};
