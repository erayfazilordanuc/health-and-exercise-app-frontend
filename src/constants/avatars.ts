import non from '../assets/avatars/non.png';
import rabbit from '../assets/avatars/rabbit.png';
import bear from '../assets/avatars/bear.png';
import chicken from '../assets/avatars/chicken.png';
import meerkat from '../assets/avatars/meerkat.png';
import dog from '../assets/avatars/dog.png';

export const AVATARS = {
  non,
  rabbit,
  bear,
  chicken,
  meerkat,
  dog,
} as const;

export type AvatarKey = keyof typeof AVATARS;
