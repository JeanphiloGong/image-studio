<script lang="ts">
  const ratios = [
    { value: '1:1', label: '方形', detail: '头像 · 封面' },
    { value: '16:9', label: '横向', detail: '横幅 · 网页' },
    { value: '9:16', label: '竖向', detail: '海报 · 手机' },
  ] as const;

  let prompt = $state('');
  let selectedRatio = $state<(typeof ratios)[number]['value']>('1:1');

  function fillExample(example: string) {
    prompt = example;
  }
</script>

<svelte:head>
  <title>Image Studio · 用一句话做出你的视觉</title>
  <meta name="description" content="一个专注于文字生图的轻量工作台，支持提示词、画幅和生成历史。" />
</svelte:head>

<div class="shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="Image Studio 首页">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>Image Studio</span>
    </a>
    <div class="topbar-actions">
      <span class="status-dot"><span></span>内测准备中</span>
      <a class="text-link" href="/">登录</a>
    </div>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">MAKE SOMETHING VISIBLE</p>
      <h1>把想法，变成一张图。</h1>
      <p class="hero-copy">写下你的画面。我们负责把它变成可以使用的视觉素材。</p>
    </section>

    <section class="studio-grid" aria-label="生图工作台">
      <div class="composer panel">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">01 / PROMPT</p>
            <h2>描述你想看到的画面</h2>
          </div>
          <span class="credit-pill">每次生成消耗点数</span>
        </div>

        <label class="sr-only" for="prompt">图片描述</label>
        <textarea
          id="prompt"
          bind:value={prompt}
          maxlength="4000"
          placeholder="例如：一张安静的海边书店照片，午后阳光从木窗照进来，35mm 胶片质感……"
        ></textarea>

        <div class="examples" aria-label="提示词示例">
          <span>试试看</span>
          <button
            onclick={() =>
              fillExample('一张有温度的个人品牌横幅，米白背景，深绿色植物，留出左侧标题空间')}
            >品牌横幅</button
          >
          <button
            onclick={() =>
              fillExample('一个极简的 AI + Web3 项目封面，抽象网络结构，橙色与深蓝配色')}
            >项目封面</button
          >
          <button
            onclick={() =>
              fillExample('一幅安静的东方园林插画，细线稿，低饱和色彩，适合作为博客头图')}
            >博客头图</button
          >
        </div>

        <div class="field-block">
          <div class="field-label"><span>02 / FORMAT</span><span>选择画幅</span></div>
          <div class="ratio-grid">
            {#each ratios as ratio}
              <button
                class:active={selectedRatio === ratio.value}
                class="ratio-option"
                aria-pressed={selectedRatio === ratio.value}
                onclick={() => (selectedRatio = ratio.value)}
              >
                <span
                  class:ratio-square={ratio.value === '1:1'}
                  class:ratio-wide={ratio.value === '16:9'}
                  class:ratio-tall={ratio.value === '9:16'}
                  class="ratio-icon"
                ></span>
                <span><strong>{ratio.label}</strong><small>{ratio.detail}</small></span>
              </button>
            {/each}
          </div>
        </div>

        <div class="submit-row">
          <span class="coming-soon">生成接口连接后开放</span>
          <button class="generate-button" disabled title="等待配置生图 API"
            >生成图片 <span>↗</span></button
          >
        </div>
      </div>

      <aside class="preview panel">
        <div class="panel-heading preview-heading">
          <div>
            <p class="panel-kicker">OUTPUT / 00</p>
            <h2>你的作品会出现在这里</h2>
          </div>
          <span class="preview-number">—</span>
        </div>
        <div class="preview-stage">
          <div class="preview-placeholder">
            <span class="placeholder-star">✳</span>
            <p>输入提示词后开始</p>
            <small>生成的图片、状态和下载入口都会在这里显示</small>
          </div>
        </div>
        <div class="preview-footer"><span>IMAGE STUDIO / BETA</span><span>01</span></div>
      </aside>
    </section>

    <section class="next-section">
      <div>
        <p class="panel-kicker">WHAT'S NEXT</p>
        <h2>轻量开始，逐步完善。</h2>
      </div>
      <div class="next-list">
        <div>
          <span>01</span>
          <p><strong>生成</strong><br />接入已验证的图片模型</p>
        </div>
        <div>
          <span>02</span>
          <p><strong>点数</strong><br />透明记录每次生成消耗</p>
        </div>
        <div>
          <span>03</span>
          <p><strong>分享</strong><br />邀请朋友一起使用</p>
        </div>
      </div>
    </section>
  </main>

  <footer><span>© 2026 Image Studio</span><span>Built for ideas that need a shape.</span></footer>
</div>
