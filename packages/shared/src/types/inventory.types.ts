export interface Food {
  id: string;
  fdcId?: string;
  barcode?: string;
  name: string;
  nameEs: string;
  category: string;
  source: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
  servingSizeG: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  foodId?: string;
  food?: Food;
  customName?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  addedAt: string;
  daysUntilExpiry?: number;
}

export interface AddInventoryItemInput {
  foodId?: string;
  customName?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
}

export interface UpdateInventoryItemInput {
  quantity?: number;
  unit?: string;
  expiryDate?: string;
}
