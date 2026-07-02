// Indian state names used for Place of Supply (GST) dropdowns
export const INDIA_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const STATE_OPTIONS = INDIA_STATES.map((s) => ({ value: s, label: s }));

export interface GstItem {
  quantity?: number;
  unitPrice?: number;
  discountPct?: number;
  gstRate?: number;
}

export interface GstBreakdown {
  taxable: number;
  discountTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  isInterstate: boolean;
}

/** Client-side GST calculation matching the backend calcTotals() logic */
export function calcGst(items: GstItem[], placeOfSupply?: string, labState?: string): GstBreakdown {
  const isInterstate = !!(placeOfSupply && labState && placeOfSupply !== labState);
  let taxable = 0, discountTotal = 0, cgst = 0, sgst = 0, igst = 0;

  for (const item of items) {
    const lineTotal = (item.quantity ?? 0) * (item.unitPrice ?? 0);
    const discAmt = lineTotal * ((item.discountPct ?? 0) / 100);
    const tx = lineTotal - discAmt;
    const gstRate = item.gstRate ?? 18;
    const gstAmt = tx * gstRate / 100;
    taxable += tx;
    discountTotal += discAmt;
    if (isInterstate) { igst += gstAmt; } else { cgst += gstAmt / 2; sgst += gstAmt / 2; }
  }

  const totalTax = cgst + sgst + igst;
  return { taxable, discountTotal, cgst, sgst, igst, totalTax, grandTotal: taxable + totalTax, isInterstate };
}
