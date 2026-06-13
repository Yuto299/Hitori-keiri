// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions は Deno ランタイム(npm: import 等)のため対象外
    ignores: ["dist/*", "supabase/functions/*"],
  }
]);
