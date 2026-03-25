import { CatalogForm } from "../../catalog/components/catalog-form";
import { CustomersForm } from "../../customers/components/customers-form";
import { OperationsWorkbench } from "../../pricing/components/operations-workbench";
import type { MenuKey as WorkbenchMenuKey } from "../../operations/shared/workbench.shared-types";
import { PriceListForm } from "../../pricing/components/price-list-form";
import { QuoteBatchesForm } from "../../quote-batches/components/quote-batches-form";
import { QuoteItemCategoriesForm } from "../../quote-item-categories/components/quote-item-categories-form";
import { StorageLocationsForm } from "../../storage-locations/components/storage-locations-form";
import { MyProfileForm } from "../../users/components/my-profile-form";
import { UsersForm } from "../../users/components/users-form";
import { isOperationsWorkbenchMenu } from "./app-shell.utils";
import type { AppMenuKey, TokenInfo } from "./app-shell.types";

type AppShellContentRouterProps = {
  activeMenu: AppMenuKey;
  accessToken: string;
  apiUrl: string;
  tokenInfo: TokenInfo | null;
  editingBatchId: string | null;
  onNavigateWorkbench: (menu: WorkbenchMenuKey) => void;
  onEditBatch: (batchId: string) => void;
  onClearEditingBatch: () => void;
  onStartTour: () => void;
};

export function AppShellContentRouter({
  activeMenu,
  accessToken,
  apiUrl,
  tokenInfo,
  editingBatchId,
  onNavigateWorkbench,
  onEditBatch,
  onClearEditingBatch,
  onStartTour
}: AppShellContentRouterProps) {
  if (!tokenInfo) {
    return null;
  }

  if (activeMenu === "catalogo") {
    return <CatalogForm accessToken={accessToken} apiUrl={apiUrl} currentUserRole={tokenInfo.role} />;
  }

  if (activeMenu === "usuarios") {
    return (
      <UsersForm
        accessToken={accessToken}
        apiUrl={apiUrl}
        currentUserRole={tokenInfo.role}
        currentUserId={tokenInfo.sub}
      />
    );
  }

  if (activeMenu === "perfil") {
    return (
      <MyProfileForm
        accessToken={accessToken}
        apiUrl={apiUrl}
        currentUserId={tokenInfo.sub}
        onStartTour={onStartTour}
      />
    );
  }

  if (activeMenu === "listas-precios") {
    return <PriceListForm accessToken={accessToken} apiUrl={apiUrl} currentUserRole={tokenInfo.role} />;
  }

  if (activeMenu === "ubicaciones") {
    return <StorageLocationsForm accessToken={accessToken} apiUrl={apiUrl} currentUserRole={tokenInfo.role} />;
  }

  if (activeMenu === "categorias-cotizacion") {
    return <QuoteItemCategoriesForm accessToken={accessToken} apiUrl={apiUrl} currentUserRole={tokenInfo.role} />;
  }

  if (activeMenu === "historial-cotizaciones") {
    return (
      <QuoteBatchesForm
        accessToken={accessToken}
        apiUrl={apiUrl}
        onNavigate={onNavigateWorkbench}
        onEditBatch={onEditBatch}
      />
    );
  }

  if (activeMenu === "clientes") {
    return <CustomersForm accessToken={accessToken} apiUrl={apiUrl} currentUserRole={tokenInfo.role} />;
  }

  if (isOperationsWorkbenchMenu(activeMenu)) {
    return (
      <OperationsWorkbench
        accessToken={accessToken}
        activeMenu={activeMenu}
        onNavigate={onNavigateWorkbench}
        editingBatchId={editingBatchId}
        onClearEditingBatch={onClearEditingBatch}
      />
    );
  }

  return null;
}
