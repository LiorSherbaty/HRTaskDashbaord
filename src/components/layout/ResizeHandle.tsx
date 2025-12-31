import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/utils';

interface ResizeHandleProps {
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function ResizeHandle({
  onResize,
  minWidth = 120,
  maxWidth = 400,
  className,
}: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;

    // Get the sidebar element (previous sibling)
    const sidebar = handleRef.current?.previousElementSibling as HTMLElement;
    if (sidebar) {
      startWidth.current = sidebar.getBoundingClientRect().width;
    }

    document.body.classList.add('select-none');
    document.body.style.cursor = 'col-resize';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const delta = e.clientX - startX.current;
    let newWidth = startWidth.current + delta;

    // Apply constraints
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    onResize(newWidth);
  }, [onResize, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    document.body.classList.remove('select-none');
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={cn(
        'w-1 flex-shrink-0 cursor-col-resize transition-colors',
        'bg-transparent hover:bg-blue-400 active:bg-blue-500',
        'relative group',
        className
      )}
    >
      {/* Larger hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
