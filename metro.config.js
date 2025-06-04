const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

// 1 ‑ Varsayılan ayarları al, gerekirse özelleştir.
const baseConfig = mergeConfig(getDefaultConfig(__dirname), {
  // buraya dilediğin ekstra resolver/transformer ayarlarını ekleyebilirsin
  // ör. svg transformer, monorepo yolları, vs.
});

// 2 ‑ NativeWind’i ekle (global.css > tailwind directives içerir)
const nativeWindConfig = withNativeWind(baseConfig, {
  input: './global.css',
});

// 3 ‑ Reanimated’i ekle ve EXPORT et
module.exports = wrapWithReanimatedMetroConfig(nativeWindConfig);