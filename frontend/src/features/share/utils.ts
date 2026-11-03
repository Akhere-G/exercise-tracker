import { toBlob } from "html-to-image";

/** Renders an element to a PNG and shares it, or downloads it where sharing is unsupported. */
export async function shareElementAsImage(
  node: HTMLElement,
  { filename, title }: { filename: string; title: string },
): Promise<"share" | "download" | "cancelled"> {
  const blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
  if (!blob) throw new Error("Could not render the image.");

  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "share";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return "download";
}
