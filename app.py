from flask import Flask, render_template, jsonify
import json
import os
import csv

app = Flask(__name__)


def load_recipes():
    recipes_path = os.path.join(os.path.dirname(__file__), "recipes.json")
    with open(recipes_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load recipes once at startup
RECIPES = load_recipes()

# Starting base elements
BASE_ELEMENTS = [
    "Slimewater",   # murky survival water
    "Rotberry",     # mutated fruit
    "Ashspice",     # burnt seasoning
    "Ironroot",     # metal-rich root
    "Glowfungus",   # bioluminescent mushroom
    "Zapgrain",     # electrified grain
    "Fumifruit",    # toxic-smelling fruit
    "Brainleaf",    # intelligence-enhancing leaf
    "Sparkdust",    # reactive powder
    "Virmush"       # virus-laden mushroom
]




@app.route("/")
def index():
    return render_template("index.html", base_elements=BASE_ELEMENTS)


@app.route("/recipes")
def get_recipes():
    return jsonify(RECIPES)


def load_config():
    csv_path = os.path.join(os.path.dirname(__file__), "geoguessr_scores_2025-10-08 (2).csv")
    if not os.path.exists(csv_path):
        # Default config if CSV missing
        return {"teams": {"default": {"zombieMeterStart": 78, "zombieMeterDecay": 0.1}}}
    
    teams = {}
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                if row["Team Name"] and row["Calculated Time (min)"]:
                    team_name = row["Team Name"].strip('"')
                    time_minutes = float(row["Calculated Time (min)"].strip('"'))
                    zombie_meter_start = (time_minutes / 40) * 100
                    teams[team_name] = {
                        "zombieMeterStart": round(zombie_meter_start, 1),
                        "zombieMeterDecay": 0.1
                    }
        return {"teams": teams}
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return {"teams": {"default": {"zombieMeterStart": 78, "zombieMeterDecay": 0.1}}}


@app.route("/config")
def get_config():
    return jsonify(load_config())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
