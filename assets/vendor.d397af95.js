var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function noop() {
}
const identity = (x) => x;
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
  let value;
  subscribe(store, (_) => value = _)();
  return value;
}
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function exclude_internal_props(props) {
  const result = {};
  for (const k in props)
    if (k[0] !== "$")
      result[k] = props[k];
  return result;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event2, handler, options) {
  node.addEventListener(event2, handler, options);
  return () => node.removeEventListener(event2, handler, options);
}
function prevent_default(fn) {
  return function(event2) {
    event2.preventDefault();
    return fn.call(this, event2);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
  const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
  for (const key in attributes) {
    if (attributes[key] == null) {
      node.removeAttribute(key);
    } else if (key === "style") {
      node.style.cssText = attributes[key];
    } else if (key === "__value") {
      node.value = node[key] = attributes[key];
    } else if (descriptors[key] && descriptors[key].set) {
      node[key] = attributes[key];
    } else {
      attr(node, key, attributes[key]);
    }
  }
}
function set_svg_attributes(node, attributes) {
  for (const key in attributes) {
    attr(node, key, attributes[key]);
  }
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
class HtmlTag {
  constructor() {
    this.e = this.n = null;
  }
  c(html) {
    this.h(html);
  }
  m(html, target, anchor = null) {
    if (!this.e) {
      this.e = element(target.nodeName);
      this.t = target;
      this.c(html);
    }
    this.i(anchor);
  }
  h(html) {
    this.e.innerHTML = html;
    this.n = Array.from(this.e.childNodes);
  }
  i(anchor) {
    for (let i = 0; i < this.n.length; i += 1) {
      insert(this.t, this.n[i], anchor);
    }
  }
  p(html) {
    this.d();
    this.h(html);
    this.i(this.a);
  }
  d() {
    this.n.forEach(detach);
  }
}
const managed_styles = new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid2 = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid2}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1);
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { stylesheet } = info;
      let i = stylesheet.cssRules.length;
      while (i--)
        stylesheet.deleteRule(i);
      info.rules = {};
    });
    managed_styles.clear();
  });
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event2 = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event2);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function bubble(component, event2) {
  const callbacks = component.$$.callbacks[event2.type];
  if (callbacks) {
    callbacks.slice().forEach((fn) => fn.call(this, event2));
  }
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
const seen_callbacks = new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block2, local) {
  if (block2 && block2.i) {
    outroing.delete(block2);
    block2.i(local);
  }
}
function transition_out(block2, local, detach2, callback) {
  if (block2 && block2.o) {
    if (outroing.has(block2))
      return;
    outroing.add(block2);
    outros.c.push(() => {
      outroing.delete(block2);
      if (callback) {
        if (detach2)
          block2.d(1);
        callback();
      }
    });
    block2.o(local);
  }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params2) {
  let config = fn(node, params2);
  let running = false;
  let animation_name;
  let task;
  let uid2 = 0;
  function cleanup() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid2++);
    tick2(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task)
      task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, "start"));
    task = loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick2(1, 0);
          dispatch(node, true, "end");
          cleanup();
          return running = false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick2(t, 1 - t);
        }
      }
      return running;
    });
  }
  let started = false;
  return {
    start() {
      if (started)
        return;
      started = true;
      delete_rule(node);
      if (is_function(config)) {
        config = config();
        wait().then(go);
      } else {
        go();
      }
    },
    invalidate() {
      started = false;
    },
    end() {
      if (running) {
        cleanup();
        running = false;
      }
    }
  };
}
function create_out_transition(node, fn, params2) {
  let config = fn(node, params2);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, "start"));
    loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick2(0, 1);
          dispatch(node, false, "end");
          if (!--group.r) {
            run_all(group.c);
          }
          return false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick2(1 - t, t);
        }
      }
      return running;
    });
  }
  if (is_function(config)) {
    wait().then(() => {
      config = config();
      go();
    });
  } else {
    go();
  }
  return {
    end(reset) {
      if (reset && config.tick) {
        config.tick(1, 0);
      }
      if (running) {
        if (animation_name)
          delete_rule(node, animation_name);
        running = false;
      }
    }
  };
}
function create_bidirectional_transition(node, fn, params2, intro) {
  let config = fn(node, params2);
  let t = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d = program.b - t;
    duration *= Math.abs(d);
    return {
      a: t,
      b: program.b,
      d,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b) {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    const program = {
      start: now() + delay,
      b
    };
    if (!b) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t, b, duration, delay, easing, css);
      }
      if (b)
        tick2(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick2(t = running_program.b, 1 - t);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p = now2 - running_program.start;
            t = running_program.a + running_program.d * easing(p / running_program.duration);
            tick2(t, 1 - t);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b) {
      if (is_function(config)) {
        wait().then(() => {
          config = config();
          go(b);
        });
      } else {
        go(b);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function outro_and_destroy_block(block2, lookup) {
  transition_out(block2, 1, 1, () => {
    lookup.delete(block2.key);
  });
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block2, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--)
    old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = new Map();
  const deltas = new Map();
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block2 = lookup.get(key);
    if (!block2) {
      block2 = create_each_block2(key, child_ctx);
      block2.c();
    } else if (dynamic) {
      block2.p(child_ctx, dirty);
    }
    new_lookup.set(key, new_blocks[i] = block2);
    if (key in old_indexes)
      deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = new Set();
  const did_move = new Set();
  function insert2(block2) {
    transition_in(block2, 1);
    block2.m(node, next);
    lookup.set(block2.key, block2);
    next = block2.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key))
      destroy(old_block, lookup);
  }
  while (n)
    insert2(new_blocks[n - 1]);
  return new_blocks;
}
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
function get_spread_object(spread_props) {
  return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
}
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
function create_component(block2) {
  block2 && block2.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
const defaults$1 = {
  color: "currentColor",
  class: "",
  opacity: 0.1,
  centered: false,
  spreadingDuration: ".4s",
  spreadingDelay: "0s",
  spreadingTimingFunction: "linear",
  clearingDuration: "1s",
  clearingDelay: "0s",
  clearingTimingFunction: "ease-in-out"
};
function RippleStart(e, options = {}) {
  e.stopImmediatePropagation();
  const opts = __spreadValues(__spreadValues({}, defaults$1), options);
  const isTouchEvent = e.touches ? !!e.touches[0] : false;
  const target = isTouchEvent ? e.touches[0].currentTarget : e.currentTarget;
  const ripple = document.createElement("div");
  const rippleStyle = ripple.style;
  ripple.className = `material-ripple ${opts.class}`;
  rippleStyle.position = "absolute";
  rippleStyle.color = "inherit";
  rippleStyle.borderRadius = "50%";
  rippleStyle.pointerEvents = "none";
  rippleStyle.width = "100px";
  rippleStyle.height = "100px";
  rippleStyle.marginTop = "-50px";
  rippleStyle.marginLeft = "-50px";
  target.appendChild(ripple);
  rippleStyle.opacity = opts.opacity;
  rippleStyle.transition = `transform ${opts.spreadingDuration} ${opts.spreadingTimingFunction} ${opts.spreadingDelay},opacity ${opts.clearingDuration} ${opts.clearingTimingFunction} ${opts.clearingDelay}`;
  rippleStyle.transform = "scale(0) translate(0,0)";
  rippleStyle.background = opts.color;
  const targetRect = target.getBoundingClientRect();
  if (opts.centered) {
    rippleStyle.top = `${targetRect.height / 2}px`;
    rippleStyle.left = `${targetRect.width / 2}px`;
  } else {
    const distY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    const distX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    rippleStyle.top = `${distY - targetRect.top}px`;
    rippleStyle.left = `${distX - targetRect.left}px`;
  }
  rippleStyle.transform = `scale(${Math.max(targetRect.width, targetRect.height) * 0.02}) translate(0,0)`;
  return ripple;
}
function RippleStop(ripple) {
  if (ripple) {
    ripple.addEventListener("transitionend", (e) => {
      if (e.propertyName === "opacity")
        ripple.remove();
    });
    ripple.style.opacity = 0;
  }
}
var Ripple = (node, _options = {}) => {
  let options = _options;
  let destroyed = false;
  let ripple;
  let keyboardActive = false;
  const handleStart = (e) => {
    ripple = RippleStart(e, options);
  };
  const handleStop = () => RippleStop(ripple);
  const handleKeyboardStart = (e) => {
    if (!keyboardActive && (e.keyCode === 13 || e.keyCode === 32)) {
      ripple = RippleStart(e, __spreadProps(__spreadValues({}, options), { centered: true }));
      keyboardActive = true;
    }
  };
  const handleKeyboardStop = () => {
    keyboardActive = false;
    handleStop();
  };
  function setup() {
    node.classList.add("s-ripple-container");
    node.addEventListener("pointerdown", handleStart);
    node.addEventListener("pointerup", handleStop);
    node.addEventListener("pointerleave", handleStop);
    node.addEventListener("keydown", handleKeyboardStart);
    node.addEventListener("keyup", handleKeyboardStop);
    destroyed = false;
  }
  function destroy() {
    node.classList.remove("s-ripple-container");
    node.removeEventListener("pointerdown", handleStart);
    node.removeEventListener("pointerup", handleStop);
    node.removeEventListener("pointerleave", handleStop);
    node.removeEventListener("keydown", handleKeyboardStart);
    node.removeEventListener("keyup", handleKeyboardStop);
    destroyed = true;
  }
  if (options)
    setup();
  return {
    update(newOptions) {
      options = newOptions;
      if (options && destroyed)
        setup();
      else if (!(options || destroyed))
        destroy();
    },
    destroy
  };
};
var MaterialApp_svelte_svelte_type_style_lang = "";
function create_fragment$o(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[1], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-app theme--" + ctx[0]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 2)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[1], !current ? get_all_dirty_from_scope(ctx2[1]) : get_slot_changes(default_slot_template, ctx2[1], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-app theme--" + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$o($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { theme = "light" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("theme" in $$props2)
      $$invalidate(0, theme = $$props2.theme);
    if ("$$scope" in $$props2)
      $$invalidate(1, $$scope = $$props2.$$scope);
  };
  return [theme, $$scope, slots];
}
class MaterialApp extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$o, create_fragment$o, safe_not_equal, { theme: 0 });
  }
}
var MaterialAppMin_svelte_svelte_type_style_lang = "";
function format$1(input) {
  if (typeof input === "number")
    return `${input}px`;
  return input;
}
var Style = (node, _styles) => {
  let styles = _styles;
  Object.entries(styles).forEach(([key, value]) => {
    if (value)
      node.style.setProperty(`--s-${key}`, format$1(value));
  });
  return {
    update(newStyles) {
      Object.entries(newStyles).forEach(([key, value]) => {
        if (value) {
          node.style.setProperty(`--s-${key}`, format$1(value));
          delete styles[key];
        }
      });
      Object.keys(styles).forEach((name) => node.style.removeProperty(`--s-${name}`));
      styles = newStyles;
    }
  };
};
var Icon_svelte_svelte_type_style_lang = "";
function create_if_block$b(ctx) {
  let svg;
  let path_1;
  let svg_viewBox_value;
  let if_block = ctx[10] && create_if_block_1$3(ctx);
  return {
    c() {
      svg = svg_element("svg");
      path_1 = svg_element("path");
      if (if_block)
        if_block.c();
      attr(path_1, "d", ctx[9]);
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "width", ctx[0]);
      attr(svg, "height", ctx[1]);
      attr(svg, "viewBox", svg_viewBox_value = "0 0 " + ctx[4] + " " + ctx[5]);
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path_1);
      if (if_block)
        if_block.m(path_1, null);
    },
    p(ctx2, dirty) {
      if (ctx2[10]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_1$3(ctx2);
          if_block.c();
          if_block.m(path_1, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 512) {
        attr(path_1, "d", ctx2[9]);
      }
      if (dirty & 1) {
        attr(svg, "width", ctx2[0]);
      }
      if (dirty & 2) {
        attr(svg, "height", ctx2[1]);
      }
      if (dirty & 48 && svg_viewBox_value !== (svg_viewBox_value = "0 0 " + ctx2[4] + " " + ctx2[5])) {
        attr(svg, "viewBox", svg_viewBox_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(svg);
      if (if_block)
        if_block.d();
    }
  };
}
function create_if_block_1$3(ctx) {
  let title;
  let t;
  return {
    c() {
      title = svg_element("title");
      t = text(ctx[10]);
    },
    m(target, anchor) {
      insert(target, title, anchor);
      append(title, t);
    },
    p(ctx2, dirty) {
      if (dirty & 1024)
        set_data(t, ctx2[10]);
    },
    d(detaching) {
      if (detaching)
        detach(title);
    }
  };
}
function create_fragment$n(ctx) {
  let i;
  let t;
  let i_class_value;
  let Style_action;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[9] && create_if_block$b(ctx);
  const default_slot_template = ctx[13].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[12], null);
  return {
    c() {
      i = element("i");
      if (if_block)
        if_block.c();
      t = space();
      if (default_slot)
        default_slot.c();
      attr(i, "aria-hidden", "true");
      attr(i, "class", i_class_value = "s-icon " + ctx[2]);
      attr(i, "aria-label", ctx[10]);
      attr(i, "aria-disabled", ctx[8]);
      attr(i, "style", ctx[11]);
      toggle_class(i, "spin", ctx[7]);
      toggle_class(i, "disabled", ctx[8]);
    },
    m(target, anchor) {
      insert(target, i, anchor);
      if (if_block)
        if_block.m(i, null);
      append(i, t);
      if (default_slot) {
        default_slot.m(i, null);
      }
      current = true;
      if (!mounted) {
        dispose = action_destroyer(Style_action = Style.call(null, i, {
          "icon-size": ctx[3],
          "icon-rotate": `${ctx[6]}deg`
        }));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[9]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$b(ctx2);
          if_block.c();
          if_block.m(i, t);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4096)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[12], !current ? get_all_dirty_from_scope(ctx2[12]) : get_slot_changes(default_slot_template, ctx2[12], dirty, null), null);
        }
      }
      if (!current || dirty & 4 && i_class_value !== (i_class_value = "s-icon " + ctx2[2])) {
        attr(i, "class", i_class_value);
      }
      if (!current || dirty & 1024) {
        attr(i, "aria-label", ctx2[10]);
      }
      if (!current || dirty & 256) {
        attr(i, "aria-disabled", ctx2[8]);
      }
      if (!current || dirty & 2048) {
        attr(i, "style", ctx2[11]);
      }
      if (Style_action && is_function(Style_action.update) && dirty & 72)
        Style_action.update.call(null, {
          "icon-size": ctx2[3],
          "icon-rotate": `${ctx2[6]}deg`
        });
      if (dirty & 132) {
        toggle_class(i, "spin", ctx2[7]);
      }
      if (dirty & 260) {
        toggle_class(i, "disabled", ctx2[8]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(i);
      if (if_block)
        if_block.d();
      if (default_slot)
        default_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$n($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { size = "24px" } = $$props;
  let { width = size } = $$props;
  let { height = size } = $$props;
  let { viewWidth = "24" } = $$props;
  let { viewHeight = "24" } = $$props;
  let { rotate = 0 } = $$props;
  let { spin = false } = $$props;
  let { disabled = false } = $$props;
  let { path = null } = $$props;
  let { label = null } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(2, klass = $$props2.class);
    if ("size" in $$props2)
      $$invalidate(3, size = $$props2.size);
    if ("width" in $$props2)
      $$invalidate(0, width = $$props2.width);
    if ("height" in $$props2)
      $$invalidate(1, height = $$props2.height);
    if ("viewWidth" in $$props2)
      $$invalidate(4, viewWidth = $$props2.viewWidth);
    if ("viewHeight" in $$props2)
      $$invalidate(5, viewHeight = $$props2.viewHeight);
    if ("rotate" in $$props2)
      $$invalidate(6, rotate = $$props2.rotate);
    if ("spin" in $$props2)
      $$invalidate(7, spin = $$props2.spin);
    if ("disabled" in $$props2)
      $$invalidate(8, disabled = $$props2.disabled);
    if ("path" in $$props2)
      $$invalidate(9, path = $$props2.path);
    if ("label" in $$props2)
      $$invalidate(10, label = $$props2.label);
    if ("style" in $$props2)
      $$invalidate(11, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(12, $$scope = $$props2.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 8) {
      {
        $$invalidate(0, width = size);
        $$invalidate(1, height = size);
      }
    }
  };
  return [
    width,
    height,
    klass,
    size,
    viewWidth,
    viewHeight,
    rotate,
    spin,
    disabled,
    path,
    label,
    style,
    $$scope,
    slots
  ];
}
class Icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$n, create_fragment$n, safe_not_equal, {
      class: 2,
      size: 3,
      width: 0,
      height: 1,
      viewWidth: 4,
      viewHeight: 5,
      rotate: 6,
      spin: 7,
      disabled: 8,
      path: 9,
      label: 10,
      style: 11
    });
  }
}
const filter = (classes) => classes.filter((x) => !!x);
const format = (classes) => classes.split(" ").filter((x) => !!x);
var Class = (node, _classes) => {
  let classes = _classes;
  node.classList.add(...format(filter(classes).join(" ")));
  return {
    update(_newClasses) {
      const newClasses = _newClasses;
      newClasses.forEach((klass, i) => {
        if (klass)
          node.classList.add(...format(klass));
        else if (classes[i])
          node.classList.remove(...format(classes[i]));
      });
      classes = newClasses;
    }
  };
};
var Button_svelte_svelte_type_style_lang = "";
function create_fragment$m(ctx) {
  let button_1;
  let span;
  let button_1_class_value;
  let Class_action;
  let Ripple_action;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[19].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[18], null);
  let button_1_levels = [
    {
      class: button_1_class_value = "s-btn size-" + ctx[5] + " " + ctx[1]
    },
    { type: ctx[14] },
    { style: ctx[16] },
    { disabled: ctx[11] },
    { "aria-disabled": ctx[11] },
    ctx[17]
  ];
  let button_1_data = {};
  for (let i = 0; i < button_1_levels.length; i += 1) {
    button_1_data = assign(button_1_data, button_1_levels[i]);
  }
  return {
    c() {
      button_1 = element("button");
      span = element("span");
      if (default_slot)
        default_slot.c();
      attr(span, "class", "s-btn__content");
      set_attributes(button_1, button_1_data);
      toggle_class(button_1, "s-btn--fab", ctx[2]);
      toggle_class(button_1, "icon", ctx[3]);
      toggle_class(button_1, "block", ctx[4]);
      toggle_class(button_1, "tile", ctx[6]);
      toggle_class(button_1, "text", ctx[7] || ctx[3]);
      toggle_class(button_1, "depressed", ctx[8] || ctx[7] || ctx[11] || ctx[9] || ctx[3]);
      toggle_class(button_1, "outlined", ctx[9]);
      toggle_class(button_1, "rounded", ctx[10]);
      toggle_class(button_1, "disabled", ctx[11]);
    },
    m(target, anchor) {
      insert(target, button_1, anchor);
      append(button_1, span);
      if (default_slot) {
        default_slot.m(span, null);
      }
      if (button_1.autofocus)
        button_1.focus();
      ctx[21](button_1);
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(Class_action = Class.call(null, button_1, [ctx[12] && ctx[13]])),
          action_destroyer(Ripple_action = Ripple.call(null, button_1, ctx[15])),
          listen(button_1, "click", ctx[20])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 262144)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[18], !current ? get_all_dirty_from_scope(ctx2[18]) : get_slot_changes(default_slot_template, ctx2[18], dirty, null), null);
        }
      }
      set_attributes(button_1, button_1_data = get_spread_update(button_1_levels, [
        (!current || dirty & 34 && button_1_class_value !== (button_1_class_value = "s-btn size-" + ctx2[5] + " " + ctx2[1])) && { class: button_1_class_value },
        (!current || dirty & 16384) && { type: ctx2[14] },
        (!current || dirty & 65536) && { style: ctx2[16] },
        (!current || dirty & 2048) && { disabled: ctx2[11] },
        (!current || dirty & 2048) && { "aria-disabled": ctx2[11] },
        dirty & 131072 && ctx2[17]
      ]));
      if (Class_action && is_function(Class_action.update) && dirty & 12288)
        Class_action.update.call(null, [ctx2[12] && ctx2[13]]);
      if (Ripple_action && is_function(Ripple_action.update) && dirty & 32768)
        Ripple_action.update.call(null, ctx2[15]);
      toggle_class(button_1, "s-btn--fab", ctx2[2]);
      toggle_class(button_1, "icon", ctx2[3]);
      toggle_class(button_1, "block", ctx2[4]);
      toggle_class(button_1, "tile", ctx2[6]);
      toggle_class(button_1, "text", ctx2[7] || ctx2[3]);
      toggle_class(button_1, "depressed", ctx2[8] || ctx2[7] || ctx2[11] || ctx2[9] || ctx2[3]);
      toggle_class(button_1, "outlined", ctx2[9]);
      toggle_class(button_1, "rounded", ctx2[10]);
      toggle_class(button_1, "disabled", ctx2[11]);
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(button_1);
      if (default_slot)
        default_slot.d(detaching);
      ctx[21](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$m($$self, $$props, $$invalidate) {
  const omit_props_names = [
    "class",
    "fab",
    "icon",
    "block",
    "size",
    "tile",
    "text",
    "depressed",
    "outlined",
    "rounded",
    "disabled",
    "active",
    "activeClass",
    "type",
    "ripple",
    "style",
    "button"
  ];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { fab = false } = $$props;
  let { icon = false } = $$props;
  let { block: block2 = false } = $$props;
  let { size = "default" } = $$props;
  let { tile = false } = $$props;
  let { text: text2 = false } = $$props;
  let { depressed = false } = $$props;
  let { outlined = false } = $$props;
  let { rounded = false } = $$props;
  let { disabled = null } = $$props;
  let { active: active2 = false } = $$props;
  let { activeClass = "active" } = $$props;
  let { type = "button" } = $$props;
  let { ripple = {} } = $$props;
  let { style = null } = $$props;
  let { button = null } = $$props;
  function click_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function button_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      button = $$value;
      $$invalidate(0, button);
    });
  }
  $$self.$$set = ($$new_props) => {
    $$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    $$invalidate(17, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("class" in $$new_props)
      $$invalidate(1, klass = $$new_props.class);
    if ("fab" in $$new_props)
      $$invalidate(2, fab = $$new_props.fab);
    if ("icon" in $$new_props)
      $$invalidate(3, icon = $$new_props.icon);
    if ("block" in $$new_props)
      $$invalidate(4, block2 = $$new_props.block);
    if ("size" in $$new_props)
      $$invalidate(5, size = $$new_props.size);
    if ("tile" in $$new_props)
      $$invalidate(6, tile = $$new_props.tile);
    if ("text" in $$new_props)
      $$invalidate(7, text2 = $$new_props.text);
    if ("depressed" in $$new_props)
      $$invalidate(8, depressed = $$new_props.depressed);
    if ("outlined" in $$new_props)
      $$invalidate(9, outlined = $$new_props.outlined);
    if ("rounded" in $$new_props)
      $$invalidate(10, rounded = $$new_props.rounded);
    if ("disabled" in $$new_props)
      $$invalidate(11, disabled = $$new_props.disabled);
    if ("active" in $$new_props)
      $$invalidate(12, active2 = $$new_props.active);
    if ("activeClass" in $$new_props)
      $$invalidate(13, activeClass = $$new_props.activeClass);
    if ("type" in $$new_props)
      $$invalidate(14, type = $$new_props.type);
    if ("ripple" in $$new_props)
      $$invalidate(15, ripple = $$new_props.ripple);
    if ("style" in $$new_props)
      $$invalidate(16, style = $$new_props.style);
    if ("button" in $$new_props)
      $$invalidate(0, button = $$new_props.button);
    if ("$$scope" in $$new_props)
      $$invalidate(18, $$scope = $$new_props.$$scope);
  };
  return [
    button,
    klass,
    fab,
    icon,
    block2,
    size,
    tile,
    text2,
    depressed,
    outlined,
    rounded,
    disabled,
    active2,
    activeClass,
    type,
    ripple,
    style,
    $$restProps,
    $$scope,
    slots,
    click_handler,
    button_1_binding
  ];
}
class Button extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$m, create_fragment$m, safe_not_equal, {
      class: 1,
      fab: 2,
      icon: 3,
      block: 4,
      size: 5,
      tile: 6,
      text: 7,
      depressed: 8,
      outlined: 9,
      rounded: 10,
      disabled: 11,
      active: 12,
      activeClass: 13,
      type: 14,
      ripple: 15,
      style: 16,
      button: 0
    });
  }
}
const subscriber_queue = [];
function readable(value, start2) {
  return {
    subscribe: writable(value, start2).subscribe
  };
}
function writable(value, start2 = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update2(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start2(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update2, subscribe: subscribe2 };
}
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, (set) => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = () => {
      if (pending) {
        return;
      }
      cleanup();
      const result = fn(single ? values[0] : values, set);
      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };
    const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
      values[i] = value;
      pending &= ~(1 << i);
      if (inited) {
        sync();
      }
    }, () => {
      pending |= 1 << i;
    }));
    inited = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
    };
  });
}
var ItemGroup_svelte_svelte_type_style_lang = "";
var ButtonGroup_svelte_svelte_type_style_lang = "";
var ButtonGroupItem_svelte_svelte_type_style_lang = "";
function formatClass$1(klass) {
  return klass.split(" ").map((i) => {
    if (/^(lighten|darken|accent)-/.test(i)) {
      return `text-${i}`;
    }
    return `${i}-text`;
  });
}
function setTextColor(node, text2) {
  if (/^(#|rgb|hsl|currentColor)/.test(text2)) {
    node.style.color = text2;
    return false;
  }
  if (text2.startsWith("--")) {
    node.style.color = `var(${text2})`;
    return false;
  }
  const klass = formatClass$1(text2);
  node.classList.add(...klass);
  return klass;
}
var TextColor = (node, text2) => {
  let klass;
  if (typeof text2 === "string") {
    klass = setTextColor(node, text2);
  }
  return {
    update(newText) {
      if (klass) {
        node.classList.remove(...klass);
      } else {
        node.style.color = null;
      }
      if (typeof newText === "string") {
        klass = setTextColor(node, newText);
      }
    }
  };
};
var Input_svelte_svelte_type_style_lang = "";
const get_append_outer_slot_changes$1 = (dirty) => ({});
const get_append_outer_slot_context$1 = (ctx) => ({});
const get_messages_slot_changes = (dirty) => ({});
const get_messages_slot_context = (ctx) => ({});
const get_prepend_outer_slot_changes$1 = (dirty) => ({});
const get_prepend_outer_slot_context$1 = (ctx) => ({});
function create_fragment$l(ctx) {
  let div3;
  let t0;
  let div2;
  let div0;
  let t1;
  let div1;
  let t2;
  let div3_class_value;
  let TextColor_action;
  let current;
  let mounted;
  let dispose;
  const prepend_outer_slot_template = ctx[9]["prepend-outer"];
  const prepend_outer_slot = create_slot(prepend_outer_slot_template, ctx, ctx[8], get_prepend_outer_slot_context$1);
  const default_slot_template = ctx[9].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[8], null);
  const messages_slot_template = ctx[9].messages;
  const messages_slot = create_slot(messages_slot_template, ctx, ctx[8], get_messages_slot_context);
  const append_outer_slot_template = ctx[9]["append-outer"];
  const append_outer_slot = create_slot(append_outer_slot_template, ctx, ctx[8], get_append_outer_slot_context$1);
  return {
    c() {
      div3 = element("div");
      if (prepend_outer_slot)
        prepend_outer_slot.c();
      t0 = space();
      div2 = element("div");
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      t1 = space();
      div1 = element("div");
      if (messages_slot)
        messages_slot.c();
      t2 = space();
      if (append_outer_slot)
        append_outer_slot.c();
      attr(div0, "class", "s-input__slot");
      attr(div1, "class", "s-input__details");
      attr(div2, "class", "s-input__control");
      attr(div3, "class", div3_class_value = "s-input " + ctx[0]);
      attr(div3, "style", ctx[7]);
      toggle_class(div3, "dense", ctx[2]);
      toggle_class(div3, "error", ctx[5]);
      toggle_class(div3, "success", ctx[6]);
      toggle_class(div3, "readonly", ctx[3]);
      toggle_class(div3, "disabled", ctx[4]);
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      if (prepend_outer_slot) {
        prepend_outer_slot.m(div3, null);
      }
      append(div3, t0);
      append(div3, div2);
      append(div2, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      append(div2, t1);
      append(div2, div1);
      if (messages_slot) {
        messages_slot.m(div1, null);
      }
      append(div3, t2);
      if (append_outer_slot) {
        append_outer_slot.m(div3, null);
      }
      current = true;
      if (!mounted) {
        dispose = action_destroyer(TextColor_action = TextColor.call(null, div3, ctx[6] ? "success" : ctx[5] ? "error" : ctx[1]));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (prepend_outer_slot) {
        if (prepend_outer_slot.p && (!current || dirty & 256)) {
          update_slot_base(prepend_outer_slot, prepend_outer_slot_template, ctx2, ctx2[8], !current ? get_all_dirty_from_scope(ctx2[8]) : get_slot_changes(prepend_outer_slot_template, ctx2[8], dirty, get_prepend_outer_slot_changes$1), get_prepend_outer_slot_context$1);
        }
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 256)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[8], !current ? get_all_dirty_from_scope(ctx2[8]) : get_slot_changes(default_slot_template, ctx2[8], dirty, null), null);
        }
      }
      if (messages_slot) {
        if (messages_slot.p && (!current || dirty & 256)) {
          update_slot_base(messages_slot, messages_slot_template, ctx2, ctx2[8], !current ? get_all_dirty_from_scope(ctx2[8]) : get_slot_changes(messages_slot_template, ctx2[8], dirty, get_messages_slot_changes), get_messages_slot_context);
        }
      }
      if (append_outer_slot) {
        if (append_outer_slot.p && (!current || dirty & 256)) {
          update_slot_base(append_outer_slot, append_outer_slot_template, ctx2, ctx2[8], !current ? get_all_dirty_from_scope(ctx2[8]) : get_slot_changes(append_outer_slot_template, ctx2[8], dirty, get_append_outer_slot_changes$1), get_append_outer_slot_context$1);
        }
      }
      if (!current || dirty & 1 && div3_class_value !== (div3_class_value = "s-input " + ctx2[0])) {
        attr(div3, "class", div3_class_value);
      }
      if (!current || dirty & 128) {
        attr(div3, "style", ctx2[7]);
      }
      if (TextColor_action && is_function(TextColor_action.update) && dirty & 98)
        TextColor_action.update.call(null, ctx2[6] ? "success" : ctx2[5] ? "error" : ctx2[1]);
      if (dirty & 5) {
        toggle_class(div3, "dense", ctx2[2]);
      }
      if (dirty & 33) {
        toggle_class(div3, "error", ctx2[5]);
      }
      if (dirty & 65) {
        toggle_class(div3, "success", ctx2[6]);
      }
      if (dirty & 9) {
        toggle_class(div3, "readonly", ctx2[3]);
      }
      if (dirty & 17) {
        toggle_class(div3, "disabled", ctx2[4]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(prepend_outer_slot, local);
      transition_in(default_slot, local);
      transition_in(messages_slot, local);
      transition_in(append_outer_slot, local);
      current = true;
    },
    o(local) {
      transition_out(prepend_outer_slot, local);
      transition_out(default_slot, local);
      transition_out(messages_slot, local);
      transition_out(append_outer_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div3);
      if (prepend_outer_slot)
        prepend_outer_slot.d(detaching);
      if (default_slot)
        default_slot.d(detaching);
      if (messages_slot)
        messages_slot.d(detaching);
      if (append_outer_slot)
        append_outer_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$l($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { color = null } = $$props;
  let { dense = false } = $$props;
  let { readonly = false } = $$props;
  let { disabled = false } = $$props;
  let { error = false } = $$props;
  let { success = false } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("color" in $$props2)
      $$invalidate(1, color = $$props2.color);
    if ("dense" in $$props2)
      $$invalidate(2, dense = $$props2.dense);
    if ("readonly" in $$props2)
      $$invalidate(3, readonly = $$props2.readonly);
    if ("disabled" in $$props2)
      $$invalidate(4, disabled = $$props2.disabled);
    if ("error" in $$props2)
      $$invalidate(5, error = $$props2.error);
    if ("success" in $$props2)
      $$invalidate(6, success = $$props2.success);
    if ("style" in $$props2)
      $$invalidate(7, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(8, $$scope = $$props2.$$scope);
  };
  return [klass, color, dense, readonly, disabled, error, success, style, $$scope, slots];
}
class Input extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$l, create_fragment$l, safe_not_equal, {
      class: 0,
      color: 1,
      dense: 2,
      readonly: 3,
      disabled: 4,
      error: 5,
      success: 6,
      style: 7
    });
  }
}
let IDX = 36;
let HEX = "";
while (IDX--)
  HEX += IDX.toString(36);
var uid = (len) => {
  let str = "";
  let num = len || 11;
  while (num--)
    str += HEX[Math.random() * 36 | 0];
  return str;
};
var closeIcon = "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z";
const get_append_slot_changes$2 = (dirty) => ({});
const get_append_slot_context$2 = (ctx) => ({});
const get_clear_icon_slot_changes = (dirty) => ({});
const get_clear_icon_slot_context = (ctx) => ({});
const get_content_slot_changes = (dirty) => ({});
const get_content_slot_context = (ctx) => ({});
const get_prepend_slot_changes$2 = (dirty) => ({});
const get_prepend_slot_context$2 = (ctx) => ({});
const get_prepend_outer_slot_changes = (dirty) => ({});
const get_prepend_outer_slot_context = (ctx) => ({ slot: "prepend-outer" });
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[44] = list[i];
  return child_ctx;
}
function get_each_context_1$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[44] = list[i];
  return child_ctx;
}
const get_append_outer_slot_changes = (dirty) => ({});
const get_append_outer_slot_context = (ctx) => ({ slot: "append-outer" });
function create_if_block_1$2(ctx) {
  let div;
  let current;
  let mounted;
  let dispose;
  const clear_icon_slot_template = ctx[33]["clear-icon"];
  const clear_icon_slot = create_slot(clear_icon_slot_template, ctx, ctx[43], get_clear_icon_slot_context);
  const clear_icon_slot_or_fallback = clear_icon_slot || fallback_block$1();
  return {
    c() {
      div = element("div");
      if (clear_icon_slot_or_fallback)
        clear_icon_slot_or_fallback.c();
      set_style(div, "cursor", "pointer");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (clear_icon_slot_or_fallback) {
        clear_icon_slot_or_fallback.m(div, null);
      }
      current = true;
      if (!mounted) {
        dispose = listen(div, "click", ctx[26]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (clear_icon_slot) {
        if (clear_icon_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(clear_icon_slot, clear_icon_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(clear_icon_slot_template, ctx2[43], dirty, get_clear_icon_slot_changes), get_clear_icon_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(clear_icon_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(clear_icon_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (clear_icon_slot_or_fallback)
        clear_icon_slot_or_fallback.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function fallback_block$1(ctx) {
  let icon;
  let current;
  icon = new Icon({ props: { path: closeIcon } });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_default_slot(ctx) {
  let div1;
  let t0;
  let div0;
  let label;
  let t1;
  let t2;
  let input;
  let t3;
  let t4;
  let current;
  let mounted;
  let dispose;
  const prepend_slot_template = ctx[33].prepend;
  const prepend_slot = create_slot(prepend_slot_template, ctx, ctx[43], get_prepend_slot_context$2);
  const default_slot_template = ctx[33].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[43], null);
  const content_slot_template = ctx[33].content;
  const content_slot = create_slot(content_slot_template, ctx, ctx[43], get_content_slot_context);
  let input_levels = [
    { type: "text" },
    { placeholder: ctx[14] },
    { id: ctx[20] },
    { readOnly: ctx[12] },
    { disabled: ctx[13] },
    ctx[28]
  ];
  let input_data = {};
  for (let i = 0; i < input_levels.length; i += 1) {
    input_data = assign(input_data, input_levels[i]);
  }
  let if_block = ctx[11] && ctx[0] !== "" && create_if_block_1$2(ctx);
  const append_slot_template = ctx[33].append;
  const append_slot = create_slot(append_slot_template, ctx, ctx[43], get_append_slot_context$2);
  return {
    c() {
      div1 = element("div");
      if (prepend_slot)
        prepend_slot.c();
      t0 = space();
      div0 = element("div");
      label = element("label");
      if (default_slot)
        default_slot.c();
      t1 = space();
      if (content_slot)
        content_slot.c();
      t2 = space();
      input = element("input");
      t3 = space();
      if (if_block)
        if_block.c();
      t4 = space();
      if (append_slot)
        append_slot.c();
      attr(label, "for", ctx[20]);
      toggle_class(label, "active", ctx[23]);
      set_attributes(input, input_data);
      attr(div0, "class", "s-text-field__input");
      attr(div1, "class", "s-text-field__wrapper");
      toggle_class(div1, "filled", ctx[5]);
      toggle_class(div1, "solo", ctx[6]);
      toggle_class(div1, "outlined", ctx[7]);
      toggle_class(div1, "flat", ctx[8]);
      toggle_class(div1, "rounded", ctx[10]);
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (prepend_slot) {
        prepend_slot.m(div1, null);
      }
      append(div1, t0);
      append(div1, div0);
      append(div0, label);
      if (default_slot) {
        default_slot.m(label, null);
      }
      append(div0, t1);
      if (content_slot) {
        content_slot.m(div0, null);
      }
      append(div0, t2);
      append(div0, input);
      if (input.autofocus)
        input.focus();
      ctx[41](input);
      set_input_value(input, ctx[0]);
      append(div1, t3);
      if (if_block)
        if_block.m(div1, null);
      append(div1, t4);
      if (append_slot) {
        append_slot.m(div1, null);
      }
      current = true;
      if (!mounted) {
        dispose = [
          listen(input, "input", ctx[42]),
          listen(input, "focus", ctx[24]),
          listen(input, "blur", ctx[25]),
          listen(input, "input", ctx[27]),
          listen(input, "focus", ctx[34]),
          listen(input, "blur", ctx[35]),
          listen(input, "input", ctx[36]),
          listen(input, "change", ctx[37]),
          listen(input, "keypress", ctx[38]),
          listen(input, "keydown", ctx[39]),
          listen(input, "keyup", ctx[40])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (prepend_slot) {
        if (prepend_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(prepend_slot, prepend_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(prepend_slot_template, ctx2[43], dirty, get_prepend_slot_changes$2), get_prepend_slot_context$2);
        }
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(default_slot_template, ctx2[43], dirty, null), null);
        }
      }
      if (!current || dirty[0] & 1048576) {
        attr(label, "for", ctx2[20]);
      }
      if (dirty[0] & 8388608) {
        toggle_class(label, "active", ctx2[23]);
      }
      if (content_slot) {
        if (content_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(content_slot, content_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(content_slot_template, ctx2[43], dirty, get_content_slot_changes), get_content_slot_context);
        }
      }
      set_attributes(input, input_data = get_spread_update(input_levels, [
        { type: "text" },
        (!current || dirty[0] & 16384) && { placeholder: ctx2[14] },
        (!current || dirty[0] & 1048576) && { id: ctx2[20] },
        (!current || dirty[0] & 4096) && { readOnly: ctx2[12] },
        (!current || dirty[0] & 8192) && { disabled: ctx2[13] },
        dirty[0] & 268435456 && ctx2[28]
      ]));
      if (dirty[0] & 1 && input.value !== ctx2[0]) {
        set_input_value(input, ctx2[0]);
      }
      if (ctx2[11] && ctx2[0] !== "") {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty[0] & 2049) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_1$2(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div1, t4);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      if (append_slot) {
        if (append_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(append_slot, append_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(append_slot_template, ctx2[43], dirty, get_append_slot_changes$2), get_append_slot_context$2);
        }
      }
      if (dirty[0] & 32) {
        toggle_class(div1, "filled", ctx2[5]);
      }
      if (dirty[0] & 64) {
        toggle_class(div1, "solo", ctx2[6]);
      }
      if (dirty[0] & 128) {
        toggle_class(div1, "outlined", ctx2[7]);
      }
      if (dirty[0] & 256) {
        toggle_class(div1, "flat", ctx2[8]);
      }
      if (dirty[0] & 1024) {
        toggle_class(div1, "rounded", ctx2[10]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(prepend_slot, local);
      transition_in(default_slot, local);
      transition_in(content_slot, local);
      transition_in(if_block);
      transition_in(append_slot, local);
      current = true;
    },
    o(local) {
      transition_out(prepend_slot, local);
      transition_out(default_slot, local);
      transition_out(content_slot, local);
      transition_out(if_block);
      transition_out(append_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (prepend_slot)
        prepend_slot.d(detaching);
      if (default_slot)
        default_slot.d(detaching);
      if (content_slot)
        content_slot.d(detaching);
      ctx[41](null);
      if (if_block)
        if_block.d();
      if (append_slot)
        append_slot.d(detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_prepend_outer_slot(ctx) {
  let current;
  const prepend_outer_slot_template = ctx[33]["prepend-outer"];
  const prepend_outer_slot = create_slot(prepend_outer_slot_template, ctx, ctx[43], get_prepend_outer_slot_context);
  return {
    c() {
      if (prepend_outer_slot)
        prepend_outer_slot.c();
    },
    m(target, anchor) {
      if (prepend_outer_slot) {
        prepend_outer_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (prepend_outer_slot) {
        if (prepend_outer_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(prepend_outer_slot, prepend_outer_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(prepend_outer_slot_template, ctx2[43], dirty, get_prepend_outer_slot_changes), get_prepend_outer_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(prepend_outer_slot, local);
      current = true;
    },
    o(local) {
      transition_out(prepend_outer_slot, local);
      current = false;
    },
    d(detaching) {
      if (prepend_outer_slot)
        prepend_outer_slot.d(detaching);
    }
  };
}
function create_each_block_1$1(ctx) {
  let span;
  let t_value = ctx[44] + "";
  let t;
  return {
    c() {
      span = element("span");
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 131072 && t_value !== (t_value = ctx2[44] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_each_block$1(ctx) {
  let span;
  let t_value = ctx[44] + "";
  let t;
  return {
    c() {
      span = element("span");
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 4456448 && t_value !== (t_value = ctx2[44] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_if_block$a(ctx) {
  let span;
  let t0_value = ctx[0].length + "";
  let t0;
  let t1;
  let t2;
  return {
    c() {
      span = element("span");
      t0 = text(t0_value);
      t1 = text(" / ");
      t2 = text(ctx[16]);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 1 && t0_value !== (t0_value = ctx2[0].length + ""))
        set_data(t0, t0_value);
      if (dirty[0] & 65536)
        set_data(t2, ctx2[16]);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_messages_slot(ctx) {
  let div1;
  let div0;
  let span;
  let t0;
  let t1;
  let t2;
  let t3;
  let each_value_1 = ctx[17];
  let each_blocks_1 = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
  }
  let each_value = ctx[22].slice(0, ctx[18]);
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  }
  let if_block = ctx[16] && create_if_block$a(ctx);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      span = element("span");
      t0 = text(ctx[15]);
      t1 = space();
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        each_blocks_1[i].c();
      }
      t2 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t3 = space();
      if (if_block)
        if_block.c();
      attr(div1, "slot", "messages");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, span);
      append(span, t0);
      append(div0, t1);
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        each_blocks_1[i].m(div0, null);
      }
      append(div0, t2);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div0, null);
      }
      append(div1, t3);
      if (if_block)
        if_block.m(div1, null);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 32768)
        set_data(t0, ctx2[15]);
      if (dirty[0] & 131072) {
        each_value_1 = ctx2[17];
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1$1(ctx2, each_value_1, i);
          if (each_blocks_1[i]) {
            each_blocks_1[i].p(child_ctx, dirty);
          } else {
            each_blocks_1[i] = create_each_block_1$1(child_ctx);
            each_blocks_1[i].c();
            each_blocks_1[i].m(div0, t2);
          }
        }
        for (; i < each_blocks_1.length; i += 1) {
          each_blocks_1[i].d(1);
        }
        each_blocks_1.length = each_value_1.length;
      }
      if (dirty[0] & 4456448) {
        each_value = ctx2[22].slice(0, ctx2[18]);
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div0, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (ctx2[16]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$a(ctx2);
          if_block.c();
          if_block.m(div1, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      destroy_each(each_blocks_1, detaching);
      destroy_each(each_blocks, detaching);
      if (if_block)
        if_block.d();
    }
  };
}
function create_append_outer_slot(ctx) {
  let current;
  const append_outer_slot_template = ctx[33]["append-outer"];
  const append_outer_slot = create_slot(append_outer_slot_template, ctx, ctx[43], get_append_outer_slot_context);
  return {
    c() {
      if (append_outer_slot)
        append_outer_slot.c();
    },
    m(target, anchor) {
      if (append_outer_slot) {
        append_outer_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (append_outer_slot) {
        if (append_outer_slot.p && (!current || dirty[1] & 4096)) {
          update_slot_base(append_outer_slot, append_outer_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(append_outer_slot_template, ctx2[43], dirty, get_append_outer_slot_changes), get_append_outer_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(append_outer_slot, local);
      current = true;
    },
    o(local) {
      transition_out(append_outer_slot, local);
      current = false;
    },
    d(detaching) {
      if (append_outer_slot)
        append_outer_slot.d(detaching);
    }
  };
}
function create_fragment$k(ctx) {
  let input;
  let current;
  input = new Input({
    props: {
      class: "s-text-field " + ctx[3],
      color: ctx[4],
      dense: ctx[9],
      readonly: ctx[12],
      disabled: ctx[13],
      error: ctx[1],
      success: ctx[19],
      style: ctx[21],
      $$slots: {
        "append-outer": [create_append_outer_slot],
        messages: [create_messages_slot],
        "prepend-outer": [create_prepend_outer_slot],
        default: [create_default_slot]
      },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const input_changes = {};
      if (dirty[0] & 8)
        input_changes.class = "s-text-field " + ctx2[3];
      if (dirty[0] & 16)
        input_changes.color = ctx2[4];
      if (dirty[0] & 512)
        input_changes.dense = ctx2[9];
      if (dirty[0] & 4096)
        input_changes.readonly = ctx2[12];
      if (dirty[0] & 8192)
        input_changes.disabled = ctx2[13];
      if (dirty[0] & 2)
        input_changes.error = ctx2[1];
      if (dirty[0] & 524288)
        input_changes.success = ctx2[19];
      if (dirty[0] & 2097152)
        input_changes.style = ctx2[21];
      if (dirty[0] & 282590693 | dirty[1] & 4096) {
        input_changes.$$scope = { dirty, ctx: ctx2 };
      }
      input.$set(input_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    }
  };
}
function instance$k($$self, $$props, $$invalidate) {
  let labelActive;
  const omit_props_names = [
    "class",
    "value",
    "color",
    "filled",
    "solo",
    "outlined",
    "flat",
    "dense",
    "rounded",
    "clearable",
    "readonly",
    "disabled",
    "placeholder",
    "hint",
    "counter",
    "messages",
    "rules",
    "errorCount",
    "validateOnBlur",
    "error",
    "success",
    "id",
    "style",
    "inputElement",
    "validate"
  ];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { value = "" } = $$props;
  let { color = "primary" } = $$props;
  let { filled = false } = $$props;
  let { solo = false } = $$props;
  let { outlined = false } = $$props;
  let { flat = false } = $$props;
  let { dense = false } = $$props;
  let { rounded = false } = $$props;
  let { clearable = false } = $$props;
  let { readonly = false } = $$props;
  let { disabled = false } = $$props;
  let { placeholder = null } = $$props;
  let { hint = "" } = $$props;
  let { counter = false } = $$props;
  let { messages = [] } = $$props;
  let { rules = [] } = $$props;
  let { errorCount = 1 } = $$props;
  let { validateOnBlur = false } = $$props;
  let { error = false } = $$props;
  let { success = false } = $$props;
  let { id = `s-input-${uid(5)}` } = $$props;
  let { style = null } = $$props;
  let { inputElement = null } = $$props;
  let focused = false;
  let errorMessages = [];
  function validate() {
    $$invalidate(22, errorMessages = rules.map((r) => r(value)).filter((r) => typeof r === "string"));
    if (errorMessages.length)
      $$invalidate(1, error = true);
    else {
      $$invalidate(1, error = false);
    }
    return error;
  }
  function onFocus() {
    $$invalidate(32, focused = true);
  }
  function onBlur() {
    $$invalidate(32, focused = false);
    if (validateOnBlur)
      validate();
  }
  function clear() {
    $$invalidate(0, value = "");
  }
  function onInput() {
    if (!validateOnBlur)
      validate();
  }
  function focus_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function blur_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function input_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function change_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function keypress_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function keydown_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function keyup_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function input_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      inputElement = $$value;
      $$invalidate(2, inputElement);
    });
  }
  function input_input_handler() {
    value = this.value;
    $$invalidate(0, value);
  }
  $$self.$$set = ($$new_props) => {
    $$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    $$invalidate(28, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("class" in $$new_props)
      $$invalidate(3, klass = $$new_props.class);
    if ("value" in $$new_props)
      $$invalidate(0, value = $$new_props.value);
    if ("color" in $$new_props)
      $$invalidate(4, color = $$new_props.color);
    if ("filled" in $$new_props)
      $$invalidate(5, filled = $$new_props.filled);
    if ("solo" in $$new_props)
      $$invalidate(6, solo = $$new_props.solo);
    if ("outlined" in $$new_props)
      $$invalidate(7, outlined = $$new_props.outlined);
    if ("flat" in $$new_props)
      $$invalidate(8, flat = $$new_props.flat);
    if ("dense" in $$new_props)
      $$invalidate(9, dense = $$new_props.dense);
    if ("rounded" in $$new_props)
      $$invalidate(10, rounded = $$new_props.rounded);
    if ("clearable" in $$new_props)
      $$invalidate(11, clearable = $$new_props.clearable);
    if ("readonly" in $$new_props)
      $$invalidate(12, readonly = $$new_props.readonly);
    if ("disabled" in $$new_props)
      $$invalidate(13, disabled = $$new_props.disabled);
    if ("placeholder" in $$new_props)
      $$invalidate(14, placeholder = $$new_props.placeholder);
    if ("hint" in $$new_props)
      $$invalidate(15, hint = $$new_props.hint);
    if ("counter" in $$new_props)
      $$invalidate(16, counter = $$new_props.counter);
    if ("messages" in $$new_props)
      $$invalidate(17, messages = $$new_props.messages);
    if ("rules" in $$new_props)
      $$invalidate(29, rules = $$new_props.rules);
    if ("errorCount" in $$new_props)
      $$invalidate(18, errorCount = $$new_props.errorCount);
    if ("validateOnBlur" in $$new_props)
      $$invalidate(30, validateOnBlur = $$new_props.validateOnBlur);
    if ("error" in $$new_props)
      $$invalidate(1, error = $$new_props.error);
    if ("success" in $$new_props)
      $$invalidate(19, success = $$new_props.success);
    if ("id" in $$new_props)
      $$invalidate(20, id = $$new_props.id);
    if ("style" in $$new_props)
      $$invalidate(21, style = $$new_props.style);
    if ("inputElement" in $$new_props)
      $$invalidate(2, inputElement = $$new_props.inputElement);
    if ("$$scope" in $$new_props)
      $$invalidate(43, $$scope = $$new_props.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & 16385 | $$self.$$.dirty[1] & 2) {
      $$invalidate(23, labelActive = !!placeholder || value || focused);
    }
  };
  return [
    value,
    error,
    inputElement,
    klass,
    color,
    filled,
    solo,
    outlined,
    flat,
    dense,
    rounded,
    clearable,
    readonly,
    disabled,
    placeholder,
    hint,
    counter,
    messages,
    errorCount,
    success,
    id,
    style,
    errorMessages,
    labelActive,
    onFocus,
    onBlur,
    clear,
    onInput,
    $$restProps,
    rules,
    validateOnBlur,
    validate,
    focused,
    slots,
    focus_handler,
    blur_handler,
    input_handler,
    change_handler,
    keypress_handler,
    keydown_handler,
    keyup_handler,
    input_binding,
    input_input_handler,
    $$scope
  ];
}
class TextField extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$k, create_fragment$k, safe_not_equal, {
      class: 3,
      value: 0,
      color: 4,
      filled: 5,
      solo: 6,
      outlined: 7,
      flat: 8,
      dense: 9,
      rounded: 10,
      clearable: 11,
      readonly: 12,
      disabled: 13,
      placeholder: 14,
      hint: 15,
      counter: 16,
      messages: 17,
      rules: 29,
      errorCount: 18,
      validateOnBlur: 30,
      error: 1,
      success: 19,
      id: 20,
      style: 21,
      inputElement: 2,
      validate: 31
    }, null, [-1, -1]);
  }
  get validate() {
    return this.$$.ctx[31];
  }
}
var Slider_svelte_svelte_type_style_lang = "";
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function scale(node, { delay = 0, duration = 400, easing = cubicOut, start: start2 = 0, opacity = 0 } = {}) {
  const style = getComputedStyle(node);
  const target_opacity = +style.opacity;
  const transform = style.transform === "none" ? "" : style.transform;
  const sd = 1 - start2;
  const od = target_opacity * (1 - opacity);
  return {
    delay,
    duration,
    easing,
    css: (_t, u) => `
			transform: ${transform} scale(${1 - sd * u});
			opacity: ${target_opacity - od * u}
		`
  };
}
var Menu_svelte_svelte_type_style_lang = "";
var List_svelte_svelte_type_style_lang = "";
function create_fragment$j(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[10].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[9], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "role", ctx[8]);
      attr(div, "class", div_class_value = "s-list " + ctx[0]);
      attr(div, "aria-disabled", ctx[2]);
      attr(div, "style", ctx[7]);
      toggle_class(div, "dense", ctx[1]);
      toggle_class(div, "disabled", ctx[2]);
      toggle_class(div, "flat", ctx[3]);
      toggle_class(div, "nav", ctx[5]);
      toggle_class(div, "outlined", ctx[6]);
      toggle_class(div, "rounded", ctx[4]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 512)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[9], !current ? get_all_dirty_from_scope(ctx2[9]) : get_slot_changes(default_slot_template, ctx2[9], dirty, null), null);
        }
      }
      if (!current || dirty & 256) {
        attr(div, "role", ctx2[8]);
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-list " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 4) {
        attr(div, "aria-disabled", ctx2[2]);
      }
      if (!current || dirty & 128) {
        attr(div, "style", ctx2[7]);
      }
      if (dirty & 3) {
        toggle_class(div, "dense", ctx2[1]);
      }
      if (dirty & 5) {
        toggle_class(div, "disabled", ctx2[2]);
      }
      if (dirty & 9) {
        toggle_class(div, "flat", ctx2[3]);
      }
      if (dirty & 33) {
        toggle_class(div, "nav", ctx2[5]);
      }
      if (dirty & 65) {
        toggle_class(div, "outlined", ctx2[6]);
      }
      if (dirty & 17) {
        toggle_class(div, "rounded", ctx2[4]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$j($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { dense = null } = $$props;
  let { disabled = null } = $$props;
  let { flat = false } = $$props;
  let { rounded = false } = $$props;
  let { nav = false } = $$props;
  let { outlined = false } = $$props;
  let { style = null } = $$props;
  let role = null;
  if (!getContext("S_ListItemRole")) {
    setContext("S_ListItemRole", "listitem");
    role = "list";
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("dense" in $$props2)
      $$invalidate(1, dense = $$props2.dense);
    if ("disabled" in $$props2)
      $$invalidate(2, disabled = $$props2.disabled);
    if ("flat" in $$props2)
      $$invalidate(3, flat = $$props2.flat);
    if ("rounded" in $$props2)
      $$invalidate(4, rounded = $$props2.rounded);
    if ("nav" in $$props2)
      $$invalidate(5, nav = $$props2.nav);
    if ("outlined" in $$props2)
      $$invalidate(6, outlined = $$props2.outlined);
    if ("style" in $$props2)
      $$invalidate(7, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(9, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    dense,
    disabled,
    flat,
    rounded,
    nav,
    outlined,
    style,
    role,
    $$scope,
    slots
  ];
}
class List extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$j, create_fragment$j, safe_not_equal, {
      class: 0,
      dense: 1,
      disabled: 2,
      flat: 3,
      rounded: 4,
      nav: 5,
      outlined: 6,
      style: 7
    });
  }
}
var ListItem_svelte_svelte_type_style_lang = "";
const get_append_slot_changes$1 = (dirty) => ({});
const get_append_slot_context$1 = (ctx) => ({});
const get_subtitle_slot_changes = (dirty) => ({});
const get_subtitle_slot_context = (ctx) => ({});
const get_prepend_slot_changes$1 = (dirty) => ({});
const get_prepend_slot_context$1 = (ctx) => ({});
function create_fragment$i(ctx) {
  let div3;
  let t0;
  let div2;
  let div0;
  let t1;
  let div1;
  let t2;
  let div3_class_value;
  let div3_tabindex_value;
  let div3_aria_selected_value;
  let Class_action;
  let Ripple_action;
  let current;
  let mounted;
  let dispose;
  const prepend_slot_template = ctx[14].prepend;
  const prepend_slot = create_slot(prepend_slot_template, ctx, ctx[13], get_prepend_slot_context$1);
  const default_slot_template = ctx[14].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[13], null);
  const subtitle_slot_template = ctx[14].subtitle;
  const subtitle_slot = create_slot(subtitle_slot_template, ctx, ctx[13], get_subtitle_slot_context);
  const append_slot_template = ctx[14].append;
  const append_slot = create_slot(append_slot_template, ctx, ctx[13], get_append_slot_context$1);
  return {
    c() {
      div3 = element("div");
      if (prepend_slot)
        prepend_slot.c();
      t0 = space();
      div2 = element("div");
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      t1 = space();
      div1 = element("div");
      if (subtitle_slot)
        subtitle_slot.c();
      t2 = space();
      if (append_slot)
        append_slot.c();
      attr(div0, "class", "s-list-item__title");
      attr(div1, "class", "s-list-item__subtitle");
      attr(div2, "class", "s-list-item__content");
      attr(div3, "class", div3_class_value = "s-list-item " + ctx[1]);
      attr(div3, "role", ctx[10]);
      attr(div3, "tabindex", div3_tabindex_value = ctx[6] ? 0 : -1);
      attr(div3, "aria-selected", div3_aria_selected_value = ctx[10] === "option" ? ctx[0] : null);
      attr(div3, "style", ctx[9]);
      toggle_class(div3, "dense", ctx[3]);
      toggle_class(div3, "disabled", ctx[4]);
      toggle_class(div3, "multiline", ctx[5]);
      toggle_class(div3, "link", ctx[6]);
      toggle_class(div3, "selectable", ctx[7]);
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      if (prepend_slot) {
        prepend_slot.m(div3, null);
      }
      append(div3, t0);
      append(div3, div2);
      append(div2, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      append(div2, t1);
      append(div2, div1);
      if (subtitle_slot) {
        subtitle_slot.m(div1, null);
      }
      append(div3, t2);
      if (append_slot) {
        append_slot.m(div3, null);
      }
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(Class_action = Class.call(null, div3, [ctx[0] && ctx[2]])),
          action_destroyer(Ripple_action = Ripple.call(null, div3, ctx[8])),
          listen(div3, "click", ctx[11]),
          listen(div3, "click", ctx[15]),
          listen(div3, "dblclick", ctx[16])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (prepend_slot) {
        if (prepend_slot.p && (!current || dirty & 8192)) {
          update_slot_base(prepend_slot, prepend_slot_template, ctx2, ctx2[13], !current ? get_all_dirty_from_scope(ctx2[13]) : get_slot_changes(prepend_slot_template, ctx2[13], dirty, get_prepend_slot_changes$1), get_prepend_slot_context$1);
        }
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 8192)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[13], !current ? get_all_dirty_from_scope(ctx2[13]) : get_slot_changes(default_slot_template, ctx2[13], dirty, null), null);
        }
      }
      if (subtitle_slot) {
        if (subtitle_slot.p && (!current || dirty & 8192)) {
          update_slot_base(subtitle_slot, subtitle_slot_template, ctx2, ctx2[13], !current ? get_all_dirty_from_scope(ctx2[13]) : get_slot_changes(subtitle_slot_template, ctx2[13], dirty, get_subtitle_slot_changes), get_subtitle_slot_context);
        }
      }
      if (append_slot) {
        if (append_slot.p && (!current || dirty & 8192)) {
          update_slot_base(append_slot, append_slot_template, ctx2, ctx2[13], !current ? get_all_dirty_from_scope(ctx2[13]) : get_slot_changes(append_slot_template, ctx2[13], dirty, get_append_slot_changes$1), get_append_slot_context$1);
        }
      }
      if (!current || dirty & 2 && div3_class_value !== (div3_class_value = "s-list-item " + ctx2[1])) {
        attr(div3, "class", div3_class_value);
      }
      if (!current || dirty & 64 && div3_tabindex_value !== (div3_tabindex_value = ctx2[6] ? 0 : -1)) {
        attr(div3, "tabindex", div3_tabindex_value);
      }
      if (!current || dirty & 1 && div3_aria_selected_value !== (div3_aria_selected_value = ctx2[10] === "option" ? ctx2[0] : null)) {
        attr(div3, "aria-selected", div3_aria_selected_value);
      }
      if (!current || dirty & 512) {
        attr(div3, "style", ctx2[9]);
      }
      if (Class_action && is_function(Class_action.update) && dirty & 5)
        Class_action.update.call(null, [ctx2[0] && ctx2[2]]);
      if (Ripple_action && is_function(Ripple_action.update) && dirty & 256)
        Ripple_action.update.call(null, ctx2[8]);
      if (dirty & 10) {
        toggle_class(div3, "dense", ctx2[3]);
      }
      if (dirty & 18) {
        toggle_class(div3, "disabled", ctx2[4]);
      }
      if (dirty & 34) {
        toggle_class(div3, "multiline", ctx2[5]);
      }
      if (dirty & 66) {
        toggle_class(div3, "link", ctx2[6]);
      }
      if (dirty & 130) {
        toggle_class(div3, "selectable", ctx2[7]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(prepend_slot, local);
      transition_in(default_slot, local);
      transition_in(subtitle_slot, local);
      transition_in(append_slot, local);
      current = true;
    },
    o(local) {
      transition_out(prepend_slot, local);
      transition_out(default_slot, local);
      transition_out(subtitle_slot, local);
      transition_out(append_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div3);
      if (prepend_slot)
        prepend_slot.d(detaching);
      if (default_slot)
        default_slot.d(detaching);
      if (subtitle_slot)
        subtitle_slot.d(detaching);
      if (append_slot)
        append_slot.d(detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$i($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const role = getContext("S_ListItemRole");
  const ITEM_GROUP = getContext("S_ListItemGroup");
  const DEFAULTS = {
    select: () => null,
    register: () => null,
    index: () => null,
    activeClass: "active"
  };
  const ITEM = ITEM_GROUP ? getContext(ITEM_GROUP) : DEFAULTS;
  let { class: klass = "" } = $$props;
  let { activeClass = ITEM.activeClass } = $$props;
  let { value = ITEM.index() } = $$props;
  let { active: active2 = false } = $$props;
  let { dense = false } = $$props;
  let { disabled = null } = $$props;
  let { multiline = false } = $$props;
  let { link = role } = $$props;
  let { selectable = !link } = $$props;
  let { ripple = getContext("S_ListItemRipple") || role || false } = $$props;
  let { style = null } = $$props;
  ITEM.register((values) => {
    $$invalidate(0, active2 = values.includes(value));
  });
  function click() {
    if (!disabled)
      ITEM.select(value);
  }
  function click_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function dblclick_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(1, klass = $$props2.class);
    if ("activeClass" in $$props2)
      $$invalidate(2, activeClass = $$props2.activeClass);
    if ("value" in $$props2)
      $$invalidate(12, value = $$props2.value);
    if ("active" in $$props2)
      $$invalidate(0, active2 = $$props2.active);
    if ("dense" in $$props2)
      $$invalidate(3, dense = $$props2.dense);
    if ("disabled" in $$props2)
      $$invalidate(4, disabled = $$props2.disabled);
    if ("multiline" in $$props2)
      $$invalidate(5, multiline = $$props2.multiline);
    if ("link" in $$props2)
      $$invalidate(6, link = $$props2.link);
    if ("selectable" in $$props2)
      $$invalidate(7, selectable = $$props2.selectable);
    if ("ripple" in $$props2)
      $$invalidate(8, ripple = $$props2.ripple);
    if ("style" in $$props2)
      $$invalidate(9, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(13, $$scope = $$props2.$$scope);
  };
  return [
    active2,
    klass,
    activeClass,
    dense,
    disabled,
    multiline,
    link,
    selectable,
    ripple,
    style,
    role,
    click,
    value,
    $$scope,
    slots,
    click_handler,
    dblclick_handler
  ];
}
class ListItem extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$i, create_fragment$i, safe_not_equal, {
      class: 1,
      activeClass: 2,
      value: 12,
      active: 0,
      dense: 3,
      disabled: 4,
      multiline: 5,
      link: 6,
      selectable: 7,
      ripple: 8,
      style: 9
    });
  }
}
var ListGroup_svelte_svelte_type_style_lang = "";
var ListItemGroup_svelte_svelte_type_style_lang = "";
var Chip_svelte_svelte_type_style_lang = "";
var Checkbox_svelte_svelte_type_style_lang = "";
function create_if_block$9(ctx) {
  let svg;
  let path;
  let path_d_value;
  return {
    c() {
      svg = svg_element("svg");
      path = svg_element("path");
      attr(path, "d", path_d_value = ctx[0] ? check : dash);
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "width", "24");
      attr(svg, "height", "24");
      attr(svg, "viewBox", "0 0 24 24");
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
    },
    p(ctx2, dirty) {
      if (dirty & 1 && path_d_value !== (path_d_value = ctx2[0] ? check : dash)) {
        attr(path, "d", path_d_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(svg);
    }
  };
}
function create_fragment$h(ctx) {
  let div2;
  let div1;
  let input;
  let t0;
  let div0;
  let div1_class_value;
  let TextColor_action;
  let t1;
  let label;
  let current;
  let mounted;
  let dispose;
  let if_block = (ctx[0] || ctx[1]) && create_if_block$9(ctx);
  const default_slot_template = ctx[13].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[12], null);
  return {
    c() {
      div2 = element("div");
      div1 = element("div");
      input = element("input");
      t0 = space();
      div0 = element("div");
      if (if_block)
        if_block.c();
      t1 = space();
      label = element("label");
      if (default_slot)
        default_slot.c();
      attr(input, "type", "checkbox");
      attr(input, "role", "checkbox");
      attr(input, "aria-checked", ctx[0]);
      attr(input, "id", ctx[2]);
      input.disabled = ctx[6];
      input.__value = ctx[7];
      input.value = input.__value;
      if (ctx[0] === void 0 || ctx[1] === void 0)
        add_render_callback(() => ctx[16].call(input));
      attr(div0, "class", "s-checkbox__background");
      attr(div0, "aria-hidden", "true");
      attr(div1, "class", div1_class_value = "s-checkbox__wrapper " + ctx[4]);
      toggle_class(div1, "disabled", ctx[6]);
      attr(label, "for", ctx[2]);
      attr(div2, "class", "s-checkbox");
      attr(div2, "style", ctx[8]);
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div1);
      append(div1, input);
      ctx[15](input);
      input.checked = ctx[0];
      input.indeterminate = ctx[1];
      append(div1, t0);
      append(div1, div0);
      if (if_block)
        if_block.m(div0, null);
      append(div2, t1);
      append(div2, label);
      if (default_slot) {
        default_slot.m(label, null);
      }
      current = true;
      if (!mounted) {
        dispose = [
          listen(input, "change", ctx[16]),
          listen(input, "change", ctx[9]),
          listen(input, "change", ctx[14]),
          action_destroyer(Ripple.call(null, div1, { centered: true })),
          action_destroyer(TextColor_action = TextColor.call(null, div1, ctx[0] || ctx[1] ? ctx[5] : false))
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & 1) {
        attr(input, "aria-checked", ctx2[0]);
      }
      if (!current || dirty & 4) {
        attr(input, "id", ctx2[2]);
      }
      if (!current || dirty & 64) {
        input.disabled = ctx2[6];
      }
      if (!current || dirty & 128) {
        input.__value = ctx2[7];
        input.value = input.__value;
      }
      if (dirty & 1) {
        input.checked = ctx2[0];
      }
      if (dirty & 2) {
        input.indeterminate = ctx2[1];
      }
      if (ctx2[0] || ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$9(ctx2);
          if_block.c();
          if_block.m(div0, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (!current || dirty & 16 && div1_class_value !== (div1_class_value = "s-checkbox__wrapper " + ctx2[4])) {
        attr(div1, "class", div1_class_value);
      }
      if (TextColor_action && is_function(TextColor_action.update) && dirty & 35)
        TextColor_action.update.call(null, ctx2[0] || ctx2[1] ? ctx2[5] : false);
      if (dirty & 80) {
        toggle_class(div1, "disabled", ctx2[6]);
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4096)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[12], !current ? get_all_dirty_from_scope(ctx2[12]) : get_slot_changes(default_slot_template, ctx2[12], dirty, null), null);
        }
      }
      if (!current || dirty & 4) {
        attr(label, "for", ctx2[2]);
      }
      if (!current || dirty & 256) {
        attr(div2, "style", ctx2[8]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      ctx[15](null);
      if (if_block)
        if_block.d();
      if (default_slot)
        default_slot.d(detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
const check = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
const dash = "M4,11L4,13L20,13L20,11L4,11Z";
function instance$h($$self, $$props, $$invalidate) {
  let hasValidGroup;
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { color = "primary" } = $$props;
  let { checked = false } = $$props;
  let { indeterminate = false } = $$props;
  let { disabled = false } = $$props;
  let { value = null } = $$props;
  let { group = null } = $$props;
  let { id = null } = $$props;
  let { style = null } = $$props;
  let { inputElement = null } = $$props;
  id = id || `s-checkbox-${uid(5)}`;
  function groupUpdate() {
    if (hasValidGroup && value != null) {
      const i = group.indexOf(value);
      if (i < 0) {
        group.push(value);
      } else {
        group.splice(i, 1);
      }
      $$invalidate(10, group);
    }
  }
  function change_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function input_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      inputElement = $$value;
      $$invalidate(3, inputElement);
    });
  }
  function input_change_handler() {
    checked = this.checked;
    indeterminate = this.indeterminate;
    $$invalidate(0, checked), $$invalidate(11, hasValidGroup), $$invalidate(7, value), $$invalidate(10, group);
    $$invalidate(1, indeterminate);
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(4, klass = $$props2.class);
    if ("color" in $$props2)
      $$invalidate(5, color = $$props2.color);
    if ("checked" in $$props2)
      $$invalidate(0, checked = $$props2.checked);
    if ("indeterminate" in $$props2)
      $$invalidate(1, indeterminate = $$props2.indeterminate);
    if ("disabled" in $$props2)
      $$invalidate(6, disabled = $$props2.disabled);
    if ("value" in $$props2)
      $$invalidate(7, value = $$props2.value);
    if ("group" in $$props2)
      $$invalidate(10, group = $$props2.group);
    if ("id" in $$props2)
      $$invalidate(2, id = $$props2.id);
    if ("style" in $$props2)
      $$invalidate(8, style = $$props2.style);
    if ("inputElement" in $$props2)
      $$invalidate(3, inputElement = $$props2.inputElement);
    if ("$$scope" in $$props2)
      $$invalidate(12, $$scope = $$props2.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 1024) {
      $$invalidate(11, hasValidGroup = Array.isArray(group));
    }
    if ($$self.$$.dirty & 3200) {
      if (hasValidGroup && value != null) {
        $$invalidate(0, checked = group.indexOf(value) >= 0);
      }
    }
  };
  return [
    checked,
    indeterminate,
    id,
    inputElement,
    klass,
    color,
    disabled,
    value,
    style,
    groupUpdate,
    group,
    hasValidGroup,
    $$scope,
    slots,
    change_handler,
    input_binding,
    input_change_handler
  ];
}
class Checkbox extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$h, create_fragment$h, safe_not_equal, {
      class: 4,
      color: 5,
      checked: 0,
      indeterminate: 1,
      disabled: 6,
      value: 7,
      group: 10,
      id: 2,
      style: 8,
      inputElement: 3
    });
  }
}
var Select_svelte_svelte_type_style_lang = "";
var Switch_svelte_svelte_type_style_lang = "";
var Radio_svelte_svelte_type_style_lang = "";
var Alert_svelte_svelte_type_style_lang = "";
var DataTable_svelte_svelte_type_style_lang = "";
var DataTableHead_svelte_svelte_type_style_lang = "";
var DataTableBody_svelte_svelte_type_style_lang = "";
var DataTableCell_svelte_svelte_type_style_lang = "";
const themeColors = ["primary", "secondary", "success", "info", "warning", "error"];
function formatClass(klass) {
  return klass.split(" ").map((i) => {
    if (themeColors.includes(i))
      return `${i}-color`;
    return i;
  });
}
function setBackgroundColor(node, text2) {
  if (/^(#|rgb|hsl|currentColor)/.test(text2)) {
    node.style.backgroundColor = text2;
    return false;
  }
  if (text2.startsWith("--")) {
    node.style.backgroundColor = `var(${text2})`;
    return false;
  }
  const klass = formatClass(text2);
  node.classList.add(...klass);
  return klass;
}
var BackgroundColor = (node, text2) => {
  let klass;
  if (typeof text2 === "string") {
    klass = setBackgroundColor(node, text2);
  }
  return {
    update(newText) {
      if (klass) {
        node.classList.remove(...klass);
      } else {
        node.style.backgroundColor = null;
      }
      if (typeof newText === "string") {
        klass = setBackgroundColor(node, newText);
      }
    }
  };
};
var Overlay_svelte_svelte_type_style_lang = "";
function create_if_block$8(ctx) {
  let div2;
  let div0;
  let BackgroundColor_action;
  let t;
  let div1;
  let div2_class_value;
  let div2_style_value;
  let div2_intro;
  let div2_outro;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[11].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[10], null);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      t = space();
      div1 = element("div");
      if (default_slot)
        default_slot.c();
      attr(div0, "class", "s-overlay__scrim svelte-x5kbih");
      set_style(div0, "opacity", ctx[5]);
      attr(div1, "class", "s-overlay__content svelte-x5kbih");
      attr(div2, "class", div2_class_value = "s-overlay " + ctx[0] + " svelte-x5kbih");
      attr(div2, "style", div2_style_value = "z-index:" + ctx[7] + ";" + ctx[9]);
      toggle_class(div2, "absolute", ctx[8]);
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t);
      append(div2, div1);
      if (default_slot) {
        default_slot.m(div1, null);
      }
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(BackgroundColor_action = BackgroundColor.call(null, div0, ctx[6])),
          listen(div2, "click", ctx[12])
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (!current || dirty & 32) {
        set_style(div0, "opacity", ctx[5]);
      }
      if (BackgroundColor_action && is_function(BackgroundColor_action.update) && dirty & 64)
        BackgroundColor_action.update.call(null, ctx[6]);
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 1024)) {
          update_slot_base(default_slot, default_slot_template, ctx, ctx[10], !current ? get_all_dirty_from_scope(ctx[10]) : get_slot_changes(default_slot_template, ctx[10], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div2_class_value !== (div2_class_value = "s-overlay " + ctx[0] + " svelte-x5kbih")) {
        attr(div2, "class", div2_class_value);
      }
      if (!current || dirty & 640 && div2_style_value !== (div2_style_value = "z-index:" + ctx[7] + ";" + ctx[9])) {
        attr(div2, "style", div2_style_value);
      }
      if (dirty & 257) {
        toggle_class(div2, "absolute", ctx[8]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      add_render_callback(() => {
        if (div2_outro)
          div2_outro.end(1);
        div2_intro = create_in_transition(div2, ctx[1], ctx[2]);
        div2_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      if (div2_intro)
        div2_intro.invalidate();
      div2_outro = create_out_transition(div2, ctx[1], ctx[3]);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if (default_slot)
        default_slot.d(detaching);
      if (detaching && div2_outro)
        div2_outro.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$g(ctx) {
  let if_block_anchor;
  let current;
  let if_block = ctx[4] && create_if_block$8(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (ctx2[4]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 16) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$8(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance$g($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { transition = fade } = $$props;
  let { inOpts = { duration: 250 } } = $$props;
  let { outOpts = { duration: 250 } } = $$props;
  let { active: active2 = true } = $$props;
  let { opacity = 0.46 } = $$props;
  let { color = "rgb(33, 33, 33)" } = $$props;
  let { index = 5 } = $$props;
  let { absolute = false } = $$props;
  let { style = "" } = $$props;
  function click_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("transition" in $$props2)
      $$invalidate(1, transition = $$props2.transition);
    if ("inOpts" in $$props2)
      $$invalidate(2, inOpts = $$props2.inOpts);
    if ("outOpts" in $$props2)
      $$invalidate(3, outOpts = $$props2.outOpts);
    if ("active" in $$props2)
      $$invalidate(4, active2 = $$props2.active);
    if ("opacity" in $$props2)
      $$invalidate(5, opacity = $$props2.opacity);
    if ("color" in $$props2)
      $$invalidate(6, color = $$props2.color);
    if ("index" in $$props2)
      $$invalidate(7, index = $$props2.index);
    if ("absolute" in $$props2)
      $$invalidate(8, absolute = $$props2.absolute);
    if ("style" in $$props2)
      $$invalidate(9, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(10, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    transition,
    inOpts,
    outOpts,
    active2,
    opacity,
    color,
    index,
    absolute,
    style,
    $$scope,
    slots,
    click_handler
  ];
}
class Overlay extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$g, create_fragment$g, safe_not_equal, {
      class: 0,
      transition: 1,
      inOpts: 2,
      outOpts: 3,
      active: 4,
      opacity: 5,
      color: 6,
      index: 7,
      absolute: 8,
      style: 9
    });
  }
}
var Dialog_svelte_svelte_type_style_lang = "";
function create_if_block$7(ctx) {
  let div1;
  let div0;
  let div0_class_value;
  let div0_transition;
  let Style_action;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[11].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[10], null);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      attr(div0, "class", div0_class_value = "s-dialog__content " + ctx[0]);
      toggle_class(div0, "fullscreen", ctx[2]);
      attr(div1, "role", "document");
      attr(div1, "class", "s-dialog");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      current = true;
      if (!mounted) {
        dispose = [
          listen(div0, "introstart", ctx[12]),
          listen(div0, "outrostart", ctx[13]),
          listen(div0, "introend", ctx[14]),
          listen(div0, "outroend", ctx[15]),
          action_destroyer(Style_action = Style.call(null, div1, { "dialog-width": ctx[1] }))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 1024)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[10], !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(default_slot_template, ctx2[10], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div0_class_value !== (div0_class_value = "s-dialog__content " + ctx2[0])) {
        attr(div0, "class", div0_class_value);
      }
      if (dirty & 5) {
        toggle_class(div0, "fullscreen", ctx2[2]);
      }
      if (Style_action && is_function(Style_action.update) && dirty & 2)
        Style_action.update.call(null, { "dialog-width": ctx2[1] });
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      add_render_callback(() => {
        if (!div0_transition)
          div0_transition = create_bidirectional_transition(div0, ctx[3], { duration: 300, start: 0.1 }, true);
        div0_transition.run(1);
      });
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      if (!div0_transition)
        div0_transition = create_bidirectional_transition(div0, ctx[3], { duration: 300, start: 0.1 }, false);
      div0_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (default_slot)
        default_slot.d(detaching);
      if (detaching && div0_transition)
        div0_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$f(ctx) {
  let t;
  let overlay_1;
  let current;
  let if_block = ctx[5] && create_if_block$7(ctx);
  const overlay_1_spread_levels = [ctx[4], { active: ctx[5] }];
  let overlay_1_props = {};
  for (let i = 0; i < overlay_1_spread_levels.length; i += 1) {
    overlay_1_props = assign(overlay_1_props, overlay_1_spread_levels[i]);
  }
  overlay_1 = new Overlay({ props: overlay_1_props });
  overlay_1.$on("click", ctx[6]);
  return {
    c() {
      if (if_block)
        if_block.c();
      t = space();
      create_component(overlay_1.$$.fragment);
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, t, anchor);
      mount_component(overlay_1, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (ctx2[5]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 32) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$7(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(t.parentNode, t);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      const overlay_1_changes = dirty & 48 ? get_spread_update(overlay_1_spread_levels, [
        dirty & 16 && get_spread_object(ctx2[4]),
        dirty & 32 && { active: ctx2[5] }
      ]) : {};
      overlay_1.$set(overlay_1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      transition_in(overlay_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(overlay_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(t);
      destroy_component(overlay_1, detaching);
    }
  };
}
function instance$f($$self, $$props, $$invalidate) {
  let visible;
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { active: active2 = false } = $$props;
  let { persistent = false } = $$props;
  let { disabled = false } = $$props;
  let { width = 500 } = $$props;
  let { fullscreen = false } = $$props;
  let { transition = scale } = $$props;
  let { overlay: overlay2 = {} } = $$props;
  function close() {
    if (!persistent)
      $$invalidate(7, active2 = false);
  }
  function introstart_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function outrostart_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function introend_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function outroend_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("active" in $$props2)
      $$invalidate(7, active2 = $$props2.active);
    if ("persistent" in $$props2)
      $$invalidate(8, persistent = $$props2.persistent);
    if ("disabled" in $$props2)
      $$invalidate(9, disabled = $$props2.disabled);
    if ("width" in $$props2)
      $$invalidate(1, width = $$props2.width);
    if ("fullscreen" in $$props2)
      $$invalidate(2, fullscreen = $$props2.fullscreen);
    if ("transition" in $$props2)
      $$invalidate(3, transition = $$props2.transition);
    if ("overlay" in $$props2)
      $$invalidate(4, overlay2 = $$props2.overlay);
    if ("$$scope" in $$props2)
      $$invalidate(10, $$scope = $$props2.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 640) {
      $$invalidate(5, visible = active2 && !disabled);
    }
  };
  return [
    klass,
    width,
    fullscreen,
    transition,
    overlay2,
    visible,
    close,
    active2,
    persistent,
    disabled,
    $$scope,
    slots,
    introstart_handler,
    outrostart_handler,
    introend_handler,
    outroend_handler
  ];
}
class Dialog extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$f, create_fragment$f, safe_not_equal, {
      class: 0,
      active: 7,
      persistent: 8,
      disabled: 9,
      width: 1,
      fullscreen: 2,
      transition: 3,
      overlay: 4
    });
  }
}
var Divider_svelte_svelte_type_style_lang = "";
var ExpansionPanels_svelte_svelte_type_style_lang = "";
var ExpansionPanel_svelte_svelte_type_style_lang = "";
var Avatar_svelte_svelte_type_style_lang = "";
var Badge_svelte_svelte_type_style_lang = "";
var AppBar_svelte_svelte_type_style_lang = "";
const get_extension_slot_changes = (dirty) => ({});
const get_extension_slot_context = (ctx) => ({});
const get_title_slot_changes = (dirty) => ({});
const get_title_slot_context = (ctx) => ({});
const get_icon_slot_changes = (dirty) => ({});
const get_icon_slot_context = (ctx) => ({});
function create_if_block$6(ctx) {
  let div;
  let current;
  const title_slot_template = ctx[11].title;
  const title_slot = create_slot(title_slot_template, ctx, ctx[10], get_title_slot_context);
  return {
    c() {
      div = element("div");
      if (title_slot)
        title_slot.c();
      attr(div, "class", "s-app-bar__title");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (title_slot) {
        title_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (title_slot) {
        if (title_slot.p && (!current || dirty & 1024)) {
          update_slot_base(title_slot, title_slot_template, ctx2, ctx2[10], !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(title_slot_template, ctx2[10], dirty, get_title_slot_changes), get_title_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(title_slot, local);
      current = true;
    },
    o(local) {
      transition_out(title_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (title_slot)
        title_slot.d(detaching);
    }
  };
}
function create_fragment$e(ctx) {
  let header;
  let div;
  let t0;
  let t1;
  let t2;
  let header_class_value;
  let Style_action;
  let current;
  let mounted;
  let dispose;
  const icon_slot_template = ctx[11].icon;
  const icon_slot = create_slot(icon_slot_template, ctx, ctx[10], get_icon_slot_context);
  let if_block = !ctx[8] && create_if_block$6(ctx);
  const default_slot_template = ctx[11].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[10], null);
  const extension_slot_template = ctx[11].extension;
  const extension_slot = create_slot(extension_slot_template, ctx, ctx[10], get_extension_slot_context);
  return {
    c() {
      header = element("header");
      div = element("div");
      if (icon_slot)
        icon_slot.c();
      t0 = space();
      if (if_block)
        if_block.c();
      t1 = space();
      if (default_slot)
        default_slot.c();
      t2 = space();
      if (extension_slot)
        extension_slot.c();
      attr(div, "class", "s-app-bar__wrapper");
      attr(header, "class", header_class_value = "s-app-bar " + ctx[0]);
      attr(header, "style", ctx[9]);
      toggle_class(header, "tile", ctx[2]);
      toggle_class(header, "flat", ctx[3]);
      toggle_class(header, "dense", ctx[4]);
      toggle_class(header, "prominent", ctx[5]);
      toggle_class(header, "fixed", ctx[6]);
      toggle_class(header, "absolute", ctx[7]);
      toggle_class(header, "collapsed", ctx[8]);
    },
    m(target, anchor) {
      insert(target, header, anchor);
      append(header, div);
      if (icon_slot) {
        icon_slot.m(div, null);
      }
      append(div, t0);
      if (if_block)
        if_block.m(div, null);
      append(div, t1);
      if (default_slot) {
        default_slot.m(div, null);
      }
      append(header, t2);
      if (extension_slot) {
        extension_slot.m(header, null);
      }
      current = true;
      if (!mounted) {
        dispose = action_destroyer(Style_action = Style.call(null, header, { "app-bar-height": ctx[1] }));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (icon_slot) {
        if (icon_slot.p && (!current || dirty & 1024)) {
          update_slot_base(icon_slot, icon_slot_template, ctx2, ctx2[10], !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(icon_slot_template, ctx2[10], dirty, get_icon_slot_changes), get_icon_slot_context);
        }
      }
      if (!ctx2[8]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 256) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$6(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, t1);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 1024)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[10], !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(default_slot_template, ctx2[10], dirty, null), null);
        }
      }
      if (extension_slot) {
        if (extension_slot.p && (!current || dirty & 1024)) {
          update_slot_base(extension_slot, extension_slot_template, ctx2, ctx2[10], !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(extension_slot_template, ctx2[10], dirty, get_extension_slot_changes), get_extension_slot_context);
        }
      }
      if (!current || dirty & 1 && header_class_value !== (header_class_value = "s-app-bar " + ctx2[0])) {
        attr(header, "class", header_class_value);
      }
      if (!current || dirty & 512) {
        attr(header, "style", ctx2[9]);
      }
      if (Style_action && is_function(Style_action.update) && dirty & 2)
        Style_action.update.call(null, { "app-bar-height": ctx2[1] });
      if (dirty & 5) {
        toggle_class(header, "tile", ctx2[2]);
      }
      if (dirty & 9) {
        toggle_class(header, "flat", ctx2[3]);
      }
      if (dirty & 17) {
        toggle_class(header, "dense", ctx2[4]);
      }
      if (dirty & 33) {
        toggle_class(header, "prominent", ctx2[5]);
      }
      if (dirty & 65) {
        toggle_class(header, "fixed", ctx2[6]);
      }
      if (dirty & 129) {
        toggle_class(header, "absolute", ctx2[7]);
      }
      if (dirty & 257) {
        toggle_class(header, "collapsed", ctx2[8]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(icon_slot, local);
      transition_in(if_block);
      transition_in(default_slot, local);
      transition_in(extension_slot, local);
      current = true;
    },
    o(local) {
      transition_out(icon_slot, local);
      transition_out(if_block);
      transition_out(default_slot, local);
      transition_out(extension_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(header);
      if (icon_slot)
        icon_slot.d(detaching);
      if (if_block)
        if_block.d();
      if (default_slot)
        default_slot.d(detaching);
      if (extension_slot)
        extension_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$e($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { height = "56px" } = $$props;
  let { tile = false } = $$props;
  let { flat = false } = $$props;
  let { dense = false } = $$props;
  let { prominent = false } = $$props;
  let { fixed = false } = $$props;
  let { absolute = false } = $$props;
  let { collapsed = false } = $$props;
  let { style = "" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("height" in $$props2)
      $$invalidate(1, height = $$props2.height);
    if ("tile" in $$props2)
      $$invalidate(2, tile = $$props2.tile);
    if ("flat" in $$props2)
      $$invalidate(3, flat = $$props2.flat);
    if ("dense" in $$props2)
      $$invalidate(4, dense = $$props2.dense);
    if ("prominent" in $$props2)
      $$invalidate(5, prominent = $$props2.prominent);
    if ("fixed" in $$props2)
      $$invalidate(6, fixed = $$props2.fixed);
    if ("absolute" in $$props2)
      $$invalidate(7, absolute = $$props2.absolute);
    if ("collapsed" in $$props2)
      $$invalidate(8, collapsed = $$props2.collapsed);
    if ("style" in $$props2)
      $$invalidate(9, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(10, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    height,
    tile,
    flat,
    dense,
    prominent,
    fixed,
    absolute,
    collapsed,
    style,
    $$scope,
    slots
  ];
}
class AppBar extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$e, create_fragment$e, safe_not_equal, {
      class: 0,
      height: 1,
      tile: 2,
      flat: 3,
      dense: 4,
      prominent: 5,
      fixed: 6,
      absolute: 7,
      collapsed: 8,
      style: 9
    });
  }
}
var Breadcrumbs_svelte_svelte_type_style_lang = "";
var ProgressLinear_svelte_svelte_type_style_lang = "";
function create_else_block$2(ctx) {
  let div;
  let BackgroundColor_action;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      attr(div, "class", "determinate svelte-4702t3");
      set_style(div, "width", ctx[1] + "%");
      toggle_class(div, "striped", ctx[12]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (!mounted) {
        dispose = action_destroyer(BackgroundColor_action = BackgroundColor.call(null, div, ctx[7]));
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 2) {
        set_style(div, "width", ctx2[1] + "%");
      }
      if (BackgroundColor_action && is_function(BackgroundColor_action.update) && dirty & 128)
        BackgroundColor_action.update.call(null, ctx2[7]);
      if (dirty & 4096) {
        toggle_class(div, "striped", ctx2[12]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_1$1(ctx) {
  let div2;
  let BackgroundColor_action;
  let mounted;
  let dispose;
  return {
    c() {
      div2 = element("div");
      div2.innerHTML = `<div class="indeterminate long svelte-4702t3"></div> 
      <div class="indeterminate short svelte-4702t3"></div>`;
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      if (!mounted) {
        dispose = action_destroyer(BackgroundColor_action = BackgroundColor.call(null, div2, ctx[7]));
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (BackgroundColor_action && is_function(BackgroundColor_action.update) && dirty & 128)
        BackgroundColor_action.update.call(null, ctx2[7]);
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block$5(ctx) {
  let div;
  let div_class_value;
  return {
    c() {
      div = element("div");
      attr(div, "class", div_class_value = "stream " + ctx[7] + " svelte-4702t3");
      set_style(div, "width", 100 - ctx[8] + "%");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 128 && div_class_value !== (div_class_value = "stream " + ctx2[7] + " svelte-4702t3")) {
        attr(div, "class", div_class_value);
      }
      if (dirty & 256) {
        set_style(div, "width", 100 - ctx2[8] + "%");
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment$d(ctx) {
  let div2;
  let div0;
  let div0_style_value;
  let BackgroundColor_action;
  let t0;
  let t1;
  let div1;
  let t2;
  let div2_class_value;
  let div2_style_value;
  let current;
  let mounted;
  let dispose;
  function select_block_type(ctx2, dirty) {
    if (ctx2[3])
      return create_if_block_1$1;
    return create_else_block$2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block0 = current_block_type(ctx);
  const default_slot_template = ctx[15].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[14], null);
  let if_block1 = ctx[10] && create_if_block$5(ctx);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      t0 = space();
      if_block0.c();
      t1 = space();
      div1 = element("div");
      if (default_slot)
        default_slot.c();
      t2 = space();
      if (if_block1)
        if_block1.c();
      attr(div0, "class", "background svelte-4702t3");
      attr(div0, "style", div0_style_value = "opacity:" + ctx[6] + ";" + (ctx[9] ? "right" : "left") + ":" + ctx[1] + "%;width:" + (ctx[8] - ctx[1]) + "%");
      attr(div1, "class", "s-progress-linear__content svelte-4702t3");
      attr(div2, "role", "progressbar");
      attr(div2, "aria-valuemin", "0");
      attr(div2, "aria-valuemax", "100");
      attr(div2, "aria-valuenow", ctx[1]);
      attr(div2, "class", div2_class_value = "s-progress-linear " + ctx[0] + " svelte-4702t3");
      attr(div2, "style", div2_style_value = "height:" + ctx[4] + ";" + ctx[13]);
      toggle_class(div2, "inactive", !ctx[2]);
      toggle_class(div2, "reversed", ctx[9]);
      toggle_class(div2, "rounded", ctx[11]);
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t0);
      if_block0.m(div2, null);
      append(div2, t1);
      append(div2, div1);
      if (default_slot) {
        default_slot.m(div1, null);
      }
      append(div2, t2);
      if (if_block1)
        if_block1.m(div2, null);
      current = true;
      if (!mounted) {
        dispose = action_destroyer(BackgroundColor_action = BackgroundColor.call(null, div0, ctx[5]));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & 834 && div0_style_value !== (div0_style_value = "opacity:" + ctx2[6] + ";" + (ctx2[9] ? "right" : "left") + ":" + ctx2[1] + "%;width:" + (ctx2[8] - ctx2[1]) + "%")) {
        attr(div0, "style", div0_style_value);
      }
      if (BackgroundColor_action && is_function(BackgroundColor_action.update) && dirty & 32)
        BackgroundColor_action.update.call(null, ctx2[5]);
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div2, t1);
        }
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 16384)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[14], !current ? get_all_dirty_from_scope(ctx2[14]) : get_slot_changes(default_slot_template, ctx2[14], dirty, null), null);
        }
      }
      if (ctx2[10]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block$5(ctx2);
          if_block1.c();
          if_block1.m(div2, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (!current || dirty & 2) {
        attr(div2, "aria-valuenow", ctx2[1]);
      }
      if (!current || dirty & 1 && div2_class_value !== (div2_class_value = "s-progress-linear " + ctx2[0] + " svelte-4702t3")) {
        attr(div2, "class", div2_class_value);
      }
      if (!current || dirty & 8208 && div2_style_value !== (div2_style_value = "height:" + ctx2[4] + ";" + ctx2[13])) {
        attr(div2, "style", div2_style_value);
      }
      if (dirty & 5) {
        toggle_class(div2, "inactive", !ctx2[2]);
      }
      if (dirty & 513) {
        toggle_class(div2, "reversed", ctx2[9]);
      }
      if (dirty & 2049) {
        toggle_class(div2, "rounded", ctx2[11]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if_block0.d();
      if (default_slot)
        default_slot.d(detaching);
      if (if_block1)
        if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function instance$d($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { value = 0 } = $$props;
  let { active: active2 = true } = $$props;
  let { indeterminate = false } = $$props;
  let { height = "4px" } = $$props;
  let { backgroundColor = "primary" } = $$props;
  let { backgroundOpacity = 0.3 } = $$props;
  let { color = backgroundColor } = $$props;
  let { buffer = 100 } = $$props;
  let { reversed = false } = $$props;
  let { stream = false } = $$props;
  let { rounded = false } = $$props;
  let { striped = false } = $$props;
  let { style = "" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("value" in $$props2)
      $$invalidate(1, value = $$props2.value);
    if ("active" in $$props2)
      $$invalidate(2, active2 = $$props2.active);
    if ("indeterminate" in $$props2)
      $$invalidate(3, indeterminate = $$props2.indeterminate);
    if ("height" in $$props2)
      $$invalidate(4, height = $$props2.height);
    if ("backgroundColor" in $$props2)
      $$invalidate(5, backgroundColor = $$props2.backgroundColor);
    if ("backgroundOpacity" in $$props2)
      $$invalidate(6, backgroundOpacity = $$props2.backgroundOpacity);
    if ("color" in $$props2)
      $$invalidate(7, color = $$props2.color);
    if ("buffer" in $$props2)
      $$invalidate(8, buffer = $$props2.buffer);
    if ("reversed" in $$props2)
      $$invalidate(9, reversed = $$props2.reversed);
    if ("stream" in $$props2)
      $$invalidate(10, stream = $$props2.stream);
    if ("rounded" in $$props2)
      $$invalidate(11, rounded = $$props2.rounded);
    if ("striped" in $$props2)
      $$invalidate(12, striped = $$props2.striped);
    if ("style" in $$props2)
      $$invalidate(13, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(14, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    value,
    active2,
    indeterminate,
    height,
    backgroundColor,
    backgroundOpacity,
    color,
    buffer,
    reversed,
    stream,
    rounded,
    striped,
    style,
    $$scope,
    slots
  ];
}
class ProgressLinear extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$d, safe_not_equal, {
      class: 0,
      value: 1,
      active: 2,
      indeterminate: 3,
      height: 4,
      backgroundColor: 5,
      backgroundOpacity: 6,
      color: 7,
      buffer: 8,
      reversed: 9,
      stream: 10,
      rounded: 11,
      striped: 12,
      style: 13
    });
  }
}
var ProgressCircular_svelte_svelte_type_style_lang = "";
function create_if_block$4(ctx) {
  let circle;
  let circle_levels = [{ class: "underlay" }, ctx[9], { "stroke-dashoffset": "0" }];
  let circle_data = {};
  for (let i = 0; i < circle_levels.length; i += 1) {
    circle_data = assign(circle_data, circle_levels[i]);
  }
  return {
    c() {
      circle = svg_element("circle");
      set_svg_attributes(circle, circle_data);
      toggle_class(circle, "svelte-1yxf4vo", true);
    },
    m(target, anchor) {
      insert(target, circle, anchor);
    },
    p(ctx2, dirty) {
      set_svg_attributes(circle, circle_data = get_spread_update(circle_levels, [
        { class: "underlay" },
        ctx2[9],
        { "stroke-dashoffset": "0" }
      ]));
      toggle_class(circle, "svelte-1yxf4vo", true);
    },
    d(detaching) {
      if (detaching)
        detach(circle);
    }
  };
}
function create_fragment$c(ctx) {
  let div1;
  let svg;
  let circle;
  let t;
  let div0;
  let div1_class_value;
  let div1_style_value;
  let TextColor_action;
  let current;
  let mounted;
  let dispose;
  let if_block = !ctx[1] && create_if_block$4(ctx);
  let circle_levels = [
    { class: "overlay" },
    ctx[9],
    {
      "stroke-dashoffset": ctx[8]
    }
  ];
  let circle_data = {};
  for (let i = 0; i < circle_levels.length; i += 1) {
    circle_data = assign(circle_data, circle_levels[i]);
  }
  const default_slot_template = ctx[12].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[11], null);
  return {
    c() {
      div1 = element("div");
      svg = svg_element("svg");
      if (if_block)
        if_block.c();
      circle = svg_element("circle");
      t = space();
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      set_svg_attributes(circle, circle_data);
      toggle_class(circle, "svelte-1yxf4vo", true);
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "viewBox", "" + (ctx[7] + "\n    " + ctx[7] + "\n    " + 2 * ctx[7] + "\n    " + 2 * ctx[7]));
      set_style(svg, "transform", "rotate(" + ctx[3] + "deg)");
      attr(svg, "class", "svelte-1yxf4vo");
      attr(div0, "class", "s-progress-circular__content svelte-1yxf4vo");
      attr(div1, "role", "progressbar");
      attr(div1, "aria-valuemin", "0");
      attr(div1, "aria-valuemax", "100");
      attr(div1, "aria-valuenow", ctx[5]);
      attr(div1, "class", div1_class_value = "s-progress-circular " + ctx[0] + " svelte-1yxf4vo");
      attr(div1, "style", div1_style_value = "width:" + ctx[4] + "px;height:" + ctx[4] + "px;" + ctx[6]);
      toggle_class(div1, "indeterminate", ctx[1]);
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, svg);
      if (if_block)
        if_block.m(svg, null);
      append(svg, circle);
      append(div1, t);
      append(div1, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      current = true;
      if (!mounted) {
        dispose = action_destroyer(TextColor_action = TextColor.call(null, div1, ctx[2]));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$4(ctx2);
          if_block.c();
          if_block.m(svg, circle);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      set_svg_attributes(circle, circle_data = get_spread_update(circle_levels, [
        { class: "overlay" },
        ctx2[9],
        {
          "stroke-dashoffset": ctx2[8]
        }
      ]));
      toggle_class(circle, "svelte-1yxf4vo", true);
      if (!current || dirty & 8) {
        set_style(svg, "transform", "rotate(" + ctx2[3] + "deg)");
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 2048)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[11], !current ? get_all_dirty_from_scope(ctx2[11]) : get_slot_changes(default_slot_template, ctx2[11], dirty, null), null);
        }
      }
      if (!current || dirty & 32) {
        attr(div1, "aria-valuenow", ctx2[5]);
      }
      if (!current || dirty & 1 && div1_class_value !== (div1_class_value = "s-progress-circular " + ctx2[0] + " svelte-1yxf4vo")) {
        attr(div1, "class", div1_class_value);
      }
      if (!current || dirty & 80 && div1_style_value !== (div1_style_value = "width:" + ctx2[4] + "px;height:" + ctx2[4] + "px;" + ctx2[6])) {
        attr(div1, "style", div1_style_value);
      }
      if (TextColor_action && is_function(TextColor_action.update) && dirty & 4)
        TextColor_action.update.call(null, ctx2[2]);
      if (dirty & 3) {
        toggle_class(div1, "indeterminate", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block)
        if_block.d();
      if (default_slot)
        default_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
const radius = 20;
function instance$c($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { indeterminate = false } = $$props;
  let { color = "secondary" } = $$props;
  let { rotate = 0 } = $$props;
  let { size = 32 } = $$props;
  let { value = 0 } = $$props;
  let { width = 4 } = $$props;
  let { style = "" } = $$props;
  const circumference = 2 * 3.1416 * radius;
  const viewBoxSize = radius / (1 - Number(width) / +size);
  const strokeWidth = Number(width) / +size * viewBoxSize * 2;
  const strokeDashOffset = (100 - value) / 100 * circumference;
  const circleProps = {
    fill: "transparent",
    cx: 2 * viewBoxSize,
    cy: 2 * viewBoxSize,
    r: radius,
    "stroke-width": strokeWidth,
    "stroke-dasharray": circumference
  };
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("indeterminate" in $$props2)
      $$invalidate(1, indeterminate = $$props2.indeterminate);
    if ("color" in $$props2)
      $$invalidate(2, color = $$props2.color);
    if ("rotate" in $$props2)
      $$invalidate(3, rotate = $$props2.rotate);
    if ("size" in $$props2)
      $$invalidate(4, size = $$props2.size);
    if ("value" in $$props2)
      $$invalidate(5, value = $$props2.value);
    if ("width" in $$props2)
      $$invalidate(10, width = $$props2.width);
    if ("style" in $$props2)
      $$invalidate(6, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(11, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    indeterminate,
    color,
    rotate,
    size,
    value,
    style,
    viewBoxSize,
    strokeDashOffset,
    circleProps,
    width,
    $$scope,
    slots
  ];
}
class ProgressCircular extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$c, create_fragment$c, safe_not_equal, {
      class: 0,
      indeterminate: 1,
      color: 2,
      rotate: 3,
      size: 4,
      value: 5,
      width: 10,
      style: 6
    });
  }
}
var Snackbar_svelte_svelte_type_style_lang = "";
var Card_svelte_svelte_type_style_lang = "";
const get_progress_slot_changes = (dirty) => ({});
const get_progress_slot_context = (ctx) => ({});
function create_if_block$3(ctx) {
  let current;
  const progress_slot_template = ctx[12].progress;
  const progress_slot = create_slot(progress_slot_template, ctx, ctx[11], get_progress_slot_context);
  const progress_slot_or_fallback = progress_slot || fallback_block();
  return {
    c() {
      if (progress_slot_or_fallback)
        progress_slot_or_fallback.c();
    },
    m(target, anchor) {
      if (progress_slot_or_fallback) {
        progress_slot_or_fallback.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (progress_slot) {
        if (progress_slot.p && (!current || dirty & 2048)) {
          update_slot_base(progress_slot, progress_slot_template, ctx2, ctx2[11], !current ? get_all_dirty_from_scope(ctx2[11]) : get_slot_changes(progress_slot_template, ctx2[11], dirty, get_progress_slot_changes), get_progress_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(progress_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(progress_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (progress_slot_or_fallback)
        progress_slot_or_fallback.d(detaching);
    }
  };
}
function fallback_block(ctx) {
  let progresslinear;
  let current;
  progresslinear = new ProgressLinear({ props: { indeterminate: true } });
  return {
    c() {
      create_component(progresslinear.$$.fragment);
    },
    m(target, anchor) {
      mount_component(progresslinear, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(progresslinear.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(progresslinear.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(progresslinear, detaching);
    }
  };
}
function create_fragment$b(ctx) {
  let div;
  let t;
  let div_class_value;
  let current;
  let if_block = ctx[8] && create_if_block$3(ctx);
  const default_slot_template = ctx[12].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[11], null);
  return {
    c() {
      div = element("div");
      if (if_block)
        if_block.c();
      t = space();
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-card " + ctx[0]);
      attr(div, "style", ctx[10]);
      toggle_class(div, "flat", ctx[1]);
      toggle_class(div, "tile", ctx[2]);
      toggle_class(div, "outlined", ctx[3]);
      toggle_class(div, "raised", ctx[4]);
      toggle_class(div, "shaped", ctx[5]);
      toggle_class(div, "hover", ctx[6]);
      toggle_class(div, "link", ctx[7]);
      toggle_class(div, "disabled", ctx[9]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block)
        if_block.m(div, null);
      append(div, t);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (ctx2[8]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 256) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$3(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, t);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 2048)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[11], !current ? get_all_dirty_from_scope(ctx2[11]) : get_slot_changes(default_slot_template, ctx2[11], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-card " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 1024) {
        attr(div, "style", ctx2[10]);
      }
      if (dirty & 3) {
        toggle_class(div, "flat", ctx2[1]);
      }
      if (dirty & 5) {
        toggle_class(div, "tile", ctx2[2]);
      }
      if (dirty & 9) {
        toggle_class(div, "outlined", ctx2[3]);
      }
      if (dirty & 17) {
        toggle_class(div, "raised", ctx2[4]);
      }
      if (dirty & 33) {
        toggle_class(div, "shaped", ctx2[5]);
      }
      if (dirty & 65) {
        toggle_class(div, "hover", ctx2[6]);
      }
      if (dirty & 129) {
        toggle_class(div, "link", ctx2[7]);
      }
      if (dirty & 513) {
        toggle_class(div, "disabled", ctx2[9]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block)
        if_block.d();
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$b($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { flat = false } = $$props;
  let { tile = false } = $$props;
  let { outlined = false } = $$props;
  let { raised = false } = $$props;
  let { shaped = false } = $$props;
  let { hover = false } = $$props;
  let { link = false } = $$props;
  let { loading = false } = $$props;
  let { disabled = false } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("flat" in $$props2)
      $$invalidate(1, flat = $$props2.flat);
    if ("tile" in $$props2)
      $$invalidate(2, tile = $$props2.tile);
    if ("outlined" in $$props2)
      $$invalidate(3, outlined = $$props2.outlined);
    if ("raised" in $$props2)
      $$invalidate(4, raised = $$props2.raised);
    if ("shaped" in $$props2)
      $$invalidate(5, shaped = $$props2.shaped);
    if ("hover" in $$props2)
      $$invalidate(6, hover = $$props2.hover);
    if ("link" in $$props2)
      $$invalidate(7, link = $$props2.link);
    if ("loading" in $$props2)
      $$invalidate(8, loading = $$props2.loading);
    if ("disabled" in $$props2)
      $$invalidate(9, disabled = $$props2.disabled);
    if ("style" in $$props2)
      $$invalidate(10, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(11, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    flat,
    tile,
    outlined,
    raised,
    shaped,
    hover,
    link,
    loading,
    disabled,
    style,
    $$scope,
    slots
  ];
}
class Card extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$b, create_fragment$b, safe_not_equal, {
      class: 0,
      flat: 1,
      tile: 2,
      outlined: 3,
      raised: 4,
      shaped: 5,
      hover: 6,
      link: 7,
      loading: 8,
      disabled: 9,
      style: 10
    });
  }
}
var CardActions_svelte_svelte_type_style_lang = "";
function create_fragment$a(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[2], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-card-actions " + ctx[0]);
      attr(div, "style", ctx[1]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[2], !current ? get_all_dirty_from_scope(ctx2[2]) : get_slot_changes(default_slot_template, ctx2[2], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-card-actions " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 2) {
        attr(div, "style", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$a($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("style" in $$props2)
      $$invalidate(1, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(2, $$scope = $$props2.$$scope);
  };
  return [klass, style, $$scope, slots];
}
class CardActions extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a, create_fragment$a, safe_not_equal, { class: 0, style: 1 });
  }
}
var CardSubtitle_svelte_svelte_type_style_lang = "";
var CardText_svelte_svelte_type_style_lang = "";
function create_fragment$9(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[2], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-card-text " + ctx[0]);
      attr(div, "style", ctx[1]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[2], !current ? get_all_dirty_from_scope(ctx2[2]) : get_slot_changes(default_slot_template, ctx2[2], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-card-text " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 2) {
        attr(div, "style", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$9($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("style" in $$props2)
      $$invalidate(1, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(2, $$scope = $$props2.$$scope);
  };
  return [klass, style, $$scope, slots];
}
class CardText extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$9, create_fragment$9, safe_not_equal, { class: 0, style: 1 });
  }
}
var CardTitle_svelte_svelte_type_style_lang = "";
function create_fragment$8(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[2], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-card-title " + ctx[0]);
      attr(div, "style", ctx[1]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[2], !current ? get_all_dirty_from_scope(ctx2[2]) : get_slot_changes(default_slot_template, ctx2[2], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-card-title " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 2) {
        attr(div, "style", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$8($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("style" in $$props2)
      $$invalidate(1, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(2, $$scope = $$props2.$$scope);
  };
  return [klass, style, $$scope, slots];
}
class CardTitle extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$8, create_fragment$8, safe_not_equal, { class: 0, style: 1 });
  }
}
var NavigationDrawer_svelte_svelte_type_style_lang = "";
const get_append_slot_changes = (dirty) => ({});
const get_append_slot_context = (ctx) => ({});
const get_prepend_slot_changes = (dirty) => ({});
const get_prepend_slot_context = (ctx) => ({});
function create_if_block$2(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "s-navigation-drawer__border");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment$7(ctx) {
  let aside;
  let t0;
  let div;
  let t1;
  let t2;
  let aside_class_value;
  let aside_style_value;
  let Style_action;
  let aside_transition;
  let current;
  let mounted;
  let dispose;
  const prepend_slot_template = ctx[16].prepend;
  const prepend_slot = create_slot(prepend_slot_template, ctx, ctx[15], get_prepend_slot_context);
  const default_slot_template = ctx[16].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[15], null);
  const append_slot_template = ctx[16].append;
  const append_slot = create_slot(append_slot_template, ctx, ctx[15], get_append_slot_context);
  let if_block = !ctx[8] && create_if_block$2();
  return {
    c() {
      aside = element("aside");
      if (prepend_slot)
        prepend_slot.c();
      t0 = space();
      div = element("div");
      if (default_slot)
        default_slot.c();
      t1 = space();
      if (append_slot)
        append_slot.c();
      t2 = space();
      if (if_block)
        if_block.c();
      attr(div, "class", "s-navigation-drawer__content");
      attr(aside, "class", aside_class_value = "s-navigation-drawer " + ctx[0]);
      attr(aside, "style", aside_style_value = "z-index:" + ctx[13] + ";" + ctx[14]);
      toggle_class(aside, "active", ctx[2]);
      toggle_class(aside, "fixed", ctx[3]);
      toggle_class(aside, "absolute", ctx[4]);
      toggle_class(aside, "right", ctx[5]);
      toggle_class(aside, "mini", ctx[6]);
      toggle_class(aside, "clipped", ctx[7]);
    },
    m(target, anchor) {
      insert(target, aside, anchor);
      if (prepend_slot) {
        prepend_slot.m(aside, null);
      }
      append(aside, t0);
      append(aside, div);
      if (default_slot) {
        default_slot.m(div, null);
      }
      append(aside, t1);
      if (append_slot) {
        append_slot.m(aside, null);
      }
      append(aside, t2);
      if (if_block)
        if_block.m(aside, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(aside, "introstart", ctx[17]),
          listen(aside, "outrostart", ctx[18]),
          listen(aside, "introend", ctx[19]),
          listen(aside, "outroend", ctx[20]),
          listen(aside, "hover", ctx[21]),
          action_destroyer(Style_action = Style.call(null, aside, {
            "nav-width": ctx[1],
            "nav-min-width": ctx[9],
            "nav-clipped-height": ctx[10]
          }))
        ];
        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      if (prepend_slot) {
        if (prepend_slot.p && (!current || dirty & 32768)) {
          update_slot_base(prepend_slot, prepend_slot_template, ctx, ctx[15], !current ? get_all_dirty_from_scope(ctx[15]) : get_slot_changes(prepend_slot_template, ctx[15], dirty, get_prepend_slot_changes), get_prepend_slot_context);
        }
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 32768)) {
          update_slot_base(default_slot, default_slot_template, ctx, ctx[15], !current ? get_all_dirty_from_scope(ctx[15]) : get_slot_changes(default_slot_template, ctx[15], dirty, null), null);
        }
      }
      if (append_slot) {
        if (append_slot.p && (!current || dirty & 32768)) {
          update_slot_base(append_slot, append_slot_template, ctx, ctx[15], !current ? get_all_dirty_from_scope(ctx[15]) : get_slot_changes(append_slot_template, ctx[15], dirty, get_append_slot_changes), get_append_slot_context);
        }
      }
      if (!ctx[8]) {
        if (if_block)
          ;
        else {
          if_block = create_if_block$2();
          if_block.c();
          if_block.m(aside, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (!current || dirty & 1 && aside_class_value !== (aside_class_value = "s-navigation-drawer " + ctx[0])) {
        attr(aside, "class", aside_class_value);
      }
      if (!current || dirty & 24576 && aside_style_value !== (aside_style_value = "z-index:" + ctx[13] + ";" + ctx[14])) {
        attr(aside, "style", aside_style_value);
      }
      if (Style_action && is_function(Style_action.update) && dirty & 1538)
        Style_action.update.call(null, {
          "nav-width": ctx[1],
          "nav-min-width": ctx[9],
          "nav-clipped-height": ctx[10]
        });
      if (dirty & 5) {
        toggle_class(aside, "active", ctx[2]);
      }
      if (dirty & 9) {
        toggle_class(aside, "fixed", ctx[3]);
      }
      if (dirty & 17) {
        toggle_class(aside, "absolute", ctx[4]);
      }
      if (dirty & 33) {
        toggle_class(aside, "right", ctx[5]);
      }
      if (dirty & 65) {
        toggle_class(aside, "mini", ctx[6]);
      }
      if (dirty & 129) {
        toggle_class(aside, "clipped", ctx[7]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(prepend_slot, local);
      transition_in(default_slot, local);
      transition_in(append_slot, local);
      add_render_callback(() => {
        if (!aside_transition)
          aside_transition = create_bidirectional_transition(aside, ctx[11], ctx[12], true);
        aside_transition.run(1);
      });
      current = true;
    },
    o(local) {
      transition_out(prepend_slot, local);
      transition_out(default_slot, local);
      transition_out(append_slot, local);
      if (!aside_transition)
        aside_transition = create_bidirectional_transition(aside, ctx[11], ctx[12], false);
      aside_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(aside);
      if (prepend_slot)
        prepend_slot.d(detaching);
      if (default_slot)
        default_slot.d(detaching);
      if (append_slot)
        append_slot.d(detaching);
      if (if_block)
        if_block.d();
      if (detaching && aside_transition)
        aside_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$7($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { width = "256px" } = $$props;
  let { active: active2 = true } = $$props;
  let { fixed = false } = $$props;
  let { absolute = false } = $$props;
  let { right = false } = $$props;
  let { mini = false } = $$props;
  let { clipped = false } = $$props;
  let { borderless = false } = $$props;
  let { miniWidth = "56px" } = $$props;
  let { clippedHeight = "56px" } = $$props;
  let { transition = fade } = $$props;
  let { transitionOpts = {} } = $$props;
  let { index = 4 } = $$props;
  let { style = null } = $$props;
  function introstart_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function outrostart_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function introend_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function outroend_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function hover_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("width" in $$props2)
      $$invalidate(1, width = $$props2.width);
    if ("active" in $$props2)
      $$invalidate(2, active2 = $$props2.active);
    if ("fixed" in $$props2)
      $$invalidate(3, fixed = $$props2.fixed);
    if ("absolute" in $$props2)
      $$invalidate(4, absolute = $$props2.absolute);
    if ("right" in $$props2)
      $$invalidate(5, right = $$props2.right);
    if ("mini" in $$props2)
      $$invalidate(6, mini = $$props2.mini);
    if ("clipped" in $$props2)
      $$invalidate(7, clipped = $$props2.clipped);
    if ("borderless" in $$props2)
      $$invalidate(8, borderless = $$props2.borderless);
    if ("miniWidth" in $$props2)
      $$invalidate(9, miniWidth = $$props2.miniWidth);
    if ("clippedHeight" in $$props2)
      $$invalidate(10, clippedHeight = $$props2.clippedHeight);
    if ("transition" in $$props2)
      $$invalidate(11, transition = $$props2.transition);
    if ("transitionOpts" in $$props2)
      $$invalidate(12, transitionOpts = $$props2.transitionOpts);
    if ("index" in $$props2)
      $$invalidate(13, index = $$props2.index);
    if ("style" in $$props2)
      $$invalidate(14, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(15, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    width,
    active2,
    fixed,
    absolute,
    right,
    mini,
    clipped,
    borderless,
    miniWidth,
    clippedHeight,
    transition,
    transitionOpts,
    index,
    style,
    $$scope,
    slots,
    introstart_handler,
    outrostart_handler,
    introend_handler,
    outroend_handler,
    hover_handler
  ];
}
class NavigationDrawer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7, create_fragment$7, safe_not_equal, {
      class: 0,
      width: 1,
      active: 2,
      fixed: 3,
      absolute: 4,
      right: 5,
      mini: 6,
      clipped: 7,
      borderless: 8,
      miniWidth: 9,
      clippedHeight: 10,
      transition: 11,
      transitionOpts: 12,
      index: 13,
      style: 14
    });
  }
}
var Subheader_svelte_svelte_type_style_lang = "";
var Container_svelte_svelte_type_style_lang = "";
var Row_svelte_svelte_type_style_lang = "";
function create_fragment$6(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[4], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-row " + ctx[0]);
      attr(div, "style", ctx[3]);
      toggle_class(div, "dense", ctx[1]);
      toggle_class(div, "no-gutters", ctx[2]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 16)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[4], !current ? get_all_dirty_from_scope(ctx2[4]) : get_slot_changes(default_slot_template, ctx2[4], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-row " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 8) {
        attr(div, "style", ctx2[3]);
      }
      if (dirty & 3) {
        toggle_class(div, "dense", ctx2[1]);
      }
      if (dirty & 5) {
        toggle_class(div, "no-gutters", ctx2[2]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$6($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { dense = false } = $$props;
  let { noGutters = false } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("dense" in $$props2)
      $$invalidate(1, dense = $$props2.dense);
    if ("noGutters" in $$props2)
      $$invalidate(2, noGutters = $$props2.noGutters);
    if ("style" in $$props2)
      $$invalidate(3, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(4, $$scope = $$props2.$$scope);
  };
  return [klass, dense, noGutters, style, $$scope, slots];
}
class Row extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$6, create_fragment$6, safe_not_equal, {
      class: 0,
      dense: 1,
      noGutters: 2,
      style: 3
    });
  }
}
var Col_svelte_svelte_type_style_lang = "";
function create_fragment$5(ctx) {
  let div;
  let div_class_value;
  let Class_action;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[13].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[12], null);
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      attr(div, "class", div_class_value = "s-col " + ctx[0]);
      attr(div, "style", ctx[11]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      current = true;
      if (!mounted) {
        dispose = action_destroyer(Class_action = Class.call(null, div, [
          ctx[1] && `col-${ctx[1]}`,
          ctx[2] && `sm-${ctx[2]}`,
          ctx[3] && `md-${ctx[3]}`,
          ctx[4] && `lg-${ctx[4]}`,
          ctx[5] && `xl-${ctx[5]}`,
          ctx[6] && `offset-${ctx[6]}`,
          ctx[7] && `offset-sm-${ctx[7]}`,
          ctx[8] && `offset-md-${ctx[8]}`,
          ctx[9] && `offset-lg-${ctx[9]}`,
          ctx[10] && `offset-xl-${ctx[10]}`
        ]));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 4096)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[12], !current ? get_all_dirty_from_scope(ctx2[12]) : get_slot_changes(default_slot_template, ctx2[12], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && div_class_value !== (div_class_value = "s-col " + ctx2[0])) {
        attr(div, "class", div_class_value);
      }
      if (!current || dirty & 2048) {
        attr(div, "style", ctx2[11]);
      }
      if (Class_action && is_function(Class_action.update) && dirty & 2046)
        Class_action.update.call(null, [
          ctx2[1] && `col-${ctx2[1]}`,
          ctx2[2] && `sm-${ctx2[2]}`,
          ctx2[3] && `md-${ctx2[3]}`,
          ctx2[4] && `lg-${ctx2[4]}`,
          ctx2[5] && `xl-${ctx2[5]}`,
          ctx2[6] && `offset-${ctx2[6]}`,
          ctx2[7] && `offset-sm-${ctx2[7]}`,
          ctx2[8] && `offset-md-${ctx2[8]}`,
          ctx2[9] && `offset-lg-${ctx2[9]}`,
          ctx2[10] && `offset-xl-${ctx2[10]}`
        ]);
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$5($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { cols = false } = $$props;
  let { sm = false } = $$props;
  let { md = false } = $$props;
  let { lg = false } = $$props;
  let { xl = false } = $$props;
  let { offset = false } = $$props;
  let { offset_sm = false } = $$props;
  let { offset_md = false } = $$props;
  let { offset_lg = false } = $$props;
  let { offset_xl = false } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("cols" in $$props2)
      $$invalidate(1, cols = $$props2.cols);
    if ("sm" in $$props2)
      $$invalidate(2, sm = $$props2.sm);
    if ("md" in $$props2)
      $$invalidate(3, md = $$props2.md);
    if ("lg" in $$props2)
      $$invalidate(4, lg = $$props2.lg);
    if ("xl" in $$props2)
      $$invalidate(5, xl = $$props2.xl);
    if ("offset" in $$props2)
      $$invalidate(6, offset = $$props2.offset);
    if ("offset_sm" in $$props2)
      $$invalidate(7, offset_sm = $$props2.offset_sm);
    if ("offset_md" in $$props2)
      $$invalidate(8, offset_md = $$props2.offset_md);
    if ("offset_lg" in $$props2)
      $$invalidate(9, offset_lg = $$props2.offset_lg);
    if ("offset_xl" in $$props2)
      $$invalidate(10, offset_xl = $$props2.offset_xl);
    if ("style" in $$props2)
      $$invalidate(11, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(12, $$scope = $$props2.$$scope);
  };
  return [
    klass,
    cols,
    sm,
    md,
    lg,
    xl,
    offset,
    offset_sm,
    offset_md,
    offset_lg,
    offset_xl,
    style,
    $$scope,
    slots
  ];
}
class Col extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$5, create_fragment$5, safe_not_equal, {
      class: 0,
      cols: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      offset: 6,
      offset_sm: 7,
      offset_md: 8,
      offset_lg: 9,
      offset_xl: 10,
      style: 11
    });
  }
}
var Table_svelte_svelte_type_style_lang = "";
var SlideGroup_svelte_svelte_type_style_lang = "";
var SlideItem_svelte_svelte_type_style_lang = "";
var Window_svelte_svelte_type_style_lang = "";
var WindowItem_svelte_svelte_type_style_lang = "";
var Tabs_svelte_svelte_type_style_lang = "";
var Tab_svelte_svelte_type_style_lang = "";
var Footer_svelte_svelte_type_style_lang = "";
function create_fragment$4(ctx) {
  let footer;
  let footer_class_value;
  let current;
  const default_slot_template = ctx[7].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[6], null);
  return {
    c() {
      footer = element("footer");
      if (default_slot)
        default_slot.c();
      attr(footer, "class", footer_class_value = "s-footer " + ctx[0]);
      attr(footer, "style", ctx[5]);
      toggle_class(footer, "absolute", ctx[1]);
      toggle_class(footer, "fixed", ctx[2]);
      toggle_class(footer, "inset", ctx[3]);
      toggle_class(footer, "padless", ctx[4]);
    },
    m(target, anchor) {
      insert(target, footer, anchor);
      if (default_slot) {
        default_slot.m(footer, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 64)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[6], !current ? get_all_dirty_from_scope(ctx2[6]) : get_slot_changes(default_slot_template, ctx2[6], dirty, null), null);
        }
      }
      if (!current || dirty & 1 && footer_class_value !== (footer_class_value = "s-footer " + ctx2[0])) {
        attr(footer, "class", footer_class_value);
      }
      if (!current || dirty & 32) {
        attr(footer, "style", ctx2[5]);
      }
      if (dirty & 3) {
        toggle_class(footer, "absolute", ctx2[1]);
      }
      if (dirty & 5) {
        toggle_class(footer, "fixed", ctx2[2]);
      }
      if (dirty & 9) {
        toggle_class(footer, "inset", ctx2[3]);
      }
      if (dirty & 17) {
        toggle_class(footer, "padless", ctx2[4]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(footer);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$4($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: klass = "" } = $$props;
  let { absolute = false } = $$props;
  let { fixed = false } = $$props;
  let { inset = false } = $$props;
  let { padless = false } = $$props;
  let { style = null } = $$props;
  $$self.$$set = ($$props2) => {
    if ("class" in $$props2)
      $$invalidate(0, klass = $$props2.class);
    if ("absolute" in $$props2)
      $$invalidate(1, absolute = $$props2.absolute);
    if ("fixed" in $$props2)
      $$invalidate(2, fixed = $$props2.fixed);
    if ("inset" in $$props2)
      $$invalidate(3, inset = $$props2.inset);
    if ("padless" in $$props2)
      $$invalidate(4, padless = $$props2.padless);
    if ("style" in $$props2)
      $$invalidate(5, style = $$props2.style);
    if ("$$scope" in $$props2)
      $$invalidate(6, $$scope = $$props2.$$scope);
  };
  return [klass, absolute, fixed, inset, padless, style, $$scope, slots];
}
class Footer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$4, create_fragment$4, safe_not_equal, {
      class: 0,
      absolute: 1,
      fixed: 2,
      inset: 3,
      padless: 4,
      style: 5
    });
  }
}
var Tooltip_svelte_svelte_type_style_lang = "";
function parse(str, loose) {
  if (str instanceof RegExp)
    return { keys: false, pattern: str };
  var c, o, tmp, ext, keys = [], pattern = "", arr = str.split("/");
  arr[0] || arr.shift();
  while (tmp = arr.shift()) {
    c = tmp[0];
    if (c === "*") {
      keys.push("wild");
      pattern += "/(.*)";
    } else if (c === ":") {
      o = tmp.indexOf("?", 1);
      ext = tmp.indexOf(".", 1);
      keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
      pattern += !!~o && !~ext ? "(?:/([^/]+?))?" : "/([^/]+?)";
      if (!!~ext)
        pattern += (!!~o ? "?" : "") + "\\" + tmp.substring(ext);
    } else {
      pattern += "/" + tmp;
    }
  }
  return {
    keys,
    pattern: new RegExp("^" + pattern + (loose ? "(?=$|/)" : "/?$"), "i")
  };
}
function create_else_block$1(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [ctx[2]];
  var switch_value = ctx[0];
  function switch_props(ctx2) {
    let switch_instance_props = {};
    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    }
    return { props: switch_instance_props };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props());
    switch_instance.$on("routeEvent", ctx[7]);
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }
      insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = dirty & 4 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(ctx2[2])]) : {};
      if (switch_value !== (switch_value = ctx2[0])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props());
          switch_instance.$on("routeEvent", ctx2[7]);
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_if_block$1(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [{ params: ctx[1] }, ctx[2]];
  var switch_value = ctx[0];
  function switch_props(ctx2) {
    let switch_instance_props = {};
    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    }
    return { props: switch_instance_props };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props());
    switch_instance.$on("routeEvent", ctx[6]);
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }
      insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = dirty & 6 ? get_spread_update(switch_instance_spread_levels, [
        dirty & 2 && { params: ctx2[1] },
        dirty & 4 && get_spread_object(ctx2[2])
      ]) : {};
      if (switch_value !== (switch_value = ctx2[0])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props());
          switch_instance.$on("routeEvent", ctx2[6]);
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_fragment$3(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$1, create_else_block$1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[1])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function getLocation() {
  const hashPosition = window.location.href.indexOf("#/");
  let location = hashPosition > -1 ? window.location.href.substr(hashPosition + 1) : "/";
  const qsPosition = location.indexOf("?");
  let querystring2 = "";
  if (qsPosition > -1) {
    querystring2 = location.substr(qsPosition + 1);
    location = location.substr(0, qsPosition);
  }
  return { location, querystring: querystring2 };
}
const loc = readable(null, function start(set) {
  set(getLocation());
  const update2 = () => {
    set(getLocation());
  };
  window.addEventListener("hashchange", update2, false);
  return function stop() {
    window.removeEventListener("hashchange", update2, false);
  };
});
derived(loc, ($loc) => $loc.location);
const querystring = derived(loc, ($loc) => $loc.querystring);
const params = writable(void 0);
async function push(location) {
  if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    throw Error("Invalid parameter location");
  }
  await tick();
  history.replaceState(__spreadProps(__spreadValues({}, history.state), {
    __svelte_spa_router_scrollX: window.scrollX,
    __svelte_spa_router_scrollY: window.scrollY
  }), void 0, void 0);
  window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
}
async function replace(location) {
  if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    throw Error("Invalid parameter location");
  }
  await tick();
  const dest = (location.charAt(0) == "#" ? "" : "#") + location;
  try {
    const newState = __spreadValues({}, history.state);
    delete newState["__svelte_spa_router_scrollX"];
    delete newState["__svelte_spa_router_scrollY"];
    window.history.replaceState(newState, void 0, dest);
  } catch (e) {
    console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
  }
  window.dispatchEvent(new Event("hashchange"));
}
function instance$3($$self, $$props, $$invalidate) {
  let { routes = {} } = $$props;
  let { prefix = "" } = $$props;
  let { restoreScrollState = false } = $$props;
  class RouteItem {
    constructor(path, component2) {
      if (!component2 || typeof component2 != "function" && (typeof component2 != "object" || component2._sveltesparouter !== true)) {
        throw Error("Invalid component object");
      }
      if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
        throw Error('Invalid value for "path" argument - strings must start with / or *');
      }
      const { pattern, keys } = parse(path);
      this.path = path;
      if (typeof component2 == "object" && component2._sveltesparouter === true) {
        this.component = component2.component;
        this.conditions = component2.conditions || [];
        this.userData = component2.userData;
        this.props = component2.props || {};
      } else {
        this.component = () => Promise.resolve(component2);
        this.conditions = [];
        this.props = {};
      }
      this._pattern = pattern;
      this._keys = keys;
    }
    match(path) {
      if (prefix) {
        if (typeof prefix == "string") {
          if (path.startsWith(prefix)) {
            path = path.substr(prefix.length) || "/";
          } else {
            return null;
          }
        } else if (prefix instanceof RegExp) {
          const match = path.match(prefix);
          if (match && match[0]) {
            path = path.substr(match[0].length) || "/";
          } else {
            return null;
          }
        }
      }
      const matches = this._pattern.exec(path);
      if (matches === null) {
        return null;
      }
      if (this._keys === false) {
        return matches;
      }
      const out = {};
      let i = 0;
      while (i < this._keys.length) {
        try {
          out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
        } catch (e) {
          out[this._keys[i]] = null;
        }
        i++;
      }
      return out;
    }
    async checkConditions(detail) {
      for (let i = 0; i < this.conditions.length; i++) {
        if (!await this.conditions[i](detail)) {
          return false;
        }
      }
      return true;
    }
  }
  const routesList = [];
  if (routes instanceof Map) {
    routes.forEach((route, path) => {
      routesList.push(new RouteItem(path, route));
    });
  } else {
    Object.keys(routes).forEach((path) => {
      routesList.push(new RouteItem(path, routes[path]));
    });
  }
  let component = null;
  let componentParams = null;
  let props = {};
  const dispatch2 = createEventDispatcher();
  async function dispatchNextTick(name, detail) {
    await tick();
    dispatch2(name, detail);
  }
  let previousScrollState = null;
  let popStateChanged = null;
  if (restoreScrollState) {
    popStateChanged = (event2) => {
      if (event2.state && event2.state.__svelte_spa_router_scrollY) {
        previousScrollState = event2.state;
      } else {
        previousScrollState = null;
      }
    };
    window.addEventListener("popstate", popStateChanged);
    afterUpdate(() => {
      if (previousScrollState) {
        window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
      } else {
        window.scrollTo(0, 0);
      }
    });
  }
  let lastLoc = null;
  let componentObj = null;
  const unsubscribeLoc = loc.subscribe(async (newLoc) => {
    lastLoc = newLoc;
    let i = 0;
    while (i < routesList.length) {
      const match = routesList[i].match(newLoc.location);
      if (!match) {
        i++;
        continue;
      }
      const detail = {
        route: routesList[i].path,
        location: newLoc.location,
        querystring: newLoc.querystring,
        userData: routesList[i].userData,
        params: match && typeof match == "object" && Object.keys(match).length ? match : null
      };
      if (!await routesList[i].checkConditions(detail)) {
        $$invalidate(0, component = null);
        componentObj = null;
        dispatchNextTick("conditionsFailed", detail);
        return;
      }
      dispatchNextTick("routeLoading", Object.assign({}, detail));
      const obj = routesList[i].component;
      if (componentObj != obj) {
        if (obj.loading) {
          $$invalidate(0, component = obj.loading);
          componentObj = obj;
          $$invalidate(1, componentParams = obj.loadingParams);
          $$invalidate(2, props = {});
          dispatchNextTick("routeLoaded", Object.assign({}, detail, {
            component,
            name: component.name,
            params: componentParams
          }));
        } else {
          $$invalidate(0, component = null);
          componentObj = null;
        }
        const loaded = await obj();
        if (newLoc != lastLoc) {
          return;
        }
        $$invalidate(0, component = loaded && loaded.default || loaded);
        componentObj = obj;
      }
      if (match && typeof match == "object" && Object.keys(match).length) {
        $$invalidate(1, componentParams = match);
      } else {
        $$invalidate(1, componentParams = null);
      }
      $$invalidate(2, props = routesList[i].props);
      dispatchNextTick("routeLoaded", Object.assign({}, detail, {
        component,
        name: component.name,
        params: componentParams
      })).then(() => {
        params.set(componentParams);
      });
      return;
    }
    $$invalidate(0, component = null);
    componentObj = null;
    params.set(void 0);
  });
  onDestroy(() => {
    unsubscribeLoc();
    popStateChanged && window.removeEventListener("popstate", popStateChanged);
  });
  function routeEvent_handler(event2) {
    bubble.call(this, $$self, event2);
  }
  function routeEvent_handler_1(event2) {
    bubble.call(this, $$self, event2);
  }
  $$self.$$set = ($$props2) => {
    if ("routes" in $$props2)
      $$invalidate(3, routes = $$props2.routes);
    if ("prefix" in $$props2)
      $$invalidate(4, prefix = $$props2.prefix);
    if ("restoreScrollState" in $$props2)
      $$invalidate(5, restoreScrollState = $$props2.restoreScrollState);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 32) {
      history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    }
  };
  return [
    component,
    componentParams,
    props,
    routes,
    prefix,
    restoreScrollState,
    routeEvent_handler,
    routeEvent_handler_1
  ];
}
class Router extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, {
      routes: 3,
      prefix: 4,
      restoreScrollState: 5
    });
  }
}
var mdiGithub = "M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z";
var mdiMagnify = "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";
var mdiMenu = "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";
var mdiNotePlusOutline = "M5 19V5H12V12H19V13C19.7 13 20.37 13.13 21 13.35V9L15 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H13.35C13.13 20.37 13 19.7 13 19H5M14 4.5L19.5 10H14V4.5M23 18V20H20V23H18V20H15V18H18V15H20V18H23Z";
var StatusCodes;
(function(StatusCodes2) {
  StatusCodes2[StatusCodes2["ACCEPTED"] = 202] = "ACCEPTED";
  StatusCodes2[StatusCodes2["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
  StatusCodes2[StatusCodes2["BAD_REQUEST"] = 400] = "BAD_REQUEST";
  StatusCodes2[StatusCodes2["CONFLICT"] = 409] = "CONFLICT";
  StatusCodes2[StatusCodes2["CONTINUE"] = 100] = "CONTINUE";
  StatusCodes2[StatusCodes2["CREATED"] = 201] = "CREATED";
  StatusCodes2[StatusCodes2["EXPECTATION_FAILED"] = 417] = "EXPECTATION_FAILED";
  StatusCodes2[StatusCodes2["FAILED_DEPENDENCY"] = 424] = "FAILED_DEPENDENCY";
  StatusCodes2[StatusCodes2["FORBIDDEN"] = 403] = "FORBIDDEN";
  StatusCodes2[StatusCodes2["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
  StatusCodes2[StatusCodes2["GONE"] = 410] = "GONE";
  StatusCodes2[StatusCodes2["HTTP_VERSION_NOT_SUPPORTED"] = 505] = "HTTP_VERSION_NOT_SUPPORTED";
  StatusCodes2[StatusCodes2["IM_A_TEAPOT"] = 418] = "IM_A_TEAPOT";
  StatusCodes2[StatusCodes2["INSUFFICIENT_SPACE_ON_RESOURCE"] = 419] = "INSUFFICIENT_SPACE_ON_RESOURCE";
  StatusCodes2[StatusCodes2["INSUFFICIENT_STORAGE"] = 507] = "INSUFFICIENT_STORAGE";
  StatusCodes2[StatusCodes2["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
  StatusCodes2[StatusCodes2["LENGTH_REQUIRED"] = 411] = "LENGTH_REQUIRED";
  StatusCodes2[StatusCodes2["LOCKED"] = 423] = "LOCKED";
  StatusCodes2[StatusCodes2["METHOD_FAILURE"] = 420] = "METHOD_FAILURE";
  StatusCodes2[StatusCodes2["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
  StatusCodes2[StatusCodes2["MOVED_PERMANENTLY"] = 301] = "MOVED_PERMANENTLY";
  StatusCodes2[StatusCodes2["MOVED_TEMPORARILY"] = 302] = "MOVED_TEMPORARILY";
  StatusCodes2[StatusCodes2["MULTI_STATUS"] = 207] = "MULTI_STATUS";
  StatusCodes2[StatusCodes2["MULTIPLE_CHOICES"] = 300] = "MULTIPLE_CHOICES";
  StatusCodes2[StatusCodes2["NETWORK_AUTHENTICATION_REQUIRED"] = 511] = "NETWORK_AUTHENTICATION_REQUIRED";
  StatusCodes2[StatusCodes2["NO_CONTENT"] = 204] = "NO_CONTENT";
  StatusCodes2[StatusCodes2["NON_AUTHORITATIVE_INFORMATION"] = 203] = "NON_AUTHORITATIVE_INFORMATION";
  StatusCodes2[StatusCodes2["NOT_ACCEPTABLE"] = 406] = "NOT_ACCEPTABLE";
  StatusCodes2[StatusCodes2["NOT_FOUND"] = 404] = "NOT_FOUND";
  StatusCodes2[StatusCodes2["NOT_IMPLEMENTED"] = 501] = "NOT_IMPLEMENTED";
  StatusCodes2[StatusCodes2["NOT_MODIFIED"] = 304] = "NOT_MODIFIED";
  StatusCodes2[StatusCodes2["OK"] = 200] = "OK";
  StatusCodes2[StatusCodes2["PARTIAL_CONTENT"] = 206] = "PARTIAL_CONTENT";
  StatusCodes2[StatusCodes2["PAYMENT_REQUIRED"] = 402] = "PAYMENT_REQUIRED";
  StatusCodes2[StatusCodes2["PERMANENT_REDIRECT"] = 308] = "PERMANENT_REDIRECT";
  StatusCodes2[StatusCodes2["PRECONDITION_FAILED"] = 412] = "PRECONDITION_FAILED";
  StatusCodes2[StatusCodes2["PRECONDITION_REQUIRED"] = 428] = "PRECONDITION_REQUIRED";
  StatusCodes2[StatusCodes2["PROCESSING"] = 102] = "PROCESSING";
  StatusCodes2[StatusCodes2["PROXY_AUTHENTICATION_REQUIRED"] = 407] = "PROXY_AUTHENTICATION_REQUIRED";
  StatusCodes2[StatusCodes2["REQUEST_HEADER_FIELDS_TOO_LARGE"] = 431] = "REQUEST_HEADER_FIELDS_TOO_LARGE";
  StatusCodes2[StatusCodes2["REQUEST_TIMEOUT"] = 408] = "REQUEST_TIMEOUT";
  StatusCodes2[StatusCodes2["REQUEST_TOO_LONG"] = 413] = "REQUEST_TOO_LONG";
  StatusCodes2[StatusCodes2["REQUEST_URI_TOO_LONG"] = 414] = "REQUEST_URI_TOO_LONG";
  StatusCodes2[StatusCodes2["REQUESTED_RANGE_NOT_SATISFIABLE"] = 416] = "REQUESTED_RANGE_NOT_SATISFIABLE";
  StatusCodes2[StatusCodes2["RESET_CONTENT"] = 205] = "RESET_CONTENT";
  StatusCodes2[StatusCodes2["SEE_OTHER"] = 303] = "SEE_OTHER";
  StatusCodes2[StatusCodes2["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
  StatusCodes2[StatusCodes2["SWITCHING_PROTOCOLS"] = 101] = "SWITCHING_PROTOCOLS";
  StatusCodes2[StatusCodes2["TEMPORARY_REDIRECT"] = 307] = "TEMPORARY_REDIRECT";
  StatusCodes2[StatusCodes2["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
  StatusCodes2[StatusCodes2["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
  StatusCodes2[StatusCodes2["UNAVAILABLE_FOR_LEGAL_REASONS"] = 451] = "UNAVAILABLE_FOR_LEGAL_REASONS";
  StatusCodes2[StatusCodes2["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
  StatusCodes2[StatusCodes2["UNSUPPORTED_MEDIA_TYPE"] = 415] = "UNSUPPORTED_MEDIA_TYPE";
  StatusCodes2[StatusCodes2["USE_PROXY"] = 305] = "USE_PROXY";
  StatusCodes2[StatusCodes2["MISDIRECTED_REQUEST"] = 421] = "MISDIRECTED_REQUEST";
})(StatusCodes || (StatusCodes = {}));
function getDefaults() {
  return {
    baseUrl: null,
    breaks: false,
    extensions: null,
    gfm: true,
    headerIds: true,
    headerPrefix: "",
    highlight: null,
    langPrefix: "language-",
    mangle: true,
    pedantic: false,
    renderer: null,
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    tokenizer: null,
    walkTokens: null,
    xhtml: false
  };
}
let defaults = getDefaults();
function changeDefaults(newDefaults) {
  defaults = newDefaults;
}
const escapeTest = /[&<>"']/;
const escapeReplace = /[&<>"']/g;
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
const escapeReplacements = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
const getEscapeReplacement = (ch) => escapeReplacements[ch];
function escape(html, encode) {
  if (encode) {
    if (escapeTest.test(html)) {
      return html.replace(escapeReplace, getEscapeReplacement);
    }
  } else {
    if (escapeTestNoEncode.test(html)) {
      return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
  }
  return html;
}
const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function unescape(html) {
  return html.replace(unescapeTest, (_, n) => {
    n = n.toLowerCase();
    if (n === "colon")
      return ":";
    if (n.charAt(0) === "#") {
      return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
    }
    return "";
  });
}
const caret = /(^|[^\[])\^/g;
function edit(regex, opt) {
  regex = regex.source || regex;
  opt = opt || "";
  const obj = {
    replace: (name, val) => {
      val = val.source || val;
      val = val.replace(caret, "$1");
      regex = regex.replace(name, val);
      return obj;
    },
    getRegex: () => {
      return new RegExp(regex, opt);
    }
  };
  return obj;
}
const nonWordAndColonTest = /[^\w:]/g;
const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
function cleanUrl(sanitize, base, href) {
  if (sanitize) {
    let prot;
    try {
      prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, "").toLowerCase();
    } catch (e) {
      return null;
    }
    if (prot.indexOf("javascript:") === 0 || prot.indexOf("vbscript:") === 0 || prot.indexOf("data:") === 0) {
      return null;
    }
  }
  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href);
  }
  try {
    href = encodeURI(href).replace(/%25/g, "%");
  } catch (e) {
    return null;
  }
  return href;
}
const baseUrls = {};
const justDomain = /^[^:]+:\/*[^/]*$/;
const protocol = /^([^:]+:)[\s\S]*$/;
const domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;
function resolveUrl(base, href) {
  if (!baseUrls[" " + base]) {
    if (justDomain.test(base)) {
      baseUrls[" " + base] = base + "/";
    } else {
      baseUrls[" " + base] = rtrim(base, "/", true);
    }
  }
  base = baseUrls[" " + base];
  const relativeBase = base.indexOf(":") === -1;
  if (href.substring(0, 2) === "//") {
    if (relativeBase) {
      return href;
    }
    return base.replace(protocol, "$1") + href;
  } else if (href.charAt(0) === "/") {
    if (relativeBase) {
      return href;
    }
    return base.replace(domain, "$1") + href;
  } else {
    return base + href;
  }
}
const noopTest = { exec: function noopTest2() {
} };
function merge(obj) {
  let i = 1, target, key;
  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }
  return obj;
}
function splitCells(tableRow, count) {
  const row = tableRow.replace(/\|/g, (match, offset, str) => {
    let escaped = false, curr = offset;
    while (--curr >= 0 && str[curr] === "\\")
      escaped = !escaped;
    if (escaped) {
      return "|";
    } else {
      return " |";
    }
  }), cells = row.split(/ \|/);
  let i = 0;
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (!cells[cells.length - 1].trim()) {
    cells.pop();
  }
  if (cells.length > count) {
    cells.splice(count);
  } else {
    while (cells.length < count)
      cells.push("");
  }
  for (; i < cells.length; i++) {
    cells[i] = cells[i].trim().replace(/\\\|/g, "|");
  }
  return cells;
}
function rtrim(str, c, invert) {
  const l = str.length;
  if (l === 0) {
    return "";
  }
  let suffLen = 0;
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }
  return str.substr(0, l - suffLen);
}
function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  const l = str.length;
  let level = 0, i = 0;
  for (; i < l; i++) {
    if (str[i] === "\\") {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  return -1;
}
function checkSanitizeDeprecation(opt) {
  if (opt && opt.sanitize && !opt.silent) {
    console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
  }
}
function repeatString(pattern, count) {
  if (count < 1) {
    return "";
  }
  let result = "";
  while (count > 1) {
    if (count & 1) {
      result += pattern;
    }
    count >>= 1;
    pattern += pattern;
  }
  return result + pattern;
}
function outputLink(cap, link, raw, lexer) {
  const href = link.href;
  const title = link.title ? escape(link.title) : null;
  const text2 = cap[1].replace(/\\([\[\]])/g, "$1");
  if (cap[0].charAt(0) !== "!") {
    lexer.state.inLink = true;
    const token = {
      type: "link",
      raw,
      href,
      title,
      text: text2,
      tokens: lexer.inlineTokens(text2, [])
    };
    lexer.state.inLink = false;
    return token;
  } else {
    return {
      type: "image",
      raw,
      href,
      title,
      text: escape(text2)
    };
  }
}
function indentCodeCompensation(raw, text2) {
  const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
  if (matchIndentToCode === null) {
    return text2;
  }
  const indentToCode = matchIndentToCode[1];
  return text2.split("\n").map((node) => {
    const matchIndentInNode = node.match(/^\s+/);
    if (matchIndentInNode === null) {
      return node;
    }
    const [indentInNode] = matchIndentInNode;
    if (indentInNode.length >= indentToCode.length) {
      return node.slice(indentToCode.length);
    }
    return node;
  }).join("\n");
}
class Tokenizer {
  constructor(options) {
    this.options = options || defaults;
  }
  space(src) {
    const cap = this.rules.block.newline.exec(src);
    if (cap && cap[0].length > 0) {
      return {
        type: "space",
        raw: cap[0]
      };
    }
  }
  code(src) {
    const cap = this.rules.block.code.exec(src);
    if (cap) {
      const text2 = cap[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: cap[0],
        codeBlockStyle: "indented",
        text: !this.options.pedantic ? rtrim(text2, "\n") : text2
      };
    }
  }
  fences(src) {
    const cap = this.rules.block.fences.exec(src);
    if (cap) {
      const raw = cap[0];
      const text2 = indentCodeCompensation(raw, cap[3] || "");
      return {
        type: "code",
        raw,
        lang: cap[2] ? cap[2].trim() : cap[2],
        text: text2
      };
    }
  }
  heading(src) {
    const cap = this.rules.block.heading.exec(src);
    if (cap) {
      let text2 = cap[2].trim();
      if (/#$/.test(text2)) {
        const trimmed = rtrim(text2, "#");
        if (this.options.pedantic) {
          text2 = trimmed.trim();
        } else if (!trimmed || / $/.test(trimmed)) {
          text2 = trimmed.trim();
        }
      }
      const token = {
        type: "heading",
        raw: cap[0],
        depth: cap[1].length,
        text: text2,
        tokens: []
      };
      this.lexer.inline(token.text, token.tokens);
      return token;
    }
  }
  hr(src) {
    const cap = this.rules.block.hr.exec(src);
    if (cap) {
      return {
        type: "hr",
        raw: cap[0]
      };
    }
  }
  blockquote(src) {
    const cap = this.rules.block.blockquote.exec(src);
    if (cap) {
      const text2 = cap[0].replace(/^ *> ?/gm, "");
      return {
        type: "blockquote",
        raw: cap[0],
        tokens: this.lexer.blockTokens(text2, []),
        text: text2
      };
    }
  }
  list(src) {
    let cap = this.rules.block.list.exec(src);
    if (cap) {
      let raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine, line, nextLine, rawLine, itemContents, endEarly;
      let bull = cap[1].trim();
      const isordered = bull.length > 1;
      const list = {
        type: "list",
        raw: "",
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : "",
        loose: false,
        items: []
      };
      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
      if (this.options.pedantic) {
        bull = isordered ? bull : "[*+-]";
      }
      const itemRegex = new RegExp(`^( {0,3}${bull})((?: [^\\n]*)?(?:\\n|$))`);
      while (src) {
        endEarly = false;
        if (!(cap = itemRegex.exec(src))) {
          break;
        }
        if (this.rules.block.hr.test(src)) {
          break;
        }
        raw = cap[0];
        src = src.substring(raw.length);
        line = cap[2].split("\n", 1)[0];
        nextLine = src.split("\n", 1)[0];
        if (this.options.pedantic) {
          indent = 2;
          itemContents = line.trimLeft();
        } else {
          indent = cap[2].search(/[^ ]/);
          indent = indent > 4 ? 1 : indent;
          itemContents = line.slice(indent);
          indent += cap[1].length;
        }
        blankLine = false;
        if (!line && /^ *$/.test(nextLine)) {
          raw += nextLine + "\n";
          src = src.substring(nextLine.length + 1);
          endEarly = true;
        }
        if (!endEarly) {
          const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])`);
          while (src) {
            rawLine = src.split("\n", 1)[0];
            line = rawLine;
            if (this.options.pedantic) {
              line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ");
            }
            if (nextBulletRegex.test(line)) {
              break;
            }
            if (line.search(/[^ ]/) >= indent || !line.trim()) {
              itemContents += "\n" + line.slice(indent);
            } else if (!blankLine) {
              itemContents += "\n" + line;
            } else {
              break;
            }
            if (!blankLine && !line.trim()) {
              blankLine = true;
            }
            raw += rawLine + "\n";
            src = src.substring(rawLine.length + 1);
          }
        }
        if (!list.loose) {
          if (endsWithBlankLine) {
            list.loose = true;
          } else if (/\n *\n *$/.test(raw)) {
            endsWithBlankLine = true;
          }
        }
        if (this.options.gfm) {
          istask = /^\[[ xX]\] /.exec(itemContents);
          if (istask) {
            ischecked = istask[0] !== "[ ] ";
            itemContents = itemContents.replace(/^\[[ xX]\] +/, "");
          }
        }
        list.items.push({
          type: "list_item",
          raw,
          task: !!istask,
          checked: ischecked,
          loose: false,
          text: itemContents
        });
        list.raw += raw;
      }
      list.items[list.items.length - 1].raw = raw.trimRight();
      list.items[list.items.length - 1].text = itemContents.trimRight();
      list.raw = list.raw.trimRight();
      const l = list.items.length;
      for (i = 0; i < l; i++) {
        this.lexer.state.top = false;
        list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
        const spacers = list.items[i].tokens.filter((t) => t.type === "space");
        const hasMultipleLineBreaks = spacers.every((t) => {
          const chars = t.raw.split("");
          let lineBreaks = 0;
          for (const char of chars) {
            if (char === "\n") {
              lineBreaks += 1;
            }
            if (lineBreaks > 1) {
              return true;
            }
          }
          return false;
        });
        if (!list.loose && spacers.length && hasMultipleLineBreaks) {
          list.loose = true;
          list.items[i].loose = true;
        }
      }
      return list;
    }
  }
  html(src) {
    const cap = this.rules.block.html.exec(src);
    if (cap) {
      const token = {
        type: "html",
        raw: cap[0],
        pre: !this.options.sanitizer && (cap[1] === "pre" || cap[1] === "script" || cap[1] === "style"),
        text: cap[0]
      };
      if (this.options.sanitize) {
        token.type = "paragraph";
        token.text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]);
        token.tokens = [];
        this.lexer.inline(token.text, token.tokens);
      }
      return token;
    }
  }
  def(src) {
    const cap = this.rules.block.def.exec(src);
    if (cap) {
      if (cap[3])
        cap[3] = cap[3].substring(1, cap[3].length - 1);
      const tag = cap[1].toLowerCase().replace(/\s+/g, " ");
      return {
        type: "def",
        tag,
        raw: cap[0],
        href: cap[2],
        title: cap[3]
      };
    }
  }
  table(src) {
    const cap = this.rules.block.table.exec(src);
    if (cap) {
      const item = {
        type: "table",
        header: splitCells(cap[1]).map((c) => {
          return { text: c };
        }),
        align: cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
        rows: cap[3] ? cap[3].replace(/\n[ \t]*$/, "").split("\n") : []
      };
      if (item.header.length === item.align.length) {
        item.raw = cap[0];
        let l = item.align.length;
        let i, j, k, row;
        for (i = 0; i < l; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = "right";
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = "center";
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = "left";
          } else {
            item.align[i] = null;
          }
        }
        l = item.rows.length;
        for (i = 0; i < l; i++) {
          item.rows[i] = splitCells(item.rows[i], item.header.length).map((c) => {
            return { text: c };
          });
        }
        l = item.header.length;
        for (j = 0; j < l; j++) {
          item.header[j].tokens = [];
          this.lexer.inlineTokens(item.header[j].text, item.header[j].tokens);
        }
        l = item.rows.length;
        for (j = 0; j < l; j++) {
          row = item.rows[j];
          for (k = 0; k < row.length; k++) {
            row[k].tokens = [];
            this.lexer.inlineTokens(row[k].text, row[k].tokens);
          }
        }
        return item;
      }
    }
  }
  lheading(src) {
    const cap = this.rules.block.lheading.exec(src);
    if (cap) {
      const token = {
        type: "heading",
        raw: cap[0],
        depth: cap[2].charAt(0) === "=" ? 1 : 2,
        text: cap[1],
        tokens: []
      };
      this.lexer.inline(token.text, token.tokens);
      return token;
    }
  }
  paragraph(src) {
    const cap = this.rules.block.paragraph.exec(src);
    if (cap) {
      const token = {
        type: "paragraph",
        raw: cap[0],
        text: cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1],
        tokens: []
      };
      this.lexer.inline(token.text, token.tokens);
      return token;
    }
  }
  text(src) {
    const cap = this.rules.block.text.exec(src);
    if (cap) {
      const token = {
        type: "text",
        raw: cap[0],
        text: cap[0],
        tokens: []
      };
      this.lexer.inline(token.text, token.tokens);
      return token;
    }
  }
  escape(src) {
    const cap = this.rules.inline.escape.exec(src);
    if (cap) {
      return {
        type: "escape",
        raw: cap[0],
        text: escape(cap[1])
      };
    }
  }
  tag(src) {
    const cap = this.rules.inline.tag.exec(src);
    if (cap) {
      if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
        this.lexer.state.inLink = true;
      } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
        this.lexer.state.inLink = false;
      }
      if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.lexer.state.inRawBlock = true;
      } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.lexer.state.inRawBlock = false;
      }
      return {
        type: this.options.sanitize ? "text" : "html",
        raw: cap[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0]
      };
    }
  }
  link(src) {
    const cap = this.rules.inline.link.exec(src);
    if (cap) {
      const trimmedUrl = cap[2].trim();
      if (!this.options.pedantic && /^</.test(trimmedUrl)) {
        if (!/>$/.test(trimmedUrl)) {
          return;
        }
        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        const lastParenIndex = findClosingBracket(cap[2], "()");
        if (lastParenIndex > -1) {
          const start2 = cap[0].indexOf("!") === 0 ? 5 : 4;
          const linkLen = start2 + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = "";
        }
      }
      let href = cap[2];
      let title = "";
      if (this.options.pedantic) {
        const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
        if (link) {
          href = link[1];
          title = link[3];
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : "";
      }
      href = href.trim();
      if (/^</.test(href)) {
        if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
          href = href.slice(1);
        } else {
          href = href.slice(1, -1);
        }
      }
      return outputLink(cap, {
        href: href ? href.replace(this.rules.inline._escapes, "$1") : href,
        title: title ? title.replace(this.rules.inline._escapes, "$1") : title
      }, cap[0], this.lexer);
    }
  }
  reflink(src, links) {
    let cap;
    if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
      let link = (cap[2] || cap[1]).replace(/\s+/g, " ");
      link = links[link.toLowerCase()];
      if (!link || !link.href) {
        const text2 = cap[0].charAt(0);
        return {
          type: "text",
          raw: text2,
          text: text2
        };
      }
      return outputLink(cap, link, cap[0], this.lexer);
    }
  }
  emStrong(src, maskedSrc, prevChar = "") {
    let match = this.rules.inline.emStrong.lDelim.exec(src);
    if (!match)
      return;
    if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
      return;
    const nextChar = match[1] || match[2] || "";
    if (!nextChar || nextChar && (prevChar === "" || this.rules.inline.punctuation.exec(prevChar))) {
      const lLength = match[0].length - 1;
      let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
      const endReg = match[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
      endReg.lastIndex = 0;
      maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
      while ((match = endReg.exec(maskedSrc)) != null) {
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim)
          continue;
        rLength = rDelim.length;
        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        } else if (match[5] || match[6]) {
          if (lLength % 3 && !((lLength + rLength) % 3)) {
            midDelimTotal += rLength;
            continue;
          }
        }
        delimTotal -= rLength;
        if (delimTotal > 0)
          continue;
        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
        if (Math.min(lLength, rLength) % 2) {
          const text3 = src.slice(1, lLength + match.index + rLength);
          return {
            type: "em",
            raw: src.slice(0, lLength + match.index + rLength + 1),
            text: text3,
            tokens: this.lexer.inlineTokens(text3, [])
          };
        }
        const text2 = src.slice(2, lLength + match.index + rLength - 1);
        return {
          type: "strong",
          raw: src.slice(0, lLength + match.index + rLength + 1),
          text: text2,
          tokens: this.lexer.inlineTokens(text2, [])
        };
      }
    }
  }
  codespan(src) {
    const cap = this.rules.inline.code.exec(src);
    if (cap) {
      let text2 = cap[2].replace(/\n/g, " ");
      const hasNonSpaceChars = /[^ ]/.test(text2);
      const hasSpaceCharsOnBothEnds = /^ /.test(text2) && / $/.test(text2);
      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text2 = text2.substring(1, text2.length - 1);
      }
      text2 = escape(text2, true);
      return {
        type: "codespan",
        raw: cap[0],
        text: text2
      };
    }
  }
  br(src) {
    const cap = this.rules.inline.br.exec(src);
    if (cap) {
      return {
        type: "br",
        raw: cap[0]
      };
    }
  }
  del(src) {
    const cap = this.rules.inline.del.exec(src);
    if (cap) {
      return {
        type: "del",
        raw: cap[0],
        text: cap[2],
        tokens: this.lexer.inlineTokens(cap[2], [])
      };
    }
  }
  autolink(src, mangle2) {
    const cap = this.rules.inline.autolink.exec(src);
    if (cap) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = escape(this.options.mangle ? mangle2(cap[1]) : cap[1]);
        href = "mailto:" + text2;
      } else {
        text2 = escape(cap[1]);
        href = text2;
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2
          }
        ]
      };
    }
  }
  url(src, mangle2) {
    let cap;
    if (cap = this.rules.inline.url.exec(src)) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = escape(this.options.mangle ? mangle2(cap[0]) : cap[0]);
        href = "mailto:" + text2;
      } else {
        let prevCapZero;
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
        } while (prevCapZero !== cap[0]);
        text2 = escape(cap[0]);
        if (cap[1] === "www.") {
          href = "http://" + text2;
        } else {
          href = text2;
        }
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2
          }
        ]
      };
    }
  }
  inlineText(src, smartypants2) {
    const cap = this.rules.inline.text.exec(src);
    if (cap) {
      let text2;
      if (this.lexer.state.inRawBlock) {
        text2 = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0];
      } else {
        text2 = escape(this.options.smartypants ? smartypants2(cap[0]) : cap[0]);
      }
      return {
        type: "text",
        raw: cap[0],
        text: text2
      };
    }
  }
}
const block = {
  newline: /^(?: *(?:\n|$))+/,
  code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
  fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3}bull)( [^\n]+?)?(?:\n|$)/,
  html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  table: noopTest,
  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  text: /^[^\n]+/
};
block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
block.def = edit(block.def).replace("label", block._label).replace("title", block._title).getRegex();
block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
block.listItemStart = edit(/^( *)(bull) */).replace("bull", block.bullet).getRegex();
block.list = edit(block.list).replace(/bull/g, block.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + block.def.source + ")").getRegex();
block._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
block.html = edit(block.html, "i").replace("comment", block._comment).replace("tag", block._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
block.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
block.blockquote = edit(block.blockquote).replace("paragraph", block.paragraph).getRegex();
block.normal = merge({}, block);
block.gfm = merge({}, block.normal, {
  table: "^ *([^\\n ].*\\|.*)\\n {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
});
block.gfm.table = edit(block.gfm.table).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
block.gfm.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("table", block.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
block.pedantic = merge({}, block.normal, {
  html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", block._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: noopTest,
  paragraph: edit(block.normal._paragraph).replace("hr", block.hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", block.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
});
const inline = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: noopTest,
  tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  reflinkSearch: "reflink|nolink(?!\\()",
  emStrong: {
    lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
    rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
    rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
  },
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: noopTest,
  text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  punctuation: /^([\spunctuation])/
};
inline._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();
inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
inline.escapedEmSt = /\\\*|\\_/g;
inline._comment = edit(block._comment).replace("(?:-->|$)", "-->").getRegex();
inline.emStrong.lDelim = edit(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, "g").replace(/punct/g, inline._punctuation).getRegex();
inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, "g").replace(/punct/g, inline._punctuation).getRegex();
inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
inline.autolink = edit(inline.autolink).replace("scheme", inline._scheme).replace("email", inline._email).getRegex();
inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
inline.tag = edit(inline.tag).replace("comment", inline._comment).replace("attribute", inline._attribute).getRegex();
inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
inline.link = edit(inline.link).replace("label", inline._label).replace("href", inline._href).replace("title", inline._title).getRegex();
inline.reflink = edit(inline.reflink).replace("label", inline._label).getRegex();
inline.reflinkSearch = edit(inline.reflinkSearch, "g").replace("reflink", inline.reflink).replace("nolink", inline.nolink).getRegex();
inline.normal = merge({}, inline);
inline.pedantic = merge({}, inline.normal, {
  strong: {
    start: /^__|\*\*/,
    middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    endAst: /\*\*(?!\*)/g,
    endUnd: /__(?!_)/g
  },
  em: {
    start: /^_|\*/,
    middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
    endAst: /\*(?!\*)/g,
    endUnd: /_(?!_)/g
  },
  link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", inline._label).getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", inline._label).getRegex()
});
inline.gfm = merge({}, inline.normal, {
  escape: edit(inline.escape).replace("])", "~|])").getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
});
inline.gfm.url = edit(inline.gfm.url, "i").replace("email", inline.gfm._extended_email).getRegex();
inline.breaks = merge({}, inline.gfm, {
  br: edit(inline.br).replace("{2,}", "*").getRegex(),
  text: edit(inline.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
function smartypants(text2) {
  return text2.replace(/---/g, "\u2014").replace(/--/g, "\u2013").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018").replace(/'/g, "\u2019").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C").replace(/"/g, "\u201D").replace(/\.{3}/g, "\u2026");
}
function mangle(text2) {
  let out = "", i, ch;
  const l = text2.length;
  for (i = 0; i < l; i++) {
    ch = text2.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = "x" + ch.toString(16);
    }
    out += "&#" + ch + ";";
  }
  return out;
}
class Lexer {
  constructor(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || defaults;
    this.options.tokenizer = this.options.tokenizer || new Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      top: true
    };
    const rules = {
      block: block.normal,
      inline: inline.normal
    };
    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;
  }
  static get rules() {
    return {
      block,
      inline
    };
  }
  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
  }
  static lexInline(src, options) {
    const lexer = new Lexer(options);
    return lexer.inlineTokens(src);
  }
  lex(src) {
    src = src.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
    this.blockTokens(src, this.tokens);
    let next;
    while (next = this.inlineQueue.shift()) {
      this.inlineTokens(next.src, next.tokens);
    }
    return this.tokens;
  }
  blockTokens(src, tokens = []) {
    if (this.options.pedantic) {
      src = src.replace(/^ +$/gm, "");
    }
    let token, lastToken, cutSrc, lastParagraphClipped;
    while (src) {
      if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.space(src)) {
        src = src.substring(token.raw.length);
        if (token.raw.length === 1 && tokens.length > 0) {
          tokens[tokens.length - 1].raw += "\n";
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.code(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.fences(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.heading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.hr(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.blockquote(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.list(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.html(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.def(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.raw;
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title
          };
        }
        continue;
      }
      if (token = this.tokenizer.table(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.lheading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      cutSrc = src;
      if (this.options.extensions && this.options.extensions.startBlock) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startBlock.forEach(function(getStartIndex) {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
        lastToken = tokens[tokens.length - 1];
        if (lastParagraphClipped && lastToken.type === "paragraph") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        lastParagraphClipped = cutSrc.length !== src.length;
        src = src.substring(token.raw.length);
        continue;
      }
      if (token = this.tokenizer.text(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    this.state.top = true;
    return tokens;
  }
  inline(src, tokens) {
    this.inlineQueue.push({ src, tokens });
  }
  inlineTokens(src, tokens = []) {
    let token, lastToken, cutSrc;
    let maskedSrc = src;
    let match;
    let keepPrevChar, prevChar;
    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);
      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
            maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    }
    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }
    while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
    }
    while (src) {
      if (!keepPrevChar) {
        prevChar = "";
      }
      keepPrevChar = false;
      if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.escape(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.tag(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && token.type === "text" && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.link(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && token.type === "text" && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.codespan(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.br(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.del(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.autolink(src, mangle)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (!this.state.inLink && (token = this.tokenizer.url(src, mangle))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      cutSrc = src;
      if (this.options.extensions && this.options.extensions.startInline) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startInline.forEach(function(getStartIndex) {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (token = this.tokenizer.inlineText(cutSrc, smartypants)) {
        src = src.substring(token.raw.length);
        if (token.raw.slice(-1) !== "_") {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    return tokens;
  }
}
class Renderer {
  constructor(options) {
    this.options = options || defaults;
  }
  code(code, infostring, escaped) {
    const lang = (infostring || "").match(/\S*/)[0];
    if (this.options.highlight) {
      const out = this.options.highlight(code, lang);
      if (out != null && out !== code) {
        escaped = true;
        code = out;
      }
    }
    code = code.replace(/\n$/, "") + "\n";
    if (!lang) {
      return "<pre><code>" + (escaped ? code : escape(code, true)) + "</code></pre>\n";
    }
    return '<pre><code class="' + this.options.langPrefix + escape(lang, true) + '">' + (escaped ? code : escape(code, true)) + "</code></pre>\n";
  }
  blockquote(quote) {
    return "<blockquote>\n" + quote + "</blockquote>\n";
  }
  html(html) {
    return html;
  }
  heading(text2, level, raw, slugger) {
    if (this.options.headerIds) {
      return "<h" + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text2 + "</h" + level + ">\n";
    }
    return "<h" + level + ">" + text2 + "</h" + level + ">\n";
  }
  hr() {
    return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
  }
  list(body, ordered, start2) {
    const type = ordered ? "ol" : "ul", startatt = ordered && start2 !== 1 ? ' start="' + start2 + '"' : "";
    return "<" + type + startatt + ">\n" + body + "</" + type + ">\n";
  }
  listitem(text2) {
    return "<li>" + text2 + "</li>\n";
  }
  checkbox(checked) {
    return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
  }
  paragraph(text2) {
    return "<p>" + text2 + "</p>\n";
  }
  table(header, body) {
    if (body)
      body = "<tbody>" + body + "</tbody>";
    return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
  }
  tablerow(content) {
    return "<tr>\n" + content + "</tr>\n";
  }
  tablecell(content, flags) {
    const type = flags.header ? "th" : "td";
    const tag = flags.align ? "<" + type + ' align="' + flags.align + '">' : "<" + type + ">";
    return tag + content + "</" + type + ">\n";
  }
  strong(text2) {
    return "<strong>" + text2 + "</strong>";
  }
  em(text2) {
    return "<em>" + text2 + "</em>";
  }
  codespan(text2) {
    return "<code>" + text2 + "</code>";
  }
  br() {
    return this.options.xhtml ? "<br/>" : "<br>";
  }
  del(text2) {
    return "<del>" + text2 + "</del>";
  }
  link(href, title, text2) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
    if (href === null) {
      return text2;
    }
    let out = '<a href="' + escape(href) + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += ">" + text2 + "</a>";
    return out;
  }
  image(href, title, text2) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
    if (href === null) {
      return text2;
    }
    let out = '<img src="' + href + '" alt="' + text2 + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += this.options.xhtml ? "/>" : ">";
    return out;
  }
  text(text2) {
    return text2;
  }
}
class TextRenderer {
  strong(text2) {
    return text2;
  }
  em(text2) {
    return text2;
  }
  codespan(text2) {
    return text2;
  }
  del(text2) {
    return text2;
  }
  html(text2) {
    return text2;
  }
  text(text2) {
    return text2;
  }
  link(href, title, text2) {
    return "" + text2;
  }
  image(href, title, text2) {
    return "" + text2;
  }
  br() {
    return "";
  }
}
class Slugger {
  constructor() {
    this.seen = {};
  }
  serialize(value) {
    return value.toLowerCase().trim().replace(/<[!\/a-z].*?>/ig, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
  }
  getNextSafeSlug(originalSlug, isDryRun) {
    let slug = originalSlug;
    let occurenceAccumulator = 0;
    if (this.seen.hasOwnProperty(slug)) {
      occurenceAccumulator = this.seen[originalSlug];
      do {
        occurenceAccumulator++;
        slug = originalSlug + "-" + occurenceAccumulator;
      } while (this.seen.hasOwnProperty(slug));
    }
    if (!isDryRun) {
      this.seen[originalSlug] = occurenceAccumulator;
      this.seen[slug] = 0;
    }
    return slug;
  }
  slug(value, options = {}) {
    const slug = this.serialize(value);
    return this.getNextSafeSlug(slug, options.dryrun);
  }
}
class Parser {
  constructor(options) {
    this.options = options || defaults;
    this.options.renderer = this.options.renderer || new Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.textRenderer = new TextRenderer();
    this.slugger = new Slugger();
  }
  static parse(tokens, options) {
    const parser = new Parser(options);
    return parser.parse(tokens);
  }
  static parseInline(tokens, options) {
    const parser = new Parser(options);
    return parser.parseInline(tokens);
  }
  parse(tokens, top = true) {
    let out = "", i, j, k, l2, l3, row, cell, header, body, token, ordered, start2, loose, itemBody, item, checked, task, checkbox, ret;
    const l = tokens.length;
    for (i = 0; i < l; i++) {
      token = tokens[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
        if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(token.type)) {
          out += ret || "";
          continue;
        }
      }
      switch (token.type) {
        case "space": {
          continue;
        }
        case "hr": {
          out += this.renderer.hr();
          continue;
        }
        case "heading": {
          out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
          continue;
        }
        case "code": {
          out += this.renderer.code(token.text, token.lang, token.escaped);
          continue;
        }
        case "table": {
          header = "";
          cell = "";
          l2 = token.header.length;
          for (j = 0; j < l2; j++) {
            cell += this.renderer.tablecell(this.parseInline(token.header[j].tokens), { header: true, align: token.align[j] });
          }
          header += this.renderer.tablerow(cell);
          body = "";
          l2 = token.rows.length;
          for (j = 0; j < l2; j++) {
            row = token.rows[j];
            cell = "";
            l3 = row.length;
            for (k = 0; k < l3; k++) {
              cell += this.renderer.tablecell(this.parseInline(row[k].tokens), { header: false, align: token.align[k] });
            }
            body += this.renderer.tablerow(cell);
          }
          out += this.renderer.table(header, body);
          continue;
        }
        case "blockquote": {
          body = this.parse(token.tokens);
          out += this.renderer.blockquote(body);
          continue;
        }
        case "list": {
          ordered = token.ordered;
          start2 = token.start;
          loose = token.loose;
          l2 = token.items.length;
          body = "";
          for (j = 0; j < l2; j++) {
            item = token.items[j];
            checked = item.checked;
            task = item.task;
            itemBody = "";
            if (item.task) {
              checkbox = this.renderer.checkbox(checked);
              if (loose) {
                if (item.tokens.length > 0 && item.tokens[0].type === "paragraph") {
                  item.tokens[0].text = checkbox + " " + item.tokens[0].text;
                  if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
                    item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
                  }
                } else {
                  item.tokens.unshift({
                    type: "text",
                    text: checkbox
                  });
                }
              } else {
                itemBody += checkbox;
              }
            }
            itemBody += this.parse(item.tokens, loose);
            body += this.renderer.listitem(itemBody, task, checked);
          }
          out += this.renderer.list(body, ordered, start2);
          continue;
        }
        case "html": {
          out += this.renderer.html(token.text);
          continue;
        }
        case "paragraph": {
          out += this.renderer.paragraph(this.parseInline(token.tokens));
          continue;
        }
        case "text": {
          body = token.tokens ? this.parseInline(token.tokens) : token.text;
          while (i + 1 < l && tokens[i + 1].type === "text") {
            token = tokens[++i];
            body += "\n" + (token.tokens ? this.parseInline(token.tokens) : token.text);
          }
          out += top ? this.renderer.paragraph(body) : body;
          continue;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return;
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
  parseInline(tokens, renderer) {
    renderer = renderer || this.renderer;
    let out = "", i, token, ret;
    const l = tokens.length;
    for (i = 0; i < l; i++) {
      token = tokens[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
        if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(token.type)) {
          out += ret || "";
          continue;
        }
      }
      switch (token.type) {
        case "escape": {
          out += renderer.text(token.text);
          break;
        }
        case "html": {
          out += renderer.html(token.text);
          break;
        }
        case "link": {
          out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
          break;
        }
        case "image": {
          out += renderer.image(token.href, token.title, token.text);
          break;
        }
        case "strong": {
          out += renderer.strong(this.parseInline(token.tokens, renderer));
          break;
        }
        case "em": {
          out += renderer.em(this.parseInline(token.tokens, renderer));
          break;
        }
        case "codespan": {
          out += renderer.codespan(token.text);
          break;
        }
        case "br": {
          out += renderer.br();
          break;
        }
        case "del": {
          out += renderer.del(this.parseInline(token.tokens, renderer));
          break;
        }
        case "text": {
          out += renderer.text(token.text);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return;
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
}
function marked(src, opt, callback) {
  if (typeof src === "undefined" || src === null) {
    throw new Error("marked(): input parameter is undefined or null");
  }
  if (typeof src !== "string") {
    throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected");
  }
  if (typeof opt === "function") {
    callback = opt;
    opt = null;
  }
  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);
  if (callback) {
    const highlight = opt.highlight;
    let tokens;
    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }
    const done = function(err) {
      let out;
      if (!err) {
        try {
          if (opt.walkTokens) {
            marked.walkTokens(tokens, opt.walkTokens);
          }
          out = Parser.parse(tokens, opt);
        } catch (e) {
          err = e;
        }
      }
      opt.highlight = highlight;
      return err ? callback(err) : callback(null, out);
    };
    if (!highlight || highlight.length < 3) {
      return done();
    }
    delete opt.highlight;
    if (!tokens.length)
      return done();
    let pending = 0;
    marked.walkTokens(tokens, function(token) {
      if (token.type === "code") {
        pending++;
        setTimeout(() => {
          highlight(token.text, token.lang, function(err, code) {
            if (err) {
              return done(err);
            }
            if (code != null && code !== token.text) {
              token.text = code;
              token.escaped = true;
            }
            pending--;
            if (pending === 0) {
              done();
            }
          });
        }, 0);
      }
    });
    if (pending === 0) {
      done();
    }
    return;
  }
  try {
    const tokens = Lexer.lex(src, opt);
    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }
    return Parser.parse(tokens, opt);
  } catch (e) {
    e.message += "\nPlease report this to https://github.com/markedjs/marked.";
    if (opt.silent) {
      return "<p>An error occurred:</p><pre>" + escape(e.message + "", true) + "</pre>";
    }
    throw e;
  }
}
marked.options = marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  changeDefaults(marked.defaults);
  return marked;
};
marked.getDefaults = getDefaults;
marked.defaults = defaults;
marked.use = function(...args) {
  const opts = merge({}, ...args);
  const extensions = marked.defaults.extensions || { renderers: {}, childTokens: {} };
  let hasExtensions;
  args.forEach((pack) => {
    if (pack.extensions) {
      hasExtensions = true;
      pack.extensions.forEach((ext) => {
        if (!ext.name) {
          throw new Error("extension name required");
        }
        if (ext.renderer) {
          const prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;
          if (prevRenderer) {
            extensions.renderers[ext.name] = function(...args2) {
              let ret = ext.renderer.apply(this, args2);
              if (ret === false) {
                ret = prevRenderer.apply(this, args2);
              }
              return ret;
            };
          } else {
            extensions.renderers[ext.name] = ext.renderer;
          }
        }
        if (ext.tokenizer) {
          if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
            throw new Error("extension level must be 'block' or 'inline'");
          }
          if (extensions[ext.level]) {
            extensions[ext.level].unshift(ext.tokenizer);
          } else {
            extensions[ext.level] = [ext.tokenizer];
          }
          if (ext.start) {
            if (ext.level === "block") {
              if (extensions.startBlock) {
                extensions.startBlock.push(ext.start);
              } else {
                extensions.startBlock = [ext.start];
              }
            } else if (ext.level === "inline") {
              if (extensions.startInline) {
                extensions.startInline.push(ext.start);
              } else {
                extensions.startInline = [ext.start];
              }
            }
          }
        }
        if (ext.childTokens) {
          extensions.childTokens[ext.name] = ext.childTokens;
        }
      });
    }
    if (pack.renderer) {
      const renderer = marked.defaults.renderer || new Renderer();
      for (const prop in pack.renderer) {
        const prevRenderer = renderer[prop];
        renderer[prop] = (...args2) => {
          let ret = pack.renderer[prop].apply(renderer, args2);
          if (ret === false) {
            ret = prevRenderer.apply(renderer, args2);
          }
          return ret;
        };
      }
      opts.renderer = renderer;
    }
    if (pack.tokenizer) {
      const tokenizer = marked.defaults.tokenizer || new Tokenizer();
      for (const prop in pack.tokenizer) {
        const prevTokenizer = tokenizer[prop];
        tokenizer[prop] = (...args2) => {
          let ret = pack.tokenizer[prop].apply(tokenizer, args2);
          if (ret === false) {
            ret = prevTokenizer.apply(tokenizer, args2);
          }
          return ret;
        };
      }
      opts.tokenizer = tokenizer;
    }
    if (pack.walkTokens) {
      const walkTokens = marked.defaults.walkTokens;
      opts.walkTokens = function(token) {
        pack.walkTokens.call(this, token);
        if (walkTokens) {
          walkTokens.call(this, token);
        }
      };
    }
    if (hasExtensions) {
      opts.extensions = extensions;
    }
    marked.setOptions(opts);
  });
};
marked.walkTokens = function(tokens, callback) {
  for (const token of tokens) {
    callback.call(marked, token);
    switch (token.type) {
      case "table": {
        for (const cell of token.header) {
          marked.walkTokens(cell.tokens, callback);
        }
        for (const row of token.rows) {
          for (const cell of row) {
            marked.walkTokens(cell.tokens, callback);
          }
        }
        break;
      }
      case "list": {
        marked.walkTokens(token.items, callback);
        break;
      }
      default: {
        if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) {
          marked.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
            marked.walkTokens(token[childTokens], callback);
          });
        } else if (token.tokens) {
          marked.walkTokens(token.tokens, callback);
        }
      }
    }
  }
};
marked.parseInline = function(src, opt) {
  if (typeof src === "undefined" || src === null) {
    throw new Error("marked.parseInline(): input parameter is undefined or null");
  }
  if (typeof src !== "string") {
    throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected");
  }
  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);
  try {
    const tokens = Lexer.lexInline(src, opt);
    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }
    return Parser.parseInline(tokens, opt);
  } catch (e) {
    e.message += "\nPlease report this to https://github.com/markedjs/marked.";
    if (opt.silent) {
      return "<p>An error occurred:</p><pre>" + escape(e.message + "", true) + "</pre>";
    }
    throw e;
  }
};
marked.Parser = Parser;
marked.parser = Parser.parse;
marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;
marked.Lexer = Lexer;
marked.lexer = Lexer.lex;
marked.Tokenizer = Tokenizer;
marked.Slugger = Slugger;
marked.parse = marked;
Parser.parse;
Lexer.lex;
var Tags_svelte_svelte_type_style_lang = "";
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[39] = list[i];
  child_ctx[41] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i];
  child_ctx[43] = i;
  return child_ctx;
}
function create_if_block_1(ctx) {
  let each_1_anchor;
  let each_value_1 = ctx[0];
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 8265) {
        each_value_1 = ctx2[0];
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1(ctx2, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_1.length;
      }
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_else_block(ctx) {
  let t_value = ctx[10][ctx[3]] + "";
  let t;
  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 9 && t_value !== (t_value = ctx2[10][ctx2[3]] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_3(ctx) {
  let t_value = ctx[10] + "";
  let t;
  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 1 && t_value !== (t_value = ctx2[10] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_2(ctx) {
  let span;
  let mounted;
  let dispose;
  function click_handler() {
    return ctx[29](ctx[43]);
  }
  return {
    c() {
      span = element("span");
      span.textContent = "\xD7";
      attr(span, "class", "svelte-tags-input-tag-remove svelte-sm1rwb");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      if (!mounted) {
        dispose = listen(span, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching)
        detach(span);
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_1(ctx) {
  let span;
  let t0;
  let t1;
  function select_block_type(ctx2, dirty) {
    if (typeof ctx2[10] === "string")
      return create_if_block_3;
    return create_else_block;
  }
  let current_block_type = select_block_type(ctx);
  let if_block0 = current_block_type(ctx);
  let if_block1 = !ctx[6] && create_if_block_2(ctx);
  return {
    c() {
      span = element("span");
      if_block0.c();
      t0 = space();
      if (if_block1)
        if_block1.c();
      t1 = space();
      attr(span, "class", "svelte-tags-input-tag svelte-sm1rwb");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      if_block0.m(span, null);
      append(span, t0);
      if (if_block1)
        if_block1.m(span, null);
      append(span, t1);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(span, t0);
        }
      }
      if (!ctx2[6]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_2(ctx2);
          if_block1.c();
          if_block1.m(span, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block(ctx) {
  let div;
  let ul;
  let ul_id_value;
  let each_value = ctx[9];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  return {
    c() {
      div = element("div");
      ul = element("ul");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(ul, "id", ul_id_value = "" + (ctx[5] + "_matchs"));
      attr(ul, "class", "svelte-tags-input-matchs svelte-sm1rwb");
      attr(div, "class", "svelte-tags-input-matchs-parent svelte-sm1rwb");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, ul);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(ul, null);
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 266752) {
        each_value = ctx2[9];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(ul, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (dirty[0] & 32 && ul_id_value !== (ul_id_value = "" + (ctx2[5] + "_matchs"))) {
        attr(ul, "id", ul_id_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block(ctx) {
  let li;
  let html_tag;
  let raw_value = ctx[39].search + "";
  let t;
  let mounted;
  let dispose;
  function keydown_handler() {
    return ctx[32](ctx[41], ctx[39]);
  }
  function click_handler_1() {
    return ctx[33](ctx[39]);
  }
  return {
    c() {
      li = element("li");
      html_tag = new HtmlTag();
      t = space();
      html_tag.a = t;
      attr(li, "tabindex", "-1");
      attr(li, "class", "svelte-sm1rwb");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      html_tag.m(raw_value, li);
      append(li, t);
      if (!mounted) {
        dispose = [
          listen(li, "keydown", keydown_handler),
          listen(li, "click", click_handler_1)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & 512 && raw_value !== (raw_value = ctx[39].search + ""))
        html_tag.p(raw_value);
    },
    d(detaching) {
      if (detaching)
        detach(li);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$2(ctx) {
  let div;
  let label;
  let t0;
  let label_class_value;
  let t1;
  let t2;
  let input;
  let t3;
  let if_block1_anchor;
  let mounted;
  let dispose;
  let if_block0 = ctx[0].length > 0 && create_if_block_1(ctx);
  let if_block1 = ctx[2] && ctx[9].length > 0 && create_if_block(ctx);
  return {
    c() {
      div = element("div");
      label = element("label");
      t0 = text(ctx[7]);
      t1 = space();
      if (if_block0)
        if_block0.c();
      t2 = space();
      input = element("input");
      t3 = space();
      if (if_block1)
        if_block1.c();
      if_block1_anchor = empty();
      attr(label, "for", ctx[5]);
      attr(label, "class", label_class_value = "" + (null_to_empty(ctx[8] ? "" : "sr-only") + " svelte-sm1rwb"));
      attr(input, "type", "text");
      attr(input, "id", ctx[5]);
      attr(input, "name", ctx[4]);
      attr(input, "class", "svelte-tags-input svelte-sm1rwb");
      attr(input, "placeholder", ctx[1]);
      input.disabled = ctx[6];
      attr(div, "class", "svelte-tags-input-layout svelte-sm1rwb");
      toggle_class(div, "sti-layout-disable", ctx[6]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, label);
      append(label, t0);
      append(div, t1);
      if (if_block0)
        if_block0.m(div, null);
      append(div, t2);
      append(div, input);
      set_input_value(input, ctx[10]);
      insert(target, t3, anchor);
      if (if_block1)
        if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      if (!mounted) {
        dispose = [
          listen(input, "input", ctx[30]),
          listen(input, "keydown", ctx[11]),
          listen(input, "keyup", ctx[17]),
          listen(input, "paste", ctx[14]),
          listen(input, "drop", ctx[15]),
          listen(input, "blur", ctx[31])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 128)
        set_data(t0, ctx2[7]);
      if (dirty[0] & 32) {
        attr(label, "for", ctx2[5]);
      }
      if (dirty[0] & 256 && label_class_value !== (label_class_value = "" + (null_to_empty(ctx2[8] ? "" : "sr-only") + " svelte-sm1rwb"))) {
        attr(label, "class", label_class_value);
      }
      if (ctx2[0].length > 0) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_1(ctx2);
          if_block0.c();
          if_block0.m(div, t2);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & 32) {
        attr(input, "id", ctx2[5]);
      }
      if (dirty[0] & 16) {
        attr(input, "name", ctx2[4]);
      }
      if (dirty[0] & 2) {
        attr(input, "placeholder", ctx2[1]);
      }
      if (dirty[0] & 64) {
        input.disabled = ctx2[6];
      }
      if (dirty[0] & 1024 && input.value !== ctx2[10]) {
        set_input_value(input, ctx2[10]);
      }
      if (dirty[0] & 64) {
        toggle_class(div, "sti-layout-disable", ctx2[6]);
      }
      if (ctx2[2] && ctx2[9].length > 0) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block(ctx2);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block0)
        if_block0.d();
      if (detaching)
        detach(t3);
      if (if_block1)
        if_block1.d(detaching);
      if (detaching)
        detach(if_block1_anchor);
      mounted = false;
      run_all(dispose);
    }
  };
}
function getClipboardData(e) {
  if (window.clipboardData) {
    return window.clipboardData.getData("Text");
  }
  if (e.clipboardData) {
    return e.clipboardData.getData("text/plain");
  }
  return "";
}
function uniqueID() {
  return "sti_" + Math.random().toString(36).substr(2, 9);
}
function instance$2($$self, $$props, $$invalidate) {
  let matchsID;
  const dispatch2 = createEventDispatcher();
  let tag = "";
  let arrelementsmatch = [];
  let regExpEscape = (s) => {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  };
  let { tags } = $$props;
  let { addKeys } = $$props;
  let { maxTags } = $$props;
  let { onlyUnique } = $$props;
  let { removeKeys } = $$props;
  let { placeholder } = $$props;
  let { allowPaste } = $$props;
  let { allowDrop } = $$props;
  let { splitWith } = $$props;
  let { autoComplete } = $$props;
  let { autoCompleteKey } = $$props;
  let { name } = $$props;
  let { id } = $$props;
  let { allowBlur } = $$props;
  let { disable } = $$props;
  let { minChars } = $$props;
  let { onlyAutocomplete } = $$props;
  let { labelText } = $$props;
  let { labelShow } = $$props;
  let storePlaceholder = placeholder;
  function setTag(input) {
    const currentTag = input.target.value;
    if (addKeys) {
      addKeys.forEach(function(key) {
        if (key === input.keyCode) {
          if (currentTag)
            input.preventDefault();
          if (autoComplete && document.getElementById(matchsID)) {
            addTag(document.getElementById(matchsID).querySelectorAll("li")[0].textContent);
          } else {
            addTag(currentTag);
          }
        }
      });
    }
    if (removeKeys) {
      removeKeys.forEach(function(key) {
        if (key === input.keyCode && tag === "") {
          tags.pop();
          $$invalidate(0, tags);
          dispatch2("tags", { tags });
          $$invalidate(9, arrelementsmatch = []);
          document.getElementById(id).readOnly = false;
          $$invalidate(1, placeholder = storePlaceholder);
          document.getElementById(id).focus();
        }
      });
    }
    if (input.keyCode === 40 && autoComplete && document.getElementById(matchsID)) {
      event.preventDefault();
      document.getElementById(matchsID).querySelector("li:first-child").focus();
    } else if (input.keyCode === 38 && autoComplete && document.getElementById(matchsID)) {
      event.preventDefault();
      document.getElementById(matchsID).querySelector("li:last-child").focus();
    }
  }
  function addTag(currentTag) {
    if (typeof currentTag === "object" && currentTag !== null) {
      if (!autoCompleteKey) {
        return console.error("'autoCompleteKey' is necessary if 'autoComplete' result is an array of objects");
      }
      var currentObjTags = currentTag;
      currentTag = currentTag[autoCompleteKey].trim();
    } else {
      currentTag = currentTag.trim();
    }
    if (currentTag == "")
      return;
    if (maxTags && tags.length == maxTags)
      return;
    if (onlyUnique && tags.includes(currentTag))
      return;
    if (onlyAutocomplete && arrelementsmatch.length === 0)
      return;
    tags.push(currentObjTags ? currentObjTags : currentTag);
    $$invalidate(0, tags);
    $$invalidate(10, tag = "");
    dispatch2("tags", { tags });
    $$invalidate(9, arrelementsmatch = []);
    document.getElementById(id).focus();
    if (maxTags && tags.length == maxTags) {
      document.getElementById(id).readOnly = true;
      $$invalidate(1, placeholder = "");
    }
  }
  function removeTag(i) {
    tags.splice(i, 1);
    $$invalidate(0, tags);
    dispatch2("tags", { tags });
    $$invalidate(9, arrelementsmatch = []);
    document.getElementById(id).readOnly = false;
    $$invalidate(1, placeholder = storePlaceholder);
    document.getElementById(id).focus();
  }
  function onPaste(e) {
    if (!allowPaste)
      return;
    e.preventDefault();
    const data = getClipboardData(e);
    splitTags(data).map((tag2) => addTag(tag2));
  }
  function onDrop(e) {
    if (!allowDrop)
      return;
    e.preventDefault();
    const data = e.dataTransfer.getData("Text");
    splitTags(data).map((tag2) => addTag(tag2));
  }
  function onBlur(tag2) {
    if (!document.getElementById(matchsID) && allowBlur) {
      event.preventDefault();
      addTag(tag2);
    }
  }
  function splitTags(data) {
    return data.split(splitWith).map((tag2) => tag2.trim());
  }
  async function getMatchElements(input) {
    if (!autoComplete)
      return;
    let autoCompleteValues = [];
    if (Array.isArray(autoComplete)) {
      autoCompleteValues = autoComplete;
    }
    if (typeof autoComplete === "function") {
      if (autoComplete.constructor.name === "AsyncFunction") {
        autoCompleteValues = await autoComplete();
      } else {
        autoCompleteValues = autoComplete();
      }
    }
    var value = input.target.value;
    if (value == "" || input.keyCode === 27 || value.length < minChars) {
      $$invalidate(9, arrelementsmatch = []);
      return;
    }
    if (typeof autoCompleteValues[0] === "object" && autoCompleteValues !== null) {
      if (!autoCompleteKey) {
        return console.error("'autoCompleteValue' is necessary if 'autoComplete' result is an array of objects");
      }
      var matchs = autoCompleteValues.filter((e) => e[autoCompleteKey].toLowerCase().includes(value.toLowerCase())).map((matchTag) => {
        return {
          label: matchTag,
          search: matchTag[autoCompleteKey].replace(RegExp(regExpEscape(value.toLowerCase()), "i"), "<strong>$&</strong>")
        };
      });
    } else {
      var matchs = autoCompleteValues.filter((e) => e.toLowerCase().includes(value.toLowerCase())).map((matchTag) => {
        return {
          label: matchTag,
          search: matchTag.replace(RegExp(regExpEscape(value.toLowerCase()), "i"), "<strong>$&</strong>")
        };
      });
    }
    if (onlyUnique === true && !autoCompleteKey) {
      matchs = matchs.filter((tag2) => !tags.includes(tag2.label));
    }
    $$invalidate(9, arrelementsmatch = matchs);
  }
  function navigateAutoComplete(autoCompleteIndex, autoCompleteLength, autoCompleteElement) {
    if (!autoComplete)
      return;
    event.preventDefault();
    if (event.keyCode === 40) {
      if (autoCompleteIndex + 1 === autoCompleteLength) {
        document.getElementById(matchsID).querySelector("li:first-child").focus();
        return;
      }
      document.getElementById(matchsID).querySelectorAll("li")[autoCompleteIndex + 1].focus();
    } else if (event.keyCode === 38) {
      if (autoCompleteIndex === 0) {
        document.getElementById(matchsID).querySelector("li:last-child").focus();
        return;
      }
      document.getElementById(matchsID).querySelectorAll("li")[autoCompleteIndex - 1].focus();
    } else if (event.keyCode === 13) {
      addTag(autoCompleteElement);
    } else if (event.keyCode === 27) {
      $$invalidate(9, arrelementsmatch = []);
      document.getElementById(id).focus();
    }
  }
  const click_handler = (i) => removeTag(i);
  function input_input_handler() {
    tag = this.value;
    $$invalidate(10, tag);
  }
  const blur_handler = () => onBlur(tag);
  const keydown_handler = (index, element2) => navigateAutoComplete(index, arrelementsmatch.length, element2.label);
  const click_handler_1 = (element2) => addTag(element2.label);
  $$self.$$set = ($$props2) => {
    if ("tags" in $$props2)
      $$invalidate(0, tags = $$props2.tags);
    if ("addKeys" in $$props2)
      $$invalidate(19, addKeys = $$props2.addKeys);
    if ("maxTags" in $$props2)
      $$invalidate(20, maxTags = $$props2.maxTags);
    if ("onlyUnique" in $$props2)
      $$invalidate(21, onlyUnique = $$props2.onlyUnique);
    if ("removeKeys" in $$props2)
      $$invalidate(22, removeKeys = $$props2.removeKeys);
    if ("placeholder" in $$props2)
      $$invalidate(1, placeholder = $$props2.placeholder);
    if ("allowPaste" in $$props2)
      $$invalidate(23, allowPaste = $$props2.allowPaste);
    if ("allowDrop" in $$props2)
      $$invalidate(24, allowDrop = $$props2.allowDrop);
    if ("splitWith" in $$props2)
      $$invalidate(25, splitWith = $$props2.splitWith);
    if ("autoComplete" in $$props2)
      $$invalidate(2, autoComplete = $$props2.autoComplete);
    if ("autoCompleteKey" in $$props2)
      $$invalidate(3, autoCompleteKey = $$props2.autoCompleteKey);
    if ("name" in $$props2)
      $$invalidate(4, name = $$props2.name);
    if ("id" in $$props2)
      $$invalidate(5, id = $$props2.id);
    if ("allowBlur" in $$props2)
      $$invalidate(26, allowBlur = $$props2.allowBlur);
    if ("disable" in $$props2)
      $$invalidate(6, disable = $$props2.disable);
    if ("minChars" in $$props2)
      $$invalidate(27, minChars = $$props2.minChars);
    if ("onlyAutocomplete" in $$props2)
      $$invalidate(28, onlyAutocomplete = $$props2.onlyAutocomplete);
    if ("labelText" in $$props2)
      $$invalidate(7, labelText = $$props2.labelText);
    if ("labelShow" in $$props2)
      $$invalidate(8, labelShow = $$props2.labelShow);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & 1) {
      $$invalidate(0, tags = tags || []);
    }
    if ($$self.$$.dirty[0] & 524288) {
      $$invalidate(19, addKeys = addKeys || [13]);
    }
    if ($$self.$$.dirty[0] & 1048576) {
      $$invalidate(20, maxTags = maxTags || false);
    }
    if ($$self.$$.dirty[0] & 2097152) {
      $$invalidate(21, onlyUnique = onlyUnique || false);
    }
    if ($$self.$$.dirty[0] & 4194304) {
      $$invalidate(22, removeKeys = removeKeys || [8]);
    }
    if ($$self.$$.dirty[0] & 2) {
      $$invalidate(1, placeholder = placeholder || "");
    }
    if ($$self.$$.dirty[0] & 8388608) {
      $$invalidate(23, allowPaste = allowPaste || false);
    }
    if ($$self.$$.dirty[0] & 16777216) {
      $$invalidate(24, allowDrop = allowDrop || false);
    }
    if ($$self.$$.dirty[0] & 33554432) {
      $$invalidate(25, splitWith = splitWith || ",");
    }
    if ($$self.$$.dirty[0] & 4) {
      $$invalidate(2, autoComplete = autoComplete || false);
    }
    if ($$self.$$.dirty[0] & 8) {
      $$invalidate(3, autoCompleteKey = autoCompleteKey || false);
    }
    if ($$self.$$.dirty[0] & 16) {
      $$invalidate(4, name = name || "svelte-tags-input");
    }
    if ($$self.$$.dirty[0] & 32) {
      $$invalidate(5, id = id || uniqueID());
    }
    if ($$self.$$.dirty[0] & 67108864) {
      $$invalidate(26, allowBlur = allowBlur || false);
    }
    if ($$self.$$.dirty[0] & 64) {
      $$invalidate(6, disable = disable || false);
    }
    if ($$self.$$.dirty[0] & 134217728) {
      $$invalidate(27, minChars = minChars || 1);
    }
    if ($$self.$$.dirty[0] & 268435456) {
      $$invalidate(28, onlyAutocomplete = onlyAutocomplete || false);
    }
    if ($$self.$$.dirty[0] & 144) {
      $$invalidate(7, labelText = labelText || name);
    }
    if ($$self.$$.dirty[0] & 256) {
      $$invalidate(8, labelShow = labelShow || false);
    }
    if ($$self.$$.dirty[0] & 32) {
      matchsID = id + "_matchs";
    }
  };
  return [
    tags,
    placeholder,
    autoComplete,
    autoCompleteKey,
    name,
    id,
    disable,
    labelText,
    labelShow,
    arrelementsmatch,
    tag,
    setTag,
    addTag,
    removeTag,
    onPaste,
    onDrop,
    onBlur,
    getMatchElements,
    navigateAutoComplete,
    addKeys,
    maxTags,
    onlyUnique,
    removeKeys,
    allowPaste,
    allowDrop,
    splitWith,
    allowBlur,
    minChars,
    onlyAutocomplete,
    click_handler,
    input_input_handler,
    blur_handler,
    keydown_handler,
    click_handler_1
  ];
}
class Tags extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      tags: 0,
      addKeys: 19,
      maxTags: 20,
      onlyUnique: 21,
      removeKeys: 22,
      placeholder: 1,
      allowPaste: 23,
      allowDrop: 24,
      splitWith: 25,
      autoComplete: 2,
      autoCompleteKey: 3,
      name: 4,
      id: 5,
      allowBlur: 26,
      disable: 6,
      minChars: 27,
      onlyAutocomplete: 28,
      labelText: 7,
      labelShow: 8
    }, null, [-1, -1]);
  }
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var codemirror = { exports: {} };
(function(module, exports) {
  (function(global2, factory) {
    module.exports = factory();
  })(commonjsGlobal, function() {
    var userAgent = navigator.userAgent;
    var platform = navigator.platform;
    var gecko = /gecko\/\d/i.test(userAgent);
    var ie_upto10 = /MSIE \d/.test(userAgent);
    var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
    var edge = /Edge\/(\d+)/.exec(userAgent);
    var ie = ie_upto10 || ie_11up || edge;
    var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
    var webkit = !edge && /WebKit\//.test(userAgent);
    var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
    var chrome = !edge && /Chrome\//.test(userAgent);
    var presto = /Opera\//.test(userAgent);
    var safari = /Apple Computer/.test(navigator.vendor);
    var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
    var phantom = /PhantomJS/.test(userAgent);
    var ios = safari && (/Mobile\/\w+/.test(userAgent) || navigator.maxTouchPoints > 2);
    var android = /Android/.test(userAgent);
    var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
    var mac = ios || /Mac/.test(platform);
    var chromeOS = /\bCrOS\b/.test(userAgent);
    var windows = /win/i.test(platform);
    var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
    if (presto_version) {
      presto_version = Number(presto_version[1]);
    }
    if (presto_version && presto_version >= 15) {
      presto = false;
      webkit = true;
    }
    var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
    var captureRightClick = gecko || ie && ie_version >= 9;
    function classTest(cls) {
      return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*");
    }
    var rmClass = function(node, cls) {
      var current = node.className;
      var match = classTest(cls).exec(current);
      if (match) {
        var after = current.slice(match.index + match[0].length);
        node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
      }
    };
    function removeChildren(e) {
      for (var count = e.childNodes.length; count > 0; --count) {
        e.removeChild(e.firstChild);
      }
      return e;
    }
    function removeChildrenAndAdd(parent, e) {
      return removeChildren(parent).appendChild(e);
    }
    function elt(tag, content, className, style) {
      var e = document.createElement(tag);
      if (className) {
        e.className = className;
      }
      if (style) {
        e.style.cssText = style;
      }
      if (typeof content == "string") {
        e.appendChild(document.createTextNode(content));
      } else if (content) {
        for (var i2 = 0; i2 < content.length; ++i2) {
          e.appendChild(content[i2]);
        }
      }
      return e;
    }
    function eltP(tag, content, className, style) {
      var e = elt(tag, content, className, style);
      e.setAttribute("role", "presentation");
      return e;
    }
    var range;
    if (document.createRange) {
      range = function(node, start2, end, endNode) {
        var r = document.createRange();
        r.setEnd(endNode || node, end);
        r.setStart(node, start2);
        return r;
      };
    } else {
      range = function(node, start2, end) {
        var r = document.body.createTextRange();
        try {
          r.moveToElementText(node.parentNode);
        } catch (e) {
          return r;
        }
        r.collapse(true);
        r.moveEnd("character", end);
        r.moveStart("character", start2);
        return r;
      };
    }
    function contains(parent, child) {
      if (child.nodeType == 3) {
        child = child.parentNode;
      }
      if (parent.contains) {
        return parent.contains(child);
      }
      do {
        if (child.nodeType == 11) {
          child = child.host;
        }
        if (child == parent) {
          return true;
        }
      } while (child = child.parentNode);
    }
    function activeElt() {
      var activeElement;
      try {
        activeElement = document.activeElement;
      } catch (e) {
        activeElement = document.body || null;
      }
      while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
        activeElement = activeElement.shadowRoot.activeElement;
      }
      return activeElement;
    }
    function addClass(node, cls) {
      var current = node.className;
      if (!classTest(cls).test(current)) {
        node.className += (current ? " " : "") + cls;
      }
    }
    function joinClasses(a, b) {
      var as = a.split(" ");
      for (var i2 = 0; i2 < as.length; i2++) {
        if (as[i2] && !classTest(as[i2]).test(b)) {
          b += " " + as[i2];
        }
      }
      return b;
    }
    var selectInput = function(node) {
      node.select();
    };
    if (ios) {
      selectInput = function(node) {
        node.selectionStart = 0;
        node.selectionEnd = node.value.length;
      };
    } else if (ie) {
      selectInput = function(node) {
        try {
          node.select();
        } catch (_e) {
        }
      };
    }
    function bind2(f) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        return f.apply(null, args);
      };
    }
    function copyObj(obj, target, overwrite) {
      if (!target) {
        target = {};
      }
      for (var prop2 in obj) {
        if (obj.hasOwnProperty(prop2) && (overwrite !== false || !target.hasOwnProperty(prop2))) {
          target[prop2] = obj[prop2];
        }
      }
      return target;
    }
    function countColumn(string, end, tabSize, startIndex, startValue) {
      if (end == null) {
        end = string.search(/[^\s\u00a0]/);
        if (end == -1) {
          end = string.length;
        }
      }
      for (var i2 = startIndex || 0, n = startValue || 0; ; ) {
        var nextTab = string.indexOf("	", i2);
        if (nextTab < 0 || nextTab >= end) {
          return n + (end - i2);
        }
        n += nextTab - i2;
        n += tabSize - n % tabSize;
        i2 = nextTab + 1;
      }
    }
    var Delayed = function() {
      this.id = null;
      this.f = null;
      this.time = 0;
      this.handler = bind2(this.onTimeout, this);
    };
    Delayed.prototype.onTimeout = function(self2) {
      self2.id = 0;
      if (self2.time <= +new Date()) {
        self2.f();
      } else {
        setTimeout(self2.handler, self2.time - +new Date());
      }
    };
    Delayed.prototype.set = function(ms, f) {
      this.f = f;
      var time = +new Date() + ms;
      if (!this.id || time < this.time) {
        clearTimeout(this.id);
        this.id = setTimeout(this.handler, ms);
        this.time = time;
      }
    };
    function indexOf(array, elt2) {
      for (var i2 = 0; i2 < array.length; ++i2) {
        if (array[i2] == elt2) {
          return i2;
        }
      }
      return -1;
    }
    var scrollerGap = 50;
    var Pass = { toString: function() {
      return "CodeMirror.Pass";
    } };
    var sel_dontScroll = { scroll: false }, sel_mouse = { origin: "*mouse" }, sel_move = { origin: "+move" };
    function findColumn(string, goal, tabSize) {
      for (var pos = 0, col = 0; ; ) {
        var nextTab = string.indexOf("	", pos);
        if (nextTab == -1) {
          nextTab = string.length;
        }
        var skipped = nextTab - pos;
        if (nextTab == string.length || col + skipped >= goal) {
          return pos + Math.min(skipped, goal - col);
        }
        col += nextTab - pos;
        col += tabSize - col % tabSize;
        pos = nextTab + 1;
        if (col >= goal) {
          return pos;
        }
      }
    }
    var spaceStrs = [""];
    function spaceStr(n) {
      while (spaceStrs.length <= n) {
        spaceStrs.push(lst(spaceStrs) + " ");
      }
      return spaceStrs[n];
    }
    function lst(arr) {
      return arr[arr.length - 1];
    }
    function map(array, f) {
      var out = [];
      for (var i2 = 0; i2 < array.length; i2++) {
        out[i2] = f(array[i2], i2);
      }
      return out;
    }
    function insertSorted(array, value, score) {
      var pos = 0, priority = score(value);
      while (pos < array.length && score(array[pos]) <= priority) {
        pos++;
      }
      array.splice(pos, 0, value);
    }
    function nothing() {
    }
    function createObj(base, props) {
      var inst;
      if (Object.create) {
        inst = Object.create(base);
      } else {
        nothing.prototype = base;
        inst = new nothing();
      }
      if (props) {
        copyObj(props, inst);
      }
      return inst;
    }
    var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
    function isWordCharBasic(ch) {
      return /\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
    }
    function isWordChar(ch, helper) {
      if (!helper) {
        return isWordCharBasic(ch);
      }
      if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) {
        return true;
      }
      return helper.test(ch);
    }
    function isEmpty(obj) {
      for (var n in obj) {
        if (obj.hasOwnProperty(n) && obj[n]) {
          return false;
        }
      }
      return true;
    }
    var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
    function isExtendingChar(ch) {
      return ch.charCodeAt(0) >= 768 && extendingChars.test(ch);
    }
    function skipExtendingChars(str, pos, dir) {
      while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) {
        pos += dir;
      }
      return pos;
    }
    function findFirst(pred, from, to) {
      var dir = from > to ? -1 : 1;
      for (; ; ) {
        if (from == to) {
          return from;
        }
        var midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
        if (mid == from) {
          return pred(mid) ? from : to;
        }
        if (pred(mid)) {
          to = mid;
        } else {
          from = mid + dir;
        }
      }
    }
    function iterateBidiSections(order, from, to, f) {
      if (!order) {
        return f(from, to, "ltr", 0);
      }
      var found = false;
      for (var i2 = 0; i2 < order.length; ++i2) {
        var part = order[i2];
        if (part.from < to && part.to > from || from == to && part.to == from) {
          f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i2);
          found = true;
        }
      }
      if (!found) {
        f(from, to, "ltr");
      }
    }
    var bidiOther = null;
    function getBidiPartAt(order, ch, sticky) {
      var found;
      bidiOther = null;
      for (var i2 = 0; i2 < order.length; ++i2) {
        var cur = order[i2];
        if (cur.from < ch && cur.to > ch) {
          return i2;
        }
        if (cur.to == ch) {
          if (cur.from != cur.to && sticky == "before") {
            found = i2;
          } else {
            bidiOther = i2;
          }
        }
        if (cur.from == ch) {
          if (cur.from != cur.to && sticky != "before") {
            found = i2;
          } else {
            bidiOther = i2;
          }
        }
      }
      return found != null ? found : bidiOther;
    }
    var bidiOrdering = function() {
      var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
      var arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";
      function charType(code) {
        if (code <= 247) {
          return lowTypes.charAt(code);
        } else if (1424 <= code && code <= 1524) {
          return "R";
        } else if (1536 <= code && code <= 1785) {
          return arabicTypes.charAt(code - 1536);
        } else if (1774 <= code && code <= 2220) {
          return "r";
        } else if (8192 <= code && code <= 8203) {
          return "w";
        } else if (code == 8204) {
          return "b";
        } else {
          return "L";
        }
      }
      var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
      var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;
      function BidiSpan(level, from, to) {
        this.level = level;
        this.from = from;
        this.to = to;
      }
      return function(str, direction) {
        var outerType = direction == "ltr" ? "L" : "R";
        if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) {
          return false;
        }
        var len = str.length, types = [];
        for (var i2 = 0; i2 < len; ++i2) {
          types.push(charType(str.charCodeAt(i2)));
        }
        for (var i$12 = 0, prev = outerType; i$12 < len; ++i$12) {
          var type = types[i$12];
          if (type == "m") {
            types[i$12] = prev;
          } else {
            prev = type;
          }
        }
        for (var i$22 = 0, cur = outerType; i$22 < len; ++i$22) {
          var type$1 = types[i$22];
          if (type$1 == "1" && cur == "r") {
            types[i$22] = "n";
          } else if (isStrong.test(type$1)) {
            cur = type$1;
            if (type$1 == "r") {
              types[i$22] = "R";
            }
          }
        }
        for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
          var type$2 = types[i$3];
          if (type$2 == "+" && prev$1 == "1" && types[i$3 + 1] == "1") {
            types[i$3] = "1";
          } else if (type$2 == "," && prev$1 == types[i$3 + 1] && (prev$1 == "1" || prev$1 == "n")) {
            types[i$3] = prev$1;
          }
          prev$1 = type$2;
        }
        for (var i$4 = 0; i$4 < len; ++i$4) {
          var type$3 = types[i$4];
          if (type$3 == ",") {
            types[i$4] = "N";
          } else if (type$3 == "%") {
            var end = void 0;
            for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {
            }
            var replace2 = i$4 && types[i$4 - 1] == "!" || end < len && types[end] == "1" ? "1" : "N";
            for (var j = i$4; j < end; ++j) {
              types[j] = replace2;
            }
            i$4 = end - 1;
          }
        }
        for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
          var type$4 = types[i$5];
          if (cur$1 == "L" && type$4 == "1") {
            types[i$5] = "L";
          } else if (isStrong.test(type$4)) {
            cur$1 = type$4;
          }
        }
        for (var i$6 = 0; i$6 < len; ++i$6) {
          if (isNeutral.test(types[i$6])) {
            var end$1 = void 0;
            for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {
            }
            var before = (i$6 ? types[i$6 - 1] : outerType) == "L";
            var after = (end$1 < len ? types[end$1] : outerType) == "L";
            var replace$1 = before == after ? before ? "L" : "R" : outerType;
            for (var j$1 = i$6; j$1 < end$1; ++j$1) {
              types[j$1] = replace$1;
            }
            i$6 = end$1 - 1;
          }
        }
        var order = [], m;
        for (var i$7 = 0; i$7 < len; ) {
          if (countsAsLeft.test(types[i$7])) {
            var start2 = i$7;
            for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {
            }
            order.push(new BidiSpan(0, start2, i$7));
          } else {
            var pos = i$7, at = order.length, isRTL = direction == "rtl" ? 1 : 0;
            for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {
            }
            for (var j$2 = pos; j$2 < i$7; ) {
              if (countsAsNum.test(types[j$2])) {
                if (pos < j$2) {
                  order.splice(at, 0, new BidiSpan(1, pos, j$2));
                  at += isRTL;
                }
                var nstart = j$2;
                for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {
                }
                order.splice(at, 0, new BidiSpan(2, nstart, j$2));
                at += isRTL;
                pos = j$2;
              } else {
                ++j$2;
              }
            }
            if (pos < i$7) {
              order.splice(at, 0, new BidiSpan(1, pos, i$7));
            }
          }
        }
        if (direction == "ltr") {
          if (order[0].level == 1 && (m = str.match(/^\s+/))) {
            order[0].from = m[0].length;
            order.unshift(new BidiSpan(0, 0, m[0].length));
          }
          if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
            lst(order).to -= m[0].length;
            order.push(new BidiSpan(0, len - m[0].length, len));
          }
        }
        return direction == "rtl" ? order.reverse() : order;
      };
    }();
    function getOrder(line, direction) {
      var order = line.order;
      if (order == null) {
        order = line.order = bidiOrdering(line.text, direction);
      }
      return order;
    }
    var noHandlers = [];
    var on = function(emitter, type, f) {
      if (emitter.addEventListener) {
        emitter.addEventListener(type, f, false);
      } else if (emitter.attachEvent) {
        emitter.attachEvent("on" + type, f);
      } else {
        var map2 = emitter._handlers || (emitter._handlers = {});
        map2[type] = (map2[type] || noHandlers).concat(f);
      }
    };
    function getHandlers(emitter, type) {
      return emitter._handlers && emitter._handlers[type] || noHandlers;
    }
    function off(emitter, type, f) {
      if (emitter.removeEventListener) {
        emitter.removeEventListener(type, f, false);
      } else if (emitter.detachEvent) {
        emitter.detachEvent("on" + type, f);
      } else {
        var map2 = emitter._handlers, arr = map2 && map2[type];
        if (arr) {
          var index = indexOf(arr, f);
          if (index > -1) {
            map2[type] = arr.slice(0, index).concat(arr.slice(index + 1));
          }
        }
      }
    }
    function signal(emitter, type) {
      var handlers = getHandlers(emitter, type);
      if (!handlers.length) {
        return;
      }
      var args = Array.prototype.slice.call(arguments, 2);
      for (var i2 = 0; i2 < handlers.length; ++i2) {
        handlers[i2].apply(null, args);
      }
    }
    function signalDOMEvent(cm, e, override) {
      if (typeof e == "string") {
        e = { type: e, preventDefault: function() {
          this.defaultPrevented = true;
        } };
      }
      signal(cm, override || e.type, cm, e);
      return e_defaultPrevented(e) || e.codemirrorIgnore;
    }
    function signalCursorActivity(cm) {
      var arr = cm._handlers && cm._handlers.cursorActivity;
      if (!arr) {
        return;
      }
      var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
      for (var i2 = 0; i2 < arr.length; ++i2) {
        if (indexOf(set, arr[i2]) == -1) {
          set.push(arr[i2]);
        }
      }
    }
    function hasHandler(emitter, type) {
      return getHandlers(emitter, type).length > 0;
    }
    function eventMixin(ctor) {
      ctor.prototype.on = function(type, f) {
        on(this, type, f);
      };
      ctor.prototype.off = function(type, f) {
        off(this, type, f);
      };
    }
    function e_preventDefault(e) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }
    function e_stopPropagation(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    }
    function e_defaultPrevented(e) {
      return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false;
    }
    function e_stop(e) {
      e_preventDefault(e);
      e_stopPropagation(e);
    }
    function e_target(e) {
      return e.target || e.srcElement;
    }
    function e_button(e) {
      var b = e.which;
      if (b == null) {
        if (e.button & 1) {
          b = 1;
        } else if (e.button & 2) {
          b = 3;
        } else if (e.button & 4) {
          b = 2;
        }
      }
      if (mac && e.ctrlKey && b == 1) {
        b = 3;
      }
      return b;
    }
    var dragAndDrop = function() {
      if (ie && ie_version < 9) {
        return false;
      }
      var div = elt("div");
      return "draggable" in div || "dragDrop" in div;
    }();
    var zwspSupported;
    function zeroWidthElement(measure) {
      if (zwspSupported == null) {
        var test = elt("span", "\u200B");
        removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
        if (measure.firstChild.offsetHeight != 0) {
          zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);
        }
      }
      var node = zwspSupported ? elt("span", "\u200B") : elt("span", "\xA0", null, "display: inline-block; width: 1px; margin-right: -1px");
      node.setAttribute("cm-text", "");
      return node;
    }
    var badBidiRects;
    function hasBadBidiRects(measure) {
      if (badBidiRects != null) {
        return badBidiRects;
      }
      var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062EA"));
      var r0 = range(txt, 0, 1).getBoundingClientRect();
      var r1 = range(txt, 1, 2).getBoundingClientRect();
      removeChildren(measure);
      if (!r0 || r0.left == r0.right) {
        return false;
      }
      return badBidiRects = r1.right - r0.right < 3;
    }
    var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function(string) {
      var pos = 0, result = [], l = string.length;
      while (pos <= l) {
        var nl = string.indexOf("\n", pos);
        if (nl == -1) {
          nl = string.length;
        }
        var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
        var rt = line.indexOf("\r");
        if (rt != -1) {
          result.push(line.slice(0, rt));
          pos += rt + 1;
        } else {
          result.push(line);
          pos = nl + 1;
        }
      }
      return result;
    } : function(string) {
      return string.split(/\r\n?|\n/);
    };
    var hasSelection = window.getSelection ? function(te) {
      try {
        return te.selectionStart != te.selectionEnd;
      } catch (e) {
        return false;
      }
    } : function(te) {
      var range2;
      try {
        range2 = te.ownerDocument.selection.createRange();
      } catch (e) {
      }
      if (!range2 || range2.parentElement() != te) {
        return false;
      }
      return range2.compareEndPoints("StartToEnd", range2) != 0;
    };
    var hasCopyEvent = function() {
      var e = elt("div");
      if ("oncopy" in e) {
        return true;
      }
      e.setAttribute("oncopy", "return;");
      return typeof e.oncopy == "function";
    }();
    var badZoomedRects = null;
    function hasBadZoomedRects(measure) {
      if (badZoomedRects != null) {
        return badZoomedRects;
      }
      var node = removeChildrenAndAdd(measure, elt("span", "x"));
      var normal = node.getBoundingClientRect();
      var fromRange = range(node, 0, 1).getBoundingClientRect();
      return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
    }
    var modes = {}, mimeModes = {};
    function defineMode(name, mode) {
      if (arguments.length > 2) {
        mode.dependencies = Array.prototype.slice.call(arguments, 2);
      }
      modes[name] = mode;
    }
    function defineMIME(mime, spec) {
      mimeModes[mime] = spec;
    }
    function resolveMode(spec) {
      if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
        spec = mimeModes[spec];
      } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
        var found = mimeModes[spec.name];
        if (typeof found == "string") {
          found = { name: found };
        }
        spec = createObj(found, spec);
        spec.name = found.name;
      } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
        return resolveMode("application/xml");
      } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
        return resolveMode("application/json");
      }
      if (typeof spec == "string") {
        return { name: spec };
      } else {
        return spec || { name: "null" };
      }
    }
    function getMode(options, spec) {
      spec = resolveMode(spec);
      var mfactory = modes[spec.name];
      if (!mfactory) {
        return getMode(options, "text/plain");
      }
      var modeObj = mfactory(options, spec);
      if (modeExtensions.hasOwnProperty(spec.name)) {
        var exts = modeExtensions[spec.name];
        for (var prop2 in exts) {
          if (!exts.hasOwnProperty(prop2)) {
            continue;
          }
          if (modeObj.hasOwnProperty(prop2)) {
            modeObj["_" + prop2] = modeObj[prop2];
          }
          modeObj[prop2] = exts[prop2];
        }
      }
      modeObj.name = spec.name;
      if (spec.helperType) {
        modeObj.helperType = spec.helperType;
      }
      if (spec.modeProps) {
        for (var prop$1 in spec.modeProps) {
          modeObj[prop$1] = spec.modeProps[prop$1];
        }
      }
      return modeObj;
    }
    var modeExtensions = {};
    function extendMode(mode, properties) {
      var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : modeExtensions[mode] = {};
      copyObj(properties, exts);
    }
    function copyState(mode, state) {
      if (state === true) {
        return state;
      }
      if (mode.copyState) {
        return mode.copyState(state);
      }
      var nstate = {};
      for (var n in state) {
        var val = state[n];
        if (val instanceof Array) {
          val = val.concat([]);
        }
        nstate[n] = val;
      }
      return nstate;
    }
    function innerMode(mode, state) {
      var info;
      while (mode.innerMode) {
        info = mode.innerMode(state);
        if (!info || info.mode == mode) {
          break;
        }
        state = info.state;
        mode = info.mode;
      }
      return info || { mode, state };
    }
    function startState(mode, a1, a2) {
      return mode.startState ? mode.startState(a1, a2) : true;
    }
    var StringStream = function(string, tabSize, lineOracle) {
      this.pos = this.start = 0;
      this.string = string;
      this.tabSize = tabSize || 8;
      this.lastColumnPos = this.lastColumnValue = 0;
      this.lineStart = 0;
      this.lineOracle = lineOracle;
    };
    StringStream.prototype.eol = function() {
      return this.pos >= this.string.length;
    };
    StringStream.prototype.sol = function() {
      return this.pos == this.lineStart;
    };
    StringStream.prototype.peek = function() {
      return this.string.charAt(this.pos) || void 0;
    };
    StringStream.prototype.next = function() {
      if (this.pos < this.string.length) {
        return this.string.charAt(this.pos++);
      }
    };
    StringStream.prototype.eat = function(match) {
      var ch = this.string.charAt(this.pos);
      var ok;
      if (typeof match == "string") {
        ok = ch == match;
      } else {
        ok = ch && (match.test ? match.test(ch) : match(ch));
      }
      if (ok) {
        ++this.pos;
        return ch;
      }
    };
    StringStream.prototype.eatWhile = function(match) {
      var start2 = this.pos;
      while (this.eat(match)) {
      }
      return this.pos > start2;
    };
    StringStream.prototype.eatSpace = function() {
      var start2 = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) {
        ++this.pos;
      }
      return this.pos > start2;
    };
    StringStream.prototype.skipToEnd = function() {
      this.pos = this.string.length;
    };
    StringStream.prototype.skipTo = function(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {
        this.pos = found;
        return true;
      }
    };
    StringStream.prototype.backUp = function(n) {
      this.pos -= n;
    };
    StringStream.prototype.column = function() {
      if (this.lastColumnPos < this.start) {
        this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
        this.lastColumnPos = this.start;
      }
      return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
    };
    StringStream.prototype.indentation = function() {
      return countColumn(this.string, null, this.tabSize) - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
    };
    StringStream.prototype.match = function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        var cased = function(str) {
          return caseInsensitive ? str.toLowerCase() : str;
        };
        var substr = this.string.substr(this.pos, pattern.length);
        if (cased(substr) == cased(pattern)) {
          if (consume !== false) {
            this.pos += pattern.length;
          }
          return true;
        }
      } else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) {
          return null;
        }
        if (match && consume !== false) {
          this.pos += match[0].length;
        }
        return match;
      }
    };
    StringStream.prototype.current = function() {
      return this.string.slice(this.start, this.pos);
    };
    StringStream.prototype.hideFirstChars = function(n, inner) {
      this.lineStart += n;
      try {
        return inner();
      } finally {
        this.lineStart -= n;
      }
    };
    StringStream.prototype.lookAhead = function(n) {
      var oracle = this.lineOracle;
      return oracle && oracle.lookAhead(n);
    };
    StringStream.prototype.baseToken = function() {
      var oracle = this.lineOracle;
      return oracle && oracle.baseToken(this.pos);
    };
    function getLine(doc, n) {
      n -= doc.first;
      if (n < 0 || n >= doc.size) {
        throw new Error("There is no line " + (n + doc.first) + " in the document.");
      }
      var chunk = doc;
      while (!chunk.lines) {
        for (var i2 = 0; ; ++i2) {
          var child = chunk.children[i2], sz = child.chunkSize();
          if (n < sz) {
            chunk = child;
            break;
          }
          n -= sz;
        }
      }
      return chunk.lines[n];
    }
    function getBetween(doc, start2, end) {
      var out = [], n = start2.line;
      doc.iter(start2.line, end.line + 1, function(line) {
        var text2 = line.text;
        if (n == end.line) {
          text2 = text2.slice(0, end.ch);
        }
        if (n == start2.line) {
          text2 = text2.slice(start2.ch);
        }
        out.push(text2);
        ++n;
      });
      return out;
    }
    function getLines(doc, from, to) {
      var out = [];
      doc.iter(from, to, function(line) {
        out.push(line.text);
      });
      return out;
    }
    function updateLineHeight(line, height) {
      var diff = height - line.height;
      if (diff) {
        for (var n = line; n; n = n.parent) {
          n.height += diff;
        }
      }
    }
    function lineNo(line) {
      if (line.parent == null) {
        return null;
      }
      var cur = line.parent, no = indexOf(cur.lines, line);
      for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
        for (var i2 = 0; ; ++i2) {
          if (chunk.children[i2] == cur) {
            break;
          }
          no += chunk.children[i2].chunkSize();
        }
      }
      return no + cur.first;
    }
    function lineAtHeight(chunk, h) {
      var n = chunk.first;
      outer:
        do {
          for (var i$12 = 0; i$12 < chunk.children.length; ++i$12) {
            var child = chunk.children[i$12], ch = child.height;
            if (h < ch) {
              chunk = child;
              continue outer;
            }
            h -= ch;
            n += child.chunkSize();
          }
          return n;
        } while (!chunk.lines);
      var i2 = 0;
      for (; i2 < chunk.lines.length; ++i2) {
        var line = chunk.lines[i2], lh = line.height;
        if (h < lh) {
          break;
        }
        h -= lh;
      }
      return n + i2;
    }
    function isLine(doc, l) {
      return l >= doc.first && l < doc.first + doc.size;
    }
    function lineNumberFor(options, i2) {
      return String(options.lineNumberFormatter(i2 + options.firstLineNumber));
    }
    function Pos(line, ch, sticky) {
      if (sticky === void 0)
        sticky = null;
      if (!(this instanceof Pos)) {
        return new Pos(line, ch, sticky);
      }
      this.line = line;
      this.ch = ch;
      this.sticky = sticky;
    }
    function cmp(a, b) {
      return a.line - b.line || a.ch - b.ch;
    }
    function equalCursorPos(a, b) {
      return a.sticky == b.sticky && cmp(a, b) == 0;
    }
    function copyPos(x) {
      return Pos(x.line, x.ch);
    }
    function maxPos(a, b) {
      return cmp(a, b) < 0 ? b : a;
    }
    function minPos(a, b) {
      return cmp(a, b) < 0 ? a : b;
    }
    function clipLine(doc, n) {
      return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));
    }
    function clipPos(doc, pos) {
      if (pos.line < doc.first) {
        return Pos(doc.first, 0);
      }
      var last = doc.first + doc.size - 1;
      if (pos.line > last) {
        return Pos(last, getLine(doc, last).text.length);
      }
      return clipToLen(pos, getLine(doc, pos.line).text.length);
    }
    function clipToLen(pos, linelen) {
      var ch = pos.ch;
      if (ch == null || ch > linelen) {
        return Pos(pos.line, linelen);
      } else if (ch < 0) {
        return Pos(pos.line, 0);
      } else {
        return pos;
      }
    }
    function clipPosArray(doc, array) {
      var out = [];
      for (var i2 = 0; i2 < array.length; i2++) {
        out[i2] = clipPos(doc, array[i2]);
      }
      return out;
    }
    var SavedContext = function(state, lookAhead) {
      this.state = state;
      this.lookAhead = lookAhead;
    };
    var Context = function(doc, state, line, lookAhead) {
      this.state = state;
      this.doc = doc;
      this.line = line;
      this.maxLookAhead = lookAhead || 0;
      this.baseTokens = null;
      this.baseTokenPos = 1;
    };
    Context.prototype.lookAhead = function(n) {
      var line = this.doc.getLine(this.line + n);
      if (line != null && n > this.maxLookAhead) {
        this.maxLookAhead = n;
      }
      return line;
    };
    Context.prototype.baseToken = function(n) {
      if (!this.baseTokens) {
        return null;
      }
      while (this.baseTokens[this.baseTokenPos] <= n) {
        this.baseTokenPos += 2;
      }
      var type = this.baseTokens[this.baseTokenPos + 1];
      return {
        type: type && type.replace(/( |^)overlay .*/, ""),
        size: this.baseTokens[this.baseTokenPos] - n
      };
    };
    Context.prototype.nextLine = function() {
      this.line++;
      if (this.maxLookAhead > 0) {
        this.maxLookAhead--;
      }
    };
    Context.fromSaved = function(doc, saved, line) {
      if (saved instanceof SavedContext) {
        return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead);
      } else {
        return new Context(doc, copyState(doc.mode, saved), line);
      }
    };
    Context.prototype.save = function(copy) {
      var state = copy !== false ? copyState(this.doc.mode, this.state) : this.state;
      return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state;
    };
    function highlightLine(cm, line, context, forceToEnd) {
      var st = [cm.state.modeGen], lineClasses = {};
      runMode(cm, line.text, cm.doc.mode, context, function(end, style) {
        return st.push(end, style);
      }, lineClasses, forceToEnd);
      var state = context.state;
      var loop2 = function(o2) {
        context.baseTokens = st;
        var overlay2 = cm.state.overlays[o2], i2 = 1, at = 0;
        context.state = true;
        runMode(cm, line.text, overlay2.mode, context, function(end, style) {
          var start2 = i2;
          while (at < end) {
            var i_end = st[i2];
            if (i_end > end) {
              st.splice(i2, 1, end, st[i2 + 1], i_end);
            }
            i2 += 2;
            at = Math.min(end, i_end);
          }
          if (!style) {
            return;
          }
          if (overlay2.opaque) {
            st.splice(start2, i2 - start2, end, "overlay " + style);
            i2 = start2 + 2;
          } else {
            for (; start2 < i2; start2 += 2) {
              var cur = st[start2 + 1];
              st[start2 + 1] = (cur ? cur + " " : "") + "overlay " + style;
            }
          }
        }, lineClasses);
        context.state = state;
        context.baseTokens = null;
        context.baseTokenPos = 1;
      };
      for (var o = 0; o < cm.state.overlays.length; ++o)
        loop2(o);
      return { styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null };
    }
    function getLineStyles(cm, line, updateFrontier) {
      if (!line.styles || line.styles[0] != cm.state.modeGen) {
        var context = getContextBefore(cm, lineNo(line));
        var resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state);
        var result = highlightLine(cm, line, context);
        if (resetState) {
          context.state = resetState;
        }
        line.stateAfter = context.save(!resetState);
        line.styles = result.styles;
        if (result.classes) {
          line.styleClasses = result.classes;
        } else if (line.styleClasses) {
          line.styleClasses = null;
        }
        if (updateFrontier === cm.doc.highlightFrontier) {
          cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier);
        }
      }
      return line.styles;
    }
    function getContextBefore(cm, n, precise) {
      var doc = cm.doc, display = cm.display;
      if (!doc.mode.startState) {
        return new Context(doc, true, n);
      }
      var start2 = findStartLine(cm, n, precise);
      var saved = start2 > doc.first && getLine(doc, start2 - 1).stateAfter;
      var context = saved ? Context.fromSaved(doc, saved, start2) : new Context(doc, startState(doc.mode), start2);
      doc.iter(start2, n, function(line) {
        processLine(cm, line.text, context);
        var pos = context.line;
        line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
        context.nextLine();
      });
      if (precise) {
        doc.modeFrontier = context.line;
      }
      return context;
    }
    function processLine(cm, text2, context, startAt) {
      var mode = cm.doc.mode;
      var stream = new StringStream(text2, cm.options.tabSize, context);
      stream.start = stream.pos = startAt || 0;
      if (text2 == "") {
        callBlankLine(mode, context.state);
      }
      while (!stream.eol()) {
        readToken(mode, stream, context.state);
        stream.start = stream.pos;
      }
    }
    function callBlankLine(mode, state) {
      if (mode.blankLine) {
        return mode.blankLine(state);
      }
      if (!mode.innerMode) {
        return;
      }
      var inner = innerMode(mode, state);
      if (inner.mode.blankLine) {
        return inner.mode.blankLine(inner.state);
      }
    }
    function readToken(mode, stream, state, inner) {
      for (var i2 = 0; i2 < 10; i2++) {
        if (inner) {
          inner[0] = innerMode(mode, state).mode;
        }
        var style = mode.token(stream, state);
        if (stream.pos > stream.start) {
          return style;
        }
      }
      throw new Error("Mode " + mode.name + " failed to advance stream.");
    }
    var Token = function(stream, type, state) {
      this.start = stream.start;
      this.end = stream.pos;
      this.string = stream.current();
      this.type = type || null;
      this.state = state;
    };
    function takeToken(cm, pos, precise, asArray) {
      var doc = cm.doc, mode = doc.mode, style;
      pos = clipPos(doc, pos);
      var line = getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise);
      var stream = new StringStream(line.text, cm.options.tabSize, context), tokens;
      if (asArray) {
        tokens = [];
      }
      while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
        stream.start = stream.pos;
        style = readToken(mode, stream, context.state);
        if (asArray) {
          tokens.push(new Token(stream, style, copyState(doc.mode, context.state)));
        }
      }
      return asArray ? tokens : new Token(stream, style, context.state);
    }
    function extractLineClasses(type, output) {
      if (type) {
        for (; ; ) {
          var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
          if (!lineClass) {
            break;
          }
          type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
          var prop2 = lineClass[1] ? "bgClass" : "textClass";
          if (output[prop2] == null) {
            output[prop2] = lineClass[2];
          } else if (!new RegExp("(?:^|\\s)" + lineClass[2] + "(?:$|\\s)").test(output[prop2])) {
            output[prop2] += " " + lineClass[2];
          }
        }
      }
      return type;
    }
    function runMode(cm, text2, mode, context, f, lineClasses, forceToEnd) {
      var flattenSpans = mode.flattenSpans;
      if (flattenSpans == null) {
        flattenSpans = cm.options.flattenSpans;
      }
      var curStart = 0, curStyle = null;
      var stream = new StringStream(text2, cm.options.tabSize, context), style;
      var inner = cm.options.addModeClass && [null];
      if (text2 == "") {
        extractLineClasses(callBlankLine(mode, context.state), lineClasses);
      }
      while (!stream.eol()) {
        if (stream.pos > cm.options.maxHighlightLength) {
          flattenSpans = false;
          if (forceToEnd) {
            processLine(cm, text2, context, stream.pos);
          }
          stream.pos = text2.length;
          style = null;
        } else {
          style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
        }
        if (inner) {
          var mName = inner[0].name;
          if (mName) {
            style = "m-" + (style ? mName + " " + style : mName);
          }
        }
        if (!flattenSpans || curStyle != style) {
          while (curStart < stream.start) {
            curStart = Math.min(stream.start, curStart + 5e3);
            f(curStart, curStyle);
          }
          curStyle = style;
        }
        stream.start = stream.pos;
      }
      while (curStart < stream.pos) {
        var pos = Math.min(stream.pos, curStart + 5e3);
        f(pos, curStyle);
        curStart = pos;
      }
    }
    function findStartLine(cm, n, precise) {
      var minindent, minline, doc = cm.doc;
      var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1e3 : 100);
      for (var search = n; search > lim; --search) {
        if (search <= doc.first) {
          return doc.first;
        }
        var line = getLine(doc, search - 1), after = line.stateAfter;
        if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier)) {
          return search;
        }
        var indented = countColumn(line.text, null, cm.options.tabSize);
        if (minline == null || minindent > indented) {
          minline = search - 1;
          minindent = indented;
        }
      }
      return minline;
    }
    function retreatFrontier(doc, n) {
      doc.modeFrontier = Math.min(doc.modeFrontier, n);
      if (doc.highlightFrontier < n - 10) {
        return;
      }
      var start2 = doc.first;
      for (var line = n - 1; line > start2; line--) {
        var saved = getLine(doc, line).stateAfter;
        if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
          start2 = line + 1;
          break;
        }
      }
      doc.highlightFrontier = Math.min(doc.highlightFrontier, start2);
    }
    var sawReadOnlySpans = false, sawCollapsedSpans = false;
    function seeReadOnlySpans() {
      sawReadOnlySpans = true;
    }
    function seeCollapsedSpans() {
      sawCollapsedSpans = true;
    }
    function MarkedSpan(marker, from, to) {
      this.marker = marker;
      this.from = from;
      this.to = to;
    }
    function getMarkedSpanFor(spans, marker) {
      if (spans) {
        for (var i2 = 0; i2 < spans.length; ++i2) {
          var span = spans[i2];
          if (span.marker == marker) {
            return span;
          }
        }
      }
    }
    function removeMarkedSpan(spans, span) {
      var r;
      for (var i2 = 0; i2 < spans.length; ++i2) {
        if (spans[i2] != span) {
          (r || (r = [])).push(spans[i2]);
        }
      }
      return r;
    }
    function addMarkedSpan(line, span, op) {
      var inThisOp = op && window.WeakSet && (op.markedSpans || (op.markedSpans = new WeakSet()));
      if (inThisOp && inThisOp.has(line.markedSpans)) {
        line.markedSpans.push(span);
      } else {
        line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
        if (inThisOp) {
          inThisOp.add(line.markedSpans);
        }
      }
      span.marker.attachLine(line);
    }
    function markedSpansBefore(old, startCh, isInsert) {
      var nw;
      if (old) {
        for (var i2 = 0; i2 < old.length; ++i2) {
          var span = old[i2], marker = span.marker;
          var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
          if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
            var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
            (nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
          }
        }
      }
      return nw;
    }
    function markedSpansAfter(old, endCh, isInsert) {
      var nw;
      if (old) {
        for (var i2 = 0; i2 < old.length; ++i2) {
          var span = old[i2], marker = span.marker;
          var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
          if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
            var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
            (nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh, span.to == null ? null : span.to - endCh));
          }
        }
      }
      return nw;
    }
    function stretchSpansOverChange(doc, change) {
      if (change.full) {
        return null;
      }
      var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
      var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
      if (!oldFirst && !oldLast) {
        return null;
      }
      var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0;
      var first = markedSpansBefore(oldFirst, startCh, isInsert);
      var last = markedSpansAfter(oldLast, endCh, isInsert);
      var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
      if (first) {
        for (var i2 = 0; i2 < first.length; ++i2) {
          var span = first[i2];
          if (span.to == null) {
            var found = getMarkedSpanFor(last, span.marker);
            if (!found) {
              span.to = startCh;
            } else if (sameLine) {
              span.to = found.to == null ? null : found.to + offset;
            }
          }
        }
      }
      if (last) {
        for (var i$12 = 0; i$12 < last.length; ++i$12) {
          var span$1 = last[i$12];
          if (span$1.to != null) {
            span$1.to += offset;
          }
          if (span$1.from == null) {
            var found$1 = getMarkedSpanFor(first, span$1.marker);
            if (!found$1) {
              span$1.from = offset;
              if (sameLine) {
                (first || (first = [])).push(span$1);
              }
            }
          } else {
            span$1.from += offset;
            if (sameLine) {
              (first || (first = [])).push(span$1);
            }
          }
        }
      }
      if (first) {
        first = clearEmptySpans(first);
      }
      if (last && last != first) {
        last = clearEmptySpans(last);
      }
      var newMarkers = [first];
      if (!sameLine) {
        var gap = change.text.length - 2, gapMarkers;
        if (gap > 0 && first) {
          for (var i$22 = 0; i$22 < first.length; ++i$22) {
            if (first[i$22].to == null) {
              (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$22].marker, null, null));
            }
          }
        }
        for (var i$3 = 0; i$3 < gap; ++i$3) {
          newMarkers.push(gapMarkers);
        }
        newMarkers.push(last);
      }
      return newMarkers;
    }
    function clearEmptySpans(spans) {
      for (var i2 = 0; i2 < spans.length; ++i2) {
        var span = spans[i2];
        if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false) {
          spans.splice(i2--, 1);
        }
      }
      if (!spans.length) {
        return null;
      }
      return spans;
    }
    function removeReadOnlyRanges(doc, from, to) {
      var markers = null;
      doc.iter(from.line, to.line + 1, function(line) {
        if (line.markedSpans) {
          for (var i3 = 0; i3 < line.markedSpans.length; ++i3) {
            var mark = line.markedSpans[i3].marker;
            if (mark.readOnly && (!markers || indexOf(markers, mark) == -1)) {
              (markers || (markers = [])).push(mark);
            }
          }
        }
      });
      if (!markers) {
        return null;
      }
      var parts = [{ from, to }];
      for (var i2 = 0; i2 < markers.length; ++i2) {
        var mk = markers[i2], m = mk.find(0);
        for (var j = 0; j < parts.length; ++j) {
          var p = parts[j];
          if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) {
            continue;
          }
          var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to);
          if (dfrom < 0 || !mk.inclusiveLeft && !dfrom) {
            newParts.push({ from: p.from, to: m.from });
          }
          if (dto > 0 || !mk.inclusiveRight && !dto) {
            newParts.push({ from: m.to, to: p.to });
          }
          parts.splice.apply(parts, newParts);
          j += newParts.length - 3;
        }
      }
      return parts;
    }
    function detachMarkedSpans(line) {
      var spans = line.markedSpans;
      if (!spans) {
        return;
      }
      for (var i2 = 0; i2 < spans.length; ++i2) {
        spans[i2].marker.detachLine(line);
      }
      line.markedSpans = null;
    }
    function attachMarkedSpans(line, spans) {
      if (!spans) {
        return;
      }
      for (var i2 = 0; i2 < spans.length; ++i2) {
        spans[i2].marker.attachLine(line);
      }
      line.markedSpans = spans;
    }
    function extraLeft(marker) {
      return marker.inclusiveLeft ? -1 : 0;
    }
    function extraRight(marker) {
      return marker.inclusiveRight ? 1 : 0;
    }
    function compareCollapsedMarkers(a, b) {
      var lenDiff = a.lines.length - b.lines.length;
      if (lenDiff != 0) {
        return lenDiff;
      }
      var aPos = a.find(), bPos = b.find();
      var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
      if (fromCmp) {
        return -fromCmp;
      }
      var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
      if (toCmp) {
        return toCmp;
      }
      return b.id - a.id;
    }
    function collapsedSpanAtSide(line, start2) {
      var sps = sawCollapsedSpans && line.markedSpans, found;
      if (sps) {
        for (var sp = void 0, i2 = 0; i2 < sps.length; ++i2) {
          sp = sps[i2];
          if (sp.marker.collapsed && (start2 ? sp.from : sp.to) == null && (!found || compareCollapsedMarkers(found, sp.marker) < 0)) {
            found = sp.marker;
          }
        }
      }
      return found;
    }
    function collapsedSpanAtStart(line) {
      return collapsedSpanAtSide(line, true);
    }
    function collapsedSpanAtEnd(line) {
      return collapsedSpanAtSide(line, false);
    }
    function collapsedSpanAround(line, ch) {
      var sps = sawCollapsedSpans && line.markedSpans, found;
      if (sps) {
        for (var i2 = 0; i2 < sps.length; ++i2) {
          var sp = sps[i2];
          if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) && (!found || compareCollapsedMarkers(found, sp.marker) < 0)) {
            found = sp.marker;
          }
        }
      }
      return found;
    }
    function conflictingCollapsedRange(doc, lineNo2, from, to, marker) {
      var line = getLine(doc, lineNo2);
      var sps = sawCollapsedSpans && line.markedSpans;
      if (sps) {
        for (var i2 = 0; i2 < sps.length; ++i2) {
          var sp = sps[i2];
          if (!sp.marker.collapsed) {
            continue;
          }
          var found = sp.marker.find(0);
          var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
          var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
          if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) {
            continue;
          }
          if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) || fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0)) {
            return true;
          }
        }
      }
    }
    function visualLine(line) {
      var merged;
      while (merged = collapsedSpanAtStart(line)) {
        line = merged.find(-1, true).line;
      }
      return line;
    }
    function visualLineEnd(line) {
      var merged;
      while (merged = collapsedSpanAtEnd(line)) {
        line = merged.find(1, true).line;
      }
      return line;
    }
    function visualLineContinued(line) {
      var merged, lines;
      while (merged = collapsedSpanAtEnd(line)) {
        line = merged.find(1, true).line;
        (lines || (lines = [])).push(line);
      }
      return lines;
    }
    function visualLineNo(doc, lineN) {
      var line = getLine(doc, lineN), vis = visualLine(line);
      if (line == vis) {
        return lineN;
      }
      return lineNo(vis);
    }
    function visualLineEndNo(doc, lineN) {
      if (lineN > doc.lastLine()) {
        return lineN;
      }
      var line = getLine(doc, lineN), merged;
      if (!lineIsHidden(doc, line)) {
        return lineN;
      }
      while (merged = collapsedSpanAtEnd(line)) {
        line = merged.find(1, true).line;
      }
      return lineNo(line) + 1;
    }
    function lineIsHidden(doc, line) {
      var sps = sawCollapsedSpans && line.markedSpans;
      if (sps) {
        for (var sp = void 0, i2 = 0; i2 < sps.length; ++i2) {
          sp = sps[i2];
          if (!sp.marker.collapsed) {
            continue;
          }
          if (sp.from == null) {
            return true;
          }
          if (sp.marker.widgetNode) {
            continue;
          }
          if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp)) {
            return true;
          }
        }
      }
    }
    function lineIsHiddenInner(doc, line, span) {
      if (span.to == null) {
        var end = span.marker.find(1, true);
        return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker));
      }
      if (span.marker.inclusiveRight && span.to == line.text.length) {
        return true;
      }
      for (var sp = void 0, i2 = 0; i2 < line.markedSpans.length; ++i2) {
        sp = line.markedSpans[i2];
        if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to && (sp.to == null || sp.to != span.from) && (sp.marker.inclusiveLeft || span.marker.inclusiveRight) && lineIsHiddenInner(doc, line, sp)) {
          return true;
        }
      }
    }
    function heightAtLine(lineObj) {
      lineObj = visualLine(lineObj);
      var h = 0, chunk = lineObj.parent;
      for (var i2 = 0; i2 < chunk.lines.length; ++i2) {
        var line = chunk.lines[i2];
        if (line == lineObj) {
          break;
        } else {
          h += line.height;
        }
      }
      for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
        for (var i$12 = 0; i$12 < p.children.length; ++i$12) {
          var cur = p.children[i$12];
          if (cur == chunk) {
            break;
          } else {
            h += cur.height;
          }
        }
      }
      return h;
    }
    function lineLength(line) {
      if (line.height == 0) {
        return 0;
      }
      var len = line.text.length, merged, cur = line;
      while (merged = collapsedSpanAtStart(cur)) {
        var found = merged.find(0, true);
        cur = found.from.line;
        len += found.from.ch - found.to.ch;
      }
      cur = line;
      while (merged = collapsedSpanAtEnd(cur)) {
        var found$1 = merged.find(0, true);
        len -= cur.text.length - found$1.from.ch;
        cur = found$1.to.line;
        len += cur.text.length - found$1.to.ch;
      }
      return len;
    }
    function findMaxLine(cm) {
      var d = cm.display, doc = cm.doc;
      d.maxLine = getLine(doc, doc.first);
      d.maxLineLength = lineLength(d.maxLine);
      d.maxLineChanged = true;
      doc.iter(function(line) {
        var len = lineLength(line);
        if (len > d.maxLineLength) {
          d.maxLineLength = len;
          d.maxLine = line;
        }
      });
    }
    var Line = function(text2, markedSpans, estimateHeight2) {
      this.text = text2;
      attachMarkedSpans(this, markedSpans);
      this.height = estimateHeight2 ? estimateHeight2(this) : 1;
    };
    Line.prototype.lineNo = function() {
      return lineNo(this);
    };
    eventMixin(Line);
    function updateLine(line, text2, markedSpans, estimateHeight2) {
      line.text = text2;
      if (line.stateAfter) {
        line.stateAfter = null;
      }
      if (line.styles) {
        line.styles = null;
      }
      if (line.order != null) {
        line.order = null;
      }
      detachMarkedSpans(line);
      attachMarkedSpans(line, markedSpans);
      var estHeight = estimateHeight2 ? estimateHeight2(line) : 1;
      if (estHeight != line.height) {
        updateLineHeight(line, estHeight);
      }
    }
    function cleanUpLine(line) {
      line.parent = null;
      detachMarkedSpans(line);
    }
    var styleToClassCache = {}, styleToClassCacheWithMode = {};
    function interpretTokenStyle(style, options) {
      if (!style || /^\s*$/.test(style)) {
        return null;
      }
      var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
      return cache[style] || (cache[style] = style.replace(/\S+/g, "cm-$&"));
    }
    function buildLineContent(cm, lineView) {
      var content = eltP("span", null, null, webkit ? "padding-right: .1px" : null);
      var builder = {
        pre: eltP("pre", [content], "CodeMirror-line"),
        content,
        col: 0,
        pos: 0,
        cm,
        trailingSpace: false,
        splitSpaces: cm.getOption("lineWrapping")
      };
      lineView.measure = {};
      for (var i2 = 0; i2 <= (lineView.rest ? lineView.rest.length : 0); i2++) {
        var line = i2 ? lineView.rest[i2 - 1] : lineView.line, order = void 0;
        builder.pos = 0;
        builder.addToken = buildToken;
        if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction))) {
          builder.addToken = buildTokenBadBidi(builder.addToken, order);
        }
        builder.map = [];
        var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
        insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
        if (line.styleClasses) {
          if (line.styleClasses.bgClass) {
            builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "");
          }
          if (line.styleClasses.textClass) {
            builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "");
          }
        }
        if (builder.map.length == 0) {
          builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure)));
        }
        if (i2 == 0) {
          lineView.measure.map = builder.map;
          lineView.measure.cache = {};
        } else {
          (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);
          (lineView.measure.caches || (lineView.measure.caches = [])).push({});
        }
      }
      if (webkit) {
        var last = builder.content.lastChild;
        if (/\bcm-tab\b/.test(last.className) || last.querySelector && last.querySelector(".cm-tab")) {
          builder.content.className = "cm-tab-wrap-hack";
        }
      }
      signal(cm, "renderLine", cm, lineView.line, builder.pre);
      if (builder.pre.className) {
        builder.textClass = joinClasses(builder.pre.className, builder.textClass || "");
      }
      return builder;
    }
    function defaultSpecialCharPlaceholder(ch) {
      var token = elt("span", "\u2022", "cm-invalidchar");
      token.title = "\\u" + ch.charCodeAt(0).toString(16);
      token.setAttribute("aria-label", token.title);
      return token;
    }
    function buildToken(builder, text2, style, startStyle, endStyle, css, attributes) {
      if (!text2) {
        return;
      }
      var displayText = builder.splitSpaces ? splitSpaces(text2, builder.trailingSpace) : text2;
      var special = builder.cm.state.specialChars, mustWrap = false;
      var content;
      if (!special.test(text2)) {
        builder.col += text2.length;
        content = document.createTextNode(displayText);
        builder.map.push(builder.pos, builder.pos + text2.length, content);
        if (ie && ie_version < 9) {
          mustWrap = true;
        }
        builder.pos += text2.length;
      } else {
        content = document.createDocumentFragment();
        var pos = 0;
        while (true) {
          special.lastIndex = pos;
          var m = special.exec(text2);
          var skipped = m ? m.index - pos : text2.length - pos;
          if (skipped) {
            var txt = document.createTextNode(displayText.slice(pos, pos + skipped));
            if (ie && ie_version < 9) {
              content.appendChild(elt("span", [txt]));
            } else {
              content.appendChild(txt);
            }
            builder.map.push(builder.pos, builder.pos + skipped, txt);
            builder.col += skipped;
            builder.pos += skipped;
          }
          if (!m) {
            break;
          }
          pos += skipped + 1;
          var txt$1 = void 0;
          if (m[0] == "	") {
            var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
            txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
            txt$1.setAttribute("role", "presentation");
            txt$1.setAttribute("cm-text", "	");
            builder.col += tabWidth;
          } else if (m[0] == "\r" || m[0] == "\n") {
            txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "\u240D" : "\u2424", "cm-invalidchar"));
            txt$1.setAttribute("cm-text", m[0]);
            builder.col += 1;
          } else {
            txt$1 = builder.cm.options.specialCharPlaceholder(m[0]);
            txt$1.setAttribute("cm-text", m[0]);
            if (ie && ie_version < 9) {
              content.appendChild(elt("span", [txt$1]));
            } else {
              content.appendChild(txt$1);
            }
            builder.col += 1;
          }
          builder.map.push(builder.pos, builder.pos + 1, txt$1);
          builder.pos++;
        }
      }
      builder.trailingSpace = displayText.charCodeAt(text2.length - 1) == 32;
      if (style || startStyle || endStyle || mustWrap || css || attributes) {
        var fullStyle = style || "";
        if (startStyle) {
          fullStyle += startStyle;
        }
        if (endStyle) {
          fullStyle += endStyle;
        }
        var token = elt("span", [content], fullStyle, css);
        if (attributes) {
          for (var attr2 in attributes) {
            if (attributes.hasOwnProperty(attr2) && attr2 != "style" && attr2 != "class") {
              token.setAttribute(attr2, attributes[attr2]);
            }
          }
        }
        return builder.content.appendChild(token);
      }
      builder.content.appendChild(content);
    }
    function splitSpaces(text2, trailingBefore) {
      if (text2.length > 1 && !/  /.test(text2)) {
        return text2;
      }
      var spaceBefore = trailingBefore, result = "";
      for (var i2 = 0; i2 < text2.length; i2++) {
        var ch = text2.charAt(i2);
        if (ch == " " && spaceBefore && (i2 == text2.length - 1 || text2.charCodeAt(i2 + 1) == 32)) {
          ch = "\xA0";
        }
        result += ch;
        spaceBefore = ch == " ";
      }
      return result;
    }
    function buildTokenBadBidi(inner, order) {
      return function(builder, text2, style, startStyle, endStyle, css, attributes) {
        style = style ? style + " cm-force-border" : "cm-force-border";
        var start2 = builder.pos, end = start2 + text2.length;
        for (; ; ) {
          var part = void 0;
          for (var i2 = 0; i2 < order.length; i2++) {
            part = order[i2];
            if (part.to > start2 && part.from <= start2) {
              break;
            }
          }
          if (part.to >= end) {
            return inner(builder, text2, style, startStyle, endStyle, css, attributes);
          }
          inner(builder, text2.slice(0, part.to - start2), style, startStyle, null, css, attributes);
          startStyle = null;
          text2 = text2.slice(part.to - start2);
          start2 = part.to;
        }
      };
    }
    function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
      var widget = !ignoreWidget && marker.widgetNode;
      if (widget) {
        builder.map.push(builder.pos, builder.pos + size, widget);
      }
      if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
        if (!widget) {
          widget = builder.content.appendChild(document.createElement("span"));
        }
        widget.setAttribute("cm-marker", marker.id);
      }
      if (widget) {
        builder.cm.display.input.setUneditable(widget);
        builder.content.appendChild(widget);
      }
      builder.pos += size;
      builder.trailingSpace = false;
    }
    function insertLineContent(line, builder, styles) {
      var spans = line.markedSpans, allText = line.text, at = 0;
      if (!spans) {
        for (var i$12 = 1; i$12 < styles.length; i$12 += 2) {
          builder.addToken(builder, allText.slice(at, at = styles[i$12]), interpretTokenStyle(styles[i$12 + 1], builder.cm.options));
        }
        return;
      }
      var len = allText.length, pos = 0, i2 = 1, text2 = "", style, css;
      var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed, attributes;
      for (; ; ) {
        if (nextChange == pos) {
          spanStyle = spanEndStyle = spanStartStyle = css = "";
          attributes = null;
          collapsed = null;
          nextChange = Infinity;
          var foundBookmarks = [], endStyles = void 0;
          for (var j = 0; j < spans.length; ++j) {
            var sp = spans[j], m = sp.marker;
            if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
              foundBookmarks.push(m);
            } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
              if (sp.to != null && sp.to != pos && nextChange > sp.to) {
                nextChange = sp.to;
                spanEndStyle = "";
              }
              if (m.className) {
                spanStyle += " " + m.className;
              }
              if (m.css) {
                css = (css ? css + ";" : "") + m.css;
              }
              if (m.startStyle && sp.from == pos) {
                spanStartStyle += " " + m.startStyle;
              }
              if (m.endStyle && sp.to == nextChange) {
                (endStyles || (endStyles = [])).push(m.endStyle, sp.to);
              }
              if (m.title) {
                (attributes || (attributes = {})).title = m.title;
              }
              if (m.attributes) {
                for (var attr2 in m.attributes) {
                  (attributes || (attributes = {}))[attr2] = m.attributes[attr2];
                }
              }
              if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0)) {
                collapsed = sp;
              }
            } else if (sp.from > pos && nextChange > sp.from) {
              nextChange = sp.from;
            }
          }
          if (endStyles) {
            for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2) {
              if (endStyles[j$1 + 1] == nextChange) {
                spanEndStyle += " " + endStyles[j$1];
              }
            }
          }
          if (!collapsed || collapsed.from == pos) {
            for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2) {
              buildCollapsedSpan(builder, 0, foundBookmarks[j$2]);
            }
          }
          if (collapsed && (collapsed.from || 0) == pos) {
            buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos, collapsed.marker, collapsed.from == null);
            if (collapsed.to == null) {
              return;
            }
            if (collapsed.to == pos) {
              collapsed = false;
            }
          }
        }
        if (pos >= len) {
          break;
        }
        var upto = Math.min(len, nextChange);
        while (true) {
          if (text2) {
            var end = pos + text2.length;
            if (!collapsed) {
              var tokenText = end > upto ? text2.slice(0, upto - pos) : text2;
              builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle, spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", css, attributes);
            }
            if (end >= upto) {
              text2 = text2.slice(upto - pos);
              pos = upto;
              break;
            }
            pos = end;
            spanStartStyle = "";
          }
          text2 = allText.slice(at, at = styles[i2++]);
          style = interpretTokenStyle(styles[i2++], builder.cm.options);
        }
      }
    }
    function LineView(doc, line, lineN) {
      this.line = line;
      this.rest = visualLineContinued(line);
      this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
      this.node = this.text = null;
      this.hidden = lineIsHidden(doc, line);
    }
    function buildViewArray(cm, from, to) {
      var array = [], nextPos;
      for (var pos = from; pos < to; pos = nextPos) {
        var view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
        nextPos = pos + view.size;
        array.push(view);
      }
      return array;
    }
    var operationGroup = null;
    function pushOperation(op) {
      if (operationGroup) {
        operationGroup.ops.push(op);
      } else {
        op.ownsGroup = operationGroup = {
          ops: [op],
          delayedCallbacks: []
        };
      }
    }
    function fireCallbacksForOps(group) {
      var callbacks = group.delayedCallbacks, i2 = 0;
      do {
        for (; i2 < callbacks.length; i2++) {
          callbacks[i2].call(null);
        }
        for (var j = 0; j < group.ops.length; j++) {
          var op = group.ops[j];
          if (op.cursorActivityHandlers) {
            while (op.cursorActivityCalled < op.cursorActivityHandlers.length) {
              op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm);
            }
          }
        }
      } while (i2 < callbacks.length);
    }
    function finishOperation(op, endCb) {
      var group = op.ownsGroup;
      if (!group) {
        return;
      }
      try {
        fireCallbacksForOps(group);
      } finally {
        operationGroup = null;
        endCb(group);
      }
    }
    var orphanDelayedCallbacks = null;
    function signalLater(emitter, type) {
      var arr = getHandlers(emitter, type);
      if (!arr.length) {
        return;
      }
      var args = Array.prototype.slice.call(arguments, 2), list;
      if (operationGroup) {
        list = operationGroup.delayedCallbacks;
      } else if (orphanDelayedCallbacks) {
        list = orphanDelayedCallbacks;
      } else {
        list = orphanDelayedCallbacks = [];
        setTimeout(fireOrphanDelayed, 0);
      }
      var loop2 = function(i3) {
        list.push(function() {
          return arr[i3].apply(null, args);
        });
      };
      for (var i2 = 0; i2 < arr.length; ++i2)
        loop2(i2);
    }
    function fireOrphanDelayed() {
      var delayed = orphanDelayedCallbacks;
      orphanDelayedCallbacks = null;
      for (var i2 = 0; i2 < delayed.length; ++i2) {
        delayed[i2]();
      }
    }
    function updateLineForChanges(cm, lineView, lineN, dims) {
      for (var j = 0; j < lineView.changes.length; j++) {
        var type = lineView.changes[j];
        if (type == "text") {
          updateLineText(cm, lineView);
        } else if (type == "gutter") {
          updateLineGutter(cm, lineView, lineN, dims);
        } else if (type == "class") {
          updateLineClasses(cm, lineView);
        } else if (type == "widget") {
          updateLineWidgets(cm, lineView, dims);
        }
      }
      lineView.changes = null;
    }
    function ensureLineWrapped(lineView) {
      if (lineView.node == lineView.text) {
        lineView.node = elt("div", null, null, "position: relative");
        if (lineView.text.parentNode) {
          lineView.text.parentNode.replaceChild(lineView.node, lineView.text);
        }
        lineView.node.appendChild(lineView.text);
        if (ie && ie_version < 8) {
          lineView.node.style.zIndex = 2;
        }
      }
      return lineView.node;
    }
    function updateLineBackground(cm, lineView) {
      var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
      if (cls) {
        cls += " CodeMirror-linebackground";
      }
      if (lineView.background) {
        if (cls) {
          lineView.background.className = cls;
        } else {
          lineView.background.parentNode.removeChild(lineView.background);
          lineView.background = null;
        }
      } else if (cls) {
        var wrap = ensureLineWrapped(lineView);
        lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
        cm.display.input.setUneditable(lineView.background);
      }
    }
    function getLineContent(cm, lineView) {
      var ext = cm.display.externalMeasured;
      if (ext && ext.line == lineView.line) {
        cm.display.externalMeasured = null;
        lineView.measure = ext.measure;
        return ext.built;
      }
      return buildLineContent(cm, lineView);
    }
    function updateLineText(cm, lineView) {
      var cls = lineView.text.className;
      var built = getLineContent(cm, lineView);
      if (lineView.text == lineView.node) {
        lineView.node = built.pre;
      }
      lineView.text.parentNode.replaceChild(built.pre, lineView.text);
      lineView.text = built.pre;
      if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
        lineView.bgClass = built.bgClass;
        lineView.textClass = built.textClass;
        updateLineClasses(cm, lineView);
      } else if (cls) {
        lineView.text.className = cls;
      }
    }
    function updateLineClasses(cm, lineView) {
      updateLineBackground(cm, lineView);
      if (lineView.line.wrapClass) {
        ensureLineWrapped(lineView).className = lineView.line.wrapClass;
      } else if (lineView.node != lineView.text) {
        lineView.node.className = "";
      }
      var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
      lineView.text.className = textClass || "";
    }
    function updateLineGutter(cm, lineView, lineN, dims) {
      if (lineView.gutter) {
        lineView.node.removeChild(lineView.gutter);
        lineView.gutter = null;
      }
      if (lineView.gutterBackground) {
        lineView.node.removeChild(lineView.gutterBackground);
        lineView.gutterBackground = null;
      }
      if (lineView.line.gutterClass) {
        var wrap = ensureLineWrapped(lineView);
        lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass, "left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + dims.gutterTotalWidth + "px");
        cm.display.input.setUneditable(lineView.gutterBackground);
        wrap.insertBefore(lineView.gutterBackground, lineView.text);
      }
      var markers = lineView.line.gutterMarkers;
      if (cm.options.lineNumbers || markers) {
        var wrap$1 = ensureLineWrapped(lineView);
        var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", "left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px");
        gutterWrap.setAttribute("aria-hidden", "true");
        cm.display.input.setUneditable(gutterWrap);
        wrap$1.insertBefore(gutterWrap, lineView.text);
        if (lineView.line.gutterClass) {
          gutterWrap.className += " " + lineView.line.gutterClass;
        }
        if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"])) {
          lineView.lineNumber = gutterWrap.appendChild(elt("div", lineNumberFor(cm.options, lineN), "CodeMirror-linenumber CodeMirror-gutter-elt", "left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + cm.display.lineNumInnerWidth + "px"));
        }
        if (markers) {
          for (var k = 0; k < cm.display.gutterSpecs.length; ++k) {
            var id = cm.display.gutterSpecs[k].className, found = markers.hasOwnProperty(id) && markers[id];
            if (found) {
              gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt", "left: " + dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));
            }
          }
        }
      }
    }
    function updateLineWidgets(cm, lineView, dims) {
      if (lineView.alignable) {
        lineView.alignable = null;
      }
      var isWidget = classTest("CodeMirror-linewidget");
      for (var node = lineView.node.firstChild, next = void 0; node; node = next) {
        next = node.nextSibling;
        if (isWidget.test(node.className)) {
          lineView.node.removeChild(node);
        }
      }
      insertLineWidgets(cm, lineView, dims);
    }
    function buildLineElement(cm, lineView, lineN, dims) {
      var built = getLineContent(cm, lineView);
      lineView.text = lineView.node = built.pre;
      if (built.bgClass) {
        lineView.bgClass = built.bgClass;
      }
      if (built.textClass) {
        lineView.textClass = built.textClass;
      }
      updateLineClasses(cm, lineView);
      updateLineGutter(cm, lineView, lineN, dims);
      insertLineWidgets(cm, lineView, dims);
      return lineView.node;
    }
    function insertLineWidgets(cm, lineView, dims) {
      insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
      if (lineView.rest) {
        for (var i2 = 0; i2 < lineView.rest.length; i2++) {
          insertLineWidgetsFor(cm, lineView.rest[i2], lineView, dims, false);
        }
      }
    }
    function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
      if (!line.widgets) {
        return;
      }
      var wrap = ensureLineWrapped(lineView);
      for (var i2 = 0, ws = line.widgets; i2 < ws.length; ++i2) {
        var widget = ws[i2], node = elt("div", [widget.node], "CodeMirror-linewidget" + (widget.className ? " " + widget.className : ""));
        if (!widget.handleMouseEvents) {
          node.setAttribute("cm-ignore-events", "true");
        }
        positionLineWidget(widget, node, lineView, dims);
        cm.display.input.setUneditable(node);
        if (allowAbove && widget.above) {
          wrap.insertBefore(node, lineView.gutter || lineView.text);
        } else {
          wrap.appendChild(node);
        }
        signalLater(widget, "redraw");
      }
    }
    function positionLineWidget(widget, node, lineView, dims) {
      if (widget.noHScroll) {
        (lineView.alignable || (lineView.alignable = [])).push(node);
        var width = dims.wrapperWidth;
        node.style.left = dims.fixedPos + "px";
        if (!widget.coverGutter) {
          width -= dims.gutterTotalWidth;
          node.style.paddingLeft = dims.gutterTotalWidth + "px";
        }
        node.style.width = width + "px";
      }
      if (widget.coverGutter) {
        node.style.zIndex = 5;
        node.style.position = "relative";
        if (!widget.noHScroll) {
          node.style.marginLeft = -dims.gutterTotalWidth + "px";
        }
      }
    }
    function widgetHeight(widget) {
      if (widget.height != null) {
        return widget.height;
      }
      var cm = widget.doc.cm;
      if (!cm) {
        return 0;
      }
      if (!contains(document.body, widget.node)) {
        var parentStyle = "position: relative;";
        if (widget.coverGutter) {
          parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";
        }
        if (widget.noHScroll) {
          parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";
        }
        removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
      }
      return widget.height = widget.node.parentNode.offsetHeight;
    }
    function eventInWidget(display, e) {
      for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
        if (!n || n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true" || n.parentNode == display.sizer && n != display.mover) {
          return true;
        }
      }
    }
    function paddingTop(display) {
      return display.lineSpace.offsetTop;
    }
    function paddingVert(display) {
      return display.mover.offsetHeight - display.lineSpace.offsetHeight;
    }
    function paddingH(display) {
      if (display.cachedPaddingH) {
        return display.cachedPaddingH;
      }
      var e = removeChildrenAndAdd(display.measure, elt("pre", "x", "CodeMirror-line-like"));
      var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
      var data = { left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight) };
      if (!isNaN(data.left) && !isNaN(data.right)) {
        display.cachedPaddingH = data;
      }
      return data;
    }
    function scrollGap(cm) {
      return scrollerGap - cm.display.nativeBarWidth;
    }
    function displayWidth(cm) {
      return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;
    }
    function displayHeight(cm) {
      return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;
    }
    function ensureLineHeights(cm, lineView, rect) {
      var wrapping = cm.options.lineWrapping;
      var curWidth = wrapping && displayWidth(cm);
      if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
        var heights = lineView.measure.heights = [];
        if (wrapping) {
          lineView.measure.width = curWidth;
          var rects = lineView.text.firstChild.getClientRects();
          for (var i2 = 0; i2 < rects.length - 1; i2++) {
            var cur = rects[i2], next = rects[i2 + 1];
            if (Math.abs(cur.bottom - next.bottom) > 2) {
              heights.push((cur.bottom + next.top) / 2 - rect.top);
            }
          }
        }
        heights.push(rect.bottom - rect.top);
      }
    }
    function mapFromLineView(lineView, line, lineN) {
      if (lineView.line == line) {
        return { map: lineView.measure.map, cache: lineView.measure.cache };
      }
      for (var i2 = 0; i2 < lineView.rest.length; i2++) {
        if (lineView.rest[i2] == line) {
          return { map: lineView.measure.maps[i2], cache: lineView.measure.caches[i2] };
        }
      }
      for (var i$12 = 0; i$12 < lineView.rest.length; i$12++) {
        if (lineNo(lineView.rest[i$12]) > lineN) {
          return { map: lineView.measure.maps[i$12], cache: lineView.measure.caches[i$12], before: true };
        }
      }
    }
    function updateExternalMeasurement(cm, line) {
      line = visualLine(line);
      var lineN = lineNo(line);
      var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
      view.lineN = lineN;
      var built = view.built = buildLineContent(cm, view);
      view.text = built.pre;
      removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
      return view;
    }
    function measureChar(cm, line, ch, bias) {
      return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);
    }
    function findViewForLine(cm, lineN) {
      if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo) {
        return cm.display.view[findViewIndex(cm, lineN)];
      }
      var ext = cm.display.externalMeasured;
      if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size) {
        return ext;
      }
    }
    function prepareMeasureForLine(cm, line) {
      var lineN = lineNo(line);
      var view = findViewForLine(cm, lineN);
      if (view && !view.text) {
        view = null;
      } else if (view && view.changes) {
        updateLineForChanges(cm, view, lineN, getDimensions(cm));
        cm.curOp.forceUpdate = true;
      }
      if (!view) {
        view = updateExternalMeasurement(cm, line);
      }
      var info = mapFromLineView(view, line, lineN);
      return {
        line,
        view,
        rect: null,
        map: info.map,
        cache: info.cache,
        before: info.before,
        hasHeights: false
      };
    }
    function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
      if (prepared.before) {
        ch = -1;
      }
      var key = ch + (bias || ""), found;
      if (prepared.cache.hasOwnProperty(key)) {
        found = prepared.cache[key];
      } else {
        if (!prepared.rect) {
          prepared.rect = prepared.view.text.getBoundingClientRect();
        }
        if (!prepared.hasHeights) {
          ensureLineHeights(cm, prepared.view, prepared.rect);
          prepared.hasHeights = true;
        }
        found = measureCharInner(cm, prepared, ch, bias);
        if (!found.bogus) {
          prepared.cache[key] = found;
        }
      }
      return {
        left: found.left,
        right: found.right,
        top: varHeight ? found.rtop : found.top,
        bottom: varHeight ? found.rbottom : found.bottom
      };
    }
    var nullRect = { left: 0, right: 0, top: 0, bottom: 0 };
    function nodeAndOffsetInLineMap(map2, ch, bias) {
      var node, start2, end, collapse, mStart, mEnd;
      for (var i2 = 0; i2 < map2.length; i2 += 3) {
        mStart = map2[i2];
        mEnd = map2[i2 + 1];
        if (ch < mStart) {
          start2 = 0;
          end = 1;
          collapse = "left";
        } else if (ch < mEnd) {
          start2 = ch - mStart;
          end = start2 + 1;
        } else if (i2 == map2.length - 3 || ch == mEnd && map2[i2 + 3] > ch) {
          end = mEnd - mStart;
          start2 = end - 1;
          if (ch >= mEnd) {
            collapse = "right";
          }
        }
        if (start2 != null) {
          node = map2[i2 + 2];
          if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right")) {
            collapse = bias;
          }
          if (bias == "left" && start2 == 0) {
            while (i2 && map2[i2 - 2] == map2[i2 - 3] && map2[i2 - 1].insertLeft) {
              node = map2[(i2 -= 3) + 2];
              collapse = "left";
            }
          }
          if (bias == "right" && start2 == mEnd - mStart) {
            while (i2 < map2.length - 3 && map2[i2 + 3] == map2[i2 + 4] && !map2[i2 + 5].insertLeft) {
              node = map2[(i2 += 3) + 2];
              collapse = "right";
            }
          }
          break;
        }
      }
      return { node, start: start2, end, collapse, coverStart: mStart, coverEnd: mEnd };
    }
    function getUsefulRect(rects, bias) {
      var rect = nullRect;
      if (bias == "left") {
        for (var i2 = 0; i2 < rects.length; i2++) {
          if ((rect = rects[i2]).left != rect.right) {
            break;
          }
        }
      } else {
        for (var i$12 = rects.length - 1; i$12 >= 0; i$12--) {
          if ((rect = rects[i$12]).left != rect.right) {
            break;
          }
        }
      }
      return rect;
    }
    function measureCharInner(cm, prepared, ch, bias) {
      var place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
      var node = place.node, start2 = place.start, end = place.end, collapse = place.collapse;
      var rect;
      if (node.nodeType == 3) {
        for (var i$12 = 0; i$12 < 4; i$12++) {
          while (start2 && isExtendingChar(prepared.line.text.charAt(place.coverStart + start2))) {
            --start2;
          }
          while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) {
            ++end;
          }
          if (ie && ie_version < 9 && start2 == 0 && end == place.coverEnd - place.coverStart) {
            rect = node.parentNode.getBoundingClientRect();
          } else {
            rect = getUsefulRect(range(node, start2, end).getClientRects(), bias);
          }
          if (rect.left || rect.right || start2 == 0) {
            break;
          }
          end = start2;
          start2 = start2 - 1;
          collapse = "right";
        }
        if (ie && ie_version < 11) {
          rect = maybeUpdateRectForZooming(cm.display.measure, rect);
        }
      } else {
        if (start2 > 0) {
          collapse = bias = "right";
        }
        var rects;
        if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1) {
          rect = rects[bias == "right" ? rects.length - 1 : 0];
        } else {
          rect = node.getBoundingClientRect();
        }
      }
      if (ie && ie_version < 9 && !start2 && (!rect || !rect.left && !rect.right)) {
        var rSpan = node.parentNode.getClientRects()[0];
        if (rSpan) {
          rect = { left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom };
        } else {
          rect = nullRect;
        }
      }
      var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
      var mid = (rtop + rbot) / 2;
      var heights = prepared.view.measure.heights;
      var i2 = 0;
      for (; i2 < heights.length - 1; i2++) {
        if (mid < heights[i2]) {
          break;
        }
      }
      var top = i2 ? heights[i2 - 1] : 0, bot = heights[i2];
      var result = {
        left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
        right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
        top,
        bottom: bot
      };
      if (!rect.left && !rect.right) {
        result.bogus = true;
      }
      if (!cm.options.singleCursorHeightPerLine) {
        result.rtop = rtop;
        result.rbottom = rbot;
      }
      return result;
    }
    function maybeUpdateRectForZooming(measure, rect) {
      if (!window.screen || screen.logicalXDPI == null || screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure)) {
        return rect;
      }
      var scaleX = screen.logicalXDPI / screen.deviceXDPI;
      var scaleY = screen.logicalYDPI / screen.deviceYDPI;
      return {
        left: rect.left * scaleX,
        right: rect.right * scaleX,
        top: rect.top * scaleY,
        bottom: rect.bottom * scaleY
      };
    }
    function clearLineMeasurementCacheFor(lineView) {
      if (lineView.measure) {
        lineView.measure.cache = {};
        lineView.measure.heights = null;
        if (lineView.rest) {
          for (var i2 = 0; i2 < lineView.rest.length; i2++) {
            lineView.measure.caches[i2] = {};
          }
        }
      }
    }
    function clearLineMeasurementCache(cm) {
      cm.display.externalMeasure = null;
      removeChildren(cm.display.lineMeasure);
      for (var i2 = 0; i2 < cm.display.view.length; i2++) {
        clearLineMeasurementCacheFor(cm.display.view[i2]);
      }
    }
    function clearCaches(cm) {
      clearLineMeasurementCache(cm);
      cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
      if (!cm.options.lineWrapping) {
        cm.display.maxLineChanged = true;
      }
      cm.display.lineNumChars = null;
    }
    function pageScrollX() {
      if (chrome && android) {
        return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft));
      }
      return window.pageXOffset || (document.documentElement || document.body).scrollLeft;
    }
    function pageScrollY() {
      if (chrome && android) {
        return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop));
      }
      return window.pageYOffset || (document.documentElement || document.body).scrollTop;
    }
    function widgetTopHeight(lineObj) {
      var height = 0;
      if (lineObj.widgets) {
        for (var i2 = 0; i2 < lineObj.widgets.length; ++i2) {
          if (lineObj.widgets[i2].above) {
            height += widgetHeight(lineObj.widgets[i2]);
          }
        }
      }
      return height;
    }
    function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
      if (!includeWidgets) {
        var height = widgetTopHeight(lineObj);
        rect.top += height;
        rect.bottom += height;
      }
      if (context == "line") {
        return rect;
      }
      if (!context) {
        context = "local";
      }
      var yOff = heightAtLine(lineObj);
      if (context == "local") {
        yOff += paddingTop(cm.display);
      } else {
        yOff -= cm.display.viewOffset;
      }
      if (context == "page" || context == "window") {
        var lOff = cm.display.lineSpace.getBoundingClientRect();
        yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
        var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
        rect.left += xOff;
        rect.right += xOff;
      }
      rect.top += yOff;
      rect.bottom += yOff;
      return rect;
    }
    function fromCoordSystem(cm, coords, context) {
      if (context == "div") {
        return coords;
      }
      var left = coords.left, top = coords.top;
      if (context == "page") {
        left -= pageScrollX();
        top -= pageScrollY();
      } else if (context == "local" || !context) {
        var localBox = cm.display.sizer.getBoundingClientRect();
        left += localBox.left;
        top += localBox.top;
      }
      var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
      return { left: left - lineSpaceBox.left, top: top - lineSpaceBox.top };
    }
    function charCoords(cm, pos, context, lineObj, bias) {
      if (!lineObj) {
        lineObj = getLine(cm.doc, pos.line);
      }
      return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);
    }
    function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
      lineObj = lineObj || getLine(cm.doc, pos.line);
      if (!preparedMeasure) {
        preparedMeasure = prepareMeasureForLine(cm, lineObj);
      }
      function get(ch2, right) {
        var m = measureCharPrepared(cm, preparedMeasure, ch2, right ? "right" : "left", varHeight);
        if (right) {
          m.left = m.right;
        } else {
          m.right = m.left;
        }
        return intoCoordSystem(cm, lineObj, m, context);
      }
      var order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
      if (ch >= lineObj.text.length) {
        ch = lineObj.text.length;
        sticky = "before";
      } else if (ch <= 0) {
        ch = 0;
        sticky = "after";
      }
      if (!order) {
        return get(sticky == "before" ? ch - 1 : ch, sticky == "before");
      }
      function getBidi(ch2, partPos2, invert) {
        var part = order[partPos2], right = part.level == 1;
        return get(invert ? ch2 - 1 : ch2, right != invert);
      }
      var partPos = getBidiPartAt(order, ch, sticky);
      var other = bidiOther;
      var val = getBidi(ch, partPos, sticky == "before");
      if (other != null) {
        val.other = getBidi(ch, other, sticky != "before");
      }
      return val;
    }
    function estimateCoords(cm, pos) {
      var left = 0;
      pos = clipPos(cm.doc, pos);
      if (!cm.options.lineWrapping) {
        left = charWidth(cm.display) * pos.ch;
      }
      var lineObj = getLine(cm.doc, pos.line);
      var top = heightAtLine(lineObj) + paddingTop(cm.display);
      return { left, right: left, top, bottom: top + lineObj.height };
    }
    function PosWithInfo(line, ch, sticky, outside, xRel) {
      var pos = Pos(line, ch, sticky);
      pos.xRel = xRel;
      if (outside) {
        pos.outside = outside;
      }
      return pos;
    }
    function coordsChar(cm, x, y) {
      var doc = cm.doc;
      y += cm.display.viewOffset;
      if (y < 0) {
        return PosWithInfo(doc.first, 0, null, -1, -1);
      }
      var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
      if (lineN > last) {
        return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, 1, 1);
      }
      if (x < 0) {
        x = 0;
      }
      var lineObj = getLine(doc, lineN);
      for (; ; ) {
        var found = coordsCharInner(cm, lineObj, lineN, x, y);
        var collapsed = collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 || found.outside > 0 ? 1 : 0));
        if (!collapsed) {
          return found;
        }
        var rangeEnd = collapsed.find(1);
        if (rangeEnd.line == lineN) {
          return rangeEnd;
        }
        lineObj = getLine(doc, lineN = rangeEnd.line);
      }
    }
    function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
      y -= widgetTopHeight(lineObj);
      var end = lineObj.text.length;
      var begin = findFirst(function(ch) {
        return measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y;
      }, end, 0);
      end = findFirst(function(ch) {
        return measureCharPrepared(cm, preparedMeasure, ch).top > y;
      }, begin, end);
      return { begin, end };
    }
    function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
      if (!preparedMeasure) {
        preparedMeasure = prepareMeasureForLine(cm, lineObj);
      }
      var targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
      return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop);
    }
    function boxIsAfter(box, x, y, left) {
      return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x;
    }
    function coordsCharInner(cm, lineObj, lineNo2, x, y) {
      y -= heightAtLine(lineObj);
      var preparedMeasure = prepareMeasureForLine(cm, lineObj);
      var widgetHeight2 = widgetTopHeight(lineObj);
      var begin = 0, end = lineObj.text.length, ltr = true;
      var order = getOrder(lineObj, cm.doc.direction);
      if (order) {
        var part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)(cm, lineObj, lineNo2, preparedMeasure, order, x, y);
        ltr = part.level != 1;
        begin = ltr ? part.from : part.to - 1;
        end = ltr ? part.to : part.from - 1;
      }
      var chAround = null, boxAround = null;
      var ch = findFirst(function(ch2) {
        var box = measureCharPrepared(cm, preparedMeasure, ch2);
        box.top += widgetHeight2;
        box.bottom += widgetHeight2;
        if (!boxIsAfter(box, x, y, false)) {
          return false;
        }
        if (box.top <= y && box.left <= x) {
          chAround = ch2;
          boxAround = box;
        }
        return true;
      }, begin, end);
      var baseX, sticky, outside = false;
      if (boxAround) {
        var atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
        ch = chAround + (atStart ? 0 : 1);
        sticky = atStart ? "after" : "before";
        baseX = atLeft ? boxAround.left : boxAround.right;
      } else {
        if (!ltr && (ch == end || ch == begin)) {
          ch++;
        }
        sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" : measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight2 <= y == ltr ? "after" : "before";
        var coords = cursorCoords(cm, Pos(lineNo2, ch, sticky), "line", lineObj, preparedMeasure);
        baseX = coords.left;
        outside = y < coords.top ? -1 : y >= coords.bottom ? 1 : 0;
      }
      ch = skipExtendingChars(lineObj.text, ch, 1);
      return PosWithInfo(lineNo2, ch, sticky, outside, x - baseX);
    }
    function coordsBidiPart(cm, lineObj, lineNo2, preparedMeasure, order, x, y) {
      var index = findFirst(function(i2) {
        var part2 = order[i2], ltr2 = part2.level != 1;
        return boxIsAfter(cursorCoords(cm, Pos(lineNo2, ltr2 ? part2.to : part2.from, ltr2 ? "before" : "after"), "line", lineObj, preparedMeasure), x, y, true);
      }, 0, order.length - 1);
      var part = order[index];
      if (index > 0) {
        var ltr = part.level != 1;
        var start2 = cursorCoords(cm, Pos(lineNo2, ltr ? part.from : part.to, ltr ? "after" : "before"), "line", lineObj, preparedMeasure);
        if (boxIsAfter(start2, x, y, true) && start2.top > y) {
          part = order[index - 1];
        }
      }
      return part;
    }
    function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
      var ref = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
      var begin = ref.begin;
      var end = ref.end;
      if (/\s/.test(lineObj.text.charAt(end - 1))) {
        end--;
      }
      var part = null, closestDist = null;
      for (var i2 = 0; i2 < order.length; i2++) {
        var p = order[i2];
        if (p.from >= end || p.to <= begin) {
          continue;
        }
        var ltr = p.level != 1;
        var endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
        var dist = endX < x ? x - endX + 1e9 : endX - x;
        if (!part || closestDist > dist) {
          part = p;
          closestDist = dist;
        }
      }
      if (!part) {
        part = order[order.length - 1];
      }
      if (part.from < begin) {
        part = { from: begin, to: part.to, level: part.level };
      }
      if (part.to > end) {
        part = { from: part.from, to: end, level: part.level };
      }
      return part;
    }
    var measureText;
    function textHeight(display) {
      if (display.cachedTextHeight != null) {
        return display.cachedTextHeight;
      }
      if (measureText == null) {
        measureText = elt("pre", null, "CodeMirror-line-like");
        for (var i2 = 0; i2 < 49; ++i2) {
          measureText.appendChild(document.createTextNode("x"));
          measureText.appendChild(elt("br"));
        }
        measureText.appendChild(document.createTextNode("x"));
      }
      removeChildrenAndAdd(display.measure, measureText);
      var height = measureText.offsetHeight / 50;
      if (height > 3) {
        display.cachedTextHeight = height;
      }
      removeChildren(display.measure);
      return height || 1;
    }
    function charWidth(display) {
      if (display.cachedCharWidth != null) {
        return display.cachedCharWidth;
      }
      var anchor = elt("span", "xxxxxxxxxx");
      var pre = elt("pre", [anchor], "CodeMirror-line-like");
      removeChildrenAndAdd(display.measure, pre);
      var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
      if (width > 2) {
        display.cachedCharWidth = width;
      }
      return width || 10;
    }
    function getDimensions(cm) {
      var d = cm.display, left = {}, width = {};
      var gutterLeft = d.gutters.clientLeft;
      for (var n = d.gutters.firstChild, i2 = 0; n; n = n.nextSibling, ++i2) {
        var id = cm.display.gutterSpecs[i2].className;
        left[id] = n.offsetLeft + n.clientLeft + gutterLeft;
        width[id] = n.clientWidth;
      }
      return {
        fixedPos: compensateForHScroll(d),
        gutterTotalWidth: d.gutters.offsetWidth,
        gutterLeft: left,
        gutterWidth: width,
        wrapperWidth: d.wrapper.clientWidth
      };
    }
    function compensateForHScroll(display) {
      return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;
    }
    function estimateHeight(cm) {
      var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
      var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
      return function(line) {
        if (lineIsHidden(cm.doc, line)) {
          return 0;
        }
        var widgetsHeight = 0;
        if (line.widgets) {
          for (var i2 = 0; i2 < line.widgets.length; i2++) {
            if (line.widgets[i2].height) {
              widgetsHeight += line.widgets[i2].height;
            }
          }
        }
        if (wrapping) {
          return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;
        } else {
          return widgetsHeight + th;
        }
      };
    }
    function estimateLineHeights(cm) {
      var doc = cm.doc, est = estimateHeight(cm);
      doc.iter(function(line) {
        var estHeight = est(line);
        if (estHeight != line.height) {
          updateLineHeight(line, estHeight);
        }
      });
    }
    function posFromMouse(cm, e, liberal, forRect) {
      var display = cm.display;
      if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") {
        return null;
      }
      var x, y, space2 = display.lineSpace.getBoundingClientRect();
      try {
        x = e.clientX - space2.left;
        y = e.clientY - space2.top;
      } catch (e$1) {
        return null;
      }
      var coords = coordsChar(cm, x, y), line;
      if (forRect && coords.xRel > 0 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
        var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
        coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
      }
      return coords;
    }
    function findViewIndex(cm, n) {
      if (n >= cm.display.viewTo) {
        return null;
      }
      n -= cm.display.viewFrom;
      if (n < 0) {
        return null;
      }
      var view = cm.display.view;
      for (var i2 = 0; i2 < view.length; i2++) {
        n -= view[i2].size;
        if (n < 0) {
          return i2;
        }
      }
    }
    function regChange(cm, from, to, lendiff) {
      if (from == null) {
        from = cm.doc.first;
      }
      if (to == null) {
        to = cm.doc.first + cm.doc.size;
      }
      if (!lendiff) {
        lendiff = 0;
      }
      var display = cm.display;
      if (lendiff && to < display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers > from)) {
        display.updateLineNumbers = from;
      }
      cm.curOp.viewChanged = true;
      if (from >= display.viewTo) {
        if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo) {
          resetView(cm);
        }
      } else if (to <= display.viewFrom) {
        if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
          resetView(cm);
        } else {
          display.viewFrom += lendiff;
          display.viewTo += lendiff;
        }
      } else if (from <= display.viewFrom && to >= display.viewTo) {
        resetView(cm);
      } else if (from <= display.viewFrom) {
        var cut = viewCuttingPoint(cm, to, to + lendiff, 1);
        if (cut) {
          display.view = display.view.slice(cut.index);
          display.viewFrom = cut.lineN;
          display.viewTo += lendiff;
        } else {
          resetView(cm);
        }
      } else if (to >= display.viewTo) {
        var cut$1 = viewCuttingPoint(cm, from, from, -1);
        if (cut$1) {
          display.view = display.view.slice(0, cut$1.index);
          display.viewTo = cut$1.lineN;
        } else {
          resetView(cm);
        }
      } else {
        var cutTop = viewCuttingPoint(cm, from, from, -1);
        var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
        if (cutTop && cutBot) {
          display.view = display.view.slice(0, cutTop.index).concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN)).concat(display.view.slice(cutBot.index));
          display.viewTo += lendiff;
        } else {
          resetView(cm);
        }
      }
      var ext = display.externalMeasured;
      if (ext) {
        if (to < ext.lineN) {
          ext.lineN += lendiff;
        } else if (from < ext.lineN + ext.size) {
          display.externalMeasured = null;
        }
      }
    }
    function regLineChange(cm, line, type) {
      cm.curOp.viewChanged = true;
      var display = cm.display, ext = cm.display.externalMeasured;
      if (ext && line >= ext.lineN && line < ext.lineN + ext.size) {
        display.externalMeasured = null;
      }
      if (line < display.viewFrom || line >= display.viewTo) {
        return;
      }
      var lineView = display.view[findViewIndex(cm, line)];
      if (lineView.node == null) {
        return;
      }
      var arr = lineView.changes || (lineView.changes = []);
      if (indexOf(arr, type) == -1) {
        arr.push(type);
      }
    }
    function resetView(cm) {
      cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
      cm.display.view = [];
      cm.display.viewOffset = 0;
    }
    function viewCuttingPoint(cm, oldN, newN, dir) {
      var index = findViewIndex(cm, oldN), diff, view = cm.display.view;
      if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size) {
        return { index, lineN: newN };
      }
      var n = cm.display.viewFrom;
      for (var i2 = 0; i2 < index; i2++) {
        n += view[i2].size;
      }
      if (n != oldN) {
        if (dir > 0) {
          if (index == view.length - 1) {
            return null;
          }
          diff = n + view[index].size - oldN;
          index++;
        } else {
          diff = n - oldN;
        }
        oldN += diff;
        newN += diff;
      }
      while (visualLineNo(cm.doc, newN) != newN) {
        if (index == (dir < 0 ? 0 : view.length - 1)) {
          return null;
        }
        newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
        index += dir;
      }
      return { index, lineN: newN };
    }
    function adjustView(cm, from, to) {
      var display = cm.display, view = display.view;
      if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
        display.view = buildViewArray(cm, from, to);
        display.viewFrom = from;
      } else {
        if (display.viewFrom > from) {
          display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view);
        } else if (display.viewFrom < from) {
          display.view = display.view.slice(findViewIndex(cm, from));
        }
        display.viewFrom = from;
        if (display.viewTo < to) {
          display.view = display.view.concat(buildViewArray(cm, display.viewTo, to));
        } else if (display.viewTo > to) {
          display.view = display.view.slice(0, findViewIndex(cm, to));
        }
      }
      display.viewTo = to;
    }
    function countDirtyView(cm) {
      var view = cm.display.view, dirty = 0;
      for (var i2 = 0; i2 < view.length; i2++) {
        var lineView = view[i2];
        if (!lineView.hidden && (!lineView.node || lineView.changes)) {
          ++dirty;
        }
      }
      return dirty;
    }
    function updateSelection(cm) {
      cm.display.input.showSelection(cm.display.input.prepareSelection());
    }
    function prepareSelection(cm, primary) {
      if (primary === void 0)
        primary = true;
      var doc = cm.doc, result = {};
      var curFragment = result.cursors = document.createDocumentFragment();
      var selFragment = result.selection = document.createDocumentFragment();
      for (var i2 = 0; i2 < doc.sel.ranges.length; i2++) {
        if (!primary && i2 == doc.sel.primIndex) {
          continue;
        }
        var range2 = doc.sel.ranges[i2];
        if (range2.from().line >= cm.display.viewTo || range2.to().line < cm.display.viewFrom) {
          continue;
        }
        var collapsed = range2.empty();
        if (collapsed || cm.options.showCursorWhenSelecting) {
          drawSelectionCursor(cm, range2.head, curFragment);
        }
        if (!collapsed) {
          drawSelectionRange(cm, range2, selFragment);
        }
      }
      return result;
    }
    function drawSelectionCursor(cm, head, output) {
      var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);
      var cursor = output.appendChild(elt("div", "\xA0", "CodeMirror-cursor"));
      cursor.style.left = pos.left + "px";
      cursor.style.top = pos.top + "px";
      cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";
      if (/\bcm-fat-cursor\b/.test(cm.getWrapperElement().className)) {
        var charPos = charCoords(cm, head, "div", null, null);
        cursor.style.width = Math.max(0, charPos.right - charPos.left) + "px";
      }
      if (pos.other) {
        var otherCursor = output.appendChild(elt("div", "\xA0", "CodeMirror-cursor CodeMirror-secondarycursor"));
        otherCursor.style.display = "";
        otherCursor.style.left = pos.other.left + "px";
        otherCursor.style.top = pos.other.top + "px";
        otherCursor.style.height = (pos.other.bottom - pos.other.top) * 0.85 + "px";
      }
    }
    function cmpCoords(a, b) {
      return a.top - b.top || a.left - b.left;
    }
    function drawSelectionRange(cm, range2, output) {
      var display = cm.display, doc = cm.doc;
      var fragment = document.createDocumentFragment();
      var padding = paddingH(cm.display), leftSide = padding.left;
      var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
      var docLTR = doc.direction == "ltr";
      function add(left, top, width, bottom) {
        if (top < 0) {
          top = 0;
        }
        top = Math.round(top);
        bottom = Math.round(bottom);
        fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px"));
      }
      function drawForLine(line, fromArg, toArg) {
        var lineObj = getLine(doc, line);
        var lineLen = lineObj.text.length;
        var start2, end;
        function coords(ch, bias) {
          return charCoords(cm, Pos(line, ch), "div", lineObj, bias);
        }
        function wrapX(pos, dir, side) {
          var extent = wrappedLineExtentChar(cm, lineObj, null, pos);
          var prop2 = dir == "ltr" == (side == "after") ? "left" : "right";
          var ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
          return coords(ch, prop2)[prop2];
        }
        var order = getOrder(lineObj, doc.direction);
        iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, function(from, to, dir, i2) {
          var ltr = dir == "ltr";
          var fromPos = coords(from, ltr ? "left" : "right");
          var toPos = coords(to - 1, ltr ? "right" : "left");
          var openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
          var first = i2 == 0, last = !order || i2 == order.length - 1;
          if (toPos.top - fromPos.top <= 3) {
            var openLeft = (docLTR ? openStart : openEnd) && first;
            var openRight = (docLTR ? openEnd : openStart) && last;
            var left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
            var right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
            add(left, fromPos.top, right - left, fromPos.bottom);
          } else {
            var topLeft, topRight, botLeft, botRight;
            if (ltr) {
              topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
              topRight = docLTR ? rightSide : wrapX(from, dir, "before");
              botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
              botRight = docLTR && openEnd && last ? rightSide : toPos.right;
            } else {
              topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
              topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
              botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
              botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
            }
            add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
            if (fromPos.bottom < toPos.top) {
              add(leftSide, fromPos.bottom, null, toPos.top);
            }
            add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
          }
          if (!start2 || cmpCoords(fromPos, start2) < 0) {
            start2 = fromPos;
          }
          if (cmpCoords(toPos, start2) < 0) {
            start2 = toPos;
          }
          if (!end || cmpCoords(fromPos, end) < 0) {
            end = fromPos;
          }
          if (cmpCoords(toPos, end) < 0) {
            end = toPos;
          }
        });
        return { start: start2, end };
      }
      var sFrom = range2.from(), sTo = range2.to();
      if (sFrom.line == sTo.line) {
        drawForLine(sFrom.line, sFrom.ch, sTo.ch);
      } else {
        var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line);
        var singleVLine = visualLine(fromLine) == visualLine(toLine);
        var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
        var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
        if (singleVLine) {
          if (leftEnd.top < rightStart.top - 2) {
            add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
            add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
          } else {
            add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
          }
        }
        if (leftEnd.bottom < rightStart.top) {
          add(leftSide, leftEnd.bottom, null, rightStart.top);
        }
      }
      output.appendChild(fragment);
    }
    function restartBlink(cm) {
      if (!cm.state.focused) {
        return;
      }
      var display = cm.display;
      clearInterval(display.blinker);
      var on2 = true;
      display.cursorDiv.style.visibility = "";
      if (cm.options.cursorBlinkRate > 0) {
        display.blinker = setInterval(function() {
          if (!cm.hasFocus()) {
            onBlur(cm);
          }
          display.cursorDiv.style.visibility = (on2 = !on2) ? "" : "hidden";
        }, cm.options.cursorBlinkRate);
      } else if (cm.options.cursorBlinkRate < 0) {
        display.cursorDiv.style.visibility = "hidden";
      }
    }
    function ensureFocus(cm) {
      if (!cm.hasFocus()) {
        cm.display.input.focus();
        if (!cm.state.focused) {
          onFocus(cm);
        }
      }
    }
    function delayBlurEvent(cm) {
      cm.state.delayingBlurEvent = true;
      setTimeout(function() {
        if (cm.state.delayingBlurEvent) {
          cm.state.delayingBlurEvent = false;
          if (cm.state.focused) {
            onBlur(cm);
          }
        }
      }, 100);
    }
    function onFocus(cm, e) {
      if (cm.state.delayingBlurEvent && !cm.state.draggingText) {
        cm.state.delayingBlurEvent = false;
      }
      if (cm.options.readOnly == "nocursor") {
        return;
      }
      if (!cm.state.focused) {
        signal(cm, "focus", cm, e);
        cm.state.focused = true;
        addClass(cm.display.wrapper, "CodeMirror-focused");
        if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
          cm.display.input.reset();
          if (webkit) {
            setTimeout(function() {
              return cm.display.input.reset(true);
            }, 20);
          }
        }
        cm.display.input.receivedFocus();
      }
      restartBlink(cm);
    }
    function onBlur(cm, e) {
      if (cm.state.delayingBlurEvent) {
        return;
      }
      if (cm.state.focused) {
        signal(cm, "blur", cm, e);
        cm.state.focused = false;
        rmClass(cm.display.wrapper, "CodeMirror-focused");
      }
      clearInterval(cm.display.blinker);
      setTimeout(function() {
        if (!cm.state.focused) {
          cm.display.shift = false;
        }
      }, 150);
    }
    function updateHeightsInViewport(cm) {
      var display = cm.display;
      var prevBottom = display.lineDiv.offsetTop;
      for (var i2 = 0; i2 < display.view.length; i2++) {
        var cur = display.view[i2], wrapping = cm.options.lineWrapping;
        var height = void 0, width = 0;
        if (cur.hidden) {
          continue;
        }
        if (ie && ie_version < 8) {
          var bot = cur.node.offsetTop + cur.node.offsetHeight;
          height = bot - prevBottom;
          prevBottom = bot;
        } else {
          var box = cur.node.getBoundingClientRect();
          height = box.bottom - box.top;
          if (!wrapping && cur.text.firstChild) {
            width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1;
          }
        }
        var diff = cur.line.height - height;
        if (diff > 5e-3 || diff < -5e-3) {
          updateLineHeight(cur.line, height);
          updateWidgetHeight(cur.line);
          if (cur.rest) {
            for (var j = 0; j < cur.rest.length; j++) {
              updateWidgetHeight(cur.rest[j]);
            }
          }
        }
        if (width > cm.display.sizerWidth) {
          var chWidth = Math.ceil(width / charWidth(cm.display));
          if (chWidth > cm.display.maxLineLength) {
            cm.display.maxLineLength = chWidth;
            cm.display.maxLine = cur.line;
            cm.display.maxLineChanged = true;
          }
        }
      }
    }
    function updateWidgetHeight(line) {
      if (line.widgets) {
        for (var i2 = 0; i2 < line.widgets.length; ++i2) {
          var w = line.widgets[i2], parent = w.node.parentNode;
          if (parent) {
            w.height = parent.offsetHeight;
          }
        }
      }
    }
    function visibleLines(display, doc, viewport) {
      var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
      top = Math.floor(top - paddingTop(display));
      var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;
      var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom);
      if (viewport && viewport.ensure) {
        var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
        if (ensureFrom < from) {
          from = ensureFrom;
          to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
        } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
          from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
          to = ensureTo;
        }
      }
      return { from, to: Math.max(to, from + 1) };
    }
    function maybeScrollWindow(cm, rect) {
      if (signalDOMEvent(cm, "scrollCursorIntoView")) {
        return;
      }
      var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
      if (rect.top + box.top < 0) {
        doScroll = true;
      } else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) {
        doScroll = false;
      }
      if (doScroll != null && !phantom) {
        var scrollNode = elt("div", "\u200B", null, "position: absolute;\n                         top: " + (rect.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (rect.bottom - rect.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + rect.left + "px; width: " + Math.max(2, rect.right - rect.left) + "px;");
        cm.display.lineSpace.appendChild(scrollNode);
        scrollNode.scrollIntoView(doScroll);
        cm.display.lineSpace.removeChild(scrollNode);
      }
    }
    function scrollPosIntoView(cm, pos, end, margin) {
      if (margin == null) {
        margin = 0;
      }
      var rect;
      if (!cm.options.lineWrapping && pos == end) {
        end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos;
        pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos;
      }
      for (var limit = 0; limit < 5; limit++) {
        var changed = false;
        var coords = cursorCoords(cm, pos);
        var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
        rect = {
          left: Math.min(coords.left, endCoords.left),
          top: Math.min(coords.top, endCoords.top) - margin,
          right: Math.max(coords.left, endCoords.left),
          bottom: Math.max(coords.bottom, endCoords.bottom) + margin
        };
        var scrollPos = calculateScrollPos(cm, rect);
        var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
        if (scrollPos.scrollTop != null) {
          updateScrollTop(cm, scrollPos.scrollTop);
          if (Math.abs(cm.doc.scrollTop - startTop) > 1) {
            changed = true;
          }
        }
        if (scrollPos.scrollLeft != null) {
          setScrollLeft(cm, scrollPos.scrollLeft);
          if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) {
            changed = true;
          }
        }
        if (!changed) {
          break;
        }
      }
      return rect;
    }
    function scrollIntoView(cm, rect) {
      var scrollPos = calculateScrollPos(cm, rect);
      if (scrollPos.scrollTop != null) {
        updateScrollTop(cm, scrollPos.scrollTop);
      }
      if (scrollPos.scrollLeft != null) {
        setScrollLeft(cm, scrollPos.scrollLeft);
      }
    }
    function calculateScrollPos(cm, rect) {
      var display = cm.display, snapMargin = textHeight(cm.display);
      if (rect.top < 0) {
        rect.top = 0;
      }
      var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
      var screen2 = displayHeight(cm), result = {};
      if (rect.bottom - rect.top > screen2) {
        rect.bottom = rect.top + screen2;
      }
      var docBottom = cm.doc.height + paddingVert(display);
      var atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin;
      if (rect.top < screentop) {
        result.scrollTop = atTop ? 0 : rect.top;
      } else if (rect.bottom > screentop + screen2) {
        var newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen2);
        if (newTop != screentop) {
          result.scrollTop = newTop;
        }
      }
      var gutterSpace = cm.options.fixedGutter ? 0 : display.gutters.offsetWidth;
      var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft - gutterSpace;
      var screenw = displayWidth(cm) - display.gutters.offsetWidth;
      var tooWide = rect.right - rect.left > screenw;
      if (tooWide) {
        rect.right = rect.left + screenw;
      }
      if (rect.left < 10) {
        result.scrollLeft = 0;
      } else if (rect.left < screenleft) {
        result.scrollLeft = Math.max(0, rect.left + gutterSpace - (tooWide ? 0 : 10));
      } else if (rect.right > screenw + screenleft - 3) {
        result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw;
      }
      return result;
    }
    function addToScrollTop(cm, top) {
      if (top == null) {
        return;
      }
      resolveScrollToPos(cm);
      cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
    }
    function ensureCursorVisible(cm) {
      resolveScrollToPos(cm);
      var cur = cm.getCursor();
      cm.curOp.scrollToPos = { from: cur, to: cur, margin: cm.options.cursorScrollMargin };
    }
    function scrollToCoords(cm, x, y) {
      if (x != null || y != null) {
        resolveScrollToPos(cm);
      }
      if (x != null) {
        cm.curOp.scrollLeft = x;
      }
      if (y != null) {
        cm.curOp.scrollTop = y;
      }
    }
    function scrollToRange(cm, range2) {
      resolveScrollToPos(cm);
      cm.curOp.scrollToPos = range2;
    }
    function resolveScrollToPos(cm) {
      var range2 = cm.curOp.scrollToPos;
      if (range2) {
        cm.curOp.scrollToPos = null;
        var from = estimateCoords(cm, range2.from), to = estimateCoords(cm, range2.to);
        scrollToCoordsRange(cm, from, to, range2.margin);
      }
    }
    function scrollToCoordsRange(cm, from, to, margin) {
      var sPos = calculateScrollPos(cm, {
        left: Math.min(from.left, to.left),
        top: Math.min(from.top, to.top) - margin,
        right: Math.max(from.right, to.right),
        bottom: Math.max(from.bottom, to.bottom) + margin
      });
      scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
    }
    function updateScrollTop(cm, val) {
      if (Math.abs(cm.doc.scrollTop - val) < 2) {
        return;
      }
      if (!gecko) {
        updateDisplaySimple(cm, { top: val });
      }
      setScrollTop(cm, val, true);
      if (gecko) {
        updateDisplaySimple(cm);
      }
      startWorker(cm, 100);
    }
    function setScrollTop(cm, val, forceScroll) {
      val = Math.max(0, Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val));
      if (cm.display.scroller.scrollTop == val && !forceScroll) {
        return;
      }
      cm.doc.scrollTop = val;
      cm.display.scrollbars.setScrollTop(val);
      if (cm.display.scroller.scrollTop != val) {
        cm.display.scroller.scrollTop = val;
      }
    }
    function setScrollLeft(cm, val, isScroller, forceScroll) {
      val = Math.max(0, Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth));
      if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) {
        return;
      }
      cm.doc.scrollLeft = val;
      alignHorizontally(cm);
      if (cm.display.scroller.scrollLeft != val) {
        cm.display.scroller.scrollLeft = val;
      }
      cm.display.scrollbars.setScrollLeft(val);
    }
    function measureForScrollbars(cm) {
      var d = cm.display, gutterW = d.gutters.offsetWidth;
      var docH = Math.round(cm.doc.height + paddingVert(cm.display));
      return {
        clientHeight: d.scroller.clientHeight,
        viewHeight: d.wrapper.clientHeight,
        scrollWidth: d.scroller.scrollWidth,
        clientWidth: d.scroller.clientWidth,
        viewWidth: d.wrapper.clientWidth,
        barLeft: cm.options.fixedGutter ? gutterW : 0,
        docHeight: docH,
        scrollHeight: docH + scrollGap(cm) + d.barHeight,
        nativeBarWidth: d.nativeBarWidth,
        gutterWidth: gutterW
      };
    }
    var NativeScrollbars = function(place, scroll, cm) {
      this.cm = cm;
      var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
      var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
      vert.tabIndex = horiz.tabIndex = -1;
      place(vert);
      place(horiz);
      on(vert, "scroll", function() {
        if (vert.clientHeight) {
          scroll(vert.scrollTop, "vertical");
        }
      });
      on(horiz, "scroll", function() {
        if (horiz.clientWidth) {
          scroll(horiz.scrollLeft, "horizontal");
        }
      });
      this.checkedZeroWidth = false;
      if (ie && ie_version < 8) {
        this.horiz.style.minHeight = this.vert.style.minWidth = "18px";
      }
    };
    NativeScrollbars.prototype.update = function(measure) {
      var needsH = measure.scrollWidth > measure.clientWidth + 1;
      var needsV = measure.scrollHeight > measure.clientHeight + 1;
      var sWidth = measure.nativeBarWidth;
      if (needsV) {
        this.vert.style.display = "block";
        this.vert.style.bottom = needsH ? sWidth + "px" : "0";
        var totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
        this.vert.firstChild.style.height = Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
      } else {
        this.vert.style.display = "";
        this.vert.firstChild.style.height = "0";
      }
      if (needsH) {
        this.horiz.style.display = "block";
        this.horiz.style.right = needsV ? sWidth + "px" : "0";
        this.horiz.style.left = measure.barLeft + "px";
        var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
        this.horiz.firstChild.style.width = Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
      } else {
        this.horiz.style.display = "";
        this.horiz.firstChild.style.width = "0";
      }
      if (!this.checkedZeroWidth && measure.clientHeight > 0) {
        if (sWidth == 0) {
          this.zeroWidthHack();
        }
        this.checkedZeroWidth = true;
      }
      return { right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0 };
    };
    NativeScrollbars.prototype.setScrollLeft = function(pos) {
      if (this.horiz.scrollLeft != pos) {
        this.horiz.scrollLeft = pos;
      }
      if (this.disableHoriz) {
        this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz");
      }
    };
    NativeScrollbars.prototype.setScrollTop = function(pos) {
      if (this.vert.scrollTop != pos) {
        this.vert.scrollTop = pos;
      }
      if (this.disableVert) {
        this.enableZeroWidthBar(this.vert, this.disableVert, "vert");
      }
    };
    NativeScrollbars.prototype.zeroWidthHack = function() {
      var w = mac && !mac_geMountainLion ? "12px" : "18px";
      this.horiz.style.height = this.vert.style.width = w;
      this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
      this.disableHoriz = new Delayed();
      this.disableVert = new Delayed();
    };
    NativeScrollbars.prototype.enableZeroWidthBar = function(bar, delay, type) {
      bar.style.pointerEvents = "auto";
      function maybeDisable() {
        var box = bar.getBoundingClientRect();
        var elt2 = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2) : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
        if (elt2 != bar) {
          bar.style.pointerEvents = "none";
        } else {
          delay.set(1e3, maybeDisable);
        }
      }
      delay.set(1e3, maybeDisable);
    };
    NativeScrollbars.prototype.clear = function() {
      var parent = this.horiz.parentNode;
      parent.removeChild(this.horiz);
      parent.removeChild(this.vert);
    };
    var NullScrollbars = function() {
    };
    NullScrollbars.prototype.update = function() {
      return { bottom: 0, right: 0 };
    };
    NullScrollbars.prototype.setScrollLeft = function() {
    };
    NullScrollbars.prototype.setScrollTop = function() {
    };
    NullScrollbars.prototype.clear = function() {
    };
    function updateScrollbars(cm, measure) {
      if (!measure) {
        measure = measureForScrollbars(cm);
      }
      var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
      updateScrollbarsInner(cm, measure);
      for (var i2 = 0; i2 < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i2++) {
        if (startWidth != cm.display.barWidth && cm.options.lineWrapping) {
          updateHeightsInViewport(cm);
        }
        updateScrollbarsInner(cm, measureForScrollbars(cm));
        startWidth = cm.display.barWidth;
        startHeight = cm.display.barHeight;
      }
    }
    function updateScrollbarsInner(cm, measure) {
      var d = cm.display;
      var sizes = d.scrollbars.update(measure);
      d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
      d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";
      d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent";
      if (sizes.right && sizes.bottom) {
        d.scrollbarFiller.style.display = "block";
        d.scrollbarFiller.style.height = sizes.bottom + "px";
        d.scrollbarFiller.style.width = sizes.right + "px";
      } else {
        d.scrollbarFiller.style.display = "";
      }
      if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
        d.gutterFiller.style.display = "block";
        d.gutterFiller.style.height = sizes.bottom + "px";
        d.gutterFiller.style.width = measure.gutterWidth + "px";
      } else {
        d.gutterFiller.style.display = "";
      }
    }
    var scrollbarModel = { "native": NativeScrollbars, "null": NullScrollbars };
    function initScrollbars(cm) {
      if (cm.display.scrollbars) {
        cm.display.scrollbars.clear();
        if (cm.display.scrollbars.addClass) {
          rmClass(cm.display.wrapper, cm.display.scrollbars.addClass);
        }
      }
      cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function(node) {
        cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
        on(node, "mousedown", function() {
          if (cm.state.focused) {
            setTimeout(function() {
              return cm.display.input.focus();
            }, 0);
          }
        });
        node.setAttribute("cm-not-content", "true");
      }, function(pos, axis) {
        if (axis == "horizontal") {
          setScrollLeft(cm, pos);
        } else {
          updateScrollTop(cm, pos);
        }
      }, cm);
      if (cm.display.scrollbars.addClass) {
        addClass(cm.display.wrapper, cm.display.scrollbars.addClass);
      }
    }
    var nextOpId = 0;
    function startOperation(cm) {
      cm.curOp = {
        cm,
        viewChanged: false,
        startHeight: cm.doc.height,
        forceUpdate: false,
        updateInput: 0,
        typing: false,
        changeObjs: null,
        cursorActivityHandlers: null,
        cursorActivityCalled: 0,
        selectionChanged: false,
        updateMaxLine: false,
        scrollLeft: null,
        scrollTop: null,
        scrollToPos: null,
        focus: false,
        id: ++nextOpId,
        markArrays: null
      };
      pushOperation(cm.curOp);
    }
    function endOperation(cm) {
      var op = cm.curOp;
      if (op) {
        finishOperation(op, function(group) {
          for (var i2 = 0; i2 < group.ops.length; i2++) {
            group.ops[i2].cm.curOp = null;
          }
          endOperations(group);
        });
      }
    }
    function endOperations(group) {
      var ops = group.ops;
      for (var i2 = 0; i2 < ops.length; i2++) {
        endOperation_R1(ops[i2]);
      }
      for (var i$12 = 0; i$12 < ops.length; i$12++) {
        endOperation_W1(ops[i$12]);
      }
      for (var i$22 = 0; i$22 < ops.length; i$22++) {
        endOperation_R2(ops[i$22]);
      }
      for (var i$3 = 0; i$3 < ops.length; i$3++) {
        endOperation_W2(ops[i$3]);
      }
      for (var i$4 = 0; i$4 < ops.length; i$4++) {
        endOperation_finish(ops[i$4]);
      }
    }
    function endOperation_R1(op) {
      var cm = op.cm, display = cm.display;
      maybeClipScrollbars(cm);
      if (op.updateMaxLine) {
        findMaxLine(cm);
      }
      op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null || op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom || op.scrollToPos.to.line >= display.viewTo) || display.maxLineChanged && cm.options.lineWrapping;
      op.update = op.mustUpdate && new DisplayUpdate(cm, op.mustUpdate && { top: op.scrollTop, ensure: op.scrollToPos }, op.forceUpdate);
    }
    function endOperation_W1(op) {
      op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
    }
    function endOperation_R2(op) {
      var cm = op.cm, display = cm.display;
      if (op.updatedDisplay) {
        updateHeightsInViewport(cm);
      }
      op.barMeasure = measureForScrollbars(cm);
      if (display.maxLineChanged && !cm.options.lineWrapping) {
        op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
        cm.display.sizerWidth = op.adjustWidthTo;
        op.barMeasure.scrollWidth = Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
        op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
      }
      if (op.updatedDisplay || op.selectionChanged) {
        op.preparedSelection = display.input.prepareSelection();
      }
    }
    function endOperation_W2(op) {
      var cm = op.cm;
      if (op.adjustWidthTo != null) {
        cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
        if (op.maxScrollLeft < cm.doc.scrollLeft) {
          setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
        }
        cm.display.maxLineChanged = false;
      }
      var takeFocus = op.focus && op.focus == activeElt();
      if (op.preparedSelection) {
        cm.display.input.showSelection(op.preparedSelection, takeFocus);
      }
      if (op.updatedDisplay || op.startHeight != cm.doc.height) {
        updateScrollbars(cm, op.barMeasure);
      }
      if (op.updatedDisplay) {
        setDocumentHeight(cm, op.barMeasure);
      }
      if (op.selectionChanged) {
        restartBlink(cm);
      }
      if (cm.state.focused && op.updateInput) {
        cm.display.input.reset(op.typing);
      }
      if (takeFocus) {
        ensureFocus(op.cm);
      }
    }
    function endOperation_finish(op) {
      var cm = op.cm, display = cm.display, doc = cm.doc;
      if (op.updatedDisplay) {
        postUpdateDisplay(cm, op.update);
      }
      if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos)) {
        display.wheelStartX = display.wheelStartY = null;
      }
      if (op.scrollTop != null) {
        setScrollTop(cm, op.scrollTop, op.forceScroll);
      }
      if (op.scrollLeft != null) {
        setScrollLeft(cm, op.scrollLeft, true, true);
      }
      if (op.scrollToPos) {
        var rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from), clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
        maybeScrollWindow(cm, rect);
      }
      var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
      if (hidden) {
        for (var i2 = 0; i2 < hidden.length; ++i2) {
          if (!hidden[i2].lines.length) {
            signal(hidden[i2], "hide");
          }
        }
      }
      if (unhidden) {
        for (var i$12 = 0; i$12 < unhidden.length; ++i$12) {
          if (unhidden[i$12].lines.length) {
            signal(unhidden[i$12], "unhide");
          }
        }
      }
      if (display.wrapper.offsetHeight) {
        doc.scrollTop = cm.display.scroller.scrollTop;
      }
      if (op.changeObjs) {
        signal(cm, "changes", cm, op.changeObjs);
      }
      if (op.update) {
        op.update.finish();
      }
    }
    function runInOp(cm, f) {
      if (cm.curOp) {
        return f();
      }
      startOperation(cm);
      try {
        return f();
      } finally {
        endOperation(cm);
      }
    }
    function operation(cm, f) {
      return function() {
        if (cm.curOp) {
          return f.apply(cm, arguments);
        }
        startOperation(cm);
        try {
          return f.apply(cm, arguments);
        } finally {
          endOperation(cm);
        }
      };
    }
    function methodOp(f) {
      return function() {
        if (this.curOp) {
          return f.apply(this, arguments);
        }
        startOperation(this);
        try {
          return f.apply(this, arguments);
        } finally {
          endOperation(this);
        }
      };
    }
    function docMethodOp(f) {
      return function() {
        var cm = this.cm;
        if (!cm || cm.curOp) {
          return f.apply(this, arguments);
        }
        startOperation(cm);
        try {
          return f.apply(this, arguments);
        } finally {
          endOperation(cm);
        }
      };
    }
    function startWorker(cm, time) {
      if (cm.doc.highlightFrontier < cm.display.viewTo) {
        cm.state.highlight.set(time, bind2(highlightWorker, cm));
      }
    }
    function highlightWorker(cm) {
      var doc = cm.doc;
      if (doc.highlightFrontier >= cm.display.viewTo) {
        return;
      }
      var end = +new Date() + cm.options.workTime;
      var context = getContextBefore(cm, doc.highlightFrontier);
      var changedLines = [];
      doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function(line) {
        if (context.line >= cm.display.viewFrom) {
          var oldStyles = line.styles;
          var resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null;
          var highlighted = highlightLine(cm, line, context, true);
          if (resetState) {
            context.state = resetState;
          }
          line.styles = highlighted.styles;
          var oldCls = line.styleClasses, newCls = highlighted.classes;
          if (newCls) {
            line.styleClasses = newCls;
          } else if (oldCls) {
            line.styleClasses = null;
          }
          var ischange = !oldStyles || oldStyles.length != line.styles.length || oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
          for (var i2 = 0; !ischange && i2 < oldStyles.length; ++i2) {
            ischange = oldStyles[i2] != line.styles[i2];
          }
          if (ischange) {
            changedLines.push(context.line);
          }
          line.stateAfter = context.save();
          context.nextLine();
        } else {
          if (line.text.length <= cm.options.maxHighlightLength) {
            processLine(cm, line.text, context);
          }
          line.stateAfter = context.line % 5 == 0 ? context.save() : null;
          context.nextLine();
        }
        if (+new Date() > end) {
          startWorker(cm, cm.options.workDelay);
          return true;
        }
      });
      doc.highlightFrontier = context.line;
      doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
      if (changedLines.length) {
        runInOp(cm, function() {
          for (var i2 = 0; i2 < changedLines.length; i2++) {
            regLineChange(cm, changedLines[i2], "text");
          }
        });
      }
    }
    var DisplayUpdate = function(cm, viewport, force) {
      var display = cm.display;
      this.viewport = viewport;
      this.visible = visibleLines(display, cm.doc, viewport);
      this.editorIsHidden = !display.wrapper.offsetWidth;
      this.wrapperHeight = display.wrapper.clientHeight;
      this.wrapperWidth = display.wrapper.clientWidth;
      this.oldDisplayWidth = displayWidth(cm);
      this.force = force;
      this.dims = getDimensions(cm);
      this.events = [];
    };
    DisplayUpdate.prototype.signal = function(emitter, type) {
      if (hasHandler(emitter, type)) {
        this.events.push(arguments);
      }
    };
    DisplayUpdate.prototype.finish = function() {
      for (var i2 = 0; i2 < this.events.length; i2++) {
        signal.apply(null, this.events[i2]);
      }
    };
    function maybeClipScrollbars(cm) {
      var display = cm.display;
      if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
        display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
        display.heightForcer.style.height = scrollGap(cm) + "px";
        display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
        display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
        display.scrollbarsClipped = true;
      }
    }
    function selectionSnapshot(cm) {
      if (cm.hasFocus()) {
        return null;
      }
      var active2 = activeElt();
      if (!active2 || !contains(cm.display.lineDiv, active2)) {
        return null;
      }
      var result = { activeElt: active2 };
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
          result.anchorNode = sel.anchorNode;
          result.anchorOffset = sel.anchorOffset;
          result.focusNode = sel.focusNode;
          result.focusOffset = sel.focusOffset;
        }
      }
      return result;
    }
    function restoreSelection(snapshot) {
      if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) {
        return;
      }
      snapshot.activeElt.focus();
      if (!/^(INPUT|TEXTAREA)$/.test(snapshot.activeElt.nodeName) && snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
        var sel = window.getSelection(), range2 = document.createRange();
        range2.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
        range2.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range2);
        sel.extend(snapshot.focusNode, snapshot.focusOffset);
      }
    }
    function updateDisplayIfNeeded(cm, update2) {
      var display = cm.display, doc = cm.doc;
      if (update2.editorIsHidden) {
        resetView(cm);
        return false;
      }
      if (!update2.force && update2.visible.from >= display.viewFrom && update2.visible.to <= display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) && display.renderedView == display.view && countDirtyView(cm) == 0) {
        return false;
      }
      if (maybeUpdateLineNumberWidth(cm)) {
        resetView(cm);
        update2.dims = getDimensions(cm);
      }
      var end = doc.first + doc.size;
      var from = Math.max(update2.visible.from - cm.options.viewportMargin, doc.first);
      var to = Math.min(end, update2.visible.to + cm.options.viewportMargin);
      if (display.viewFrom < from && from - display.viewFrom < 20) {
        from = Math.max(doc.first, display.viewFrom);
      }
      if (display.viewTo > to && display.viewTo - to < 20) {
        to = Math.min(end, display.viewTo);
      }
      if (sawCollapsedSpans) {
        from = visualLineNo(cm.doc, from);
        to = visualLineEndNo(cm.doc, to);
      }
      var different = from != display.viewFrom || to != display.viewTo || display.lastWrapHeight != update2.wrapperHeight || display.lastWrapWidth != update2.wrapperWidth;
      adjustView(cm, from, to);
      display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
      cm.display.mover.style.top = display.viewOffset + "px";
      var toUpdate = countDirtyView(cm);
      if (!different && toUpdate == 0 && !update2.force && display.renderedView == display.view && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo)) {
        return false;
      }
      var selSnapshot = selectionSnapshot(cm);
      if (toUpdate > 4) {
        display.lineDiv.style.display = "none";
      }
      patchDisplay(cm, display.updateLineNumbers, update2.dims);
      if (toUpdate > 4) {
        display.lineDiv.style.display = "";
      }
      display.renderedView = display.view;
      restoreSelection(selSnapshot);
      removeChildren(display.cursorDiv);
      removeChildren(display.selectionDiv);
      display.gutters.style.height = display.sizer.style.minHeight = 0;
      if (different) {
        display.lastWrapHeight = update2.wrapperHeight;
        display.lastWrapWidth = update2.wrapperWidth;
        startWorker(cm, 400);
      }
      display.updateLineNumbers = null;
      return true;
    }
    function postUpdateDisplay(cm, update2) {
      var viewport = update2.viewport;
      for (var first = true; ; first = false) {
        if (!first || !cm.options.lineWrapping || update2.oldDisplayWidth == displayWidth(cm)) {
          if (viewport && viewport.top != null) {
            viewport = { top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top) };
          }
          update2.visible = visibleLines(cm.display, cm.doc, viewport);
          if (update2.visible.from >= cm.display.viewFrom && update2.visible.to <= cm.display.viewTo) {
            break;
          }
        } else if (first) {
          update2.visible = visibleLines(cm.display, cm.doc, viewport);
        }
        if (!updateDisplayIfNeeded(cm, update2)) {
          break;
        }
        updateHeightsInViewport(cm);
        var barMeasure = measureForScrollbars(cm);
        updateSelection(cm);
        updateScrollbars(cm, barMeasure);
        setDocumentHeight(cm, barMeasure);
        update2.force = false;
      }
      update2.signal(cm, "update", cm);
      if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
        update2.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
        cm.display.reportedViewFrom = cm.display.viewFrom;
        cm.display.reportedViewTo = cm.display.viewTo;
      }
    }
    function updateDisplaySimple(cm, viewport) {
      var update2 = new DisplayUpdate(cm, viewport);
      if (updateDisplayIfNeeded(cm, update2)) {
        updateHeightsInViewport(cm);
        postUpdateDisplay(cm, update2);
        var barMeasure = measureForScrollbars(cm);
        updateSelection(cm);
        updateScrollbars(cm, barMeasure);
        setDocumentHeight(cm, barMeasure);
        update2.finish();
      }
    }
    function patchDisplay(cm, updateNumbersFrom, dims) {
      var display = cm.display, lineNumbers = cm.options.lineNumbers;
      var container = display.lineDiv, cur = container.firstChild;
      function rm(node2) {
        var next = node2.nextSibling;
        if (webkit && mac && cm.display.currentWheelTarget == node2) {
          node2.style.display = "none";
        } else {
          node2.parentNode.removeChild(node2);
        }
        return next;
      }
      var view = display.view, lineN = display.viewFrom;
      for (var i2 = 0; i2 < view.length; i2++) {
        var lineView = view[i2];
        if (lineView.hidden)
          ;
        else if (!lineView.node || lineView.node.parentNode != container) {
          var node = buildLineElement(cm, lineView, lineN, dims);
          container.insertBefore(node, cur);
        } else {
          while (cur != lineView.node) {
            cur = rm(cur);
          }
          var updateNumber = lineNumbers && updateNumbersFrom != null && updateNumbersFrom <= lineN && lineView.lineNumber;
          if (lineView.changes) {
            if (indexOf(lineView.changes, "gutter") > -1) {
              updateNumber = false;
            }
            updateLineForChanges(cm, lineView, lineN, dims);
          }
          if (updateNumber) {
            removeChildren(lineView.lineNumber);
            lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
          }
          cur = lineView.node.nextSibling;
        }
        lineN += lineView.size;
      }
      while (cur) {
        cur = rm(cur);
      }
    }
    function updateGutterSpace(display) {
      var width = display.gutters.offsetWidth;
      display.sizer.style.marginLeft = width + "px";
      signalLater(display, "gutterChanged", display);
    }
    function setDocumentHeight(cm, measure) {
      cm.display.sizer.style.minHeight = measure.docHeight + "px";
      cm.display.heightForcer.style.top = measure.docHeight + "px";
      cm.display.gutters.style.height = measure.docHeight + cm.display.barHeight + scrollGap(cm) + "px";
    }
    function alignHorizontally(cm) {
      var display = cm.display, view = display.view;
      if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) {
        return;
      }
      var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
      var gutterW = display.gutters.offsetWidth, left = comp + "px";
      for (var i2 = 0; i2 < view.length; i2++) {
        if (!view[i2].hidden) {
          if (cm.options.fixedGutter) {
            if (view[i2].gutter) {
              view[i2].gutter.style.left = left;
            }
            if (view[i2].gutterBackground) {
              view[i2].gutterBackground.style.left = left;
            }
          }
          var align = view[i2].alignable;
          if (align) {
            for (var j = 0; j < align.length; j++) {
              align[j].style.left = left;
            }
          }
        }
      }
      if (cm.options.fixedGutter) {
        display.gutters.style.left = comp + gutterW + "px";
      }
    }
    function maybeUpdateLineNumberWidth(cm) {
      if (!cm.options.lineNumbers) {
        return false;
      }
      var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
      if (last.length != display.lineNumChars) {
        var test = display.measure.appendChild(elt("div", [elt("div", last)], "CodeMirror-linenumber CodeMirror-gutter-elt"));
        var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
        display.lineGutter.style.width = "";
        display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
        display.lineNumWidth = display.lineNumInnerWidth + padding;
        display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
        display.lineGutter.style.width = display.lineNumWidth + "px";
        updateGutterSpace(cm.display);
        return true;
      }
      return false;
    }
    function getGutters(gutters, lineNumbers) {
      var result = [], sawLineNumbers = false;
      for (var i2 = 0; i2 < gutters.length; i2++) {
        var name = gutters[i2], style = null;
        if (typeof name != "string") {
          style = name.style;
          name = name.className;
        }
        if (name == "CodeMirror-linenumbers") {
          if (!lineNumbers) {
            continue;
          } else {
            sawLineNumbers = true;
          }
        }
        result.push({ className: name, style });
      }
      if (lineNumbers && !sawLineNumbers) {
        result.push({ className: "CodeMirror-linenumbers", style: null });
      }
      return result;
    }
    function renderGutters(display) {
      var gutters = display.gutters, specs = display.gutterSpecs;
      removeChildren(gutters);
      display.lineGutter = null;
      for (var i2 = 0; i2 < specs.length; ++i2) {
        var ref = specs[i2];
        var className = ref.className;
        var style = ref.style;
        var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + className));
        if (style) {
          gElt.style.cssText = style;
        }
        if (className == "CodeMirror-linenumbers") {
          display.lineGutter = gElt;
          gElt.style.width = (display.lineNumWidth || 1) + "px";
        }
      }
      gutters.style.display = specs.length ? "" : "none";
      updateGutterSpace(display);
    }
    function updateGutters(cm) {
      renderGutters(cm.display);
      regChange(cm);
      alignHorizontally(cm);
    }
    function Display(place, doc, input, options) {
      var d = this;
      this.input = input;
      d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
      d.scrollbarFiller.setAttribute("cm-not-content", "true");
      d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
      d.gutterFiller.setAttribute("cm-not-content", "true");
      d.lineDiv = eltP("div", null, "CodeMirror-code");
      d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
      d.cursorDiv = elt("div", null, "CodeMirror-cursors");
      d.measure = elt("div", null, "CodeMirror-measure");
      d.lineMeasure = elt("div", null, "CodeMirror-measure");
      d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv], null, "position: relative; outline: none");
      var lines = eltP("div", [d.lineSpace], "CodeMirror-lines");
      d.mover = elt("div", [lines], null, "position: relative");
      d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
      d.sizerWidth = null;
      d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
      d.gutters = elt("div", null, "CodeMirror-gutters");
      d.lineGutter = null;
      d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
      d.scroller.setAttribute("tabIndex", "-1");
      d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");
      d.wrapper.setAttribute("translate", "no");
      if (ie && ie_version < 8) {
        d.gutters.style.zIndex = -1;
        d.scroller.style.paddingRight = 0;
      }
      if (!webkit && !(gecko && mobile)) {
        d.scroller.draggable = true;
      }
      if (place) {
        if (place.appendChild) {
          place.appendChild(d.wrapper);
        } else {
          place(d.wrapper);
        }
      }
      d.viewFrom = d.viewTo = doc.first;
      d.reportedViewFrom = d.reportedViewTo = doc.first;
      d.view = [];
      d.renderedView = null;
      d.externalMeasured = null;
      d.viewOffset = 0;
      d.lastWrapHeight = d.lastWrapWidth = 0;
      d.updateLineNumbers = null;
      d.nativeBarWidth = d.barHeight = d.barWidth = 0;
      d.scrollbarsClipped = false;
      d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
      d.alignWidgets = false;
      d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
      d.maxLine = null;
      d.maxLineLength = 0;
      d.maxLineChanged = false;
      d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;
      d.shift = false;
      d.selForContextMenu = null;
      d.activeTouch = null;
      d.gutterSpecs = getGutters(options.gutters, options.lineNumbers);
      renderGutters(d);
      input.init(d);
    }
    var wheelSamples = 0, wheelPixelsPerUnit = null;
    if (ie) {
      wheelPixelsPerUnit = -0.53;
    } else if (gecko) {
      wheelPixelsPerUnit = 15;
    } else if (chrome) {
      wheelPixelsPerUnit = -0.7;
    } else if (safari) {
      wheelPixelsPerUnit = -1 / 3;
    }
    function wheelEventDelta(e) {
      var dx = e.wheelDeltaX, dy = e.wheelDeltaY;
      if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) {
        dx = e.detail;
      }
      if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) {
        dy = e.detail;
      } else if (dy == null) {
        dy = e.wheelDelta;
      }
      return { x: dx, y: dy };
    }
    function wheelEventPixels(e) {
      var delta = wheelEventDelta(e);
      delta.x *= wheelPixelsPerUnit;
      delta.y *= wheelPixelsPerUnit;
      return delta;
    }
    function onScrollWheel(cm, e) {
      var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;
      var display = cm.display, scroll = display.scroller;
      var canScrollX = scroll.scrollWidth > scroll.clientWidth;
      var canScrollY = scroll.scrollHeight > scroll.clientHeight;
      if (!(dx && canScrollX || dy && canScrollY)) {
        return;
      }
      if (dy && mac && webkit) {
        outer:
          for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
            for (var i2 = 0; i2 < view.length; i2++) {
              if (view[i2].node == cur) {
                cm.display.currentWheelTarget = cur;
                break outer;
              }
            }
          }
      }
      if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
        if (dy && canScrollY) {
          updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit));
        }
        setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
        if (!dy || dy && canScrollY) {
          e_preventDefault(e);
        }
        display.wheelStartX = null;
        return;
      }
      if (dy && wheelPixelsPerUnit != null) {
        var pixels = dy * wheelPixelsPerUnit;
        var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
        if (pixels < 0) {
          top = Math.max(0, top + pixels - 50);
        } else {
          bot = Math.min(cm.doc.height, bot + pixels + 50);
        }
        updateDisplaySimple(cm, { top, bottom: bot });
      }
      if (wheelSamples < 20) {
        if (display.wheelStartX == null) {
          display.wheelStartX = scroll.scrollLeft;
          display.wheelStartY = scroll.scrollTop;
          display.wheelDX = dx;
          display.wheelDY = dy;
          setTimeout(function() {
            if (display.wheelStartX == null) {
              return;
            }
            var movedX = scroll.scrollLeft - display.wheelStartX;
            var movedY = scroll.scrollTop - display.wheelStartY;
            var sample = movedY && display.wheelDY && movedY / display.wheelDY || movedX && display.wheelDX && movedX / display.wheelDX;
            display.wheelStartX = display.wheelStartY = null;
            if (!sample) {
              return;
            }
            wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
            ++wheelSamples;
          }, 200);
        } else {
          display.wheelDX += dx;
          display.wheelDY += dy;
        }
      }
    }
    var Selection = function(ranges, primIndex) {
      this.ranges = ranges;
      this.primIndex = primIndex;
    };
    Selection.prototype.primary = function() {
      return this.ranges[this.primIndex];
    };
    Selection.prototype.equals = function(other) {
      if (other == this) {
        return true;
      }
      if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) {
        return false;
      }
      for (var i2 = 0; i2 < this.ranges.length; i2++) {
        var here = this.ranges[i2], there = other.ranges[i2];
        if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) {
          return false;
        }
      }
      return true;
    };
    Selection.prototype.deepCopy = function() {
      var out = [];
      for (var i2 = 0; i2 < this.ranges.length; i2++) {
        out[i2] = new Range(copyPos(this.ranges[i2].anchor), copyPos(this.ranges[i2].head));
      }
      return new Selection(out, this.primIndex);
    };
    Selection.prototype.somethingSelected = function() {
      for (var i2 = 0; i2 < this.ranges.length; i2++) {
        if (!this.ranges[i2].empty()) {
          return true;
        }
      }
      return false;
    };
    Selection.prototype.contains = function(pos, end) {
      if (!end) {
        end = pos;
      }
      for (var i2 = 0; i2 < this.ranges.length; i2++) {
        var range2 = this.ranges[i2];
        if (cmp(end, range2.from()) >= 0 && cmp(pos, range2.to()) <= 0) {
          return i2;
        }
      }
      return -1;
    };
    var Range = function(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    };
    Range.prototype.from = function() {
      return minPos(this.anchor, this.head);
    };
    Range.prototype.to = function() {
      return maxPos(this.anchor, this.head);
    };
    Range.prototype.empty = function() {
      return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
    };
    function normalizeSelection(cm, ranges, primIndex) {
      var mayTouch = cm && cm.options.selectionsMayTouch;
      var prim = ranges[primIndex];
      ranges.sort(function(a, b) {
        return cmp(a.from(), b.from());
      });
      primIndex = indexOf(ranges, prim);
      for (var i2 = 1; i2 < ranges.length; i2++) {
        var cur = ranges[i2], prev = ranges[i2 - 1];
        var diff = cmp(prev.to(), cur.from());
        if (mayTouch && !cur.empty() ? diff > 0 : diff >= 0) {
          var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
          var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
          if (i2 <= primIndex) {
            --primIndex;
          }
          ranges.splice(--i2, 2, new Range(inv ? to : from, inv ? from : to));
        }
      }
      return new Selection(ranges, primIndex);
    }
    function simpleSelection(anchor, head) {
      return new Selection([new Range(anchor, head || anchor)], 0);
    }
    function changeEnd(change) {
      if (!change.text) {
        return change.to;
      }
      return Pos(change.from.line + change.text.length - 1, lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
    }
    function adjustForChange(pos, change) {
      if (cmp(pos, change.from) < 0) {
        return pos;
      }
      if (cmp(pos, change.to) <= 0) {
        return changeEnd(change);
      }
      var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
      if (pos.line == change.to.line) {
        ch += changeEnd(change).ch - change.to.ch;
      }
      return Pos(line, ch);
    }
    function computeSelAfterChange(doc, change) {
      var out = [];
      for (var i2 = 0; i2 < doc.sel.ranges.length; i2++) {
        var range2 = doc.sel.ranges[i2];
        out.push(new Range(adjustForChange(range2.anchor, change), adjustForChange(range2.head, change)));
      }
      return normalizeSelection(doc.cm, out, doc.sel.primIndex);
    }
    function offsetPos(pos, old, nw) {
      if (pos.line == old.line) {
        return Pos(nw.line, pos.ch - old.ch + nw.ch);
      } else {
        return Pos(nw.line + (pos.line - old.line), pos.ch);
      }
    }
    function computeReplacedSel(doc, changes, hint) {
      var out = [];
      var oldPrev = Pos(doc.first, 0), newPrev = oldPrev;
      for (var i2 = 0; i2 < changes.length; i2++) {
        var change = changes[i2];
        var from = offsetPos(change.from, oldPrev, newPrev);
        var to = offsetPos(changeEnd(change), oldPrev, newPrev);
        oldPrev = change.to;
        newPrev = to;
        if (hint == "around") {
          var range2 = doc.sel.ranges[i2], inv = cmp(range2.head, range2.anchor) < 0;
          out[i2] = new Range(inv ? to : from, inv ? from : to);
        } else {
          out[i2] = new Range(from, from);
        }
      }
      return new Selection(out, doc.sel.primIndex);
    }
    function loadMode(cm) {
      cm.doc.mode = getMode(cm.options, cm.doc.modeOption);
      resetModeState(cm);
    }
    function resetModeState(cm) {
      cm.doc.iter(function(line) {
        if (line.stateAfter) {
          line.stateAfter = null;
        }
        if (line.styles) {
          line.styles = null;
        }
      });
      cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
      startWorker(cm, 100);
      cm.state.modeGen++;
      if (cm.curOp) {
        regChange(cm);
      }
    }
    function isWholeLineUpdate(doc, change) {
      return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" && (!doc.cm || doc.cm.options.wholeLineUpdateBefore);
    }
    function updateDoc(doc, change, markedSpans, estimateHeight2) {
      function spansFor(n) {
        return markedSpans ? markedSpans[n] : null;
      }
      function update2(line, text3, spans) {
        updateLine(line, text3, spans, estimateHeight2);
        signalLater(line, "change", line, change);
      }
      function linesFor(start2, end) {
        var result = [];
        for (var i2 = start2; i2 < end; ++i2) {
          result.push(new Line(text2[i2], spansFor(i2), estimateHeight2));
        }
        return result;
      }
      var from = change.from, to = change.to, text2 = change.text;
      var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
      var lastText = lst(text2), lastSpans = spansFor(text2.length - 1), nlines = to.line - from.line;
      if (change.full) {
        doc.insert(0, linesFor(0, text2.length));
        doc.remove(text2.length, doc.size - text2.length);
      } else if (isWholeLineUpdate(doc, change)) {
        var added = linesFor(0, text2.length - 1);
        update2(lastLine, lastLine.text, lastSpans);
        if (nlines) {
          doc.remove(from.line, nlines);
        }
        if (added.length) {
          doc.insert(from.line, added);
        }
      } else if (firstLine == lastLine) {
        if (text2.length == 1) {
          update2(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
        } else {
          var added$1 = linesFor(1, text2.length - 1);
          added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight2));
          update2(firstLine, firstLine.text.slice(0, from.ch) + text2[0], spansFor(0));
          doc.insert(from.line + 1, added$1);
        }
      } else if (text2.length == 1) {
        update2(firstLine, firstLine.text.slice(0, from.ch) + text2[0] + lastLine.text.slice(to.ch), spansFor(0));
        doc.remove(from.line + 1, nlines);
      } else {
        update2(firstLine, firstLine.text.slice(0, from.ch) + text2[0], spansFor(0));
        update2(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
        var added$2 = linesFor(1, text2.length - 1);
        if (nlines > 1) {
          doc.remove(from.line + 1, nlines - 1);
        }
        doc.insert(from.line + 1, added$2);
      }
      signalLater(doc, "change", doc, change);
    }
    function linkedDocs(doc, f, sharedHistOnly) {
      function propagate(doc2, skip, sharedHist) {
        if (doc2.linked) {
          for (var i2 = 0; i2 < doc2.linked.length; ++i2) {
            var rel = doc2.linked[i2];
            if (rel.doc == skip) {
              continue;
            }
            var shared = sharedHist && rel.sharedHist;
            if (sharedHistOnly && !shared) {
              continue;
            }
            f(rel.doc, shared);
            propagate(rel.doc, doc2, shared);
          }
        }
      }
      propagate(doc, null, true);
    }
    function attachDoc(cm, doc) {
      if (doc.cm) {
        throw new Error("This document is already in use.");
      }
      cm.doc = doc;
      doc.cm = cm;
      estimateLineHeights(cm);
      loadMode(cm);
      setDirectionClass(cm);
      cm.options.direction = doc.direction;
      if (!cm.options.lineWrapping) {
        findMaxLine(cm);
      }
      cm.options.mode = doc.modeOption;
      regChange(cm);
    }
    function setDirectionClass(cm) {
      (cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
    }
    function directionChanged(cm) {
      runInOp(cm, function() {
        setDirectionClass(cm);
        regChange(cm);
      });
    }
    function History(prev) {
      this.done = [];
      this.undone = [];
      this.undoDepth = prev ? prev.undoDepth : Infinity;
      this.lastModTime = this.lastSelTime = 0;
      this.lastOp = this.lastSelOp = null;
      this.lastOrigin = this.lastSelOrigin = null;
      this.generation = this.maxGeneration = prev ? prev.maxGeneration : 1;
    }
    function historyChangeFromChange(doc, change) {
      var histChange = { from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to) };
      attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
      linkedDocs(doc, function(doc2) {
        return attachLocalSpans(doc2, histChange, change.from.line, change.to.line + 1);
      }, true);
      return histChange;
    }
    function clearSelectionEvents(array) {
      while (array.length) {
        var last = lst(array);
        if (last.ranges) {
          array.pop();
        } else {
          break;
        }
      }
    }
    function lastChangeEvent(hist, force) {
      if (force) {
        clearSelectionEvents(hist.done);
        return lst(hist.done);
      } else if (hist.done.length && !lst(hist.done).ranges) {
        return lst(hist.done);
      } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
        hist.done.pop();
        return lst(hist.done);
      }
    }
    function addChangeToHistory(doc, change, selAfter, opId) {
      var hist = doc.history;
      hist.undone.length = 0;
      var time = +new Date(), cur;
      var last;
      if ((hist.lastOp == opId || hist.lastOrigin == change.origin && change.origin && (change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500) || change.origin.charAt(0) == "*")) && (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
        last = lst(cur.changes);
        if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
          last.to = changeEnd(change);
        } else {
          cur.changes.push(historyChangeFromChange(doc, change));
        }
      } else {
        var before = lst(hist.done);
        if (!before || !before.ranges) {
          pushSelectionToHistory(doc.sel, hist.done);
        }
        cur = {
          changes: [historyChangeFromChange(doc, change)],
          generation: hist.generation
        };
        hist.done.push(cur);
        while (hist.done.length > hist.undoDepth) {
          hist.done.shift();
          if (!hist.done[0].ranges) {
            hist.done.shift();
          }
        }
      }
      hist.done.push(selAfter);
      hist.generation = ++hist.maxGeneration;
      hist.lastModTime = hist.lastSelTime = time;
      hist.lastOp = hist.lastSelOp = opId;
      hist.lastOrigin = hist.lastSelOrigin = change.origin;
      if (!last) {
        signal(doc, "historyAdded");
      }
    }
    function selectionEventCanBeMerged(doc, origin, prev, sel) {
      var ch = origin.charAt(0);
      return ch == "*" || ch == "+" && prev.ranges.length == sel.ranges.length && prev.somethingSelected() == sel.somethingSelected() && new Date() - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500);
    }
    function addSelectionToHistory(doc, sel, opId, options) {
      var hist = doc.history, origin = options && options.origin;
      if (opId == hist.lastSelOp || origin && hist.lastSelOrigin == origin && (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin || selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))) {
        hist.done[hist.done.length - 1] = sel;
      } else {
        pushSelectionToHistory(sel, hist.done);
      }
      hist.lastSelTime = +new Date();
      hist.lastSelOrigin = origin;
      hist.lastSelOp = opId;
      if (options && options.clearRedo !== false) {
        clearSelectionEvents(hist.undone);
      }
    }
    function pushSelectionToHistory(sel, dest) {
      var top = lst(dest);
      if (!(top && top.ranges && top.equals(sel))) {
        dest.push(sel);
      }
    }
    function attachLocalSpans(doc, change, from, to) {
      var existing = change["spans_" + doc.id], n = 0;
      doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function(line) {
        if (line.markedSpans) {
          (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;
        }
        ++n;
      });
    }
    function removeClearedSpans(spans) {
      if (!spans) {
        return null;
      }
      var out;
      for (var i2 = 0; i2 < spans.length; ++i2) {
        if (spans[i2].marker.explicitlyCleared) {
          if (!out) {
            out = spans.slice(0, i2);
          }
        } else if (out) {
          out.push(spans[i2]);
        }
      }
      return !out ? spans : out.length ? out : null;
    }
    function getOldSpans(doc, change) {
      var found = change["spans_" + doc.id];
      if (!found) {
        return null;
      }
      var nw = [];
      for (var i2 = 0; i2 < change.text.length; ++i2) {
        nw.push(removeClearedSpans(found[i2]));
      }
      return nw;
    }
    function mergeOldSpans(doc, change) {
      var old = getOldSpans(doc, change);
      var stretched = stretchSpansOverChange(doc, change);
      if (!old) {
        return stretched;
      }
      if (!stretched) {
        return old;
      }
      for (var i2 = 0; i2 < old.length; ++i2) {
        var oldCur = old[i2], stretchCur = stretched[i2];
        if (oldCur && stretchCur) {
          spans:
            for (var j = 0; j < stretchCur.length; ++j) {
              var span = stretchCur[j];
              for (var k = 0; k < oldCur.length; ++k) {
                if (oldCur[k].marker == span.marker) {
                  continue spans;
                }
              }
              oldCur.push(span);
            }
        } else if (stretchCur) {
          old[i2] = stretchCur;
        }
      }
      return old;
    }
    function copyHistoryArray(events, newGroup, instantiateSel) {
      var copy = [];
      for (var i2 = 0; i2 < events.length; ++i2) {
        var event2 = events[i2];
        if (event2.ranges) {
          copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event2) : event2);
          continue;
        }
        var changes = event2.changes, newChanges = [];
        copy.push({ changes: newChanges });
        for (var j = 0; j < changes.length; ++j) {
          var change = changes[j], m = void 0;
          newChanges.push({ from: change.from, to: change.to, text: change.text });
          if (newGroup) {
            for (var prop2 in change) {
              if (m = prop2.match(/^spans_(\d+)$/)) {
                if (indexOf(newGroup, Number(m[1])) > -1) {
                  lst(newChanges)[prop2] = change[prop2];
                  delete change[prop2];
                }
              }
            }
          }
        }
      }
      return copy;
    }
    function extendRange(range2, head, other, extend) {
      if (extend) {
        var anchor = range2.anchor;
        if (other) {
          var posBefore = cmp(head, anchor) < 0;
          if (posBefore != cmp(other, anchor) < 0) {
            anchor = head;
            head = other;
          } else if (posBefore != cmp(head, other) < 0) {
            head = other;
          }
        }
        return new Range(anchor, head);
      } else {
        return new Range(other || head, head);
      }
    }
    function extendSelection(doc, head, other, options, extend) {
      if (extend == null) {
        extend = doc.cm && (doc.cm.display.shift || doc.extend);
      }
      setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
    }
    function extendSelections(doc, heads, options) {
      var out = [];
      var extend = doc.cm && (doc.cm.display.shift || doc.extend);
      for (var i2 = 0; i2 < doc.sel.ranges.length; i2++) {
        out[i2] = extendRange(doc.sel.ranges[i2], heads[i2], null, extend);
      }
      var newSel = normalizeSelection(doc.cm, out, doc.sel.primIndex);
      setSelection(doc, newSel, options);
    }
    function replaceOneSelection(doc, i2, range2, options) {
      var ranges = doc.sel.ranges.slice(0);
      ranges[i2] = range2;
      setSelection(doc, normalizeSelection(doc.cm, ranges, doc.sel.primIndex), options);
    }
    function setSimpleSelection(doc, anchor, head, options) {
      setSelection(doc, simpleSelection(anchor, head), options);
    }
    function filterSelectionChange(doc, sel, options) {
      var obj = {
        ranges: sel.ranges,
        update: function(ranges) {
          this.ranges = [];
          for (var i2 = 0; i2 < ranges.length; i2++) {
            this.ranges[i2] = new Range(clipPos(doc, ranges[i2].anchor), clipPos(doc, ranges[i2].head));
          }
        },
        origin: options && options.origin
      };
      signal(doc, "beforeSelectionChange", doc, obj);
      if (doc.cm) {
        signal(doc.cm, "beforeSelectionChange", doc.cm, obj);
      }
      if (obj.ranges != sel.ranges) {
        return normalizeSelection(doc.cm, obj.ranges, obj.ranges.length - 1);
      } else {
        return sel;
      }
    }
    function setSelectionReplaceHistory(doc, sel, options) {
      var done = doc.history.done, last = lst(done);
      if (last && last.ranges) {
        done[done.length - 1] = sel;
        setSelectionNoUndo(doc, sel, options);
      } else {
        setSelection(doc, sel, options);
      }
    }
    function setSelection(doc, sel, options) {
      setSelectionNoUndo(doc, sel, options);
      addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
    }
    function setSelectionNoUndo(doc, sel, options) {
      if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange")) {
        sel = filterSelectionChange(doc, sel, options);
      }
      var bias = options && options.bias || (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
      setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));
      if (!(options && options.scroll === false) && doc.cm && doc.cm.getOption("readOnly") != "nocursor") {
        ensureCursorVisible(doc.cm);
      }
    }
    function setSelectionInner(doc, sel) {
      if (sel.equals(doc.sel)) {
        return;
      }
      doc.sel = sel;
      if (doc.cm) {
        doc.cm.curOp.updateInput = 1;
        doc.cm.curOp.selectionChanged = true;
        signalCursorActivity(doc.cm);
      }
      signalLater(doc, "cursorActivity", doc);
    }
    function reCheckSelection(doc) {
      setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
    }
    function skipAtomicInSelection(doc, sel, bias, mayClear) {
      var out;
      for (var i2 = 0; i2 < sel.ranges.length; i2++) {
        var range2 = sel.ranges[i2];
        var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i2];
        var newAnchor = skipAtomic(doc, range2.anchor, old && old.anchor, bias, mayClear);
        var newHead = skipAtomic(doc, range2.head, old && old.head, bias, mayClear);
        if (out || newAnchor != range2.anchor || newHead != range2.head) {
          if (!out) {
            out = sel.ranges.slice(0, i2);
          }
          out[i2] = new Range(newAnchor, newHead);
        }
      }
      return out ? normalizeSelection(doc.cm, out, sel.primIndex) : sel;
    }
    function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
      var line = getLine(doc, pos.line);
      if (line.markedSpans) {
        for (var i2 = 0; i2 < line.markedSpans.length; ++i2) {
          var sp = line.markedSpans[i2], m = sp.marker;
          var preventCursorLeft = "selectLeft" in m ? !m.selectLeft : m.inclusiveLeft;
          var preventCursorRight = "selectRight" in m ? !m.selectRight : m.inclusiveRight;
          if ((sp.from == null || (preventCursorLeft ? sp.from <= pos.ch : sp.from < pos.ch)) && (sp.to == null || (preventCursorRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
            if (mayClear) {
              signal(m, "beforeCursorEnter");
              if (m.explicitlyCleared) {
                if (!line.markedSpans) {
                  break;
                } else {
                  --i2;
                  continue;
                }
              }
            }
            if (!m.atomic) {
              continue;
            }
            if (oldPos) {
              var near = m.find(dir < 0 ? 1 : -1), diff = void 0;
              if (dir < 0 ? preventCursorRight : preventCursorLeft) {
                near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null);
              }
              if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0)) {
                return skipAtomicInner(doc, near, pos, dir, mayClear);
              }
            }
            var far = m.find(dir < 0 ? -1 : 1);
            if (dir < 0 ? preventCursorLeft : preventCursorRight) {
              far = movePos(doc, far, dir, far.line == pos.line ? line : null);
            }
            return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null;
          }
        }
      }
      return pos;
    }
    function skipAtomic(doc, pos, oldPos, bias, mayClear) {
      var dir = bias || 1;
      var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, dir, true) || skipAtomicInner(doc, pos, oldPos, -dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true);
      if (!found) {
        doc.cantEdit = true;
        return Pos(doc.first, 0);
      }
      return found;
    }
    function movePos(doc, pos, dir, line) {
      if (dir < 0 && pos.ch == 0) {
        if (pos.line > doc.first) {
          return clipPos(doc, Pos(pos.line - 1));
        } else {
          return null;
        }
      } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
        if (pos.line < doc.first + doc.size - 1) {
          return Pos(pos.line + 1, 0);
        } else {
          return null;
        }
      } else {
        return new Pos(pos.line, pos.ch + dir);
      }
    }
    function selectAll(cm) {
      cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);
    }
    function filterChange(doc, change, update2) {
      var obj = {
        canceled: false,
        from: change.from,
        to: change.to,
        text: change.text,
        origin: change.origin,
        cancel: function() {
          return obj.canceled = true;
        }
      };
      if (update2) {
        obj.update = function(from, to, text2, origin) {
          if (from) {
            obj.from = clipPos(doc, from);
          }
          if (to) {
            obj.to = clipPos(doc, to);
          }
          if (text2) {
            obj.text = text2;
          }
          if (origin !== void 0) {
            obj.origin = origin;
          }
        };
      }
      signal(doc, "beforeChange", doc, obj);
      if (doc.cm) {
        signal(doc.cm, "beforeChange", doc.cm, obj);
      }
      if (obj.canceled) {
        if (doc.cm) {
          doc.cm.curOp.updateInput = 2;
        }
        return null;
      }
      return { from: obj.from, to: obj.to, text: obj.text, origin: obj.origin };
    }
    function makeChange(doc, change, ignoreReadOnly) {
      if (doc.cm) {
        if (!doc.cm.curOp) {
          return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly);
        }
        if (doc.cm.state.suppressEdits) {
          return;
        }
      }
      if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
        change = filterChange(doc, change, true);
        if (!change) {
          return;
        }
      }
      var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
      if (split) {
        for (var i2 = split.length - 1; i2 >= 0; --i2) {
          makeChangeInner(doc, { from: split[i2].from, to: split[i2].to, text: i2 ? [""] : change.text, origin: change.origin });
        }
      } else {
        makeChangeInner(doc, change);
      }
    }
    function makeChangeInner(doc, change) {
      if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) {
        return;
      }
      var selAfter = computeSelAfterChange(doc, change);
      addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);
      makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
      var rebased = [];
      linkedDocs(doc, function(doc2, sharedHist) {
        if (!sharedHist && indexOf(rebased, doc2.history) == -1) {
          rebaseHist(doc2.history, change);
          rebased.push(doc2.history);
        }
        makeChangeSingleDoc(doc2, change, null, stretchSpansOverChange(doc2, change));
      });
    }
    function makeChangeFromHistory(doc, type, allowSelectionOnly) {
      var suppress = doc.cm && doc.cm.state.suppressEdits;
      if (suppress && !allowSelectionOnly) {
        return;
      }
      var hist = doc.history, event2, selAfter = doc.sel;
      var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done;
      var i2 = 0;
      for (; i2 < source.length; i2++) {
        event2 = source[i2];
        if (allowSelectionOnly ? event2.ranges && !event2.equals(doc.sel) : !event2.ranges) {
          break;
        }
      }
      if (i2 == source.length) {
        return;
      }
      hist.lastOrigin = hist.lastSelOrigin = null;
      for (; ; ) {
        event2 = source.pop();
        if (event2.ranges) {
          pushSelectionToHistory(event2, dest);
          if (allowSelectionOnly && !event2.equals(doc.sel)) {
            setSelection(doc, event2, { clearRedo: false });
            return;
          }
          selAfter = event2;
        } else if (suppress) {
          source.push(event2);
          return;
        } else {
          break;
        }
      }
      var antiChanges = [];
      pushSelectionToHistory(selAfter, dest);
      dest.push({ changes: antiChanges, generation: hist.generation });
      hist.generation = event2.generation || ++hist.maxGeneration;
      var filter2 = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");
      var loop2 = function(i3) {
        var change = event2.changes[i3];
        change.origin = type;
        if (filter2 && !filterChange(doc, change, false)) {
          source.length = 0;
          return {};
        }
        antiChanges.push(historyChangeFromChange(doc, change));
        var after = i3 ? computeSelAfterChange(doc, change) : lst(source);
        makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
        if (!i3 && doc.cm) {
          doc.cm.scrollIntoView({ from: change.from, to: changeEnd(change) });
        }
        var rebased = [];
        linkedDocs(doc, function(doc2, sharedHist) {
          if (!sharedHist && indexOf(rebased, doc2.history) == -1) {
            rebaseHist(doc2.history, change);
            rebased.push(doc2.history);
          }
          makeChangeSingleDoc(doc2, change, null, mergeOldSpans(doc2, change));
        });
      };
      for (var i$12 = event2.changes.length - 1; i$12 >= 0; --i$12) {
        var returned = loop2(i$12);
        if (returned)
          return returned.v;
      }
    }
    function shiftDoc(doc, distance) {
      if (distance == 0) {
        return;
      }
      doc.first += distance;
      doc.sel = new Selection(map(doc.sel.ranges, function(range2) {
        return new Range(Pos(range2.anchor.line + distance, range2.anchor.ch), Pos(range2.head.line + distance, range2.head.ch));
      }), doc.sel.primIndex);
      if (doc.cm) {
        regChange(doc.cm, doc.first, doc.first - distance, distance);
        for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++) {
          regLineChange(doc.cm, l, "gutter");
        }
      }
    }
    function makeChangeSingleDoc(doc, change, selAfter, spans) {
      if (doc.cm && !doc.cm.curOp) {
        return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);
      }
      if (change.to.line < doc.first) {
        shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
        return;
      }
      if (change.from.line > doc.lastLine()) {
        return;
      }
      if (change.from.line < doc.first) {
        var shift = change.text.length - 1 - (doc.first - change.from.line);
        shiftDoc(doc, shift);
        change = {
          from: Pos(doc.first, 0),
          to: Pos(change.to.line + shift, change.to.ch),
          text: [lst(change.text)],
          origin: change.origin
        };
      }
      var last = doc.lastLine();
      if (change.to.line > last) {
        change = {
          from: change.from,
          to: Pos(last, getLine(doc, last).text.length),
          text: [change.text[0]],
          origin: change.origin
        };
      }
      change.removed = getBetween(doc, change.from, change.to);
      if (!selAfter) {
        selAfter = computeSelAfterChange(doc, change);
      }
      if (doc.cm) {
        makeChangeSingleDocInEditor(doc.cm, change, spans);
      } else {
        updateDoc(doc, change, spans);
      }
      setSelectionNoUndo(doc, selAfter, sel_dontScroll);
      if (doc.cantEdit && skipAtomic(doc, Pos(doc.firstLine(), 0))) {
        doc.cantEdit = false;
      }
    }
    function makeChangeSingleDocInEditor(cm, change, spans) {
      var doc = cm.doc, display = cm.display, from = change.from, to = change.to;
      var recomputeMaxLength = false, checkWidthStart = from.line;
      if (!cm.options.lineWrapping) {
        checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
        doc.iter(checkWidthStart, to.line + 1, function(line) {
          if (line == display.maxLine) {
            recomputeMaxLength = true;
            return true;
          }
        });
      }
      if (doc.sel.contains(change.from, change.to) > -1) {
        signalCursorActivity(cm);
      }
      updateDoc(doc, change, spans, estimateHeight(cm));
      if (!cm.options.lineWrapping) {
        doc.iter(checkWidthStart, from.line + change.text.length, function(line) {
          var len = lineLength(line);
          if (len > display.maxLineLength) {
            display.maxLine = line;
            display.maxLineLength = len;
            display.maxLineChanged = true;
            recomputeMaxLength = false;
          }
        });
        if (recomputeMaxLength) {
          cm.curOp.updateMaxLine = true;
        }
      }
      retreatFrontier(doc, from.line);
      startWorker(cm, 400);
      var lendiff = change.text.length - (to.line - from.line) - 1;
      if (change.full) {
        regChange(cm);
      } else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change)) {
        regLineChange(cm, from.line, "text");
      } else {
        regChange(cm, from.line, to.line + 1, lendiff);
      }
      var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change");
      if (changeHandler || changesHandler) {
        var obj = {
          from,
          to,
          text: change.text,
          removed: change.removed,
          origin: change.origin
        };
        if (changeHandler) {
          signalLater(cm, "change", cm, obj);
        }
        if (changesHandler) {
          (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);
        }
      }
      cm.display.selForContextMenu = null;
    }
    function replaceRange(doc, code, from, to, origin) {
      var assign2;
      if (!to) {
        to = from;
      }
      if (cmp(to, from) < 0) {
        assign2 = [to, from], from = assign2[0], to = assign2[1];
      }
      if (typeof code == "string") {
        code = doc.splitLines(code);
      }
      makeChange(doc, { from, to, text: code, origin });
    }
    function rebaseHistSelSingle(pos, from, to, diff) {
      if (to < pos.line) {
        pos.line += diff;
      } else if (from < pos.line) {
        pos.line = from;
        pos.ch = 0;
      }
    }
    function rebaseHistArray(array, from, to, diff) {
      for (var i2 = 0; i2 < array.length; ++i2) {
        var sub = array[i2], ok = true;
        if (sub.ranges) {
          if (!sub.copied) {
            sub = array[i2] = sub.deepCopy();
            sub.copied = true;
          }
          for (var j = 0; j < sub.ranges.length; j++) {
            rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
            rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
          }
          continue;
        }
        for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
          var cur = sub.changes[j$1];
          if (to < cur.from.line) {
            cur.from = Pos(cur.from.line + diff, cur.from.ch);
            cur.to = Pos(cur.to.line + diff, cur.to.ch);
          } else if (from <= cur.to.line) {
            ok = false;
            break;
          }
        }
        if (!ok) {
          array.splice(0, i2 + 1);
          i2 = 0;
        }
      }
    }
    function rebaseHist(hist, change) {
      var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
      rebaseHistArray(hist.done, from, to, diff);
      rebaseHistArray(hist.undone, from, to, diff);
    }
    function changeLine(doc, handle, changeType, op) {
      var no = handle, line = handle;
      if (typeof handle == "number") {
        line = getLine(doc, clipLine(doc, handle));
      } else {
        no = lineNo(handle);
      }
      if (no == null) {
        return null;
      }
      if (op(line, no) && doc.cm) {
        regLineChange(doc.cm, no, changeType);
      }
      return line;
    }
    function LeafChunk(lines) {
      this.lines = lines;
      this.parent = null;
      var height = 0;
      for (var i2 = 0; i2 < lines.length; ++i2) {
        lines[i2].parent = this;
        height += lines[i2].height;
      }
      this.height = height;
    }
    LeafChunk.prototype = {
      chunkSize: function() {
        return this.lines.length;
      },
      removeInner: function(at, n) {
        for (var i2 = at, e = at + n; i2 < e; ++i2) {
          var line = this.lines[i2];
          this.height -= line.height;
          cleanUpLine(line);
          signalLater(line, "delete");
        }
        this.lines.splice(at, n);
      },
      collapse: function(lines) {
        lines.push.apply(lines, this.lines);
      },
      insertInner: function(at, lines, height) {
        this.height += height;
        this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
        for (var i2 = 0; i2 < lines.length; ++i2) {
          lines[i2].parent = this;
        }
      },
      iterN: function(at, n, op) {
        for (var e = at + n; at < e; ++at) {
          if (op(this.lines[at])) {
            return true;
          }
        }
      }
    };
    function BranchChunk(children2) {
      this.children = children2;
      var size = 0, height = 0;
      for (var i2 = 0; i2 < children2.length; ++i2) {
        var ch = children2[i2];
        size += ch.chunkSize();
        height += ch.height;
        ch.parent = this;
      }
      this.size = size;
      this.height = height;
      this.parent = null;
    }
    BranchChunk.prototype = {
      chunkSize: function() {
        return this.size;
      },
      removeInner: function(at, n) {
        this.size -= n;
        for (var i2 = 0; i2 < this.children.length; ++i2) {
          var child = this.children[i2], sz = child.chunkSize();
          if (at < sz) {
            var rm = Math.min(n, sz - at), oldHeight = child.height;
            child.removeInner(at, rm);
            this.height -= oldHeight - child.height;
            if (sz == rm) {
              this.children.splice(i2--, 1);
              child.parent = null;
            }
            if ((n -= rm) == 0) {
              break;
            }
            at = 0;
          } else {
            at -= sz;
          }
        }
        if (this.size - n < 25 && (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
          var lines = [];
          this.collapse(lines);
          this.children = [new LeafChunk(lines)];
          this.children[0].parent = this;
        }
      },
      collapse: function(lines) {
        for (var i2 = 0; i2 < this.children.length; ++i2) {
          this.children[i2].collapse(lines);
        }
      },
      insertInner: function(at, lines, height) {
        this.size += lines.length;
        this.height += height;
        for (var i2 = 0; i2 < this.children.length; ++i2) {
          var child = this.children[i2], sz = child.chunkSize();
          if (at <= sz) {
            child.insertInner(at, lines, height);
            if (child.lines && child.lines.length > 50) {
              var remaining = child.lines.length % 25 + 25;
              for (var pos = remaining; pos < child.lines.length; ) {
                var leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
                child.height -= leaf.height;
                this.children.splice(++i2, 0, leaf);
                leaf.parent = this;
              }
              child.lines = child.lines.slice(0, remaining);
              this.maybeSpill();
            }
            break;
          }
          at -= sz;
        }
      },
      maybeSpill: function() {
        if (this.children.length <= 10) {
          return;
        }
        var me = this;
        do {
          var spilled = me.children.splice(me.children.length - 5, 5);
          var sibling = new BranchChunk(spilled);
          if (!me.parent) {
            var copy = new BranchChunk(me.children);
            copy.parent = me;
            me.children = [copy, sibling];
            me = copy;
          } else {
            me.size -= sibling.size;
            me.height -= sibling.height;
            var myIndex = indexOf(me.parent.children, me);
            me.parent.children.splice(myIndex + 1, 0, sibling);
          }
          sibling.parent = me.parent;
        } while (me.children.length > 10);
        me.parent.maybeSpill();
      },
      iterN: function(at, n, op) {
        for (var i2 = 0; i2 < this.children.length; ++i2) {
          var child = this.children[i2], sz = child.chunkSize();
          if (at < sz) {
            var used = Math.min(n, sz - at);
            if (child.iterN(at, used, op)) {
              return true;
            }
            if ((n -= used) == 0) {
              break;
            }
            at = 0;
          } else {
            at -= sz;
          }
        }
      }
    };
    var LineWidget = function(doc, node, options) {
      if (options) {
        for (var opt in options) {
          if (options.hasOwnProperty(opt)) {
            this[opt] = options[opt];
          }
        }
      }
      this.doc = doc;
      this.node = node;
    };
    LineWidget.prototype.clear = function() {
      var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line);
      if (no == null || !ws) {
        return;
      }
      for (var i2 = 0; i2 < ws.length; ++i2) {
        if (ws[i2] == this) {
          ws.splice(i2--, 1);
        }
      }
      if (!ws.length) {
        line.widgets = null;
      }
      var height = widgetHeight(this);
      updateLineHeight(line, Math.max(0, line.height - height));
      if (cm) {
        runInOp(cm, function() {
          adjustScrollWhenAboveVisible(cm, line, -height);
          regLineChange(cm, no, "widget");
        });
        signalLater(cm, "lineWidgetCleared", cm, this, no);
      }
    };
    LineWidget.prototype.changed = function() {
      var this$1$1 = this;
      var oldH = this.height, cm = this.doc.cm, line = this.line;
      this.height = null;
      var diff = widgetHeight(this) - oldH;
      if (!diff) {
        return;
      }
      if (!lineIsHidden(this.doc, line)) {
        updateLineHeight(line, line.height + diff);
      }
      if (cm) {
        runInOp(cm, function() {
          cm.curOp.forceUpdate = true;
          adjustScrollWhenAboveVisible(cm, line, diff);
          signalLater(cm, "lineWidgetChanged", cm, this$1$1, lineNo(line));
        });
      }
    };
    eventMixin(LineWidget);
    function adjustScrollWhenAboveVisible(cm, line, diff) {
      if (heightAtLine(line) < (cm.curOp && cm.curOp.scrollTop || cm.doc.scrollTop)) {
        addToScrollTop(cm, diff);
      }
    }
    function addLineWidget(doc, handle, node, options) {
      var widget = new LineWidget(doc, node, options);
      var cm = doc.cm;
      if (cm && widget.noHScroll) {
        cm.display.alignWidgets = true;
      }
      changeLine(doc, handle, "widget", function(line) {
        var widgets = line.widgets || (line.widgets = []);
        if (widget.insertAt == null) {
          widgets.push(widget);
        } else {
          widgets.splice(Math.min(widgets.length, Math.max(0, widget.insertAt)), 0, widget);
        }
        widget.line = line;
        if (cm && !lineIsHidden(doc, line)) {
          var aboveVisible = heightAtLine(line) < doc.scrollTop;
          updateLineHeight(line, line.height + widgetHeight(widget));
          if (aboveVisible) {
            addToScrollTop(cm, widget.height);
          }
          cm.curOp.forceUpdate = true;
        }
        return true;
      });
      if (cm) {
        signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle));
      }
      return widget;
    }
    var nextMarkerId = 0;
    var TextMarker = function(doc, type) {
      this.lines = [];
      this.type = type;
      this.doc = doc;
      this.id = ++nextMarkerId;
    };
    TextMarker.prototype.clear = function() {
      if (this.explicitlyCleared) {
        return;
      }
      var cm = this.doc.cm, withOp = cm && !cm.curOp;
      if (withOp) {
        startOperation(cm);
      }
      if (hasHandler(this, "clear")) {
        var found = this.find();
        if (found) {
          signalLater(this, "clear", found.from, found.to);
        }
      }
      var min = null, max = null;
      for (var i2 = 0; i2 < this.lines.length; ++i2) {
        var line = this.lines[i2];
        var span = getMarkedSpanFor(line.markedSpans, this);
        if (cm && !this.collapsed) {
          regLineChange(cm, lineNo(line), "text");
        } else if (cm) {
          if (span.to != null) {
            max = lineNo(line);
          }
          if (span.from != null) {
            min = lineNo(line);
          }
        }
        line.markedSpans = removeMarkedSpan(line.markedSpans, span);
        if (span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm) {
          updateLineHeight(line, textHeight(cm.display));
        }
      }
      if (cm && this.collapsed && !cm.options.lineWrapping) {
        for (var i$12 = 0; i$12 < this.lines.length; ++i$12) {
          var visual = visualLine(this.lines[i$12]), len = lineLength(visual);
          if (len > cm.display.maxLineLength) {
            cm.display.maxLine = visual;
            cm.display.maxLineLength = len;
            cm.display.maxLineChanged = true;
          }
        }
      }
      if (min != null && cm && this.collapsed) {
        regChange(cm, min, max + 1);
      }
      this.lines.length = 0;
      this.explicitlyCleared = true;
      if (this.atomic && this.doc.cantEdit) {
        this.doc.cantEdit = false;
        if (cm) {
          reCheckSelection(cm.doc);
        }
      }
      if (cm) {
        signalLater(cm, "markerCleared", cm, this, min, max);
      }
      if (withOp) {
        endOperation(cm);
      }
      if (this.parent) {
        this.parent.clear();
      }
    };
    TextMarker.prototype.find = function(side, lineObj) {
      if (side == null && this.type == "bookmark") {
        side = 1;
      }
      var from, to;
      for (var i2 = 0; i2 < this.lines.length; ++i2) {
        var line = this.lines[i2];
        var span = getMarkedSpanFor(line.markedSpans, this);
        if (span.from != null) {
          from = Pos(lineObj ? line : lineNo(line), span.from);
          if (side == -1) {
            return from;
          }
        }
        if (span.to != null) {
          to = Pos(lineObj ? line : lineNo(line), span.to);
          if (side == 1) {
            return to;
          }
        }
      }
      return from && { from, to };
    };
    TextMarker.prototype.changed = function() {
      var this$1$1 = this;
      var pos = this.find(-1, true), widget = this, cm = this.doc.cm;
      if (!pos || !cm) {
        return;
      }
      runInOp(cm, function() {
        var line = pos.line, lineN = lineNo(pos.line);
        var view = findViewForLine(cm, lineN);
        if (view) {
          clearLineMeasurementCacheFor(view);
          cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
        }
        cm.curOp.updateMaxLine = true;
        if (!lineIsHidden(widget.doc, line) && widget.height != null) {
          var oldHeight = widget.height;
          widget.height = null;
          var dHeight = widgetHeight(widget) - oldHeight;
          if (dHeight) {
            updateLineHeight(line, line.height + dHeight);
          }
        }
        signalLater(cm, "markerChanged", cm, this$1$1);
      });
    };
    TextMarker.prototype.attachLine = function(line) {
      if (!this.lines.length && this.doc.cm) {
        var op = this.doc.cm.curOp;
        if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1) {
          (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
        }
      }
      this.lines.push(line);
    };
    TextMarker.prototype.detachLine = function(line) {
      this.lines.splice(indexOf(this.lines, line), 1);
      if (!this.lines.length && this.doc.cm) {
        var op = this.doc.cm.curOp;
        (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
      }
    };
    eventMixin(TextMarker);
    function markText(doc, from, to, options, type) {
      if (options && options.shared) {
        return markTextShared(doc, from, to, options, type);
      }
      if (doc.cm && !doc.cm.curOp) {
        return operation(doc.cm, markText)(doc, from, to, options, type);
      }
      var marker = new TextMarker(doc, type), diff = cmp(from, to);
      if (options) {
        copyObj(options, marker, false);
      }
      if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false) {
        return marker;
      }
      if (marker.replacedWith) {
        marker.collapsed = true;
        marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget");
        if (!options.handleMouseEvents) {
          marker.widgetNode.setAttribute("cm-ignore-events", "true");
        }
        if (options.insertLeft) {
          marker.widgetNode.insertLeft = true;
        }
      }
      if (marker.collapsed) {
        if (conflictingCollapsedRange(doc, from.line, from, to, marker) || from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker)) {
          throw new Error("Inserting collapsed marker partially overlapping an existing one");
        }
        seeCollapsedSpans();
      }
      if (marker.addToHistory) {
        addChangeToHistory(doc, { from, to, origin: "markText" }, doc.sel, NaN);
      }
      var curLine = from.line, cm = doc.cm, updateMaxLine;
      doc.iter(curLine, to.line + 1, function(line) {
        if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine) {
          updateMaxLine = true;
        }
        if (marker.collapsed && curLine != from.line) {
          updateLineHeight(line, 0);
        }
        addMarkedSpan(line, new MarkedSpan(marker, curLine == from.line ? from.ch : null, curLine == to.line ? to.ch : null), doc.cm && doc.cm.curOp);
        ++curLine;
      });
      if (marker.collapsed) {
        doc.iter(from.line, to.line + 1, function(line) {
          if (lineIsHidden(doc, line)) {
            updateLineHeight(line, 0);
          }
        });
      }
      if (marker.clearOnEnter) {
        on(marker, "beforeCursorEnter", function() {
          return marker.clear();
        });
      }
      if (marker.readOnly) {
        seeReadOnlySpans();
        if (doc.history.done.length || doc.history.undone.length) {
          doc.clearHistory();
        }
      }
      if (marker.collapsed) {
        marker.id = ++nextMarkerId;
        marker.atomic = true;
      }
      if (cm) {
        if (updateMaxLine) {
          cm.curOp.updateMaxLine = true;
        }
        if (marker.collapsed) {
          regChange(cm, from.line, to.line + 1);
        } else if (marker.className || marker.startStyle || marker.endStyle || marker.css || marker.attributes || marker.title) {
          for (var i2 = from.line; i2 <= to.line; i2++) {
            regLineChange(cm, i2, "text");
          }
        }
        if (marker.atomic) {
          reCheckSelection(cm.doc);
        }
        signalLater(cm, "markerAdded", cm, marker);
      }
      return marker;
    }
    var SharedTextMarker = function(markers, primary) {
      this.markers = markers;
      this.primary = primary;
      for (var i2 = 0; i2 < markers.length; ++i2) {
        markers[i2].parent = this;
      }
    };
    SharedTextMarker.prototype.clear = function() {
      if (this.explicitlyCleared) {
        return;
      }
      this.explicitlyCleared = true;
      for (var i2 = 0; i2 < this.markers.length; ++i2) {
        this.markers[i2].clear();
      }
      signalLater(this, "clear");
    };
    SharedTextMarker.prototype.find = function(side, lineObj) {
      return this.primary.find(side, lineObj);
    };
    eventMixin(SharedTextMarker);
    function markTextShared(doc, from, to, options, type) {
      options = copyObj(options);
      options.shared = false;
      var markers = [markText(doc, from, to, options, type)], primary = markers[0];
      var widget = options.widgetNode;
      linkedDocs(doc, function(doc2) {
        if (widget) {
          options.widgetNode = widget.cloneNode(true);
        }
        markers.push(markText(doc2, clipPos(doc2, from), clipPos(doc2, to), options, type));
        for (var i2 = 0; i2 < doc2.linked.length; ++i2) {
          if (doc2.linked[i2].isParent) {
            return;
          }
        }
        primary = lst(markers);
      });
      return new SharedTextMarker(markers, primary);
    }
    function findSharedMarkers(doc) {
      return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function(m) {
        return m.parent;
      });
    }
    function copySharedMarkers(doc, markers) {
      for (var i2 = 0; i2 < markers.length; i2++) {
        var marker = markers[i2], pos = marker.find();
        var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
        if (cmp(mFrom, mTo)) {
          var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
          marker.markers.push(subMark);
          subMark.parent = marker;
        }
      }
    }
    function detachSharedMarkers(markers) {
      var loop2 = function(i3) {
        var marker = markers[i3], linked = [marker.primary.doc];
        linkedDocs(marker.primary.doc, function(d) {
          return linked.push(d);
        });
        for (var j = 0; j < marker.markers.length; j++) {
          var subMarker = marker.markers[j];
          if (indexOf(linked, subMarker.doc) == -1) {
            subMarker.parent = null;
            marker.markers.splice(j--, 1);
          }
        }
      };
      for (var i2 = 0; i2 < markers.length; i2++)
        loop2(i2);
    }
    var nextDocId = 0;
    var Doc = function(text2, mode, firstLine, lineSep, direction) {
      if (!(this instanceof Doc)) {
        return new Doc(text2, mode, firstLine, lineSep, direction);
      }
      if (firstLine == null) {
        firstLine = 0;
      }
      BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
      this.first = firstLine;
      this.scrollTop = this.scrollLeft = 0;
      this.cantEdit = false;
      this.cleanGeneration = 1;
      this.modeFrontier = this.highlightFrontier = firstLine;
      var start2 = Pos(firstLine, 0);
      this.sel = simpleSelection(start2);
      this.history = new History(null);
      this.id = ++nextDocId;
      this.modeOption = mode;
      this.lineSep = lineSep;
      this.direction = direction == "rtl" ? "rtl" : "ltr";
      this.extend = false;
      if (typeof text2 == "string") {
        text2 = this.splitLines(text2);
      }
      updateDoc(this, { from: start2, to: start2, text: text2 });
      setSelection(this, simpleSelection(start2), sel_dontScroll);
    };
    Doc.prototype = createObj(BranchChunk.prototype, {
      constructor: Doc,
      iter: function(from, to, op) {
        if (op) {
          this.iterN(from - this.first, to - from, op);
        } else {
          this.iterN(this.first, this.first + this.size, from);
        }
      },
      insert: function(at, lines) {
        var height = 0;
        for (var i2 = 0; i2 < lines.length; ++i2) {
          height += lines[i2].height;
        }
        this.insertInner(at - this.first, lines, height);
      },
      remove: function(at, n) {
        this.removeInner(at - this.first, n);
      },
      getValue: function(lineSep) {
        var lines = getLines(this, this.first, this.first + this.size);
        if (lineSep === false) {
          return lines;
        }
        return lines.join(lineSep || this.lineSeparator());
      },
      setValue: docMethodOp(function(code) {
        var top = Pos(this.first, 0), last = this.first + this.size - 1;
        makeChange(this, {
          from: top,
          to: Pos(last, getLine(this, last).text.length),
          text: this.splitLines(code),
          origin: "setValue",
          full: true
        }, true);
        if (this.cm) {
          scrollToCoords(this.cm, 0, 0);
        }
        setSelection(this, simpleSelection(top), sel_dontScroll);
      }),
      replaceRange: function(code, from, to, origin) {
        from = clipPos(this, from);
        to = to ? clipPos(this, to) : from;
        replaceRange(this, code, from, to, origin);
      },
      getRange: function(from, to, lineSep) {
        var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
        if (lineSep === false) {
          return lines;
        }
        if (lineSep === "") {
          return lines.join("");
        }
        return lines.join(lineSep || this.lineSeparator());
      },
      getLine: function(line) {
        var l = this.getLineHandle(line);
        return l && l.text;
      },
      getLineHandle: function(line) {
        if (isLine(this, line)) {
          return getLine(this, line);
        }
      },
      getLineNumber: function(line) {
        return lineNo(line);
      },
      getLineHandleVisualStart: function(line) {
        if (typeof line == "number") {
          line = getLine(this, line);
        }
        return visualLine(line);
      },
      lineCount: function() {
        return this.size;
      },
      firstLine: function() {
        return this.first;
      },
      lastLine: function() {
        return this.first + this.size - 1;
      },
      clipPos: function(pos) {
        return clipPos(this, pos);
      },
      getCursor: function(start2) {
        var range2 = this.sel.primary(), pos;
        if (start2 == null || start2 == "head") {
          pos = range2.head;
        } else if (start2 == "anchor") {
          pos = range2.anchor;
        } else if (start2 == "end" || start2 == "to" || start2 === false) {
          pos = range2.to();
        } else {
          pos = range2.from();
        }
        return pos;
      },
      listSelections: function() {
        return this.sel.ranges;
      },
      somethingSelected: function() {
        return this.sel.somethingSelected();
      },
      setCursor: docMethodOp(function(line, ch, options) {
        setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
      }),
      setSelection: docMethodOp(function(anchor, head, options) {
        setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
      }),
      extendSelection: docMethodOp(function(head, other, options) {
        extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
      }),
      extendSelections: docMethodOp(function(heads, options) {
        extendSelections(this, clipPosArray(this, heads), options);
      }),
      extendSelectionsBy: docMethodOp(function(f, options) {
        var heads = map(this.sel.ranges, f);
        extendSelections(this, clipPosArray(this, heads), options);
      }),
      setSelections: docMethodOp(function(ranges, primary, options) {
        if (!ranges.length) {
          return;
        }
        var out = [];
        for (var i2 = 0; i2 < ranges.length; i2++) {
          out[i2] = new Range(clipPos(this, ranges[i2].anchor), clipPos(this, ranges[i2].head || ranges[i2].anchor));
        }
        if (primary == null) {
          primary = Math.min(ranges.length - 1, this.sel.primIndex);
        }
        setSelection(this, normalizeSelection(this.cm, out, primary), options);
      }),
      addSelection: docMethodOp(function(anchor, head, options) {
        var ranges = this.sel.ranges.slice(0);
        ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
        setSelection(this, normalizeSelection(this.cm, ranges, ranges.length - 1), options);
      }),
      getSelection: function(lineSep) {
        var ranges = this.sel.ranges, lines;
        for (var i2 = 0; i2 < ranges.length; i2++) {
          var sel = getBetween(this, ranges[i2].from(), ranges[i2].to());
          lines = lines ? lines.concat(sel) : sel;
        }
        if (lineSep === false) {
          return lines;
        } else {
          return lines.join(lineSep || this.lineSeparator());
        }
      },
      getSelections: function(lineSep) {
        var parts = [], ranges = this.sel.ranges;
        for (var i2 = 0; i2 < ranges.length; i2++) {
          var sel = getBetween(this, ranges[i2].from(), ranges[i2].to());
          if (lineSep !== false) {
            sel = sel.join(lineSep || this.lineSeparator());
          }
          parts[i2] = sel;
        }
        return parts;
      },
      replaceSelection: function(code, collapse, origin) {
        var dup = [];
        for (var i2 = 0; i2 < this.sel.ranges.length; i2++) {
          dup[i2] = code;
        }
        this.replaceSelections(dup, collapse, origin || "+input");
      },
      replaceSelections: docMethodOp(function(code, collapse, origin) {
        var changes = [], sel = this.sel;
        for (var i2 = 0; i2 < sel.ranges.length; i2++) {
          var range2 = sel.ranges[i2];
          changes[i2] = { from: range2.from(), to: range2.to(), text: this.splitLines(code[i2]), origin };
        }
        var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
        for (var i$12 = changes.length - 1; i$12 >= 0; i$12--) {
          makeChange(this, changes[i$12]);
        }
        if (newSel) {
          setSelectionReplaceHistory(this, newSel);
        } else if (this.cm) {
          ensureCursorVisible(this.cm);
        }
      }),
      undo: docMethodOp(function() {
        makeChangeFromHistory(this, "undo");
      }),
      redo: docMethodOp(function() {
        makeChangeFromHistory(this, "redo");
      }),
      undoSelection: docMethodOp(function() {
        makeChangeFromHistory(this, "undo", true);
      }),
      redoSelection: docMethodOp(function() {
        makeChangeFromHistory(this, "redo", true);
      }),
      setExtending: function(val) {
        this.extend = val;
      },
      getExtending: function() {
        return this.extend;
      },
      historySize: function() {
        var hist = this.history, done = 0, undone = 0;
        for (var i2 = 0; i2 < hist.done.length; i2++) {
          if (!hist.done[i2].ranges) {
            ++done;
          }
        }
        for (var i$12 = 0; i$12 < hist.undone.length; i$12++) {
          if (!hist.undone[i$12].ranges) {
            ++undone;
          }
        }
        return { undo: done, redo: undone };
      },
      clearHistory: function() {
        var this$1$1 = this;
        this.history = new History(this.history);
        linkedDocs(this, function(doc) {
          return doc.history = this$1$1.history;
        }, true);
      },
      markClean: function() {
        this.cleanGeneration = this.changeGeneration(true);
      },
      changeGeneration: function(forceSplit) {
        if (forceSplit) {
          this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
        }
        return this.history.generation;
      },
      isClean: function(gen) {
        return this.history.generation == (gen || this.cleanGeneration);
      },
      getHistory: function() {
        return {
          done: copyHistoryArray(this.history.done),
          undone: copyHistoryArray(this.history.undone)
        };
      },
      setHistory: function(histData) {
        var hist = this.history = new History(this.history);
        hist.done = copyHistoryArray(histData.done.slice(0), null, true);
        hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
      },
      setGutterMarker: docMethodOp(function(line, gutterID, value) {
        return changeLine(this, line, "gutter", function(line2) {
          var markers = line2.gutterMarkers || (line2.gutterMarkers = {});
          markers[gutterID] = value;
          if (!value && isEmpty(markers)) {
            line2.gutterMarkers = null;
          }
          return true;
        });
      }),
      clearGutter: docMethodOp(function(gutterID) {
        var this$1$1 = this;
        this.iter(function(line) {
          if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
            changeLine(this$1$1, line, "gutter", function() {
              line.gutterMarkers[gutterID] = null;
              if (isEmpty(line.gutterMarkers)) {
                line.gutterMarkers = null;
              }
              return true;
            });
          }
        });
      }),
      lineInfo: function(line) {
        var n;
        if (typeof line == "number") {
          if (!isLine(this, line)) {
            return null;
          }
          n = line;
          line = getLine(this, line);
          if (!line) {
            return null;
          }
        } else {
          n = lineNo(line);
          if (n == null) {
            return null;
          }
        }
        return {
          line: n,
          handle: line,
          text: line.text,
          gutterMarkers: line.gutterMarkers,
          textClass: line.textClass,
          bgClass: line.bgClass,
          wrapClass: line.wrapClass,
          widgets: line.widgets
        };
      },
      addLineClass: docMethodOp(function(handle, where, cls) {
        return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function(line) {
          var prop2 = where == "text" ? "textClass" : where == "background" ? "bgClass" : where == "gutter" ? "gutterClass" : "wrapClass";
          if (!line[prop2]) {
            line[prop2] = cls;
          } else if (classTest(cls).test(line[prop2])) {
            return false;
          } else {
            line[prop2] += " " + cls;
          }
          return true;
        });
      }),
      removeLineClass: docMethodOp(function(handle, where, cls) {
        return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function(line) {
          var prop2 = where == "text" ? "textClass" : where == "background" ? "bgClass" : where == "gutter" ? "gutterClass" : "wrapClass";
          var cur = line[prop2];
          if (!cur) {
            return false;
          } else if (cls == null) {
            line[prop2] = null;
          } else {
            var found = cur.match(classTest(cls));
            if (!found) {
              return false;
            }
            var end = found.index + found[0].length;
            line[prop2] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
          }
          return true;
        });
      }),
      addLineWidget: docMethodOp(function(handle, node, options) {
        return addLineWidget(this, handle, node, options);
      }),
      removeLineWidget: function(widget) {
        widget.clear();
      },
      markText: function(from, to, options) {
        return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range");
      },
      setBookmark: function(pos, options) {
        var realOpts = {
          replacedWith: options && (options.nodeType == null ? options.widget : options),
          insertLeft: options && options.insertLeft,
          clearWhenEmpty: false,
          shared: options && options.shared,
          handleMouseEvents: options && options.handleMouseEvents
        };
        pos = clipPos(this, pos);
        return markText(this, pos, pos, realOpts, "bookmark");
      },
      findMarksAt: function(pos) {
        pos = clipPos(this, pos);
        var markers = [], spans = getLine(this, pos.line).markedSpans;
        if (spans) {
          for (var i2 = 0; i2 < spans.length; ++i2) {
            var span = spans[i2];
            if ((span.from == null || span.from <= pos.ch) && (span.to == null || span.to >= pos.ch)) {
              markers.push(span.marker.parent || span.marker);
            }
          }
        }
        return markers;
      },
      findMarks: function(from, to, filter2) {
        from = clipPos(this, from);
        to = clipPos(this, to);
        var found = [], lineNo2 = from.line;
        this.iter(from.line, to.line + 1, function(line) {
          var spans = line.markedSpans;
          if (spans) {
            for (var i2 = 0; i2 < spans.length; i2++) {
              var span = spans[i2];
              if (!(span.to != null && lineNo2 == from.line && from.ch >= span.to || span.from == null && lineNo2 != from.line || span.from != null && lineNo2 == to.line && span.from >= to.ch) && (!filter2 || filter2(span.marker))) {
                found.push(span.marker.parent || span.marker);
              }
            }
          }
          ++lineNo2;
        });
        return found;
      },
      getAllMarks: function() {
        var markers = [];
        this.iter(function(line) {
          var sps = line.markedSpans;
          if (sps) {
            for (var i2 = 0; i2 < sps.length; ++i2) {
              if (sps[i2].from != null) {
                markers.push(sps[i2].marker);
              }
            }
          }
        });
        return markers;
      },
      posFromIndex: function(off2) {
        var ch, lineNo2 = this.first, sepSize = this.lineSeparator().length;
        this.iter(function(line) {
          var sz = line.text.length + sepSize;
          if (sz > off2) {
            ch = off2;
            return true;
          }
          off2 -= sz;
          ++lineNo2;
        });
        return clipPos(this, Pos(lineNo2, ch));
      },
      indexFromPos: function(coords) {
        coords = clipPos(this, coords);
        var index = coords.ch;
        if (coords.line < this.first || coords.ch < 0) {
          return 0;
        }
        var sepSize = this.lineSeparator().length;
        this.iter(this.first, coords.line, function(line) {
          index += line.text.length + sepSize;
        });
        return index;
      },
      copy: function(copyHistory) {
        var doc = new Doc(getLines(this, this.first, this.first + this.size), this.modeOption, this.first, this.lineSep, this.direction);
        doc.scrollTop = this.scrollTop;
        doc.scrollLeft = this.scrollLeft;
        doc.sel = this.sel;
        doc.extend = false;
        if (copyHistory) {
          doc.history.undoDepth = this.history.undoDepth;
          doc.setHistory(this.getHistory());
        }
        return doc;
      },
      linkedDoc: function(options) {
        if (!options) {
          options = {};
        }
        var from = this.first, to = this.first + this.size;
        if (options.from != null && options.from > from) {
          from = options.from;
        }
        if (options.to != null && options.to < to) {
          to = options.to;
        }
        var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
        if (options.sharedHist) {
          copy.history = this.history;
        }
        (this.linked || (this.linked = [])).push({ doc: copy, sharedHist: options.sharedHist });
        copy.linked = [{ doc: this, isParent: true, sharedHist: options.sharedHist }];
        copySharedMarkers(copy, findSharedMarkers(this));
        return copy;
      },
      unlinkDoc: function(other) {
        if (other instanceof CodeMirror2) {
          other = other.doc;
        }
        if (this.linked) {
          for (var i2 = 0; i2 < this.linked.length; ++i2) {
            var link = this.linked[i2];
            if (link.doc != other) {
              continue;
            }
            this.linked.splice(i2, 1);
            other.unlinkDoc(this);
            detachSharedMarkers(findSharedMarkers(this));
            break;
          }
        }
        if (other.history == this.history) {
          var splitIds = [other.id];
          linkedDocs(other, function(doc) {
            return splitIds.push(doc.id);
          }, true);
          other.history = new History(null);
          other.history.done = copyHistoryArray(this.history.done, splitIds);
          other.history.undone = copyHistoryArray(this.history.undone, splitIds);
        }
      },
      iterLinkedDocs: function(f) {
        linkedDocs(this, f);
      },
      getMode: function() {
        return this.mode;
      },
      getEditor: function() {
        return this.cm;
      },
      splitLines: function(str) {
        if (this.lineSep) {
          return str.split(this.lineSep);
        }
        return splitLinesAuto(str);
      },
      lineSeparator: function() {
        return this.lineSep || "\n";
      },
      setDirection: docMethodOp(function(dir) {
        if (dir != "rtl") {
          dir = "ltr";
        }
        if (dir == this.direction) {
          return;
        }
        this.direction = dir;
        this.iter(function(line) {
          return line.order = null;
        });
        if (this.cm) {
          directionChanged(this.cm);
        }
      })
    });
    Doc.prototype.eachLine = Doc.prototype.iter;
    var lastDrop = 0;
    function onDrop(e) {
      var cm = this;
      clearDragCursor(cm);
      if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) {
        return;
      }
      e_preventDefault(e);
      if (ie) {
        lastDrop = +new Date();
      }
      var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
      if (!pos || cm.isReadOnly()) {
        return;
      }
      if (files && files.length && window.FileReader && window.File) {
        var n = files.length, text2 = Array(n), read = 0;
        var markAsReadAndPasteIfAllFilesAreRead = function() {
          if (++read == n) {
            operation(cm, function() {
              pos = clipPos(cm.doc, pos);
              var change = {
                from: pos,
                to: pos,
                text: cm.doc.splitLines(text2.filter(function(t) {
                  return t != null;
                }).join(cm.doc.lineSeparator())),
                origin: "paste"
              };
              makeChange(cm.doc, change);
              setSelectionReplaceHistory(cm.doc, simpleSelection(clipPos(cm.doc, pos), clipPos(cm.doc, changeEnd(change))));
            })();
          }
        };
        var readTextFromFile = function(file, i3) {
          if (cm.options.allowDropFileTypes && indexOf(cm.options.allowDropFileTypes, file.type) == -1) {
            markAsReadAndPasteIfAllFilesAreRead();
            return;
          }
          var reader = new FileReader();
          reader.onerror = function() {
            return markAsReadAndPasteIfAllFilesAreRead();
          };
          reader.onload = function() {
            var content = reader.result;
            if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) {
              markAsReadAndPasteIfAllFilesAreRead();
              return;
            }
            text2[i3] = content;
            markAsReadAndPasteIfAllFilesAreRead();
          };
          reader.readAsText(file);
        };
        for (var i2 = 0; i2 < files.length; i2++) {
          readTextFromFile(files[i2], i2);
        }
      } else {
        if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
          cm.state.draggingText(e);
          setTimeout(function() {
            return cm.display.input.focus();
          }, 20);
          return;
        }
        try {
          var text$1 = e.dataTransfer.getData("Text");
          if (text$1) {
            var selected;
            if (cm.state.draggingText && !cm.state.draggingText.copy) {
              selected = cm.listSelections();
            }
            setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
            if (selected) {
              for (var i$12 = 0; i$12 < selected.length; ++i$12) {
                replaceRange(cm.doc, "", selected[i$12].anchor, selected[i$12].head, "drag");
              }
            }
            cm.replaceSelection(text$1, "around", "paste");
            cm.display.input.focus();
          }
        } catch (e$1) {
        }
      }
    }
    function onDragStart(cm, e) {
      if (ie && (!cm.state.draggingText || +new Date() - lastDrop < 100)) {
        e_stop(e);
        return;
      }
      if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) {
        return;
      }
      e.dataTransfer.setData("Text", cm.getSelection());
      e.dataTransfer.effectAllowed = "copyMove";
      if (e.dataTransfer.setDragImage && !safari) {
        var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
        img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
        if (presto) {
          img.width = img.height = 1;
          cm.display.wrapper.appendChild(img);
          img._top = img.offsetTop;
        }
        e.dataTransfer.setDragImage(img, 0, 0);
        if (presto) {
          img.parentNode.removeChild(img);
        }
      }
    }
    function onDragOver(cm, e) {
      var pos = posFromMouse(cm, e);
      if (!pos) {
        return;
      }
      var frag = document.createDocumentFragment();
      drawSelectionCursor(cm, pos, frag);
      if (!cm.display.dragCursor) {
        cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
        cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
      }
      removeChildrenAndAdd(cm.display.dragCursor, frag);
    }
    function clearDragCursor(cm) {
      if (cm.display.dragCursor) {
        cm.display.lineSpace.removeChild(cm.display.dragCursor);
        cm.display.dragCursor = null;
      }
    }
    function forEachCodeMirror(f) {
      if (!document.getElementsByClassName) {
        return;
      }
      var byClass = document.getElementsByClassName("CodeMirror"), editors = [];
      for (var i2 = 0; i2 < byClass.length; i2++) {
        var cm = byClass[i2].CodeMirror;
        if (cm) {
          editors.push(cm);
        }
      }
      if (editors.length) {
        editors[0].operation(function() {
          for (var i3 = 0; i3 < editors.length; i3++) {
            f(editors[i3]);
          }
        });
      }
    }
    var globalsRegistered = false;
    function ensureGlobalHandlers() {
      if (globalsRegistered) {
        return;
      }
      registerGlobalHandlers();
      globalsRegistered = true;
    }
    function registerGlobalHandlers() {
      var resizeTimer;
      on(window, "resize", function() {
        if (resizeTimer == null) {
          resizeTimer = setTimeout(function() {
            resizeTimer = null;
            forEachCodeMirror(onResize);
          }, 100);
        }
      });
      on(window, "blur", function() {
        return forEachCodeMirror(onBlur);
      });
    }
    function onResize(cm) {
      var d = cm.display;
      d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
      d.scrollbarsClipped = false;
      cm.setSize();
    }
    var keyNames = {
      3: "Pause",
      8: "Backspace",
      9: "Tab",
      13: "Enter",
      16: "Shift",
      17: "Ctrl",
      18: "Alt",
      19: "Pause",
      20: "CapsLock",
      27: "Esc",
      32: "Space",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "Left",
      38: "Up",
      39: "Right",
      40: "Down",
      44: "PrintScrn",
      45: "Insert",
      46: "Delete",
      59: ";",
      61: "=",
      91: "Mod",
      92: "Mod",
      93: "Mod",
      106: "*",
      107: "=",
      109: "-",
      110: ".",
      111: "/",
      145: "ScrollLock",
      173: "-",
      186: ";",
      187: "=",
      188: ",",
      189: "-",
      190: ".",
      191: "/",
      192: "`",
      219: "[",
      220: "\\",
      221: "]",
      222: "'",
      224: "Mod",
      63232: "Up",
      63233: "Down",
      63234: "Left",
      63235: "Right",
      63272: "Delete",
      63273: "Home",
      63275: "End",
      63276: "PageUp",
      63277: "PageDown",
      63302: "Insert"
    };
    for (var i = 0; i < 10; i++) {
      keyNames[i + 48] = keyNames[i + 96] = String(i);
    }
    for (var i$1 = 65; i$1 <= 90; i$1++) {
      keyNames[i$1] = String.fromCharCode(i$1);
    }
    for (var i$2 = 1; i$2 <= 12; i$2++) {
      keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2;
    }
    var keyMap = {};
    keyMap.basic = {
      "Left": "goCharLeft",
      "Right": "goCharRight",
      "Up": "goLineUp",
      "Down": "goLineDown",
      "End": "goLineEnd",
      "Home": "goLineStartSmart",
      "PageUp": "goPageUp",
      "PageDown": "goPageDown",
      "Delete": "delCharAfter",
      "Backspace": "delCharBefore",
      "Shift-Backspace": "delCharBefore",
      "Tab": "defaultTab",
      "Shift-Tab": "indentAuto",
      "Enter": "newlineAndIndent",
      "Insert": "toggleOverwrite",
      "Esc": "singleSelection"
    };
    keyMap.pcDefault = {
      "Ctrl-A": "selectAll",
      "Ctrl-D": "deleteLine",
      "Ctrl-Z": "undo",
      "Shift-Ctrl-Z": "redo",
      "Ctrl-Y": "redo",
      "Ctrl-Home": "goDocStart",
      "Ctrl-End": "goDocEnd",
      "Ctrl-Up": "goLineUp",
      "Ctrl-Down": "goLineDown",
      "Ctrl-Left": "goGroupLeft",
      "Ctrl-Right": "goGroupRight",
      "Alt-Left": "goLineStart",
      "Alt-Right": "goLineEnd",
      "Ctrl-Backspace": "delGroupBefore",
      "Ctrl-Delete": "delGroupAfter",
      "Ctrl-S": "save",
      "Ctrl-F": "find",
      "Ctrl-G": "findNext",
      "Shift-Ctrl-G": "findPrev",
      "Shift-Ctrl-F": "replace",
      "Shift-Ctrl-R": "replaceAll",
      "Ctrl-[": "indentLess",
      "Ctrl-]": "indentMore",
      "Ctrl-U": "undoSelection",
      "Shift-Ctrl-U": "redoSelection",
      "Alt-U": "redoSelection",
      "fallthrough": "basic"
    };
    keyMap.emacsy = {
      "Ctrl-F": "goCharRight",
      "Ctrl-B": "goCharLeft",
      "Ctrl-P": "goLineUp",
      "Ctrl-N": "goLineDown",
      "Ctrl-A": "goLineStart",
      "Ctrl-E": "goLineEnd",
      "Ctrl-V": "goPageDown",
      "Shift-Ctrl-V": "goPageUp",
      "Ctrl-D": "delCharAfter",
      "Ctrl-H": "delCharBefore",
      "Alt-Backspace": "delWordBefore",
      "Ctrl-K": "killLine",
      "Ctrl-T": "transposeChars",
      "Ctrl-O": "openLine"
    };
    keyMap.macDefault = {
      "Cmd-A": "selectAll",
      "Cmd-D": "deleteLine",
      "Cmd-Z": "undo",
      "Shift-Cmd-Z": "redo",
      "Cmd-Y": "redo",
      "Cmd-Home": "goDocStart",
      "Cmd-Up": "goDocStart",
      "Cmd-End": "goDocEnd",
      "Cmd-Down": "goDocEnd",
      "Alt-Left": "goGroupLeft",
      "Alt-Right": "goGroupRight",
      "Cmd-Left": "goLineLeft",
      "Cmd-Right": "goLineRight",
      "Alt-Backspace": "delGroupBefore",
      "Ctrl-Alt-Backspace": "delGroupAfter",
      "Alt-Delete": "delGroupAfter",
      "Cmd-S": "save",
      "Cmd-F": "find",
      "Cmd-G": "findNext",
      "Shift-Cmd-G": "findPrev",
      "Cmd-Alt-F": "replace",
      "Shift-Cmd-Alt-F": "replaceAll",
      "Cmd-[": "indentLess",
      "Cmd-]": "indentMore",
      "Cmd-Backspace": "delWrappedLineLeft",
      "Cmd-Delete": "delWrappedLineRight",
      "Cmd-U": "undoSelection",
      "Shift-Cmd-U": "redoSelection",
      "Ctrl-Up": "goDocStart",
      "Ctrl-Down": "goDocEnd",
      "fallthrough": ["basic", "emacsy"]
    };
    keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;
    function normalizeKeyName(name) {
      var parts = name.split(/-(?!$)/);
      name = parts[parts.length - 1];
      var alt, ctrl, shift, cmd;
      for (var i2 = 0; i2 < parts.length - 1; i2++) {
        var mod = parts[i2];
        if (/^(cmd|meta|m)$/i.test(mod)) {
          cmd = true;
        } else if (/^a(lt)?$/i.test(mod)) {
          alt = true;
        } else if (/^(c|ctrl|control)$/i.test(mod)) {
          ctrl = true;
        } else if (/^s(hift)?$/i.test(mod)) {
          shift = true;
        } else {
          throw new Error("Unrecognized modifier name: " + mod);
        }
      }
      if (alt) {
        name = "Alt-" + name;
      }
      if (ctrl) {
        name = "Ctrl-" + name;
      }
      if (cmd) {
        name = "Cmd-" + name;
      }
      if (shift) {
        name = "Shift-" + name;
      }
      return name;
    }
    function normalizeKeyMap(keymap) {
      var copy = {};
      for (var keyname in keymap) {
        if (keymap.hasOwnProperty(keyname)) {
          var value = keymap[keyname];
          if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) {
            continue;
          }
          if (value == "...") {
            delete keymap[keyname];
            continue;
          }
          var keys = map(keyname.split(" "), normalizeKeyName);
          for (var i2 = 0; i2 < keys.length; i2++) {
            var val = void 0, name = void 0;
            if (i2 == keys.length - 1) {
              name = keys.join(" ");
              val = value;
            } else {
              name = keys.slice(0, i2 + 1).join(" ");
              val = "...";
            }
            var prev = copy[name];
            if (!prev) {
              copy[name] = val;
            } else if (prev != val) {
              throw new Error("Inconsistent bindings for " + name);
            }
          }
          delete keymap[keyname];
        }
      }
      for (var prop2 in copy) {
        keymap[prop2] = copy[prop2];
      }
      return keymap;
    }
    function lookupKey(key, map2, handle, context) {
      map2 = getKeyMap(map2);
      var found = map2.call ? map2.call(key, context) : map2[key];
      if (found === false) {
        return "nothing";
      }
      if (found === "...") {
        return "multi";
      }
      if (found != null && handle(found)) {
        return "handled";
      }
      if (map2.fallthrough) {
        if (Object.prototype.toString.call(map2.fallthrough) != "[object Array]") {
          return lookupKey(key, map2.fallthrough, handle, context);
        }
        for (var i2 = 0; i2 < map2.fallthrough.length; i2++) {
          var result = lookupKey(key, map2.fallthrough[i2], handle, context);
          if (result) {
            return result;
          }
        }
      }
    }
    function isModifierKey(value) {
      var name = typeof value == "string" ? value : keyNames[value.keyCode];
      return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
    }
    function addModifierNames(name, event2, noShift) {
      var base = name;
      if (event2.altKey && base != "Alt") {
        name = "Alt-" + name;
      }
      if ((flipCtrlCmd ? event2.metaKey : event2.ctrlKey) && base != "Ctrl") {
        name = "Ctrl-" + name;
      }
      if ((flipCtrlCmd ? event2.ctrlKey : event2.metaKey) && base != "Mod") {
        name = "Cmd-" + name;
      }
      if (!noShift && event2.shiftKey && base != "Shift") {
        name = "Shift-" + name;
      }
      return name;
    }
    function keyName(event2, noShift) {
      if (presto && event2.keyCode == 34 && event2["char"]) {
        return false;
      }
      var name = keyNames[event2.keyCode];
      if (name == null || event2.altGraphKey) {
        return false;
      }
      if (event2.keyCode == 3 && event2.code) {
        name = event2.code;
      }
      return addModifierNames(name, event2, noShift);
    }
    function getKeyMap(val) {
      return typeof val == "string" ? keyMap[val] : val;
    }
    function deleteNearSelection(cm, compute) {
      var ranges = cm.doc.sel.ranges, kill = [];
      for (var i2 = 0; i2 < ranges.length; i2++) {
        var toKill = compute(ranges[i2]);
        while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
          var replaced = kill.pop();
          if (cmp(replaced.from, toKill.from) < 0) {
            toKill.from = replaced.from;
            break;
          }
        }
        kill.push(toKill);
      }
      runInOp(cm, function() {
        for (var i3 = kill.length - 1; i3 >= 0; i3--) {
          replaceRange(cm.doc, "", kill[i3].from, kill[i3].to, "+delete");
        }
        ensureCursorVisible(cm);
      });
    }
    function moveCharLogically(line, ch, dir) {
      var target = skipExtendingChars(line.text, ch + dir, dir);
      return target < 0 || target > line.text.length ? null : target;
    }
    function moveLogically(line, start2, dir) {
      var ch = moveCharLogically(line, start2.ch, dir);
      return ch == null ? null : new Pos(start2.line, ch, dir < 0 ? "after" : "before");
    }
    function endOfLine(visually, cm, lineObj, lineNo2, dir) {
      if (visually) {
        if (cm.doc.direction == "rtl") {
          dir = -dir;
        }
        var order = getOrder(lineObj, cm.doc.direction);
        if (order) {
          var part = dir < 0 ? lst(order) : order[0];
          var moveInStorageOrder = dir < 0 == (part.level == 1);
          var sticky = moveInStorageOrder ? "after" : "before";
          var ch;
          if (part.level > 0 || cm.doc.direction == "rtl") {
            var prep = prepareMeasureForLine(cm, lineObj);
            ch = dir < 0 ? lineObj.text.length - 1 : 0;
            var targetTop = measureCharPrepared(cm, prep, ch).top;
            ch = findFirst(function(ch2) {
              return measureCharPrepared(cm, prep, ch2).top == targetTop;
            }, dir < 0 == (part.level == 1) ? part.from : part.to - 1, ch);
            if (sticky == "before") {
              ch = moveCharLogically(lineObj, ch, 1);
            }
          } else {
            ch = dir < 0 ? part.to : part.from;
          }
          return new Pos(lineNo2, ch, sticky);
        }
      }
      return new Pos(lineNo2, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after");
    }
    function moveVisually(cm, line, start2, dir) {
      var bidi = getOrder(line, cm.doc.direction);
      if (!bidi) {
        return moveLogically(line, start2, dir);
      }
      if (start2.ch >= line.text.length) {
        start2.ch = line.text.length;
        start2.sticky = "before";
      } else if (start2.ch <= 0) {
        start2.ch = 0;
        start2.sticky = "after";
      }
      var partPos = getBidiPartAt(bidi, start2.ch, start2.sticky), part = bidi[partPos];
      if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start2.ch : part.from < start2.ch)) {
        return moveLogically(line, start2, dir);
      }
      var mv = function(pos, dir2) {
        return moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir2);
      };
      var prep;
      var getWrappedLineExtent = function(ch2) {
        if (!cm.options.lineWrapping) {
          return { begin: 0, end: line.text.length };
        }
        prep = prep || prepareMeasureForLine(cm, line);
        return wrappedLineExtentChar(cm, line, prep, ch2);
      };
      var wrappedLineExtent2 = getWrappedLineExtent(start2.sticky == "before" ? mv(start2, -1) : start2.ch);
      if (cm.doc.direction == "rtl" || part.level == 1) {
        var moveInStorageOrder = part.level == 1 == dir < 0;
        var ch = mv(start2, moveInStorageOrder ? 1 : -1);
        if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent2.begin : ch <= part.to && ch <= wrappedLineExtent2.end)) {
          var sticky = moveInStorageOrder ? "before" : "after";
          return new Pos(start2.line, ch, sticky);
        }
      }
      var searchInVisualLine = function(partPos2, dir2, wrappedLineExtent3) {
        var getRes = function(ch3, moveInStorageOrder3) {
          return moveInStorageOrder3 ? new Pos(start2.line, mv(ch3, 1), "before") : new Pos(start2.line, ch3, "after");
        };
        for (; partPos2 >= 0 && partPos2 < bidi.length; partPos2 += dir2) {
          var part2 = bidi[partPos2];
          var moveInStorageOrder2 = dir2 > 0 == (part2.level != 1);
          var ch2 = moveInStorageOrder2 ? wrappedLineExtent3.begin : mv(wrappedLineExtent3.end, -1);
          if (part2.from <= ch2 && ch2 < part2.to) {
            return getRes(ch2, moveInStorageOrder2);
          }
          ch2 = moveInStorageOrder2 ? part2.from : mv(part2.to, -1);
          if (wrappedLineExtent3.begin <= ch2 && ch2 < wrappedLineExtent3.end) {
            return getRes(ch2, moveInStorageOrder2);
          }
        }
      };
      var res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent2);
      if (res) {
        return res;
      }
      var nextCh = dir > 0 ? wrappedLineExtent2.end : mv(wrappedLineExtent2.begin, -1);
      if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
        res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
        if (res) {
          return res;
        }
      }
      return null;
    }
    var commands = {
      selectAll,
      singleSelection: function(cm) {
        return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll);
      },
      killLine: function(cm) {
        return deleteNearSelection(cm, function(range2) {
          if (range2.empty()) {
            var len = getLine(cm.doc, range2.head.line).text.length;
            if (range2.head.ch == len && range2.head.line < cm.lastLine()) {
              return { from: range2.head, to: Pos(range2.head.line + 1, 0) };
            } else {
              return { from: range2.head, to: Pos(range2.head.line, len) };
            }
          } else {
            return { from: range2.from(), to: range2.to() };
          }
        });
      },
      deleteLine: function(cm) {
        return deleteNearSelection(cm, function(range2) {
          return {
            from: Pos(range2.from().line, 0),
            to: clipPos(cm.doc, Pos(range2.to().line + 1, 0))
          };
        });
      },
      delLineLeft: function(cm) {
        return deleteNearSelection(cm, function(range2) {
          return {
            from: Pos(range2.from().line, 0),
            to: range2.from()
          };
        });
      },
      delWrappedLineLeft: function(cm) {
        return deleteNearSelection(cm, function(range2) {
          var top = cm.charCoords(range2.head, "div").top + 5;
          var leftPos = cm.coordsChar({ left: 0, top }, "div");
          return { from: leftPos, to: range2.from() };
        });
      },
      delWrappedLineRight: function(cm) {
        return deleteNearSelection(cm, function(range2) {
          var top = cm.charCoords(range2.head, "div").top + 5;
          var rightPos = cm.coordsChar({ left: cm.display.lineDiv.offsetWidth + 100, top }, "div");
          return { from: range2.from(), to: rightPos };
        });
      },
      undo: function(cm) {
        return cm.undo();
      },
      redo: function(cm) {
        return cm.redo();
      },
      undoSelection: function(cm) {
        return cm.undoSelection();
      },
      redoSelection: function(cm) {
        return cm.redoSelection();
      },
      goDocStart: function(cm) {
        return cm.extendSelection(Pos(cm.firstLine(), 0));
      },
      goDocEnd: function(cm) {
        return cm.extendSelection(Pos(cm.lastLine()));
      },
      goLineStart: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          return lineStart(cm, range2.head.line);
        }, { origin: "+move", bias: 1 });
      },
      goLineStartSmart: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          return lineStartSmart(cm, range2.head);
        }, { origin: "+move", bias: 1 });
      },
      goLineEnd: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          return lineEnd(cm, range2.head.line);
        }, { origin: "+move", bias: -1 });
      },
      goLineRight: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          var top = cm.cursorCoords(range2.head, "div").top + 5;
          return cm.coordsChar({ left: cm.display.lineDiv.offsetWidth + 100, top }, "div");
        }, sel_move);
      },
      goLineLeft: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          var top = cm.cursorCoords(range2.head, "div").top + 5;
          return cm.coordsChar({ left: 0, top }, "div");
        }, sel_move);
      },
      goLineLeftSmart: function(cm) {
        return cm.extendSelectionsBy(function(range2) {
          var top = cm.cursorCoords(range2.head, "div").top + 5;
          var pos = cm.coordsChar({ left: 0, top }, "div");
          if (pos.ch < cm.getLine(pos.line).search(/\S/)) {
            return lineStartSmart(cm, range2.head);
          }
          return pos;
        }, sel_move);
      },
      goLineUp: function(cm) {
        return cm.moveV(-1, "line");
      },
      goLineDown: function(cm) {
        return cm.moveV(1, "line");
      },
      goPageUp: function(cm) {
        return cm.moveV(-1, "page");
      },
      goPageDown: function(cm) {
        return cm.moveV(1, "page");
      },
      goCharLeft: function(cm) {
        return cm.moveH(-1, "char");
      },
      goCharRight: function(cm) {
        return cm.moveH(1, "char");
      },
      goColumnLeft: function(cm) {
        return cm.moveH(-1, "column");
      },
      goColumnRight: function(cm) {
        return cm.moveH(1, "column");
      },
      goWordLeft: function(cm) {
        return cm.moveH(-1, "word");
      },
      goGroupRight: function(cm) {
        return cm.moveH(1, "group");
      },
      goGroupLeft: function(cm) {
        return cm.moveH(-1, "group");
      },
      goWordRight: function(cm) {
        return cm.moveH(1, "word");
      },
      delCharBefore: function(cm) {
        return cm.deleteH(-1, "codepoint");
      },
      delCharAfter: function(cm) {
        return cm.deleteH(1, "char");
      },
      delWordBefore: function(cm) {
        return cm.deleteH(-1, "word");
      },
      delWordAfter: function(cm) {
        return cm.deleteH(1, "word");
      },
      delGroupBefore: function(cm) {
        return cm.deleteH(-1, "group");
      },
      delGroupAfter: function(cm) {
        return cm.deleteH(1, "group");
      },
      indentAuto: function(cm) {
        return cm.indentSelection("smart");
      },
      indentMore: function(cm) {
        return cm.indentSelection("add");
      },
      indentLess: function(cm) {
        return cm.indentSelection("subtract");
      },
      insertTab: function(cm) {
        return cm.replaceSelection("	");
      },
      insertSoftTab: function(cm) {
        var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
        for (var i2 = 0; i2 < ranges.length; i2++) {
          var pos = ranges[i2].from();
          var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
          spaces.push(spaceStr(tabSize - col % tabSize));
        }
        cm.replaceSelections(spaces);
      },
      defaultTab: function(cm) {
        if (cm.somethingSelected()) {
          cm.indentSelection("add");
        } else {
          cm.execCommand("insertTab");
        }
      },
      transposeChars: function(cm) {
        return runInOp(cm, function() {
          var ranges = cm.listSelections(), newSel = [];
          for (var i2 = 0; i2 < ranges.length; i2++) {
            if (!ranges[i2].empty()) {
              continue;
            }
            var cur = ranges[i2].head, line = getLine(cm.doc, cur.line).text;
            if (line) {
              if (cur.ch == line.length) {
                cur = new Pos(cur.line, cur.ch - 1);
              }
              if (cur.ch > 0) {
                cur = new Pos(cur.line, cur.ch + 1);
                cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2), Pos(cur.line, cur.ch - 2), cur, "+transpose");
              } else if (cur.line > cm.doc.first) {
                var prev = getLine(cm.doc, cur.line - 1).text;
                if (prev) {
                  cur = new Pos(cur.line, 1);
                  cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() + prev.charAt(prev.length - 1), Pos(cur.line - 1, prev.length - 1), cur, "+transpose");
                }
              }
            }
            newSel.push(new Range(cur, cur));
          }
          cm.setSelections(newSel);
        });
      },
      newlineAndIndent: function(cm) {
        return runInOp(cm, function() {
          var sels = cm.listSelections();
          for (var i2 = sels.length - 1; i2 >= 0; i2--) {
            cm.replaceRange(cm.doc.lineSeparator(), sels[i2].anchor, sels[i2].head, "+input");
          }
          sels = cm.listSelections();
          for (var i$12 = 0; i$12 < sels.length; i$12++) {
            cm.indentLine(sels[i$12].from().line, null, true);
          }
          ensureCursorVisible(cm);
        });
      },
      openLine: function(cm) {
        return cm.replaceSelection("\n", "start");
      },
      toggleOverwrite: function(cm) {
        return cm.toggleOverwrite();
      }
    };
    function lineStart(cm, lineN) {
      var line = getLine(cm.doc, lineN);
      var visual = visualLine(line);
      if (visual != line) {
        lineN = lineNo(visual);
      }
      return endOfLine(true, cm, visual, lineN, 1);
    }
    function lineEnd(cm, lineN) {
      var line = getLine(cm.doc, lineN);
      var visual = visualLineEnd(line);
      if (visual != line) {
        lineN = lineNo(visual);
      }
      return endOfLine(true, cm, line, lineN, -1);
    }
    function lineStartSmart(cm, pos) {
      var start2 = lineStart(cm, pos.line);
      var line = getLine(cm.doc, start2.line);
      var order = getOrder(line, cm.doc.direction);
      if (!order || order[0].level == 0) {
        var firstNonWS = Math.max(start2.ch, line.text.search(/\S/));
        var inWS = pos.line == start2.line && pos.ch <= firstNonWS && pos.ch;
        return Pos(start2.line, inWS ? 0 : firstNonWS, start2.sticky);
      }
      return start2;
    }
    function doHandleBinding(cm, bound, dropShift) {
      if (typeof bound == "string") {
        bound = commands[bound];
        if (!bound) {
          return false;
        }
      }
      cm.display.input.ensurePolled();
      var prevShift = cm.display.shift, done = false;
      try {
        if (cm.isReadOnly()) {
          cm.state.suppressEdits = true;
        }
        if (dropShift) {
          cm.display.shift = false;
        }
        done = bound(cm) != Pass;
      } finally {
        cm.display.shift = prevShift;
        cm.state.suppressEdits = false;
      }
      return done;
    }
    function lookupKeyForEditor(cm, name, handle) {
      for (var i2 = 0; i2 < cm.state.keyMaps.length; i2++) {
        var result = lookupKey(name, cm.state.keyMaps[i2], handle, cm);
        if (result) {
          return result;
        }
      }
      return cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm) || lookupKey(name, cm.options.keyMap, handle, cm);
    }
    var stopSeq = new Delayed();
    function dispatchKey(cm, name, e, handle) {
      var seq = cm.state.keySeq;
      if (seq) {
        if (isModifierKey(name)) {
          return "handled";
        }
        if (/\'$/.test(name)) {
          cm.state.keySeq = null;
        } else {
          stopSeq.set(50, function() {
            if (cm.state.keySeq == seq) {
              cm.state.keySeq = null;
              cm.display.input.reset();
            }
          });
        }
        if (dispatchKeyInner(cm, seq + " " + name, e, handle)) {
          return true;
        }
      }
      return dispatchKeyInner(cm, name, e, handle);
    }
    function dispatchKeyInner(cm, name, e, handle) {
      var result = lookupKeyForEditor(cm, name, handle);
      if (result == "multi") {
        cm.state.keySeq = name;
      }
      if (result == "handled") {
        signalLater(cm, "keyHandled", cm, name, e);
      }
      if (result == "handled" || result == "multi") {
        e_preventDefault(e);
        restartBlink(cm);
      }
      return !!result;
    }
    function handleKeyBinding(cm, e) {
      var name = keyName(e, true);
      if (!name) {
        return false;
      }
      if (e.shiftKey && !cm.state.keySeq) {
        return dispatchKey(cm, "Shift-" + name, e, function(b) {
          return doHandleBinding(cm, b, true);
        }) || dispatchKey(cm, name, e, function(b) {
          if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion) {
            return doHandleBinding(cm, b);
          }
        });
      } else {
        return dispatchKey(cm, name, e, function(b) {
          return doHandleBinding(cm, b);
        });
      }
    }
    function handleCharBinding(cm, e, ch) {
      return dispatchKey(cm, "'" + ch + "'", e, function(b) {
        return doHandleBinding(cm, b, true);
      });
    }
    var lastStoppedKey = null;
    function onKeyDown(e) {
      var cm = this;
      if (e.target && e.target != cm.display.input.getField()) {
        return;
      }
      cm.curOp.focus = activeElt();
      if (signalDOMEvent(cm, e)) {
        return;
      }
      if (ie && ie_version < 11 && e.keyCode == 27) {
        e.returnValue = false;
      }
      var code = e.keyCode;
      cm.display.shift = code == 16 || e.shiftKey;
      var handled = handleKeyBinding(cm, e);
      if (presto) {
        lastStoppedKey = handled ? code : null;
        if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey)) {
          cm.replaceSelection("", null, "cut");
        }
      }
      if (gecko && !mac && !handled && code == 46 && e.shiftKey && !e.ctrlKey && document.execCommand) {
        document.execCommand("cut");
      }
      if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className)) {
        showCrossHair(cm);
      }
    }
    function showCrossHair(cm) {
      var lineDiv = cm.display.lineDiv;
      addClass(lineDiv, "CodeMirror-crosshair");
      function up(e) {
        if (e.keyCode == 18 || !e.altKey) {
          rmClass(lineDiv, "CodeMirror-crosshair");
          off(document, "keyup", up);
          off(document, "mouseover", up);
        }
      }
      on(document, "keyup", up);
      on(document, "mouseover", up);
    }
    function onKeyUp(e) {
      if (e.keyCode == 16) {
        this.doc.sel.shift = false;
      }
      signalDOMEvent(this, e);
    }
    function onKeyPress(e) {
      var cm = this;
      if (e.target && e.target != cm.display.input.getField()) {
        return;
      }
      if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) {
        return;
      }
      var keyCode = e.keyCode, charCode = e.charCode;
      if (presto && keyCode == lastStoppedKey) {
        lastStoppedKey = null;
        e_preventDefault(e);
        return;
      }
      if (presto && (!e.which || e.which < 10) && handleKeyBinding(cm, e)) {
        return;
      }
      var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
      if (ch == "\b") {
        return;
      }
      if (handleCharBinding(cm, e, ch)) {
        return;
      }
      cm.display.input.onKeyPress(e);
    }
    var DOUBLECLICK_DELAY = 400;
    var PastClick = function(time, pos, button) {
      this.time = time;
      this.pos = pos;
      this.button = button;
    };
    PastClick.prototype.compare = function(time, pos, button) {
      return this.time + DOUBLECLICK_DELAY > time && cmp(pos, this.pos) == 0 && button == this.button;
    };
    var lastClick, lastDoubleClick;
    function clickRepeat(pos, button) {
      var now2 = +new Date();
      if (lastDoubleClick && lastDoubleClick.compare(now2, pos, button)) {
        lastClick = lastDoubleClick = null;
        return "triple";
      } else if (lastClick && lastClick.compare(now2, pos, button)) {
        lastDoubleClick = new PastClick(now2, pos, button);
        lastClick = null;
        return "double";
      } else {
        lastClick = new PastClick(now2, pos, button);
        lastDoubleClick = null;
        return "single";
      }
    }
    function onMouseDown(e) {
      var cm = this, display = cm.display;
      if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) {
        return;
      }
      display.input.ensurePolled();
      display.shift = e.shiftKey;
      if (eventInWidget(display, e)) {
        if (!webkit) {
          display.scroller.draggable = false;
          setTimeout(function() {
            return display.scroller.draggable = true;
          }, 100);
        }
        return;
      }
      if (clickInGutter(cm, e)) {
        return;
      }
      var pos = posFromMouse(cm, e), button = e_button(e), repeat = pos ? clickRepeat(pos, button) : "single";
      window.focus();
      if (button == 1 && cm.state.selectingText) {
        cm.state.selectingText(e);
      }
      if (pos && handleMappedButton(cm, button, pos, repeat, e)) {
        return;
      }
      if (button == 1) {
        if (pos) {
          leftButtonDown(cm, pos, repeat, e);
        } else if (e_target(e) == display.scroller) {
          e_preventDefault(e);
        }
      } else if (button == 2) {
        if (pos) {
          extendSelection(cm.doc, pos);
        }
        setTimeout(function() {
          return display.input.focus();
        }, 20);
      } else if (button == 3) {
        if (captureRightClick) {
          cm.display.input.onContextMenu(e);
        } else {
          delayBlurEvent(cm);
        }
      }
    }
    function handleMappedButton(cm, button, pos, repeat, event2) {
      var name = "Click";
      if (repeat == "double") {
        name = "Double" + name;
      } else if (repeat == "triple") {
        name = "Triple" + name;
      }
      name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;
      return dispatchKey(cm, addModifierNames(name, event2), event2, function(bound) {
        if (typeof bound == "string") {
          bound = commands[bound];
        }
        if (!bound) {
          return false;
        }
        var done = false;
        try {
          if (cm.isReadOnly()) {
            cm.state.suppressEdits = true;
          }
          done = bound(cm, pos) != Pass;
        } finally {
          cm.state.suppressEdits = false;
        }
        return done;
      });
    }
    function configureMouse(cm, repeat, event2) {
      var option = cm.getOption("configureMouse");
      var value = option ? option(cm, repeat, event2) : {};
      if (value.unit == null) {
        var rect = chromeOS ? event2.shiftKey && event2.metaKey : event2.altKey;
        value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
      }
      if (value.extend == null || cm.doc.extend) {
        value.extend = cm.doc.extend || event2.shiftKey;
      }
      if (value.addNew == null) {
        value.addNew = mac ? event2.metaKey : event2.ctrlKey;
      }
      if (value.moveOnDrag == null) {
        value.moveOnDrag = !(mac ? event2.altKey : event2.ctrlKey);
      }
      return value;
    }
    function leftButtonDown(cm, pos, repeat, event2) {
      if (ie) {
        setTimeout(bind2(ensureFocus, cm), 0);
      } else {
        cm.curOp.focus = activeElt();
      }
      var behavior = configureMouse(cm, repeat, event2);
      var sel = cm.doc.sel, contained;
      if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() && repeat == "single" && (contained = sel.contains(pos)) > -1 && (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) && (cmp(contained.to(), pos) > 0 || pos.xRel < 0)) {
        leftButtonStartDrag(cm, event2, pos, behavior);
      } else {
        leftButtonSelect(cm, event2, pos, behavior);
      }
    }
    function leftButtonStartDrag(cm, event2, pos, behavior) {
      var display = cm.display, moved = false;
      var dragEnd = operation(cm, function(e) {
        if (webkit) {
          display.scroller.draggable = false;
        }
        cm.state.draggingText = false;
        if (cm.state.delayingBlurEvent) {
          if (cm.hasFocus()) {
            cm.state.delayingBlurEvent = false;
          } else {
            delayBlurEvent(cm);
          }
        }
        off(display.wrapper.ownerDocument, "mouseup", dragEnd);
        off(display.wrapper.ownerDocument, "mousemove", mouseMove);
        off(display.scroller, "dragstart", dragStart);
        off(display.scroller, "drop", dragEnd);
        if (!moved) {
          e_preventDefault(e);
          if (!behavior.addNew) {
            extendSelection(cm.doc, pos, null, null, behavior.extend);
          }
          if (webkit && !safari || ie && ie_version == 9) {
            setTimeout(function() {
              display.wrapper.ownerDocument.body.focus({ preventScroll: true });
              display.input.focus();
            }, 20);
          } else {
            display.input.focus();
          }
        }
      });
      var mouseMove = function(e2) {
        moved = moved || Math.abs(event2.clientX - e2.clientX) + Math.abs(event2.clientY - e2.clientY) >= 10;
      };
      var dragStart = function() {
        return moved = true;
      };
      if (webkit) {
        display.scroller.draggable = true;
      }
      cm.state.draggingText = dragEnd;
      dragEnd.copy = !behavior.moveOnDrag;
      on(display.wrapper.ownerDocument, "mouseup", dragEnd);
      on(display.wrapper.ownerDocument, "mousemove", mouseMove);
      on(display.scroller, "dragstart", dragStart);
      on(display.scroller, "drop", dragEnd);
      cm.state.delayingBlurEvent = true;
      setTimeout(function() {
        return display.input.focus();
      }, 20);
      if (display.scroller.dragDrop) {
        display.scroller.dragDrop();
      }
    }
    function rangeForUnit(cm, pos, unit) {
      if (unit == "char") {
        return new Range(pos, pos);
      }
      if (unit == "word") {
        return cm.findWordAt(pos);
      }
      if (unit == "line") {
        return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
      }
      var result = unit(cm, pos);
      return new Range(result.from, result.to);
    }
    function leftButtonSelect(cm, event2, start2, behavior) {
      if (ie) {
        delayBlurEvent(cm);
      }
      var display = cm.display, doc = cm.doc;
      e_preventDefault(event2);
      var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
      if (behavior.addNew && !behavior.extend) {
        ourIndex = doc.sel.contains(start2);
        if (ourIndex > -1) {
          ourRange = ranges[ourIndex];
        } else {
          ourRange = new Range(start2, start2);
        }
      } else {
        ourRange = doc.sel.primary();
        ourIndex = doc.sel.primIndex;
      }
      if (behavior.unit == "rectangle") {
        if (!behavior.addNew) {
          ourRange = new Range(start2, start2);
        }
        start2 = posFromMouse(cm, event2, true, true);
        ourIndex = -1;
      } else {
        var range2 = rangeForUnit(cm, start2, behavior.unit);
        if (behavior.extend) {
          ourRange = extendRange(ourRange, range2.anchor, range2.head, behavior.extend);
        } else {
          ourRange = range2;
        }
      }
      if (!behavior.addNew) {
        ourIndex = 0;
        setSelection(doc, new Selection([ourRange], 0), sel_mouse);
        startSel = doc.sel;
      } else if (ourIndex == -1) {
        ourIndex = ranges.length;
        setSelection(doc, normalizeSelection(cm, ranges.concat([ourRange]), ourIndex), { scroll: false, origin: "*mouse" });
      } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
        setSelection(doc, normalizeSelection(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0), { scroll: false, origin: "*mouse" });
        startSel = doc.sel;
      } else {
        replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
      }
      var lastPos = start2;
      function extendTo(pos) {
        if (cmp(lastPos, pos) == 0) {
          return;
        }
        lastPos = pos;
        if (behavior.unit == "rectangle") {
          var ranges2 = [], tabSize = cm.options.tabSize;
          var startCol = countColumn(getLine(doc, start2.line).text, start2.ch, tabSize);
          var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
          var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
          for (var line = Math.min(start2.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start2.line, pos.line)); line <= end; line++) {
            var text2 = getLine(doc, line).text, leftPos = findColumn(text2, left, tabSize);
            if (left == right) {
              ranges2.push(new Range(Pos(line, leftPos), Pos(line, leftPos)));
            } else if (text2.length > leftPos) {
              ranges2.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text2, right, tabSize))));
            }
          }
          if (!ranges2.length) {
            ranges2.push(new Range(start2, start2));
          }
          setSelection(doc, normalizeSelection(cm, startSel.ranges.slice(0, ourIndex).concat(ranges2), ourIndex), { origin: "*mouse", scroll: false });
          cm.scrollIntoView(pos);
        } else {
          var oldRange = ourRange;
          var range3 = rangeForUnit(cm, pos, behavior.unit);
          var anchor = oldRange.anchor, head;
          if (cmp(range3.anchor, anchor) > 0) {
            head = range3.head;
            anchor = minPos(oldRange.from(), range3.anchor);
          } else {
            head = range3.anchor;
            anchor = maxPos(oldRange.to(), range3.head);
          }
          var ranges$1 = startSel.ranges.slice(0);
          ranges$1[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head));
          setSelection(doc, normalizeSelection(cm, ranges$1, ourIndex), sel_mouse);
        }
      }
      var editorSize = display.wrapper.getBoundingClientRect();
      var counter = 0;
      function extend(e) {
        var curCount = ++counter;
        var cur = posFromMouse(cm, e, true, behavior.unit == "rectangle");
        if (!cur) {
          return;
        }
        if (cmp(cur, lastPos) != 0) {
          cm.curOp.focus = activeElt();
          extendTo(cur);
          var visible = visibleLines(display, doc);
          if (cur.line >= visible.to || cur.line < visible.from) {
            setTimeout(operation(cm, function() {
              if (counter == curCount) {
                extend(e);
              }
            }), 150);
          }
        } else {
          var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
          if (outside) {
            setTimeout(operation(cm, function() {
              if (counter != curCount) {
                return;
              }
              display.scroller.scrollTop += outside;
              extend(e);
            }), 50);
          }
        }
      }
      function done(e) {
        cm.state.selectingText = false;
        counter = Infinity;
        if (e) {
          e_preventDefault(e);
          display.input.focus();
        }
        off(display.wrapper.ownerDocument, "mousemove", move);
        off(display.wrapper.ownerDocument, "mouseup", up);
        doc.history.lastSelOrigin = null;
      }
      var move = operation(cm, function(e) {
        if (e.buttons === 0 || !e_button(e)) {
          done(e);
        } else {
          extend(e);
        }
      });
      var up = operation(cm, done);
      cm.state.selectingText = up;
      on(display.wrapper.ownerDocument, "mousemove", move);
      on(display.wrapper.ownerDocument, "mouseup", up);
    }
    function bidiSimplify(cm, range2) {
      var anchor = range2.anchor;
      var head = range2.head;
      var anchorLine = getLine(cm.doc, anchor.line);
      if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) {
        return range2;
      }
      var order = getOrder(anchorLine);
      if (!order) {
        return range2;
      }
      var index = getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index];
      if (part.from != anchor.ch && part.to != anchor.ch) {
        return range2;
      }
      var boundary = index + (part.from == anchor.ch == (part.level != 1) ? 0 : 1);
      if (boundary == 0 || boundary == order.length) {
        return range2;
      }
      var leftSide;
      if (head.line != anchor.line) {
        leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
      } else {
        var headIndex = getBidiPartAt(order, head.ch, head.sticky);
        var dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
        if (headIndex == boundary - 1 || headIndex == boundary) {
          leftSide = dir < 0;
        } else {
          leftSide = dir > 0;
        }
      }
      var usePart = order[boundary + (leftSide ? -1 : 0)];
      var from = leftSide == (usePart.level == 1);
      var ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before";
      return anchor.ch == ch && anchor.sticky == sticky ? range2 : new Range(new Pos(anchor.line, ch, sticky), head);
    }
    function gutterEvent(cm, e, type, prevent) {
      var mX, mY;
      if (e.touches) {
        mX = e.touches[0].clientX;
        mY = e.touches[0].clientY;
      } else {
        try {
          mX = e.clientX;
          mY = e.clientY;
        } catch (e$1) {
          return false;
        }
      }
      if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) {
        return false;
      }
      if (prevent) {
        e_preventDefault(e);
      }
      var display = cm.display;
      var lineBox = display.lineDiv.getBoundingClientRect();
      if (mY > lineBox.bottom || !hasHandler(cm, type)) {
        return e_defaultPrevented(e);
      }
      mY -= lineBox.top - display.viewOffset;
      for (var i2 = 0; i2 < cm.display.gutterSpecs.length; ++i2) {
        var g = display.gutters.childNodes[i2];
        if (g && g.getBoundingClientRect().right >= mX) {
          var line = lineAtHeight(cm.doc, mY);
          var gutter = cm.display.gutterSpecs[i2];
          signal(cm, type, cm, line, gutter.className, e);
          return e_defaultPrevented(e);
        }
      }
    }
    function clickInGutter(cm, e) {
      return gutterEvent(cm, e, "gutterClick", true);
    }
    function onContextMenu(cm, e) {
      if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) {
        return;
      }
      if (signalDOMEvent(cm, e, "contextmenu")) {
        return;
      }
      if (!captureRightClick) {
        cm.display.input.onContextMenu(e);
      }
    }
    function contextMenuInGutter(cm, e) {
      if (!hasHandler(cm, "gutterContextMenu")) {
        return false;
      }
      return gutterEvent(cm, e, "gutterContextMenu", false);
    }
    function themeChanged(cm) {
      cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") + cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
      clearCaches(cm);
    }
    var Init = { toString: function() {
      return "CodeMirror.Init";
    } };
    var defaults2 = {};
    var optionHandlers = {};
    function defineOptions(CodeMirror3) {
      var optionHandlers2 = CodeMirror3.optionHandlers;
      function option(name, deflt, handle, notOnInit) {
        CodeMirror3.defaults[name] = deflt;
        if (handle) {
          optionHandlers2[name] = notOnInit ? function(cm, val, old) {
            if (old != Init) {
              handle(cm, val, old);
            }
          } : handle;
        }
      }
      CodeMirror3.defineOption = option;
      CodeMirror3.Init = Init;
      option("value", "", function(cm, val) {
        return cm.setValue(val);
      }, true);
      option("mode", null, function(cm, val) {
        cm.doc.modeOption = val;
        loadMode(cm);
      }, true);
      option("indentUnit", 2, loadMode, true);
      option("indentWithTabs", false);
      option("smartIndent", true);
      option("tabSize", 4, function(cm) {
        resetModeState(cm);
        clearCaches(cm);
        regChange(cm);
      }, true);
      option("lineSeparator", null, function(cm, val) {
        cm.doc.lineSep = val;
        if (!val) {
          return;
        }
        var newBreaks = [], lineNo2 = cm.doc.first;
        cm.doc.iter(function(line) {
          for (var pos = 0; ; ) {
            var found = line.text.indexOf(val, pos);
            if (found == -1) {
              break;
            }
            pos = found + val.length;
            newBreaks.push(Pos(lineNo2, found));
          }
          lineNo2++;
        });
        for (var i2 = newBreaks.length - 1; i2 >= 0; i2--) {
          replaceRange(cm.doc, val, newBreaks[i2], Pos(newBreaks[i2].line, newBreaks[i2].ch + val.length));
        }
      });
      option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, function(cm, val, old) {
        cm.state.specialChars = new RegExp(val.source + (val.test("	") ? "" : "|	"), "g");
        if (old != Init) {
          cm.refresh();
        }
      });
      option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function(cm) {
        return cm.refresh();
      }, true);
      option("electricChars", true);
      option("inputStyle", mobile ? "contenteditable" : "textarea", function() {
        throw new Error("inputStyle can not (yet) be changed in a running editor");
      }, true);
      option("spellcheck", false, function(cm, val) {
        return cm.getInputField().spellcheck = val;
      }, true);
      option("autocorrect", false, function(cm, val) {
        return cm.getInputField().autocorrect = val;
      }, true);
      option("autocapitalize", false, function(cm, val) {
        return cm.getInputField().autocapitalize = val;
      }, true);
      option("rtlMoveVisually", !windows);
      option("wholeLineUpdateBefore", true);
      option("theme", "default", function(cm) {
        themeChanged(cm);
        updateGutters(cm);
      }, true);
      option("keyMap", "default", function(cm, val, old) {
        var next = getKeyMap(val);
        var prev = old != Init && getKeyMap(old);
        if (prev && prev.detach) {
          prev.detach(cm, next);
        }
        if (next.attach) {
          next.attach(cm, prev || null);
        }
      });
      option("extraKeys", null);
      option("configureMouse", null);
      option("lineWrapping", false, wrappingChanged, true);
      option("gutters", [], function(cm, val) {
        cm.display.gutterSpecs = getGutters(val, cm.options.lineNumbers);
        updateGutters(cm);
      }, true);
      option("fixedGutter", true, function(cm, val) {
        cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
        cm.refresh();
      }, true);
      option("coverGutterNextToScrollbar", false, function(cm) {
        return updateScrollbars(cm);
      }, true);
      option("scrollbarStyle", "native", function(cm) {
        initScrollbars(cm);
        updateScrollbars(cm);
        cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
        cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
      }, true);
      option("lineNumbers", false, function(cm, val) {
        cm.display.gutterSpecs = getGutters(cm.options.gutters, val);
        updateGutters(cm);
      }, true);
      option("firstLineNumber", 1, updateGutters, true);
      option("lineNumberFormatter", function(integer) {
        return integer;
      }, updateGutters, true);
      option("showCursorWhenSelecting", false, updateSelection, true);
      option("resetSelectionOnContextMenu", true);
      option("lineWiseCopyCut", true);
      option("pasteLinesPerSelection", true);
      option("selectionsMayTouch", false);
      option("readOnly", false, function(cm, val) {
        if (val == "nocursor") {
          onBlur(cm);
          cm.display.input.blur();
        }
        cm.display.input.readOnlyChanged(val);
      });
      option("screenReaderLabel", null, function(cm, val) {
        val = val === "" ? null : val;
        cm.display.input.screenReaderLabelChanged(val);
      });
      option("disableInput", false, function(cm, val) {
        if (!val) {
          cm.display.input.reset();
        }
      }, true);
      option("dragDrop", true, dragDropChanged);
      option("allowDropFileTypes", null);
      option("cursorBlinkRate", 530);
      option("cursorScrollMargin", 0);
      option("cursorHeight", 1, updateSelection, true);
      option("singleCursorHeightPerLine", true, updateSelection, true);
      option("workTime", 100);
      option("workDelay", 100);
      option("flattenSpans", true, resetModeState, true);
      option("addModeClass", false, resetModeState, true);
      option("pollInterval", 100);
      option("undoDepth", 200, function(cm, val) {
        return cm.doc.history.undoDepth = val;
      });
      option("historyEventDelay", 1250);
      option("viewportMargin", 10, function(cm) {
        return cm.refresh();
      }, true);
      option("maxHighlightLength", 1e4, resetModeState, true);
      option("moveInputWithCursor", true, function(cm, val) {
        if (!val) {
          cm.display.input.resetPosition();
        }
      });
      option("tabindex", null, function(cm, val) {
        return cm.display.input.getField().tabIndex = val || "";
      });
      option("autofocus", null);
      option("direction", "ltr", function(cm, val) {
        return cm.doc.setDirection(val);
      }, true);
      option("phrases", null);
    }
    function dragDropChanged(cm, value, old) {
      var wasOn = old && old != Init;
      if (!value != !wasOn) {
        var funcs = cm.display.dragFunctions;
        var toggle = value ? on : off;
        toggle(cm.display.scroller, "dragstart", funcs.start);
        toggle(cm.display.scroller, "dragenter", funcs.enter);
        toggle(cm.display.scroller, "dragover", funcs.over);
        toggle(cm.display.scroller, "dragleave", funcs.leave);
        toggle(cm.display.scroller, "drop", funcs.drop);
      }
    }
    function wrappingChanged(cm) {
      if (cm.options.lineWrapping) {
        addClass(cm.display.wrapper, "CodeMirror-wrap");
        cm.display.sizer.style.minWidth = "";
        cm.display.sizerWidth = null;
      } else {
        rmClass(cm.display.wrapper, "CodeMirror-wrap");
        findMaxLine(cm);
      }
      estimateLineHeights(cm);
      regChange(cm);
      clearCaches(cm);
      setTimeout(function() {
        return updateScrollbars(cm);
      }, 100);
    }
    function CodeMirror2(place, options) {
      var this$1$1 = this;
      if (!(this instanceof CodeMirror2)) {
        return new CodeMirror2(place, options);
      }
      this.options = options = options ? copyObj(options) : {};
      copyObj(defaults2, options, false);
      var doc = options.value;
      if (typeof doc == "string") {
        doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction);
      } else if (options.mode) {
        doc.modeOption = options.mode;
      }
      this.doc = doc;
      var input = new CodeMirror2.inputStyles[options.inputStyle](this);
      var display = this.display = new Display(place, doc, input, options);
      display.wrapper.CodeMirror = this;
      themeChanged(this);
      if (options.lineWrapping) {
        this.display.wrapper.className += " CodeMirror-wrap";
      }
      initScrollbars(this);
      this.state = {
        keyMaps: [],
        overlays: [],
        modeGen: 0,
        overwrite: false,
        delayingBlurEvent: false,
        focused: false,
        suppressEdits: false,
        pasteIncoming: -1,
        cutIncoming: -1,
        selectingText: false,
        draggingText: false,
        highlight: new Delayed(),
        keySeq: null,
        specialChars: null
      };
      if (options.autofocus && !mobile) {
        display.input.focus();
      }
      if (ie && ie_version < 11) {
        setTimeout(function() {
          return this$1$1.display.input.reset(true);
        }, 20);
      }
      registerEventHandlers(this);
      ensureGlobalHandlers();
      startOperation(this);
      this.curOp.forceUpdate = true;
      attachDoc(this, doc);
      if (options.autofocus && !mobile || this.hasFocus()) {
        setTimeout(function() {
          if (this$1$1.hasFocus() && !this$1$1.state.focused) {
            onFocus(this$1$1);
          }
        }, 20);
      } else {
        onBlur(this);
      }
      for (var opt in optionHandlers) {
        if (optionHandlers.hasOwnProperty(opt)) {
          optionHandlers[opt](this, options[opt], Init);
        }
      }
      maybeUpdateLineNumberWidth(this);
      if (options.finishInit) {
        options.finishInit(this);
      }
      for (var i2 = 0; i2 < initHooks.length; ++i2) {
        initHooks[i2](this);
      }
      endOperation(this);
      if (webkit && options.lineWrapping && getComputedStyle(display.lineDiv).textRendering == "optimizelegibility") {
        display.lineDiv.style.textRendering = "auto";
      }
    }
    CodeMirror2.defaults = defaults2;
    CodeMirror2.optionHandlers = optionHandlers;
    function registerEventHandlers(cm) {
      var d = cm.display;
      on(d.scroller, "mousedown", operation(cm, onMouseDown));
      if (ie && ie_version < 11) {
        on(d.scroller, "dblclick", operation(cm, function(e) {
          if (signalDOMEvent(cm, e)) {
            return;
          }
          var pos = posFromMouse(cm, e);
          if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) {
            return;
          }
          e_preventDefault(e);
          var word = cm.findWordAt(pos);
          extendSelection(cm.doc, word.anchor, word.head);
        }));
      } else {
        on(d.scroller, "dblclick", function(e) {
          return signalDOMEvent(cm, e) || e_preventDefault(e);
        });
      }
      on(d.scroller, "contextmenu", function(e) {
        return onContextMenu(cm, e);
      });
      on(d.input.getField(), "contextmenu", function(e) {
        if (!d.scroller.contains(e.target)) {
          onContextMenu(cm, e);
        }
      });
      var touchFinished, prevTouch = { end: 0 };
      function finishTouch() {
        if (d.activeTouch) {
          touchFinished = setTimeout(function() {
            return d.activeTouch = null;
          }, 1e3);
          prevTouch = d.activeTouch;
          prevTouch.end = +new Date();
        }
      }
      function isMouseLikeTouchEvent(e) {
        if (e.touches.length != 1) {
          return false;
        }
        var touch = e.touches[0];
        return touch.radiusX <= 1 && touch.radiusY <= 1;
      }
      function farAway(touch, other) {
        if (other.left == null) {
          return true;
        }
        var dx = other.left - touch.left, dy = other.top - touch.top;
        return dx * dx + dy * dy > 20 * 20;
      }
      on(d.scroller, "touchstart", function(e) {
        if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
          d.input.ensurePolled();
          clearTimeout(touchFinished);
          var now2 = +new Date();
          d.activeTouch = {
            start: now2,
            moved: false,
            prev: now2 - prevTouch.end <= 300 ? prevTouch : null
          };
          if (e.touches.length == 1) {
            d.activeTouch.left = e.touches[0].pageX;
            d.activeTouch.top = e.touches[0].pageY;
          }
        }
      });
      on(d.scroller, "touchmove", function() {
        if (d.activeTouch) {
          d.activeTouch.moved = true;
        }
      });
      on(d.scroller, "touchend", function(e) {
        var touch = d.activeTouch;
        if (touch && !eventInWidget(d, e) && touch.left != null && !touch.moved && new Date() - touch.start < 300) {
          var pos = cm.coordsChar(d.activeTouch, "page"), range2;
          if (!touch.prev || farAway(touch, touch.prev)) {
            range2 = new Range(pos, pos);
          } else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) {
            range2 = cm.findWordAt(pos);
          } else {
            range2 = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
          }
          cm.setSelection(range2.anchor, range2.head);
          cm.focus();
          e_preventDefault(e);
        }
        finishTouch();
      });
      on(d.scroller, "touchcancel", finishTouch);
      on(d.scroller, "scroll", function() {
        if (d.scroller.clientHeight) {
          updateScrollTop(cm, d.scroller.scrollTop);
          setScrollLeft(cm, d.scroller.scrollLeft, true);
          signal(cm, "scroll", cm);
        }
      });
      on(d.scroller, "mousewheel", function(e) {
        return onScrollWheel(cm, e);
      });
      on(d.scroller, "DOMMouseScroll", function(e) {
        return onScrollWheel(cm, e);
      });
      on(d.wrapper, "scroll", function() {
        return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0;
      });
      d.dragFunctions = {
        enter: function(e) {
          if (!signalDOMEvent(cm, e)) {
            e_stop(e);
          }
        },
        over: function(e) {
          if (!signalDOMEvent(cm, e)) {
            onDragOver(cm, e);
            e_stop(e);
          }
        },
        start: function(e) {
          return onDragStart(cm, e);
        },
        drop: operation(cm, onDrop),
        leave: function(e) {
          if (!signalDOMEvent(cm, e)) {
            clearDragCursor(cm);
          }
        }
      };
      var inp = d.input.getField();
      on(inp, "keyup", function(e) {
        return onKeyUp.call(cm, e);
      });
      on(inp, "keydown", operation(cm, onKeyDown));
      on(inp, "keypress", operation(cm, onKeyPress));
      on(inp, "focus", function(e) {
        return onFocus(cm, e);
      });
      on(inp, "blur", function(e) {
        return onBlur(cm, e);
      });
    }
    var initHooks = [];
    CodeMirror2.defineInitHook = function(f) {
      return initHooks.push(f);
    };
    function indentLine(cm, n, how, aggressive) {
      var doc = cm.doc, state;
      if (how == null) {
        how = "add";
      }
      if (how == "smart") {
        if (!doc.mode.indent) {
          how = "prev";
        } else {
          state = getContextBefore(cm, n).state;
        }
      }
      var tabSize = cm.options.tabSize;
      var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
      if (line.stateAfter) {
        line.stateAfter = null;
      }
      var curSpaceString = line.text.match(/^\s*/)[0], indentation;
      if (!aggressive && !/\S/.test(line.text)) {
        indentation = 0;
        how = "not";
      } else if (how == "smart") {
        indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
        if (indentation == Pass || indentation > 150) {
          if (!aggressive) {
            return;
          }
          how = "prev";
        }
      }
      if (how == "prev") {
        if (n > doc.first) {
          indentation = countColumn(getLine(doc, n - 1).text, null, tabSize);
        } else {
          indentation = 0;
        }
      } else if (how == "add") {
        indentation = curSpace + cm.options.indentUnit;
      } else if (how == "subtract") {
        indentation = curSpace - cm.options.indentUnit;
      } else if (typeof how == "number") {
        indentation = curSpace + how;
      }
      indentation = Math.max(0, indentation);
      var indentString = "", pos = 0;
      if (cm.options.indentWithTabs) {
        for (var i2 = Math.floor(indentation / tabSize); i2; --i2) {
          pos += tabSize;
          indentString += "	";
        }
      }
      if (pos < indentation) {
        indentString += spaceStr(indentation - pos);
      }
      if (indentString != curSpaceString) {
        replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
        line.stateAfter = null;
        return true;
      } else {
        for (var i$12 = 0; i$12 < doc.sel.ranges.length; i$12++) {
          var range2 = doc.sel.ranges[i$12];
          if (range2.head.line == n && range2.head.ch < curSpaceString.length) {
            var pos$1 = Pos(n, curSpaceString.length);
            replaceOneSelection(doc, i$12, new Range(pos$1, pos$1));
            break;
          }
        }
      }
    }
    var lastCopied = null;
    function setLastCopied(newLastCopied) {
      lastCopied = newLastCopied;
    }
    function applyTextInput(cm, inserted, deleted, sel, origin) {
      var doc = cm.doc;
      cm.display.shift = false;
      if (!sel) {
        sel = doc.sel;
      }
      var recent = +new Date() - 200;
      var paste = origin == "paste" || cm.state.pasteIncoming > recent;
      var textLines = splitLinesAuto(inserted), multiPaste = null;
      if (paste && sel.ranges.length > 1) {
        if (lastCopied && lastCopied.text.join("\n") == inserted) {
          if (sel.ranges.length % lastCopied.text.length == 0) {
            multiPaste = [];
            for (var i2 = 0; i2 < lastCopied.text.length; i2++) {
              multiPaste.push(doc.splitLines(lastCopied.text[i2]));
            }
          }
        } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
          multiPaste = map(textLines, function(l) {
            return [l];
          });
        }
      }
      var updateInput = cm.curOp.updateInput;
      for (var i$12 = sel.ranges.length - 1; i$12 >= 0; i$12--) {
        var range2 = sel.ranges[i$12];
        var from = range2.from(), to = range2.to();
        if (range2.empty()) {
          if (deleted && deleted > 0) {
            from = Pos(from.line, from.ch - deleted);
          } else if (cm.state.overwrite && !paste) {
            to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length));
          } else if (paste && lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == textLines.join("\n")) {
            from = to = Pos(from.line, 0);
          }
        }
        var changeEvent = {
          from,
          to,
          text: multiPaste ? multiPaste[i$12 % multiPaste.length] : textLines,
          origin: origin || (paste ? "paste" : cm.state.cutIncoming > recent ? "cut" : "+input")
        };
        makeChange(cm.doc, changeEvent);
        signalLater(cm, "inputRead", cm, changeEvent);
      }
      if (inserted && !paste) {
        triggerElectric(cm, inserted);
      }
      ensureCursorVisible(cm);
      if (cm.curOp.updateInput < 2) {
        cm.curOp.updateInput = updateInput;
      }
      cm.curOp.typing = true;
      cm.state.pasteIncoming = cm.state.cutIncoming = -1;
    }
    function handlePaste(e, cm) {
      var pasted = e.clipboardData && e.clipboardData.getData("Text");
      if (pasted) {
        e.preventDefault();
        if (!cm.isReadOnly() && !cm.options.disableInput) {
          runInOp(cm, function() {
            return applyTextInput(cm, pasted, 0, null, "paste");
          });
        }
        return true;
      }
    }
    function triggerElectric(cm, inserted) {
      if (!cm.options.electricChars || !cm.options.smartIndent) {
        return;
      }
      var sel = cm.doc.sel;
      for (var i2 = sel.ranges.length - 1; i2 >= 0; i2--) {
        var range2 = sel.ranges[i2];
        if (range2.head.ch > 100 || i2 && sel.ranges[i2 - 1].head.line == range2.head.line) {
          continue;
        }
        var mode = cm.getModeAt(range2.head);
        var indented = false;
        if (mode.electricChars) {
          for (var j = 0; j < mode.electricChars.length; j++) {
            if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
              indented = indentLine(cm, range2.head.line, "smart");
              break;
            }
          }
        } else if (mode.electricInput) {
          if (mode.electricInput.test(getLine(cm.doc, range2.head.line).text.slice(0, range2.head.ch))) {
            indented = indentLine(cm, range2.head.line, "smart");
          }
        }
        if (indented) {
          signalLater(cm, "electricInput", cm, range2.head.line);
        }
      }
    }
    function copyableRanges(cm) {
      var text2 = [], ranges = [];
      for (var i2 = 0; i2 < cm.doc.sel.ranges.length; i2++) {
        var line = cm.doc.sel.ranges[i2].head.line;
        var lineRange = { anchor: Pos(line, 0), head: Pos(line + 1, 0) };
        ranges.push(lineRange);
        text2.push(cm.getRange(lineRange.anchor, lineRange.head));
      }
      return { text: text2, ranges };
    }
    function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
      field.setAttribute("autocorrect", autocorrect ? "" : "off");
      field.setAttribute("autocapitalize", autocapitalize ? "" : "off");
      field.setAttribute("spellcheck", !!spellcheck);
    }
    function hiddenTextarea() {
      var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none");
      var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
      if (webkit) {
        te.style.width = "1000px";
      } else {
        te.setAttribute("wrap", "off");
      }
      if (ios) {
        te.style.border = "1px solid black";
      }
      disableBrowserMagic(te);
      return div;
    }
    function addEditorMethods(CodeMirror3) {
      var optionHandlers2 = CodeMirror3.optionHandlers;
      var helpers = CodeMirror3.helpers = {};
      CodeMirror3.prototype = {
        constructor: CodeMirror3,
        focus: function() {
          window.focus();
          this.display.input.focus();
        },
        setOption: function(option, value) {
          var options = this.options, old = options[option];
          if (options[option] == value && option != "mode") {
            return;
          }
          options[option] = value;
          if (optionHandlers2.hasOwnProperty(option)) {
            operation(this, optionHandlers2[option])(this, value, old);
          }
          signal(this, "optionChange", this, option);
        },
        getOption: function(option) {
          return this.options[option];
        },
        getDoc: function() {
          return this.doc;
        },
        addKeyMap: function(map2, bottom) {
          this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map2));
        },
        removeKeyMap: function(map2) {
          var maps = this.state.keyMaps;
          for (var i2 = 0; i2 < maps.length; ++i2) {
            if (maps[i2] == map2 || maps[i2].name == map2) {
              maps.splice(i2, 1);
              return true;
            }
          }
        },
        addOverlay: methodOp(function(spec, options) {
          var mode = spec.token ? spec : CodeMirror3.getMode(this.options, spec);
          if (mode.startState) {
            throw new Error("Overlays may not be stateful.");
          }
          insertSorted(this.state.overlays, {
            mode,
            modeSpec: spec,
            opaque: options && options.opaque,
            priority: options && options.priority || 0
          }, function(overlay2) {
            return overlay2.priority;
          });
          this.state.modeGen++;
          regChange(this);
        }),
        removeOverlay: methodOp(function(spec) {
          var overlays = this.state.overlays;
          for (var i2 = 0; i2 < overlays.length; ++i2) {
            var cur = overlays[i2].modeSpec;
            if (cur == spec || typeof spec == "string" && cur.name == spec) {
              overlays.splice(i2, 1);
              this.state.modeGen++;
              regChange(this);
              return;
            }
          }
        }),
        indentLine: methodOp(function(n, dir, aggressive) {
          if (typeof dir != "string" && typeof dir != "number") {
            if (dir == null) {
              dir = this.options.smartIndent ? "smart" : "prev";
            } else {
              dir = dir ? "add" : "subtract";
            }
          }
          if (isLine(this.doc, n)) {
            indentLine(this, n, dir, aggressive);
          }
        }),
        indentSelection: methodOp(function(how) {
          var ranges = this.doc.sel.ranges, end = -1;
          for (var i2 = 0; i2 < ranges.length; i2++) {
            var range2 = ranges[i2];
            if (!range2.empty()) {
              var from = range2.from(), to = range2.to();
              var start2 = Math.max(end, from.line);
              end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
              for (var j = start2; j < end; ++j) {
                indentLine(this, j, how);
              }
              var newRanges = this.doc.sel.ranges;
              if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i2].from().ch > 0) {
                replaceOneSelection(this.doc, i2, new Range(from, newRanges[i2].to()), sel_dontScroll);
              }
            } else if (range2.head.line > end) {
              indentLine(this, range2.head.line, how, true);
              end = range2.head.line;
              if (i2 == this.doc.sel.primIndex) {
                ensureCursorVisible(this);
              }
            }
          }
        }),
        getTokenAt: function(pos, precise) {
          return takeToken(this, pos, precise);
        },
        getLineTokens: function(line, precise) {
          return takeToken(this, Pos(line), precise, true);
        },
        getTokenTypeAt: function(pos) {
          pos = clipPos(this.doc, pos);
          var styles = getLineStyles(this, getLine(this.doc, pos.line));
          var before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
          var type;
          if (ch == 0) {
            type = styles[2];
          } else {
            for (; ; ) {
              var mid = before + after >> 1;
              if ((mid ? styles[mid * 2 - 1] : 0) >= ch) {
                after = mid;
              } else if (styles[mid * 2 + 1] < ch) {
                before = mid + 1;
              } else {
                type = styles[mid * 2 + 2];
                break;
              }
            }
          }
          var cut = type ? type.indexOf("overlay ") : -1;
          return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1);
        },
        getModeAt: function(pos) {
          var mode = this.doc.mode;
          if (!mode.innerMode) {
            return mode;
          }
          return CodeMirror3.innerMode(mode, this.getTokenAt(pos).state).mode;
        },
        getHelper: function(pos, type) {
          return this.getHelpers(pos, type)[0];
        },
        getHelpers: function(pos, type) {
          var found = [];
          if (!helpers.hasOwnProperty(type)) {
            return found;
          }
          var help = helpers[type], mode = this.getModeAt(pos);
          if (typeof mode[type] == "string") {
            if (help[mode[type]]) {
              found.push(help[mode[type]]);
            }
          } else if (mode[type]) {
            for (var i2 = 0; i2 < mode[type].length; i2++) {
              var val = help[mode[type][i2]];
              if (val) {
                found.push(val);
              }
            }
          } else if (mode.helperType && help[mode.helperType]) {
            found.push(help[mode.helperType]);
          } else if (help[mode.name]) {
            found.push(help[mode.name]);
          }
          for (var i$12 = 0; i$12 < help._global.length; i$12++) {
            var cur = help._global[i$12];
            if (cur.pred(mode, this) && indexOf(found, cur.val) == -1) {
              found.push(cur.val);
            }
          }
          return found;
        },
        getStateAfter: function(line, precise) {
          var doc = this.doc;
          line = clipLine(doc, line == null ? doc.first + doc.size - 1 : line);
          return getContextBefore(this, line + 1, precise).state;
        },
        cursorCoords: function(start2, mode) {
          var pos, range2 = this.doc.sel.primary();
          if (start2 == null) {
            pos = range2.head;
          } else if (typeof start2 == "object") {
            pos = clipPos(this.doc, start2);
          } else {
            pos = start2 ? range2.from() : range2.to();
          }
          return cursorCoords(this, pos, mode || "page");
        },
        charCoords: function(pos, mode) {
          return charCoords(this, clipPos(this.doc, pos), mode || "page");
        },
        coordsChar: function(coords, mode) {
          coords = fromCoordSystem(this, coords, mode || "page");
          return coordsChar(this, coords.left, coords.top);
        },
        lineAtHeight: function(height, mode) {
          height = fromCoordSystem(this, { top: height, left: 0 }, mode || "page").top;
          return lineAtHeight(this.doc, height + this.display.viewOffset);
        },
        heightAtLine: function(line, mode, includeWidgets) {
          var end = false, lineObj;
          if (typeof line == "number") {
            var last = this.doc.first + this.doc.size - 1;
            if (line < this.doc.first) {
              line = this.doc.first;
            } else if (line > last) {
              line = last;
              end = true;
            }
            lineObj = getLine(this.doc, line);
          } else {
            lineObj = line;
          }
          return intoCoordSystem(this, lineObj, { top: 0, left: 0 }, mode || "page", includeWidgets || end).top + (end ? this.doc.height - heightAtLine(lineObj) : 0);
        },
        defaultTextHeight: function() {
          return textHeight(this.display);
        },
        defaultCharWidth: function() {
          return charWidth(this.display);
        },
        getViewport: function() {
          return { from: this.display.viewFrom, to: this.display.viewTo };
        },
        addWidget: function(pos, node, scroll, vert, horiz) {
          var display = this.display;
          pos = cursorCoords(this, clipPos(this.doc, pos));
          var top = pos.bottom, left = pos.left;
          node.style.position = "absolute";
          node.setAttribute("cm-ignore-events", "true");
          this.display.input.setUneditable(node);
          display.sizer.appendChild(node);
          if (vert == "over") {
            top = pos.top;
          } else if (vert == "above" || vert == "near") {
            var vspace = Math.max(display.wrapper.clientHeight, this.doc.height), hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
            if ((vert == "above" || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight) {
              top = pos.top - node.offsetHeight;
            } else if (pos.bottom + node.offsetHeight <= vspace) {
              top = pos.bottom;
            }
            if (left + node.offsetWidth > hspace) {
              left = hspace - node.offsetWidth;
            }
          }
          node.style.top = top + "px";
          node.style.left = node.style.right = "";
          if (horiz == "right") {
            left = display.sizer.clientWidth - node.offsetWidth;
            node.style.right = "0px";
          } else {
            if (horiz == "left") {
              left = 0;
            } else if (horiz == "middle") {
              left = (display.sizer.clientWidth - node.offsetWidth) / 2;
            }
            node.style.left = left + "px";
          }
          if (scroll) {
            scrollIntoView(this, { left, top, right: left + node.offsetWidth, bottom: top + node.offsetHeight });
          }
        },
        triggerOnKeyDown: methodOp(onKeyDown),
        triggerOnKeyPress: methodOp(onKeyPress),
        triggerOnKeyUp: onKeyUp,
        triggerOnMouseDown: methodOp(onMouseDown),
        execCommand: function(cmd) {
          if (commands.hasOwnProperty(cmd)) {
            return commands[cmd].call(null, this);
          }
        },
        triggerElectric: methodOp(function(text2) {
          triggerElectric(this, text2);
        }),
        findPosH: function(from, amount, unit, visually) {
          var dir = 1;
          if (amount < 0) {
            dir = -1;
            amount = -amount;
          }
          var cur = clipPos(this.doc, from);
          for (var i2 = 0; i2 < amount; ++i2) {
            cur = findPosH(this.doc, cur, dir, unit, visually);
            if (cur.hitSide) {
              break;
            }
          }
          return cur;
        },
        moveH: methodOp(function(dir, unit) {
          var this$1$1 = this;
          this.extendSelectionsBy(function(range2) {
            if (this$1$1.display.shift || this$1$1.doc.extend || range2.empty()) {
              return findPosH(this$1$1.doc, range2.head, dir, unit, this$1$1.options.rtlMoveVisually);
            } else {
              return dir < 0 ? range2.from() : range2.to();
            }
          }, sel_move);
        }),
        deleteH: methodOp(function(dir, unit) {
          var sel = this.doc.sel, doc = this.doc;
          if (sel.somethingSelected()) {
            doc.replaceSelection("", null, "+delete");
          } else {
            deleteNearSelection(this, function(range2) {
              var other = findPosH(doc, range2.head, dir, unit, false);
              return dir < 0 ? { from: other, to: range2.head } : { from: range2.head, to: other };
            });
          }
        }),
        findPosV: function(from, amount, unit, goalColumn) {
          var dir = 1, x = goalColumn;
          if (amount < 0) {
            dir = -1;
            amount = -amount;
          }
          var cur = clipPos(this.doc, from);
          for (var i2 = 0; i2 < amount; ++i2) {
            var coords = cursorCoords(this, cur, "div");
            if (x == null) {
              x = coords.left;
            } else {
              coords.left = x;
            }
            cur = findPosV(this, coords, dir, unit);
            if (cur.hitSide) {
              break;
            }
          }
          return cur;
        },
        moveV: methodOp(function(dir, unit) {
          var this$1$1 = this;
          var doc = this.doc, goals = [];
          var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
          doc.extendSelectionsBy(function(range2) {
            if (collapse) {
              return dir < 0 ? range2.from() : range2.to();
            }
            var headPos = cursorCoords(this$1$1, range2.head, "div");
            if (range2.goalColumn != null) {
              headPos.left = range2.goalColumn;
            }
            goals.push(headPos.left);
            var pos = findPosV(this$1$1, headPos, dir, unit);
            if (unit == "page" && range2 == doc.sel.primary()) {
              addToScrollTop(this$1$1, charCoords(this$1$1, pos, "div").top - headPos.top);
            }
            return pos;
          }, sel_move);
          if (goals.length) {
            for (var i2 = 0; i2 < doc.sel.ranges.length; i2++) {
              doc.sel.ranges[i2].goalColumn = goals[i2];
            }
          }
        }),
        findWordAt: function(pos) {
          var doc = this.doc, line = getLine(doc, pos.line).text;
          var start2 = pos.ch, end = pos.ch;
          if (line) {
            var helper = this.getHelper(pos, "wordChars");
            if ((pos.sticky == "before" || end == line.length) && start2) {
              --start2;
            } else {
              ++end;
            }
            var startChar = line.charAt(start2);
            var check2 = isWordChar(startChar, helper) ? function(ch) {
              return isWordChar(ch, helper);
            } : /\s/.test(startChar) ? function(ch) {
              return /\s/.test(ch);
            } : function(ch) {
              return !/\s/.test(ch) && !isWordChar(ch);
            };
            while (start2 > 0 && check2(line.charAt(start2 - 1))) {
              --start2;
            }
            while (end < line.length && check2(line.charAt(end))) {
              ++end;
            }
          }
          return new Range(Pos(pos.line, start2), Pos(pos.line, end));
        },
        toggleOverwrite: function(value) {
          if (value != null && value == this.state.overwrite) {
            return;
          }
          if (this.state.overwrite = !this.state.overwrite) {
            addClass(this.display.cursorDiv, "CodeMirror-overwrite");
          } else {
            rmClass(this.display.cursorDiv, "CodeMirror-overwrite");
          }
          signal(this, "overwriteToggle", this, this.state.overwrite);
        },
        hasFocus: function() {
          return this.display.input.getField() == activeElt();
        },
        isReadOnly: function() {
          return !!(this.options.readOnly || this.doc.cantEdit);
        },
        scrollTo: methodOp(function(x, y) {
          scrollToCoords(this, x, y);
        }),
        getScrollInfo: function() {
          var scroller = this.display.scroller;
          return {
            left: scroller.scrollLeft,
            top: scroller.scrollTop,
            height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
            width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
            clientHeight: displayHeight(this),
            clientWidth: displayWidth(this)
          };
        },
        scrollIntoView: methodOp(function(range2, margin) {
          if (range2 == null) {
            range2 = { from: this.doc.sel.primary().head, to: null };
            if (margin == null) {
              margin = this.options.cursorScrollMargin;
            }
          } else if (typeof range2 == "number") {
            range2 = { from: Pos(range2, 0), to: null };
          } else if (range2.from == null) {
            range2 = { from: range2, to: null };
          }
          if (!range2.to) {
            range2.to = range2.from;
          }
          range2.margin = margin || 0;
          if (range2.from.line != null) {
            scrollToRange(this, range2);
          } else {
            scrollToCoordsRange(this, range2.from, range2.to, range2.margin);
          }
        }),
        setSize: methodOp(function(width, height) {
          var this$1$1 = this;
          var interpret = function(val) {
            return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
          };
          if (width != null) {
            this.display.wrapper.style.width = interpret(width);
          }
          if (height != null) {
            this.display.wrapper.style.height = interpret(height);
          }
          if (this.options.lineWrapping) {
            clearLineMeasurementCache(this);
          }
          var lineNo2 = this.display.viewFrom;
          this.doc.iter(lineNo2, this.display.viewTo, function(line) {
            if (line.widgets) {
              for (var i2 = 0; i2 < line.widgets.length; i2++) {
                if (line.widgets[i2].noHScroll) {
                  regLineChange(this$1$1, lineNo2, "widget");
                  break;
                }
              }
            }
            ++lineNo2;
          });
          this.curOp.forceUpdate = true;
          signal(this, "refresh", this);
        }),
        operation: function(f) {
          return runInOp(this, f);
        },
        startOperation: function() {
          return startOperation(this);
        },
        endOperation: function() {
          return endOperation(this);
        },
        refresh: methodOp(function() {
          var oldHeight = this.display.cachedTextHeight;
          regChange(this);
          this.curOp.forceUpdate = true;
          clearCaches(this);
          scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
          updateGutterSpace(this.display);
          if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > 0.5 || this.options.lineWrapping) {
            estimateLineHeights(this);
          }
          signal(this, "refresh", this);
        }),
        swapDoc: methodOp(function(doc) {
          var old = this.doc;
          old.cm = null;
          if (this.state.selectingText) {
            this.state.selectingText();
          }
          attachDoc(this, doc);
          clearCaches(this);
          this.display.input.reset();
          scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
          this.curOp.forceScroll = true;
          signalLater(this, "swapDoc", this, old);
          return old;
        }),
        phrase: function(phraseText) {
          var phrases = this.options.phrases;
          return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText;
        },
        getInputField: function() {
          return this.display.input.getField();
        },
        getWrapperElement: function() {
          return this.display.wrapper;
        },
        getScrollerElement: function() {
          return this.display.scroller;
        },
        getGutterElement: function() {
          return this.display.gutters;
        }
      };
      eventMixin(CodeMirror3);
      CodeMirror3.registerHelper = function(type, name, value) {
        if (!helpers.hasOwnProperty(type)) {
          helpers[type] = CodeMirror3[type] = { _global: [] };
        }
        helpers[type][name] = value;
      };
      CodeMirror3.registerGlobalHelper = function(type, name, predicate, value) {
        CodeMirror3.registerHelper(type, name, value);
        helpers[type]._global.push({ pred: predicate, val: value });
      };
    }
    function findPosH(doc, pos, dir, unit, visually) {
      var oldPos = pos;
      var origDir = dir;
      var lineObj = getLine(doc, pos.line);
      var lineDir = visually && doc.direction == "rtl" ? -dir : dir;
      function findNextLine() {
        var l = pos.line + lineDir;
        if (l < doc.first || l >= doc.first + doc.size) {
          return false;
        }
        pos = new Pos(l, pos.ch, pos.sticky);
        return lineObj = getLine(doc, l);
      }
      function moveOnce(boundToLine) {
        var next;
        if (unit == "codepoint") {
          var ch = lineObj.text.charCodeAt(pos.ch + (dir > 0 ? 0 : -1));
          if (isNaN(ch)) {
            next = null;
          } else {
            var astral = dir > 0 ? ch >= 55296 && ch < 56320 : ch >= 56320 && ch < 57343;
            next = new Pos(pos.line, Math.max(0, Math.min(lineObj.text.length, pos.ch + dir * (astral ? 2 : 1))), -dir);
          }
        } else if (visually) {
          next = moveVisually(doc.cm, lineObj, pos, dir);
        } else {
          next = moveLogically(lineObj, pos, dir);
        }
        if (next == null) {
          if (!boundToLine && findNextLine()) {
            pos = endOfLine(visually, doc.cm, lineObj, pos.line, lineDir);
          } else {
            return false;
          }
        } else {
          pos = next;
        }
        return true;
      }
      if (unit == "char" || unit == "codepoint") {
        moveOnce();
      } else if (unit == "column") {
        moveOnce(true);
      } else if (unit == "word" || unit == "group") {
        var sawType = null, group = unit == "group";
        var helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
        for (var first = true; ; first = false) {
          if (dir < 0 && !moveOnce(!first)) {
            break;
          }
          var cur = lineObj.text.charAt(pos.ch) || "\n";
          var type = isWordChar(cur, helper) ? "w" : group && cur == "\n" ? "n" : !group || /\s/.test(cur) ? null : "p";
          if (group && !first && !type) {
            type = "s";
          }
          if (sawType && sawType != type) {
            if (dir < 0) {
              dir = 1;
              moveOnce();
              pos.sticky = "after";
            }
            break;
          }
          if (type) {
            sawType = type;
          }
          if (dir > 0 && !moveOnce(!first)) {
            break;
          }
        }
      }
      var result = skipAtomic(doc, pos, oldPos, origDir, true);
      if (equalCursorPos(oldPos, result)) {
        result.hitSide = true;
      }
      return result;
    }
    function findPosV(cm, pos, dir, unit) {
      var doc = cm.doc, x = pos.left, y;
      if (unit == "page") {
        var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
        var moveAmount = Math.max(pageSize - 0.5 * textHeight(cm.display), 3);
        y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;
      } else if (unit == "line") {
        y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
      }
      var target;
      for (; ; ) {
        target = coordsChar(cm, x, y);
        if (!target.outside) {
          break;
        }
        if (dir < 0 ? y <= 0 : y >= doc.height) {
          target.hitSide = true;
          break;
        }
        y += dir * 5;
      }
      return target;
    }
    var ContentEditableInput = function(cm) {
      this.cm = cm;
      this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
      this.polling = new Delayed();
      this.composing = null;
      this.gracePeriod = false;
      this.readDOMTimeout = null;
    };
    ContentEditableInput.prototype.init = function(display) {
      var this$1$1 = this;
      var input = this, cm = input.cm;
      var div = input.div = display.lineDiv;
      div.contentEditable = true;
      disableBrowserMagic(div, cm.options.spellcheck, cm.options.autocorrect, cm.options.autocapitalize);
      function belongsToInput(e) {
        for (var t = e.target; t; t = t.parentNode) {
          if (t == div) {
            return true;
          }
          if (/\bCodeMirror-(?:line)?widget\b/.test(t.className)) {
            break;
          }
        }
        return false;
      }
      on(div, "paste", function(e) {
        if (!belongsToInput(e) || signalDOMEvent(cm, e) || handlePaste(e, cm)) {
          return;
        }
        if (ie_version <= 11) {
          setTimeout(operation(cm, function() {
            return this$1$1.updateFromDOM();
          }), 20);
        }
      });
      on(div, "compositionstart", function(e) {
        this$1$1.composing = { data: e.data, done: false };
      });
      on(div, "compositionupdate", function(e) {
        if (!this$1$1.composing) {
          this$1$1.composing = { data: e.data, done: false };
        }
      });
      on(div, "compositionend", function(e) {
        if (this$1$1.composing) {
          if (e.data != this$1$1.composing.data) {
            this$1$1.readFromDOMSoon();
          }
          this$1$1.composing.done = true;
        }
      });
      on(div, "touchstart", function() {
        return input.forceCompositionEnd();
      });
      on(div, "input", function() {
        if (!this$1$1.composing) {
          this$1$1.readFromDOMSoon();
        }
      });
      function onCopyCut(e) {
        if (!belongsToInput(e) || signalDOMEvent(cm, e)) {
          return;
        }
        if (cm.somethingSelected()) {
          setLastCopied({ lineWise: false, text: cm.getSelections() });
          if (e.type == "cut") {
            cm.replaceSelection("", null, "cut");
          }
        } else if (!cm.options.lineWiseCopyCut) {
          return;
        } else {
          var ranges = copyableRanges(cm);
          setLastCopied({ lineWise: true, text: ranges.text });
          if (e.type == "cut") {
            cm.operation(function() {
              cm.setSelections(ranges.ranges, 0, sel_dontScroll);
              cm.replaceSelection("", null, "cut");
            });
          }
        }
        if (e.clipboardData) {
          e.clipboardData.clearData();
          var content = lastCopied.text.join("\n");
          e.clipboardData.setData("Text", content);
          if (e.clipboardData.getData("Text") == content) {
            e.preventDefault();
            return;
          }
        }
        var kludge = hiddenTextarea(), te = kludge.firstChild;
        cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
        te.value = lastCopied.text.join("\n");
        var hadFocus = activeElt();
        selectInput(te);
        setTimeout(function() {
          cm.display.lineSpace.removeChild(kludge);
          hadFocus.focus();
          if (hadFocus == div) {
            input.showPrimarySelection();
          }
        }, 50);
      }
      on(div, "copy", onCopyCut);
      on(div, "cut", onCopyCut);
    };
    ContentEditableInput.prototype.screenReaderLabelChanged = function(label) {
      if (label) {
        this.div.setAttribute("aria-label", label);
      } else {
        this.div.removeAttribute("aria-label");
      }
    };
    ContentEditableInput.prototype.prepareSelection = function() {
      var result = prepareSelection(this.cm, false);
      result.focus = activeElt() == this.div;
      return result;
    };
    ContentEditableInput.prototype.showSelection = function(info, takeFocus) {
      if (!info || !this.cm.display.view.length) {
        return;
      }
      if (info.focus || takeFocus) {
        this.showPrimarySelection();
      }
      this.showMultipleSelections(info);
    };
    ContentEditableInput.prototype.getSelection = function() {
      return this.cm.display.wrapper.ownerDocument.getSelection();
    };
    ContentEditableInput.prototype.showPrimarySelection = function() {
      var sel = this.getSelection(), cm = this.cm, prim = cm.doc.sel.primary();
      var from = prim.from(), to = prim.to();
      if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
        sel.removeAllRanges();
        return;
      }
      var curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
      var curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
      if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad && cmp(minPos(curAnchor, curFocus), from) == 0 && cmp(maxPos(curAnchor, curFocus), to) == 0) {
        return;
      }
      var view = cm.display.view;
      var start2 = from.line >= cm.display.viewFrom && posToDOM(cm, from) || { node: view[0].measure.map[2], offset: 0 };
      var end = to.line < cm.display.viewTo && posToDOM(cm, to);
      if (!end) {
        var measure = view[view.length - 1].measure;
        var map2 = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
        end = { node: map2[map2.length - 1], offset: map2[map2.length - 2] - map2[map2.length - 3] };
      }
      if (!start2 || !end) {
        sel.removeAllRanges();
        return;
      }
      var old = sel.rangeCount && sel.getRangeAt(0), rng;
      try {
        rng = range(start2.node, start2.offset, end.offset, end.node);
      } catch (e) {
      }
      if (rng) {
        if (!gecko && cm.state.focused) {
          sel.collapse(start2.node, start2.offset);
          if (!rng.collapsed) {
            sel.removeAllRanges();
            sel.addRange(rng);
          }
        } else {
          sel.removeAllRanges();
          sel.addRange(rng);
        }
        if (old && sel.anchorNode == null) {
          sel.addRange(old);
        } else if (gecko) {
          this.startGracePeriod();
        }
      }
      this.rememberSelection();
    };
    ContentEditableInput.prototype.startGracePeriod = function() {
      var this$1$1 = this;
      clearTimeout(this.gracePeriod);
      this.gracePeriod = setTimeout(function() {
        this$1$1.gracePeriod = false;
        if (this$1$1.selectionChanged()) {
          this$1$1.cm.operation(function() {
            return this$1$1.cm.curOp.selectionChanged = true;
          });
        }
      }, 20);
    };
    ContentEditableInput.prototype.showMultipleSelections = function(info) {
      removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
      removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
    };
    ContentEditableInput.prototype.rememberSelection = function() {
      var sel = this.getSelection();
      this.lastAnchorNode = sel.anchorNode;
      this.lastAnchorOffset = sel.anchorOffset;
      this.lastFocusNode = sel.focusNode;
      this.lastFocusOffset = sel.focusOffset;
    };
    ContentEditableInput.prototype.selectionInEditor = function() {
      var sel = this.getSelection();
      if (!sel.rangeCount) {
        return false;
      }
      var node = sel.getRangeAt(0).commonAncestorContainer;
      return contains(this.div, node);
    };
    ContentEditableInput.prototype.focus = function() {
      if (this.cm.options.readOnly != "nocursor") {
        if (!this.selectionInEditor() || activeElt() != this.div) {
          this.showSelection(this.prepareSelection(), true);
        }
        this.div.focus();
      }
    };
    ContentEditableInput.prototype.blur = function() {
      this.div.blur();
    };
    ContentEditableInput.prototype.getField = function() {
      return this.div;
    };
    ContentEditableInput.prototype.supportsTouch = function() {
      return true;
    };
    ContentEditableInput.prototype.receivedFocus = function() {
      var input = this;
      if (this.selectionInEditor()) {
        this.pollSelection();
      } else {
        runInOp(this.cm, function() {
          return input.cm.curOp.selectionChanged = true;
        });
      }
      function poll() {
        if (input.cm.state.focused) {
          input.pollSelection();
          input.polling.set(input.cm.options.pollInterval, poll);
        }
      }
      this.polling.set(this.cm.options.pollInterval, poll);
    };
    ContentEditableInput.prototype.selectionChanged = function() {
      var sel = this.getSelection();
      return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset;
    };
    ContentEditableInput.prototype.pollSelection = function() {
      if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) {
        return;
      }
      var sel = this.getSelection(), cm = this.cm;
      if (android && chrome && this.cm.display.gutterSpecs.length && isInGutter(sel.anchorNode)) {
        this.cm.triggerOnKeyDown({ type: "keydown", keyCode: 8, preventDefault: Math.abs });
        this.blur();
        this.focus();
        return;
      }
      if (this.composing) {
        return;
      }
      this.rememberSelection();
      var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
      var head = domToPos(cm, sel.focusNode, sel.focusOffset);
      if (anchor && head) {
        runInOp(cm, function() {
          setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
          if (anchor.bad || head.bad) {
            cm.curOp.selectionChanged = true;
          }
        });
      }
    };
    ContentEditableInput.prototype.pollContent = function() {
      if (this.readDOMTimeout != null) {
        clearTimeout(this.readDOMTimeout);
        this.readDOMTimeout = null;
      }
      var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
      var from = sel.from(), to = sel.to();
      if (from.ch == 0 && from.line > cm.firstLine()) {
        from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length);
      }
      if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine()) {
        to = Pos(to.line + 1, 0);
      }
      if (from.line < display.viewFrom || to.line > display.viewTo - 1) {
        return false;
      }
      var fromIndex, fromLine, fromNode;
      if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
        fromLine = lineNo(display.view[0].line);
        fromNode = display.view[0].node;
      } else {
        fromLine = lineNo(display.view[fromIndex].line);
        fromNode = display.view[fromIndex - 1].node.nextSibling;
      }
      var toIndex = findViewIndex(cm, to.line);
      var toLine, toNode;
      if (toIndex == display.view.length - 1) {
        toLine = display.viewTo - 1;
        toNode = display.lineDiv.lastChild;
      } else {
        toLine = lineNo(display.view[toIndex + 1].line) - 1;
        toNode = display.view[toIndex + 1].node.previousSibling;
      }
      if (!fromNode) {
        return false;
      }
      var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
      var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
      while (newText.length > 1 && oldText.length > 1) {
        if (lst(newText) == lst(oldText)) {
          newText.pop();
          oldText.pop();
          toLine--;
        } else if (newText[0] == oldText[0]) {
          newText.shift();
          oldText.shift();
          fromLine++;
        } else {
          break;
        }
      }
      var cutFront = 0, cutEnd = 0;
      var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
      while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront)) {
        ++cutFront;
      }
      var newBot = lst(newText), oldBot = lst(oldText);
      var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0), oldBot.length - (oldText.length == 1 ? cutFront : 0));
      while (cutEnd < maxCutEnd && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
        ++cutEnd;
      }
      if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
        while (cutFront && cutFront > from.ch && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
          cutFront--;
          cutEnd++;
        }
      }
      newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "");
      newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "");
      var chFrom = Pos(fromLine, cutFront);
      var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
      if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
        replaceRange(cm.doc, newText, chFrom, chTo, "+input");
        return true;
      }
    };
    ContentEditableInput.prototype.ensurePolled = function() {
      this.forceCompositionEnd();
    };
    ContentEditableInput.prototype.reset = function() {
      this.forceCompositionEnd();
    };
    ContentEditableInput.prototype.forceCompositionEnd = function() {
      if (!this.composing) {
        return;
      }
      clearTimeout(this.readDOMTimeout);
      this.composing = null;
      this.updateFromDOM();
      this.div.blur();
      this.div.focus();
    };
    ContentEditableInput.prototype.readFromDOMSoon = function() {
      var this$1$1 = this;
      if (this.readDOMTimeout != null) {
        return;
      }
      this.readDOMTimeout = setTimeout(function() {
        this$1$1.readDOMTimeout = null;
        if (this$1$1.composing) {
          if (this$1$1.composing.done) {
            this$1$1.composing = null;
          } else {
            return;
          }
        }
        this$1$1.updateFromDOM();
      }, 80);
    };
    ContentEditableInput.prototype.updateFromDOM = function() {
      var this$1$1 = this;
      if (this.cm.isReadOnly() || !this.pollContent()) {
        runInOp(this.cm, function() {
          return regChange(this$1$1.cm);
        });
      }
    };
    ContentEditableInput.prototype.setUneditable = function(node) {
      node.contentEditable = "false";
    };
    ContentEditableInput.prototype.onKeyPress = function(e) {
      if (e.charCode == 0 || this.composing) {
        return;
      }
      e.preventDefault();
      if (!this.cm.isReadOnly()) {
        operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0);
      }
    };
    ContentEditableInput.prototype.readOnlyChanged = function(val) {
      this.div.contentEditable = String(val != "nocursor");
    };
    ContentEditableInput.prototype.onContextMenu = function() {
    };
    ContentEditableInput.prototype.resetPosition = function() {
    };
    ContentEditableInput.prototype.needsContentAttribute = true;
    function posToDOM(cm, pos) {
      var view = findViewForLine(cm, pos.line);
      if (!view || view.hidden) {
        return null;
      }
      var line = getLine(cm.doc, pos.line);
      var info = mapFromLineView(view, line, pos.line);
      var order = getOrder(line, cm.doc.direction), side = "left";
      if (order) {
        var partPos = getBidiPartAt(order, pos.ch);
        side = partPos % 2 ? "right" : "left";
      }
      var result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
      result.offset = result.collapse == "right" ? result.end : result.start;
      return result;
    }
    function isInGutter(node) {
      for (var scan = node; scan; scan = scan.parentNode) {
        if (/CodeMirror-gutter-wrapper/.test(scan.className)) {
          return true;
        }
      }
      return false;
    }
    function badPos(pos, bad) {
      if (bad) {
        pos.bad = true;
      }
      return pos;
    }
    function domTextBetween(cm, from, to, fromLine, toLine) {
      var text2 = "", closing = false, lineSep = cm.doc.lineSeparator(), extraLinebreak = false;
      function recognizeMarker(id) {
        return function(marker) {
          return marker.id == id;
        };
      }
      function close() {
        if (closing) {
          text2 += lineSep;
          if (extraLinebreak) {
            text2 += lineSep;
          }
          closing = extraLinebreak = false;
        }
      }
      function addText(str) {
        if (str) {
          close();
          text2 += str;
        }
      }
      function walk(node) {
        if (node.nodeType == 1) {
          var cmText = node.getAttribute("cm-text");
          if (cmText) {
            addText(cmText);
            return;
          }
          var markerID = node.getAttribute("cm-marker"), range2;
          if (markerID) {
            var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
            if (found.length && (range2 = found[0].find(0))) {
              addText(getBetween(cm.doc, range2.from, range2.to).join(lineSep));
            }
            return;
          }
          if (node.getAttribute("contenteditable") == "false") {
            return;
          }
          var isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
          if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0) {
            return;
          }
          if (isBlock) {
            close();
          }
          for (var i2 = 0; i2 < node.childNodes.length; i2++) {
            walk(node.childNodes[i2]);
          }
          if (/^(pre|p)$/i.test(node.nodeName)) {
            extraLinebreak = true;
          }
          if (isBlock) {
            closing = true;
          }
        } else if (node.nodeType == 3) {
          addText(node.nodeValue.replace(/\u200b/g, "").replace(/\u00a0/g, " "));
        }
      }
      for (; ; ) {
        walk(from);
        if (from == to) {
          break;
        }
        from = from.nextSibling;
        extraLinebreak = false;
      }
      return text2;
    }
    function domToPos(cm, node, offset) {
      var lineNode;
      if (node == cm.display.lineDiv) {
        lineNode = cm.display.lineDiv.childNodes[offset];
        if (!lineNode) {
          return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true);
        }
        node = null;
        offset = 0;
      } else {
        for (lineNode = node; ; lineNode = lineNode.parentNode) {
          if (!lineNode || lineNode == cm.display.lineDiv) {
            return null;
          }
          if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) {
            break;
          }
        }
      }
      for (var i2 = 0; i2 < cm.display.view.length; i2++) {
        var lineView = cm.display.view[i2];
        if (lineView.node == lineNode) {
          return locateNodeInLineView(lineView, node, offset);
        }
      }
    }
    function locateNodeInLineView(lineView, node, offset) {
      var wrapper = lineView.text.firstChild, bad = false;
      if (!node || !contains(wrapper, node)) {
        return badPos(Pos(lineNo(lineView.line), 0), true);
      }
      if (node == wrapper) {
        bad = true;
        node = wrapper.childNodes[offset];
        offset = 0;
        if (!node) {
          var line = lineView.rest ? lst(lineView.rest) : lineView.line;
          return badPos(Pos(lineNo(line), line.text.length), bad);
        }
      }
      var textNode = node.nodeType == 3 ? node : null, topNode = node;
      if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
        textNode = node.firstChild;
        if (offset) {
          offset = textNode.nodeValue.length;
        }
      }
      while (topNode.parentNode != wrapper) {
        topNode = topNode.parentNode;
      }
      var measure = lineView.measure, maps = measure.maps;
      function find(textNode2, topNode2, offset2) {
        for (var i2 = -1; i2 < (maps ? maps.length : 0); i2++) {
          var map2 = i2 < 0 ? measure.map : maps[i2];
          for (var j = 0; j < map2.length; j += 3) {
            var curNode = map2[j + 2];
            if (curNode == textNode2 || curNode == topNode2) {
              var line2 = lineNo(i2 < 0 ? lineView.line : lineView.rest[i2]);
              var ch = map2[j] + offset2;
              if (offset2 < 0 || curNode != textNode2) {
                ch = map2[j + (offset2 ? 1 : 0)];
              }
              return Pos(line2, ch);
            }
          }
        }
      }
      var found = find(textNode, topNode, offset);
      if (found) {
        return badPos(found, bad);
      }
      for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
        found = find(after, after.firstChild, 0);
        if (found) {
          return badPos(Pos(found.line, found.ch - dist), bad);
        } else {
          dist += after.textContent.length;
        }
      }
      for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
        found = find(before, before.firstChild, -1);
        if (found) {
          return badPos(Pos(found.line, found.ch + dist$1), bad);
        } else {
          dist$1 += before.textContent.length;
        }
      }
    }
    var TextareaInput = function(cm) {
      this.cm = cm;
      this.prevInput = "";
      this.pollingFast = false;
      this.polling = new Delayed();
      this.hasSelection = false;
      this.composing = null;
    };
    TextareaInput.prototype.init = function(display) {
      var this$1$1 = this;
      var input = this, cm = this.cm;
      this.createField(display);
      var te = this.textarea;
      display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);
      if (ios) {
        te.style.width = "0px";
      }
      on(te, "input", function() {
        if (ie && ie_version >= 9 && this$1$1.hasSelection) {
          this$1$1.hasSelection = null;
        }
        input.poll();
      });
      on(te, "paste", function(e) {
        if (signalDOMEvent(cm, e) || handlePaste(e, cm)) {
          return;
        }
        cm.state.pasteIncoming = +new Date();
        input.fastPoll();
      });
      function prepareCopyCut(e) {
        if (signalDOMEvent(cm, e)) {
          return;
        }
        if (cm.somethingSelected()) {
          setLastCopied({ lineWise: false, text: cm.getSelections() });
        } else if (!cm.options.lineWiseCopyCut) {
          return;
        } else {
          var ranges = copyableRanges(cm);
          setLastCopied({ lineWise: true, text: ranges.text });
          if (e.type == "cut") {
            cm.setSelections(ranges.ranges, null, sel_dontScroll);
          } else {
            input.prevInput = "";
            te.value = ranges.text.join("\n");
            selectInput(te);
          }
        }
        if (e.type == "cut") {
          cm.state.cutIncoming = +new Date();
        }
      }
      on(te, "cut", prepareCopyCut);
      on(te, "copy", prepareCopyCut);
      on(display.scroller, "paste", function(e) {
        if (eventInWidget(display, e) || signalDOMEvent(cm, e)) {
          return;
        }
        if (!te.dispatchEvent) {
          cm.state.pasteIncoming = +new Date();
          input.focus();
          return;
        }
        var event2 = new Event("paste");
        event2.clipboardData = e.clipboardData;
        te.dispatchEvent(event2);
      });
      on(display.lineSpace, "selectstart", function(e) {
        if (!eventInWidget(display, e)) {
          e_preventDefault(e);
        }
      });
      on(te, "compositionstart", function() {
        var start2 = cm.getCursor("from");
        if (input.composing) {
          input.composing.range.clear();
        }
        input.composing = {
          start: start2,
          range: cm.markText(start2, cm.getCursor("to"), { className: "CodeMirror-composing" })
        };
      });
      on(te, "compositionend", function() {
        if (input.composing) {
          input.poll();
          input.composing.range.clear();
          input.composing = null;
        }
      });
    };
    TextareaInput.prototype.createField = function(_display) {
      this.wrapper = hiddenTextarea();
      this.textarea = this.wrapper.firstChild;
    };
    TextareaInput.prototype.screenReaderLabelChanged = function(label) {
      if (label) {
        this.textarea.setAttribute("aria-label", label);
      } else {
        this.textarea.removeAttribute("aria-label");
      }
    };
    TextareaInput.prototype.prepareSelection = function() {
      var cm = this.cm, display = cm.display, doc = cm.doc;
      var result = prepareSelection(cm);
      if (cm.options.moveInputWithCursor) {
        var headPos = cursorCoords(cm, doc.sel.primary().head, "div");
        var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
        result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10, headPos.top + lineOff.top - wrapOff.top));
        result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10, headPos.left + lineOff.left - wrapOff.left));
      }
      return result;
    };
    TextareaInput.prototype.showSelection = function(drawn) {
      var cm = this.cm, display = cm.display;
      removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
      removeChildrenAndAdd(display.selectionDiv, drawn.selection);
      if (drawn.teTop != null) {
        this.wrapper.style.top = drawn.teTop + "px";
        this.wrapper.style.left = drawn.teLeft + "px";
      }
    };
    TextareaInput.prototype.reset = function(typing) {
      if (this.contextMenuPending || this.composing) {
        return;
      }
      var cm = this.cm;
      if (cm.somethingSelected()) {
        this.prevInput = "";
        var content = cm.getSelection();
        this.textarea.value = content;
        if (cm.state.focused) {
          selectInput(this.textarea);
        }
        if (ie && ie_version >= 9) {
          this.hasSelection = content;
        }
      } else if (!typing) {
        this.prevInput = this.textarea.value = "";
        if (ie && ie_version >= 9) {
          this.hasSelection = null;
        }
      }
    };
    TextareaInput.prototype.getField = function() {
      return this.textarea;
    };
    TextareaInput.prototype.supportsTouch = function() {
      return false;
    };
    TextareaInput.prototype.focus = function() {
      if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
        try {
          this.textarea.focus();
        } catch (e) {
        }
      }
    };
    TextareaInput.prototype.blur = function() {
      this.textarea.blur();
    };
    TextareaInput.prototype.resetPosition = function() {
      this.wrapper.style.top = this.wrapper.style.left = 0;
    };
    TextareaInput.prototype.receivedFocus = function() {
      this.slowPoll();
    };
    TextareaInput.prototype.slowPoll = function() {
      var this$1$1 = this;
      if (this.pollingFast) {
        return;
      }
      this.polling.set(this.cm.options.pollInterval, function() {
        this$1$1.poll();
        if (this$1$1.cm.state.focused) {
          this$1$1.slowPoll();
        }
      });
    };
    TextareaInput.prototype.fastPoll = function() {
      var missed = false, input = this;
      input.pollingFast = true;
      function p() {
        var changed = input.poll();
        if (!changed && !missed) {
          missed = true;
          input.polling.set(60, p);
        } else {
          input.pollingFast = false;
          input.slowPoll();
        }
      }
      input.polling.set(20, p);
    };
    TextareaInput.prototype.poll = function() {
      var this$1$1 = this;
      var cm = this.cm, input = this.textarea, prevInput = this.prevInput;
      if (this.contextMenuPending || !cm.state.focused || hasSelection(input) && !prevInput && !this.composing || cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq) {
        return false;
      }
      var text2 = input.value;
      if (text2 == prevInput && !cm.somethingSelected()) {
        return false;
      }
      if (ie && ie_version >= 9 && this.hasSelection === text2 || mac && /[\uf700-\uf7ff]/.test(text2)) {
        cm.display.input.reset();
        return false;
      }
      if (cm.doc.sel == cm.display.selForContextMenu) {
        var first = text2.charCodeAt(0);
        if (first == 8203 && !prevInput) {
          prevInput = "\u200B";
        }
        if (first == 8666) {
          this.reset();
          return this.cm.execCommand("undo");
        }
      }
      var same = 0, l = Math.min(prevInput.length, text2.length);
      while (same < l && prevInput.charCodeAt(same) == text2.charCodeAt(same)) {
        ++same;
      }
      runInOp(cm, function() {
        applyTextInput(cm, text2.slice(same), prevInput.length - same, null, this$1$1.composing ? "*compose" : null);
        if (text2.length > 1e3 || text2.indexOf("\n") > -1) {
          input.value = this$1$1.prevInput = "";
        } else {
          this$1$1.prevInput = text2;
        }
        if (this$1$1.composing) {
          this$1$1.composing.range.clear();
          this$1$1.composing.range = cm.markText(this$1$1.composing.start, cm.getCursor("to"), { className: "CodeMirror-composing" });
        }
      });
      return true;
    };
    TextareaInput.prototype.ensurePolled = function() {
      if (this.pollingFast && this.poll()) {
        this.pollingFast = false;
      }
    };
    TextareaInput.prototype.onKeyPress = function() {
      if (ie && ie_version >= 9) {
        this.hasSelection = null;
      }
      this.fastPoll();
    };
    TextareaInput.prototype.onContextMenu = function(e) {
      var input = this, cm = input.cm, display = cm.display, te = input.textarea;
      if (input.contextMenuPending) {
        input.contextMenuPending();
      }
      var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
      if (!pos || presto) {
        return;
      }
      var reset = cm.options.resetSelectionOnContextMenu;
      if (reset && cm.doc.sel.contains(pos) == -1) {
        operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll);
      }
      var oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText;
      var wrapperBox = input.wrapper.offsetParent.getBoundingClientRect();
      input.wrapper.style.cssText = "position: static";
      te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
      var oldScrollY;
      if (webkit) {
        oldScrollY = window.scrollY;
      }
      display.input.focus();
      if (webkit) {
        window.scrollTo(null, oldScrollY);
      }
      display.input.reset();
      if (!cm.somethingSelected()) {
        te.value = input.prevInput = " ";
      }
      input.contextMenuPending = rehide;
      display.selForContextMenu = cm.doc.sel;
      clearTimeout(display.detectingSelectAll);
      function prepareSelectAllHack() {
        if (te.selectionStart != null) {
          var selected = cm.somethingSelected();
          var extval = "\u200B" + (selected ? te.value : "");
          te.value = "\u21DA";
          te.value = extval;
          input.prevInput = selected ? "" : "\u200B";
          te.selectionStart = 1;
          te.selectionEnd = extval.length;
          display.selForContextMenu = cm.doc.sel;
        }
      }
      function rehide() {
        if (input.contextMenuPending != rehide) {
          return;
        }
        input.contextMenuPending = false;
        input.wrapper.style.cssText = oldWrapperCSS;
        te.style.cssText = oldCSS;
        if (ie && ie_version < 9) {
          display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos);
        }
        if (te.selectionStart != null) {
          if (!ie || ie && ie_version < 9) {
            prepareSelectAllHack();
          }
          var i2 = 0, poll = function() {
            if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 && te.selectionEnd > 0 && input.prevInput == "\u200B") {
              operation(cm, selectAll)(cm);
            } else if (i2++ < 10) {
              display.detectingSelectAll = setTimeout(poll, 500);
            } else {
              display.selForContextMenu = null;
              display.input.reset();
            }
          };
          display.detectingSelectAll = setTimeout(poll, 200);
        }
      }
      if (ie && ie_version >= 9) {
        prepareSelectAllHack();
      }
      if (captureRightClick) {
        e_stop(e);
        var mouseup = function() {
          off(window, "mouseup", mouseup);
          setTimeout(rehide, 20);
        };
        on(window, "mouseup", mouseup);
      } else {
        setTimeout(rehide, 50);
      }
    };
    TextareaInput.prototype.readOnlyChanged = function(val) {
      if (!val) {
        this.reset();
      }
      this.textarea.disabled = val == "nocursor";
      this.textarea.readOnly = !!val;
    };
    TextareaInput.prototype.setUneditable = function() {
    };
    TextareaInput.prototype.needsContentAttribute = false;
    function fromTextArea(textarea, options) {
      options = options ? copyObj(options) : {};
      options.value = textarea.value;
      if (!options.tabindex && textarea.tabIndex) {
        options.tabindex = textarea.tabIndex;
      }
      if (!options.placeholder && textarea.placeholder) {
        options.placeholder = textarea.placeholder;
      }
      if (options.autofocus == null) {
        var hasFocus = activeElt();
        options.autofocus = hasFocus == textarea || textarea.getAttribute("autofocus") != null && hasFocus == document.body;
      }
      function save() {
        textarea.value = cm.getValue();
      }
      var realSubmit;
      if (textarea.form) {
        on(textarea.form, "submit", save);
        if (!options.leaveSubmitMethodAlone) {
          var form = textarea.form;
          realSubmit = form.submit;
          try {
            var wrappedSubmit = form.submit = function() {
              save();
              form.submit = realSubmit;
              form.submit();
              form.submit = wrappedSubmit;
            };
          } catch (e) {
          }
        }
      }
      options.finishInit = function(cm2) {
        cm2.save = save;
        cm2.getTextArea = function() {
          return textarea;
        };
        cm2.toTextArea = function() {
          cm2.toTextArea = isNaN;
          save();
          textarea.parentNode.removeChild(cm2.getWrapperElement());
          textarea.style.display = "";
          if (textarea.form) {
            off(textarea.form, "submit", save);
            if (!options.leaveSubmitMethodAlone && typeof textarea.form.submit == "function") {
              textarea.form.submit = realSubmit;
            }
          }
        };
      };
      textarea.style.display = "none";
      var cm = CodeMirror2(function(node) {
        return textarea.parentNode.insertBefore(node, textarea.nextSibling);
      }, options);
      return cm;
    }
    function addLegacyProps(CodeMirror3) {
      CodeMirror3.off = off;
      CodeMirror3.on = on;
      CodeMirror3.wheelEventPixels = wheelEventPixels;
      CodeMirror3.Doc = Doc;
      CodeMirror3.splitLines = splitLinesAuto;
      CodeMirror3.countColumn = countColumn;
      CodeMirror3.findColumn = findColumn;
      CodeMirror3.isWordChar = isWordCharBasic;
      CodeMirror3.Pass = Pass;
      CodeMirror3.signal = signal;
      CodeMirror3.Line = Line;
      CodeMirror3.changeEnd = changeEnd;
      CodeMirror3.scrollbarModel = scrollbarModel;
      CodeMirror3.Pos = Pos;
      CodeMirror3.cmpPos = cmp;
      CodeMirror3.modes = modes;
      CodeMirror3.mimeModes = mimeModes;
      CodeMirror3.resolveMode = resolveMode;
      CodeMirror3.getMode = getMode;
      CodeMirror3.modeExtensions = modeExtensions;
      CodeMirror3.extendMode = extendMode;
      CodeMirror3.copyState = copyState;
      CodeMirror3.startState = startState;
      CodeMirror3.innerMode = innerMode;
      CodeMirror3.commands = commands;
      CodeMirror3.keyMap = keyMap;
      CodeMirror3.keyName = keyName;
      CodeMirror3.isModifierKey = isModifierKey;
      CodeMirror3.lookupKey = lookupKey;
      CodeMirror3.normalizeKeyMap = normalizeKeyMap;
      CodeMirror3.StringStream = StringStream;
      CodeMirror3.SharedTextMarker = SharedTextMarker;
      CodeMirror3.TextMarker = TextMarker;
      CodeMirror3.LineWidget = LineWidget;
      CodeMirror3.e_preventDefault = e_preventDefault;
      CodeMirror3.e_stopPropagation = e_stopPropagation;
      CodeMirror3.e_stop = e_stop;
      CodeMirror3.addClass = addClass;
      CodeMirror3.contains = contains;
      CodeMirror3.rmClass = rmClass;
      CodeMirror3.keyNames = keyNames;
    }
    defineOptions(CodeMirror2);
    addEditorMethods(CodeMirror2);
    var dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
    for (var prop in Doc.prototype) {
      if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0) {
        CodeMirror2.prototype[prop] = function(method) {
          return function() {
            return method.apply(this.doc, arguments);
          };
        }(Doc.prototype[prop]);
      }
    }
    eventMixin(Doc);
    CodeMirror2.inputStyles = { "textarea": TextareaInput, "contenteditable": ContentEditableInput };
    CodeMirror2.defineMode = function(name) {
      if (!CodeMirror2.defaults.mode && name != "null") {
        CodeMirror2.defaults.mode = name;
      }
      defineMode.apply(this, arguments);
    };
    CodeMirror2.defineMIME = defineMIME;
    CodeMirror2.defineMode("null", function() {
      return { token: function(stream) {
        return stream.skipToEnd();
      } };
    });
    CodeMirror2.defineMIME("text/plain", "null");
    CodeMirror2.defineExtension = function(name, func) {
      CodeMirror2.prototype[name] = func;
    };
    CodeMirror2.defineDocExtension = function(name, func) {
      Doc.prototype[name] = func;
    };
    CodeMirror2.fromTextArea = fromTextArea;
    addLegacyProps(CodeMirror2);
    CodeMirror2.version = "5.62.3";
    return CodeMirror2;
  });
})(codemirror);
var CodeMirror = codemirror.exports;
var markdown = { exports: {} };
var xml = { exports: {} };
(function(module, exports) {
  (function(mod) {
    mod(codemirror.exports);
  })(function(CodeMirror2) {
    var htmlConfig = {
      autoSelfClosers: {
        "area": true,
        "base": true,
        "br": true,
        "col": true,
        "command": true,
        "embed": true,
        "frame": true,
        "hr": true,
        "img": true,
        "input": true,
        "keygen": true,
        "link": true,
        "meta": true,
        "param": true,
        "source": true,
        "track": true,
        "wbr": true,
        "menuitem": true
      },
      implicitlyClosed: {
        "dd": true,
        "li": true,
        "optgroup": true,
        "option": true,
        "p": true,
        "rp": true,
        "rt": true,
        "tbody": true,
        "td": true,
        "tfoot": true,
        "th": true,
        "tr": true
      },
      contextGrabbers: {
        "dd": { "dd": true, "dt": true },
        "dt": { "dd": true, "dt": true },
        "li": { "li": true },
        "option": { "option": true, "optgroup": true },
        "optgroup": { "optgroup": true },
        "p": {
          "address": true,
          "article": true,
          "aside": true,
          "blockquote": true,
          "dir": true,
          "div": true,
          "dl": true,
          "fieldset": true,
          "footer": true,
          "form": true,
          "h1": true,
          "h2": true,
          "h3": true,
          "h4": true,
          "h5": true,
          "h6": true,
          "header": true,
          "hgroup": true,
          "hr": true,
          "menu": true,
          "nav": true,
          "ol": true,
          "p": true,
          "pre": true,
          "section": true,
          "table": true,
          "ul": true
        },
        "rp": { "rp": true, "rt": true },
        "rt": { "rp": true, "rt": true },
        "tbody": { "tbody": true, "tfoot": true },
        "td": { "td": true, "th": true },
        "tfoot": { "tbody": true },
        "th": { "td": true, "th": true },
        "thead": { "tbody": true, "tfoot": true },
        "tr": { "tr": true }
      },
      doNotIndent: { "pre": true },
      allowUnquoted: true,
      allowMissing: true,
      caseFold: true
    };
    var xmlConfig = {
      autoSelfClosers: {},
      implicitlyClosed: {},
      contextGrabbers: {},
      doNotIndent: {},
      allowUnquoted: false,
      allowMissing: false,
      allowMissingTagName: false,
      caseFold: false
    };
    CodeMirror2.defineMode("xml", function(editorConf, config_) {
      var indentUnit = editorConf.indentUnit;
      var config = {};
      var defaults2 = config_.htmlMode ? htmlConfig : xmlConfig;
      for (var prop in defaults2)
        config[prop] = defaults2[prop];
      for (var prop in config_)
        config[prop] = config_[prop];
      var type, setStyle;
      function inText(stream, state) {
        function chain(parser) {
          state.tokenize = parser;
          return parser(stream, state);
        }
        var ch = stream.next();
        if (ch == "<") {
          if (stream.eat("!")) {
            if (stream.eat("[")) {
              if (stream.match("CDATA["))
                return chain(inBlock("atom", "]]>"));
              else
                return null;
            } else if (stream.match("--")) {
              return chain(inBlock("comment", "-->"));
            } else if (stream.match("DOCTYPE", true, true)) {
              stream.eatWhile(/[\w\._\-]/);
              return chain(doctype(1));
            } else {
              return null;
            }
          } else if (stream.eat("?")) {
            stream.eatWhile(/[\w\._\-]/);
            state.tokenize = inBlock("meta", "?>");
            return "meta";
          } else {
            type = stream.eat("/") ? "closeTag" : "openTag";
            state.tokenize = inTag;
            return "tag bracket";
          }
        } else if (ch == "&") {
          var ok;
          if (stream.eat("#")) {
            if (stream.eat("x")) {
              ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
            } else {
              ok = stream.eatWhile(/[\d]/) && stream.eat(";");
            }
          } else {
            ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
          }
          return ok ? "atom" : "error";
        } else {
          stream.eatWhile(/[^&<]/);
          return null;
        }
      }
      inText.isInText = true;
      function inTag(stream, state) {
        var ch = stream.next();
        if (ch == ">" || ch == "/" && stream.eat(">")) {
          state.tokenize = inText;
          type = ch == ">" ? "endTag" : "selfcloseTag";
          return "tag bracket";
        } else if (ch == "=") {
          type = "equals";
          return null;
        } else if (ch == "<") {
          state.tokenize = inText;
          state.state = baseState;
          state.tagName = state.tagStart = null;
          var next = state.tokenize(stream, state);
          return next ? next + " tag error" : "tag error";
        } else if (/[\'\"]/.test(ch)) {
          state.tokenize = inAttribute(ch);
          state.stringStartCol = stream.column();
          return state.tokenize(stream, state);
        } else {
          stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
          return "word";
        }
      }
      function inAttribute(quote) {
        var closure = function(stream, state) {
          while (!stream.eol()) {
            if (stream.next() == quote) {
              state.tokenize = inTag;
              break;
            }
          }
          return "string";
        };
        closure.isInAttribute = true;
        return closure;
      }
      function inBlock(style, terminator) {
        return function(stream, state) {
          while (!stream.eol()) {
            if (stream.match(terminator)) {
              state.tokenize = inText;
              break;
            }
            stream.next();
          }
          return style;
        };
      }
      function doctype(depth) {
        return function(stream, state) {
          var ch;
          while ((ch = stream.next()) != null) {
            if (ch == "<") {
              state.tokenize = doctype(depth + 1);
              return state.tokenize(stream, state);
            } else if (ch == ">") {
              if (depth == 1) {
                state.tokenize = inText;
                break;
              } else {
                state.tokenize = doctype(depth - 1);
                return state.tokenize(stream, state);
              }
            }
          }
          return "meta";
        };
      }
      function Context(state, tagName, startOfLine) {
        this.prev = state.context;
        this.tagName = tagName || "";
        this.indent = state.indented;
        this.startOfLine = startOfLine;
        if (config.doNotIndent.hasOwnProperty(tagName) || state.context && state.context.noIndent)
          this.noIndent = true;
      }
      function popContext(state) {
        if (state.context)
          state.context = state.context.prev;
      }
      function maybePopContext(state, nextTagName) {
        var parentTagName;
        while (true) {
          if (!state.context) {
            return;
          }
          parentTagName = state.context.tagName;
          if (!config.contextGrabbers.hasOwnProperty(parentTagName) || !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
            return;
          }
          popContext(state);
        }
      }
      function baseState(type2, stream, state) {
        if (type2 == "openTag") {
          state.tagStart = stream.column();
          return tagNameState;
        } else if (type2 == "closeTag") {
          return closeTagNameState;
        } else {
          return baseState;
        }
      }
      function tagNameState(type2, stream, state) {
        if (type2 == "word") {
          state.tagName = stream.current();
          setStyle = "tag";
          return attrState;
        } else if (config.allowMissingTagName && type2 == "endTag") {
          setStyle = "tag bracket";
          return attrState(type2, stream, state);
        } else {
          setStyle = "error";
          return tagNameState;
        }
      }
      function closeTagNameState(type2, stream, state) {
        if (type2 == "word") {
          var tagName = stream.current();
          if (state.context && state.context.tagName != tagName && config.implicitlyClosed.hasOwnProperty(state.context.tagName))
            popContext(state);
          if (state.context && state.context.tagName == tagName || config.matchClosing === false) {
            setStyle = "tag";
            return closeState;
          } else {
            setStyle = "tag error";
            return closeStateErr;
          }
        } else if (config.allowMissingTagName && type2 == "endTag") {
          setStyle = "tag bracket";
          return closeState(type2, stream, state);
        } else {
          setStyle = "error";
          return closeStateErr;
        }
      }
      function closeState(type2, _stream, state) {
        if (type2 != "endTag") {
          setStyle = "error";
          return closeState;
        }
        popContext(state);
        return baseState;
      }
      function closeStateErr(type2, stream, state) {
        setStyle = "error";
        return closeState(type2, stream, state);
      }
      function attrState(type2, _stream, state) {
        if (type2 == "word") {
          setStyle = "attribute";
          return attrEqState;
        } else if (type2 == "endTag" || type2 == "selfcloseTag") {
          var tagName = state.tagName, tagStart = state.tagStart;
          state.tagName = state.tagStart = null;
          if (type2 == "selfcloseTag" || config.autoSelfClosers.hasOwnProperty(tagName)) {
            maybePopContext(state, tagName);
          } else {
            maybePopContext(state, tagName);
            state.context = new Context(state, tagName, tagStart == state.indented);
          }
          return baseState;
        }
        setStyle = "error";
        return attrState;
      }
      function attrEqState(type2, stream, state) {
        if (type2 == "equals")
          return attrValueState;
        if (!config.allowMissing)
          setStyle = "error";
        return attrState(type2, stream, state);
      }
      function attrValueState(type2, stream, state) {
        if (type2 == "string")
          return attrContinuedState;
        if (type2 == "word" && config.allowUnquoted) {
          setStyle = "string";
          return attrState;
        }
        setStyle = "error";
        return attrState(type2, stream, state);
      }
      function attrContinuedState(type2, stream, state) {
        if (type2 == "string")
          return attrContinuedState;
        return attrState(type2, stream, state);
      }
      return {
        startState: function(baseIndent) {
          var state = {
            tokenize: inText,
            state: baseState,
            indented: baseIndent || 0,
            tagName: null,
            tagStart: null,
            context: null
          };
          if (baseIndent != null)
            state.baseIndent = baseIndent;
          return state;
        },
        token: function(stream, state) {
          if (!state.tagName && stream.sol())
            state.indented = stream.indentation();
          if (stream.eatSpace())
            return null;
          type = null;
          var style = state.tokenize(stream, state);
          if ((style || type) && style != "comment") {
            setStyle = null;
            state.state = state.state(type || style, stream, state);
            if (setStyle)
              style = setStyle == "error" ? style + " error" : setStyle;
          }
          return style;
        },
        indent: function(state, textAfter, fullLine) {
          var context = state.context;
          if (state.tokenize.isInAttribute) {
            if (state.tagStart == state.indented)
              return state.stringStartCol + 1;
            else
              return state.indented + indentUnit;
          }
          if (context && context.noIndent)
            return CodeMirror2.Pass;
          if (state.tokenize != inTag && state.tokenize != inText)
            return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
          if (state.tagName) {
            if (config.multilineTagIndentPastTag !== false)
              return state.tagStart + state.tagName.length + 2;
            else
              return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1);
          }
          if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter))
            return 0;
          var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
          if (tagAfter && tagAfter[1]) {
            while (context) {
              if (context.tagName == tagAfter[2]) {
                context = context.prev;
                break;
              } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
                context = context.prev;
              } else {
                break;
              }
            }
          } else if (tagAfter) {
            while (context) {
              var grabbers = config.contextGrabbers[context.tagName];
              if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
                context = context.prev;
              else
                break;
            }
          }
          while (context && context.prev && !context.startOfLine)
            context = context.prev;
          if (context)
            return context.indent + indentUnit;
          else
            return state.baseIndent || 0;
        },
        electricInput: /<\/[\s\w:]+>$/,
        blockCommentStart: "<!--",
        blockCommentEnd: "-->",
        configuration: config.htmlMode ? "html" : "xml",
        helperType: config.htmlMode ? "html" : "xml",
        skipAttribute: function(state) {
          if (state.state == attrValueState)
            state.state = attrState;
        },
        xmlCurrentTag: function(state) {
          return state.tagName ? { name: state.tagName, close: state.type == "closeTag" } : null;
        },
        xmlCurrentContext: function(state) {
          var context = [];
          for (var cx = state.context; cx; cx = cx.prev)
            context.push(cx.tagName);
          return context.reverse();
        }
      };
    });
    CodeMirror2.defineMIME("text/xml", "xml");
    CodeMirror2.defineMIME("application/xml", "xml");
    if (!CodeMirror2.mimeModes.hasOwnProperty("text/html"))
      CodeMirror2.defineMIME("text/html", { name: "xml", htmlMode: true });
  });
})();
var meta = { exports: {} };
(function(module, exports) {
  (function(mod) {
    mod(codemirror.exports);
  })(function(CodeMirror2) {
    CodeMirror2.modeInfo = [
      { name: "APL", mime: "text/apl", mode: "apl", ext: ["dyalog", "apl"] },
      { name: "PGP", mimes: ["application/pgp", "application/pgp-encrypted", "application/pgp-keys", "application/pgp-signature"], mode: "asciiarmor", ext: ["asc", "pgp", "sig"] },
      { name: "ASN.1", mime: "text/x-ttcn-asn", mode: "asn.1", ext: ["asn", "asn1"] },
      { name: "Asterisk", mime: "text/x-asterisk", mode: "asterisk", file: /^extensions\.conf$/i },
      { name: "Brainfuck", mime: "text/x-brainfuck", mode: "brainfuck", ext: ["b", "bf"] },
      { name: "C", mime: "text/x-csrc", mode: "clike", ext: ["c", "h", "ino"] },
      { name: "C++", mime: "text/x-c++src", mode: "clike", ext: ["cpp", "c++", "cc", "cxx", "hpp", "h++", "hh", "hxx"], alias: ["cpp"] },
      { name: "Cobol", mime: "text/x-cobol", mode: "cobol", ext: ["cob", "cpy", "cbl"] },
      { name: "C#", mime: "text/x-csharp", mode: "clike", ext: ["cs"], alias: ["csharp", "cs"] },
      { name: "Clojure", mime: "text/x-clojure", mode: "clojure", ext: ["clj", "cljc", "cljx"] },
      { name: "ClojureScript", mime: "text/x-clojurescript", mode: "clojure", ext: ["cljs"] },
      { name: "Closure Stylesheets (GSS)", mime: "text/x-gss", mode: "css", ext: ["gss"] },
      { name: "CMake", mime: "text/x-cmake", mode: "cmake", ext: ["cmake", "cmake.in"], file: /^CMakeLists\.txt$/ },
      { name: "CoffeeScript", mimes: ["application/vnd.coffeescript", "text/coffeescript", "text/x-coffeescript"], mode: "coffeescript", ext: ["coffee"], alias: ["coffee", "coffee-script"] },
      { name: "Common Lisp", mime: "text/x-common-lisp", mode: "commonlisp", ext: ["cl", "lisp", "el"], alias: ["lisp"] },
      { name: "Cypher", mime: "application/x-cypher-query", mode: "cypher", ext: ["cyp", "cypher"] },
      { name: "Cython", mime: "text/x-cython", mode: "python", ext: ["pyx", "pxd", "pxi"] },
      { name: "Crystal", mime: "text/x-crystal", mode: "crystal", ext: ["cr"] },
      { name: "CSS", mime: "text/css", mode: "css", ext: ["css"] },
      { name: "CQL", mime: "text/x-cassandra", mode: "sql", ext: ["cql"] },
      { name: "D", mime: "text/x-d", mode: "d", ext: ["d"] },
      { name: "Dart", mimes: ["application/dart", "text/x-dart"], mode: "dart", ext: ["dart"] },
      { name: "diff", mime: "text/x-diff", mode: "diff", ext: ["diff", "patch"] },
      { name: "Django", mime: "text/x-django", mode: "django" },
      { name: "Dockerfile", mime: "text/x-dockerfile", mode: "dockerfile", file: /^Dockerfile$/ },
      { name: "DTD", mime: "application/xml-dtd", mode: "dtd", ext: ["dtd"] },
      { name: "Dylan", mime: "text/x-dylan", mode: "dylan", ext: ["dylan", "dyl", "intr"] },
      { name: "EBNF", mime: "text/x-ebnf", mode: "ebnf" },
      { name: "ECL", mime: "text/x-ecl", mode: "ecl", ext: ["ecl"] },
      { name: "edn", mime: "application/edn", mode: "clojure", ext: ["edn"] },
      { name: "Eiffel", mime: "text/x-eiffel", mode: "eiffel", ext: ["e"] },
      { name: "Elm", mime: "text/x-elm", mode: "elm", ext: ["elm"] },
      { name: "Embedded JavaScript", mime: "application/x-ejs", mode: "htmlembedded", ext: ["ejs"] },
      { name: "Embedded Ruby", mime: "application/x-erb", mode: "htmlembedded", ext: ["erb"] },
      { name: "Erlang", mime: "text/x-erlang", mode: "erlang", ext: ["erl"] },
      { name: "Esper", mime: "text/x-esper", mode: "sql" },
      { name: "Factor", mime: "text/x-factor", mode: "factor", ext: ["factor"] },
      { name: "FCL", mime: "text/x-fcl", mode: "fcl" },
      { name: "Forth", mime: "text/x-forth", mode: "forth", ext: ["forth", "fth", "4th"] },
      { name: "Fortran", mime: "text/x-fortran", mode: "fortran", ext: ["f", "for", "f77", "f90", "f95"] },
      { name: "F#", mime: "text/x-fsharp", mode: "mllike", ext: ["fs"], alias: ["fsharp"] },
      { name: "Gas", mime: "text/x-gas", mode: "gas", ext: ["s"] },
      { name: "Gherkin", mime: "text/x-feature", mode: "gherkin", ext: ["feature"] },
      { name: "GitHub Flavored Markdown", mime: "text/x-gfm", mode: "gfm", file: /^(readme|contributing|history)\.md$/i },
      { name: "Go", mime: "text/x-go", mode: "go", ext: ["go"] },
      { name: "Groovy", mime: "text/x-groovy", mode: "groovy", ext: ["groovy", "gradle"], file: /^Jenkinsfile$/ },
      { name: "HAML", mime: "text/x-haml", mode: "haml", ext: ["haml"] },
      { name: "Haskell", mime: "text/x-haskell", mode: "haskell", ext: ["hs"] },
      { name: "Haskell (Literate)", mime: "text/x-literate-haskell", mode: "haskell-literate", ext: ["lhs"] },
      { name: "Haxe", mime: "text/x-haxe", mode: "haxe", ext: ["hx"] },
      { name: "HXML", mime: "text/x-hxml", mode: "haxe", ext: ["hxml"] },
      { name: "ASP.NET", mime: "application/x-aspx", mode: "htmlembedded", ext: ["aspx"], alias: ["asp", "aspx"] },
      { name: "HTML", mime: "text/html", mode: "htmlmixed", ext: ["html", "htm", "handlebars", "hbs"], alias: ["xhtml"] },
      { name: "HTTP", mime: "message/http", mode: "http" },
      { name: "IDL", mime: "text/x-idl", mode: "idl", ext: ["pro"] },
      { name: "Pug", mime: "text/x-pug", mode: "pug", ext: ["jade", "pug"], alias: ["jade"] },
      { name: "Java", mime: "text/x-java", mode: "clike", ext: ["java"] },
      { name: "Java Server Pages", mime: "application/x-jsp", mode: "htmlembedded", ext: ["jsp"], alias: ["jsp"] },
      {
        name: "JavaScript",
        mimes: ["text/javascript", "text/ecmascript", "application/javascript", "application/x-javascript", "application/ecmascript"],
        mode: "javascript",
        ext: ["js"],
        alias: ["ecmascript", "js", "node"]
      },
      { name: "JSON", mimes: ["application/json", "application/x-json"], mode: "javascript", ext: ["json", "map"], alias: ["json5"] },
      { name: "JSON-LD", mime: "application/ld+json", mode: "javascript", ext: ["jsonld"], alias: ["jsonld"] },
      { name: "JSX", mime: "text/jsx", mode: "jsx", ext: ["jsx"] },
      { name: "Jinja2", mime: "text/jinja2", mode: "jinja2", ext: ["j2", "jinja", "jinja2"] },
      { name: "Julia", mime: "text/x-julia", mode: "julia", ext: ["jl"], alias: ["jl"] },
      { name: "Kotlin", mime: "text/x-kotlin", mode: "clike", ext: ["kt"] },
      { name: "LESS", mime: "text/x-less", mode: "css", ext: ["less"] },
      { name: "LiveScript", mime: "text/x-livescript", mode: "livescript", ext: ["ls"], alias: ["ls"] },
      { name: "Lua", mime: "text/x-lua", mode: "lua", ext: ["lua"] },
      { name: "Markdown", mime: "text/x-markdown", mode: "markdown", ext: ["markdown", "md", "mkd"] },
      { name: "mIRC", mime: "text/mirc", mode: "mirc" },
      { name: "MariaDB SQL", mime: "text/x-mariadb", mode: "sql" },
      { name: "Mathematica", mime: "text/x-mathematica", mode: "mathematica", ext: ["m", "nb", "wl", "wls"] },
      { name: "Modelica", mime: "text/x-modelica", mode: "modelica", ext: ["mo"] },
      { name: "MUMPS", mime: "text/x-mumps", mode: "mumps", ext: ["mps"] },
      { name: "MS SQL", mime: "text/x-mssql", mode: "sql" },
      { name: "mbox", mime: "application/mbox", mode: "mbox", ext: ["mbox"] },
      { name: "MySQL", mime: "text/x-mysql", mode: "sql" },
      { name: "Nginx", mime: "text/x-nginx-conf", mode: "nginx", file: /nginx.*\.conf$/i },
      { name: "NSIS", mime: "text/x-nsis", mode: "nsis", ext: ["nsh", "nsi"] },
      {
        name: "NTriples",
        mimes: ["application/n-triples", "application/n-quads", "text/n-triples"],
        mode: "ntriples",
        ext: ["nt", "nq"]
      },
      { name: "Objective-C", mime: "text/x-objectivec", mode: "clike", ext: ["m"], alias: ["objective-c", "objc"] },
      { name: "Objective-C++", mime: "text/x-objectivec++", mode: "clike", ext: ["mm"], alias: ["objective-c++", "objc++"] },
      { name: "OCaml", mime: "text/x-ocaml", mode: "mllike", ext: ["ml", "mli", "mll", "mly"] },
      { name: "Octave", mime: "text/x-octave", mode: "octave", ext: ["m"] },
      { name: "Oz", mime: "text/x-oz", mode: "oz", ext: ["oz"] },
      { name: "Pascal", mime: "text/x-pascal", mode: "pascal", ext: ["p", "pas"] },
      { name: "PEG.js", mime: "null", mode: "pegjs", ext: ["jsonld"] },
      { name: "Perl", mime: "text/x-perl", mode: "perl", ext: ["pl", "pm"] },
      { name: "PHP", mimes: ["text/x-php", "application/x-httpd-php", "application/x-httpd-php-open"], mode: "php", ext: ["php", "php3", "php4", "php5", "php7", "phtml"] },
      { name: "Pig", mime: "text/x-pig", mode: "pig", ext: ["pig"] },
      { name: "Plain Text", mime: "text/plain", mode: "null", ext: ["txt", "text", "conf", "def", "list", "log"] },
      { name: "PLSQL", mime: "text/x-plsql", mode: "sql", ext: ["pls"] },
      { name: "PostgreSQL", mime: "text/x-pgsql", mode: "sql" },
      { name: "PowerShell", mime: "application/x-powershell", mode: "powershell", ext: ["ps1", "psd1", "psm1"] },
      { name: "Properties files", mime: "text/x-properties", mode: "properties", ext: ["properties", "ini", "in"], alias: ["ini", "properties"] },
      { name: "ProtoBuf", mime: "text/x-protobuf", mode: "protobuf", ext: ["proto"] },
      { name: "Python", mime: "text/x-python", mode: "python", ext: ["BUILD", "bzl", "py", "pyw"], file: /^(BUCK|BUILD)$/ },
      { name: "Puppet", mime: "text/x-puppet", mode: "puppet", ext: ["pp"] },
      { name: "Q", mime: "text/x-q", mode: "q", ext: ["q"] },
      { name: "R", mime: "text/x-rsrc", mode: "r", ext: ["r", "R"], alias: ["rscript"] },
      { name: "reStructuredText", mime: "text/x-rst", mode: "rst", ext: ["rst"], alias: ["rst"] },
      { name: "RPM Changes", mime: "text/x-rpm-changes", mode: "rpm" },
      { name: "RPM Spec", mime: "text/x-rpm-spec", mode: "rpm", ext: ["spec"] },
      { name: "Ruby", mime: "text/x-ruby", mode: "ruby", ext: ["rb"], alias: ["jruby", "macruby", "rake", "rb", "rbx"] },
      { name: "Rust", mime: "text/x-rustsrc", mode: "rust", ext: ["rs"] },
      { name: "SAS", mime: "text/x-sas", mode: "sas", ext: ["sas"] },
      { name: "Sass", mime: "text/x-sass", mode: "sass", ext: ["sass"] },
      { name: "Scala", mime: "text/x-scala", mode: "clike", ext: ["scala"] },
      { name: "Scheme", mime: "text/x-scheme", mode: "scheme", ext: ["scm", "ss"] },
      { name: "SCSS", mime: "text/x-scss", mode: "css", ext: ["scss"] },
      { name: "Shell", mimes: ["text/x-sh", "application/x-sh"], mode: "shell", ext: ["sh", "ksh", "bash"], alias: ["bash", "sh", "zsh"], file: /^PKGBUILD$/ },
      { name: "Sieve", mime: "application/sieve", mode: "sieve", ext: ["siv", "sieve"] },
      { name: "Slim", mimes: ["text/x-slim", "application/x-slim"], mode: "slim", ext: ["slim"] },
      { name: "Smalltalk", mime: "text/x-stsrc", mode: "smalltalk", ext: ["st"] },
      { name: "Smarty", mime: "text/x-smarty", mode: "smarty", ext: ["tpl"] },
      { name: "Solr", mime: "text/x-solr", mode: "solr" },
      { name: "SML", mime: "text/x-sml", mode: "mllike", ext: ["sml", "sig", "fun", "smackspec"] },
      { name: "Soy", mime: "text/x-soy", mode: "soy", ext: ["soy"], alias: ["closure template"] },
      { name: "SPARQL", mime: "application/sparql-query", mode: "sparql", ext: ["rq", "sparql"], alias: ["sparul"] },
      { name: "Spreadsheet", mime: "text/x-spreadsheet", mode: "spreadsheet", alias: ["excel", "formula"] },
      { name: "SQL", mime: "text/x-sql", mode: "sql", ext: ["sql"] },
      { name: "SQLite", mime: "text/x-sqlite", mode: "sql" },
      { name: "Squirrel", mime: "text/x-squirrel", mode: "clike", ext: ["nut"] },
      { name: "Stylus", mime: "text/x-styl", mode: "stylus", ext: ["styl"] },
      { name: "Swift", mime: "text/x-swift", mode: "swift", ext: ["swift"] },
      { name: "sTeX", mime: "text/x-stex", mode: "stex" },
      { name: "LaTeX", mime: "text/x-latex", mode: "stex", ext: ["text", "ltx", "tex"], alias: ["tex"] },
      { name: "SystemVerilog", mime: "text/x-systemverilog", mode: "verilog", ext: ["v", "sv", "svh"] },
      { name: "Tcl", mime: "text/x-tcl", mode: "tcl", ext: ["tcl"] },
      { name: "Textile", mime: "text/x-textile", mode: "textile", ext: ["textile"] },
      { name: "TiddlyWiki", mime: "text/x-tiddlywiki", mode: "tiddlywiki" },
      { name: "Tiki wiki", mime: "text/tiki", mode: "tiki" },
      { name: "TOML", mime: "text/x-toml", mode: "toml", ext: ["toml"] },
      { name: "Tornado", mime: "text/x-tornado", mode: "tornado" },
      { name: "troff", mime: "text/troff", mode: "troff", ext: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
      { name: "TTCN", mime: "text/x-ttcn", mode: "ttcn", ext: ["ttcn", "ttcn3", "ttcnpp"] },
      { name: "TTCN_CFG", mime: "text/x-ttcn-cfg", mode: "ttcn-cfg", ext: ["cfg"] },
      { name: "Turtle", mime: "text/turtle", mode: "turtle", ext: ["ttl"] },
      { name: "TypeScript", mime: "application/typescript", mode: "javascript", ext: ["ts"], alias: ["ts"] },
      { name: "TypeScript-JSX", mime: "text/typescript-jsx", mode: "jsx", ext: ["tsx"], alias: ["tsx"] },
      { name: "Twig", mime: "text/x-twig", mode: "twig" },
      { name: "Web IDL", mime: "text/x-webidl", mode: "webidl", ext: ["webidl"] },
      { name: "VB.NET", mime: "text/x-vb", mode: "vb", ext: ["vb"] },
      { name: "VBScript", mime: "text/vbscript", mode: "vbscript", ext: ["vbs"] },
      { name: "Velocity", mime: "text/velocity", mode: "velocity", ext: ["vtl"] },
      { name: "Verilog", mime: "text/x-verilog", mode: "verilog", ext: ["v"] },
      { name: "VHDL", mime: "text/x-vhdl", mode: "vhdl", ext: ["vhd", "vhdl"] },
      { name: "Vue.js Component", mimes: ["script/x-vue", "text/x-vue"], mode: "vue", ext: ["vue"] },
      { name: "XML", mimes: ["application/xml", "text/xml"], mode: "xml", ext: ["xml", "xsl", "xsd", "svg"], alias: ["rss", "wsdl", "xsd"] },
      { name: "XQuery", mime: "application/xquery", mode: "xquery", ext: ["xy", "xquery"] },
      { name: "Yacas", mime: "text/x-yacas", mode: "yacas", ext: ["ys"] },
      { name: "YAML", mimes: ["text/x-yaml", "text/yaml"], mode: "yaml", ext: ["yaml", "yml"], alias: ["yml"] },
      { name: "Z80", mime: "text/x-z80", mode: "z80", ext: ["z80"] },
      { name: "mscgen", mime: "text/x-mscgen", mode: "mscgen", ext: ["mscgen", "mscin", "msc"] },
      { name: "xu", mime: "text/x-xu", mode: "mscgen", ext: ["xu"] },
      { name: "msgenny", mime: "text/x-msgenny", mode: "mscgen", ext: ["msgenny"] },
      { name: "WebAssembly", mime: "text/webassembly", mode: "wast", ext: ["wat", "wast"] }
    ];
    for (var i = 0; i < CodeMirror2.modeInfo.length; i++) {
      var info = CodeMirror2.modeInfo[i];
      if (info.mimes)
        info.mime = info.mimes[0];
    }
    CodeMirror2.findModeByMIME = function(mime) {
      mime = mime.toLowerCase();
      for (var i2 = 0; i2 < CodeMirror2.modeInfo.length; i2++) {
        var info2 = CodeMirror2.modeInfo[i2];
        if (info2.mime == mime)
          return info2;
        if (info2.mimes) {
          for (var j = 0; j < info2.mimes.length; j++)
            if (info2.mimes[j] == mime)
              return info2;
        }
      }
      if (/\+xml$/.test(mime))
        return CodeMirror2.findModeByMIME("application/xml");
      if (/\+json$/.test(mime))
        return CodeMirror2.findModeByMIME("application/json");
    };
    CodeMirror2.findModeByExtension = function(ext) {
      ext = ext.toLowerCase();
      for (var i2 = 0; i2 < CodeMirror2.modeInfo.length; i2++) {
        var info2 = CodeMirror2.modeInfo[i2];
        if (info2.ext) {
          for (var j = 0; j < info2.ext.length; j++)
            if (info2.ext[j] == ext)
              return info2;
        }
      }
    };
    CodeMirror2.findModeByFileName = function(filename) {
      for (var i2 = 0; i2 < CodeMirror2.modeInfo.length; i2++) {
        var info2 = CodeMirror2.modeInfo[i2];
        if (info2.file && info2.file.test(filename))
          return info2;
      }
      var dot = filename.lastIndexOf(".");
      var ext = dot > -1 && filename.substring(dot + 1, filename.length);
      if (ext)
        return CodeMirror2.findModeByExtension(ext);
    };
    CodeMirror2.findModeByName = function(name) {
      name = name.toLowerCase();
      for (var i2 = 0; i2 < CodeMirror2.modeInfo.length; i2++) {
        var info2 = CodeMirror2.modeInfo[i2];
        if (info2.name.toLowerCase() == name)
          return info2;
        if (info2.alias) {
          for (var j = 0; j < info2.alias.length; j++)
            if (info2.alias[j].toLowerCase() == name)
              return info2;
        }
      }
    };
  });
})();
(function(module, exports) {
  (function(mod) {
    mod(codemirror.exports, xml.exports, meta.exports);
  })(function(CodeMirror2) {
    CodeMirror2.defineMode("markdown", function(cmCfg, modeCfg) {
      var htmlMode = CodeMirror2.getMode(cmCfg, "text/html");
      var htmlModeMissing = htmlMode.name == "null";
      function getMode(name) {
        if (CodeMirror2.findModeByName) {
          var found = CodeMirror2.findModeByName(name);
          if (found)
            name = found.mime || found.mimes[0];
        }
        var mode2 = CodeMirror2.getMode(cmCfg, name);
        return mode2.name == "null" ? null : mode2;
      }
      if (modeCfg.highlightFormatting === void 0)
        modeCfg.highlightFormatting = false;
      if (modeCfg.maxBlockquoteDepth === void 0)
        modeCfg.maxBlockquoteDepth = 0;
      if (modeCfg.taskLists === void 0)
        modeCfg.taskLists = false;
      if (modeCfg.strikethrough === void 0)
        modeCfg.strikethrough = false;
      if (modeCfg.emoji === void 0)
        modeCfg.emoji = false;
      if (modeCfg.fencedCodeBlockHighlighting === void 0)
        modeCfg.fencedCodeBlockHighlighting = true;
      if (modeCfg.fencedCodeBlockDefaultMode === void 0)
        modeCfg.fencedCodeBlockDefaultMode = "text/plain";
      if (modeCfg.xml === void 0)
        modeCfg.xml = true;
      if (modeCfg.tokenTypeOverrides === void 0)
        modeCfg.tokenTypeOverrides = {};
      var tokenTypes = {
        header: "header",
        code: "comment",
        quote: "quote",
        list1: "variable-2",
        list2: "variable-3",
        list3: "keyword",
        hr: "hr",
        image: "image",
        imageAltText: "image-alt-text",
        imageMarker: "image-marker",
        formatting: "formatting",
        linkInline: "link",
        linkEmail: "link",
        linkText: "link",
        linkHref: "string",
        em: "em",
        strong: "strong",
        strikethrough: "strikethrough",
        emoji: "builtin"
      };
      for (var tokenType in tokenTypes) {
        if (tokenTypes.hasOwnProperty(tokenType) && modeCfg.tokenTypeOverrides[tokenType]) {
          tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
        }
      }
      var hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/, listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/, taskListRE = /^\[(x| )\](?=\s)/i, atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/, setextHeaderRE = /^ {0,3}(?:\={1,}|-{2,})\s*$/, textRE = /^[^#!\[\]*_\\<>` "'(~:]+/, fencedCodeRE = /^(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/, linkDefRE = /^\s*\[[^\]]+?\]:.*$/, punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/, expandedTab = "    ";
      function switchInline(stream, state, f) {
        state.f = state.inline = f;
        return f(stream, state);
      }
      function switchBlock(stream, state, f) {
        state.f = state.block = f;
        return f(stream, state);
      }
      function lineIsEmpty(line) {
        return !line || !/\S/.test(line.string);
      }
      function blankLine(state) {
        state.linkTitle = false;
        state.linkHref = false;
        state.linkText = false;
        state.em = false;
        state.strong = false;
        state.strikethrough = false;
        state.quote = 0;
        state.indentedCode = false;
        if (state.f == htmlBlock) {
          var exit = htmlModeMissing;
          if (!exit) {
            var inner = CodeMirror2.innerMode(htmlMode, state.htmlState);
            exit = inner.mode.name == "xml" && inner.state.tagStart === null && (!inner.state.context && inner.state.tokenize.isInText);
          }
          if (exit) {
            state.f = inlineNormal;
            state.block = blockNormal;
            state.htmlState = null;
          }
        }
        state.trailingSpace = 0;
        state.trailingSpaceNewLine = false;
        state.prevLine = state.thisLine;
        state.thisLine = { stream: null };
        return null;
      }
      function blockNormal(stream, state) {
        var firstTokenOnLine = stream.column() === state.indentation;
        var prevLineLineIsEmpty = lineIsEmpty(state.prevLine.stream);
        var prevLineIsIndentedCode = state.indentedCode;
        var prevLineIsHr = state.prevLine.hr;
        var prevLineIsList = state.list !== false;
        var maxNonCodeIndentation = (state.listStack[state.listStack.length - 1] || 0) + 3;
        state.indentedCode = false;
        var lineIndentation = state.indentation;
        if (state.indentationDiff === null) {
          state.indentationDiff = state.indentation;
          if (prevLineIsList) {
            state.list = null;
            while (lineIndentation < state.listStack[state.listStack.length - 1]) {
              state.listStack.pop();
              if (state.listStack.length) {
                state.indentation = state.listStack[state.listStack.length - 1];
              } else {
                state.list = false;
              }
            }
            if (state.list !== false) {
              state.indentationDiff = lineIndentation - state.listStack[state.listStack.length - 1];
            }
          }
        }
        var allowsInlineContinuation = !prevLineLineIsEmpty && !prevLineIsHr && !state.prevLine.header && (!prevLineIsList || !prevLineIsIndentedCode) && !state.prevLine.fencedCodeEnd;
        var isHr = (state.list === false || prevLineIsHr || prevLineLineIsEmpty) && state.indentation <= maxNonCodeIndentation && stream.match(hrRE);
        var match = null;
        if (state.indentationDiff >= 4 && (prevLineIsIndentedCode || state.prevLine.fencedCodeEnd || state.prevLine.header || prevLineLineIsEmpty)) {
          stream.skipToEnd();
          state.indentedCode = true;
          return tokenTypes.code;
        } else if (stream.eatSpace()) {
          return null;
        } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(atxHeaderRE)) && match[1].length <= 6) {
          state.quote = 0;
          state.header = match[1].length;
          state.thisLine.header = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "header";
          state.f = state.inline;
          return getType(state);
        } else if (state.indentation <= maxNonCodeIndentation && stream.eat(">")) {
          state.quote = firstTokenOnLine ? 1 : state.quote + 1;
          if (modeCfg.highlightFormatting)
            state.formatting = "quote";
          stream.eatSpace();
          return getType(state);
        } else if (!isHr && !state.setext && firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(listRE))) {
          var listType = match[1] ? "ol" : "ul";
          state.indentation = lineIndentation + stream.current().length;
          state.list = true;
          state.quote = 0;
          state.listStack.push(state.indentation);
          state.em = false;
          state.strong = false;
          state.code = false;
          state.strikethrough = false;
          if (modeCfg.taskLists && stream.match(taskListRE, false)) {
            state.taskList = true;
          }
          state.f = state.inline;
          if (modeCfg.highlightFormatting)
            state.formatting = ["list", "list-" + listType];
          return getType(state);
        } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(fencedCodeRE, true))) {
          state.quote = 0;
          state.fencedEndRE = new RegExp(match[1] + "+ *$");
          state.localMode = modeCfg.fencedCodeBlockHighlighting && getMode(match[2] || modeCfg.fencedCodeBlockDefaultMode);
          if (state.localMode)
            state.localState = CodeMirror2.startState(state.localMode);
          state.f = state.block = local;
          if (modeCfg.highlightFormatting)
            state.formatting = "code-block";
          state.code = -1;
          return getType(state);
        } else if (state.setext || (!allowsInlineContinuation || !prevLineIsList) && !state.quote && state.list === false && !state.code && !isHr && !linkDefRE.test(stream.string) && (match = stream.lookAhead(1)) && (match = match.match(setextHeaderRE))) {
          if (!state.setext) {
            state.header = match[0].charAt(0) == "=" ? 1 : 2;
            state.setext = state.header;
          } else {
            state.header = state.setext;
            state.setext = 0;
            stream.skipToEnd();
            if (modeCfg.highlightFormatting)
              state.formatting = "header";
          }
          state.thisLine.header = true;
          state.f = state.inline;
          return getType(state);
        } else if (isHr) {
          stream.skipToEnd();
          state.hr = true;
          state.thisLine.hr = true;
          return tokenTypes.hr;
        } else if (stream.peek() === "[") {
          return switchInline(stream, state, footnoteLink);
        }
        return switchInline(stream, state, state.inline);
      }
      function htmlBlock(stream, state) {
        var style = htmlMode.token(stream, state.htmlState);
        if (!htmlModeMissing) {
          var inner = CodeMirror2.innerMode(htmlMode, state.htmlState);
          if (inner.mode.name == "xml" && inner.state.tagStart === null && (!inner.state.context && inner.state.tokenize.isInText) || state.md_inside && stream.current().indexOf(">") > -1) {
            state.f = inlineNormal;
            state.block = blockNormal;
            state.htmlState = null;
          }
        }
        return style;
      }
      function local(stream, state) {
        var currListInd = state.listStack[state.listStack.length - 1] || 0;
        var hasExitedList = state.indentation < currListInd;
        var maxFencedEndInd = currListInd + 3;
        if (state.fencedEndRE && state.indentation <= maxFencedEndInd && (hasExitedList || stream.match(state.fencedEndRE))) {
          if (modeCfg.highlightFormatting)
            state.formatting = "code-block";
          var returnType;
          if (!hasExitedList)
            returnType = getType(state);
          state.localMode = state.localState = null;
          state.block = blockNormal;
          state.f = inlineNormal;
          state.fencedEndRE = null;
          state.code = 0;
          state.thisLine.fencedCodeEnd = true;
          if (hasExitedList)
            return switchBlock(stream, state, state.block);
          return returnType;
        } else if (state.localMode) {
          return state.localMode.token(stream, state.localState);
        } else {
          stream.skipToEnd();
          return tokenTypes.code;
        }
      }
      function getType(state) {
        var styles = [];
        if (state.formatting) {
          styles.push(tokenTypes.formatting);
          if (typeof state.formatting === "string")
            state.formatting = [state.formatting];
          for (var i = 0; i < state.formatting.length; i++) {
            styles.push(tokenTypes.formatting + "-" + state.formatting[i]);
            if (state.formatting[i] === "header") {
              styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
            }
            if (state.formatting[i] === "quote") {
              if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
                styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
              } else {
                styles.push("error");
              }
            }
          }
        }
        if (state.taskOpen) {
          styles.push("meta");
          return styles.length ? styles.join(" ") : null;
        }
        if (state.taskClosed) {
          styles.push("property");
          return styles.length ? styles.join(" ") : null;
        }
        if (state.linkHref) {
          styles.push(tokenTypes.linkHref, "url");
        } else {
          if (state.strong) {
            styles.push(tokenTypes.strong);
          }
          if (state.em) {
            styles.push(tokenTypes.em);
          }
          if (state.strikethrough) {
            styles.push(tokenTypes.strikethrough);
          }
          if (state.emoji) {
            styles.push(tokenTypes.emoji);
          }
          if (state.linkText) {
            styles.push(tokenTypes.linkText);
          }
          if (state.code) {
            styles.push(tokenTypes.code);
          }
          if (state.image) {
            styles.push(tokenTypes.image);
          }
          if (state.imageAltText) {
            styles.push(tokenTypes.imageAltText, "link");
          }
          if (state.imageMarker) {
            styles.push(tokenTypes.imageMarker);
          }
        }
        if (state.header) {
          styles.push(tokenTypes.header, tokenTypes.header + "-" + state.header);
        }
        if (state.quote) {
          styles.push(tokenTypes.quote);
          if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
            styles.push(tokenTypes.quote + "-" + state.quote);
          } else {
            styles.push(tokenTypes.quote + "-" + modeCfg.maxBlockquoteDepth);
          }
        }
        if (state.list !== false) {
          var listMod = (state.listStack.length - 1) % 3;
          if (!listMod) {
            styles.push(tokenTypes.list1);
          } else if (listMod === 1) {
            styles.push(tokenTypes.list2);
          } else {
            styles.push(tokenTypes.list3);
          }
        }
        if (state.trailingSpaceNewLine) {
          styles.push("trailing-space-new-line");
        } else if (state.trailingSpace) {
          styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
        }
        return styles.length ? styles.join(" ") : null;
      }
      function handleText(stream, state) {
        if (stream.match(textRE, true)) {
          return getType(state);
        }
        return void 0;
      }
      function inlineNormal(stream, state) {
        var style = state.text(stream, state);
        if (typeof style !== "undefined")
          return style;
        if (state.list) {
          state.list = null;
          return getType(state);
        }
        if (state.taskList) {
          var taskOpen = stream.match(taskListRE, true)[1] === " ";
          if (taskOpen)
            state.taskOpen = true;
          else
            state.taskClosed = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "task";
          state.taskList = false;
          return getType(state);
        }
        state.taskOpen = false;
        state.taskClosed = false;
        if (state.header && stream.match(/^#+$/, true)) {
          if (modeCfg.highlightFormatting)
            state.formatting = "header";
          return getType(state);
        }
        var ch = stream.next();
        if (state.linkTitle) {
          state.linkTitle = false;
          var matchCh = ch;
          if (ch === "(") {
            matchCh = ")";
          }
          matchCh = (matchCh + "").replace(/([.?*+^\[\]\\(){}|-])/g, "\\$1");
          var regex = "^\\s*(?:[^" + matchCh + "\\\\]+|\\\\\\\\|\\\\.)" + matchCh;
          if (stream.match(new RegExp(regex), true)) {
            return tokenTypes.linkHref;
          }
        }
        if (ch === "`") {
          var previousFormatting = state.formatting;
          if (modeCfg.highlightFormatting)
            state.formatting = "code";
          stream.eatWhile("`");
          var count = stream.current().length;
          if (state.code == 0 && (!state.quote || count == 1)) {
            state.code = count;
            return getType(state);
          } else if (count == state.code) {
            var t = getType(state);
            state.code = 0;
            return t;
          } else {
            state.formatting = previousFormatting;
            return getType(state);
          }
        } else if (state.code) {
          return getType(state);
        }
        if (ch === "\\") {
          stream.next();
          if (modeCfg.highlightFormatting) {
            var type = getType(state);
            var formattingEscape = tokenTypes.formatting + "-escape";
            return type ? type + " " + formattingEscape : formattingEscape;
          }
        }
        if (ch === "!" && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
          state.imageMarker = true;
          state.image = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "image";
          return getType(state);
        }
        if (ch === "[" && state.imageMarker && stream.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/, false)) {
          state.imageMarker = false;
          state.imageAltText = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "image";
          return getType(state);
        }
        if (ch === "]" && state.imageAltText) {
          if (modeCfg.highlightFormatting)
            state.formatting = "image";
          var type = getType(state);
          state.imageAltText = false;
          state.image = false;
          state.inline = state.f = linkHref;
          return type;
        }
        if (ch === "[" && !state.image) {
          if (state.linkText && stream.match(/^.*?\]/))
            return getType(state);
          state.linkText = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          return getType(state);
        }
        if (ch === "]" && state.linkText) {
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          var type = getType(state);
          state.linkText = false;
          state.inline = state.f = stream.match(/\(.*?\)| ?\[.*?\]/, false) ? linkHref : inlineNormal;
          return type;
        }
        if (ch === "<" && stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, false)) {
          state.f = state.inline = linkInline;
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkInline;
        }
        if (ch === "<" && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, false)) {
          state.f = state.inline = linkInline;
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkEmail;
        }
        if (modeCfg.xml && ch === "<" && stream.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>|$))/i, false)) {
          var end = stream.string.indexOf(">", stream.pos);
          if (end != -1) {
            var atts = stream.string.substring(stream.start, end);
            if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts))
              state.md_inside = true;
          }
          stream.backUp(1);
          state.htmlState = CodeMirror2.startState(htmlMode);
          return switchBlock(stream, state, htmlBlock);
        }
        if (modeCfg.xml && ch === "<" && stream.match(/^\/\w*?>/)) {
          state.md_inside = false;
          return "tag";
        } else if (ch === "*" || ch === "_") {
          var len = 1, before = stream.pos == 1 ? " " : stream.string.charAt(stream.pos - 2);
          while (len < 3 && stream.eat(ch))
            len++;
          var after = stream.peek() || " ";
          var leftFlanking = !/\s/.test(after) && (!punctuation.test(after) || /\s/.test(before) || punctuation.test(before));
          var rightFlanking = !/\s/.test(before) && (!punctuation.test(before) || /\s/.test(after) || punctuation.test(after));
          var setEm = null, setStrong = null;
          if (len % 2) {
            if (!state.em && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
              setEm = true;
            else if (state.em == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
              setEm = false;
          }
          if (len > 1) {
            if (!state.strong && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
              setStrong = true;
            else if (state.strong == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
              setStrong = false;
          }
          if (setStrong != null || setEm != null) {
            if (modeCfg.highlightFormatting)
              state.formatting = setEm == null ? "strong" : setStrong == null ? "em" : "strong em";
            if (setEm === true)
              state.em = ch;
            if (setStrong === true)
              state.strong = ch;
            var t = getType(state);
            if (setEm === false)
              state.em = false;
            if (setStrong === false)
              state.strong = false;
            return t;
          }
        } else if (ch === " ") {
          if (stream.eat("*") || stream.eat("_")) {
            if (stream.peek() === " ") {
              return getType(state);
            } else {
              stream.backUp(1);
            }
          }
        }
        if (modeCfg.strikethrough) {
          if (ch === "~" && stream.eatWhile(ch)) {
            if (state.strikethrough) {
              if (modeCfg.highlightFormatting)
                state.formatting = "strikethrough";
              var t = getType(state);
              state.strikethrough = false;
              return t;
            } else if (stream.match(/^[^\s]/, false)) {
              state.strikethrough = true;
              if (modeCfg.highlightFormatting)
                state.formatting = "strikethrough";
              return getType(state);
            }
          } else if (ch === " ") {
            if (stream.match("~~", true)) {
              if (stream.peek() === " ") {
                return getType(state);
              } else {
                stream.backUp(2);
              }
            }
          }
        }
        if (modeCfg.emoji && ch === ":" && stream.match(/^(?:[a-z_\d+][a-z_\d+-]*|\-[a-z_\d+][a-z_\d+-]*):/)) {
          state.emoji = true;
          if (modeCfg.highlightFormatting)
            state.formatting = "emoji";
          var retType = getType(state);
          state.emoji = false;
          return retType;
        }
        if (ch === " ") {
          if (stream.match(/^ +$/, false)) {
            state.trailingSpace++;
          } else if (state.trailingSpace) {
            state.trailingSpaceNewLine = true;
          }
        }
        return getType(state);
      }
      function linkInline(stream, state) {
        var ch = stream.next();
        if (ch === ">") {
          state.f = state.inline = inlineNormal;
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkInline;
        }
        stream.match(/^[^>]+/, true);
        return tokenTypes.linkInline;
      }
      function linkHref(stream, state) {
        if (stream.eatSpace()) {
          return null;
        }
        var ch = stream.next();
        if (ch === "(" || ch === "[") {
          state.f = state.inline = getLinkHrefInside(ch === "(" ? ")" : "]");
          if (modeCfg.highlightFormatting)
            state.formatting = "link-string";
          state.linkHref = true;
          return getType(state);
        }
        return "error";
      }
      var linkRE = {
        ")": /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\))/,
        "]": /^(?:[^\\\[\]]|\\.|\[(?:[^\\\[\]]|\\.)*\])*?(?=\])/
      };
      function getLinkHrefInside(endChar) {
        return function(stream, state) {
          var ch = stream.next();
          if (ch === endChar) {
            state.f = state.inline = inlineNormal;
            if (modeCfg.highlightFormatting)
              state.formatting = "link-string";
            var returnState = getType(state);
            state.linkHref = false;
            return returnState;
          }
          stream.match(linkRE[endChar]);
          state.linkHref = true;
          return getType(state);
        };
      }
      function footnoteLink(stream, state) {
        if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
          state.f = footnoteLinkInside;
          stream.next();
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          state.linkText = true;
          return getType(state);
        }
        return switchInline(stream, state, inlineNormal);
      }
      function footnoteLinkInside(stream, state) {
        if (stream.match("]:", true)) {
          state.f = state.inline = footnoteUrl;
          if (modeCfg.highlightFormatting)
            state.formatting = "link";
          var returnType = getType(state);
          state.linkText = false;
          return returnType;
        }
        stream.match(/^([^\]\\]|\\.)+/, true);
        return tokenTypes.linkText;
      }
      function footnoteUrl(stream, state) {
        if (stream.eatSpace()) {
          return null;
        }
        stream.match(/^[^\s]+/, true);
        if (stream.peek() === void 0) {
          state.linkTitle = true;
        } else {
          stream.match(/^(?:\s+(?:"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+'|\((?:[^)\\]|\\.)+\)))?/, true);
        }
        state.f = state.inline = inlineNormal;
        return tokenTypes.linkHref + " url";
      }
      var mode = {
        startState: function() {
          return {
            f: blockNormal,
            prevLine: { stream: null },
            thisLine: { stream: null },
            block: blockNormal,
            htmlState: null,
            indentation: 0,
            inline: inlineNormal,
            text: handleText,
            formatting: false,
            linkText: false,
            linkHref: false,
            linkTitle: false,
            code: 0,
            em: false,
            strong: false,
            header: 0,
            setext: 0,
            hr: false,
            taskList: false,
            list: false,
            listStack: [],
            quote: 0,
            trailingSpace: 0,
            trailingSpaceNewLine: false,
            strikethrough: false,
            emoji: false,
            fencedEndRE: null
          };
        },
        copyState: function(s) {
          return {
            f: s.f,
            prevLine: s.prevLine,
            thisLine: s.thisLine,
            block: s.block,
            htmlState: s.htmlState && CodeMirror2.copyState(htmlMode, s.htmlState),
            indentation: s.indentation,
            localMode: s.localMode,
            localState: s.localMode ? CodeMirror2.copyState(s.localMode, s.localState) : null,
            inline: s.inline,
            text: s.text,
            formatting: false,
            linkText: s.linkText,
            linkTitle: s.linkTitle,
            linkHref: s.linkHref,
            code: s.code,
            em: s.em,
            strong: s.strong,
            strikethrough: s.strikethrough,
            emoji: s.emoji,
            header: s.header,
            setext: s.setext,
            hr: s.hr,
            taskList: s.taskList,
            list: s.list,
            listStack: s.listStack.slice(0),
            quote: s.quote,
            indentedCode: s.indentedCode,
            trailingSpace: s.trailingSpace,
            trailingSpaceNewLine: s.trailingSpaceNewLine,
            md_inside: s.md_inside,
            fencedEndRE: s.fencedEndRE
          };
        },
        token: function(stream, state) {
          state.formatting = false;
          if (stream != state.thisLine.stream) {
            state.header = 0;
            state.hr = false;
            if (stream.match(/^\s*$/, true)) {
              blankLine(state);
              return null;
            }
            state.prevLine = state.thisLine;
            state.thisLine = { stream };
            state.taskList = false;
            state.trailingSpace = 0;
            state.trailingSpaceNewLine = false;
            if (!state.localState) {
              state.f = state.block;
              if (state.f != htmlBlock) {
                var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, expandedTab).length;
                state.indentation = indentation;
                state.indentationDiff = null;
                if (indentation > 0)
                  return null;
              }
            }
          }
          return state.f(stream, state);
        },
        innerMode: function(state) {
          if (state.block == htmlBlock)
            return { state: state.htmlState, mode: htmlMode };
          if (state.localState)
            return { state: state.localState, mode: state.localMode };
          return { state, mode };
        },
        indent: function(state, textAfter, line) {
          if (state.block == htmlBlock && htmlMode.indent)
            return htmlMode.indent(state.htmlState, textAfter, line);
          if (state.localState && state.localMode.indent)
            return state.localMode.indent(state.localState, textAfter, line);
          return CodeMirror2.Pass;
        },
        blankLine,
        getType,
        blockCommentStart: "<!--",
        blockCommentEnd: "-->",
        closeBrackets: "()[]{}''\"\"``",
        fold: "markdown"
      };
      return mode;
    }, "xml");
    CodeMirror2.defineMIME("text/markdown", "markdown");
    CodeMirror2.defineMIME("text/x-markdown", "markdown");
  });
})();
var overlay = { exports: {} };
(function(module, exports) {
  (function(mod) {
    mod(codemirror.exports);
  })(function(CodeMirror2) {
    CodeMirror2.overlayMode = function(base, overlay2, combine) {
      return {
        startState: function() {
          return {
            base: CodeMirror2.startState(base),
            overlay: CodeMirror2.startState(overlay2),
            basePos: 0,
            baseCur: null,
            overlayPos: 0,
            overlayCur: null,
            streamSeen: null
          };
        },
        copyState: function(state) {
          return {
            base: CodeMirror2.copyState(base, state.base),
            overlay: CodeMirror2.copyState(overlay2, state.overlay),
            basePos: state.basePos,
            baseCur: null,
            overlayPos: state.overlayPos,
            overlayCur: null
          };
        },
        token: function(stream, state) {
          if (stream != state.streamSeen || Math.min(state.basePos, state.overlayPos) < stream.start) {
            state.streamSeen = stream;
            state.basePos = state.overlayPos = stream.start;
          }
          if (stream.start == state.basePos) {
            state.baseCur = base.token(stream, state.base);
            state.basePos = stream.pos;
          }
          if (stream.start == state.overlayPos) {
            stream.pos = stream.start;
            state.overlayCur = overlay2.token(stream, state.overlay);
            state.overlayPos = stream.pos;
          }
          stream.pos = Math.min(state.basePos, state.overlayPos);
          if (state.overlayCur == null)
            return state.baseCur;
          else if (state.baseCur != null && state.overlay.combineTokens || combine && state.overlay.combineTokens == null)
            return state.baseCur + " " + state.overlayCur;
          else
            return state.overlayCur;
        },
        indent: base.indent && function(state, textAfter, line) {
          return base.indent(state.base, textAfter, line);
        },
        electricChars: base.electricChars,
        innerMode: function(state) {
          return { state: state.base, mode: base };
        },
        blankLine: function(state) {
          var baseToken, overlayToken;
          if (base.blankLine)
            baseToken = base.blankLine(state.base);
          if (overlay2.blankLine)
            overlayToken = overlay2.blankLine(state.overlay);
          return overlayToken == null ? baseToken : combine && baseToken != null ? baseToken + " " + overlayToken : overlayToken;
        }
      };
    };
  });
})();
(function(module, exports) {
  (function(mod) {
    mod(codemirror.exports, markdown.exports, overlay.exports);
  })(function(CodeMirror2) {
    var urlRE = /^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i;
    CodeMirror2.defineMode("gfm", function(config, modeConfig) {
      var codeDepth = 0;
      function blankLine(state) {
        state.code = false;
        return null;
      }
      var gfmOverlay = {
        startState: function() {
          return {
            code: false,
            codeBlock: false,
            ateSpace: false
          };
        },
        copyState: function(s) {
          return {
            code: s.code,
            codeBlock: s.codeBlock,
            ateSpace: s.ateSpace
          };
        },
        token: function(stream, state) {
          state.combineTokens = null;
          if (state.codeBlock) {
            if (stream.match(/^```+/)) {
              state.codeBlock = false;
              return null;
            }
            stream.skipToEnd();
            return null;
          }
          if (stream.sol()) {
            state.code = false;
          }
          if (stream.sol() && stream.match(/^```+/)) {
            stream.skipToEnd();
            state.codeBlock = true;
            return null;
          }
          if (stream.peek() === "`") {
            stream.next();
            var before = stream.pos;
            stream.eatWhile("`");
            var difference = 1 + stream.pos - before;
            if (!state.code) {
              codeDepth = difference;
              state.code = true;
            } else {
              if (difference === codeDepth) {
                state.code = false;
              }
            }
            return null;
          } else if (state.code) {
            stream.next();
            return null;
          }
          if (stream.eatSpace()) {
            state.ateSpace = true;
            return null;
          }
          if (stream.sol() || state.ateSpace) {
            state.ateSpace = false;
            if (modeConfig.gitHubSpice !== false) {
              if (stream.match(/^(?:[a-zA-Z0-9\-_]+\/)?(?:[a-zA-Z0-9\-_]+@)?(?=.{0,6}\d)(?:[a-f0-9]{7,40}\b)/)) {
                state.combineTokens = true;
                return "link";
              } else if (stream.match(/^(?:[a-zA-Z0-9\-_]+\/)?(?:[a-zA-Z0-9\-_]+)?#[0-9]+\b/)) {
                state.combineTokens = true;
                return "link";
              }
            }
          }
          if (stream.match(urlRE) && stream.string.slice(stream.start - 2, stream.start) != "](" && (stream.start == 0 || /\W/.test(stream.string.charAt(stream.start - 1)))) {
            state.combineTokens = true;
            return "link";
          }
          stream.next();
          return null;
        },
        blankLine
      };
      var markdownConfig = {
        taskLists: true,
        strikethrough: true,
        emoji: true
      };
      for (var attr2 in modeConfig) {
        markdownConfig[attr2] = modeConfig[attr2];
      }
      markdownConfig.name = "markdown";
      return CodeMirror2.overlayMode(CodeMirror2.getMode(config, markdownConfig), gfmOverlay);
    }, "markdown");
    CodeMirror2.defineMIME("text/x-gfm", "gfm");
  });
})();
function create_fragment$1(ctx) {
  let textarea_1;
  return {
    c() {
      textarea_1 = element("textarea");
    },
    m(target, anchor) {
      insert(target, textarea_1, anchor);
      ctx[3](textarea_1);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(textarea_1);
      ctx[3](null);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let { config = {} } = $$props;
  let { accessEditor = void 0 } = $$props;
  let textarea;
  let editor;
  onMount(() => {
    editor = CodeMirror.fromTextArea(textarea, config);
    if (accessEditor) {
      accessEditor(editor);
    }
  });
  onDestroy(() => {
    editor.toTextArea();
  });
  function textarea_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      textarea = $$value;
      $$invalidate(0, textarea);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("config" in $$props2)
      $$invalidate(1, config = $$props2.config);
    if ("accessEditor" in $$props2)
      $$invalidate(2, accessEditor = $$props2.accessEditor);
  };
  return [textarea, config, accessEditor, textarea_1_binding];
}
class CodeMirror_1 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, { config: 1, accessEditor: 2 });
  }
}
function create_fragment(ctx) {
  let editor;
  let current;
  editor = new CodeMirror_1({
    props: {
      config: ctx[0],
      accessEditor: ctx[1]
    }
  });
  return {
    c() {
      create_component(editor.$$.fragment);
    },
    m(target, anchor) {
      mount_component(editor, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(editor.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(editor.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(editor, detaching);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { theme = "default" } = $$props;
  let { onChange = void 0 } = $$props;
  let { initialValue = "" } = $$props;
  const config = {
    lineNumbers: true,
    lineWrapping: true,
    theme,
    mode: { name: "gfm", highlightFormatting: true }
  };
  const accessEditor = (editor) => {
    editor.setSize("100%", "100%");
    editor.on("change", (e) => {
      if (onChange) {
        onChange(e.getValue());
      }
    });
    editor.setValue(initialValue);
  };
  $$self.$$set = ($$props2) => {
    if ("theme" in $$props2)
      $$invalidate(2, theme = $$props2.theme);
    if ("onChange" in $$props2)
      $$invalidate(3, onChange = $$props2.onChange);
    if ("initialValue" in $$props2)
      $$invalidate(4, initialValue = $$props2.initialValue);
  };
  return [config, accessEditor, theme, onChange, initialValue];
}
class Editor_1 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, { theme: 2, onChange: 3, initialValue: 4 });
  }
}
export { update_keyed_each as $, space as A, text as B, Card as C, listen as D, group_outros as E, check_outros as F, set_data as G, set_style as H, destroy_each as I, toggle_class as J, onMount as K, Editor_1 as L, empty as M, Dialog as N, Col as O, ProgressCircular as P, binding_callbacks as Q, Row as R, StatusCodes as S, TextField as T, bind as U, add_flush_callback as V, Checkbox as W, Tags as X, Button as Y, action_destroyer as Z, run_all as _, SvelteComponent as a, outro_and_destroy_block as a0, bubble as a1, List as a2, ListItem as a3, NavigationDrawer as a4, Overlay as a5, get_spread_object as a6, component_subscribe as a7, AppBar as a8, push as a9, Icon as aa, mdiMagnify as ab, mdiNotePlusOutline as ac, mdiGithub as ad, mdiMenu as ae, prevent_default as af, querystring as ag, replace as ah, MaterialApp as ai, Router as aj, Footer as ak, assign as b, svg_element as c, attr as d, set_svg_attributes as e, insert as f, get_store_value as g, append as h, init as i, get_spread_update as j, detach as k, exclude_internal_props as l, marked as m, noop as n, element as o, create_component as p, mount_component as q, transition_out as r, safe_not_equal as s, transition_in as t, destroy_component as u, createEventDispatcher as v, writable as w, CardTitle as x, CardText as y, CardActions as z };
