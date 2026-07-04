// Per-object lesson illustrations (imported from the bundled assets so
// Vite fingerprints + serves them). Each is a full background "scene"
// (themed world + big 3D object + friends) that the teacher avatar is
// composited on top of — matching the alphabet/number/shape lesson design.
//
// Covers both "kg-object" lessons: Object Recognition (Banana … Book)
// and My Body (Eyes … Brain). Anything not listed here falls back to a
// live Pexels photo fetch in ObjectPhotoScene.

import banana from "../../assets/images/what (1).png";
import mango from "../../assets/images/what (2).png";
import bus from "../../assets/images/what (3).png";
import drum from "../../assets/images/what (4).png";
import bell from "../../assets/images/what (5).png";
import cow from "../../assets/images/what (6).png";
import book from "../../assets/images/what (7).png";
import bag from "../../assets/images/what (8).png";
import car from "../../assets/images/what (10).png";
import goat from "../../assets/images/what.png";

import eyes from "../../assets/images/seicne (1).png";
import ears from "../../assets/images/seicne (2).png";
import nose from "../../assets/images/seicne (3).png";
import hands from "../../assets/images/seicne (4).png";
import mouth from "../../assets/images/seicne (5).png";
import teeth from "../../assets/images/seicne (6).png";
import tongue from "../../assets/images/seicne (7).png";
import feet from "../../assets/images/seicne (8).png";
import hair from "../../assets/images/seicne (9).png";
import brain from "../../assets/images/seicne (10).png";

// Keyed by the lesson's `name`, lowercased.
export const OBJECT_IMAGES = {
  banana,
  mango,
  bus,
  drum,
  bell,
  cow,
  book,
  bag,
  car,
  goat,
  eyes,
  ears,
  nose,
  hands,
  mouth,
  teeth,
  tongue,
  feet,
  hair,
  brain,
};

export function objectImage(name) {
  return OBJECT_IMAGES[String(name || "").toLowerCase()] || null;
}
