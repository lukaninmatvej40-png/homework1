// Apply the saved palette before the first paint. Works when opened as a file.
try {
  const theme = localStorage.getItem('lr-theme');
  if (theme === 'olive' || theme === 'graphite') document.documentElement.dataset.theme = theme;
} catch { /* The browser can disable local storage for local files. */ }
