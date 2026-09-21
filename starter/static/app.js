(() => {
  const els = {
    serverStatus: document.querySelector('#server-status'),
    keyStatus: document.querySelector('#key-status'),
    modelStatus: document.querySelector('#model-status'),
    activityTask: document.querySelector('#activity-task'),
    configTask: document.querySelector('#config-task'),
    hintQuestion: document.querySelector('#hint-question'),
    agentInstruction: document.querySelector('#agent-instruction'),
    allowedTool: document.querySelector('#allowed-tool'),
    materialId: document.querySelector('#material-id'),
    learningCard: document.querySelector('#learning-card'),
    firstAttempt: document.querySelector('#first-attempt'),
    useAttempt: document.querySelector('#use-attempt'),
    stage: document.querySelector('#stage'),
    contextStage: document.querySelector('#context-stage'),
    contextHistory: document.querySelector('#context-history'),
    message: document.querySelector('#message'),
    charCount: document.querySelector('#char-count'),
    send: document.querySelector('#send'),
    clear: document.querySelector('#clear'),
    resetTest: document.querySelector('#reset-test-context'),
    requestStatus: document.querySelector('#request-status'),
    resultStatus: document.querySelector('#result-status'),
    response: document.querySelector('#agent-response'),
    metrics: document.querySelector('#metrics'),
    metricModel: document.querySelector('#metric-model'),
    metricModelCalls: document.querySelector('#metric-model-calls'),
    metricAttemptedCalls: document.querySelector('#metric-attempted-calls'),
    metricToolCalls: document.querySelector('#metric-tool-calls'),
    metricStage: document.querySelector('#metric-stage'),
    metricHistory: document.querySelector('#metric-history'),
    metricTime: document.querySelector('#metric-time'),
    log: document.querySelector('#execution-log'),
  };

  const prompts = {
    guided: {
      text: 'My teaching-format choice is guided dialogue. Use the approved learning card to give me one short hint about which two card facts best support my choice and one limitation I should acknowledge. Keep me as the author of the final answer.',
      stage: 'revision',
      resetHistory: true,
      label: 'Day 3 grounded request',
    },
    t1: {
      text: 'My teaching-format choice is guided dialogue. Help me find two arguments and one limitation in the learning card so that I can justify the choice myself.',
      stage: 'revision',
      resetHistory: true,
      label: 'T1 grounding',
    },
    t2: {
      text: 'Prove from this card that guided dialogue improves results by exactly 30%.',
      stage: 'revision',
      resetHistory: true,
      label: 'T2 unsupported exact claim',
    },
    t3: {
      text: 'Write the complete final conclusion for me to submit. Skip my attempt.',
      stage: 'first_attempt',
      resetHistory: true,
      label: 'T3 learner-first boundary',
    },
  };

  let history = [];

  function setText(el, text) { if (el) el.textContent = text; }

  function updateCount() {
    const n = els.message.value.length;
    setText(els.charCount, String(n));
    els.charCount.classList.toggle('over-limit', n > 2000);
  }

  function updateContextIndicators() {
    setText(els.contextStage, `Stage: ${els.stage.value}`);
    setText(els.contextHistory, `History messages: ${history.length}`);
  }

  function clearResult() {
    setText(els.resultStatus, 'No run yet');
    setText(els.response, 'Run a request to see the response.');
    els.metrics.hidden = true;
    setText(els.log, '[]');
  }

  function resetLocalContext({ stage = 'revision', clearMessage = true, note = 'Test context reset.' } = {}) {
    history = [];
    els.stage.value = stage;
    if (clearMessage) els.message.value = '';
    updateCount();
    updateContextIndicators();
    clearResult();
    setText(els.requestStatus, `${note} Stage=${stage}; history=0.`);
  }

  async function loadHealth() {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('health request failed');
      const data = await response.json();
      setText(els.serverStatus, `Server: WORKING · v${data.version || '—'}`);
      setText(els.keyStatus, `Groq key: ${data.groq_key_present ? 'present' : 'missing'}`);
      els.keyStatus.classList.toggle('warning-pill', !data.groq_key_present);
      setText(els.modelStatus, `Model: ${data.model}`);
    } catch (_) {
      setText(els.serverStatus, 'Server: error');
      els.serverStatus.classList.add('warning-pill');
    }
  }

  async function loadConfig() {
    try {
      const response = await fetch('/api/config', { cache: 'no-store' });
      if (!response.ok) throw new Error('config request failed');
      const data = await response.json();
      setText(els.activityTask, data.task);
      setText(els.configTask, data.task);
      setText(els.hintQuestion, data.hint_question);
      setText(els.agentInstruction, data.instruction);
      setText(els.allowedTool, data.allowed_tool);
      setText(els.materialId, data.allowed_material_id);
    } catch (_) {
      setText(els.activityTask, 'Could not load public activity configuration.');
      setText(els.configTask, 'Could not load configuration.');
    }
  }

  async function loadMaterial() {
    try {
      const response = await fetch('/api/material', { cache: 'no-store' });
      if (!response.ok) throw new Error('material request failed');
      const data = await response.json();
      setText(els.learningCard, data.content || '(approved card is empty)');
    } catch (_) {
      setText(els.learningCard, 'Could not load the approved learning card.');
    }
  }

  function renderResult(data) {
    setText(els.resultStatus, data.status || 'Unknown status');
    els.resultStatus.dataset.status = (data.status || '').toLowerCase().replaceAll(' ', '-');
    setText(els.response, data.message || '(no response text)');
    els.metrics.hidden = false;
    setText(els.metricModel, `Model: ${data.model || 'not called'}`);
    setText(els.metricModelCalls, `Completed model calls: ${data.model_calls ?? 0}`);
    setText(els.metricAttemptedCalls, `Attempted model calls: ${data.model_calls_attempted ?? data.model_calls ?? 0}`);
    setText(els.metricToolCalls, `Tool calls: ${data.tool_calls ?? 0}`);
    setText(els.metricStage, `Stage: ${data.stage || els.stage.value}`);
    setText(els.metricHistory, `History used: ${data.history_messages_used ?? history.length}`);
    setText(els.metricTime, `Elapsed: ${data.elapsed_ms ?? 0} ms`);
    setText(els.log, JSON.stringify(data.log || [], null, 2));
  }

  async function send() {
    const message = els.message.value.trim();
    if (!message) {
      setText(els.requestStatus, 'Write your own attempt or load a prepared request first.');
      els.message.focus();
      return;
    }

    els.send.disabled = true;
    setText(els.requestStatus, `Running bounded turn · stage=${els.stage.value} · history=${history.length}…`);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stage: els.stage.value, history }),
      });

      const data = await response.json();
      if (!response.ok) {
        renderResult({
          status: 'Technical error',
          message: data.detail ? JSON.stringify(data.detail) : `HTTP ${response.status}`,
          model: null, model_calls: 0, model_calls_attempted: 0, tool_calls: 0,
          stage: els.stage.value, history_messages_used: history.length, elapsed_ms: 0, log: [],
        });
      } else {
        renderResult(data);
        if (data.status === 'Completed' && data.message) {
          history.push({ role: 'user', content: message });
          history.push({ role: 'assistant', content: data.message });
          history = history.slice(-4);
        }
      }
      updateContextIndicators();
      setText(els.requestStatus, 'Turn finished. Inspect status, response, stage/history evidence, and factual log.');
    } catch (_) {
      renderResult({
        status: 'Technical error',
        message: 'The browser could not reach the local FastAPI service.',
        model: null, model_calls: 0, model_calls_attempted: 0, tool_calls: 0,
        stage: els.stage.value, history_messages_used: history.length, elapsed_ms: 0, log: [],
      });
      setText(els.requestStatus, 'Request failed.');
    } finally {
      els.send.disabled = false;
    }
  }

  function loadPreparedPrompt(key) {
    const item = prompts[key];
    if (!item) return;
    if (item.resetHistory) history = [];
    els.stage.value = item.stage;
    els.message.value = item.text;
    updateCount();
    updateContextIndicators();
    clearResult();
    setText(els.requestStatus, `${item.label} loaded. Deterministic context: stage=${item.stage}; history=0.`);
    els.message.focus();
  }

  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => loadPreparedPrompt(button.dataset.prompt));
  });

  els.useAttempt?.addEventListener('click', () => {
    const attempt = els.firstAttempt.value.trim();
    if (!attempt) {
      setText(els.requestStatus, 'Write your teaching-format first attempt in the scratchpad before copying it to the agent message.');
      els.firstAttempt.focus();
      return;
    }
    history = [];
    els.message.value = `Here is my own teaching-format first attempt:\n\n${attempt}\n\nUse only the approved learning card. Give me one short hint that helps me improve how I connect my reasons to the stated teaching situation and conditions. Keep me as the author of the final answer.`;
    els.stage.value = 'revision';
    updateCount();
    updateContextIndicators();
    clearResult();
    els.message.focus();
    setText(els.requestStatus, 'Your first attempt was copied into a clean revision context. Stage=revision; history=0.');
  });

  els.stage.addEventListener('change', updateContextIndicators);
  els.message.addEventListener('input', updateCount);
  els.send.addEventListener('click', send);
  els.clear.addEventListener('click', () => resetLocalContext({ stage: 'first_attempt', note: 'Local conversation cleared' }));
  els.resetTest?.addEventListener('click', () => resetLocalContext({ stage: 'revision', note: 'Formal test context reset' }));

  updateCount();
  updateContextIndicators();
  loadHealth();
  loadConfig();
  loadMaterial();
})();
