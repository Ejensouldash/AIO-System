export const LWI_COMPANY_PROFILE = {
  legalName: "LANGKAWI WATER INDUSTRY SDN. BHD.",
  brandName: "LWI BLUE",
  registrationNo: "201901032145 (1341475-P)",
  addressLines: [
    "LOT 88, KAWASAN PERINDUSTRIAN KILANG,",
    "MUKIM KUAH,",
    "07000 LANGKAWI, KEDAH DARUL AMAN",
  ],
  addressInline:
    "Lot 88, Kawasan Perindustrian Kilang, Mukim Kuah, 07000 Langkawi, Kedah Darul Aman",
  phone: "+60 4-966 8821 / +60 19-472 2601",
  email: "sales@lwiwater.com.my",
  tin: "C28392102010",
  salesTaxRegistrationNo: "K24-2101-32000012",
  website: "www.lwiwater.com.my",
  logoPath: "/assets/LWI_Logo.png",
} as const

export const BUBBLESO2_COMPANY_PROFILE = {
  legalName: "BUBBLES O2 SDN. BHD.",
  registrationNo: "1184139-H",
  addressLines: [
    "LOT 4494, 4495, 4498, 4499,",
    "KAWASAN PERINDUSTRIAN HALAL MIEL,",
    "KAMPUNG MERBAU SEMBILAN,",
    "71400 PEDAS, NEGERI SEMBILAN",
  ],
  addressInline:
    "LOT 4494, 4495, 4498, 4499, KAWASAN PERINDUSTRIAN HALAL MIEL, KAMPUNG MERBAU SEMBILAN, 71400 PEDAS, NEGERI SEMBILAN",
  phone: "03 8922 9858 / 018 2295 235",
  email: "finance@bubbleso2.com",
  tin: "C24477782090",
  salesTaxRegistrationNo: "W24-2101-22000008",
} as const

export const DEFAULT_COMPANY_PROFILE = LWI_COMPANY_PROFILE

export type CompanyProfile = typeof LWI_COMPANY_PROFILE
