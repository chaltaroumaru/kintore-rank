// Web: ブラウザの localStorage を使う (静的レンダリング中は存在しない)
export const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
