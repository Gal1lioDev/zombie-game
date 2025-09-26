from flask import Flask, render_template, jsonify
import json
import os

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
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    if not os.path.exists(config_path):
        # Default config if missing
        return {"zombieMeterStart": 78, "zombieMeterDecay": 2}
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/config")
def get_config():
    return jsonify(load_config())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
