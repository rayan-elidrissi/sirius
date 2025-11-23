use std::path::{Path, PathBuf};

use anyhow::Result;
use image::{imageops::FilterType, GenericImageView};
use ndarray::{Array4, Ix4};
use once_cell::sync::Lazy;
use ort::{
    environment::Environment,
    session::Session,
    value::{OrtOwnedTensor, Value},
    GraphOptimizationLevel,
};

/// Default relative path (from the `tee_substitute` crate root) to the exported ONNX model.
///
/// We now assume the ONNX model file has been copied/placed at:
///
/// `tee_substitute/best.onnx`
///
/// You can still override this with the `GUN_DETECTOR_ONNX_PATH` environment
/// variable if you want to point to a different file.
pub const DEFAULT_ONNX_MODEL_PATH: &str = "best.onnx";

/// Optional env var override for the ONNX model path.
pub const ONNX_MODEL_ENV_VAR: &str = "GUN_DETECTOR_ONNX_PATH";

/// Expected YOLO input size.
/// Adjust this to match the image size used when you exported the ONNX model.
pub const MODEL_IMG_SIZE: u32 = 640;

/// Global ONNX Runtime environment. Created once per process.
static ORT_ENV: Lazy<Environment> = Lazy::new(|| {
    Environment::builder()
        .with_name("guns-detector")
        .build()
        .expect("failed to create ONNX Runtime environment")
});

/// Simple representation of a single gun detection.
#[derive(Debug, Clone)]
pub struct GunDetection {
    pub image_path: String,
    pub class_id: i64,
    pub class_name: String,
    pub confidence: f32,
    pub x1: f32,
    pub y1: f32,
    pub x2: f32,
    pub y2: f32,
}

/// Gun detector backed by an ONNX YOLO model.
pub struct GunDetector {
    session: Session,
}

impl GunDetector {
    /// Create a new detector using the provided model path, or the default one
    /// if `model_path` is `None`.
    pub fn new(model_path: Option<PathBuf>) -> Result<Self> {
        let model_path = model_path.unwrap_or_else(|| resolve_default_model_path());

        let session = ort::session::SessionBuilder::new(&ORT_ENV)?
            .with_optimization_level(GraphOptimizationLevel::All)?
            .with_model_from_file(model_path)?;

        Ok(Self { session })
    }

    /// Run inference on a single image and return all detections.
    ///
    /// Note: this assumes a standard YOLOv8 ONNX export with a single output tensor where each
    /// row corresponds to one prediction. You may need to adapt the decoding logic to match
    /// your exact export.
    pub fn run_on_image<P: AsRef<Path>>(&self, image_path: P) -> Result<Vec<GunDetection>> {
        let image_path_ref = image_path.as_ref();
        let img = image::open(image_path_ref)?;

        let (orig_w, orig_h) = img.dimensions();

        // Resize to the fixed model size and convert to RGB.
        let resized = img
            .resize(MODEL_IMG_SIZE, MODEL_IMG_SIZE, FilterType::Lanczos3)
            .to_rgb8();

        // Build input tensor in NCHW (1, 3, H, W), normalized to [0, 1].
        let mut input = Array4::<f32>::zeros((
            1,
            3,
            MODEL_IMG_SIZE as usize,
            MODEL_IMG_SIZE as usize,
        ));

        for (y, x, pixel) in resized.enumerate_pixels() {
            let [r, g, b] = pixel.0;
            let yy = y as usize;
            let xx = x as usize;
            input[[0, 0, yy, xx]] = r as f32 / 255.0;
            input[[0, 1, yy, xx]] = g as f32 / 255.0;
            input[[0, 2, yy, xx]] = b as f32 / 255.0;
        }

        let input_name = self.session.inputs[0].name.to_string();
        let input_tensor = Value::from_array(ORT_ENV.allocator(), &input)?;

        let outputs = self.session.run(vec![(input_name.as_str(), input_tensor)])?;

        // For simplicity, assume single output tensor of shape [1, num_boxes, 6]
        // where each prediction row is [x1, y1, x2, y2, score, class_id].
        let output_tensor: OrtOwnedTensor<f32, Ix4> = outputs[0].try_extract().unwrap();
        let view = output_tensor.view();

        let mut detections = Vec::new();
        let image_path_str = image_path_ref.to_string_lossy().to_string();

        // Map resized coordinates back to original image size.
        let scale_x = orig_w as f32 / MODEL_IMG_SIZE as f32;
        let scale_y = orig_h as f32 / MODEL_IMG_SIZE as f32;

        let (_, num_boxes, _, _) = view.dim();

        for i in 0..num_boxes {
            // Depending on ONNX export the layout may differ; adjust as needed.
            let x1 = view[[0, i, 0, 0]];
            let y1 = view[[0, i, 0, 1]];
            let x2 = view[[0, i, 0, 2]];
            let y2 = view[[0, i, 0, 3]];
            let score = view[[0, i, 0, 4]];
            let class_id = view[[0, i, 0, 5]] as i64;

            // Basic confidence threshold; tune as needed.
            if score < 0.25 {
                continue;
            }

            detections.push(GunDetection {
                image_path: image_path_str.clone(),
                class_id,
                class_name: "gun".to_string(), // single-class model
                confidence: score,
                x1: x1 * scale_x,
                y1: y1 * scale_y,
                x2: x2 * scale_x,
                y2: y2 * scale_y,
            });
        }

        Ok(detections)
    }
}

fn resolve_default_model_path() -> PathBuf {
    if let Ok(path) = std::env::var(ONNX_MODEL_ENV_VAR) {
        PathBuf::from(path)
    } else {
        PathBuf::from(DEFAULT_ONNX_MODEL_PATH)
    }
}


