import bat from '../assets/avatars/bat.png';
import bear from '../assets/avatars/bear.png';
import bee from '../assets/avatars/bee.png';
import butterflies from '../assets/avatars/butterflies.png';
import cat from '../assets/avatars/cat.png';
import cat_2 from '../assets/avatars/cat_2.png';
import deer from '../assets/avatars/deer.png';
import dog from '../assets/avatars/dog.png';
import fox from '../assets/avatars/fox.png';
import jacutinga from '../assets/avatars/jacutinga.png';
import jellyfish from '../assets/avatars/jellyfish.png';
import llama from '../assets/avatars/llama.png';
import macaw from '../assets/avatars/macaw.png';
import meerkat from '../assets/avatars/meerkat.png';
import mouse from '../assets/avatars/mouse.png';
import non from '../assets/avatars/non.png';
import owl from '../assets/avatars/owl.png';
import panda from '../assets/avatars/panda.png';
import panda_1 from '../assets/avatars/panda_1.png';
import panda_bear from '../assets/avatars/panda_bear.png';
import penguin from '../assets/avatars/penguin.png';
import penguin_2 from '../assets/avatars/penguin_2.png';
import polar_bear from '../assets/avatars/polar_bear.png';
import rabbit from '../assets/avatars/rabbit.png';
import rabbit_2 from '../assets/avatars/rabbit_2.png';
import rabbit_3 from '../assets/avatars/rabbit_3.png';
import sea_lion from '../assets/avatars/sea_lion.png';
import snowy_owl from '../assets/avatars/snowy_owl.png';
import turtle from '../assets/avatars/turtle.png';
import walrus from '../assets/avatars/walrus.png';
import wolf from '../assets/avatars/wolf.png';
import wolf_2 from '../assets/avatars/wolf_2.png';
import lion from '../assets/avatars/lion.png';

export const AVATARS = {
  bat,
  bear,
  bee,
  butterflies,
  cat,
  cat_2,
  deer,
  dog,
  fox,
  jacutinga,
  jellyfish,
  llama,
  macaw,
  meerkat,
  mouse,
  owl,
  panda,
  panda_1,
  panda_bear,
  penguin,
  penguin_2,
  polar_bear,
  rabbit,
  rabbit_2,
  rabbit_3,
  sea_lion,
  snowy_owl,
  turtle,
  walrus,
  wolf,
  wolf_2,
  lion,
  non,
} as const;

export type AvatarKey = keyof typeof AVATARS;
