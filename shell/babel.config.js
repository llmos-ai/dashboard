module.exports = function(api) {
  api.cache(true);
  const presets = [
    [
      '@vue/cli-plugin-babel/preset',
      {
        useBuiltIns: false,
        // 添加对script setup的支持
        jsx:         false
      }
    ],
    [
      '@babel/preset-env',
      { targets: { node: 'current' } }
    ]
  ];
  const env = {
    test: {
      presets: [[
        '@babel/env', { targets: { node: 'current' } }
      ]]
    }
  };

  const plugins = [
    '@babel/plugin-transform-nullish-coalescing-operator',
    // 添加对Vue 3 Composition API的支持
    '@vue/babel-plugin-jsx'
  ];

  if (process.env.NODE_ENV === 'test') {
    plugins.push('transform-require-context');
    plugins.push([
      'babel-plugin-istanbul', { extension: ['.js', '.vue'] }, 'add-vue'
    ]);
  }

  return {
    presets,
    plugins,
    env
  };
};
