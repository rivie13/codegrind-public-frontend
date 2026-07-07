const createStorageShim = () => ({
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
  clear() {},
});

const createClassListShim = () => ({
  add() {},
  remove() {},
  contains() {
    return false;
  },
});

if (typeof globalThis.document === 'undefined') {
  const createElement = (tagName = 'div') => ({
    tagName: String(tagName).toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    classList: createClassListShim(),
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      return child;
    },
    remove() {},
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    cloneNode() {
      return createElement(tagName);
    },
    contentWindow: {
      document: {
        open() {},
        write() {},
        close() {},
      },
    },
  });

  globalThis.document = {
    cookie: '',
    body: {
      appendChild(child) {
        return child;
      },
      removeChild(child) {
        return child;
      },
      classList: createClassListShim(),
    },
    head: {
      appendChild(child) {
        return child;
      },
      removeChild(child) {
        return child;
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
    },
    createElement,
    getElementById() {
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  };
}

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = {
    userAgent: 'codegrind-node-shim',
    maxTouchPoints: 0,
  };
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback) => globalThis.setTimeout(callback, 0);
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (handle) => globalThis.clearTimeout(handle);
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    document: globalThis.document,
    navigator: globalThis.navigator,
    location: new URL('https://codegrind.online'),
    localStorage: createStorageShim(),
    sessionStorage: createStorageShim(),
    dataLayer: [],
    addEventListener() {},
    removeEventListener() {},
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
}
