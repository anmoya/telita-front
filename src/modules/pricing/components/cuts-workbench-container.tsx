"use client";

import { getStatusLabel, type StatusLabelsByEntity } from "../../../shared/api/status-labels";
import { CutsWorkbench } from "./cuts-workbench";
import type {
  CompatibleScrapsResult,
  CutJobRow,
  CutJobStatus,
  CutScrapLookupPolicy,
  ScrapPolicy,
  SoftHoldInfo,
  SoftHoldPolicy
} from "./pricing-workbench.shared-types";

type CutsWorkbenchContainerProps = {
  loadingMenu: boolean;
  cutsStatus: string;
  cutJobs: CutJobRow[];
  cutPage: number;
  cutPageCount: number;
  totalCuts: number;
  cutFilterStatus: CutJobStatus | "ALL";
  compatibleScrapsStatus: string;
  scrapPolicy: ScrapPolicy | null;
  cutScrapPolicy: CutScrapLookupPolicy | null;
  loadingActionId: string | null;
  isPreCutLocationOpen: boolean;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  isCompatibleDialogOpen: boolean;
  isRequireDecisionMode: boolean;
  decisionCutJobId?: string;
  compatibleScrapsResult: CompatibleScrapsResult | null;
  softHolds: Record<string, SoftHoldInfo>;
  softHoldPolicy: SoftHoldPolicy | null;
  statusLabels: StatusLabelsByEntity;
  onSetCutFilterStatus: (value: CutJobStatus | "ALL") => void;
  onPrevCutPage: () => void;
  onNextCutPage: () => void;
  onRefreshCutJobs: () => void;
  onCheckCompatibleScraps: (cutJobId: string) => void;
  onMarkCutClick: (cutJobId: string) => void;
  onModalLocationCodeChange: (value: string) => void;
  onConfirmModalMarkCut: () => void;
  onClosePreCutLocation: () => void;
  onCloseCompatibleDialog: () => void;
  onSkipCompatibleScraps: (cutJobId: string) => void;
  onAllocateCompatibleScrap: (saleId: string, saleLineId: string, scrapId: string) => void;
  onCreateSoftHold: (scrapId: string, saleId: string, saleLineId?: string) => void;
  onReleaseSoftHold: (scrapId: string) => void;
  onCompatibleStatusChange: (value: string) => void;
};

export function CutsWorkbenchContainer({
  statusLabels,
  ...props
}: CutsWorkbenchContainerProps) {
  return (
    <CutsWorkbench
      {...props}
      getCutStatusLabel={(status) => getStatusLabel(statusLabels, "cut_job", status)}
    />
  );
}
