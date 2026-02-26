import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  loadingClassName?: string;
  errorClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className,
  loadingClassName,
  errorClassName,
  onLoad,
  onError,
  lazy = true,
  ...props
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageState('loading');
    } else {
      setImageState('error');
      onError?.();
    }
  }, [fallbackSrc, currentSrc, onError]);

  if (imageState === 'error' && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return (
      <div
        className={cn(
          'bg-gray-800 flex items-center justify-center text-gray-400 text-sm',
          errorClassName,
          className
        )}
        {...props}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className="relative">
      {imageState === 'loading' && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center',
            loadingClassName,
            className
          )}
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        className={cn(
          'transition-opacity duration-300',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
