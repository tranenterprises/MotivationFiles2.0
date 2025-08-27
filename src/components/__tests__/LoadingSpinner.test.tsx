import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('renders spinner with default medium size', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('renders SVG circle animation', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Check for circle and path elements
      const circle = svg?.querySelector('circle');
      const path = svg?.querySelector('path');

      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      const { container } = render(<LoadingSpinner size="small" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('renders medium size correctly', () => {
      const { container } = render(<LoadingSpinner size="medium" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('renders large size correctly', () => {
      const { container } = render(<LoadingSpinner size="large" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('custom-class');
    });

    it('combines size classes with custom className', () => {
      const { container } = render(
        <LoadingSpinner size="small" className="text-red-500" />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4', 'h-4', 'text-red-500');
    });
  });

  describe('Accessibility', () => {
    it('has proper color styling', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-accent');
    });

    it('circle has proper opacity for visual effect', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      const circle = svg?.querySelector('circle');

      expect(circle).toHaveClass('opacity-25');
    });

    it('path has proper opacity for visual effect', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      const path = svg?.querySelector('path');

      expect(path).toHaveClass('opacity-75');
    });
  });

  describe('Animation', () => {
    it('applies spin animation class', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('SVG Properties', () => {
    it('has correct SVG attributes', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('circle has correct properties', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      const circle = svg?.querySelector('circle');

      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('stroke-width', '4');
    });

    it('path has correct fill and path data', () => {
      const { container } = render(<LoadingSpinner />);

      const svg = container.querySelector('svg');
      const path = svg?.querySelector('path');

      expect(path).toHaveAttribute('fill', 'currentColor');
      expect(path).toHaveAttribute('d');
    });
  });
});
