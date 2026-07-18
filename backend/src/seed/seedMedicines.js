import "dotenv/config";
import sequelize from "../db/connection.js";
import { Medicine } from "../models/index.js";

// Each entry is location-aware: `section` is the labelled cabinet/room a
// pharmacist walks to; `aisle` + `shelf` pinpoint the exact spot.
// `description` explains what the drug is used for so a pharmacist (or
// dispensing patient) can confirm they've got the right thing.
const CATALOGUE = [
  // ── Antibiotics Cabinet ──────────────────────────────────────────────
  {
    name: "Amoxil 500", generic_name: "Amoxicillin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S1",
    form: "Capsule", strength: "500 mg", unit_price: 0.35, stock: 240, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
    description: "Broad-spectrum penicillin antibiotic used for ear, chest, throat, and urinary tract infections.",
  },
  {
    name: "Azithral 500", generic_name: "Azithromycin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S2",
    form: "Tablet", strength: "500 mg", unit_price: 0.80, stock: 180, reorder_threshold: 60,
    manufacturer: "Alembic Pharma", requires_prescription: true,
    description: "Macrolide antibiotic for respiratory, skin, and soft-tissue infections; short 3–5 day courses.",
  },
  {
    name: "Ciplox 500", generic_name: "Ciprofloxacin", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A1", shelf: "S3",
    form: "Tablet", strength: "500 mg", unit_price: 0.45, stock: 15, reorder_threshold: 50,
    manufacturer: "Cipla", requires_prescription: true,
    description: "Fluoroquinolone used for urinary, GI, and severe respiratory infections. Avoid with dairy.",
  },
  {
    name: "Doxy 100", generic_name: "Doxycycline", category: "Antibiotics",
    section: "Antibiotics Cabinet", aisle: "A2", shelf: "S1",
    form: "Capsule", strength: "100 mg", unit_price: 0.30, stock: 160, reorder_threshold: 60,
    manufacturer: "Pfizer", requires_prescription: true,
    description: "Tetracycline for acne, malaria prophylaxis, and atypical pneumonia. Take with a full glass of water.",
  },

  // ── Analgesics & Antipyretics ────────────────────────────────────────
  {
    name: "Paracip 500", generic_name: "Paracetamol", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.05, stock: 900, reorder_threshold: 300,
    manufacturer: "Cipla", requires_prescription: false,
    description: "First-line pain reliever and fever reducer. Safe in pregnancy at recommended doses.",
  },
  {
    name: "Brufen 400", generic_name: "Ibuprofen", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S2",
    form: "Tablet", strength: "400 mg", unit_price: 0.10, stock: 520, reorder_threshold: 200,
    manufacturer: "Abbott", requires_prescription: false,
    description: "NSAID for pain, fever, and inflammation. Take with food to protect the stomach.",
  },
  {
    name: "Voveran 50", generic_name: "Diclofenac Sodium", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B1", shelf: "S3",
    form: "Tablet", strength: "50 mg", unit_price: 0.20, stock: 280, reorder_threshold: 100,
    manufacturer: "Novartis", requires_prescription: true,
    description: "Potent NSAID for musculoskeletal pain, arthritis, and post-operative pain relief.",
  },
  {
    name: "Ultracet", generic_name: "Tramadol + Paracetamol", category: "Analgesics",
    section: "Analgesics Shelf", aisle: "B2", shelf: "S1",
    form: "Tablet", strength: "37.5/325 mg", unit_price: 0.90, stock: 90, reorder_threshold: 40,
    manufacturer: "Janssen", requires_prescription: true,
    description: "Opioid-analgesic combination for moderate-to-severe short-term pain. May cause drowsiness.",
  },

  // ── Cardiovascular Room ──────────────────────────────────────────────
  {
    name: "Ecosprin 75", generic_name: "Aspirin", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C1", shelf: "S1",
    form: "Tablet", strength: "75 mg", unit_price: 0.08, stock: 600, reorder_threshold: 200,
    manufacturer: "USV", requires_prescription: false,
    description: "Low-dose antiplatelet to prevent heart attack and stroke in at-risk patients.",
  },
  {
    name: "Atorva 20", generic_name: "Atorvastatin", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C1", shelf: "S2",
    form: "Tablet", strength: "20 mg", unit_price: 0.40, stock: 340, reorder_threshold: 120,
    manufacturer: "Zydus", requires_prescription: true,
    description: "Statin to lower LDL cholesterol and cut cardiovascular risk. Take at night.",
  },
  {
    name: "Losar 50", generic_name: "Losartan", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C2", shelf: "S1",
    form: "Tablet", strength: "50 mg", unit_price: 0.30, stock: 210, reorder_threshold: 80,
    manufacturer: "Torrent", requires_prescription: true,
    description: "ARB for hypertension and diabetic kidney protection.",
  },
  {
    name: "Concor 5", generic_name: "Bisoprolol", category: "Cardiovascular",
    section: "Cardiovascular Room", aisle: "C2", shelf: "S2",
    form: "Tablet", strength: "5 mg", unit_price: 0.35, stock: 140, reorder_threshold: 60,
    manufacturer: "Merck", requires_prescription: true,
    description: "Selective beta-blocker for hypertension, chronic heart failure, and angina.",
  },

  // ── Endocrine / Diabetes ─────────────────────────────────────────────
  {
    name: "Glycomet 500", generic_name: "Metformin", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D1", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.10, stock: 480, reorder_threshold: 150,
    manufacturer: "USV", requires_prescription: true,
    description: "First-line oral therapy for type-2 diabetes. Take with meals.",
  },
  {
    name: "Amaryl 2", generic_name: "Glimepiride", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D1", shelf: "S2",
    form: "Tablet", strength: "2 mg", unit_price: 0.25, stock: 130, reorder_threshold: 60,
    manufacturer: "Sanofi", requires_prescription: true,
    description: "Sulfonylurea that stimulates insulin release in type-2 diabetes.",
  },
  {
    name: "Lantus SoloStar", generic_name: "Insulin Glargine", category: "Endocrine",
    section: "Cold-Chain Fridge", aisle: "F1", shelf: "S1",
    form: "Injection", strength: "100 IU/ml", unit_price: 22.00, stock: 8, reorder_threshold: 20,
    manufacturer: "Sanofi", requires_prescription: true,
    description: "Long-acting basal insulin. Store 2–8 °C; in-use pen at room temperature up to 28 days.",
  },
  {
    name: "Eltroxin 50", generic_name: "Levothyroxine", category: "Endocrine",
    section: "Endocrine Cabinet", aisle: "D2", shelf: "S1",
    form: "Tablet", strength: "50 mcg", unit_price: 0.12, stock: 260, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
    description: "Thyroid hormone replacement for hypothyroidism. Take on empty stomach, 30–60 min before food.",
  },

  // ── Respiratory Corner ───────────────────────────────────────────────
  {
    name: "Asthalin Inhaler", generic_name: "Salbutamol", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E1", shelf: "S1",
    form: "Inhaler", strength: "100 mcg/dose", unit_price: 3.50, stock: 12, reorder_threshold: 25,
    manufacturer: "Cipla", requires_prescription: true,
    description: "Short-acting bronchodilator for asthma / COPD relief. Shake well before use.",
  },
  {
    name: "Montek LC", generic_name: "Montelukast + Levocetirizine", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E1", shelf: "S2",
    form: "Tablet", strength: "10/5 mg", unit_price: 0.55, stock: 220, reorder_threshold: 80,
    manufacturer: "Sun Pharma", requires_prescription: true,
    description: "Combined leukotriene antagonist + antihistamine for allergic rhinitis and asthma.",
  },
  {
    name: "Ascoril LS Syrup", generic_name: "Ambroxol + Guaifenesin", category: "Respiratory",
    section: "Respiratory Corner", aisle: "E2", shelf: "S1",
    form: "Syrup", strength: "30/50 mg/5 ml", unit_price: 2.20, stock: 65, reorder_threshold: 30,
    manufacturer: "Glenmark", requires_prescription: false,
    description: "Expectorant + mucolytic syrup that thins mucus in productive cough.",
  },

  // ── Antihistamines Shelf ─────────────────────────────────────────────
  {
    name: "Cetzine 10", generic_name: "Cetirizine", category: "Antihistamines",
    section: "Antihistamines Shelf", aisle: "G1", shelf: "S1",
    form: "Tablet", strength: "10 mg", unit_price: 0.06, stock: 700, reorder_threshold: 200,
    manufacturer: "Dr. Reddy's", requires_prescription: false,
    description: "Second-generation antihistamine for allergic rhinitis, urticaria, and itching.",
  },
  {
    name: "Allegra 180", generic_name: "Fexofenadine", category: "Antihistamines",
    section: "Antihistamines Shelf", aisle: "G1", shelf: "S2",
    form: "Tablet", strength: "180 mg", unit_price: 0.50, stock: 180, reorder_threshold: 60,
    manufacturer: "Sanofi", requires_prescription: false,
    description: "Non-drowsy antihistamine for chronic idiopathic urticaria and seasonal allergies.",
  },

  // ── Gastro Cabinet ───────────────────────────────────────────────────
  {
    name: "Pantop 40", generic_name: "Pantoprazole", category: "Gastro",
    section: "Gastro Cabinet", aisle: "H1", shelf: "S1",
    form: "Tablet", strength: "40 mg", unit_price: 0.18, stock: 400, reorder_threshold: 150,
    manufacturer: "Aristo", requires_prescription: false,
    description: "Proton-pump inhibitor for acid reflux, GERD, and peptic ulcers. Take 30 min before breakfast.",
  },
  {
    name: "Ondem 4", generic_name: "Ondansetron", category: "Gastro",
    section: "Gastro Cabinet", aisle: "H1", shelf: "S2",
    form: "Tablet", strength: "4 mg", unit_price: 0.22, stock: 160, reorder_threshold: 80,
    manufacturer: "Alkem", requires_prescription: true,
    description: "5-HT3 antagonist for nausea and vomiting from chemotherapy or gastroenteritis.",
  },
  {
    name: "ORS Sachet", generic_name: "Oral Rehydration Salts", category: "Gastro",
    section: "OTC Front Counter", aisle: "OTC", shelf: "S1",
    form: "Sachet", strength: "21 g", unit_price: 0.30, stock: 800, reorder_threshold: 300,
    manufacturer: "WHO Formula", requires_prescription: false,
    description: "WHO-formula electrolyte replacement for diarrhea and dehydration. Reconstitute in 1 L water.",
  },

  // ══════════════════════════════════════════════════════════════════
  // Expanded catalogue: 23 additional medicines across new sections
  // ══════════════════════════════════════════════════════════════════

  // ── Vitamins & Supplements Shelf ─────────────────────────────────────
  {
    name: "Cecon 500", generic_name: "Vitamin C (Ascorbic Acid)", category: "Vitamins",
    section: "Vitamins & Supplements Shelf", aisle: "V1", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.08, stock: 620, reorder_threshold: 200,
    manufacturer: "Abbott", requires_prescription: false,
    description: "Antioxidant supplement supporting immunity, wound healing, and iron absorption.",
  },
  {
    name: "Shelcal 500", generic_name: "Calcium Carbonate + Vitamin D3", category: "Vitamins",
    section: "Vitamins & Supplements Shelf", aisle: "V1", shelf: "S2",
    form: "Tablet", strength: "500 mg / 250 IU", unit_price: 0.15, stock: 480, reorder_threshold: 150,
    manufacturer: "Torrent", requires_prescription: false,
    description: "Bone-health supplement for osteoporosis, pregnancy, and calcium deficiency.",
  },
  {
    name: "Fefol 150", generic_name: "Ferrous Sulfate + Folic Acid", category: "Vitamins",
    section: "Vitamins & Supplements Shelf", aisle: "V1", shelf: "S3",
    form: "Capsule", strength: "150 mg / 500 mcg", unit_price: 0.12, stock: 350, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: false,
    description: "Iron + folate supplement for iron-deficiency anemia and antenatal use.",
  },
  {
    name: "Neurobion Forte", generic_name: "Vitamin B-Complex", category: "Vitamins",
    section: "Vitamins & Supplements Shelf", aisle: "V2", shelf: "S1",
    form: "Tablet", strength: "B1 + B6 + B12", unit_price: 0.20, stock: 300, reorder_threshold: 100,
    manufacturer: "Merck", requires_prescription: false,
    description: "B-complex supplement supporting nerve function and treating peripheral neuropathy.",
  },

  // ── Dermatology Cabinet ──────────────────────────────────────────────
  {
    name: "Betnovate-N", generic_name: "Betamethasone + Neomycin", category: "Dermatology",
    section: "Dermatology Cabinet", aisle: "K1", shelf: "S1",
    form: "Cream", strength: "20 g tube", unit_price: 1.80, stock: 140, reorder_threshold: 50,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
    description: "Topical steroid + antibiotic cream for inflamed, infected skin conditions like eczema.",
  },
  {
    name: "Clobetamil-G", generic_name: "Clobetasol Propionate", category: "Dermatology",
    section: "Dermatology Cabinet", aisle: "K1", shelf: "S2",
    form: "Cream", strength: "0.05%, 15 g", unit_price: 2.20, stock: 90, reorder_threshold: 40,
    manufacturer: "Sun Pharma", requires_prescription: true,
    description: "Potent topical corticosteroid for severe psoriasis and refractory dermatitis. Short-term use only.",
  },
  {
    name: "Candid Cream", generic_name: "Clotrimazole", category: "Dermatology",
    section: "Dermatology Cabinet", aisle: "K2", shelf: "S1",
    form: "Cream", strength: "1%, 20 g", unit_price: 1.20, stock: 200, reorder_threshold: 80,
    manufacturer: "Glenmark", requires_prescription: false,
    description: "Broad-spectrum antifungal for ringworm, athlete's foot, and candidal infections.",
  },

  // ── Ophthalmic Corner ────────────────────────────────────────────────
  {
    name: "Moxicip Eye Drops", generic_name: "Moxifloxacin", category: "Ophthalmic",
    section: "Ophthalmic Corner", aisle: "O1", shelf: "S1",
    form: "Eye Drops", strength: "0.5%, 5 ml", unit_price: 2.50, stock: 110, reorder_threshold: 40,
    manufacturer: "Cipla", requires_prescription: true,
    description: "Fluoroquinolone eye drop for bacterial conjunctivitis and corneal ulcers.",
  },
  {
    name: "Timolet 0.5", generic_name: "Timolol Maleate", category: "Ophthalmic",
    section: "Ophthalmic Corner", aisle: "O1", shelf: "S2",
    form: "Eye Drops", strength: "0.5%, 5 ml", unit_price: 3.10, stock: 70, reorder_threshold: 30,
    manufacturer: "Sun Pharma", requires_prescription: true,
    description: "Beta-blocker eye drop that lowers intra-ocular pressure in open-angle glaucoma.",
  },
  {
    name: "Systane Ultra", generic_name: "Polyethylene Glycol + Propylene Glycol", category: "Ophthalmic",
    section: "Ophthalmic Corner", aisle: "O2", shelf: "S1",
    form: "Eye Drops", strength: "10 ml", unit_price: 4.50, stock: 55, reorder_threshold: 25,
    manufacturer: "Alcon", requires_prescription: false,
    description: "Preservative-friendly lubricating drop for dry-eye syndrome and screen-related eye strain.",
  },

  // ── Neurology & Psychiatry Cabinet ───────────────────────────────────
  {
    name: "Alprax 0.5", generic_name: "Alprazolam", category: "Neurology & Psychiatry",
    section: "Controlled Substances Cabinet", aisle: "N1", shelf: "S1",
    form: "Tablet", strength: "0.5 mg", unit_price: 0.40, stock: 60, reorder_threshold: 30,
    manufacturer: "Torrent", requires_prescription: true,
    description: "Short-acting benzodiazepine for anxiety and panic disorders. Controlled — track dispensing.",
  },
  {
    name: "Zoloft 50", generic_name: "Sertraline", category: "Neurology & Psychiatry",
    section: "Neurology & Psychiatry Cabinet", aisle: "N2", shelf: "S1",
    form: "Tablet", strength: "50 mg", unit_price: 0.55, stock: 130, reorder_threshold: 50,
    manufacturer: "Pfizer", requires_prescription: true,
    description: "SSRI antidepressant for major depression, OCD, PTSD, and social anxiety.",
  },
  {
    name: "Gabapin 300", generic_name: "Gabapentin", category: "Neurology & Psychiatry",
    section: "Neurology & Psychiatry Cabinet", aisle: "N2", shelf: "S2",
    form: "Capsule", strength: "300 mg", unit_price: 0.45, stock: 150, reorder_threshold: 60,
    manufacturer: "Intas", requires_prescription: true,
    description: "Anticonvulsant used for neuropathic pain, seizures, and restless-leg syndrome.",
  },
  {
    name: "Levipil 500", generic_name: "Levetiracetam", category: "Neurology & Psychiatry",
    section: "Neurology & Psychiatry Cabinet", aisle: "N3", shelf: "S1",
    form: "Tablet", strength: "500 mg", unit_price: 0.85, stock: 90, reorder_threshold: 40,
    manufacturer: "Sun Pharma", requires_prescription: true,
    description: "Broad-spectrum antiepileptic for partial-onset and generalized seizures.",
  },

  // ── Anti-viral / Immunology Cabinet ──────────────────────────────────
  {
    name: "Zovirax 400", generic_name: "Acyclovir", category: "Antivirals",
    section: "Antivirals Cabinet", aisle: "I1", shelf: "S1",
    form: "Tablet", strength: "400 mg", unit_price: 0.70, stock: 80, reorder_threshold: 30,
    manufacturer: "GlaxoSmithKline", requires_prescription: true,
    description: "Antiviral for herpes simplex, herpes zoster (shingles), and chickenpox.",
  },
  {
    name: "Tamiflu 75", generic_name: "Oseltamivir", category: "Antivirals",
    section: "Antivirals Cabinet", aisle: "I1", shelf: "S2",
    form: "Capsule", strength: "75 mg", unit_price: 5.20, stock: 45, reorder_threshold: 20,
    manufacturer: "Roche", requires_prescription: true,
    description: "Neuraminidase inhibitor for influenza A and B; start within 48 h of symptoms.",
  },

  // ── Pediatric Corner ─────────────────────────────────────────────────
  {
    name: "Calpol 250 Syrup", generic_name: "Paracetamol Pediatric", category: "Pediatric",
    section: "Pediatric Corner", aisle: "P1", shelf: "S1",
    form: "Syrup", strength: "250 mg/5 ml, 60 ml", unit_price: 1.10, stock: 240, reorder_threshold: 100,
    manufacturer: "GlaxoSmithKline", requires_prescription: false,
    description: "Pediatric paracetamol syrup for fever and mild pain. Dose by weight, not age.",
  },
  {
    name: "Zincovit Syrup", generic_name: "Multivitamin + Zinc", category: "Pediatric",
    section: "Pediatric Corner", aisle: "P1", shelf: "S2",
    form: "Syrup", strength: "200 ml", unit_price: 2.60, stock: 130, reorder_threshold: 50,
    manufacturer: "Apex Labs", requires_prescription: false,
    description: "Pediatric multivitamin + zinc syrup supporting growth, appetite, and immunity.",
  },

  // ── Emergency Cart (crash-cart drugs, kept in ER-adjacent lockbox) ──
  {
    name: "Adrenaline Injection", generic_name: "Epinephrine", category: "Emergency",
    section: "Emergency Cart", aisle: "M1", shelf: "S1",
    form: "Injection", strength: "1 mg/ml, 1 ml amp", unit_price: 1.80, stock: 40, reorder_threshold: 20,
    manufacturer: "Neon Labs", requires_prescription: true,
    description: "First-line for anaphylaxis, cardiac arrest, and severe asthma. IM in the anterolateral thigh.",
  },
  {
    name: "Atropine Injection", generic_name: "Atropine Sulfate", category: "Emergency",
    section: "Emergency Cart", aisle: "M1", shelf: "S2",
    form: "Injection", strength: "0.6 mg/ml, 1 ml amp", unit_price: 1.50, stock: 30, reorder_threshold: 15,
    manufacturer: "Samarth", requires_prescription: true,
    description: "Anticholinergic for symptomatic bradycardia and organophosphate poisoning.",
  },
  {
    name: "Dextrose 25%", generic_name: "Dextrose", category: "Emergency",
    section: "Emergency Cart", aisle: "M1", shelf: "S3",
    form: "Injection", strength: "25%, 100 ml", unit_price: 0.90, stock: 60, reorder_threshold: 25,
    manufacturer: "Baxter", requires_prescription: true,
    description: "Concentrated glucose IV to reverse severe hypoglycemia in adults.",
  },

  // ── Reproductive Health Shelf ────────────────────────────────────────
  {
    name: "Mala-N", generic_name: "Levonorgestrel + Ethinyl Estradiol", category: "Reproductive Health",
    section: "Reproductive Health Shelf", aisle: "R1", shelf: "S1",
    form: "Tablet", strength: "0.15/0.03 mg", unit_price: 0.90, stock: 180, reorder_threshold: 60,
    manufacturer: "HLL Lifecare", requires_prescription: false,
    description: "Combined oral contraceptive taken daily for pregnancy prevention.",
  },
  {
    name: "Folvite 5", generic_name: "Folic Acid", category: "Reproductive Health",
    section: "Reproductive Health Shelf", aisle: "R1", shelf: "S2",
    form: "Tablet", strength: "5 mg", unit_price: 0.06, stock: 400, reorder_threshold: 150,
    manufacturer: "Pfizer", requires_prescription: false,
    description: "Prenatal folate supplement that lowers the risk of neural-tube defects. Start pre-conception.",
  },
];

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });

  let created = 0;
  let updated = 0;

  // findOrCreate + backfill: existing entries get description updates without duplicating rows
  for (const item of CATALOGUE) {
    const [row, wasCreated] = await Medicine.findOrCreate({
      where: { name: item.name },
      defaults: item,
    });
    if (wasCreated) {
      created += 1;
    } else if (!row.description && item.description) {
      await row.update({ description: item.description });
      updated += 1;
    }
  }

  console.log(`\n=== Medicine catalogue seeded ===`);
  console.log(`  Created:                 ${created}`);
  console.log(`  Descriptions backfilled: ${updated}`);
  console.log(`  Total in catalogue file: ${CATALOGUE.length}\n`);

  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to seed medicines:", err);
  process.exit(1);
});
