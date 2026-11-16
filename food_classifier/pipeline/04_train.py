"""
PHASE 4: The Training Loop — Putting It All Together
=====================================================
This is the heart of every deep learning project.
All the pieces from previous phases come together here:
  Phase 1 → tensors
  Phase 2 → data pipeline (DataLoader)
  Phase 3 → model, loss, optimiser

Training strategy (two stages):
  Stage 1 — Head only (5 epochs)
    Backbone is frozen. Only our classifier head trains.
    Fast, cheap. Gets us to ~50-60% accuracy quickly.

  Stage 2 — Fine-tuning (10 epochs)
    Unfreeze the last 3 blocks of EfficientNet.
    Train everything at a much smaller LR.
    Pushes accuracy to 75-80%+.

Checkpointing: we save the best model (by val accuracy) throughout.
"""

import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import torch
import torch.nn as nn
import torchvision.transforms.v2 as T
from torchvision.datasets import Food101
from torchvision.models import EfficientNet_B2_Weights
from torch.utils.data import DataLoader
from pathlib import Path
from tqdm import tqdm
import json
import time

# ── Local import ──────────────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sys
import argparse
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from models.food_classifier import FoodClassifier


# ─────────────────────────────────────────────────────────────────────────────
# CONFIG — configurable via CLI flags
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
if not (DATA_DIR / "food-101").exists() and (BASE_DIR.parent / "data" / "food-101").exists():
    DATA_DIR = BASE_DIR.parent / "data"

parser = argparse.ArgumentParser(description="Train EfficientNet-B2 on Food-101")
parser.add_argument("--stage1-epochs", type=int, default=2, help="Epochs for Stage 1 (Head only)")
parser.add_argument("--stage2-epochs", type=int, default=1, help="Epochs for Stage 2 (Fine-tuning)")
parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
parser.add_argument("--max-batches", type=int, default=50, help="Max batches per epoch for fast training (0 for unlimited)")
parser.add_argument("--full", action="store_true", help="Run full training without batch limits")
parser.add_argument("--lr1", type=float, default=3e-4, help="Stage 1 learning rate")
parser.add_argument("--lr2", type=float, default=5e-5, help="Stage 2 learning rate")
args, _ = parser.parse_known_args()

max_batches = None if (args.full or args.max_batches <= 0) else args.max_batches

CFG = {
    "data_dir"        : str(DATA_DIR),
    "checkpoint_dir"  : str(BASE_DIR / "checkpoints"),
    "results_dir"     : str(BASE_DIR / "results"),
    "num_classes"     : 101,
    "batch_size"      : args.batch_size,
    "num_workers"     : 0,  # 0 on Windows avoids subprocess spawn overhead

    # Stage 1: train head only
    "stage1_epochs"   : 5 if args.full else args.stage1_epochs,
    "stage1_lr"       : args.lr1,

    # Stage 2: fine-tune backbone
    "stage2_epochs"   : 10 if args.full else args.stage2_epochs,
    "stage2_lr"       : args.lr2,      # much smaller — backbone weights are fragile

    "weight_decay"    : 1e-4,
    "label_smoothing" : 0.1,
    "seed"            : 42,
}

# Reproducibility — set seeds so results are consistent across runs
torch.manual_seed(CFG["seed"])

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {DEVICE}")
if max_batches:
    print(f"Mode: Fast Training ({max_batches} batches/epoch) | Pass --full for all 75,750 images\n")
else:
    print("Mode: Full Dataset Training (all 75,750 images)\n")

