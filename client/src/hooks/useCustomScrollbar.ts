import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing a virtual scrollbar that doesn't take up layout space
 * This eliminates the black scrollbar track area while maintaining scroll functionality
 */
export const useCustomScrollbar = (
  containerRef: React.RefObject<HTMLElement>,
  listRef: React.RefObject<any>
) => {
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollbarHeight, setScrollbarHeight] = useState(0);
  const [scrollbarTop, setScrollbarTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate scrollbar dimensions and position
  const updateScrollbar = useCallback(() => {
    if (!containerRef.current || !listRef.current) return;

    const container = containerRef.current;
    const list = listRef.current._outerRef;
    
    if (!list) return;

    const containerHeight = container.clientHeight;
    const scrollHeight = list.scrollHeight;
    const scrollTop = list.scrollTop;

    // Show scrollbar only when content overflows
    const hasOverflow = scrollHeight > containerHeight;
    setScrollbarVisible(hasOverflow);

    if (hasOverflow) {
      // Calculate scrollbar thumb height (proportional to visible content)
      const thumbHeight = Math.max(
        (containerHeight / scrollHeight) * containerHeight,
        20 // Minimum thumb height
      );
      
      // Calculate scrollbar thumb position
      const maxScrollTop = scrollHeight - containerHeight;
      const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      const maxThumbTop = containerHeight - thumbHeight;
      const thumbTop = scrollPercentage * maxThumbTop;

      setScrollbarHeight(thumbHeight);
      setScrollbarTop(thumbTop);
    }
  }, [containerRef, listRef]);

  // Handle scrollbar drag
  const handleScrollbarDrag = useCallback((e: any) => {
    if (!isDragging || !containerRef.current || !listRef.current) return;

    const container = containerRef.current;
    const list = listRef.current._outerRef;
    
    if (!list) return;

    const containerRect = container.getBoundingClientRect();
    const containerHeight = container.clientHeight;
    const scrollHeight = list.scrollHeight;
    
    // Calculate mouse position relative to container
    const mouseY = e.clientY - containerRect.top;
    const scrollPercentage = Math.max(0, Math.min(1, mouseY / containerHeight));
    
    // Calculate new scroll position
    const maxScrollTop = scrollHeight - containerHeight;
    const newScrollTop = scrollPercentage * maxScrollTop;
    
    // Apply scroll
    list.scrollTop = newScrollTop;
  }, [isDragging, containerRef, listRef]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: any) => {
    if (isDragging) {
      handleScrollbarDrag(e);
    }
  }, [isDragging, handleScrollbarDrag]);

  // Set up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Set up scroll listener
  useEffect(() => {
    if (!listRef.current) return;

    const list = listRef.current._outerRef;
    if (!list) return;

    const handleScroll = () => {
      updateScrollbar();
    };

    list.addEventListener('scroll', handleScroll);
    
    // Initial calculation
    updateScrollbar();

    return () => {
      list.removeEventListener('scroll', handleScroll);
    };
  }, [listRef, updateScrollbar]);

  // Update on resize
  useEffect(() => {
    const handleResize = () => {
      updateScrollbar();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollbar]);

  return {
    scrollbarVisible,
    scrollbarHeight,
    scrollbarTop,
    handleMouseDown,
    updateScrollbar
  };
};
