import JSZip from "jszip";
import { ELEMENTS } from "./elementData";
import { elementMemoryCardBlob, elementMemoryCardFilename, type ElementMemoryCardContext } from "./elementMemoryCard";
import { getElementMemoryTip } from "./elementMemoryTips";

export const ELEMENT_MEMORY_ARCHIVE_FILENAME = "memodesk-elements-01-54-cards.zip";

export async function createElementMemoryCardArchive(cardContext: ElementMemoryCardContext, onProgress?: (completed: number, total: number) => void) {
  const zip = new JSZip();
  const elements = ELEMENTS.filter(element => element.number <= 54);
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    const tip = getElementMemoryTip(element.number);
    if (!tip) continue;
    const blob = await elementMemoryCardBlob(element, tip, cardContext);
    zip.file(elementMemoryCardFilename(element), blob);
    onProgress?.(index + 1, elements.length);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function downloadElementMemoryCardArchive(cardContext: ElementMemoryCardContext, onProgress?: (completed: number, total: number) => void) {
  const blob = await createElementMemoryCardArchive(cardContext, onProgress);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = ELEMENT_MEMORY_ARCHIVE_FILENAME;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
