export type QuoteScrapOpportunityRow = {
  key: string;
  itemId: string;
  itemIndex: number;
  pieceIndex: number;
  pieceTotal: number;
  skuCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  scrapId: string;
  locationCode: string | null;
  areaM2: number;
  excessAreaM2: number;
  salesValue: number;
  recoveredValue: number;
};

export type QuoteScrapOpportunityMatchRow = Omit<QuoteScrapOpportunityRow, "salesValue" | "recoveredValue">;

export type QuoteScrapOpportunityPreview = {
  items: QuoteScrapOpportunityMatchRow[];
  summary: {
    assignedPieces: number;
    totalPieces: number;
    linesWithOpportunity: number;
  };
};

export type AutoScrapAssignmentPreview = {
  saleId: string;
  strategy: string;
  items: Array<{
    saleLineId: string;
    saleLinePieceId: string;
    pieceIndex: number;
    pieceTotal: number;
    skuCode: string;
    requestedWidthM: number;
    requestedHeightM: number;
    scrapId: string;
    labelCode: string;
    locationCode: string | null;
    widthM: number;
    heightM: number;
    areaM2: number;
    excessAreaM2: number;
  }>;
  unmatchedPieces: Array<{
    saleLineId: string;
    saleLinePieceId: string;
    pieceIndex: number;
    pieceTotal: number;
    skuCode: string;
    requestedWidthM: number;
    requestedHeightM: number;
  }>;
  summary: {
    assignedPieces: number;
    unmatchedPieces: number;
    totalPieces: number;
  };
};
