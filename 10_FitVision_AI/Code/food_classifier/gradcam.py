"""
Production-ready Grad-CAM Visual Explainability Engine
Generates class activation heatmaps overlaying raw food images to show
which pixel regions activated the neural network prediction.
"""

import io
import base64
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
import matplotlib.cm as cm

class GradCAMExplainer:
    """
    Grad-CAM engine for convolutional / EfficientNet backbones.
    Hooks into the final convolutional feature layer to extract activations and gradients.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module = None):
        self.model = model
        # Default to the last layer in features if not specified
        if target_layer is None:
            if hasattr(model, "features") and len(model.features) > 0:
                self.target_layer = model.features[-1]
            else:
                self.target_layer = list(model.children())[0]
        else:
            self.target_layer = target_layer

        self._features = None
        self._gradients = None
        self._fwd_hook = self.target_layer.register_forward_hook(self._save_features)
        self._bwd_hook = self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_features(self, module, input, output):
        self._features = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self._gradients = grad_output[0].detach()

    def generate_cam(self, image_tensor: torch.Tensor, class_idx: int = None, device: str = "cpu"):
        """
        Calculates the 224x224 normalized Grad-CAM heatmap for a target class.
        """
        self.model.eval()
        image = image_tensor.to(device)

        logits = self.model(image)
        probs = torch.softmax(logits, dim=1)

        if class_idx is None:
            class_idx = logits.argmax(dim=1).item()

        self.model.zero_grad()
        if logits.requires_grad or image.requires_grad:
            logits[0, class_idx].backward(retain_graph=True)
        else:
            # Re-evaluate with grad if disabled
            with torch.enable_grad():
                img_with_grad = image.clone().detach().requires_grad_(True)
                logits_grad = self.model(img_with_grad)
                logits_grad[0, class_idx].backward()

        if self._gradients is None or self._features is None:
            # Fallback uniform heatmap if hook failed
            return np.ones((224, 224), dtype=np.float32) * 0.5, class_idx, probs[0, class_idx].item()

        gradients = self._gradients[0]
        features = self._features[0]

        # Global average pool across spatial dimensions
        weights = gradients.mean(dim=(1, 2))
        cam = (weights[:, None, None] * features).sum(dim=0)
        cam = F.relu(cam)

        cam_np = cam.cpu().numpy()
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max - cam_min > 1e-6:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        cam_tensor = torch.from_numpy(cam_np).unsqueeze(0).unsqueeze(0)
        cam_resized = F.interpolate(
            cam_tensor,
            size=(224, 224),
            mode="bilinear",
            align_corners=False
        ).squeeze().numpy()

        confidence = probs[0, class_idx].item()
        return cam_resized, class_idx, confidence

    def generate_overlay_base64(self, original_pil_image: Image.Image, heatmap: np.ndarray, alpha: float = 0.55) -> str:
        """
        Blends heatmap with the original image using JET colormap and returns base64 data URL.
        """
        img_rgb = original_pil_image.convert("RGB").resize((224, 224))
        img_np = np.array(img_rgb) / 255.0

        # Apply colormap
        cmap = cm.get_cmap("jet")
        heatmap_colored = cmap(heatmap)[:, :, :3]

        # Blend
        blended = (1.0 - alpha) * img_np + alpha * heatmap_colored
        blended = np.clip(blended * 255.0, 0, 255).astype(np.uint8)

        out_img = Image.fromarray(blended)
        buffer = io.BytesIO()
        out_img.save(buffer, format="JPEG", quality=90)
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

    def remove_hooks(self):
        try:
            self._fwd_hook.remove()
            self._bwd_hook.remove()
        except Exception:
            pass
