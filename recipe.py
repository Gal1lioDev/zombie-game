import json
import random

# Fixed seed for reproducibility
random.seed(42)

# Define element categories
categories = {
    "Natural": ["Water", "Fire", "Earth", "Air", "Herbs", "Sand"],
    "Tech": ["Circuit", "Data", "Code", "Algorithm", "Neural Fiber"],
    "Energy": ["Spark", "Lightning", "Plasma", "Wave"],
    "Medical": ["Serum", "Antidote", "Blood", "Virus", "Tonic"],
    "Mystical": ["Essence", "Crystal", "Shadow", "Light", "Time"]
}

# Rule-based outputs
rules = {
    ("Natural", "Energy"): ["Steam Cloud", "Molten Rock", "Thunder Mist", "Glass Shard"],
    ("Natural", "Tech"): ["Infused Alloy", "Organic Circuit", "Bio-Matrix", "Living Chip"],
    ("Natural", "Medical"): ["Healing Tonic", "Blood Infusion", "Cleansing Herb", "Spore Sample"],
    ("Natural", "Mystical"): ["Obsidian Dust", "Eclipse Stone", "Ancient Powder", "Life Seed"],
    ("Tech", "Energy"): ["Overcharged Wire", "Electric Core", "Photon Circuit", "Charged Matrix"],
    ("Tech", "Medical"): ["Antivirus Protocol", "Cyber Serum", "Nanobot Infusion", "Digital Cure"],
    ("Tech", "Mystical"): ["Phantom Current", "Encrypted Relic", "Ghost Protocol", "Logic Relic"],
    ("Energy", "Medical"): ["Plasma Injection", "Electric Pulse", "Nerve Shock", "Charged Serum"],
    ("Energy", "Mystical"): ["Plasma Crystal", "Lightning Orb", "Time Spark", "Ether Charge"],
    ("Medical", "Mystical"): ["Blood Crystal", "Cursed Serum", "Soul Infusion", "Essence Tonic"],
    ("Tech", "Tech"): ["Encrypted Fragment", "Logic Thread", "Quantum Hash", "Neural Sync"],
    ("Medical", "Medical"): ["Mutated Strain", "Gene Splice", "Toxic Mixture", "Experimental Serum"],
    ("Mystical", "Mystical"): ["Chrono Shard", "Eclipse Stone", "Spirit Core", "Void Crystal"]
}

# Hardcoded cure path
cure_path = {
    "Quantum Code Extract+Neural Network Fiber": "Firewall Dust",
    "Firewall Dust+Anti-Virus Serum": "Logic Crystal",
    "Logic Crystal+Electric Brainwave": "Data Stream Nectar",
    "Data Stream Nectar+Caffeine Potion": "Encrypted Essence 🎉 (FINAL CURE)"
}

# Generate combinations
def generate_combinations():
    recipes = {}

    # Old category-based rules (optional)
    all_elements = sum(categories.values(), [])
    for i in range(len(all_elements)):
        for j in range(i + 1, len(all_elements)):
            e1, e2 = all_elements[i], all_elements[j]
            cat1 = [k for k, v in categories.items() if e1 in v][0]
            cat2 = [k for k, v in categories.items() if e2 in v][0]
            key = tuple(sorted([cat1, cat2]))
            possible_outputs = rules.get(key, None)
            if possible_outputs:
                result = random.choice(possible_outputs)
                recipes[f"{e1}+{e2}"] = result

    # Core base element reactions
    core_reactions = {
        "Blood Sample+Virus Strain": "Infected Blood",
        "Herbs+Water": "Medicinal Paste",
        "Chemicals+Fire": "Explosion",
        "Electricity+Water": "Shock Solution",
        "Antidote Base+Virus Strain": "Neutralized Serum",
        "Hope+Time": "Motivation Essence",
    }

    recipes.update(core_reactions)
    recipes.update(cure_path)  # Final cure path

    return recipes


if __name__ == "__main__":
    recipes = generate_combinations()
    with open("recipes.json", "w", encoding="utf-8") as f:
        json.dump(recipes, f, indent=4, ensure_ascii=False)
    print(f"✅ Generated {len(recipes)} recipes and saved to recipes.json")
