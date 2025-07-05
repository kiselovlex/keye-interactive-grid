import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "./Grid";

// Mock the useReportData hook to return valid data
const mockData = {
  rows: [
    { product: "Product A", col1: 100, col2: 200, col3: 10.5 },
    { product: "Product B", col1: 150, col2: 250, col3: 15.2 },
  ],
  columnOrder: ["product", "col1", "col2", "col3"],
  columnMapping: new Map([
    ["product", { id: "product", name: "Product" }],
    ["col1", { id: "col1", name: "Revenue" }],
  ]),
  sections: [
    { name: "Product", columns: [{ id: "product", name: "Product" }] },
  ],
  cellMetadata: new Map(),
};

vi.mock("../hooks/useReportData/useReportData", () => ({
  useReportData: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock browser APIs
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

describe("Grid Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should render without crashing", () => {
      render(<Grid />);

      // The component should render without throwing errors
      expect(document.body).toBeInTheDocument();
    });

    it("should render the main container structure", () => {
      render(<Grid />);

      // Check for main container
      const container = document.querySelector(
        ".rounded-md.border.bg-card.relative"
      );
      expect(container).toBeInTheDocument();
    });

    it("should not show error state when data loads successfully", () => {
      render(<Grid />);

      // Should not contain error indicators
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });
});
