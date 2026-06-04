// App-level mutable state context. Renderers read ctx.state and call
// ctx.commit() after a local mutation; that fires storage.save() and queues a
// sync push. Renderers don't import storage directly so they stay testable.

export const ctx = {
  state: null,
  _onCommit: null,
  bind(initialState, onCommit) {
    this.state = initialState;
    this._onCommit = onCommit;
  },
  commit() {
    if (this._onCommit) this._onCommit(this.state);
  }
};
