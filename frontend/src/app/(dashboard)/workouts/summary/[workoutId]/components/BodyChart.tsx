"use client";

import Body, { ExtendedBodyPart } from "react-muscle-highlighter";

export default function BodyChart({
  data,
  side = "front",
}: {
  data: ExtendedBodyPart[];
  side?: "front" | "back";
}) {
  return <Body data={data} side={side} scale={0.8} />;
}
