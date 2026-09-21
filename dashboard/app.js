async function loadDashboard() {
  const status = document.querySelector('#load-status');
  const rows = document.querySelector('#learner-rows');

  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const learners = Array.isArray(data.learners) ? data.learners : [];

    document.querySelector('#total-learners').textContent = String(learners.length);

    const averageAttempts = learners.length
      ? learners.reduce((sum, learner) => sum + learner.attempts, 0) / learners.length
      : 0;
    document.querySelector('#average-attempts').textContent = averageAttempts.toFixed(2);

    // DAY 2 ITERATION A:
    // Add the smallest useful change needed to calculate completed learners
    // from learner.completed and show the result in a new KPI card.
    //
    // DAY 2 ITERATION B:
    // Add one small control that can render only learners whose completed value
    // is false, then return to the full learners array. Reuse the existing data;
    // do not add a framework, dependency, backend, database, or new data file.

    rows.replaceChildren(...learners.map((learner) => {
      const tr = document.createElement('tr');
      [
        learner.name,
        learner.attempts,
        learner.completed ? 'Yes' : 'No',
        learner.response_seconds,
      ].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = String(value);
        tr.appendChild(td);
      });
      return tr;
    }));

    status.textContent = 'Loaded';
  } catch (error) {
    status.textContent = 'Load error';
    rows.innerHTML = '<tr><td colspan="4">Could not load data.json. Start the local HTTP server from this folder instead of opening index.html directly.</td></tr>';
    console.error(error);
  }
}

loadDashboard();
