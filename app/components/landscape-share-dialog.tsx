"use client";

import {
  CheckIcon,
  Code2Icon,
  CopyIcon,
  DownloadIcon,
  ImageIcon,
} from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { projectLogoUrl } from "@/lib/project-logo";

import styles from "../page.module.css";

type LandscapeId = "agent" | "model";
type ActionId = "png" | "svg" | "markdown" | "html" | "source";

const LANDSCAPE_OPTIONS: Record<
  LandscapeId,
  { label: string; fileName: string; alt: string }
> = {
  agent: {
    label: "Agent Infra",
    fileName: "agent-infra-landscape-2026",
    alt: "Agent Infra Landscape 2026",
  },
  model: {
    label: "Model Infra",
    fileName: "model-infra-landscape-2026",
    alt: "Model Infra Landscape 2026",
  },
};

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.append(link);
  link.click();
  link.remove();
}

function decodeSvgDataUrl(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  const metadata = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  return metadata.includes(";base64")
    ? window.atob(payload)
    : decodeURIComponent(payload);
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 10_000);
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
}

async function withLocalProjectLogos<T>(
  target: HTMLElement,
  render: () => Promise<T>,
) {
  const images = [
    ...target.querySelectorAll<HTMLImageElement>(
      "img[data-export-logo-owner]",
    ),
  ];
  const originals = images.map((image) => ({
    image,
    src: image.getAttribute("src") ?? "",
  }));

  await Promise.all(
    images.map(async (image) => {
      const owner = image.dataset.exportLogoOwner;
      if (!owner) return;
      image.src = projectLogoUrl(owner);
      await waitForImage(image);
    }),
  );

  try {
    return await render();
  } finally {
    originals.forEach(({ image, src }) => {
      image.src = src;
    });
  }
}

export function LandscapeShareDialog({
  open,
  onOpenChange,
  initialSelection,
  getTarget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection: LandscapeId;
  getTarget: (id: LandscapeId) => HTMLElement | null;
}) {
  const [selectedOverride, setSelectedOverride] =
    useState<LandscapeId | null>(null);
  const [busy, setBusy] = useState<ActionId | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const selected = selectedOverride ?? initialSelection;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedOverride(null);
      setFeedback(null);
    }
    onOpenChange(nextOpen);
  }

  async function makeSvg() {
    const target = getTarget(selected);
    if (!target) throw new Error("Landscape canvas not found");

    return withLocalProjectLogos(target, () =>
      toSvg(target, {
        backgroundColor: "#ffffff",
        cacheBust: false,
        includeQueryParams: false,
        skipFonts: true,
        width: target.scrollWidth,
        height: target.scrollHeight,
      }),
    );
  }

  async function runAction(action: ActionId) {
    const target = getTarget(selected);
    if (!target) return;
    const option = LANDSCAPE_OPTIONS[selected];

    setBusy(action);
    setFeedback(null);

    try {
      if (action === "png") {
        const dataUrl = await withLocalProjectLogos(target, () =>
          toPng(target, {
            backgroundColor: "#ffffff",
            cacheBust: false,
            includeQueryParams: false,
            skipFonts: true,
            pixelRatio: 2,
            width: target.scrollWidth,
            height: target.scrollHeight,
          }),
        );
        downloadDataUrl(dataUrl, `${option.fileName}.png`);
        setFeedback("PNG downloaded");
      } else {
        const svgUrl = await makeSvg();

        if (action === "svg") {
          downloadDataUrl(svgUrl, `${option.fileName}.svg`);
          setFeedback("SVG downloaded");
        } else if (action === "markdown") {
          await copyText(`![${option.alt}](${svgUrl})`);
          setFeedback("Markdown embed copied");
        } else if (action === "html") {
          await copyText(
            `<img src="${svgUrl}" alt="${option.alt}" width="1420" />`,
          );
          setFeedback("HTML embed copied");
        } else {
          await copyText(decodeSvgDataUrl(svgUrl));
          setFeedback("SVG source copied");
        }
      }
    } catch {
      setFeedback(
        "Export failed. Wait for project logos to finish loading and try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={styles.shareDialog}>
        <DialogHeader>
          <div className={styles.shareTitleRow}>
            <Badge variant="secondary">16:9 export</Badge>
            {feedback ? (
              <span
                className={cn(
                  styles.shareFeedback,
                  feedback.startsWith("Export failed") &&
                    styles.shareFeedbackError,
                )}
              >
                {feedback.startsWith("Export failed") ? null : (
                  <CheckIcon aria-hidden="true" />
                )}
                {feedback}
              </span>
            ) : null}
          </div>
          <DialogTitle>Share the landscape</DialogTitle>
          <DialogDescription>
            Export the current canvas or copy a self-contained embed with the
            project logos included.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.shareLandscapeChoice}>
          {(Object.keys(LANDSCAPE_OPTIONS) as LandscapeId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={cn(
                styles.shareLandscapeOption,
                selected === id && styles.shareLandscapeOptionActive,
              )}
              onClick={() => {
                setSelectedOverride(id);
                setFeedback(null);
              }}
              aria-pressed={selected === id}
            >
              <span>{id === "agent" ? "A" : "M"}</span>
              <strong>{LANDSCAPE_OPTIONS[id].label}</strong>
            </button>
          ))}
        </div>

        <div className={styles.shareActions}>
          <Button
            type="button"
            onClick={() => runAction("png")}
            disabled={busy !== null}
          >
            <ImageIcon data-icon="inline-start" />
            {busy === "png" ? "Rendering…" : "Download PNG"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => runAction("svg")}
            disabled={busy !== null}
          >
            <DownloadIcon data-icon="inline-start" />
            {busy === "svg" ? "Rendering…" : "Download SVG"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => runAction("markdown")}
            disabled={busy !== null}
          >
            <CopyIcon data-icon="inline-start" />
            Copy Markdown
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => runAction("html")}
            disabled={busy !== null}
          >
            <Code2Icon data-icon="inline-start" />
            Copy HTML
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => runAction("source")}
            disabled={busy !== null}
          >
            <CopyIcon data-icon="inline-start" />
            Copy SVG source
          </Button>
        </div>

        <p className={styles.shareNote}>
          Markdown and HTML embeds use an inline SVG data URL, so they do not
          depend on a separate image host.
        </p>
      </DialogContent>
    </Dialog>
  );
}
