"use server"

import { revalidatePath } from "next/cache"
import {
  createPalletCustodian,
  createPalletTransfer,
  createPhysicalPallet,
  movePhysicalPallets,
  postPalletTransfer,
  reversePalletTransfer,
  type CreatePalletTransferInput,
} from "@/lib/warehouse/pallet-ledger-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error occurred."
}

function revalidatePallet(id?: string) {
  revalidatePath("/forms/warehouse/gatepass")
}

export async function createPalletCustodianAction(input: {
  kind: "CUSTOMER" | "TRANSPORTER"
  name: string
  externalReference?: string | null
}) {
  try {
    const custodian = await createPalletCustodian(input)
    revalidatePallet()
    return { success: true as const, data: custodian }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}

export async function createPalletTransferAction(input: CreatePalletTransferInput) {
  try {
    const transfer = await createPalletTransfer(input)
    revalidatePallet(transfer.id)
    return { success: true as const, data: { id: transfer.id, transferNo: transfer.transferNo } }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}

export async function postPalletTransferAction(transferId: string) {
  try {
    await postPalletTransfer(transferId)
    revalidatePallet(transferId)
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}

export async function reversePalletTransferAction(transferId: string, reason: string) {
  try {
    const reversal = await reversePalletTransfer(transferId, reason)
    revalidatePallet(transferId)
    revalidatePallet(reversal.reversalId)
    return { success: true as const, data: reversal }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}

export async function createPhysicalPalletAction(input: { palletCode: string; palletTypeId: string; currentCustodianId?: string | null }) {
  try {
    const data = await createPhysicalPallet(input)
    revalidatePallet()
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}

export async function movePhysicalPalletsAction(input: { palletCodes: string[]; toCustodianId: string; gatePassId?: string | null; distributionOrderId?: string | null; condition?: "USABLE" | "DAMAGED" | "LOST"; remarks?: string | null }) {
  try {
    const data = await movePhysicalPallets(input)
    revalidatePallet()
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error: errorMessage(error) }
  }
}
