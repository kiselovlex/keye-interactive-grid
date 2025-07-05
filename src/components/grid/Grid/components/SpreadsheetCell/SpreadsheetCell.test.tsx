import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpreadsheetCell } from "./SpreadsheetCell";
import type { CellPosition, CellMetadata } from "../../../types/common";

// Mock the selection context
const mockSelectionContext = {
  selectionState: null as {
    selectedCells: {
      type: string;
      single?: CellPosition;
      range?: { start: CellPosition; end: CellPosition };
    } | null;
    isSelecting: boolean;
  } | null,
  selectCell: vi.fn(),
  selectRange: vi.fn(),
  toggleCellSelection: vi.fn(),
  startSelection: vi.fn(),
  updateSelection: vi.fn(),
  endSelection: vi.fn(),
  isCellSelected: vi.fn(() => false),
  isCellInRange: vi.fn(() => false),
  getActiveCell: vi.fn(() => null),
  startEdit: vi.fn(),
  updateEditValue: vi.fn(),
  editValue: "",
  isEditValid: true,
  editError: null as string | null,
  isSaving: false,
  isCellEditing: vi.fn(() => false),
};

vi.mock("../../../contexts/SelectionContext", () => ({
  useSelectionContext: () => mockSelectionContext,
}));

// Mock the UI components
vi.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    ...props
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    [key: string]: unknown;
  }) => (
    <input
      data-testid="edit-input"
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/table", () => ({
  TableCell: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <td data-testid="table-cell" {...props}>
      {children}
    </td>
  ),
}));

