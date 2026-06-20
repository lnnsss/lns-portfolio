"use client";

import { useEffect } from "react";

const selectionColors = ["#ff4d8d", "#77f7c8", "#7aa7ff", "#ffd166", "#b388ff"];

export default function SelectionRandomizer() {
  useEffect(() => {
    function randomizeSelectionColor() {
      const color = selectionColors[Math.floor(Math.random() * selectionColors.length)];
      document.documentElement.style.setProperty("--selection-bg", color);
    }

    randomizeSelectionColor();
    document.addEventListener("pointerdown", randomizeSelectionColor);
    document.addEventListener("keydown", randomizeSelectionColor);
    return () => {
      document.removeEventListener("pointerdown", randomizeSelectionColor);
      document.removeEventListener("keydown", randomizeSelectionColor);
    };
  }, []);

  return null;
}
