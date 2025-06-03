"use client";
import ReactConfetti from "react-confetti";

export default function Confetti(
  props: React.ComponentProps<typeof ReactConfetti>
) {
  if (typeof window === "undefined") return null;
  return <ReactConfetti {...props} />;
}
