type NavigatorLike = Pick<
  Navigator,
  "userAgent" | "platform" | "maxTouchPoints"
>;

export const isIosLikeDevice = (navigatorLike: NavigatorLike) => {
  const { userAgent, platform, maxTouchPoints } = navigatorLike;
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true;
  }

  // iPadOS reports "MacIntel" platform, so detect touch-capable MacIntel.
  return platform === "MacIntel" && maxTouchPoints > 1;
};

export const withMaximumScaleOne = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return "maximum-scale=1";
  }

  if (/maximum-scale\s*=/i.test(trimmed)) {
    return trimmed.replace(/maximum-scale\s*=\s*[^,]+/i, "maximum-scale=1");
  }

  return `${trimmed}, maximum-scale=1`;
};

export const preventIosInputAutoZoom = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (!isIosLikeDevice(window.navigator)) {
    return;
  }

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport == null) {
    return;
  }

  const current = viewport.getAttribute("content") ?? "";
  viewport.setAttribute("content", withMaximumScaleOne(current));
};
