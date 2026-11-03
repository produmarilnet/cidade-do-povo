// Carimbo de versão do build. O Next lê este arquivo mais de uma vez durante o
// build (a parte da tela e a do servidor são montadas em processos separados);
// gerar com Date.now() a cada leitura dava um carimbo diferente para cada lado,
// e o aviso de "versão nova" nunca sumia. Guardando no process.env, os
// processos filhos herdam o mesmo valor.
process.env.VERSAO_DO_APP ||= String(Date.now());

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagem do Docker enxuta: só o que o site usa para rodar (ver Dockerfile).
  output: "standalone",
  env: {
    // A tela compara o carimbo dela com o do servidor (/api/versao) para avisar
    // que saiu versão nova. É gerado no próprio build, então não sofre do
    // problema das variáveis do EasyPanel.
    VERSAO_DO_APP: process.env.VERSAO_DO_APP,
  },
  // O banco de materiais saiu da Iluminação e foi para o Estoque (03/11/2026).
  async redirects() {
    return [{ source: "/iluminacao/materiais/:resto*", destination: "/estoque/materiais/:resto*", permanent: false }];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Fora do pacote do Next: assim o driver vai inteiro para
    // .next/standalone/node_modules, onde o scripts/migrar.mjs também o encontra.
    serverComponentsExternalPackages: ["postgres", "bcryptjs"],
  },
};

module.exports = nextConfig;
