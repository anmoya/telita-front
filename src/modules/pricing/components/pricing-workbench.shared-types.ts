export type MenuKey = "dashboard" | "pricing" | "sales" | "cuts" | "scraps" | "labels" | "audit" | "settings" | "historial-cotizaciones";

export type ScrapLocationPolicy = "AT_CUT_REQUIRE_LOCATION" | "AT_CUT_ROUTE_TO_INBOUND";

export type ScrapPolicy = {
  classificationRule: unknown;
  locationPolicy: ScrapLocationPolicy;
  minWidthCm: number | null;
};

export type CutScrapLookupMode = "OFF" | "MANUAL" | "AUTO_SUGGEST" | "REQUIRE_DECISION";
export type CutScrapLookupScope = "CURRENT_LINE" | "ENTIRE_ORDER";

export type CutScrapLookupPolicy = {
  mode: CutScrapLookupMode;
  scope: CutScrapLookupScope;
  allowManualSearch: boolean;
  maxSuggestionsPerLine: number;
};

export type CompatibleScrapSuggestion = {
  scrapId: string;
  labelCode?: string;
  locationCode: string | null;
  widthM: number;
  heightM: number;
  areaM2?: number;
  excessAreaM2?: number;
  fitScore?: number;
  createdAt?: string;
};

export type SoftHoldPolicy = {
  enabled: boolean;
  defaultMinutes: number;
  maxMinutes: number;
};

export type SoftHoldInfo = {
  active: boolean;
  id?: string;
  scrapId?: string;
  saleId?: string;
  saleLineId?: string;
  status?: string;
  expiresAt?: string;
  heldBy?: { email: string; fullName: string };
  reason?: string;
};

export type CompatibleScrapLine = {
  saleLineId: string;
  skuCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  suggestions: CompatibleScrapSuggestion[];
};

export type CompatibleScrapsResult = {
  policy?: CutScrapLookupPolicy;
  saleId: string;
  cutJobId?: string;
  lines: CompatibleScrapLine[];
};

export type ActiveModal =
  | { type: "pre-cut-location"; cutJobId: string }
  | { type: "assign-scrap-location"; scrapId: string }
  | { type: "cut-compatible-scraps"; cutJobId: string }
  | { type: "require-decision-scraps"; cutJobId: string }
  | { type: "offer-preview"; saleId: string }
  | { type: "sale-lines"; saleId: string }
  | null;

export type QuoteItem = {
  id: string;
  widthM: string;
  heightM: string;
  quantity: string;
  description?: string;
  skuCode?: string;
  calcStatus?: "pending" | "ok" | "error";
  calcError?: string;
  quoteId?: string;
  unitPrice?: number;
  subtotal?: number;
  priceMethod?: string;
  categoryId?: string;
  categoryName?: string;
  lineNote?: string;
  roomAreaName?: string;
};

export type QuoteItemCategory = {
  id: string;
  name: string;
  isActive: boolean;
};

export type PreviewLine = {
  index: number;
  skuCode: string;
  description: string;
  categoryName: string | null;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceMethod: string;
  linearMeters?: number;
  error?: string;
};

export type PreviewResult = {
  header: { branchName: string; date: string; priceListName: string };
  customer: { name: string | null; reference: string | null };
  lines: PreviewLine[];
  totals: { subtotal: number; tax: number; total: number; currencyCode: string };
  hasErrors: boolean;
  internalBreakdown?: unknown;
};

export type QuoteRow = {
  id: string;
  currencyCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  unitPrice: number;
  linearMeters: number;
  subtotalAmount: number;
  totalRounded: number;
  createdAt: string;
};

export type SaleLineRow = {
  id: string;
  skuCode: string;
  quantity: number;
  requestedWidthM: number;
  requestedHeightM: number;
  unitPrice: number;
  lineSubtotal: number;
  lineTotal: number;
  discountPct: number;
  allocatedScrapId: string | null;
  allocatedScrapPositions: string[];
  categoryId: string | null;
  categoryName: string | null;
  displayOrder: number;
  lineNote: string | null;
  roomAreaName: string | null;
  pieces: Array<{
    id: string;
    pieceIndex: number;
    pieceTotal: number;
    requestedWidthM: number;
    requestedHeightM: number;
    roomAreaName: string | null;
    allocation: {
      scrapId: string;
      locationCode: string | null;
    } | null;
  }>;
};

export type ScrapMatchRow = {
  id: string;
  labelCode?: string;
  widthM: number;
  heightM: number;
  areaM2: number;
  excessAreaM2: number;
  skuCode: string;
  locationCode: string | null;
};

export type SaleLineCompatibleScrapsResponse = {
  saleId: string;
  saleLineId: string;
  skuCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  freePieces: Array<{
    id: string;
    pieceIndex: number;
    pieceTotal: number;
  }>;
  suggestions: Array<{
    scrapId: string;
    labelCode: string;
    locationCode: string | null;
    widthM: number;
    heightM: number;
    areaM2: number;
    excessAreaM2: number;
    createdAt: string;
  }>;
};

export type SaleRow = {
  id: string;
  status: string;
  quoteCode: string | null;
  quoteNumber: number | null;
  customerId: string | null;
  customerName: string | null;
  customerReference: string | null;
  customer: {
    id: string;
    code: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    companyOrReference: string | null;
    discountCode: string | null;
  } | null;
  manualDiscountPct: number;
  manualDiscountReason: string | null;
  discountSource: string;
  discountCodeApplied: string | null;
  discountPctApplied: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  lines: SaleLineRow[];
};

export type SaleLineDraft = {
  id: string;
  skuCode: string;
  categoryId: string;
  widthM: string;
  heightM: string;
  quantity: string;
  lineNote: string;
  isNew?: boolean;
};

export type CustomerOption = {
  id: string;
  code: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  companyOrReference: string | null;
  preferredPriceListName: string | null;
  discountCode: string | null;
  discountPct: number;
  notes: string | null;
  isActive: boolean;
};

export type ScrapRow = {
  id: string;
  status: string;
  areaM2: number;
  widthM: number;
  heightM: number;
  skuCode: string;
  locationCode: string | null;
  quoteId: string | null;
  createdAt: string;
};

export type DashboardKpis = {
  date: string;
  branchCode: string;
  quotesCreatedToday: number;
  salesConfirmedToday: number;
  salesCanceledToday: number;
  pendingScraps: number;
  labelsPrintedToday: number;
};

export type PendingScrapRow = {
  id: string;
  createdAt: string;
  areaM2: number;
  widthM: number;
  heightM: number;
  skuCode: string;
  skuName: string;
  quoteId: string | null;
  quoteCreatedAt: string | null;
};

export type BatchLabelResult = {
  labelId: string;
  saleLineId: string;
  saleLinePieceId: string;
  skuCode: string;
  pieceIndex: number;
  pieceTotal: number;
  roomAreaName: string | null;
  printEventId: string;
};

export type LabelRow = {
  id: string;
  type: string;
  saleLineId: string | null;
  scrapId: string | null;
  quoteId: string | null;
  createdAt: string;
  lastPrintedAt: string | null;
};

export type AuditRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: { email: string; fullName: string; role: string };
  beforeJson?: unknown;
  afterJson?: unknown;
  createdAt: string;
};

export type CutJobStatus = "PENDING" | "IN_PROGRESS" | "CUT" | "DELIVERED";

export type CutJobRow = {
  id: string;
  saleId: string;
  saleLineId: string;
  status: CutJobStatus;
  cutAt: string | null;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  skuCode: string;
  skuName: string;
  saleCreatedAt: string;
};
