CREATE TABLE IF NOT EXISTS waste_types (
    slug               TEXT PRIMARY KEY,
    name               TEXT NOT NULL,
    recyclable         BOOLEAN NOT NULL DEFAULT TRUE,
    co2_per_kg         DOUBLE PRECISION NOT NULL DEFAULT 0,
    energy_kwh_per_kg  DOUBLE PRECISION NOT NULL DEFAULT 0,
    preparation        TEXT[] NOT NULL DEFAULT '{}',
    guide              JSONB NOT NULL DEFAULT '{"benefits":[],"process":[],"products":[]}'::jsonb,
    sort_order         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recyclers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    address         TEXT NOT NULL DEFAULT '',
    phone           TEXT NOT NULL DEFAULT '',
    website         TEXT NOT NULL DEFAULT '',
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    accepted_types  TEXT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recycling_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    waste_type     TEXT NOT NULL REFERENCES waste_types (slug),
    estimated_kg   DOUBLE PRECISION NOT NULL CHECK (estimated_kg > 0),
    recycler_id    UUID REFERENCES recyclers (id) ON DELETE SET NULL,
    photo_url      TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recycling_records_user_created ON recycling_records (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recycling_records_waste_type ON recycling_records (waste_type);
CREATE INDEX IF NOT EXISTS idx_recyclers_status ON recyclers (status);

INSERT INTO waste_types (slug, name, recyclable, co2_per_kg, energy_kwh_per_kg, preparation, guide, sort_order) VALUES
  ('paper', 'Paper & Cardboard', TRUE, 0.9, 2.4,
   ARRAY['Remove tape, staples and plastic windows from envelopes and boxes',
         'Flatten cardboard boxes to save space',
         'Keep paper dry and clean — wet or greasy paper cannot be recycled',
         'Remove labels and lids from cartons before recycling'],
   '{"benefits":["Saves about 17 trees per tonne of paper recycled","Uses ~40% less energy than making paper from virgin pulp","Keeps paper out of landfill where it would release methane"],
     "process":["Sorted by grade and baled at the collection point","Pulped with water and chemicals to break fibres down","Filtered, cleaned and rolled into new paper sheets"],
     "products":["New newspapers and office paper","Egg cartons and paper packaging","Cardboard boxes and paper towel rolls"]}',
   1),
  ('plastic', 'Plastic', TRUE, 1.6, 2.0,
   ARRAY['Check the resin code and rinse containers clean','Remove caps and labels where possible','Flatten bottles to save space','Never recycle plastic bags or straws with rigid plastics'],
   '{"benefits":["Recycling 1 kg of plastic saves ~1.6 kg of CO2 vs virgin plastic","Reduces oil demand — plastic comes from petroleum","Keeps plastic out of oceans and landfills"],
     "process":["Sorted by resin type (PET, HDPE, PP...)","Shredded, washed and melted into pellets","Pellets melted and moulded into new items"],
     "products":["New bottles and food containers","Fibrefill for clothing and carpets","Plastic lumber and pipes"]}',
   2),
  ('glass', 'Glass', TRUE, 0.3, 0.5,
   ARRAY['Rinse bottles and jars clean of residue','Remove metal and plastic lids and caps','Do not mix broken glass or ceramics with recyclable glass','Separate by colour where the facility requires it'],
   '{"benefits":["Glass can be recycled endlessly without losing quality","Recycling one glass bottle saves enough energy for a 100W bulb for 4 hours","Reduces sand mining and raw material extraction"],
     "process":["Crushed into cullet and sorted by colour","Metal and contaminants removed with magnets and sieves","Melted at ~1500°C and moulded into new bottles and jars"],
     "products":["New bottles and jars","Glass wool insulation","Fibreglass and decorative glass aggregate"]}',
   3),
  ('metal', 'Metal & Aluminium', TRUE, 3.5, 4.5,
   ARRAY['Rinse cans and foil clean of food residue','Crush aluminium cans to save space','Separate aluminium and steel — check with a magnet','Remove plastic lids and liners from metal containers'],
   '{"benefits":["Recycling aluminium uses ~95% less energy than virgin production","Each kg of metal recycled avoids ~3.5 kg of CO2","Saves finite metal ore from being mined"],
     "process":["Sorted into ferrous (steel) and non-ferrous (aluminium)","Shredded and melted in furnaces","Cast into ingots or rolled into new sheet metal"],
     "products":["New cans and foil","Bicycle frames and car parts","Construction steel and appliances"]}',
   4),
  ('organic', 'Organic / Compostable', TRUE, 0.5, 0.1,
   ARRAY['Set aside food scraps and yard waste in a compost bin','Avoid adding meat, dairy or oils to home compost','Keep organic waste out of plastic bags','Use compost as natural fertiliser for gardens'],
   '{"benefits":["Composting avoids methane released when organics rot in landfill","Produces nutrient-rich fertiliser for soil","Reduces the weight of the city waste stream"],
     "process":["Organic waste is collected and shredded","Microbes break it down in oxygen-rich piles (aerobic composting)","After 8-12 weeks it becomes stable compost"],
     "products":["Compost and soil conditioner","Mulch for landscaping","Biogas and digestate from anaerobic digestion"]}',
   5),
  ('e_waste', 'Electronics / E-waste', TRUE, 4.0, 3.0,
   ARRAY['Back up and wipe all personal data before disposal','Remove batteries where possible and dispose of them separately','Keep devices intact — do not smash screens','Do not throw electronics in household bins'],
   '{"benefits":["Recovers precious metals like gold, copper and rare earths","Prevents toxic lead and mercury from contaminating soil and water","E-waste is the fastest-growing waste stream — recycling matters"],
     "process":["Devices sorted and tested for reuse","Dismantled to recover reusable components and metals","Shredded and separated into metals, plastics and glass"],
     "products":["Recovered gold, copper and aluminium","Refurbished phones and computers","Plastic casing pellets"]}',
   6),
  ('textile', 'Textiles & Clothing', TRUE, 2.5, 3.0,
   ARRAY['Wash and dry clothing before donating or recycling','Remove buttons, zips and metal trims where possible','Only donate items that are clean and undamaged','Bag textiles separately from general waste'],
   '{"benefits":["Every kg of textile recycled avoids ~2.5 kg of CO2 vs new fabric","Reduces water and chemical use from virgin cotton farming","Keeps fast-fashion waste out of landfill"],
     "process":["Clothing sorted into re-wearable and fibre grades","Clean textiles sold or donated; damaged ones shredded","Fibres re-spun into new yarn"],
     "products":["Cleaning rags and industrial wipes","Insulation and carpet padding","New blended-fibre clothing"]}',
   7),
  ('hazardous', 'Batteries & Hazardous', FALSE, 0, 0,
   ARRAY['Keep batteries, paints and chemicals in their original containers','Never mix different waste types together','Store in a cool, dry place away from children','Take directly to a dedicated drop-off point'],
   '{"benefits":["Prevents toxic chemicals from leaking into groundwater","Batteries can be recovered for metal value","Protects waste workers from dangerous materials"],
     "process":["Accepted only at dedicated drop-off centres","Specialists separate and contain each chemical family","Batteries and metals processed for recovery; chemicals safely neutralised"],
     "products":["Recovered battery metals (lithium, nickel, lead)","Recycled oil and solvents","Safely contained hazardous material"]}',
   8)
ON CONFLICT (slug) DO NOTHING;
