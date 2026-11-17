import fs from 'fs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("Starting DPR PDF import...");

  const reports = JSON.parse(
    fs.readFileSync(
      'C:/Users/user/.gemini/antigravity/brain/e06ed0a9-cc10-424a-828d-8206e9ebf513/scratch/all_parsed_reports.json',
      'utf8'
    )
  );

  console.log(`Found ${reports.length} parsed reports to import.`);

  // Find Superadmin user for createdById
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  if (!adminUser) {
    throw new Error("No SUPERADMIN user found in database!");
  }

  const userId = adminUser.id;
  console.log(`Using Superadmin user: ${adminUser.name} (${userId})`);

  let importedReports = 0;
  let totalBatches = 0;
  let totalBoxes = 0;

  // We will divide:
  // Reports 1 to 16 (Dates Nov 2 to Nov 5) will have an initial Handover created and marked RECEIVED into Warehouse InventoryBatch.
  // Reports 17 to 23 (Dates Nov 6 to Nov 7) will remain as active Production floor stock awaiting handover.

  for (const [idx, r] of reports.entries()) {
    const reportDate = new Date(`${r.date}T00:00:00.000Z`);

    // Check if report already exists
    const existing = await prisma.dailyReport.findFirst({
      where: {
        date: reportDate,
        shift: r.shift,
        line: r.line
      }
    });

    if (existing) {
      console.log(`Report #${idx + 1} (${r.date} ${r.shift} ${r.line}) already exists, skipping.`);
      continue;
    }

    // Create DailyReport with relations
    const dailyReport = await prisma.dailyReport.create({
      data: {
        date: reportDate,
        shift: r.shift,
        line: r.line,
        time: r.time,
        reportTime: r.time,
        totalManpower: r.totalManpower,
        maxTotalManpower: r.maxTotalManpower,
        preparedBy: r.preparedBy,
        verifiedBy: r.verifiedBy,
        remarks: r.remarks,
        status: "APPROVED",
        approvedAt: new Date(`${r.date}T12:00:00.000Z`),
        createdById: userId,
        productions: {
          create: r.productions.map((p: any) => ({
            productType: p.productType,
            totalBox: p.totalBox,
            batches: {
              create: p.batches.map((b: any) => ({
                batchNo: b.batchNo,
                qty: b.qty,
                type: b.type
              }))
            }
          }))
        },
        rejects: {
          create: r.rejects.map((rej: any) => ({
            item: rej.item,
            before: rej.before,
            after: rej.after,
            type: "SCRAP"
          }))
        },
        breakdowns: {
          create: r.breakdowns.map((bd: any) => ({
            section: bd.section,
            downtime: bd.downtime,
            reason: bd.reason
          }))
        }
      },
      include: {
        productions: {
          include: {
            batches: true
          }
        }
      }
    });

    importedReports++;

    for (const prod of dailyReport.productions) {
      totalBoxes += prod.totalBox;
      totalBatches += prod.batches.length;
    }

    // Reports 1 to 16: generate completed Handover received into Warehouse
    // Reports 17 to 23: remain unreceived (in Production)
    if (idx < 16) {
      const hoNumber = `HO-2611${String(idx + 1).padStart(4, '0')}`;
      
      const handoverItems: any[] = [];
      for (const prod of dailyReport.productions) {
        for (const b of prod.batches) {
          handoverItems.push({
            category: prod.productType,
            batchNo: b.batchNo,
            type: b.type,
            totalProducedPcs: b.qty,
            netToWarehousePcs: b.qty
          });
        }
      }

      if (handoverItems.length > 0) {
        const handover = await prisma.productionHandover.create({
          data: {
            handoverNumber: hoNumber,
            date: reportDate,
            dailyReportId: dailyReport.id,
            productionStaffId: userId,
            warehouseStaffId: userId,
            status: "RECEIVED",
            createdAt: new Date(`${r.date}T18:00:00.000Z`),
            updatedAt: new Date(`${r.date}T19:00:00.000Z`),
            items: {
              create: handoverItems
            }
          }
        });

        // Add to Warehouse InventoryBatch
        for (const item of handoverItems) {
          // Normalize SKU code for InventoryBatch
          let skuCode = item.category;
          if (skuCode.includes("425") && skuCode.includes("24")) skuCode = "p425_24";
          else if (skuCode.includes("800") && skuCode.includes("20")) skuCode = "p800_20";
          else if (skuCode.includes("800") && skuCode.includes("12")) skuCode = "p800_12";

          await prisma.inventoryBatch.upsert({
            where: {
              sku_batchNumber: {
                sku: skuCode,
                batchNumber: item.batchNo
              }
            },
            update: {
              totalQtyIn: { increment: item.netToWarehousePcs },
              availableBalance: { increment: item.netToWarehousePcs },
              updatedAt: new Date(`${r.date}T19:00:00.000Z`)
            },
            create: {
              batchNumber: item.batchNo,
              sku: skuCode,
              totalQtyIn: item.netToWarehousePcs,
              totalQtyOut: 0,
              availableBalance: item.netToWarehousePcs,
              createdAt: new Date(`${r.date}T18:00:00.000Z`),
              updatedAt: new Date(`${r.date}T19:00:00.000Z`)
            }
          });
        }
      }
    }
  }

  console.log(`\n=== IMPORT SUMMARY ===`);
  console.log(`Imported Daily Reports: ${importedReports}`);
  console.log(`Total Batches Processed: ${totalBatches}`);
  console.log(`Total Boxes Processed: ${totalBoxes}`);

  // Query database state to verify
  const warehouseBatches = await prisma.inventoryBatch.findMany();
  const totalWhStock = warehouseBatches.reduce((sum, b) => sum + b.availableBalance, 0);
  console.log(`Warehouse Inventory Batches: ${warehouseBatches.length} batches, Total ${totalWhStock} boxes in warehouse`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
