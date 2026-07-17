import "dotenv/config";
import sequelize from "../db/connection.js";
import { Medicine } from "../models/index.js";

// Each entry is location-aware: `section` is the labelled cabinet/room a
// pharmacist walks to; `aisle` + `shelf` pinpoint the exact spot.
const CATALOGUE = [
  // ── Antibiotics Cabinet ──────────────────────────────────────────────
  {
    name: "Amoxil 500", generic_name: "Amoxicillin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S1",
    form: "Capsule", strength: "500 mg", unit_price: 0.35, stock: 240, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
  },
  {
    name: "Azithral 500", generic_name: "Azithromycin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S2",
    form: "Tablet", strength: "500 mg", unit_price: 0.80, stock: 180, reorder_threshold: 60,
    manufacturer: "Alembic Pharma", requires_prescription: true,
  },
  {
    name: "Ciplox 500", generic_name: "Ciprofloxacin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S3",
    form: "Tablet", strength: "500 mg", unit_price: 0.45, stock: 15, reorder_threshold: 50,
    manufacturer: "Cipla", requires_prescription: true,
  },
  {
    name: "Doxy 100", generic_name: "Doxycycline", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A2", shelf: "S1",
    form: "Capsule", strength: "100 mg", unit_price: 0.30, stock: 160, reorder_threshold: 60,
    manufacturer: "Pfizer", requires_prescription: true,
  },

  // ── Analgesics & Antipyretics ────────────────────────────────────────
  {
    name: "Paracip 500", generic_name: "Paracetamol", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.05, stock: 900, reorder_threshold: 300,
    manufacturer: "Cipla", requires_prescription: false,
  },
  {
    name: "Brufen 400", generic_name: "Ibuprofen", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S2",
    form: "Tablet", strength: "400 mg", unit_price: 0.10, stock: 520, reorder_threshold: 200,
    manufacturer: "Abbott", requires_prescription: false,
  },
  {
    name: "Voveran 50", generic_name: "Diclofenac Sodium", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S3",
    form: "Tablet", strength: "50 mg", unit_price: 0.20, stock: 280, reorder_threshold: 100,
    manufacturer: "Novartis", requires_prescription: true,
  },
  {
    name: "Ultracet", generic_name: "Tramadol + Paracetamol", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B2", shelf: "S1",
    form: "Tablet", strength: "37.5/325 mg", unit_price: 0.90, stock: 90, reorder_threshold: 40,
    manufacturer: "Janssen", requires_prescription: true,
  },

  // ── Cardiovascular Room ──────────────────────────────────────────────
  {
    name: "Ecosprin 75", generic_name: "Aspirin", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C1", shelf: "S1",
    form: "Tablet", strength: "75 mg", unit_price: 0.08, stock: 600, reorder_threshold: 200,
    manufacturer: "USV", requires_prescription: false,
  },
  {
    name: "Atorva 20", generic_name: "Atorvastatin", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C1", shelf: "S2",
    form: "Tablet", strength: "20 mg", unit_price: 0.40, stock: 340, reorder_threshold: 120,
    manufacturer: "Zydus", requires_prescription: true,
  },
  {
    name: "Losar 50", generic_name: "Losartan", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C2", shelf: "S1",
    form: "Tablet", strength: "50 mg", unit_price: 0.30, stock: 210, reorder_threshold: 80,
    manufacturer: "Torrent", requires_prescription: true,
  },
  {
    name: "Concor 5", generic_name: "Bisoprolol", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C2", shelf: "S2",
    form: "Tablet", strength: "5 mg", unit_price: 0.35, stock: 140, reorder_threshold: 60,
    manufacturer: "Merck", requires_prescription: true,
  },

  // ── Endocrine / Diabetes ─────────────────────────────────────────────
  {
    name: "Glycomet 500", generic_name: "Metformin", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D1", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.10, stock: 480, reorder_threshold: 150,
    manufacturer: "USV", requires_prescription: true,
  },
  {
    name: "Amaryl 2", generic_name: "Glimepiride", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D1", shelf: "S2",
    form: "Tablet", strength: "2 mg", unit_price: 0.25, stock: 130, reorder_threshold: 60,
    manufacturer: "Sanofi", requires_prescription: true,
  },
  {
    name: "Lantus SoloStar", generic_name: "Insulin Glargine", category: "Endocrine",
    section: "Cold-Chain Fridge", aisle: "F1", shelf: "S1",
    form: "Injection", strength: "100 IU/ml", unit_price: 22.00, stock: 8, reorder_threshold: 20,
    manufacturer: "Sanofi", requires_prescription: true,
  },
  {
    name: "Eltroxin 50", generic_name: "Levothyroxine", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D2", shelf: "S1",
    form: "Tablet", strength: "50 mcg", unit_price: 0.12, stock: 260, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
  },

  // ── Respiratory Corner ───────────────────────────────────────────────
  {
    name: "Asthalin Inhaler", generic_name: "Salbutamol", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E1", shelf: "S1",
    form: "Inhaler", strength: "100 mcg/dose", unit_price: 3.50, stock: 12, reorder_threshold: 25,
    manufacturer: "Cipla", requires_prescription: true,
  },
  {
    name: "Montek LC", generic_name: "Montelukast + Levocetirizine", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E1", shelf: "S2",
    form: "Tablet", strength: "10/5 mg", unit_price: 0.55, stock: 220, reorder_threshold: 80,
    manufacturer: "Sun Pharma", requires_prescription: true,
  },
  {
    name: "Ascoril LS Syrup", generic_name: "Ambroxol + Guaifenesin", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E2", shelf: "S1",
    form: "Syrup", strength: "30/50 mg/5 ml", unit_price: 2.20, stock: 65, reorder_threshold: 30,
    manufacturer: "Glenmark", requires_prescription: false,
  },

  // ── Allergy & Antihistamines ─────────────────────────────────────────
  {
    name: "Cetzine 10", generic_name: "Cetirizine", category: "Antihistamines",
    section: "Antihistamines Shelf", aisle: "G1", shelf: "S1",
    form: "Tablet", strength: "10 mg", unit_price: 0.06, stock: 700, reorder_threshold: 200,
    manufacturer: "Dr. Reddy's", requires_prescription: false,
  },
  {
    name: "Allegra 180", generic_name: "Fexofenadine", category: "Antihistamines",
    section: "Antihistamines Shelf", aisle: "G1", shelf: "S2",
    form: "Tablet", strength: "180 mg", unit_price: 0.50, stock: 180, reorder_threshold: 60,
    manufacturer: "Sanofi", requires_prescription: false,
  },

  // ── Gastro / GI ──────────────────────────────────────────────────────
  {
    name: "Pantop 40", generic_name: "Pantoprazole", category: "Gastro",
    section: "Gastro Cabinet", aisle: "H1", shelf: "S1",
    form: "Tablet", strength: "40 mg", unit_price: 0.18, stock: 400, reorder_threshold: 150,
    manufacturer: "Aristo", requires_prescription: false,
  },
  {
    name: "Ondem 4", generic_name: "Ondansetron", category: "Gastro",
    section: "Gastro Cabinet", aisle: "H1", shelf: "S2",
    form: "Tablet", strength: "4 mg", unit_price: 0.22, stock: 160, reorder_threshold: 80,
    manufacturer: "Alkem", requires_prescription: true,
  },
  {
    name: "ORS Sachet", generic_name: "Oral Rehydration Salts", category: "Gastro",
    section: "OTC Front Counter", aisle: "OTC", shelf: "S1",
    form: "Sachet", strength: "21 g", unit_price: 0.30, stock: 800, reorder_threshold: 300,
    manufacturer: "WHO Formula", requires_prescription: false,
  },
];

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });

  let created = 0;
  let skipped = 0;

  for (const item of CATALOGUE) {
    const [, wasCreated] = await Medicine.findOrCreate({
      where: { name: item.name },
      defaults: item,
    });
    if (wasCreated) created += 1;
    else skipped += 1;
  }

  console.log(`\n=== Medicine catalogue seeded ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already existed): ${skipped}`);
  console.log(`  Total in catalogue file: ${CATALOGUE.length}\n`);

  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to seed medicines:", err);
  process.exit(1);
});
