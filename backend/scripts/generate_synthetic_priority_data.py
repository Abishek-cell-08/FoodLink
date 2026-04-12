import argparse
import os
import sys


CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.ml_service import generate_synthetic_priority_dataset


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic training data for NGO priority ranking.")
    parser.add_argument(
        "--rows",
        type=int,
        default=4000,
        help="Number of synthetic rows to generate.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic data generation.",
    )
    parser.add_argument(
        "--output",
        default=os.path.join(BACKEND_DIR, "ml_artifacts", "synthetic_priority_training_data.csv"),
        help="Output CSV path.",
    )
    args = parser.parse_args()

    generate_synthetic_priority_dataset(
        output_path=os.path.abspath(args.output),
        rows=args.rows,
        seed=args.seed,
    )
    print(f"Synthetic dataset created at {os.path.abspath(args.output)} with {args.rows} rows.")


if __name__ == "__main__":
    main()
