"use client";

import { useState, useCallback, useRef } from "react";

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export function useIsoCamera(initialX: number = 0, initialY: number = 0, initialZoom: number = 1.45) {
  const [camera, setCamera] = useState<CameraState>({
    x: initialX,
    y: initialY,
    zoom: initialZoom,
  });
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, cameraX: 0, cameraY: 0 });

  const pan = useCallback((dx: number, dy: number) => {
    setCamera((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const setPosition = useCallback((x: number, y: number) => {
    setCamera((prev) => ({ ...prev, x, y }));
  }, []);

  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setCamera((prev) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta));
      
      // Zoom towards center point if provided
      if (centerX !== undefined && centerY !== undefined) {
        const zoomFactor = newZoom / prev.zoom;
        const newX = centerX - (centerX - prev.x) * zoomFactor;
        const newY = centerY - (centerY - prev.y) * zoomFactor;
        return { x: newX, y: newY, zoom: newZoom };
      }
      
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setCamera((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)),
    }));
  }, []);

  const reset = useCallback(() => {
    setCamera({ x: initialX, y: initialY, zoom: initialZoom });
  }, [initialX, initialY, initialZoom]);

  const startDrag = useCallback((screenX: number, screenY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: screenX,
      y: screenY,
      cameraX: camera.x,
      cameraY: camera.y,
    };
  }, [camera.x, camera.y]);

  const updateDrag = useCallback((screenX: number, screenY: number) => {
    if (!isDraggingRef.current) return;
    
    const dx = screenX - dragStartRef.current.x;
    const dy = screenY - dragStartRef.current.y;
    
    setCamera({
      ...camera,
      x: dragStartRef.current.cameraX + dx,
      y: dragStartRef.current.cameraY + dy,
    });
  }, [camera]);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent, canvasRect: DOMRect) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const centerX = e.clientX - canvasRect.left;
    const centerY = e.clientY - canvasRect.top;
    zoom(delta, centerX, centerY);
  }, [zoom]);

  return {
    camera,
    pan,
    setPosition,
    zoom,
    setZoom,
    reset,
    startDrag,
    updateDrag,
    endDrag,
    handleWheel,
    isDragging: isDraggingRef.current,
  };
}