Path(CFG["checkpoint_dir"]).mkdir(exist_ok=True)
Path(CFG["results_dir"]).mkdir(exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────────────────────────────────────

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

train_transforms = T.Compose([
    T.Resize((256, 256)),
    T.RandomCrop(224),
    T.RandomHorizontalFlip(p=0.5),
    T.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    T.ToImage(),
    T.ToDtype(torch.float32, scale=True),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

val_transforms = T.Compose([
    T.Resize((224, 224)),
    T.ToImage(),
    T.ToDtype(torch.float32, scale=True),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

print("Loading datasets...")
train_dataset = Food101(CFG["data_dir"], split="train", transform=train_transforms, download=False)
val_dataset   = Food101(CFG["data_dir"], split="test",  transform=val_transforms,  download=False)

train_loader = DataLoader(train_dataset, batch_size=CFG["batch_size"],
                          shuffle=True,  num_workers=CFG["num_workers"], pin_memory=(DEVICE == "cuda"))
val_loader   = DataLoader(val_dataset,   batch_size=CFG["batch_size"],
                          shuffle=False, num_workers=CFG["num_workers"], pin_memory=(DEVICE == "cuda"))

print(f"Train: {len(train_dataset):,} images | Val: {len(val_dataset):,} images\n")


# ─────────────────────────────────────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────────────────────────────────────

model = FoodClassifier(num_classes=CFG["num_classes"], freeze_backbone=True)
model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss(label_smoothing=CFG["label_smoothing"])


# ─────────────────────────────────────────────────────────────────────────────
# CORE FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimiser, device, batch_limit=None):
    """
    One full pass over the training set (or up to batch_limit).
    Returns: average loss, top-1 accuracy
    """
    model.train()   # IMPORTANT: enables dropout, batch norm in training mode
    total_loss, correct, total = 0.0, 0, 0

    pbar = tqdm(loader, desc="  train", leave=False, unit="batch")

    for b_idx, (images, labels) in enumerate(pbar):
        if batch_limit is not None and b_idx >= batch_limit:
            break

        images, labels = images.to(device), labels.to(device)
        optimiser.zero_grad()
        logits = model(images)              # [batch, 101] raw scores
        loss = criterion(logits, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimiser.step()

        total_loss += loss.item() * images.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)

        pbar.set_postfix(loss=f"{loss.item():.3f}",
                         acc=f"{100*correct/total:.1f}%")

    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device, batch_limit=None):
    """
    Evaluate on validation set (or up to batch_limit).
    Returns: average loss, top-1 accuracy
    """
    model.eval()
    total_loss, correct, total = 0.0, 0, 0

    for b_idx, (images, labels) in enumerate(tqdm(loader, desc="  val  ", leave=False, unit="batch")):
        if batch_limit is not None and b_idx >= batch_limit:
            break

        images, labels = images.to(device), labels.to(device)
        logits = model(images)
        loss   = criterion(logits, labels)

        total_loss += loss.item() * images.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)

    return total_loss / total, correct / total


def run_stage(stage_num, epochs, lr, unfreeze_blocks=None, batch_limit=None):
    """Run a training stage and return history."""

    print(f"\n{'='*55}")
    print(f"  STAGE {stage_num}  |  {epochs} epochs  |  lr={lr}")
    print(f"{'='*55}")

    if unfreeze_blocks is not None:
        model.unfreeze_backbone(unfreeze_last_n_blocks=unfreeze_blocks)

    optimiser = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=lr,
        weight_decay=CFG["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimiser, T_max=epochs, eta_min=lr * 0.01
    )

    history = []
    best_val_acc = 0.0
    val_batch_limit = max(10, batch_limit // 2) if batch_limit else None

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        print(f"\nEpoch {epoch}/{epochs}")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimiser, DEVICE, batch_limit=batch_limit)
        val_loss,   val_acc   = evaluate(model, val_loader, criterion, DEVICE, batch_limit=val_batch_limit)
        scheduler.step()

        elapsed = time.time() - t0
        current_lr = optimiser.param_groups[0]["lr"]

        print(f"  train loss={train_loss:.4f}  acc={100*train_acc:.2f}%"
              f"  |  val loss={val_loss:.4f}  acc={100*val_acc:.2f}%"
              f"  |  lr={current_lr:.2e}  [{elapsed:.0f}s]")

        # Save best model
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            ckpt_path = Path(CFG["checkpoint_dir"]) / f"best_stage{stage_num}.pt"
            torch.save({
                "epoch"      : epoch,
                "model_state": model.state_dict(),
                "val_acc"    : val_acc,
                "val_loss"   : val_loss,
                "cfg"        : CFG,
            }, ckpt_path)
            print(f"  ✓ New best! Saved → {ckpt_path}  (val_acc={100*val_acc:.2f}%)")

        history.append({
            "epoch": epoch, "stage": stage_num,
            "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss,     "val_acc": val_acc,
        })

    print(f"\nStage {stage_num} complete. Best val acc: {100*best_val_acc:.2f}%")
    return history


# ─────────────────────────────────────────────────────────────────────────────
# TRAIN
# ─────────────────────────────────────────────────────────────────────────────

all_history = []

# Stage 1: train head only — backbone frozen
all_history += run_stage(
    stage_num=1,
    epochs=CFG["stage1_epochs"],
    lr=CFG["stage1_lr"],
    batch_limit=max_batches,
)

# Stage 2: unfreeze last 3 backbone blocks + fine-tune
all_history += run_stage(
    stage_num=2,
    epochs=CFG["stage2_epochs"],
    lr=CFG["stage2_lr"],
    unfreeze_blocks=3,
    batch_limit=max_batches,
)

# Save full training history as JSON (used for plotting in the next phase)
history_path = Path(CFG["results_dir"]) / "training_history.json"
with open(history_path, "w") as f:
    json.dump(all_history, f, indent=2)
print(f"\nTraining history saved → {history_path}")

print("\n✅ Training complete! Next: Grad-CAM visualisation.")
