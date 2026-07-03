// Per-number lesson illustrations (imported from the bundled assets so
// Vite fingerprints + serves them). Each is a full background "scene"
// (jungle + big 3D number + friend animal) that the teacher avatar is
// composited on top of — matching the alphabet lesson design.
//
// Add more numbers here as their artwork lands (2.jpeg, 3.jpeg, …);
// numbers without an image fall back to the CSS 3D NumberScene.

import one from "../../assets/images/1.jpeg";
import two from "../../assets/images/2.jpeg";
import three from "../../assets/images/3.jpeg";
import four from "../../assets/images/4.jpeg";
import five from "../../assets/images/5.jpeg";
import six from "../../assets/images/6.jpeg";
import seven from "../../assets/images/7.jpeg";
import eight from "../../assets/images/8.jpeg";
import nine from "../../assets/images/9.jpeg";
import ten from "../../assets/images/10.jpeg";

// Keyed by the number itself.
export const NUMBER_IMAGES = {
  1: one,
  2: two,
  3: three,
  4: four,
  5: five,
  6: six,
  7: seven,
  8: eight,
  9: nine,
  10: ten,
};

export function numberImage(n) {
  return NUMBER_IMAGES[n] || null;
}
