"use client";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

export default function ConffettiEffect() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setTimeout(() => setShow(false), 1500);
  }, []);
  return <ReactConfetti numberOfPieces={show ? 300 : 0} />;
}
