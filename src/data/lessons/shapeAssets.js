// Per-shape lesson illustrations (imported from the bundled assets so
// Vite fingerprints + serves them). Each is a full background "scene"
// (meadow + big smiling 3D shape + its name) that the teacher avatar is
// composited on top of — matching the alphabet/number lesson design.

import circle from "../../assets/images/shape-circle.jpeg";
import square from "../../assets/images/shape-square.jpeg";
import triangle from "../../assets/images/shape-triangle.jpeg";
import rectangle from "../../assets/images/shape-rectangle.jpeg";
import star from "../../assets/images/shape-star.jpeg";
import heart from "../../assets/images/shape-heart.jpeg";
import diamond from "../../assets/images/shape-diamond.jpeg";
import oval from "../../assets/images/shape-oval.jpeg";

// Keyed by the lesson's `shape` slug.
export const SHAPE_IMAGES = {
  circle,
  square,
  triangle,
  rectangle,
  star,
  heart,
  diamond,
  oval,
};

export function shapeImage(shape) {
  return SHAPE_IMAGES[String(shape || "").toLowerCase()] || null;
}
