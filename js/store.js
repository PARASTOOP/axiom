// Central in-memory state, backed by DB (localStorage). Single source of
// truth so every service (map, journal, narrative, labs) reads/writes the
// same object and persists immediately after every mutation.
import { DB } from './db.js';

class Store {
  constructor() {
    this.state = DB.load();
    this.listeners = new Set();
  }

  get() {
    return this.state;
  }

  // mutator receives a draft-like plain object; we just pass the live state
  // and persist after. Keep mutations shallow and explicit.
  update(mutator) {
    mutator(this.state);
    DB.save(this.state);
    this.listeners.forEach(fn => fn(this.state));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  resetAll() {
    this.state = DB.reset();
    DB.save(this.state);
    this.listeners.forEach(fn => fn(this.state));
  }
}

export const store = new Store();