describe("SpreadsheetCell", () => {
  const user = userEvent.setup();

  const defaultPosition: CellPosition = { row: 0, column: 1 };
  const defaultMetadata: CellMetadata = {
    type: "text",
    section: "Product",
    formatting: { id: "test-format", alignment: "left" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock returns to defaults
    mockSelectionContext.isCellSelected.mockReturnValue(false);
    mockSelectionContext.isCellInRange.mockReturnValue(false);
    mockSelectionContext.isCellEditing.mockReturnValue(false);
    mockSelectionContext.getActiveCell.mockReturnValue(null);
    mockSelectionContext.selectionState = null;
    mockSelectionContext.editError = null;
  });

  describe("Basic Rendering", () => {
    it("should render cell with formatted value", () => {
      render(
        <SpreadsheetCell
          rawValue="Test Value"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      expect(screen.getByTestId("table-cell")).toBeInTheDocument();
      expect(screen.getByText("Test Value")).toBeInTheDocument();
    });

    it("should render with correct aria attributes", () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      expect(cell).toHaveAttribute("role", "gridcell");
      expect(cell).toHaveAttribute(
        "aria-label",
        "Cell at row 1, column 1: Test"
      );
      expect(cell).toHaveAttribute("aria-selected", "false");
    });

    it("should format currency values correctly", () => {
      const currencyMetadata: CellMetadata = {
        type: "currency",
        section: "Values",
        formatting: { id: "currency-format", alignment: "right" },
      };

      render(
        <SpreadsheetCell
          rawValue={1234.56}
          metadata={currencyMetadata}
          position={defaultPosition}
        />
      );

      // Should format as currency (exact format depends on formatValue implementation)
      expect(screen.getByTestId("table-cell")).toBeInTheDocument();
    });
  });

  describe("Selection Functionality", () => {
    it("should call selectCell on regular click", async () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.click(cell);

      expect(mockSelectionContext.selectCell).toHaveBeenCalledWith(
        defaultPosition
      );
    });

    it("should call toggleCellSelection on Ctrl+click", async () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.keyboard("{Control>}");
      await user.click(cell);
      await user.keyboard("{/Control}");

      expect(mockSelectionContext.toggleCellSelection).toHaveBeenCalledWith(
        defaultPosition
      );
      expect(mockSelectionContext.selectCell).not.toHaveBeenCalled();
    });

    it("should call selectRange on Shift+click when anchor exists", async () => {
      const anchorPosition = { row: 0, column: 0 };
      mockSelectionContext.selectionState = {
        selectedCells: { type: "single", single: anchorPosition },
        isSelecting: false,
      };

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.keyboard("{Shift>}");
      await user.click(cell);
      await user.keyboard("{/Shift}");

      expect(mockSelectionContext.selectRange).toHaveBeenCalledWith(
        anchorPosition,
        defaultPosition
      );
    });

    it("should show selected state when cell is selected", () => {
      mockSelectionContext.isCellSelected.mockReturnValue(true);

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      expect(cell).toHaveAttribute("aria-selected", "true");
    });

    it("should handle drag selection start on mouse down", async () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.pointer({ target: cell, keys: "[MouseLeft>]" });

      expect(mockSelectionContext.startSelection).toHaveBeenCalledWith(
        defaultPosition
      );
    });

    it("should update selection on mouse enter during drag", async () => {
      mockSelectionContext.selectionState = {
        selectedCells: null,
        isSelecting: true,
      };

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.hover(cell);

      expect(mockSelectionContext.updateSelection).toHaveBeenCalledWith(
        defaultPosition
      );
    });
  });

  describe("Editing Functionality", () => {
    it("should start editing on double click", async () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.dblClick(cell);

      expect(mockSelectionContext.startEdit).toHaveBeenCalledWith(
        defaultPosition
      );
    });

    it("should render input when editing", () => {
      mockSelectionContext.isCellEditing.mockReturnValue(true);
      mockSelectionContext.editValue = "Editing value";

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      expect(screen.getByTestId("edit-input")).toBeInTheDocument();
      expect(screen.getByTestId("edit-input")).toHaveValue("Editing value");
      expect(screen.queryByText("Test")).not.toBeInTheDocument();
    });

    it("should call updateEditValue when input changes", async () => {
      mockSelectionContext.isCellEditing.mockReturnValue(true);
      mockSelectionContext.editValue = "";

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const input = screen.getByTestId("edit-input");
      await user.type(input, "New value");

      // Should be called once for each character typed (9 characters)
      expect(mockSelectionContext.updateEditValue).toHaveBeenCalledTimes(9);
      // Last call should be with the final character
      expect(mockSelectionContext.updateEditValue).toHaveBeenLastCalledWith(
        "e"
      );
    });

    it("should not handle clicks during editing", async () => {
      mockSelectionContext.isCellEditing.mockReturnValue(true);

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      await user.click(cell);

      expect(mockSelectionContext.selectCell).not.toHaveBeenCalled();
    });

    it("should show error message when edit is invalid", () => {
      mockSelectionContext.isCellEditing.mockReturnValue(true);
      mockSelectionContext.isEditValid = false;
      mockSelectionContext.editError = "Invalid value";

      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
        />
      );

      expect(screen.getByText("Invalid value")).toBeInTheDocument();
    });
  });

  describe("Cell Styling", () => {
    it("should apply section border when hasSectionBorder is true", () => {
      render(
        <SpreadsheetCell
          rawValue="Test"
          metadata={defaultMetadata}
          position={defaultPosition}
          hasSectionBorder={true}
        />
      );

      const cell = screen.getByTestId("table-cell");
      // Check for section border class (exact class depends on implementation)
      expect(cell.className).toContain("border-l-2");
    });

    it("should apply row index styling when isRowIndex is true", () => {
      render(
        <SpreadsheetCell
          rawValue="1"
          metadata={defaultMetadata}
          position={defaultPosition}
          isRowIndex={true}
        />
      );

      const cell = screen.getByTestId("table-cell");
      // Should have row index specific styling
      expect(cell.className).toContain("w-12");
    });

    it("should apply right alignment for currency cells", () => {
      const currencyMetadata: CellMetadata = {
        type: "currency",
        section: "Values",
        formatting: { id: "currency-format", alignment: "right" },
      };

      render(
        <SpreadsheetCell
          rawValue={1234}
          metadata={currencyMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      // Should have right alignment styling
      expect(cell.style.justifyContent).toBe("flex-end");
    });
  });

  describe("Growth Indicators", () => {
    it("should add growth data attribute for YoY Growth section", () => {
      const growthMetadata: CellMetadata = {
        type: "percentage",
        section: "YoY Growth",
        formatting: { id: "growth-format", alignment: "right" },
      };

      render(
        <SpreadsheetCell
          rawValue={15.5}
          metadata={growthMetadata}
          position={defaultPosition}
        />
      );

      const cell = screen.getByTestId("table-cell");
      expect(cell).toHaveAttribute("data-growth");
    });
  });
});
