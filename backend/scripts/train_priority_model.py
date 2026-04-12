import argparse
import json
import os
import sys


CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.ml_service import train_priority_model_from_csv


def main():
    parser = argparse.ArgumentParser(description="Train the ML priority ranking model.")
    parser.add_argument(
        "--data",
        default=os.path.join(BACKEND_DIR, "ml_artifacts", "synthetic_priority_training_data.csv"),
        help="Training CSV path.",
    )
    parser.add_argument(
        "--output",
        default=os.path.join(BACKEND_DIR, "ml_artifacts", "priority_model.json"),
        help="Output model artifact path.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=700,
        help="Training epochs for SGD.",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=0.01,
        help="Learning rate for SGD.",
    )
    args = parser.parse_args()

    artifact = train_priority_model_from_csv(
        csv_path=os.path.abspath(args.data),
        output_path=os.path.abspath(args.output),
        epochs=args.epochs,
        learning_rate=args.learning_rate,
    )
    print(json.dumps(artifact["metrics"], indent=2))
    print(f"Priority model saved to {os.path.abspath(args.output)}")


if __name__ == "__main__":
    main()
