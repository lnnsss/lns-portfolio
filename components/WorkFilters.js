"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PROJECT_FILTERS } from "@/lib/project-filters";
import styles from "./WorkList.module.css";

const filters = [{ value: "all", label: "Все" }, ...PROJECT_FILTERS];

export default function WorkFilters({ value, onChange, controls }) {
  const rootRef = useRef(null);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [bounds, setBounds] = useState([]);
  const [drag, setDrag] = useState(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = () => setBounds(Array.from(root.querySelectorAll("button")).map((button) => ({
      x: button.offsetLeft, y: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight
    })));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll("button").forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, []);

  const selected = filters.findIndex((filter) => filter.value === value);
  const indicator = drag || bounds[selected];
  const highlighted = drag ? drag.index : selected;

  function startDrag(event, index) {
    suppressClick.current = false;
    if (event.button !== 0 || !event.isPrimary || index !== selected || !bounds[index]) return;
    gesture.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: bounds[index], index, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const delta = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (!current.moved && Math.hypot(delta, deltaY) < 4) return;
    current.moved = true;
    const root = rootRef.current;
    const x = Math.max(0, Math.min(root.clientWidth - current.origin.width, current.origin.x + delta));
    const y = Math.max(0, Math.min(root.clientHeight - current.origin.height, current.origin.y + deltaY));
    const centerX = x + current.origin.width / 2;
    const centerY = y + current.origin.height / 2;
    const distance = (item) => Math.hypot(item.x + item.width / 2 - centerX, item.y + item.height / 2 - centerY);
    const index = bounds.reduce((nearest, item, i) => distance(item) < distance(bounds[nearest]) ? i : nearest, 0);
    current.index = index;
    setDrag({ x, y, width: current.origin.width, height: current.origin.height, index });
  }

  function endDrag(event, cancelled = false) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    suppressClick.current = current.moved;
    setDrag(null);
    if (!cancelled && current.moved) onChange(filters[current.index].value);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className={styles.filterScroll}>
      <div ref={rootRef} className={styles.filters} role="group" aria-label="Фильтр кейсов" data-dragging={Boolean(drag)}>
        {indicator && <motion.span aria-hidden="true" className={styles.filterActive}
          initial={false} animate={{ x: indicator.x, y: indicator.y, width: indicator.width, height: indicator.height }}
          transition={drag || reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}
        {filters.map((filter, index) => (
          <button key={filter.value} type="button" className={styles.filterButton}
            aria-pressed={value === filter.value} aria-controls={controls} data-highlighted={highlighted === index}
            onPointerDown={(event) => startDrag(event, index)} onPointerMove={moveDrag}
            onPointerUp={endDrag} onPointerCancel={(event) => endDrag(event, true)}
            onLostPointerCapture={(event) => endDrag(event, true)}
            onClick={(event) => {
              if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
              onChange(filter.value);
              event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "instant" : "smooth" });
            }}>
            <span className={styles.filterLabel}>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
