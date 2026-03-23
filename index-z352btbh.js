// index.ts
var mediaItems = document.querySelectorAll(".images img, .images video");
var backdrop = document.getElementById("backdrop");
var zoomImg = document.getElementById("zoom-img");
var zoomVideo = document.getElementById("zoom-video");
var activeMedia = null;
function getZoomEl(isVideo) {
  return isVideo ? zoomVideo : zoomImg;
}
function openZoom(el) {
  const isVideo = el instanceof HTMLVideoElement;
  const zoomEl = getZoomEl(isVideo);
  const rect = el.getBoundingClientRect();
  if (isVideo) {
    const src = el.currentSrc || el.querySelector("source")?.src;
    zoomVideo.src = src;
    zoomVideo.currentTime = el.currentTime;
  } else {
    zoomImg.src = el.src;
  }
  zoomEl.style.transition = "none";
  zoomEl.style.top = rect.top + "px";
  zoomEl.style.left = rect.left + "px";
  zoomEl.style.width = rect.width + "px";
  zoomEl.style.height = rect.height + "px";
  zoomEl.style.display = "block";
  el.style.visibility = "hidden";
  activeMedia = el;
  backdrop.classList.add("active");
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.9;
  const scale = Math.min(maxW / rect.width, maxH / rect.height);
  const newW = rect.width * scale;
  const newH = rect.height * scale;
  const newLeft = (window.innerWidth - newW) / 2;
  const newTop = (window.innerHeight - newH) / 2;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    zoomEl.style.transition = "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease";
    zoomEl.style.top = newTop + "px";
    zoomEl.style.left = newLeft + "px";
    zoomEl.style.width = newW + "px";
    zoomEl.style.height = newH + "px";
  }));
}
function closeZoom() {
  if (!activeMedia)
    return;
  const el = activeMedia;
  const isVideo = el instanceof HTMLVideoElement;
  const zoomEl = getZoomEl(isVideo);
  activeMedia = null;
  const rect = el.getBoundingClientRect();
  backdrop.classList.remove("active");
  zoomEl.style.transition = "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease";
  zoomEl.style.top = rect.top + "px";
  zoomEl.style.left = rect.left + "px";
  zoomEl.style.width = rect.width + "px";
  zoomEl.style.height = rect.height + "px";
  zoomEl.addEventListener("transitionend", () => {
    el.style.visibility = "";
    zoomEl.style.display = "none";
    if (isVideo)
      zoomVideo.src = "";
  }, { once: true });
}
var MOVE_THRESHOLD = 8;
var pointerStartX = 0;
var pointerStartY = 0;
function isCloseEnough(e) {
  const dx = e.clientX - pointerStartX;
  const dy = e.clientY - pointerStartY;
  return Math.sqrt(dx * dx + dy * dy) < MOVE_THRESHOLD;
}
mediaItems.forEach((el) => {
  el.addEventListener("pointerdown", (e) => {
    const pe = e;
    if (pe.pointerType === "mouse") {
      openZoom(el);
    } else {
      return;
      pointerStartX = pe.clientX;
      pointerStartY = pe.clientY;
    }
  });
  el.addEventListener("pointerup", (e) => {
    return;
    const pe = e;
    if (pe.pointerType === "mouse")
      return;
    if (isCloseEnough(pe))
      openZoom(el);
  });
});
for (const el of [backdrop, zoomImg, zoomVideo]) {
  el.addEventListener("pointerdown", (e) => {
    const pe = e;
    if (pe.pointerType === "mouse")
      closeZoom();
    else {
      pointerStartX = pe.clientX;
      pointerStartY = pe.clientY;
    }
  });
  el.addEventListener("pointerup", (e) => {
    const pe = e;
    if (pe.pointerType === "mouse")
      return;
    if (isCloseEnough(pe))
      closeZoom();
  });
}
var isMobileTouch = () => {
  return window.matchMedia("(pointer: coarse) and (hover: none)").matches;
};
var zoomInText = document.getElementById("zoom-in-text");
if (isMobileTouch() && zoomInText) {
  zoomInText.remove();
}
if (isMobileTouch()) {
  const desktopDemo = document.getElementById("desktop-demo");
  if (desktopDemo)
    desktopDemo.remove();
}
